from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
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
    signed_at = None
    if body.signed_at:
        try:
            signed_at = datetime.fromisoformat(body.signed_at)
        except ValueError as exc:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="invalid signed_at",
            ) from exc
    consent = Consent(
        user_id=user.id,
        partner_name=body.partner_name,
        content_ids=body.content_ids,
        signed_at=signed_at,
        meta=body.meta,
    )
    session.add(consent)
    session.flush()
    return {
        "id": str(consent.id),
        "partner_name": consent.partner_name,
        "content_ids": consent.content_ids,
        "signed_at": consent.signed_at,
        "meta": consent.meta,
    }


@router.get("/")
def list_consents(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    consents = (
        session.query(Consent)
        .filter(Consent.user_id == user.id)
        .order_by(Consent.signed_at.desc())
        .all()
    )
    return [
        {
            "id": str(consent.id),
            "partner_name": consent.partner_name,
            "content_ids": consent.content_ids,
            "signed_at": consent.signed_at,
            "meta": consent.meta,
        }
        for consent in consents
    ]
