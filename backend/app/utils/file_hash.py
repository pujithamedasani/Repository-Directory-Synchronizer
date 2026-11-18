"""
File hashing utilities.

OS Concept: File I/O — reading file in chunks to avoid loading the entire
file into memory, keeping RAM usage constant regardless of file size.
"""
import hashlib
from pathlib import Path


def compute_sha256(filepath: str) -> str | None:
    """
    Compute the SHA-256 digest of a file.
    Reads the file in 1 MB chunks to keep memory usage O(1).
    Returns the hex-encoded digest, or None on error.
    """
    try:
        sha256 = hashlib.sha256()
        chunk_size = 1024 * 1024  # 1 MB
        with open(filepath, "rb") as f:
            while chunk := f.read(chunk_size):
                sha256.update(chunk)
        return sha256.hexdigest()
    except (PermissionError, FileNotFoundError, OSError):
        return None


def compute_md5(filepath: str) -> str | None:
    """
    Compute the MD5 digest of a file — faster than SHA-256, used for
    quick pre-checks before falling back to SHA-256.
    Returns the hex-encoded digest, or None on error.
    """
    try:
        md5 = hashlib.md5()
        chunk_size = 1024 * 1024  # 1 MB
        with open(filepath, "rb") as f:
            while chunk := f.read(chunk_size):
                md5.update(chunk)
        return md5.hexdigest()
    except (PermissionError, FileNotFoundError, OSError):
        return None
