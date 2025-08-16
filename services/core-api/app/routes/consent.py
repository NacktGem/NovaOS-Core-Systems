from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import Consent, User
from app.security.jwt import get_current_user

router = APIRouter(prefix="/consent", tags=["consent"])


class ConsentBody(BaseModel):
    partner_name: str
    content_ids: list[str]
    signed_at: str | None = None
    meta: dict | None = None


@router.post("/upload")
def upload_consent(
    body: ConsentBody,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    consent = Consent(
        user_id=user.id,
        partner_name=body.partner_name,
        content_ids=body.content_ids,
        meta=body.meta,
    )
    session.add(consent)
    session.flush()
    return {"id": str(consent.id)}
