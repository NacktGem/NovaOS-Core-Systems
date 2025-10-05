from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import Palette, Purchase, User
from app.security.jwt import get_current_user

router = APIRouter(prefix="/palettes", tags=["palettes"])


@router.get("/")
def list_palettes(
    user: User = Depends(get_current_user), session: Session = Depends(get_session)
):
    palettes = session.query(Palette).order_by(Palette.name).all()
    purchased = {
        p.item_id
        for p in session.query(Purchase).filter_by(user_id=user.id, item_type="palette")
    }
    result = []
    for p in palettes:
        locked = p.locked and str(p.id) not in purchased
        result.append({"id": str(p.id), "name": p.name, "colors": p.colors, "locked": locked})
    return result
