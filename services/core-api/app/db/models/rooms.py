import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from ..base import Base


class Room(Base):
    __tablename__ = "rooms"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = sa.Column(sa.String, unique=True, nullable=False)
    private = sa.Column(sa.Boolean, default=False)


class RoomMember(Base):
    __tablename__ = "room_members"

    room_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("rooms.id"), primary_key=True)
    user_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id"), primary_key=True)
