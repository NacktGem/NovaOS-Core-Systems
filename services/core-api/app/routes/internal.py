import os
import uuid
from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import Message, Room

router = APIRouter(prefix="/internal", tags=["internal"])
health_router = APIRouter()

_INTERNAL_TOKEN = os.getenv("ECHO_INTERNAL_TOKEN", "")


class InternalMessage(BaseModel):
    room: str
    body: str
    user_id: Optional[uuid.UUID] = None


@router.post("/messages", status_code=201)
def internal_messages(
    payload: InternalMessage,
    x_internal_token: str = Header(default=""),
    session: Session = Depends(get_session),
):
    if not _INTERNAL_TOKEN or x_internal_token != _INTERNAL_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    body = payload.body.strip()
    if not body:
        raise HTTPException(status_code=422, detail="empty body")
    if payload.user_id is None:
        return Response(status_code=status.HTTP_202_ACCEPTED)
    try:
        room_id = uuid.UUID(payload.room)
    except ValueError:
        room = session.query(Room).filter_by(name=payload.room).first()
        if not room:
            raise HTTPException(status_code=404, detail="room not found")
        room_id = room.id
    msg = Message(room_id=room_id, user_id=payload.user_id, body=body)
    session.add(msg)
    session.flush()
    return {"id": str(msg.id)}


@health_router.get("/healthz")
def healthz():
    return {"status": "ok"}


@health_router.get("/readyz")
def readyz():
    return {"status": "ok"}
