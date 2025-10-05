import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from ..base import Base


class Event(Base):
    __tablename__ = "events"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False)
    event_type = sa.Column(sa.String, nullable=False)
    payload = sa.Column(sa.JSON, nullable=False)
    created_at = sa.Column(sa.DateTime, server_default=sa.func.now())
