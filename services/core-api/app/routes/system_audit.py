"""System audit configuration endpoints for GodMode control.

Provides endpoints for founders to control audit logging system-wide:
- GET /system/audit/config - Get current audit configuration
- POST /system/audit/config - Update audit configuration
- GET /system/audit/logs - Query audit logs (with filtering)
- DELETE /system/audit/logs - Purge audit logs (founder only)

All endpoints require founder (godmode) role.
"""

import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

from fastapi import APIRouter, HTTPException, Depends, Query
from pydantic import BaseModel, Field
from sqlalchemy import desc, and_, func
from sqlalchemy.orm import Session

from app.db.database import get_session
from app.db.models.audit import AuditLog, SystemConfig
from app.db.models import User
from app.security.jwt import get_current_user


router = APIRouter(prefix="/system", tags=["system", "audit"])


class AuditConfig(BaseModel):
    """Audit configuration model."""

    enabled: bool = Field(description="Whether audit logging is enabled system-wide")
    retention_days: int = Field(default=90, description="Number of days to retain audit logs")
    excluded_paths: List[str] = Field(
        default_factory=list, description="Additional paths to exclude from auditing"
    )
    log_response_bodies: bool = Field(
        default=False, description="Whether to log response bodies (privacy sensitive)"
    )


class AuditConfigResponse(BaseModel):
    """Response model for audit configuration."""

    config: AuditConfig
    updated_by: str
    updated_at: str
    founder_bypass_active: bool = Field(
        default=True, description="Founders always bypass logging regardless of config"
    )


class AuditConfigUpdate(BaseModel):
    """Model for updating audit configuration."""

    enabled: Optional[bool] = None
    retention_days: Optional[int] = Field(None, ge=1, le=365)
    excluded_paths: Optional[List[str]] = None
    log_response_bodies: Optional[bool] = None


class AuditLogEntry(BaseModel):
    """Audit log entry response model."""

    id: str
    user_id: Optional[str]
    username: Optional[str]
    role: Optional[str]
    method: str
    path: str
    query_params: Optional[str]
    user_agent: Optional[str]
    ip_address: Optional[str]
    status_code: str
    response_time_ms: Optional[str]
    action: str
    resource: Optional[str]
    outcome: str
    details: Optional[Dict[str, Any]]
    timestamp: str


class AuditLogsResponse(BaseModel):
    """Response model for audit logs query."""

    logs: List[AuditLogEntry]
    total_count: int
    page: int
    page_size: int
    has_next: bool


def require_founder(user: User = Depends(get_current_user)) -> User:
    """Require founder (godmode) role for audit configuration access."""
    if user.role not in ["godmode", "founder"]:
        raise HTTPException(
            status_code=403, detail="Access denied. Audit configuration is restricted to founders."
        )
    return user


@router.get("/audit/config", response_model=AuditConfigResponse)
def get_audit_config(
    user: User = Depends(require_founder),
    session: Session = Depends(get_session),
):
    """Get current audit configuration."""
    config_entry = session.query(SystemConfig).filter(SystemConfig.key == "audit_enabled").first()

    if config_entry:
        config_data = config_entry.value
        config = AuditConfig(**config_data)
        return AuditConfigResponse(
            config=config,
            updated_by=config_entry.updated_by,
            updated_at=config_entry.updated_at.isoformat(),
            founder_bypass_active=True,
        )
    else:
        # Return default configuration
        default_config = AuditConfig(enabled=True)
        return AuditConfigResponse(
            config=default_config,
            updated_by="system",
            updated_at=datetime.now(timezone.utc).isoformat(),
            founder_bypass_active=True,
        )


@router.post("/audit/config", response_model=AuditConfigResponse)
def update_audit_config(
    update: AuditConfigUpdate,
    user: User = Depends(require_founder),
    session: Session = Depends(get_session),
):
    """Update audit configuration. Only founders can modify these settings."""
    # Get existing config or create default
    config_entry = session.query(SystemConfig).filter(SystemConfig.key == "audit_enabled").first()

    if config_entry:
        current_config = AuditConfig(**config_entry.value)
    else:
        current_config = AuditConfig(enabled=True)

    # Apply updates
    if update.enabled is not None:
        current_config.enabled = update.enabled
    if update.retention_days is not None:
        current_config.retention_days = update.retention_days
    if update.excluded_paths is not None:
        current_config.excluded_paths = update.excluded_paths
    if update.log_response_bodies is not None:
        current_config.log_response_bodies = update.log_response_bodies

    # Save to database
    if config_entry:
        config_entry.value = current_config.dict()
        config_entry.updated_by = user.id
        config_entry.updated_at = datetime.now(timezone.utc)
    else:
        config_entry = SystemConfig(
            key="audit_enabled",
            value=current_config.dict(),
            updated_by=user.id,
            updated_at=datetime.now(timezone.utc),
        )
        session.add(config_entry)

    session.commit()

    # Clear Redis cache to force reload
    # TODO: Add Redis cache invalidation here if Redis is available

    return AuditConfigResponse(
        config=current_config,
        updated_by=user.username or user.id,
        updated_at=config_entry.updated_at.isoformat(),
        founder_bypass_active=True,
    )


