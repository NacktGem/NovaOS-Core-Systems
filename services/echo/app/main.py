from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Query
from typing import Dict, Set
import json, os

app = FastAPI(title="Echo Relay")
ROOMS: Dict[str, Set[WebSocket]] = {k:set() for k in ["rose-garden","creator-hub","admin-desk","founder-room"]}

def can_join(room: str, role: str) -> bool:
    if room == "founder-room":
        return role == "GODMODE"
    if room == "admin-desk":
        return role in ("GODMODE","SUPER_ADMIN","ADMIN_AGENT","ADVISOR","MODERATOR")
    if room == "creator-hub":
        return role in ("GODMODE","SUPER_ADMIN","ADMIN_AGENT","ADVISOR","MODERATOR","CREATOR_STANDARD","CREATOR_SOVEREIGN")
    return True

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket, room: str = Query(...), role: str = Query(...)):
    if room.startswith("family-") and room not in ROOMS:
        ROOMS[room] = set()
    if room not in ROOMS or not can_join(room, role):
        await ws.close(code=4403)
        return
    await ws.accept()
    ROOMS[room].add(ws)
    try:
        while True:
            msg = await ws.receive_text()
            payload = json.loads(msg)
            # founder-room is non-persistent; others would be persisted by a storage adapter (todo)
            for peer in list(ROOMS[room]):
                if peer is not ws:
                    await peer.send_text(json.dumps({"room":room,"role":role,"data":payload}))
    except WebSocketDisconnect:
        pass
    finally:
        ROOMS[room].discard(ws)
