from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import Room, RoomMember, User
from app.security.jwt import get_current_user

router = APIRouter(prefix="/rooms", tags=["rooms"])


@router.get("/")
def list_rooms(
    user: User = Depends(get_current_user), session: Session = Depends(get_session)
):
    query = session.query(Room)
    if user.role != "godmode":
        member_room_ids = [rm.room_id for rm in session.query(RoomMember).filter_by(user_id=user.id)]
        query = query.filter(
            (Room.private.is_(False)) | (Room.id.in_(member_room_ids))
        )
    rooms = query.order_by(Room.name).all()
    return [{"id": str(r.id), "name": r.name, "private": r.private} for r in rooms]
