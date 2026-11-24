"""
Synchronization Engine Service.

OS Concept: File Synchronization — shutil.copy2 is used for atomic-style file
copies that preserve metadata (mtime, permissions).  os.makedirs ensures
intermediate directories exist before the copy, mirroring how OSes handle
hierarchical namespace creation.
"""
import os
import shutil
import threading
from dataclasses import dataclass, field
from datetime import datetime
from pathlib import Path
from typing import Optional, List

from app.services.comparison_engine import compare_directories, ComparisonResult
from app.services.conflict_manager import detect_conflicts, get_conflicts
from app.database.database import SessionLocal
from app.database import models

# ---- Global sync state -------------------------------------------------- #
_active_sync: Optional[dict] = None
_cancel_requested: bool = False
_sync_lock = threading.Lock()


@dataclass
class SyncOptions:
    mode: str = "one_way"               # "one_way" | "two_way"
    dry_run: bool = False
    delete_extra: bool = False
    preserve_timestamps: bool = True
    include_hidden: bool = False
    selective_files: Optional[List[str]] = None  # None = all files


# ---- Internal helpers ---------------------------------------------------- #

def _update_session(session_id: int, **kwargs):
    db = SessionLocal()
    try:
        sess = db.query(models.SyncSession).filter(models.SyncSession.id == session_id).first()
        if sess:
            for k, v in kwargs.items():
                setattr(sess, k, v)
            db.commit()
    except Exception:
        pass
    finally:
        db.close()


def _log_operation(session_id: int, file_path: str, op_type: str,
                   file_size: int = 0, status: str = "success", error: str = None):
    db = SessionLocal()
    try:
        op = models.FileOperation(
            session_id=session_id,
            file_path=file_path,
            operation_type=op_type,
            file_size=file_size,
            status=status,
            error=error,
        )
        db.add(op)
        db.commit()
    except Exception:
        pass
    finally:
        db.close()


# ---- Core sync logic ----------------------------------------------------- #

def sync_one_way(source: str, dest: str, options: SyncOptions,
                 session_id: int, ws_manager=None):
    """
    Synchronise source -> dest (Mirror).
    Runs in a background thread. Progress is broadcast via ws_manager.
    """
    global _cancel_requested, _active_sync

    cmp_opts = {
        "use_checksum": True,
        "include_hidden": options.include_hidden,
    }
    comparison: ComparisonResult = compare_directories(source, dest, cmp_opts)

    all_files = comparison.new_files + comparison.modified_files
    if options.selective_files:
        all_files = [f for f in all_files if f.relative_path in options.selective_files]

    total = len(all_files) + (len(comparison.deleted_files) if options.delete_extra else 0)
    done = 0
    copied = updated = deleted = skipped = bytes_xfer = 0

    def _broadcast(msg: dict):
        if ws_manager:
            ws_manager.broadcast_sync_progress_threadsafe(msg)

    _update_session(session_id, status="running")

    for fc in all_files:
        if _cancel_requested:
            break

        src_path = Path(source) / fc.relative_path
        dst_path = Path(dest) / fc.relative_path

        if not options.dry_run:
            try:
                dst_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(str(src_path), str(dst_path))
                size = fc.source_size or (src_path.stat().st_size if src_path.exists() else 0)
                bytes_xfer += size
                if fc.status == "new":
                    copied += 1
                    _log_operation(session_id, fc.relative_path, "copy", size)
                else:
                    updated += 1
                    _log_operation(session_id, fc.relative_path, "update", size)
            except Exception as exc:
                skipped += 1
                _log_operation(session_id, fc.relative_path, "skip", 0, "error", str(exc))
        else:
            if fc.status == "new":
                copied += 1
            else:
                updated += 1

        done += 1
        with _sync_lock:
            if _active_sync:
                _active_sync.update({
                    "files_done": done,
                    "total_files": total,
                    "files_copied": copied,
                    "files_updated": updated,
                })
        _broadcast({
            "session_id": session_id,
            "files_done": done,
            "total_files": total,
            "current_file": fc.relative_path,
            "percent": int(done / max(total, 1) * 100),
            "bytes_done": bytes_xfer,
        })

    # Delete extra dest files if requested
    if options.delete_extra and not _cancel_requested:
        for fc in comparison.deleted_files:
            if _cancel_requested:
                break
            dst_path = Path(dest) / fc.relative_path
            if not options.dry_run:
                try:
                    if dst_path.is_dir():
                        shutil.rmtree(str(dst_path))
                    elif dst_path.exists():
                        os.remove(str(dst_path))
                    deleted += 1
                    _log_operation(session_id, fc.relative_path, "delete")
                except Exception as exc:
                    skipped += 1
                    _log_operation(session_id, fc.relative_path, "skip", 0, "error", str(exc))
            else:
                deleted += 1
            done += 1
            _broadcast({
                "session_id": session_id,
                "files_done": done,
                "total_files": total,
                "current_file": fc.relative_path,
                "percent": int(done / max(total, 1) * 100),
                "bytes_done": bytes_xfer,
            })

    final_status = "cancelled" if _cancel_requested else "completed"
    _update_session(
        session_id,
        status=final_status,
        end_time=datetime.utcnow(),
        files_copied=copied,
        files_updated=updated,
        files_deleted=deleted,
        files_skipped=skipped,
        bytes_transferred=bytes_xfer,
    )
    _broadcast({"session_id": session_id, "status": final_status, "percent": 100, "type": "completed"})

    with _sync_lock:
        _active_sync = None


