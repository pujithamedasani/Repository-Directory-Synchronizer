"""
Conflict Manager Service — detects and resolves sync conflicts.
"""
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class Conflict:
    relative_path: str
    source_mtime: Optional[str]
    dest_mtime: Optional[str]
    source_size: Optional[int]
    dest_size: Optional[int]
    resolution: Optional[str] = None  # "source" | "dest" | "both" | "skip"


_conflicts: List[Conflict] = []


def detect_conflicts(comparison_result) -> List[Conflict]:
    """
    In one-way sync there are no true conflicts, but in two-way mode
    files modified on BOTH sides since the last sync are conflicting.
    For now, we treat every 'modified' file in two-way mode as a potential
    conflict and return them for the user to review.
    """
    global _conflicts
    _conflicts = [
        Conflict(
            relative_path=fc.relative_path,
            source_mtime=fc.source_mtime,
            dest_mtime=fc.dest_mtime,
            source_size=fc.source_size,
            dest_size=fc.dest_size,
        )
        for fc in comparison_result.modified_files
    ]
    return _conflicts


def get_conflicts() -> List[Conflict]:
    return _conflicts


def resolve_conflict(file_path: str, resolution: str) -> bool:
    """Mark a conflict as resolved with the given resolution strategy."""
    for c in _conflicts:
        if c.relative_path == file_path:
            c.resolution = resolution
            return True
    return False


def clear_conflicts():
    global _conflicts
    _conflicts = []
