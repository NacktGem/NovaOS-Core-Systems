import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from ..base import Base


class User(Base):
    __tablename__ = "users"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = sa.Column(sa.String, unique=True, nullable=False, index=True)
    password_hash = sa.Column(sa.Text, nullable=False)
    role = sa.Column(sa.String, sa.ForeignKey("roles.name"), nullable=False)
    tiers = sa.Column(sa.JSON, default=list)
    created_at = sa.Column(sa.DateTime, server_default=sa.func.now())
    updated_at = sa.Column(
        sa.DateTime, server_default=sa.func.now(), onupdate=sa.func.now()
    )
    is_active = sa.Column(sa.Boolean, default=True)
