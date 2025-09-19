from __future__ import annotations

from sqlalchemy import JSON, Column, DateTime, String
from sqlalchemy.sql import func

from app.db.base import Base


class AgentRecord(Base):
    """Persistent registry of NovaOS agents."""

    __tablename__ = "agents_registry"

    name = Column(String(64), primary_key=True, index=True)
    display_name = Column(String(128), nullable=False)
    version = Column(String(32), nullable=False)
    status = Column(String(32), nullable=False, default="unknown")
    host = Column(String(128), nullable=True)
    capabilities = Column(JSON, nullable=False, default=list)
    environment = Column(String(32), nullable=False, default="production")
    last_seen = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
    details = Column(JSON, nullable=False, default=dict)
