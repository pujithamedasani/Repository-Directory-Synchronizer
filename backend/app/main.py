"""
SyncSphere FastAPI Application Entry Point.
"""
from typing import Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database.database import init_db
from app.websocket.progress_manager import ws_manager

# ---- App state ---------------------------------------------------------- #

class AppState:
    source_dir: Optional[str] = None
    dest_dir: Optional[str] = None
    last_comparison: Optional[dict] = None
    active_conflicts: list = []

app_state = AppState()

# ---- Lifespan ----------------------------------------------------------- #

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    init_db()
    yield
    # Shutdown
    from app.services.file_monitor import stop_all_monitoring
    stop_all_monitoring()

# ---- Application -------------------------------------------------------- #

app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="Backend API for SyncSphere — Repository & Directory Synchronizer",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Routers ------------------------------------------------------------ #

from app.api.directories import router as directories_router
from app.api.comparison import router as comparison_router
from app.api.synchronization import router as synchronization_router
from app.api.monitoring import router as monitoring_router
from app.api.history import router as history_router
from app.api.settings import router as settings_router

app.include_router(directories_router, prefix="/api/directories", tags=["Directories"])
app.include_router(comparison_router, prefix="/api/comparison", tags=["Comparison"])
app.include_router(synchronization_router, prefix="/api/sync", tags=["Synchronization"])
app.include_router(monitoring_router, prefix="/api/monitoring", tags=["Monitoring"])
app.include_router(history_router, prefix="/api/history", tags=["History"])
app.include_router(settings_router, prefix="/api/settings", tags=["Settings"])

# ---- WebSocket endpoints ------------------------------------------------ #

@app.websocket("/ws/progress")
async def websocket_progress(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()   # keep connection alive; ignore pings
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)


@app.websocket("/ws/monitoring")
async def websocket_monitoring(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)

# ---- Health check ------------------------------------------------------- #

@app.get("/api/health", tags=["Health"])
def health():
    return {
        "status": "ok",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION,
    }
