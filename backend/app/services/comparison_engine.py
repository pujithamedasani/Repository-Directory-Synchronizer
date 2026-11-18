"""
Comparison Engine Service.

OS Concept: Data Integrity — SHA-256 checksums are used to detect byte-level
file modifications even when file size and modification time appear identical
(e.g. after a copy that preserved timestamps).
"""
import time
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional, Dict

from app.services.directory_scanner import scan_directory, FileInfo
from app.utils.file_hash import compute_sha256


@dataclass
class FileComparison:
    relative_path: str
    name: str
    extension: str
    status: str           # "new" | "modified" | "deleted" | "unchanged"
    source_size: Optional[int] = None
    dest_size: Optional[int] = None
    source_mtime: Optional[str] = None
    dest_mtime: Optional[str] = None
    source_hash: Optional[str] = None
    dest_hash: Optional[str] = None
    action_available: bool = True


@dataclass
class ComparisonResult:
    new_files: List[FileComparison] = field(default_factory=list)
    modified_files: List[FileComparison] = field(default_factory=list)
    deleted_files: List[FileComparison] = field(default_factory=list)
    unchanged_files: List[FileComparison] = field(default_factory=list)
    total_source: int = 0
    total_dest: int = 0
    comparison_time: float = 0.0
    source_path: str = ""
    dest_path: str = ""


def compare_directories(
    source: str,
    dest: str,
    options: dict,
) -> ComparisonResult:
    """
    Compare *source* and *dest* directories and classify every file as
    new / modified / deleted / unchanged.

    Algorithm:
      1. Build {rel_path: FileInfo} maps for source and dest.
      2. Files only in source  → "new"
      3. Files only in dest    → "deleted"
      4. Files in both         → compare size → mtime → SHA-256 (if use_checksum)
    """
    start = time.monotonic()
    use_checksum: bool = options.get("use_checksum", True)
    include_hidden: bool = options.get("include_hidden", False)

    src_scan = scan_directory(source, include_hidden=include_hidden)
    dst_scan = scan_directory(dest, include_hidden=include_hidden)

    src_map: Dict[str, FileInfo] = {f.relative_path: f for f in src_scan.files}
    dst_map: Dict[str, FileInfo] = {f.relative_path: f for f in dst_scan.files}

    result = ComparisonResult(
        total_source=src_scan.total_files,
        total_dest=dst_scan.total_files,
        source_path=source,
        dest_path=dest,
    )

    src_root = Path(source)
    dst_root = Path(dest)

    for rel_path, src_info in src_map.items():
        name = Path(rel_path).name
        ext = Path(rel_path).suffix.lower()

        if rel_path not in dst_map:
            result.new_files.append(FileComparison(
                relative_path=rel_path,
                name=name,
                extension=ext,
                status="new",
                source_size=src_info.size,
                source_mtime=src_info.modified_time,
            ))
        else:
            dst_info = dst_map[rel_path]
            fc = FileComparison(
                relative_path=rel_path,
                name=name,
                extension=ext,
                status="unchanged",
                source_size=src_info.size,
                dest_size=dst_info.size,
                source_mtime=src_info.modified_time,
                dest_mtime=dst_info.modified_time,
            )

            # Step 1: different size → definitely modified
            if src_info.size != dst_info.size:
                fc.status = "modified"
            # Step 2: different mtime → likely modified; confirm with checksum
            elif src_info.modified_time != dst_info.modified_time:
                if use_checksum:
                    src_hash = compute_sha256(str(src_root / rel_path))
                    dst_hash = compute_sha256(str(dst_root / rel_path))
                    fc.source_hash = src_hash
                    fc.dest_hash = dst_hash
                    if src_hash and dst_hash and src_hash != dst_hash:
                        fc.status = "modified"
                else:
                    fc.status = "modified"

            if fc.status == "modified":
                result.modified_files.append(fc)
            else:
                result.unchanged_files.append(fc)

    for rel_path, dst_info in dst_map.items():
        if rel_path not in src_map:
            result.deleted_files.append(FileComparison(
                relative_path=rel_path,
                name=Path(rel_path).name,
                extension=Path(rel_path).suffix.lower(),
                status="deleted",
                dest_size=dst_info.size,
                dest_mtime=dst_info.modified_time,
            ))

    result.comparison_time = time.monotonic() - start
    return result
