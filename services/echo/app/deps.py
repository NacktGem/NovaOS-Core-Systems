# services/echo/app/deps.py
import os
import logging
import pathlib
from functools import lru_cache
from typing import Optional, Mapping
from urllib.parse import urlparse

import httpx
import redis.asyncio as redis


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

@lru_cache(maxsize=1)
def get_settings() -> dict:
    return {
        "redis_url": os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        "redis_db": int(os.getenv("REDIS_DB")) if os.getenv("REDIS_DB") else None,
        "core_api_url": os.getenv("CORE_API_URL", "http://core-api:8000").rstrip("/"),
        "jwt_public_key_path": os.getenv("JWT_PUBLIC_KEY_PATH", "./keys/dev_jwt_public.pem"),
        "jwt_public_key_inline": os.getenv("JWT_PUBLIC_KEY"),  # optional inline PEM
        "internal_token": os.getenv("ECHO_INTERNAL_TOKEN", ""),
        "http_timeout": float(os.getenv("HTTP_TIMEOUT_SECONDS", "10")),
    }


# ---------- Redis ----------

_redis_client: Optional[redis.Redis] = None

async def get_redis() -> redis.Redis:
    global _redis_client
    if _redis_client is None:
        settings = get_settings()
        
        # Determine Redis DB
        if settings["redis_db"] is not None:
            db_num = settings["redis_db"]
        else:
            db_num = _parse_redis_db_from_url(settings["redis_url"])
        
        # Create base URL without database path
        parsed = urlparse(settings["redis_url"])
        base_url = f"{parsed.scheme}://{parsed.netloc}"
        
        _redis_client = redis.from_url(
            base_url,
            db=db_num,
            encoding="utf-8",
            decode_responses=True,
        )
        
        # Log Redis connection for audit
        logger = get_logger()
        logger.info(f"echo-ws: Connected to Redis database {db_num} at {base_url}")
        
    return _redis_client


# ---------- JWT Public Key ----------

@lru_cache(maxsize=1)
def _load_public_key_text() -> str:
    """
    Load RS256 public key once.
    Prefers JWT_PUBLIC_KEY (inline) if set; otherwise reads from JWT_PUBLIC_KEY_PATH.
    """
    settings = get_settings()
    inline = settings.get("jwt_public_key_inline")
    if inline:
        # allow \n escaped newlines from env
        return inline.replace("\\n", "\n")

    path = pathlib.Path(settings["jwt_public_key_path"])
    if not path.exists():
        raise RuntimeError(f"JWT public key not found at {path}")
    return path.read_text(encoding="utf-8")

async def get_public_key() -> str:
    # async facade to a cached sync loader
    return _load_public_key_text()


# ---------- Core API HTTP client ----------

_core_client: Optional[httpx.AsyncClient] = None

async def get_core_client() -> httpx.AsyncClient:
    global _core_client
    if _core_client is None:
        s = get_settings()
        headers = {}
        if s["internal_token"]:
            headers["X-Internal-Token"] = s["internal_token"]
        _core_client = httpx.AsyncClient(
            base_url=s["core_api_url"],
            headers=headers,
            timeout=s["http_timeout"],
        )
    return _core_client


# ---------- Cookies / JWT extraction ----------

def extract_jwt_from_cookie(headers: Mapping[str, str]) -> Optional[str]:
    """
    Extract JWT from Cookie header. We look for common names; your apps use 'access_token'.
    """
    cookie = headers.get("cookie") or headers.get("Cookie")
    if not cookie:
        return None
    pairs = [p.strip() for p in cookie.split(";") if "=" in p]
    kv = dict(p.split("=", 1) for p in pairs)

    # Primary cookie key used by core-api login
    if "access_token" in kv:
        return kv["access_token"]

    # Fallbacks (if you ever change naming)
    for k in ("access-token", "token", "auth", "session"):
        v = kv.get(k)
        if v and v.count(".") == 2:
            return v
    return None


# ---------- Logger ----------

_logger: Optional[logging.Logger] = None

def get_logger() -> logging.Logger:
    global _logger
    if _logger is None:
        _logger = logging.getLogger("echo")
        _logger.propagate = False
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s echo %(message)s"))
        _logger.addHandler(handler)
        _logger.setLevel(logging.INFO)
    return _logger
