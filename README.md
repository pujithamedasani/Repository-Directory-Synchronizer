# SyncSphere — Repository & Directory Synchronizer

> A professional, full-stack web application for synchronizing directories with real-time progress monitoring, conflict resolution, and comprehensive activity history.

## Overview

SyncSphere is a modern OS-integrated directory synchronization platform built as an academic project demonstrating key Operating Systems concepts including file system management, concurrent processing, event-based monitoring, and data integrity verification.

## Features

- **Real Directory Comparison** — SHA-256 checksum-based file comparison with size, timestamp, and content analysis
- **One-Way Synchronization** — Copy new and modified files from source to destination
- **Two-Way Synchronization** — Bidirectional sync with intelligent conflict detection
- **Selective Synchronization** — Choose specific files and folders to sync
- **Real-Time Progress** — WebSocket-powered live sync progress updates
- **File Monitoring** — Watchdog-based filesystem event detection (create/modify/delete/rename)
- **Conflict Resolution** — Safe conflict handling with user-controlled resolution
- **Sync History** — Persistent SQLite-based history with detailed operation logs
- **Directory Explorer** — Professional file browser with metadata
- **Dark/Light Themes** — Professional UI with theme switching

## Technology Stack

### Frontend
| Technology | Version | Purpose |
|---|---|---|
| React.js | 18+ | UI framework |
| Vite | 5+ | Build tool & dev server |
| Tailwind CSS | 3+ | Utility-first styling |
| Framer Motion | 11+ | Animations & transitions |
| Lucide React | Latest | Icon system |
| Recharts | Latest | Charts & data visualization |
| Axios | Latest | HTTP client |
| React Router | 6+ | Client-side routing |

### Backend
| Technology | Version | Purpose |
|---|---|---|
| Python | 3.10+ | Runtime |
| FastAPI | 0.115+ | Web framework & REST API |
| SQLAlchemy | 2.0+ | ORM |
| SQLite | Built-in | Database |
| Watchdog | 6.0+ | File system monitoring |
| Uvicorn | 0.32+ | ASGI server |

### OS Integration
| Module | Concept Demonstrated |
|---|---|
| `pathlib` | Path manipulation, directory traversal |
| `os` | File metadata, directory creation |
| `shutil` | File I/O operations, copy with metadata |
| `hashlib` | SHA-256 data integrity verification |
| `threading` | Concurrent background synchronization |
| `asyncio` | Async WebSocket communication |
| `watchdog` | Event-based file system monitoring |

## Architecture

```
SyncSphere/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── config.py            # Configuration
│   │   ├── api/                 # REST API endpoints
│   │   │   ├── directories.py
│   │   │   ├── comparison.py
│   │   │   ├── synchronization.py
│   │   │   ├── monitoring.py
│   │   │   ├── history.py
│   │   │   └── settings.py
│   │   ├── services/            # Business logic
│   │   │   ├── directory_scanner.py
│   │   │   ├── comparison_engine.py
│   │   │   ├── synchronization_engine.py
│   │   │   ├── conflict_manager.py
│   │   │   └── file_monitor.py
│   │   ├── database/            # Data persistence
│   │   │   ├── database.py
│   │   │   └── models.py
│   │   ├── utils/               # Utilities
│   │   │   ├── file_hash.py
│   │   │   └── path_validator.py
│   │   └── websocket/           # WebSocket
│   │       └── progress_manager.py
│   └── requirements.txt
└── frontend/
    └── src/
        ├── pages/               # Page components
        ├── components/          # Reusable UI
        ├── services/            # API & WebSocket
        ├── hooks/               # Custom hooks
        ├── context/             # React context
        └── utils/               # Helpers
```

## Installation

### Prerequisites
- Python 3.10 or higher
- Node.js 18 or higher
- npm 9 or higher

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend (Terminal 1)
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Start Frontend (Terminal 2)
```bash
cd frontend
npm run dev
```

The application will be available at: **http://localhost:5173**
Backend API docs at: **http://localhost:8000/docs**

## Generating Test Data

A demo data generator is included. Run it to create sample directories for testing:

```bash
python demo_generator.py
```

This creates:
- `demo_source/` — Sample source directory with various file types
- `demo_dest/` — Partial destination directory (some files missing, some modified)

**Note:** This generator only creates files for testing purposes. It does not modify your real directories.

## API Documentation

The backend exposes a full Swagger UI at `http://localhost:8000/docs` when running.

### Key Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/directories/browse` | Browse filesystem |
| POST | `/api/directories/select-source` | Set source directory |
| POST | `/api/directories/select-destination` | Set destination directory |
| POST | `/api/comparison/compare` | Compare directories |
| POST | `/api/sync/start` | Start synchronization |
| POST | `/api/sync/cancel` | Cancel sync |
| POST | `/api/sync/preview` | Dry-run preview |
| GET | `/api/history` | Sync history |
| GET | `/api/history/stats` | Dashboard statistics |
| POST | `/api/monitoring/start` | Start file monitoring |
| GET | `/api/monitoring/events` | Recent monitoring events |
| WS | `/ws/progress` | Real-time sync progress |
| WS | `/ws/monitoring` | Real-time monitoring events |

## Operating Systems Concepts Demonstrated

### 1. File System Management
Using `pathlib.Path` for cross-platform path manipulation and `os.stat()` for file metadata retrieval.

### 2. Directory Traversal
Recursive directory scanning with `pathlib.Path.rglob()`, handling permission errors and symlinks gracefully.

### 3. File Metadata Management
Reading and comparing file attributes: size, modification time, creation time, permissions.

### 4. File I/O Operations
Chunk-based file reading for SHA-256 computation (avoids loading large files into memory). Using `shutil.copy2()` for file copying with metadata preservation.

### 5. File Synchronization
One-way and two-way directory synchronization maintaining directory structure integrity.

### 6. Concurrent Processing
Background synchronization threads using Python `threading.Thread`, async WebSocket handlers with `asyncio`.

### 7. Event-Based File Monitoring
OS-level filesystem event interception using `watchdog` library (wraps `inotify` on Linux, `FSEvents` on macOS, `ReadDirectoryChangesW` on Windows).

### 8. Data Integrity Using Hashing
SHA-256 checksums for reliable file modification detection, preventing false positives from timestamp-only comparison.

### 9. Process and Task Management
Managing long-running background tasks, cancellation signals, and cleanup on process termination.

### 10. Error and Exception Handling
Comprehensive error handling for permission denied, file not found, disk full, and path traversal attacks.

## Testing Scenarios

1. **Empty source directory** — Compare returns all destination files as "deleted"
2. **Empty destination** — All source files shown as "new"
3. **Identical directories** — All files marked "unchanged"
4. **New file in source** — File appears as "new" in comparison
5. **Modified file** — SHA-256 mismatch detected as "modified"
6. **Deleted from source** — File shown as "deleted" (exists only in dest)
7. **Nested directories** — Full recursive comparison and sync
8. **Duplicate filenames** — Handled by relative path, not just name
9. **Permission errors** — Graceful error display, skipped with log
10. **Large files** — Chunk-based hashing, progress updates
11. **Conflicts** — Two-way sync detects and surfaces for resolution
12. **Invalid paths** — Validation rejects with clear error message
13. **Destination missing** — Option to create destination directory

## License

Academic project — Operating Systems course.
