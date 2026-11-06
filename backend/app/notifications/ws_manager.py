from fastapi import WebSocket
from typing import Set

class ConnectionManager:
    def __init__(self):
        self.active: Set[WebSocket] = set()

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.add(ws)

    def disconnect(self, ws: WebSocket):
        self.active.discard(ws)

    async def send_popup_once(self, payload: dict):
        # Send once, then close connections (runtime "once")
        for ws in list(self.active):
            await ws.send_json(payload)
            await ws.close()
            self.active.discard(ws)

manager = ConnectionManager()