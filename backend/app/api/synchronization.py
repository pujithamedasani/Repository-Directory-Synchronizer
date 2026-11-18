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
from app.services.conflict_manager import get_conflicts, resolve_conflict

router = APIRouter()


def _state():
    from app.main import app_state
    return app_state


class SyncRequest(BaseModel):
    mode: str = "one_way"
    dry_run: bool = False
    delete_extra: bool = False
    preserve_timestamps: bool = True
    include_hidden: bool = False
    selective_files: Optional[List[str]] = None


class ResolveConflictBody(BaseModel):
    file_path: str
    resolution: str  # "source" | "dest" | "both" | "skip"


@router.post("/start")
def start(body: SyncRequest, db: Session = Depends(get_db)):
    state = _state()
    if not state.source_dir or not state.dest_dir:
        raise HTTPException(status_code=400, detail="Source and destination must be selected.")
    if get_sync_status().get("active"):
        raise HTTPException(status_code=409, detail="A sync is already running.")

    opts = SyncOptions(
        mode=body.mode,
        dry_run=body.dry_run,
        delete_extra=body.delete_extra,
        preserve_timestamps=body.preserve_timestamps,
        include_hidden=body.include_hidden,
        selective_files=body.selective_files,
    )
    session_id = start_sync(state.source_dir, state.dest_dir, opts, db)
    return {"session_id": session_id, "status": "started"}


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
    if not state.source_dir or not state.dest_dir:
        raise HTTPException(status_code=400, detail="Source and destination must be selected.")

    result = compare_directories(
        state.source_dir,
        state.dest_dir,
        {"use_checksum": True, "include_hidden": body.include_hidden},
    )
    return {
        "dry_run": True,
        "would_copy": len(result.new_files),
        "would_update": len(result.modified_files),
        "would_delete": len(result.deleted_files) if body.delete_extra else 0,
        "unchanged": len(result.unchanged_files),
        "new_files": [f.relative_path for f in result.new_files],
        "modified_files": [f.relative_path for f in result.modified_files],
        "deleted_files": [f.relative_path for f in result.deleted_files] if body.delete_extra else [],
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
    if body.resolution not in ("source", "dest", "both", "skip"):
        raise HTTPException(status_code=400, detail="Invalid resolution value.")
    ok = resolve_conflict(body.file_path, body.resolution)
    if not ok:
        raise HTTPException(status_code=404, detail="Conflict not found.")
    return {"resolved": True}
