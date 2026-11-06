from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.notifications.ws_manager import manager

router = APIRouter()

@router.websocket("/ws/admin")
async def admin_ws(ws: WebSocket):
    await manager.connect(ws)
    try:
        while True:
            await ws.receive_text()  # keep alive
    except WebSocketDisconnect:
        manager.disconnect(ws)