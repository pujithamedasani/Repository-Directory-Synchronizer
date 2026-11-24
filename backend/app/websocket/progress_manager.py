"""
WebSocket progress broadcasting.
"""
import asyncio
from typing import List, Optional
from fastapi import WebSocket


class ConnectionManager:
    """Manages all active WebSocket connections and broadcasts messages."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self._loop: Optional[asyncio.AbstractEventLoop] = None

    def set_loop(self, loop: asyncio.AbstractEventLoop):
        self._loop = loop

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)
        try:
            self._loop = asyncio.get_running_loop()
        except RuntimeError:
            pass

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        """Send JSON payload to every connected client."""
        dead = []
        for connection in list(self.active_connections):
            try:
                await connection.send_json(data)
            except Exception:
                dead.append(connection)
        for conn in dead:
            self.disconnect(conn)

    def broadcast_threadsafe(self, data: dict):
        """Safely broadcast from background threads without event loop clashes."""
        loop = self._loop
        if loop and not loop.is_closed() and loop.is_running():
            asyncio.run_coroutine_threadsafe(self.broadcast(data), loop)
        else:
            try:
                current_loop = asyncio.get_event_loop()
                if current_loop.is_running():
                    asyncio.run_coroutine_threadsafe(self.broadcast(data), current_loop)
                else:
                    current_loop.run_until_complete(self.broadcast(data))
            except Exception:
                pass

    async def broadcast_sync_progress(self, progress_data: dict):
        """Wrap payload with type tag and broadcast."""
        await self.broadcast({"type": "sync_progress", **progress_data})

    def broadcast_sync_progress_threadsafe(self, progress_data: dict):
        self.broadcast_threadsafe({"type": "sync_progress", **progress_data})

    async def broadcast_monitoring_event(self, event_data: dict):
        """Wrap payload with type tag and broadcast."""
        await self.broadcast({"type": "monitoring_event", **event_data})

    def broadcast_monitoring_event_threadsafe(self, event_data: dict):
        self.broadcast_threadsafe({"type": "monitoring_event", **event_data})


# Single shared instance used throughout the app
ws_manager = ConnectionManager()
