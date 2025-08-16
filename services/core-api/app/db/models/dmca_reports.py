import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from ..base import Base


class DMCAReport(Base):
    __tablename__ = "dmca_reports"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    reporter_email = sa.Column(sa.String, nullable=False)
    content_ref = sa.Column(sa.String, nullable=False)
    details = sa.Column(sa.Text, nullable=False)
    created_at = sa.Column(sa.DateTime, server_default=sa.func.now())
