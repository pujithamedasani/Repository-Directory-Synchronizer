"""
API — File monitoring.
"""
from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db, SessionLocal
from app.services.file_monitor import (
    start_monitoring, stop_monitoring, get_active_monitors, get_recent_events,
)
from app.websocket.progress_manager import ws_manager

router = APIRouter()


class DirectoryBody(BaseModel):
    directory: str


@router.post("/start")
def monitor_start(body: DirectoryBody, db: Session = Depends(get_db)):
    from pathlib import Path
    if not Path(body.directory).exists():
        raise HTTPException(status_code=400, detail="Directory does not exist.")
    ok = start_monitoring(body.directory, ws_manager, SessionLocal)
    if not ok:
        return {"message": "Already monitoring this directory.", "active": True}
    return {"message": "Monitoring started.", "directory": body.directory}


@router.post("/stop")
def monitor_stop(body: DirectoryBody):
    ok = stop_monitoring(body.directory)
    if not ok:
        raise HTTPException(status_code=404, detail="No active monitor for this directory.")
    return {"message": "Monitoring stopped.", "directory": body.directory}


@router.get("/status")
def monitor_status():
    return {"monitors": get_active_monitors()}


@router.get("/events")
def monitor_events(
    directory: str = Query(default=""),
    limit: int = Query(default=50, ge=1, le=500),
    db: Session = Depends(get_db),
):
    events = get_recent_events(directory, limit, db)
    return {"events": events, "count": len(events)}
