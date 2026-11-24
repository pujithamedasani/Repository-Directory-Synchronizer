"""
API — Synchronization execution.
"""
from typing import Optional, List

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.synchronization_engine import (
    SyncOptions, start_sync, cancel_sync, get_sync_status,
)
from app.services.comparison_engine import compare_directories
from app.services.conflict_manager import get_conflicts, resolve_conflict, detect_conflicts

router = APIRouter()


def _state():
    from app.main import app_state
    return app_state


class SyncRequest(BaseModel):
    mode: str = "one_way"
    sync_mode: Optional[str] = None
    source_dir: Optional[str] = None
    dest_dir: Optional[str] = None
    dry_run: bool = False
    delete_extra: bool = False
    delete_orphans: bool = False
    preserve_timestamps: bool = True
    include_hidden: bool = False
    selective_files: Optional[List[str]] = None


class ResolveConflictBody(BaseModel):
    file_path: str
    resolution: str  # "source" | "dest" | "keep_source" | "keep_dest" | "both" | "skip"


@router.post("/start")
def start(body: SyncRequest, db: Session = Depends(get_db)):
    state = _state()
    source = body.source_dir or state.source_dir
    dest = body.dest_dir or state.dest_dir

    if not source or not dest:
        raise HTTPException(status_code=400, detail="Source and destination directories must be selected.")

    state.source_dir = source
    state.dest_dir = dest

    if get_sync_status().get("active"):
        raise HTTPException(status_code=409, detail="A sync operation is already running.")

    mode = body.sync_mode or body.mode or "one_way"
    delete_extra = body.delete_extra or body.delete_orphans

    opts = SyncOptions(
        mode=mode,
        dry_run=body.dry_run,
        delete_extra=delete_extra,
        preserve_timestamps=body.preserve_timestamps,
        include_hidden=body.include_hidden,
        selective_files=body.selective_files,
    )
    session_id = start_sync(source, dest, opts, db)
    return {"session_id": session_id, "status": "started", "sync_mode": mode}


@router.post("/cancel")
def cancel():
    cancel_sync()
    return {"message": "Cancellation requested."}


@router.get("/status")
def status():
    return get_sync_status()


@router.post("/preview")
def preview(body: SyncRequest, db: Session = Depends(get_db)):
    state = _state()
    source = body.source_dir or state.source_dir
    dest = body.dest_dir or state.dest_dir

    if not source or not dest:
        raise HTTPException(status_code=400, detail="Source and destination directories must be selected.")

    state.source_dir = source
    state.dest_dir = dest
    mode = body.sync_mode or body.mode or "one_way"

    result = compare_directories(
        source,
        dest,
        {"use_checksum": True, "include_hidden": body.include_hidden},
    )
    detect_conflicts(result)

    if mode == "two_way":
        return {
            "dry_run": True,
            "mode": "two_way",
            "files_to_copy": len(result.new_files) + len(result.deleted_files),
            "files_to_update": len(result.modified_files),
            "files_to_delete": 0,
            "files_to_skip": len(result.unchanged_files),
            "source_to_dest_count": len(result.new_files),
            "dest_to_source_count": len(result.deleted_files),
            "conflict_count": len(result.modified_files),
            "new_files": [f.relative_path for f in result.new_files],
            "modified_files": [f.relative_path for f in result.modified_files],
            "deleted_files": [f.relative_path for f in result.deleted_files],
        }

    delete_extra = body.delete_extra or body.delete_orphans
    return {
        "dry_run": True,
        "mode": "one_way",
        "files_to_copy": len(result.new_files),
        "files_to_update": len(result.modified_files),
        "files_to_delete": len(result.deleted_files) if delete_extra else 0,
        "files_to_skip": len(result.unchanged_files),
        "new_files": [f.relative_path for f in result.new_files],
        "modified_files": [f.relative_path for f in result.modified_files],
        "deleted_files": [f.relative_path for f in result.deleted_files] if delete_extra else [],
    }


@router.get("/conflicts")
def conflicts():
    return [
        {
            "relative_path": c.relative_path,
            "source_mtime": c.source_mtime,
            "dest_mtime": c.dest_mtime,
            "source_size": c.source_size,
            "dest_size": c.dest_size,
            "resolution": c.resolution,
        }
        for c in get_conflicts()
    ]


@router.post("/resolve-conflict")
def resolve(body: ResolveConflictBody):
    valid_resolutions = ("source", "dest", "keep_source", "keep_dest", "both", "skip")
    if body.resolution not in valid_resolutions:
        raise HTTPException(status_code=400, detail="Invalid resolution value.")
    ok = resolve_conflict(body.file_path, body.resolution)
    if not ok:
        raise HTTPException(status_code=404, detail="Conflict not found.")
    return {"resolved": True}
