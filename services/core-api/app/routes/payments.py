import os
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import Purchase, User
from app.security.jwt import get_current_user

router = APIRouter(prefix="/payments", tags=["payments"])

PLATFORM_CUT = float(os.getenv("PLATFORM_CUT", "0.12"))


class UpgradeBody(BaseModel):
    target: str  # "tier" or "palette"
    id: str
    price_cents: int


@router.post("/upgrade")
def upgrade(
    body: UpgradeBody,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    platform = int(body.price_cents * PLATFORM_CUT)
    creator = body.price_cents - platform
    purchase = Purchase(
        user_id=user.id,
        item_type=body.target,
        item_id=body.id,
        gross_cents=body.price_cents,
        platform_cut_cents=platform,
        creator_cut_cents=creator,
    )
    session.add(purchase)
    session.flush()
    return {"platform_cut": platform, "creator_cut": creator}
