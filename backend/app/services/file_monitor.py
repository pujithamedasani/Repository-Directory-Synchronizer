"""
File Monitor Service — watchdog-based real-time directory monitoring.

OS Concept: Event-Based Monitoring — the OS kernel (inotify on Linux,
FSEvents on macOS, ReadDirectoryChangesW on Windows) emits file-system
events that watchdog surfaces as a uniform Python API, eliminating the
need for expensive polling loops.
"""
import asyncio
import threading
from datetime import datetime
from typing import Dict, List

from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler

from app.database.database import SessionLocal
from app.database import models

# Active watchdog observers keyed by directory string
_active_observers: Dict[str, Observer] = {}


class SyncSphereHandler(FileSystemEventHandler):
    """Translate watchdog events into DB records + WebSocket broadcasts."""

    def __init__(self, directory: str, ws_manager, db_session_factory):
        super().__init__()
        self.directory = directory
        self.ws_manager = ws_manager
        self.db_session_factory = db_session_factory

    def _save_event(self, event_type: str, file_path: str):
        db = self.db_session_factory()
        try:
            ev = models.MonitorEvent(
                directory=self.directory,
                event_type=event_type,
                file_path=file_path,
            )
            db.add(ev)
            db.commit()
        finally:
            db.close()

        if self.ws_manager:
            payload = {
                "directory": self.directory,
                "event_type": event_type,
                "file_path": file_path,
                "timestamp": datetime.utcnow().isoformat(),
            }
            try:
                loop = asyncio.new_event_loop()
                loop.run_until_complete(self.ws_manager.broadcast_monitoring_event(payload))
                loop.close()
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
            self._save_event("moved", f"{event.src_path} -> {event.dest_path}")


def start_monitoring(directory: str, ws_manager, db_session_factory) -> bool:
    """Start a watchdog Observer on *directory*. Returns False if already active."""
    if directory in _active_observers:
        return False
    handler = SyncSphereHandler(directory, ws_manager, db_session_factory)
    observer = Observer()
    observer.schedule(handler, directory, recursive=True)
    observer.start()
    _active_observers[directory] = observer
    return True


def stop_monitoring(directory: str) -> bool:
    """Stop the observer for *directory*. Returns False if not active."""
    observer = _active_observers.pop(directory, None)
    if observer is None:
        return False
    observer.stop()
    observer.join()
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
        q = q.filter(models.MonitorEvent.directory == directory)
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
