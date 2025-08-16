import os
import logging
import pathlib
from functools import lru_cache

import httpx
import redis.asyncio as redis


@lru_cache
def get_settings() -> dict:
    return {
        "redis_url": os.getenv("REDIS_URL", "redis://localhost:6379/0"),
        "core_api_url": os.getenv("CORE_API_URL", "http://core-api:8000"),
        "jwt_public_key_path": os.getenv("JWT_PUBLIC_KEY_PATH", "./keys/dev_jwt_public.pem"),
        "internal_token": os.getenv("ECHO_INTERNAL_TOKEN", ""),
    }


async def get_redis() -> redis.Redis:
    settings = get_settings()
    if not hasattr(get_redis, "_client"):
        get_redis._client = redis.from_url(settings["redis_url"], encoding="utf-8", decode_responses=True)
    return get_redis._client


@lru_cache
async def get_public_key() -> str:
    path = pathlib.Path(get_settings()["jwt_public_key_path"])
    return path.read_text()


async def get_core_client() -> httpx.AsyncClient:
    settings = get_settings()
    if not hasattr(get_core_client, "_client"):
        headers = {"X-Internal-Token": settings["internal_token"]}
        get_core_client._client = httpx.AsyncClient(base_url=settings["core_api_url"], headers=headers, timeout=5)
    return get_core_client._client


def extract_jwt_from_cookie(headers: dict) -> str | None:
    cookie = headers.get("cookie") or headers.get("Cookie")
    if not cookie:
        return None
    for part in cookie.split(";"):
        part = part.strip()
        if part.startswith("access_token="):
            return part.split("=", 1)[1]
    return None


_logger: logging.Logger | None = None


def get_logger() -> logging.Logger:
    global _logger
    if _logger is None:
        _logger = logging.getLogger("echo")
        handler = logging.StreamHandler()
        handler.setFormatter(logging.Formatter('%(message)s'))
        _logger.addHandler(handler)
        _logger.setLevel(logging.INFO)
    return _logger