@router.get("/audit/logs", response_model=AuditLogsResponse)
def get_audit_logs(
    user: User = Depends(require_founder),
    session: Session = Depends(get_session),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=1000, description="Items per page"),
    user_filter: Optional[str] = Query(None, description="Filter by username"),
    action_filter: Optional[str] = Query(None, description="Filter by action"),
    outcome_filter: Optional[str] = Query(None, description="Filter by outcome (success/error)"),
    hours: Optional[int] = Query(24, ge=1, le=8760, description="Hours of history to include"),
    start_date: Optional[str] = Query(None, description="Start date (ISO format)"),
    end_date: Optional[str] = Query(None, description="End date (ISO format)"),
):
    """Get audit logs with filtering and pagination."""
    query = session.query(AuditLog)

    # Apply filters
    filters = []

    # Date range filtering
    if start_date and end_date:
        try:
            start_dt = datetime.fromisoformat(start_date.replace("Z", "+00:00"))
            end_dt = datetime.fromisoformat(end_date.replace("Z", "+00:00"))
            filters.append(and_(AuditLog.timestamp >= start_dt, AuditLog.timestamp <= end_dt))
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid date format. Use ISO format.")
    elif hours:
        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)
        filters.append(AuditLog.timestamp >= cutoff_time)

    if user_filter:
        filters.append(AuditLog.username.ilike(f"%{user_filter}%"))

    if action_filter:
        filters.append(AuditLog.action == action_filter)

    if outcome_filter:
        filters.append(AuditLog.outcome == outcome_filter)

    if filters:
        query = query.filter(and_(*filters))

    # Get total count for pagination
    total_count = query.count()

    # Apply pagination and ordering
    offset = (page - 1) * page_size
    logs = query.order_by(desc(AuditLog.timestamp)).offset(offset).limit(page_size).all()

    # Convert to response format
    log_entries = []
    for log in logs:
        log_entries.append(
            AuditLogEntry(
                id=log.id,
                user_id=log.user_id,
                username=log.username,
                role=log.role,
                method=log.method,
                path=log.path,
                query_params=log.query_params,
                user_agent=log.user_agent,
                ip_address=log.ip_address,
                status_code=log.status_code,
                response_time_ms=log.response_time_ms,
                action=log.action,
                resource=log.resource,
                outcome=log.outcome,
                details=log.details,
                timestamp=log.timestamp.isoformat(),
            )
        )

    has_next = (offset + page_size) < total_count

    return AuditLogsResponse(
        logs=log_entries, total_count=total_count, page=page, page_size=page_size, has_next=has_next
    )


@router.get("/audit/stats")
def get_audit_stats(
    user: User = Depends(require_founder),
    session: Session = Depends(get_session),
    hours: int = Query(24, ge=1, le=8760, description="Hours of history for stats"),
):
    """Get audit statistics for the GodMode dashboard."""
    cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)

    # Basic counts
    total_events = (
        session.query(func.count(AuditLog.id)).filter(AuditLog.timestamp >= cutoff_time).scalar()
    )

    successful_events = (
        session.query(func.count(AuditLog.id))
        .filter(and_(AuditLog.timestamp >= cutoff_time, AuditLog.outcome == "success"))
        .scalar()
    )

    error_events = (
        session.query(func.count(AuditLog.id))
        .filter(and_(AuditLog.timestamp >= cutoff_time, AuditLog.outcome == "error"))
        .scalar()
    )

    unique_users = (
        session.query(func.count(func.distinct(AuditLog.user_id)))
        .filter(and_(AuditLog.timestamp >= cutoff_time, AuditLog.user_id.isnot(None)))
        .scalar()
    )

    # Top actions
    top_actions = (
        session.query(AuditLog.action, func.count(AuditLog.action).label("count"))
        .filter(AuditLog.timestamp >= cutoff_time)
        .group_by(AuditLog.action)
        .order_by(desc("count"))
        .limit(10)
        .all()
    )

    # Top users (non-founders)
    top_users = (
        session.query(
            AuditLog.username, AuditLog.role, func.count(AuditLog.username).label("count")
        )
        .filter(
            and_(
                AuditLog.timestamp >= cutoff_time,
                AuditLog.username.isnot(None),
                AuditLog.role.notin_(["godmode", "founder"]),  # Exclude founders from stats
            )
        )
        .group_by(AuditLog.username, AuditLog.role)
        .order_by(desc("count"))
        .limit(10)
        .all()
    )

    return {
        "timeframe_hours": hours,
        "total_events": total_events or 0,
        "successful_events": successful_events or 0,
        "error_events": error_events or 0,
        "unique_users": unique_users or 0,
        "success_rate": (
            round((successful_events / total_events * 100), 2) if total_events > 0 else 0
        ),
        "top_actions": [{"action": action, "count": count} for action, count in top_actions],
        "top_users": [
            {"username": username, "role": role, "count": count}
            for username, role, count in top_users
        ],
        "founder_bypass_note": "Founders (godmode role) bypass all audit logging and do not appear in these statistics.",
    }


@router.delete("/audit/logs")
def purge_audit_logs(
    user: User = Depends(require_founder),
    session: Session = Depends(get_session),
    days: int = Query(30, ge=1, le=365, description="Purge logs older than this many days"),
    confirm: bool = Query(False, description="Confirmation required for purge operation"),
):
    """Purge old audit logs. Requires confirmation."""
    if not confirm:
        raise HTTPException(
            status_code=400,
            detail="Purge operation requires confirmation. Set confirm=true parameter.",
        )

    cutoff_date = datetime.now(timezone.utc) - timedelta(days=days)

    # Count logs to be deleted
    logs_to_delete = (
        session.query(func.count(AuditLog.id)).filter(AuditLog.timestamp < cutoff_date).scalar()
    )

    if logs_to_delete == 0:
        return {
            "message": f"No audit logs older than {days} days found.",
            "deleted_count": 0,
            "cutoff_date": cutoff_date.isoformat(),
        }

    # Delete the logs
    deleted_count = session.query(AuditLog).filter(AuditLog.timestamp < cutoff_date).delete()

    session.commit()

    return {
        "message": f"Successfully purged {deleted_count} audit log entries older than {days} days.",
        "deleted_count": deleted_count,
        "cutoff_date": cutoff_date.isoformat(),
        "performed_by": user.username or user.id,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
