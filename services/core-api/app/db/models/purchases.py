import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from ..base import Base


class Purchase(Base):
    __tablename__ = "purchases"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False)
    item_type = sa.Column(sa.String, nullable=False)
    item_id = sa.Column(sa.String, nullable=False)
    gross_cents = sa.Column(sa.Integer, nullable=False)
    platform_cut_cents = sa.Column(sa.Integer, nullable=False)
    creator_cut_cents = sa.Column(sa.Integer, nullable=False)
    created_at = sa.Column(sa.DateTime, server_default=sa.func.now())
