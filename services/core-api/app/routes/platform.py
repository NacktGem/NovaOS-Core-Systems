import os
from typing import Dict

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import PlatformFlag, User
from app.middleware.rbac import is_godmode
from app.security.jwt import get_current_user

router = APIRouter(prefix="/platform", tags=["platform"])

_FLAG_DEFAULTS: Dict[str, bool] = {
    "admin_calm_mode": True,
    "nsfw_enabled": False,
    "consent_lockdown": False,
}

_ALLOWED_OVERRIDE_ROLES = {
    role.strip().lower()
    for role in os.getenv("PLATFORM_FLAG_OVERRIDE_ROLES", "godmode,superadmin").split(",")
    if role.strip()
}


def _ensure_defaults(session: Session) -> Dict[str, PlatformFlag]:
    records = {flag.name: flag for flag in session.query(PlatformFlag).all()}
    dirty = False
    for name, default_value in _FLAG_DEFAULTS.items():
        if name not in records:
            flag = PlatformFlag(name=name, value=default_value)
            session.add(flag)
            records[name] = flag
            dirty = True
    if dirty:
        session.flush()
    return records


@router.get("/flags")
def get_flags(
    session: Session = Depends(get_session),
    _: User = Depends(get_current_user),
):
    flags = _ensure_defaults(session)
    return {
        "flags": {
            name: {
                "value": record.value,
                "updated_at": record.updated_at,
                "updated_by": str(record.updated_by) if record.updated_by else None,
            }
            for name, record in flags.items()
        }
    }


class FlagUpdateBody(BaseModel):
    value: bool


@router.put("/flags/{flag_name}")
def update_flag(
    flag_name: str,
    body: FlagUpdateBody,
    session: Session = Depends(get_session),
    user: User = Depends(get_current_user),
):
    normalized = flag_name.strip().lower()
    if normalized not in _FLAG_DEFAULTS:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="unknown flag")

    if not (is_godmode(user) or user.role.lower() in _ALLOWED_OVERRIDE_ROLES):
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="forbidden")

    flags = _ensure_defaults(session)
    record = flags[normalized]
    record.value = body.value
    if not is_godmode(user):
        record.updated_by = user.id
    session.flush()
    return {
        "name": normalized,
        "value": record.value,
        "updated_at": record.updated_at,
        "updated_by": str(record.updated_by) if record.updated_by else None,
    }
