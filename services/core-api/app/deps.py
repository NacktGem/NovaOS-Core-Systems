import redis.asyncio as redis
from fastapi import Header, HTTPException, status
from .config import settings
import logging
import re
from urllib.parse import urlparse

_redis = None

def _parse_redis_db_from_url(redis_url: str) -> int:
    """Parse Redis database number from URL, defaulting to 0."""
    try:
        parsed = urlparse(redis_url)
        if parsed.path and len(parsed.path) > 1:
            # Extract DB number from path like '/2'
            db_str = parsed.path.lstrip('/')
            return int(db_str) if db_str.isdigit() else 0
    except:
        pass
    return 0

def _get_redis_db() -> int:
    """Get Redis database number from config, respecting REDIS_DB override."""
    if settings.redis_db is not None:
        return settings.redis_db
    return _parse_redis_db_from_url(settings.redis_url)

async def get_redis() -> redis.Redis:
    global _redis
    if _redis is None:
        db_num = _get_redis_db()
        # Create base URL without database path for redis.from_url()
        parsed = urlparse(settings.redis_url)
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        _redis = await redis.from_url(base_url, db=db_num, decode_responses=True)
        
        # Log Redis connection for audit
        logging.info(f"core-api: Connected to Redis database {db_num} at {base_url}")
    return _redis

async def require_agent_token(x_agent_token: str | None = Header(default=None)):
    if not x_agent_token or x_agent_token != settings.agent_shared_token:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="invalid agent token")