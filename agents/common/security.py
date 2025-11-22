"""JWT verification and RBAC helpers shared across NovaOS agents."""
from __future__ import annotations

import os
from dataclasses import dataclass
from datetime import datetime, timezone
from functools import lru_cache
from typing import Iterable, Mapping, Optional, Sequence

import jwt
from jwt import ExpiredSignatureError, InvalidAudienceError, InvalidIssuerError, InvalidTokenError


class JWTVerificationError(RuntimeError):
    """Raised when JWT validation or RBAC checks fail."""


@dataclass(frozen=True)
class IdentityClaims:
    """Normalized identity extracted from a Nova-issued JWT."""

    subject: str
    email: str
    role: str
    scopes: tuple[str, ...]
    issued_at: datetime
    expires_at: datetime
    token: str
    request_id: Optional[str] = None
    source: Optional[str] = None


_MAX_TOKEN_LENGTH = int(os.getenv("JWT_MAX_LENGTH", "8192"))
_LEEWAY_SECONDS = int(os.getenv("JWT_LEEWAY_SECONDS", "60"))


def _load_allowed_roles() -> frozenset[str]:
    base = {
        "godmode",
        "superadmin",
        "admin",
        "operator",
        "observer",
        "mentor",
        "guardian",
        "creator",
        "user",
    }
    extra = {value.strip().lower() for value in os.getenv("JWT_EXTRA_ROLES", "").split(",") if value.strip()}
    return frozenset(base | extra)


_ALLOWED_ROLES = _load_allowed_roles()


@lru_cache(maxsize=1)
def _public_key() -> str:
    inline = os.getenv("JWT_PUBLIC_KEY")
    if inline and "BEGIN" in inline:
        return inline
    path = os.getenv("JWT_PUBLIC_KEY_PATH")
    if path:
        with open(path, "r", encoding="utf-8") as handle:
            return handle.read()
    raise RuntimeError("JWT public key is not configured")


def _coerce_scopes(value: Optional[Sequence[str] | str]) -> tuple[str, ...]:
    if value is None:
        return tuple()
    if isinstance(value, str):
        scopes = [segment.strip() for segment in value.split(",") if segment.strip()]
        return tuple(scopes)
    return tuple(str(item).strip() for item in value if str(item).strip())


def _normalize_roles(roles: Optional[Iterable[str]]) -> set[str]:
    if not roles:
        return set()
    return {role.strip().lower() for role in roles if role}


def _decode_token(token: str) -> dict:
    issuer = os.getenv("JWT_ISSUER")
    audience = os.getenv("JWT_AUDIENCE")
    options = {"require": ["sub", "exp", "iat"]}
    kwargs = {
        "algorithms": ["RS256"],
        "options": options,
        "leeway": _LEEWAY_SECONDS,
    }
    if issuer:
        kwargs["issuer"] = issuer
    if audience:
        kwargs["audience"] = audience
    return jwt.decode(token, _public_key(), **kwargs)


def verify_jwt_token(token: str, *, required_roles: Optional[Iterable[str]] = None) -> IdentityClaims:
    """Verify token signature, normalize claims, and enforce RBAC."""

    if not token:
        raise JWTVerificationError("missing bearer token")
    if len(token) > _MAX_TOKEN_LENGTH:
        raise JWTVerificationError("token length exceeds policy limit")

    try:
        payload = _decode_token(token)
    except (ExpiredSignatureError, InvalidAudienceError, InvalidIssuerError, InvalidTokenError) as exc:
        raise JWTVerificationError(str(exc)) from exc

    subject = str(payload.get("sub", "")).strip()
    if not subject:
        raise JWTVerificationError("token missing subject")

    email = str(payload.get("email", "")).strip().lower()
    role = str(payload.get("role", "user")).strip().lower()
    if role not in _ALLOWED_ROLES:
        raise JWTVerificationError("role not authorized")

    required = _normalize_roles(required_roles)
    if required and role not in required:
        raise JWTVerificationError("insufficient role")

    issued_at = datetime.fromtimestamp(int(payload.get("iat", 0)), tz=timezone.utc)
    expires_at = datetime.fromtimestamp(int(payload.get("exp", 0)), tz=timezone.utc)

    scopes = _coerce_scopes(payload.get("scopes") or payload.get("permissions"))

    return IdentityClaims(
        subject=subject,
        email=email,
        role=role,
        scopes=scopes,
        issued_at=issued_at,
        expires_at=expires_at,
        token=token,
    )


def extract_bearer_token(headers: Mapping[str, str]) -> Optional[str]:
    """Extract Bearer token from HTTP headers."""
    auth = headers.get("authorization") or headers.get("Authorization")
    if not auth:
        return None
    value = auth.strip()
    if not value.lower().startswith("bearer "):
        return None
    token = value.split(" ", 1)[1].strip()
    return token or None


def authorize_headers(headers: Mapping[str, str], *, required_roles: Optional[Iterable[str]] = None) -> IdentityClaims:
    """Verify Authorization header and return normalized identity."""
    token = extract_bearer_token(headers)
    identity = verify_jwt_token(token or "", required_roles=required_roles)
    request_id = headers.get("x-request-id") or headers.get("X-Request-ID")
    source = headers.get("x-source") or headers.get("X-Source")
    return IdentityClaims(
        subject=identity.subject,
        email=identity.email,
        role=identity.role,
        scopes=identity.scopes,
        issued_at=identity.issued_at,
        expires_at=identity.expires_at,
        token=identity.token,
        request_id=request_id,
        source=source,
    )
