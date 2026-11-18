#!/usr/bin/env python3
"""Sample Python file generated for SyncSphere testing."""
import os
from pathlib import Path

def process_files(directory: str) -> list:
    """Process all files in directory."""
    results = []
    for path in Path(directory).rglob("*"):
        if path.is_file():
            results.append({
                "name": path.name,
                "size": path.stat().st_size,
                "modified": path.stat().st_mtime
            })
    return results

if __name__ == "__main__":
    files = process_files(".")
    print(f"Found {len(files)} files")
