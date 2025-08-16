import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from ..base import Base


class Message(Base):
    __tablename__ = "messages"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    room_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("rooms.id"), index=True, nullable=False)
    user_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True)
    body = sa.Column(sa.Text, nullable=False)
    created_at = sa.Column(sa.DateTime, server_default=sa.func.now(), index=True)

    __table_args__ = (
        sa.Index("ix_messages_room_created_at", "room_id", "created_at"),
    )
