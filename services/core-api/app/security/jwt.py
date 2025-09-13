import os
import time
import uuid
from typing import Any, Dict

from fastapi import Cookie, Depends, HTTPException
from jose import jwt
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import User

# 🔐 Load key paths from environment (set by Docker)
PRIVATE_KEY_PATH = os.getenv("JWT_PRIVATE_KEY_PATH")
PUBLIC_KEY_PATH = os.getenv("JWT_PUBLIC_KEY_PATH")
ALGORITHM = "RS256"
LIFETIME_SECONDS = int(os.getenv("JWT_LIFETIME", "900"))

# 🚫 Fail fast if env vars are missing
if not PRIVATE_KEY_PATH or not PUBLIC_KEY_PATH:
    raise RuntimeError("JWT_PRIVATE_KEY_PATH or JWT_PUBLIC_KEY_PATH is not set in environment.")
import os
import time
import uuid
from typing import Any, Dict, Optional

from fastapi import Cookie, Depends, HTTPException
from jose import jwt
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import User

ALGORITHM = "RS256"
LIFETIME_SECONDS = int(os.getenv("JWT_LIFETIME", "900"))


def _read_file(path: str) -> Optional[str]:
    try:
        with open(path, "r") as fh:
            return fh.read()
    except Exception:
        return None


def _load_key(env_name: str) -> Optional[str]:
    """Load a key either directly from an environment variable (PEM string)
    or from a path to a file provided in the env var. Returns None if not found.
    """
    val = os.environ.get(env_name)
    if not val:
        return None
    # If it looks like a PEM blob, return directly
    if "BEGIN PRIVATE KEY" in val or "BEGIN RSA PRIVATE KEY" in val or "BEGIN PUBLIC KEY" in val:
        return val
    # Otherwise treat val as a path
    return _read_file(val)


def create_token(sub: str, claims: Dict[str, Any]) -> str:
    private = _load_key("JWT_PRIVATE_KEY_PATH") or _load_key("JWT_PRIVATE_KEY")
    if not private:
        raise RuntimeError("Private key not configured")
    payload = {
        "sub": sub,
        "iat": int(time.time()),
        "exp": int(time.time()) + LIFETIME_SECONDS,
    }
    payload.update(claims)
    return jwt.encode(payload, private, algorithm=ALGORITHM)


def verify_token(token: str) -> Dict[str, Any]:
    public = _load_key("JWT_PUBLIC_KEY_PATH") or _load_key("JWT_PUBLIC_KEY")
    if not public:
        raise RuntimeError("Public key not configured")
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
