"""Glitch service main application (Sovereign Standard compliant).

Implements FastAPI service exposing:
  - GET /internal/healthz
  - GET /internal/readyz
  - GET /version
  - GET /status
  - POST /run

Also loads identity from /app/env/config.json and self-registers with core-api.
"""

from __future__ import annotations

import os
import asyncio
import socket
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import Depends, FastAPI, Header, HTTPException, Request, status
from fastapi.responses import PlainTextResponse, JSONResponse
from pydantic import BaseModel

from agent_core import configure_logging  # type: ignore
from env.identity import load_identity, CONFIG_PATH  # type: ignore
from agents.glitch.agent import GlitchAgent  # type: ignore
from agents.common.security import IdentityClaims, authorize_headers, JWTVerificationError


class RunJob(BaseModel):
    command: str
    args: Dict[str, Any] = {}
    log: bool = False


app = FastAPI(title="Glitch Service")

# Simple in-memory paused flag for the worker(s)
_worker_paused = asyncio.Event()
_worker_paused.set()  # set() == not paused; clear() == paused

# Simple Prometheus-like metric counters
_metrics = {"processed": 0, "errors": 0}

INTERNAL_TOKEN = os.getenv("INTERNAL_TOKEN", "")

# Sovereign identity + metadata
IDENTITY = load_identity()
try:
    # Explicit standard log line (in addition to identity loader's own print)
    print(f"[NovaOS] identity loaded from {CONFIG_PATH.resolve()}")
except Exception:
    # Best-effort logging; identity loader already emitted something
    pass

SERVICE_NAME = "glitch"
GIT_COMMIT = os.getenv("GIT_COMMIT", "unknown")
CORE_API_URL = os.getenv("CORE_API_URL", "http://core-api:8000")
AGENT_TOKEN = os.getenv("AGENT_SHARED_TOKEN", "")
SERVICE_VERSION = IDENTITY.get("version", os.getenv("GLITCH_VERSION", "0.0.0"))

_agent = GlitchAgent()


@app.on_event("startup")
async def startup_event() -> None:
    configure_logging()
    # Background worker for metrics demo (non-blocking)
    app.state._worker_task = asyncio.create_task(worker_loop())
    # Heartbeat to core-api
    app.state._hb_task = asyncio.create_task(_heartbeat_loop())


@app.on_event("shutdown")
async def shutdown_event() -> None:
    for name in ("_hb_task", "_worker_task"):
        task = getattr(app.state, name, None)
        if task:
            task.cancel()


def enforce_internal_token(request: Request) -> None:
    if not INTERNAL_TOKEN:
        return
    token = request.headers.get("x-internal-token")
    if token != INTERNAL_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="internal access only")


@app.get("/internal/healthz")
async def internal_healthz(request: Request) -> JSONResponse:
    enforce_internal_token(request)
    return JSONResponse({"status": "ok"})


@app.get("/internal/readyz")
async def internal_readyz(request: Request) -> JSONResponse:
    enforce_internal_token(request)
    return JSONResponse({"status": "ok"})


@app.get("/version")
async def version() -> Dict[str, Any]:
    return {
        "service": SERVICE_NAME,
        "name": IDENTITY.get("name", "NovaOS"),
        "version": SERVICE_VERSION,
        "commit": GIT_COMMIT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/status")
async def status_page() -> Dict[str, Any]:
    return {
        "agent": SERVICE_NAME,
        "threat_level": _agent.get_threat_level(),
        "active_scans": _agent.get_active_scans(),
        "last_scan_time": _agent.get_last_scan_time(),
        "metrics": _metrics,
    }


@app.post("/run")
async def run(job: RunJob, identity: IdentityClaims = Depends(require_identity)) -> Dict[str, Any]:
    request_id = uuid.uuid4().hex
    try:
        payload = {
            "command": job.command,
            "args": job.args,
            "log": job.log,
            "requested_by": {
                "subject": identity.subject,
                "role": identity.role,
                "email": identity.email,
            },
        }
        result = _agent.run(payload)
        if result.get("success"):
            _metrics["processed"] += 1
        else:
            _metrics["errors"] += 1
        result.setdefault("request_id", request_id)
        return result
    except Exception as e:  # noqa: BLE001
        _metrics["errors"] += 1
        return {"success": False, "output": None, "error": str(e), "request_id": request_id}


@app.get("/metrics")
async def metrics() -> PlainTextResponse:
    # Render simple text metrics in Prometheus exposition format
    body = []
    body.append(f"glitch_processed_total {_metrics['processed']}")
    body.append(f"glitch_errors_total {_metrics['errors']}")
    return PlainTextResponse("\n".join(body), media_type="text/plain; version=0.0.4")


def verify_admin(x_internal_token: str = Header("")) -> None:
    if not INTERNAL_TOKEN or x_internal_token != INTERNAL_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


@app.post("/admin/pause")
async def admin_pause(x_internal_token: str = Header("")) -> JSONResponse:
    verify_admin(x_internal_token)
    _worker_paused.clear()
    return JSONResponse({"status": "paused"})


@app.post("/admin/resume")
async def admin_resume(x_internal_token: str = Header("")) -> JSONResponse:
    verify_admin(x_internal_token)
    _worker_paused.set()
    return JSONResponse({"status": "resumed"})


# Example worker coroutine that respects the paused state
async def worker_loop():
    while True:
        await _worker_paused.wait()
        # Simulate background metric activity
        try:
            _metrics["processed"] += 1
        except Exception:
            _metrics["errors"] += 1
        await asyncio.sleep(1)


async def _heartbeat_loop() -> None:
    """Self-register to core-api periodically."""
    import httpx

    ttl = 90
    headers = {"x-agent-token": AGENT_TOKEN} if AGENT_TOKEN else {}
    payload = {
        "agent": SERVICE_NAME,
        "version": IDENTITY.get("version", "0.0.0"),
        "host": socket.gethostname(),
        "pid": os.getpid(),
        "capabilities": ["forensics", "security", "moderation"],
    }

    while True:
        try:
            url = f"{CORE_API_URL.rstrip('/')}/api/v1/agent/heartbeat"
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(url, json=payload, headers=headers)
        except Exception as e:  # noqa: BLE001
            # Log and continue; do not crash the service if core-api is offline
            print(f"heartbeat failed: {e}")
        await asyncio.sleep(ttl // 2)
_required_roles = {
    role.strip().lower()
    for role in os.getenv("GLITCH_REQUIRED_ROLES", "godmode,superadmin").split(",")
    if role.strip()
}


def require_identity(request: Request) -> IdentityClaims:
    try:
        roles = _required_roles or None
        return authorize_headers(request.headers, required_roles=roles)
    except JWTVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc
