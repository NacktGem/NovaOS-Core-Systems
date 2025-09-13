import httpx

from .auth import UserCtx
from .deps import get_settings

FOUNDER_EMAILS = {"founder@local", "jules@local"}


async def can_join(room: str, user: UserCtx) -> bool:
    if room == "founder-room":
        return user.role in {"godmode", "superadmin"} and user.email in FOUNDER_EMAILS
    if room.startswith("family-"):
        return user.email in FOUNDER_EMAILS or "family" in user.tiers
    settings = get_settings()
    headers = {"Authorization": f"Bearer {user.token}"}
    async with httpx.AsyncClient(base_url=settings["core_api_url"], headers=headers, timeout=5) as client:
        res = await client.get("/rooms/")
        if res.status_code != 200:
            return False
        rooms = res.json()
        return any(r["name"] == room for r in rooms)
