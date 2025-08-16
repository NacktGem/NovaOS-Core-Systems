from datetime import datetime
from uuid import UUID

from fastapi import APIRouter, Depends, Response, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import Message, User
from app.middleware.rbac import is_godmode
from app.security.jwt import get_current_user

router = APIRouter(prefix="/rooms", tags=["messages"])


@router.get("/{room_id}/messages")
def get_messages(
    room_id: UUID,
    limit: int = 50,
    before: datetime | None = None,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    query = session.query(Message).filter(Message.room_id == room_id)
    if before:
        query = query.filter(Message.created_at < before)
    msgs = query.order_by(Message.created_at.desc()).limit(limit).all()
    return [
        {"id": str(m.id), "user_id": str(m.user_id) if m.user_id else None, "body": m.body}
        for m in msgs
    ]


class MessageBody(BaseModel):
    body: str


@router.post("/{room_id}/messages", status_code=201)
def post_message(
    room_id: UUID,
    payload: MessageBody,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if is_godmode(user):
        return Response(status_code=status.HTTP_202_ACCEPTED)
    msg = Message(room_id=room_id, user_id=user.id, body=payload.body)
    session.add(msg)
    session.flush()
    return {"id": str(msg.id)}
