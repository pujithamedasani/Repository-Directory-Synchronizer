"""
WebSocket progress broadcasting.
"""
import json
from typing import List
from fastapi import WebSocket


class ConnectionManager:
    """Manages all active WebSocket connections and broadcasts messages."""

    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, data: dict):
        """Send JSON payload to every connected client."""
        dead = []
        for connection in self.active_connections:
            try:
                await connection.send_json(data)
            except Exception:
                dead.append(connection)
        for conn in dead:
            self.disconnect(conn)

    async def broadcast_sync_progress(self, progress_data: dict):
        """Wrap payload with type tag and broadcast."""
        await self.broadcast({"type": "sync_progress", **progress_data})

    async def broadcast_monitoring_event(self, event_data: dict):
        """Wrap payload with type tag and broadcast."""
        await self.broadcast({"type": "monitoring_event", **event_data})


# Single shared instance used throughout the app
ws_manager = ConnectionManager()
