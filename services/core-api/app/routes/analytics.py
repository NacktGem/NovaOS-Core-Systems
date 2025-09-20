from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session
from sqlalchemy import func, distinct
from datetime import datetime, timedelta
from typing import List, Dict, Any

from app.db.base import get_session
from app.db.models import AnalyticsEvent, User, Purchase
from app.security.jwt import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


class EventPayload(BaseModel):
    event_name: str
    props: dict
    ts: str | None = None


class IngestBody(BaseModel):
    events: list[EventPayload]


class SystemStats(BaseModel):
    active_users_daily: int
    active_users_weekly: int
    total_transactions: int
    total_events: int
    last_updated: str


class NSFWFlaggedContent(BaseModel):
    id: str
    content_type: str  # "image", "text", "video"
    content_snippet: str | None  # First 100 chars for text, thumbnail URL for media
    user_id: str | None
    agent_id: str | None
    model_confidence: float  # 0.0 - 1.0
    model_name: str  # "yolov5-nsfw-image", "roberta-nsfw-text", etc.
    flagged_at: str
    status: str  # "pending", "approved", "rejected", "escalated"
    reviewed_by: str | None
    reviewed_at: str | None
    consent_verified: bool | None  # Cross-check with consent records


class NSFWActionRequest(BaseModel):
    content_id: str
    action: str  # "approve", "reject", "escalate"
    notes: str | None = None


class NSFWStats(BaseModel):
    total_flagged: int
    pending_review: int
    approved: int
    rejected: int
    escalated: int
    consent_violations: int
    top_models: List[Dict[str, Any]]
    flagging_rate_24h: float
    last_updated: str


