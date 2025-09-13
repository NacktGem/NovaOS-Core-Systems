import redis.asyncio as redis
from fastapi import Header, HTTPException, status
from .config import settings

_redis = None

async def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        _redis = await redis.from_url(settings.redis_url, decode_responses=True)
    return _redis

async def require_agent_token(x_agent_token: str | None = Header(default=None)):
    if not x_agent_token or x_agent_token != settings.agent_shared_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid agent token")