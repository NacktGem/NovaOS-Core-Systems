# services/echo/app/auth.py

import os
import uuid
from dataclasses import dataclass
from typing import List, Optional, Mapping, Iterable

import jwt
from jwt import InvalidTokenError, ExpiredSignatureError, InvalidAudienceError, InvalidIssuerError
from fastapi import WebSocket, WebSocketException, status

from .deps import get_public_key, extract_jwt_from_cookie


# ---- Config / Constants -----------------------------------------------------

# Allow extending roles via env if you ever need to add a temporary role name:
# e.g., JWT_EXTRA_ROLES="auditor,analyst"
def _load_allowed_roles() -> frozenset[str]:
    base = {"godmode", "superadmin", "admin", "creator", "user"}
    extra = {r.strip().lower() for r in os.getenv("JWT_EXTRA_ROLES", "").split(",") if r.strip()}
    return frozenset(base | extra)

ALLOWED_ROLES = _load_allowed_roles()

# Prevent oversized Authorization/Cookie values from causing unnecessary work
MAX_JWT_CHARS = int(os.getenv("JWT_MAX_LENGTH", "8192"))

# Small, configurable leeway for clock skew
JWT_LEEWAY_SECONDS = int(os.getenv("JWT_LEEWAY_SECONDS", "60"))


# ---- Data model -------------------------------------------------------------

@dataclass(frozen=True)
class UserCtx:
    id: uuid.UUID
    email: str
    role: str
    tiers: List[str]
    token: str

    @property
    def is_godmode(self) -> bool:
        return self.role == "godmode"


# ---- Helpers ----------------------------------------------------------------

def _get_bearer_from_headers(headers: Mapping[str, str]) -> Optional[str]:
    # Starlette headers is case-insensitive Mapping
    auth = headers.get("authorization") or headers.get("Authorization")
    if not auth:
        return None
    s = str(auth).strip()
    if s.lower().startswith("bearer "):
        token = s.split(" ", 1)[1].strip()
        return token or None
    return None


def _coerce_uuid(value: str) -> uuid.UUID:
    try:
        return uuid.UUID(value)
    except Exception as exc:  # noqa: BLE001
        # 401 for invalid/missing sub
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION) from exc


def _coerce_tiers(value: Optional[Iterable[str] | str]) -> List[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [str(x).strip() for x in value if str(x).strip()]
    # accept comma-separated strings as a fallback
    return [s.strip() for s in str(value).split(",") if s.strip()]


def _enforce_token_size(token: str) -> None:
    if len(token) > MAX_JWT_CHARS:
        # Treat as policy violation
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)


# ---- Public API -------------------------------------------------------------

async def get_current_user(ws: WebSocket) -> UserCtx:
    """
    Resolve the current user from the WebSocket handshake:

    1) Prefer Authorization: Bearer <JWT>
    2) Fallback to cookie (httpOnly) via extract_jwt_from_cookie(headers)

    - Validates RS256 signature using the active public key
    - Optional ISS/AUD checks via env (JWT_ISSUER / JWT_AUDIENCE)
    - Requires 'sub' (UUID) and 'exp'
    - Enforces a small clock-skew leeway
    - Strict role allow-list to prevent escalation
    """
    # -- 1) Authorization header
    token = _get_bearer_from_headers(ws.headers)

    # -- 2) Fallback: httpOnly cookie captured during WS handshake
    if not token:
        token = extract_jwt_from_cookie(dict(ws.headers))

    if not token:
        # No credentials provided
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

    _enforce_token_size(token)

    try:
        public_key = await get_public_key()

        # Optional issuer/audience checks via env
        issuer = os.getenv("JWT_ISSUER")
        audience = os.getenv("JWT_AUDIENCE")

        decode_kwargs: dict = {
            "algorithms": ["RS256"],  # prevent alg confusion
            "options": {
                "require": ["sub", "exp"],
            },
            "leeway": JWT_LEEWAY_SECONDS,
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
            # Prevent privilege escalation via arbitrary role names
            raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)

        return UserCtx(
            id=_coerce_uuid(sub),
            email=email,
            role=role,
            tiers=tiers,
            token=token,
        )

    except (ExpiredSignatureError, InvalidAudienceError, InvalidIssuerError, InvalidTokenError):
        # Authentication/authorization failures → 401 (1008)
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION)
    except WebSocketException:
        # Already normalized for WS; bubble up
        raise
    except Exception as exc:  # noqa: BLE001
        # Default to policy violation for unexpected verification issues
        raise WebSocketException(code=status.WS_1008_POLICY_VIOLATION) from exc
