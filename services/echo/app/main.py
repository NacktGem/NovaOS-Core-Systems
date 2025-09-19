from __future__ import annotations

import os
import asyncio
import socket
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import Depends, FastAPI, WebSocket, WebSocketDisconnect, Query, HTTPException, status

from .auth import get_current_user
from .rooms import can_join
from .ws import RoomHub
from .deps import get_redis
from env.identity import load_identity, CONFIG_PATH  # type: ignore

app = FastAPI(title="Echo Relay")
hub = RoomHub()

IDENTITY = load_identity()
try:
    print(f"[NovaOS] identity loaded from {CONFIG_PATH.resolve()}")
except Exception:
    pass

SERVICE_NAME = "echo"
GIT_COMMIT = os.getenv("GIT_COMMIT", "unknown")
CORE_API_URL = os.getenv("CORE_API_URL", "http://core-api:8000")
AGENT_TOKEN = os.getenv("AGENT_SHARED_TOKEN", "")
INTERNAL_TOKEN = os.getenv("INTERNAL_TOKEN", "")


def enforce_internal_token(request: Request) -> None:
    if not INTERNAL_TOKEN:
        return
    token = request.headers.get("x-internal-token")
    if token != INTERNAL_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="internal access only")


@app.on_event("startup")
async def startup_event() -> None:
    app.state._hb_task = asyncio.create_task(_heartbeat_loop())


@app.on_event("shutdown")
async def shutdown_event() -> None:
    task = getattr(app.state, "_hb_task", None)
    if task:
        task.cancel()


@app.get("/internal/healthz")
async def internal_healthz(request: Request):
    enforce_internal_token(request)
    return {"status": "ok"}


@app.get("/internal/readyz")
async def internal_readyz(request: Request):
    enforce_internal_token(request)
    return {"status": "ok"}


@app.get("/healthz")
async def healthz(redis=Depends(get_redis)):
    pong = await redis.ping()
    if not pong:
        raise HTTPException(status_code=503, detail="redis not ready")
    return {"status": "ok"}


@app.get("/readyz")
async def readyz(redis=Depends(get_redis)):
    pong = await redis.ping()
    if not pong:
        raise HTTPException(status_code=503, detail="redis not ready")
    return {"status": "ok"}


@app.get("/version")
async def version() -> Dict[str, Any]:
    return {
        "service": SERVICE_NAME,
        "name": IDENTITY.get("name", "NovaOS"),
        "version": IDENTITY.get("version", os.getenv("ECHO_VERSION", "0.0.0")),
        "commit": GIT_COMMIT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/status")
async def status_page() -> Dict[str, Any]:
    return {
        "agent": SERVICE_NAME,
        "ws_rooms": list(hub.rooms.keys()),
    }


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


async def _heartbeat_loop() -> None:
    import httpx

    ttl = 90
    headers = {"x-agent-token": AGENT_TOKEN} if AGENT_TOKEN else {}
    payload = {
        "agent": SERVICE_NAME,
        "version": IDENTITY.get("version", "0.0.0"),
        "host": socket.gethostname(),
        "pid": os.getpid(),
        "capabilities": ["comms", "relay", "websocket"],
    }

    while True:
        try:
            url = f"{CORE_API_URL.rstrip('/')}/api/v1/agent/heartbeat"
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(url, json=payload, headers=headers)
        except Exception as e:  # noqa: BLE001
            print(f"heartbeat failed: {e}")
        await asyncio.sleep(ttl // 2)
