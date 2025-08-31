import os
import time
import uuid
from typing import Any, Dict

from fastapi import Cookie, Depends, HTTPException
from jose import jwt
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import User

ALGORITHM = "RS256"
LIFETIME_SECONDS = int(os.getenv("JWT_LIFETIME", "900"))


def _read_key(path_env_name: str) -> bytes:
    path = os.getenv(path_env_name)
    if not path:
        raise RuntimeError(f"{path_env_name} is not set in environment; set it to the PEM file path.")
    try:
        with open(path, "rb") as f:
            return f.read()
    except FileNotFoundError:
        raise RuntimeError(f"Key file not found at {path} (env {path_env_name}).")


def _get_private_key() -> bytes:
    return _read_key("JWT_PRIVATE_KEY_PATH")


def _get_public_key() -> bytes:
    return _read_key("JWT_PUBLIC_KEY_PATH")


def create_token(sub: str, claims: Dict[str, Any]) -> str:
    payload = {
        "sub": sub,
        "iat": int(time.time()),
        "exp": int(time.time()) + LIFETIME_SECONDS,
    }
    payload.update(claims)
    private = _get_private_key()
    return jwt.encode(payload, private, algorithm=ALGORITHM)


def verify_token(token: str) -> Dict[str, Any]:
    public = _get_public_key()
    return jwt.decode(token, public, algorithms=[ALGORITHM])


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
