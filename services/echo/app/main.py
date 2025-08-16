from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, status

from .auth import get_current_user
from .rooms import can_join
from .ws import RoomHub
from .deps import get_redis

app = FastAPI(title="Echo Relay")
hub = RoomHub()


@app.get("/healthz")
async def healthz(redis=Depends(get_redis)):
    pong = await redis.ping()
    if not pong:
        raise HTTPException(status_code=503, detail="redis not ready")
    return {"status": "ok"}


@app.websocket("/ws")
async def ws_endpoint(websocket: WebSocket, room: str = Query(...)):
    try:
        user = await get_current_user(websocket)
    except HTTPException:
        await websocket.accept()
        await websocket.close(code=4401)
        return
    if not await can_join(room, user):
        await websocket.accept()
        await websocket.close(code=4403)
        return
    await websocket.accept()
    try:
        await hub.handle_socket(room, user, websocket)
    except WebSocketDisconnect:
        return
    except Exception:  # noqa: BLE001
        try:
            await websocket.close(code=1011)
        finally:
            return
