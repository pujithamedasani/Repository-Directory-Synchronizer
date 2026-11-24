"""
API — Directory comparison.
"""
from dataclasses import asdict
from pathlib import Path

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.services.comparison_engine import compare_directories

router = APIRouter()


def _state():
    from app.main import app_state
    return app_state


class CompareOptions(BaseModel):
    use_checksum: bool = True
    include_hidden: bool = False


@router.post("/compare")
def compare(opts: CompareOptions):
    state = _state()
    if not state.source_dir or not state.dest_dir:
        raise HTTPException(status_code=400, detail="Source and destination directories must be selected first.")

    result = compare_directories(state.source_dir, state.dest_dir, opts.model_dump())

    # Serialise dataclasses to plain dicts for JSON response
    data = {
        "source_path": result.source_path,
        "dest_path": result.dest_path,
        "comparison_time": result.comparison_time,
        "total_source": result.total_source,
        "total_dest": result.total_dest,
        "new_files": [asdict(f) for f in result.new_files],
        "modified_files": [asdict(f) for f in result.modified_files],
        "deleted_files": [asdict(f) for f in result.deleted_files],
        "unchanged_files": [asdict(f) for f in result.unchanged_files],
        "summary": {
            "new": len(result.new_files),
            "modified": len(result.modified_files),
            "deleted": len(result.deleted_files),
            "unchanged": len(result.unchanged_files),
        },
    }
    state.last_comparison = data
    return data


@router.get("/result")
def get_result():
    state = _state()
    if state.last_comparison is None:
        if state.source_dir and state.dest_dir and Path(state.source_dir).exists() and Path(state.dest_dir).exists():
            result = compare_directories(state.source_dir, state.dest_dir, {"use_checksum": True, "include_hidden": False})
            data = {
                "source_path": result.source_path,
                "dest_path": result.dest_path,
                "comparison_time": result.comparison_time,
                "total_source": result.total_source,
                "total_dest": result.total_dest,
                "new_files": [asdict(f) for f in result.new_files],
                "modified_files": [asdict(f) for f in result.modified_files],
                "deleted_files": [asdict(f) for f in result.deleted_files],
                "unchanged_files": [asdict(f) for f in result.unchanged_files],
                "summary": {
                    "new": len(result.new_files),
                    "modified": len(result.modified_files),
                    "deleted": len(result.deleted_files),
                    "unchanged": len(result.unchanged_files),
                },
            }
            state.last_comparison = data
            return data
        return {
            "summary": {"new": 0, "modified": 0, "deleted": 0, "unchanged": 0},
            "new_files": [],
            "modified_files": [],
            "deleted_files": [],
            "unchanged_files": [],
        }
    return state.last_comparison


@router.get("/file")
def get_file_detail(path: str):
    state = _state()
    if state.last_comparison is None:
        raise HTTPException(status_code=404, detail="No comparison result available.")

    all_files = (
        state.last_comparison.get("new_files", [])
        + state.last_comparison.get("modified_files", [])
        + state.last_comparison.get("deleted_files", [])
        + state.last_comparison.get("unchanged_files", [])
    )
    for f in all_files:
        if f["relative_path"] == path:
            return f
    raise HTTPException(status_code=404, detail=f"File '{path}' not found in last comparison.")
