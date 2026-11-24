"""
API — Directory browsing and selection.
"""
import os
import string
from pathlib import Path
from typing import Optional

from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database.database import get_db
from app.services.directory_scanner import scan_directory
from app.utils.path_validator import validate_path, normalize_path

router = APIRouter()

# Circular import avoided by importing app_state lazily
def _state():
    from app.main import app_state
    return app_state


class PathBody(BaseModel):
    path: str


def _list_drives():
    """Return available drive letters on Windows."""
    drives = []
    for letter in string.ascii_uppercase:
        drive = f"{letter}:\\"
        if os.path.exists(drive):
            drives.append({
                "name": f"{letter}:",
                "is_dir": True,
                "size": 0,
                "modified": None,
                "path": drive,
            })
    return drives


@router.get("/browse")
def browse(path: str = ""):
    """
    List directory contents.  When *path* is empty, return available drives
    (Windows) or root (Unix).
    """
    if not path:
        # Windows root → list drives
        return {"path": "", "items": _list_drives(), "parent": None}

    try:
        resolved = validate_path(path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    if not resolved.exists():
        raise HTTPException(status_code=404, detail="Path not found.")
    if not resolved.is_dir():
        raise HTTPException(status_code=400, detail="Path is not a directory.")

    items = []
    try:
        for entry in sorted(resolved.iterdir(), key=lambda e: (not e.is_dir(), e.name.lower())):
            try:
                stat = entry.stat()
                items.append({
                    "name": entry.name,
                    "is_dir": entry.is_dir(),
                    "size": stat.st_size if not entry.is_dir() else 0,
                    "modified": stat.st_mtime,
                    "path": normalize_path(str(entry)),
                })
            except (PermissionError, OSError):
                continue
    except PermissionError:
        raise HTTPException(status_code=403, detail="Access denied.")

    parent = normalize_path(str(resolved.parent)) if resolved.parent != resolved else None
    return {"path": normalize_path(str(resolved)), "items": items, "parent": parent}


@router.post("/select-source")
def select_source(body: PathBody):
    try:
        resolved = validate_path(body.path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not resolved.exists() or not resolved.is_dir():
        raise HTTPException(status_code=400, detail="Path does not exist or is not a directory.")
    _state().source_dir = str(resolved)
    return {"source": normalize_path(str(resolved))}


@router.post("/select-destination")
def select_destination(body: PathBody):
    try:
        resolved = validate_path(body.path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    if not resolved.exists() or not resolved.is_dir():
        raise HTTPException(status_code=400, detail="Path does not exist or is not a directory.")
    _state().dest_dir = str(resolved)
    return {"destination": normalize_path(str(resolved))}


@router.get("/source")
def get_source():
    s = _state().source_dir
    return {"source": normalize_path(s) if s else None}


@router.get("/destination")
def get_destination():
    d = _state().dest_dir
    return {"destination": normalize_path(d) if d else None}


@router.get("/scan")
def scan_dirs():
    state = _state()
    if not state.source_dir and not state.dest_dir:
        raise HTTPException(status_code=400, detail="No directories selected.")

    result = {}
    if state.source_dir:
        sr = scan_directory(state.source_dir)
        result["source"] = {
            "path": normalize_path(state.source_dir),
            "total_files": sr.total_files,
            "total_dirs": sr.total_dirs,
            "total_size": sr.total_size,
            "scan_time": sr.scan_time,
        }
    if state.dest_dir:
        dr = scan_directory(state.dest_dir)
        result["destination"] = {
            "path": normalize_path(state.dest_dir),
            "total_files": dr.total_files,
            "total_dirs": dr.total_dirs,
            "total_size": dr.total_size,
            "scan_time": dr.scan_time,
        }
    return result


@router.post("/validate")
def validate(body: PathBody):
    p = Path(body.path) if body.path else None
    if p is None:
        return {"valid": False, "exists": False, "is_dir": False, "message": "Empty path."}
    try:
        resolved = validate_path(body.path)
        exists = resolved.exists()
        is_dir = resolved.is_dir() if exists else False
        return {"valid": True, "exists": exists, "is_dir": is_dir, "message": "OK"}
    except ValueError as exc:
        return {"valid": False, "exists": False, "is_dir": False, "message": str(exc)}


@router.post("/create")
def create_directory(body: PathBody):
    try:
        resolved = validate_path(body.path)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    try:
        resolved.mkdir(parents=True, exist_ok=True)
        return {"created": True, "path": normalize_path(str(resolved))}
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@router.post("/reset-demo")
def reset_demo():
    import sys
    from pathlib import Path
    root_dir = Path(__file__).resolve().parent.parent.parent.parent
    if str(root_dir) not in sys.path:
        sys.path.insert(0, str(root_dir))
    try:
        import demo_generator
        demo_generator.create_demo_data()
        src = normalize_path(str(root_dir / "demo_source"))
        dst = normalize_path(str(root_dir / "demo_dest"))
        _state().source_dir = src
        _state().dest_dir = dst
        _state().last_comparison = None
        return {
            "success": True,
            "source": src,
            "destination": dst,
            "message": "Demo test directories reset successfully with fresh un-synced data!"
        }
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))
