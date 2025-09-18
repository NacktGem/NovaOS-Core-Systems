import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from ..base import Base


class PlatformFlag(Base):
    __tablename__ = "platform_flags"

    name = sa.Column(sa.String, primary_key=True)
    value = sa.Column(sa.Boolean, nullable=False, default=False)
    updated_at = sa.Column(sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now())
    updated_by = sa.Column(UUID(as_uuid=True), sa.ForeignKey("users.id"), nullable=True)
