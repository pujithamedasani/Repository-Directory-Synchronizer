"""
File Monitor Service — watchdog-based real-time directory monitoring.

OS Concept: Event-Based Monitoring — the OS kernel (inotify on Linux,
FSEvents on macOS, ReadDirectoryChangesW on Windows) emits file-system
events that watchdog surfaces as a uniform Python API, eliminating the
need for expensive polling loops.
"""
import os
import threading
from datetime import datetime
from typing import Dict, List
from pathlib import Path

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from app.database.database import SessionLocal
from app.database import models
from app.utils.path_validator import normalize_path

# Active watchdog observers keyed by normalized directory string
_active_observers: Dict[str, Observer] = {}


class SyncSphereHandler(FileSystemEventHandler):
    """Translate watchdog events into DB records + WebSocket broadcasts."""

    def __init__(self, directory: str, ws_manager, db_session_factory):
        super().__init__()
        self.directory = normalize_path(directory)
        self.ws_manager = ws_manager
        self.db_session_factory = db_session_factory

    def _save_event(self, event_type: str, file_path: str):
        normalized_file = normalize_path(file_path)
        db = self.db_session_factory()
        try:
            ev = models.MonitorEvent(
                directory=self.directory,
                event_type=event_type,
                file_path=normalized_file,
            )
            db.add(ev)
            db.commit()
        except Exception:
            pass
        finally:
            db.close()

        if self.ws_manager:
            payload = {
                "directory": self.directory,
                "event_type": event_type,
                "file_path": normalized_file,
                "timestamp": datetime.utcnow().isoformat(),
            }
            try:
                self.ws_manager.broadcast_monitoring_event_threadsafe(payload)
            except Exception:
                pass

    def on_created(self, event):
        if not event.is_directory:
            self._save_event("created", event.src_path)

    def on_modified(self, event):
        if not event.is_directory:
            self._save_event("modified", event.src_path)

    def on_deleted(self, event):
        if not event.is_directory:
            self._save_event("deleted", event.src_path)

    def on_moved(self, event):
        if not event.is_directory:
            self._save_event("moved", f"{normalize_path(event.src_path)} -> {normalize_path(event.dest_path)}")


def start_monitoring(directory: str, ws_manager, db_session_factory) -> bool:
    """Start a watchdog Observer on *directory*. Returns False if already active."""
    norm_dir = normalize_path(directory)
    if norm_dir in _active_observers:
        return False
    handler = SyncSphereHandler(norm_dir, ws_manager, db_session_factory)
    observer = Observer()
    observer.schedule(handler, str(Path(directory)), recursive=True)
    observer.start()
    _active_observers[norm_dir] = observer
    return True


def stop_monitoring(directory: str) -> bool:
    """Stop the observer for *directory*. Returns False if not active."""
    norm_dir = normalize_path(directory)
    observer = _active_observers.pop(norm_dir, None)
    if observer is None:
        # fallback search
        for k in list(_active_observers.keys()):
            if k.lower() == norm_dir.lower():
                observer = _active_observers.pop(k)
                break
    if observer is None:
        return False
    try:
        observer.stop()
        observer.join(timeout=2.0)
    except Exception:
        pass
    return True


def stop_all_monitoring():
    """Stop all active observers."""
    for directory in list(_active_observers.keys()):
        stop_monitoring(directory)


def get_active_monitors() -> List[dict]:
    return [
        {"directory": d, "alive": obs.is_alive()}
        for d, obs in _active_observers.items()
    ]


def get_recent_events(directory: str, limit: int, db) -> List[dict]:
    """Return the most recent *limit* events for *directory* from the DB."""
    q = db.query(models.MonitorEvent)
    if directory:
        norm_dir = normalize_path(directory)
        q = q.filter(
            (models.MonitorEvent.directory == norm_dir)
            | (models.MonitorEvent.directory == directory)
            | (models.MonitorEvent.directory.ilike(f"%{Path(directory).name}%"))
        )
    rows = q.order_by(models.MonitorEvent.timestamp.desc()).limit(limit).all()
    return [
        {
            "id": r.id,
            "directory": r.directory,
            "event_type": r.event_type,
            "file_path": r.file_path,
            "timestamp": r.timestamp.isoformat() if r.timestamp else None,
        }
        for r in rows
    ]
