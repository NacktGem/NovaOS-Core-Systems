from __future__ import annotations

import asyncio
import os
import socket
import time
import uuid
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import Depends, FastAPI, HTTPException, Request, status
from pydantic import BaseModel

from env.identity import load_identity, CONFIG_PATH
from agents.velora.agent import VeloraAgent
from agents.common.security import IdentityClaims, authorize_headers, JWTVerificationError

# Optional analytics DB support preserved
import psycopg  # type: ignore
from psycopg.rows import dict_row  # type: ignore


DB = os.getenv("DATABASE_URL", "postgresql://localhost/novaos")
app = FastAPI(title="Velora Service")


def db():
    return psycopg.connect(DB, row_factory=dict_row)


class EventIn(BaseModel):
    user_id: str | None = None
    name: str
    props: dict = {}


# --- Sovereign identity and metadata ---
IDENTITY = load_identity()
print(f"[NovaOS] identity loaded from {CONFIG_PATH.resolve()}")

SERVICE_NAME = "velora"
GIT_COMMIT = os.getenv("GIT_COMMIT", "unknown")
CORE_API_URL = os.getenv("CORE_API_URL", "http://core-api:8000")
AGENT_TOKEN = os.getenv("AGENT_SHARED_TOKEN", "")
INTERNAL_TOKEN = os.getenv("INTERNAL_TOKEN", "")

_agent = VeloraAgent()

_required_roles = {
    role.strip().lower()
    for role in os.getenv("VELORA_REQUIRED_ROLES", "godmode,superadmin,admin").split(",")
    if role.strip()
}


def require_identity(request: Request) -> IdentityClaims:
    try:
        roles = _required_roles or None
        return authorize_headers(request.headers, required_roles=roles)
    except JWTVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


def enforce_internal_token(request: Request) -> None:
    if not INTERNAL_TOKEN:
        return
    token = request.headers.get("x-internal-token")
    if token != INTERNAL_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="internal access only")


@app.on_event("startup")
async def on_startup() -> None:
    app.state._hb_task = asyncio.create_task(_heartbeat_loop())


@app.on_event("shutdown")
async def on_shutdown() -> None:
    task = getattr(app.state, "_hb_task", None)
    if task:
        task.cancel()


async def _heartbeat_loop() -> None:
    import httpx

    ttl = 90
    headers = {"x-agent-token": AGENT_TOKEN} if AGENT_TOKEN else {}
    payload = {
        "agent": SERVICE_NAME,
        "version": IDENTITY.get("version", "0.0.0"),
        "host": socket.gethostname(),
        "pid": os.getpid(),
        "capabilities": ["analytics", "automation", "crm"],
    }

    while True:
        try:
            url = f"{CORE_API_URL.rstrip('/')}/api/v1/agent/heartbeat"
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(url, json=payload, headers=headers)
        except Exception as e:  # noqa: BLE001
            print(f"heartbeat failed: {e}")
        await asyncio.sleep(ttl // 2)


# --- Sovereign endpoints ---
@app.get("/internal/healthz")
async def internal_healthz(request: Request) -> Dict[str, str]:
    enforce_internal_token(request)
    return {"status": "ok"}


@app.get("/internal/readyz")
async def internal_readyz(request: Request) -> Dict[str, str]:
    enforce_internal_token(request)
    return {"status": "ok"}


@app.get("/version")
async def version() -> Dict[str, Any]:
    return {
        "service": SERVICE_NAME,
        "version": IDENTITY.get("version", os.getenv("VELORA_VERSION", "0.0.0")),
        "commit": GIT_COMMIT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/status")
async def status() -> Dict[str, Any]:
    return {
        "agent": SERVICE_NAME,
        "state": {
            "log_dir": str(_agent._log_dir),  # internal path used by VeloraAgent
        },
    }


class RunJob(BaseModel):
    command: str
    args: Dict[str, Any] = {}
    log: bool = False


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
                "email": identity.email,
                "role": identity.role,
            },
        }
        result = _agent.run(payload)
        result.setdefault("request_id", request_id)
        return result
    except Exception as e:  # noqa: BLE001
        return {"success": False, "output": None, "error": str(e), "request_id": request_id}


# --- Existing analytics endpoint retained ---
@app.post("/ingest")
def ingest(ev: EventIn):
    with db() as conn:
        conn.execute(
            "INSERT INTO analytics.events (user_id,name,props) VALUES (%s,%s,%s)",
            (ev.user_id, ev.name, ev.props),
        )
    return {"ok": True}
