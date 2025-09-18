from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import AnalyticsEvent, User
from app.security.jwt import get_current_user

router = APIRouter(prefix="/analytics", tags=["analytics"])


class EventPayload(BaseModel):
    event_name: str
    props: dict
    ts: str | None = None


class IngestBody(BaseModel):
    events: list[EventPayload]


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