def sync_two_way(source: str, dest: str, options: SyncOptions,
                 session_id: int, ws_manager=None):
    """
    Synchronise source <-> dest (Bidirectional).
    - New files in source are copied to dest.
    - Files present only in dest are copied to source.
    - Modified files are resolved via conflict manager resolution or latest mtime.
    """
    global _cancel_requested, _active_sync

    cmp_opts = {
        "use_checksum": True,
        "include_hidden": options.include_hidden,
    }
    comparison: ComparisonResult = compare_directories(source, dest, cmp_opts)
    detect_conflicts(comparison)
    conflict_map = {c.relative_path: c.resolution for c in get_conflicts()}

    # Items to process
    src_to_dest = comparison.new_files
    dest_to_source = comparison.deleted_files  # In two-way sync, "deleted" in source means present in dest only!
    modified = comparison.modified_files

    if options.selective_files:
        src_to_dest = [f for f in src_to_dest if f.relative_path in options.selective_files]
        dest_to_source = [f for f in dest_to_source if f.relative_path in options.selective_files]
        modified = [f for f in modified if f.relative_path in options.selective_files]

    total = len(src_to_dest) + len(dest_to_source) + len(modified)
    done = 0
    copied = updated = deleted = skipped = bytes_xfer = 0

    def _broadcast(msg: dict):
        if ws_manager:
            ws_manager.broadcast_sync_progress_threadsafe(msg)

    _update_session(session_id, status="running")

    # 1. Copy new source files -> destination
    for fc in src_to_dest:
        if _cancel_requested:
            break
        src_path = Path(source) / fc.relative_path
        dst_path = Path(dest) / fc.relative_path

        if not options.dry_run:
            try:
                dst_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(str(src_path), str(dst_path))
                size = fc.source_size or (src_path.stat().st_size if src_path.exists() else 0)
                bytes_xfer += size
                copied += 1
                _log_operation(session_id, fc.relative_path, "copy (source->dest)", size)
            except Exception as exc:
                skipped += 1
                _log_operation(session_id, fc.relative_path, "skip", 0, "error", str(exc))
        else:
            copied += 1

        done += 1
        _broadcast({
            "session_id": session_id,
            "files_done": done,
            "total_files": total,
            "current_file": f"{fc.relative_path} (-> dest)",
            "percent": int(done / max(total, 1) * 100),
            "bytes_done": bytes_xfer,
        })

    # 2. Copy dest-only files -> source (Bidirectional propagation)
    for fc in dest_to_source:
        if _cancel_requested:
            break
        dst_path = Path(dest) / fc.relative_path
        src_path = Path(source) / fc.relative_path

        if not options.dry_run:
            try:
                src_path.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(str(dst_path), str(src_path))
                size = fc.dest_size or (dst_path.stat().st_size if dst_path.exists() else 0)
                bytes_xfer += size
                copied += 1
                _log_operation(session_id, fc.relative_path, "copy (dest->source)", size)
            except Exception as exc:
                skipped += 1
                _log_operation(session_id, fc.relative_path, "skip", 0, "error", str(exc))
        else:
            copied += 1

        done += 1
        _broadcast({
            "session_id": session_id,
            "files_done": done,
            "total_files": total,
            "current_file": f"{fc.relative_path} (-> source)",
            "percent": int(done / max(total, 1) * 100),
            "bytes_done": bytes_xfer,
        })

    # 3. Handle modified files with conflict resolution / timestamp comparison
    for fc in modified:
        if _cancel_requested:
            break
        src_path = Path(source) / fc.relative_path
        dst_path = Path(dest) / fc.relative_path

        resolution = conflict_map.get(fc.relative_path)

        if not options.dry_run:
            try:
                # Check user explicit choice or fall back to newer timestamp
                copy_direction = None
                if resolution in ("source", "keep_source"):
                    copy_direction = "src_to_dst"
                elif resolution in ("dest", "keep_dest"):
                    copy_direction = "dst_to_src"
                elif resolution == "skip":
                    copy_direction = None
                else:
                    # Automatic timestamp resolution: newer file wins
                    src_m = src_path.stat().st_mtime if src_path.exists() else 0
                    dst_m = dst_path.stat().st_mtime if dst_path.exists() else 0
                    if src_m >= dst_m:
                        copy_direction = "src_to_dst"
                    else:
                        copy_direction = "dst_to_src"

                if copy_direction == "src_to_dst":
                    shutil.copy2(str(src_path), str(dst_path))
                    size = src_path.stat().st_size
                    bytes_xfer += size
                    updated += 1
                    _log_operation(session_id, fc.relative_path, "update (source->dest)", size)
                elif copy_direction == "dst_to_src":
                    shutil.copy2(str(dst_path), str(src_path))
                    size = dst_path.stat().st_size
                    bytes_xfer += size
                    updated += 1
                    _log_operation(session_id, fc.relative_path, "update (dest->source)", size)
                else:
                    skipped += 1
                    _log_operation(session_id, fc.relative_path, "skip", 0)
            except Exception as exc:
                skipped += 1
                _log_operation(session_id, fc.relative_path, "skip", 0, "error", str(exc))
        else:
            updated += 1

        done += 1
        _broadcast({
            "session_id": session_id,
            "files_done": done,
            "total_files": total,
            "current_file": f"{fc.relative_path} (conflict resolved)",
            "percent": int(done / max(total, 1) * 100),
            "bytes_done": bytes_xfer,
        })

    final_status = "cancelled" if _cancel_requested else "completed"
    _update_session(
        session_id,
        status=final_status,
        end_time=datetime.utcnow(),
        files_copied=copied,
        files_updated=updated,
        files_deleted=deleted,
        files_skipped=skipped,
        bytes_transferred=bytes_xfer,
    )
    _broadcast({"session_id": session_id, "status": final_status, "percent": 100, "type": "completed"})

    with _sync_lock:
        _active_sync = None


