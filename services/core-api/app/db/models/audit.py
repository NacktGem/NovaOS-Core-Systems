"""Audit logging database models for tracking user actions and system access."""

from datetime import datetime, timezone
from sqlalchemy import Column, String, DateTime, Text, JSON, Index
from app.db.database import Base


class AuditLog(Base):
    """Audit log entries for tracking user actions across the platform.

    Founders (godmode role) bypass all logging regardless of system settings.
    All other users are subject to audit logging when enabled.
    """

    __tablename__ = "audit_logs"

    id = Column(String, primary_key=True)
    user_id = Column(String, index=True, nullable=True)  # None for system actions
    username = Column(String, nullable=True)
    role = Column(String, index=True, nullable=True)

    # Request details
    method = Column(String, nullable=False)  # GET, POST, etc.
    path = Column(String, nullable=False)  # /vault/items/123
    query_params = Column(Text, nullable=True)  # ?filter=premium&sort=date
    user_agent = Column(String, nullable=True)
    ip_address = Column(String, nullable=True)
    request_id = Column(String, index=True, nullable=True)

    # Response details
    status_code = Column(String, nullable=False)
    response_time_ms = Column(String, nullable=True)

    # Audit metadata
    action = Column(String, nullable=False)  # "vault_access", "profile_view", etc.
    resource = Column(String, nullable=True)  # Resource being accessed
    outcome = Column(String, nullable=False)  # "success", "denied", "error"
    details = Column(JSON, nullable=True)  # Additional context

    # Timestamps
    timestamp = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    # Indexes for performance
    __table_args__ = (
        Index("idx_audit_user_timestamp", user_id, timestamp),
        Index("idx_audit_action_timestamp", action, timestamp),
        Index("idx_audit_resource_timestamp", resource, timestamp),
        Index("idx_audit_role_timestamp", role, timestamp),
    )

    def __repr__(self):
        return f"<AuditLog(id={self.id}, user={self.username}, action={self.action}, timestamp={self.timestamp})>"


class SystemConfig(Base):
    """System configuration settings including audit controls.

    Used to store the audit_enabled flag and other system-wide settings.
    Only accessible by founders (godmode role).
    """

    __tablename__ = "system_config"

    key = Column(String, primary_key=True)
    value = Column(JSON, nullable=False)
    updated_by = Column(String, nullable=False)  # User ID who made the change
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), nullable=False)

    def __repr__(self):
        return f"<SystemConfig(key={self.key}, value={self.value}, updated_by={self.updated_by})>"
