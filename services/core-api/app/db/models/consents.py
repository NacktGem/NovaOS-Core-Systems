import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from ..base import Base


class Consent(Base):
    __tablename__ = "consents"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=False)
    partner_name = sa.Column(sa.String, nullable=False)
    content_ids = sa.Column(sa.JSON, nullable=False)
    signed_at = sa.Column(sa.DateTime, server_default=sa.func.now())
    meta = sa.Column(sa.JSON)
