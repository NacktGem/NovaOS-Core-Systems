import uuid
from dataclasses import dataclass
from typing import List

import jwt
from fastapi import WebSocket, HTTPException, status

from .deps import get_public_key, extract_jwt_from_cookie


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


async def get_current_user(ws: WebSocket) -> UserCtx:
    auth = ws.headers.get("authorization") or ws.headers.get("Authorization")
    token = None
    if auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1]
    if not token:
        token = extract_jwt_from_cookie(ws.headers)
    if not token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    try:
        public_key = await get_public_key()
        claims = jwt.decode(token, public_key, algorithms=["RS256"], options={"require": ["sub", "exp"]})
        return UserCtx(
            id=uuid.UUID(claims["sub"]),
            email=claims.get("email", ""),
            role=claims.get("role", "user"),
            tiers=claims.get("tiers", []),
            token=token,
        )
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED) from exc
