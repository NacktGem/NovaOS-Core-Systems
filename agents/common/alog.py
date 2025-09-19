"""Agent-side helper for emitting audit logs to core-api."""

from __future__ import annotations

import json
import os
from typing import Any, Dict, Optional

try:
    import requests
except ModuleNotFoundError:  # pragma: no cover - fallback when requests is unavailable
    requests = None  # type: ignore[assignment]


CORE = (os.getenv("CORE_API_URL") or "http://core-api:8000").rstrip("/")
TOKEN = os.getenv("AGENT_SHARED_TOKEN", "")
AGENT = os.getenv("AGENT_NAME", "unknown")


def _emit(level: str, msg: str, meta: Optional[Dict[str, Any]] = None) -> None:
    if not TOKEN:
        return
    url = f"{CORE}/api/v1/agent/log"
    body = {"agent": AGENT, "level": level, "msg": msg, "meta": meta or {}}
    try:
        if requests is not None:
            requests.post(url, json=body, headers={"X-Agent-Token": TOKEN}, timeout=3)
        else:  # pragma: no cover - fallback path
            data = json.dumps(body).encode("utf-8")
            from urllib.request import Request, urlopen

            req = Request(url, data=data, headers={"X-Agent-Token": TOKEN, "Content-Type": "application/json"}, method="POST")
            urlopen(req, timeout=3)
    except Exception:
        pass


def info(msg: str, meta: Optional[Dict[str, Any]] = None) -> None:
    _emit("info", msg, meta)


def warn(msg: str, meta: Optional[Dict[str, Any]] = None) -> None:
    _emit("warn", msg, meta)


def error(msg: str, meta: Optional[Dict[str, Any]] = None) -> None:
    _emit("error", msg, meta)


def debug(msg: str, meta: Optional[Dict[str, Any]] = None) -> None:
    if os.getenv("NOVA_DEBUG", "").lower() in ("1", "true", "yes"):
        _emit("debug", msg, meta)


def debug(msg: str, meta: Optional[Dict[str, Any]] = None) -> None:
    if os.getenv("NOVA_DEBUG", "").lower() in ("1", "true", "yes"):
        _emit("debug", msg, meta)