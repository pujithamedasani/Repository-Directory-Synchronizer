"""
Path validation and security utilities.

OS Concept: Path security — preventing directory traversal attacks by
resolving symlinks and ensuring the target path stays within the
expected base directory (e.g. no "../../etc/passwd" escapes).
"""
from pathlib import Path


def validate_path(path_str: str) -> Path:
    """
    Resolve *path_str* to an absolute Path.
    Raises ValueError when the path is empty or cannot be resolved.
    """
    if not path_str or not path_str.strip():
        raise ValueError("Path must not be empty.")
    try:
        resolved = Path(path_str).resolve()
        return resolved
    except (OSError, ValueError) as exc:
        raise ValueError(f"Invalid path '{path_str}': {exc}") from exc


def is_safe_path(base_path: str, target_path: str) -> bool:
    """
    Return True only when *target_path* is located inside *base_path*.
    Both paths are resolved before comparison to defeat symlink tricks.
    """
    try:
        base = Path(base_path).resolve()
        target = Path(target_path).resolve()
        # PurePath.is_relative_to() available in Python ≥ 3.9
        return target == base or base in target.parents
    except (OSError, ValueError):
        return False


def normalize_path(path_str: str) -> str:
    """
    Return *path_str* normalised to use forward slashes.
    Useful for consistent display across platforms.
    """
    return str(Path(path_str)).replace("\\", "/")