# ---- Public API ---------------------------------------------------------- #

def start_sync(source: str, dest: str, options: SyncOptions, db) -> int:
    """Create a DB session record, spawn background thread, return session_id."""
    global _active_sync, _cancel_requested

    db_session = models.SyncSession(
        source_dir=source,
        dest_dir=dest,
        status="pending",
        sync_mode=options.mode,
    )
    db.add(db_session)
    db.commit()
    db.refresh(db_session)
    session_id = db_session.id

    _cancel_requested = False
    with _sync_lock:
        _active_sync = {
            "session_id": session_id,
            "source": source,
            "dest": dest,
            "mode": options.mode,
            "dry_run": options.dry_run,
            "files_done": 0,
            "total_files": 0,
            "status": "running",
        }

    from app.websocket.progress_manager import ws_manager

    target_func = sync_two_way if options.mode == "two_way" else sync_one_way

    thread = threading.Thread(
        target=target_func,
        args=(source, dest, options, session_id, ws_manager),
        daemon=True,
    )
    thread.start()
    return session_id


def cancel_sync():
    """Request cancellation of the active sync."""
    global _cancel_requested
    _cancel_requested = True


def get_sync_status() -> dict:
    """Return a snapshot of the current sync state."""
    global _active_sync, _cancel_requested
    with _sync_lock:
        if _active_sync is None:
            return {"active": False, "cancel_requested": _cancel_requested}
        return {"active": True, "cancel_requested": _cancel_requested, **_active_sync}
