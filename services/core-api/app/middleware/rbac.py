from typing import Literal

from fastapi import Depends, HTTPException, status

from app.db.models import User
from app.security.jwt import get_current_user

Role = Literal["godmode", "superadmin", "admin", "creator", "user"]


def require_role(*allowed: Role):
    def dependency(user: User = Depends(get_current_user)) -> User:
        if user.role in allowed:
            return user
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN)

    return dependency


def is_godmode(user: User) -> bool:
    return user.role == "godmode"
