import uuid
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from ..base import Base


class Palette(Base):
    __tablename__ = "palettes"

    id = sa.Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = sa.Column(sa.String, unique=True, nullable=False)
    colors = sa.Column(sa.JSON, nullable=False)
    locked = sa.Column(sa.Boolean, default=False)
