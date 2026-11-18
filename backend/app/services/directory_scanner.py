"""
Directory Scanner Service.

OS Concept: Directory Traversal — recursive filesystem walk using the OS's
directory-entry APIs (via pathlib.Path.rglob) to enumerate every file and
sub-directory beneath a root, handling PermissionError gracefully so a
locked folder never aborts the whole scan.
"""
import os
import time
from dataclasses import dataclass, field
from pathlib import Path
from datetime import datetime
from typing import List


@dataclass
class FileInfo:
    name: str
    relative_path: str
    absolute_path: str
    size: int
    modified_time: str   # ISO-8601
    created_time: str    # ISO-8601
    extension: str
    is_dir: bool
    is_hidden: bool


@dataclass
class ScanResult:
    files: List[FileInfo] = field(default_factory=list)
    directories: List[FileInfo] = field(default_factory=list)
    total_files: int = 0
    total_dirs: int = 0
    total_size: int = 0
    scan_time: float = 0.0  # seconds


def _is_hidden(path: Path) -> bool:
    """Return True for hidden files/directories (dot-prefixed on Unix, or
    FILE_ATTRIBUTE_HIDDEN on Windows)."""
    if path.name.startswith("."):
        return True
    # Windows hidden attribute
    try:
        import ctypes
        attrs = ctypes.windll.kernel32.GetFileAttributesW(str(path))
        if attrs != -1 and (attrs & 2):  # FILE_ATTRIBUTE_HIDDEN = 0x2
            return True
    except Exception:
        pass
    return False


def scan_directory(path: str, include_hidden: bool = False) -> ScanResult:
    """
    Recursively scan *path* and return a ScanResult.
    PermissionError on individual entries is silently skipped.
    """
    start = time.monotonic()
    root = Path(path).resolve()
    result = ScanResult()

    if not root.exists() or not root.is_dir():
        return result

    try:
        entries = list(root.rglob("*"))
    except PermissionError:
        return result

    for entry in entries:
        try:
            hidden = _is_hidden(entry)
            if hidden and not include_hidden:
                continue

            stat = entry.stat()
            rel = str(entry.relative_to(root)).replace("\\", "/")
            mtime = datetime.fromtimestamp(stat.st_mtime).isoformat()
            ctime = datetime.fromtimestamp(stat.st_ctime).isoformat()

            info = FileInfo(
                name=entry.name,
                relative_path=rel,
                absolute_path=str(entry),
                size=stat.st_size if not entry.is_dir() else 0,
                modified_time=mtime,
                created_time=ctime,
                extension=entry.suffix.lower() if not entry.is_dir() else "",
                is_dir=entry.is_dir(),
                is_hidden=hidden,
            )

            if entry.is_dir():
                result.directories.append(info)
                result.total_dirs += 1
            else:
                result.files.append(info)
                result.total_files += 1
                result.total_size += stat.st_size

        except (PermissionError, OSError):
            continue

    result.scan_time = time.monotonic() - start
    return result
