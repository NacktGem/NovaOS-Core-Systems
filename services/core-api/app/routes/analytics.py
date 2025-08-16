from fastapi import APIRouter, Depends
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
