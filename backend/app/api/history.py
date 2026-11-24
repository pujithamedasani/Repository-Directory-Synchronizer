"""
API — Sync history.
"""
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.database import get_db
from app.database.models import SyncSession, FileOperation

router = APIRouter()


def _session_dict(s: SyncSession) -> dict:
    return {
        "id": s.id,
        "start_time": s.start_time.isoformat() if s.start_time else None,
        "end_time": s.end_time.isoformat() if s.end_time else None,
        "source_dir": s.source_dir,
        "dest_dir": s.dest_dir,
        "files_copied": s.files_copied,
        "files_updated": s.files_updated,
        "files_deleted": s.files_deleted,
        "files_skipped": s.files_skipped,
        "bytes_transferred": s.bytes_transferred,
        "status": s.status,
        "error_details": s.error_details,
        "sync_mode": s.sync_mode,
    }


@router.get("")
@router.get("/")
def list_history(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=20, ge=1, le=100),
    status: Optional[str] = Query(default=None),
    search: Optional[str] = Query(default=None),
    db: Session = Depends(get_db),
):
    q = db.query(SyncSession)
    if status:
        q = q.filter(SyncSession.status == status)
    if search:
        q = q.filter(
            SyncSession.source_dir.contains(search)
            | SyncSession.dest_dir.contains(search)
        )
    total = q.count()
    sessions = q.order_by(SyncSession.start_time.desc()).offset((page - 1) * limit).limit(limit).all()
    return {
        "total": total,
        "page": page,
        "limit": limit,
        "sessions": [_session_dict(s) for s in sessions],
    }


@router.get("/stats")
def history_stats(db: Session = Depends(get_db)):
    total = db.query(func.count(SyncSession.id)).scalar()
    completed = db.query(func.count(SyncSession.id)).filter(SyncSession.status == "completed").scalar()
    failed = db.query(func.count(SyncSession.id)).filter(SyncSession.status == "failed").scalar()
    total_bytes = db.query(func.sum(SyncSession.bytes_transferred)).scalar() or 0
    total_files = (
        (db.query(func.sum(SyncSession.files_copied)).scalar() or 0)
        + (db.query(func.sum(SyncSession.files_updated)).scalar() or 0)
    )
    return {
        "total_sessions": total,
        "completed": completed,
        "failed": failed,
        "total_bytes_transferred": total_bytes,
        "total_files_synced": total_files,
    }


@router.get("/{session_id}")
def get_session(session_id: int, db: Session = Depends(get_db)):
    s = db.query(SyncSession).filter(SyncSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found.")
    return _session_dict(s)


@router.get("/{session_id}/operations")
def get_operations(session_id: int, db: Session = Depends(get_db)):
    ops = db.query(FileOperation).filter(FileOperation.session_id == session_id).all()
    return {
        "session_id": session_id,
        "operations": [
            {
                "id": op.id,
                "file_path": op.file_path,
                "operation_type": op.operation_type,
                "file_size": op.file_size,
                "timestamp": op.timestamp.isoformat() if op.timestamp else None,
                "status": op.status,
                "error": op.error,
            }
            for op in ops
        ],
    }


@router.delete("/{session_id}")
def delete_session(session_id: int, db: Session = Depends(get_db)):
    s = db.query(SyncSession).filter(SyncSession.id == session_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Session not found.")
    db.delete(s)
    db.commit()
    return {"deleted": True, "session_id": session_id}