@router.post("/ingest")
def ingest(
    body: IngestBody,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    for e in body.events:
        evt = AnalyticsEvent(user_id=user.id, event_name=e.event_name, props=e.props)
        session.add(evt)
    session.flush()
    return {"count": len(body.events)}


@router.get("/events")
def list_events(
    limit: int = 25,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    if user.role not in {"godmode", "superadmin"}:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")
    query = session.query(AnalyticsEvent).order_by(AnalyticsEvent.created_at.desc())
    events = query.limit(max(1, min(limit, 100))).all()
    return [
        {
            "id": str(event.id),
            "event_name": event.event_name,
            "props": event.props,
            "created_at": event.created_at,
        }
        for event in events
    ]


@router.get("/system/stats")
def get_system_stats(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get system statistics for GodMode dashboard"""
    if user.role != "godmode":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    now = datetime.utcnow()
    day_ago = now - timedelta(days=1)
    week_ago = now - timedelta(days=7)

    # Active users (daily and weekly)
    daily_users = (
        session.query(distinct(AnalyticsEvent.user_id))
        .filter(AnalyticsEvent.created_at >= day_ago)
        .count()
    )

    weekly_users = (
        session.query(distinct(AnalyticsEvent.user_id))
        .filter(AnalyticsEvent.created_at >= week_ago)
        .count()
    )

    # Transaction counts
    total_transactions = session.query(func.count(Purchase.id)).scalar() or 0

    # Total events
    total_events = session.query(func.count(AnalyticsEvent.id)).scalar() or 0

    return SystemStats(
        active_users_daily=daily_users,
        active_users_weekly=weekly_users,
        total_transactions=total_transactions,
        total_events=total_events,
        last_updated=now.isoformat(),
    )


@router.get("/events/recent")
def get_recent_events(
    limit: int = 10,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get recent events for GodMode dashboard"""
    if user.role != "godmode":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    events = (
        session.query(AnalyticsEvent).order_by(AnalyticsEvent.created_at.desc()).limit(limit).all()
    )

    return [
        {
            "id": str(event.id),
            "event_name": event.event_name,
            "props": event.props,
            "created_at": event.created_at.isoformat(),
            "user_id": str(event.user_id) if event.user_id else None,
        }
        for event in events
    ]


# NSFW Monitoring Endpoints
@router.get("/nsfw/flagged", response_model=List[NSFWFlaggedContent])
def get_flagged_content(
    status: str | None = None,  # Filter by status
    limit: int = 25,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get NSFW flagged content for moderation dashboard"""
    if user.role not in ["godmode", "jules", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Mock data - replace with actual database queries to NSFW flagged content table
    flagged_items = [
        NSFWFlaggedContent(
            id="nsfw_001",
            content_type="image",
            content_snippet="/uploads/flagged_image_thumb.jpg",
            user_id="user_123",
            agent_id="agent_velora",
            model_confidence=0.89,
            model_name="yolov5-nsfw-image",
            flagged_at=(datetime.utcnow() - timedelta(hours=2)).isoformat(),
            status="pending",
            reviewed_by=None,
            reviewed_at=None,
            consent_verified=False,
        ),
        NSFWFlaggedContent(
            id="nsfw_002",
            content_type="text",
            content_snippet="This is explicit content that was detected by the NSFW text classifier...",
            user_id="user_456",
            agent_id="agent_lyra",
            model_confidence=0.92,
            model_name="roberta-nsfw-text",
            flagged_at=(datetime.utcnow() - timedelta(hours=5)).isoformat(),
            status="pending",
            reviewed_by=None,
            reviewed_at=None,
            consent_verified=True,
        ),
        NSFWFlaggedContent(
            id="nsfw_003",
            content_type="image",
            content_snippet="/uploads/flagged_image2_thumb.jpg",
            user_id="user_789",
            agent_id="agent_riven",
            model_confidence=0.76,
            model_name="nsfw-image-detector",
            flagged_at=(datetime.utcnow() - timedelta(hours=8)).isoformat(),
            status="escalated",
            reviewed_by="jules",
            reviewed_at=(datetime.utcnow() - timedelta(hours=1)).isoformat(),
            consent_verified=None,
        ),
    ]

    # Filter by status if provided
    if status:
        flagged_items = [item for item in flagged_items if item.status == status]

    return flagged_items[:limit]


@router.post("/nsfw/action")
def take_nsfw_action(
    action_request: NSFWActionRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Take action on flagged NSFW content"""
    if user.role not in ["godmode", "jules", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Mock implementation - replace with actual database updates
    valid_actions = ["approve", "reject", "escalate"]
    if action_request.action not in valid_actions:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid action")

    # Log the action
    action_event = AnalyticsEvent(
        user_id=user.id,
        event_name="nsfw_moderation_action",
        props={
            "content_id": action_request.content_id,
            "action": action_request.action,
            "notes": action_request.notes,
            "moderator": user.username,
        },
    )
    session.add(action_event)
    session.commit()

    return {
        "success": True,
        "content_id": action_request.content_id,
        "action": action_request.action,
        "processed_by": user.username,
        "processed_at": datetime.utcnow().isoformat(),
    }


@router.get("/nsfw/stats", response_model=NSFWStats)
def get_nsfw_stats(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get NSFW detection and moderation statistics"""
    if user.role not in ["godmode", "jules", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Mock statistics - replace with actual database aggregations
    return NSFWStats(
        total_flagged=47,
        pending_review=8,
        approved=23,
        rejected=12,
        escalated=4,
        consent_violations=3,
        top_models=[
            {"model_name": "yolov5-nsfw-image", "detections": 28, "accuracy": 0.91},
            {"model_name": "roberta-nsfw-text", "detections": 15, "accuracy": 0.87},
            {"model_name": "nsfw-image-detector", "detections": 4, "accuracy": 0.82},
        ],
        flagging_rate_24h=0.034,  # 3.4% of content flagged in last 24h
        last_updated=datetime.utcnow().isoformat(),
    )


@router.post("/nsfw/verify-consent")
def verify_consent_for_nsfw_content(
    content_ids: List[str],
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Verify consent records for multiple NSFW flagged content items"""
    if user.role not in ["godmode", "jules", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Mock implementation - replace with actual consent record lookups
    consent_results = []

    for content_id in content_ids:
        # In a real implementation, this would:
        # 1. Look up the content record from NSFW flagged table
        # 2. Get the associated user_id and agent_id
        # 3. Query the consent records for that user/agent combination
        # 4. Check if consent covers the specific content type and timestamp

        # Mock logic for demonstration
        mock_result = {
            "content_id": content_id,
            "consent_status": (
                "verified"
                if content_id.endswith("002")
                else "violated" if content_id.endswith("001") else "pending"
            ),
            "consent_record_id": (
                f"consent_{content_id}" if not content_id.endswith("003") else None
            ),
            "consent_date": (
                (datetime.utcnow() - timedelta(days=30)).isoformat()
                if not content_id.endswith("001")
                else None
            ),
            "consent_scope": (
                ["explicit_content", "image_sharing"]
                if content_id.endswith("002")
                else ["basic_interaction"]
            ),
            "user_age_verified": True if content_id.endswith("002") else False,
            "violation_reason": (
                "No consent for explicit content" if content_id.endswith("001") else None
            ),
            "requires_action": content_id.endswith("001") or content_id.endswith("003"),
        }
        consent_results.append(mock_result)

    return {
        "results": consent_results,
        "summary": {
            "total_checked": len(content_ids),
            "verified": len([r for r in consent_results if r["consent_status"] == "verified"]),
            "violated": len([r for r in consent_results if r["consent_status"] == "violated"]),
            "pending": len([r for r in consent_results if r["consent_status"] == "pending"]),
        },
        "checked_at": datetime.utcnow().isoformat(),
    }
