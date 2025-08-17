# services/echo/app/auth.py

import os
import uuid
from dataclasses import dataclass
from typing import List, Optional

import jwt
from jwt import InvalidTokenError, ExpiredSignatureError, InvalidAudienceError, InvalidIssuerError
from fastapi import WebSocket, HTTPException, status

from .deps import get_public_key, extract_jwt_from_cookie


ALLOWED_ROLES = {"godmode", "superadmin", "admin", "creator", "user"}


@dataclass
class UserCtx:
    id: uuid.UUID
    email: str
    role: str
    tiers: List[str]
    token: str

    @property
    def is_godmode(self) -> bool:
        return self.role == "godmode"


def _get_bearer_from_headers(headers) -> Optional[str]:
    # Starlette headers is a case-insensitive Mapping
    auth = headers.get("authorization") or headers.get("Authorization")
    if not auth:
        return None
    auth = str(auth)
    if auth.lower().startswith("bearer "):
        return auth.split(" ", 1)[1].strip()
    return None


def _coerce_uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED) from exc


def _coerce_tiers(value) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x) for x in value]
    # accept comma-separated strings as a fallback
    return [s.strip() for s in str(value).split(",") if s.strip()]


async def get_current_user(ws: WebSocket) -> UserCtx:
    """
    Resolve the current user from the WebSocket handshake:
    1) Prefer Authorization: Bearer <JWT>
    2) Fallback to cookie (httpOnly) via extract_jwt_from_cookie(headers)
    Validates RS256 signature with optional ISS/AUD checks and small leeway.
    """
    # 1) Try Authorization header
    token = _get_bearer_from_headers(ws.headers)

    # 2) Fallback to cookie in the WS handshake
    if not token:
        # extract_jwt_from_cookie may expect a plain dict; coerce defensively
        token = extract_jwt_from_cookie(dict(ws.headers))

    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

    try:
        public_key = await get_public_key()

        # Optional issuer/audience checks via env
        issuer = os.getenv("JWT_ISSUER")
        audience = os.getenv("JWT_AUDIENCE")

        decode_kwargs = {
            "algorithms": ["RS256"],
            "options": {
                "require": ["sub", "exp"],
            },
            "leeway": 60,  # tolerate small clock skew
        }
        if issuer:
            decode_kwargs["issuer"] = issuer
        if audience:
            decode_kwargs["audience"] = audience

        claims = jwt.decode(token, public_key, **decode_kwargs)

        sub = claims.get("sub")
        email = (claims.get("email") or "").strip().lower()
        role = (claims.get("role") or "user").strip().lower()
        tiers = _coerce_tiers(claims.get("tiers"))

        if role not in ALLOWED_ROLES:
            # Prevent privilege escalation via arbitrary roles
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)

        return UserCtx(
            id=_coerce_uuid(sub),
            email=email,
            role=role,
            tiers=tiers,
            token=token,
        )

    except (ExpiredSignatureError, InvalidAudienceError, InvalidIssuerError) as exc:
        # Precise auth failures → 401
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED) from exc
    except InvalidTokenError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED) from exc
    except HTTPException:
        # Already well-formed; bubble up
        raise
    except Exception as exc:  # noqa: BLE001
        # Default to 401 for any unexpected verification issues
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED) from exc
