from typing import Dict, List, Set

from fastapi import FastAPI, HTTPException, Request, WebSocket, WebSocketDisconnect
from pydantic import BaseModel

app = FastAPI()

admin_roles = {'godmode', 'super_admin_jules', 'super_admin_nova', 'admin_agent'}
founder_roles = {'godmode', 'super_admin_jules', 'super_admin_nova'}

rooms_access = {
    '#rose-garden': lambda role: True,
    '#creator-hub': lambda role: role.startswith('creator') or role in admin_roles,
    '#admin-desk': lambda role: role in admin_roles,
    '#founder-room': lambda role: role in founder_roles,
}

connections: Dict[str, Set[WebSocket]] = {k: set() for k in rooms_access}
transcripts: Dict[str, List[str]] = {k: [] for k in rooms_access if k != '#founder-room'}
households: Dict[str, Set[str]] = {}


def get_identity(headers) -> tuple[str, str]:
    uid = headers.get('x-user-id')
    role = headers.get('x-user-role')
    if not uid or not role:
        raise HTTPException(status_code=401)
    return uid, role


@app.get('/echo/rooms')
def list_rooms(request: Request):
    uid, role = get_identity(request.headers)
    return [r for r, cond in rooms_access.items() if cond(role)]


@app.websocket('/echo/ws')
async def websocket_endpoint(websocket: WebSocket):
    room = websocket.query_params.get('room')
    uid = websocket.headers.get('x-user-id')
    role = websocket.headers.get('x-user-role')
    if not uid or not role:
        await websocket.close(code=4001)
        return
    if room in rooms_access:
        if not rooms_access[room](role):
            await websocket.close(code=4003)
            return
    elif room and room.startswith('inbox/'):
        pass
    elif room and room.startswith('family-'):
        hid = room.split('-', 1)[1]
        allow = households.get(hid, set())
        if role not in {'parent', 'child'} or uid not in allow:
            await websocket.close(code=4003)
            return
    else:
        await websocket.close(code=4004)
        return
    await websocket.accept()
    connections.setdefault(room, set()).add(websocket)
    try:
        while True:
            data = await websocket.receive_text()
            if room != '#founder-room':
                transcripts.setdefault(room, []).append(data)
            for conn in list(connections.get(room, set())):
                if conn is not websocket:
                    await conn.send_text(data)
    except WebSocketDisconnect:
        connections.get(room, set()).discard(websocket)

class Invite(BaseModel):
    household_id: str
    user_id: str


@app.post('/echo/family/invite')
def family_invite(data: Invite, request: Request):
    uid, role = get_identity(request.headers)
    if role not in founder_roles:
        raise HTTPException(status_code=403)
    households.setdefault(data.household_id, set()).add(data.user_id)
    return {'ok': True}
