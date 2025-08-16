import os
import time
import uuid
from typing import Any, Dict

from fastapi import Cookie, Depends, HTTPException
from jose import jwt
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import User

PRIVATE_KEY_PATH = os.getenv("JWT_PRIVATE_KEY_PATH")
PUBLIC_KEY_PATH = os.getenv("JWT_PUBLIC_KEY_PATH")
ALGORITHM = "RS256"
LIFETIME_SECONDS = int(os.getenv("JWT_LIFETIME", "900"))

with open(PRIVATE_KEY_PATH, "rb") as f:
    _private_key = f.read()
with open(PUBLIC_KEY_PATH, "rb") as f:
    _public_key = f.read()


def create_token(sub: str, claims: Dict[str, Any]) -> str:
    payload = {"sub": sub, "iat": int(time.time()), "exp": int(time.time()) + LIFETIME_SECONDS}
    payload.update(claims)
    return jwt.encode(payload, _private_key, algorithm=ALGORITHM)


def verify_token(token: str) -> Dict[str, Any]:
    return jwt.decode(token, _public_key, algorithms=[ALGORITHM])


def get_current_user(
    token: str | None = Cookie(default=None, alias="access_token"),
    session: Session = Depends(get_session),
) -> User:
    if not token:
        raise HTTPException(status_code=401)
    try:
        data = verify_token(token)
        user_id = uuid.UUID(data["sub"])
    except Exception as exc:
        raise HTTPException(status_code=401) from exc
    user = session.get(User, user_id)
    if not user:
        raise HTTPException(status_code=401)
    return user
