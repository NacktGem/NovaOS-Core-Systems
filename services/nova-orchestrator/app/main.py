from __future__ import annotations

import asyncio
import os
import socket
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

# Ensure project root on sys.path for agents/core/env imports when running in container
PROJECT_ROOT_CANDIDATES = [Path(__file__).resolve().parents[3], Path('/app')]
for cand in PROJECT_ROOT_CANDIDATES:
    if cand.exists() and str(cand) not in sys.path:
        sys.path.append(str(cand))

from env.identity import load_identity, CONFIG_PATH  # noqa: E402
from agents.nova.agent import NovaAgent  # noqa: E402
from core.registry import AgentResponse  # noqa: E402


class Job(BaseModel):
    command: str
    args: dict = {}
    log: bool = False


class ProxyRegistry:
    """HTTP proxy to core-api /agents/{agent} endpoint to satisfy NovaAgent contract."""

    def __init__(self, base_url: str, token: str, allow_roles: str = "GODMODE") -> None:
        self.base_url = base_url.rstrip('/')
        self.token = token
        self.allow_role = allow_roles

    def call(
        self, name: str, job: Dict[str, Any], token: str | None = None, role: str | None = None
    ) -> AgentResponse:
        import httpx

        url = f"{self.base_url}/agents/{name}"
        headers = {
            "authorization": f"Bearer {self.token}",
            "x-role": (role or self.allow_role),
        }
        resp = httpx.post(
            url,
            json={
                "command": job.get("command"),
                "args": job.get("args", {}),
                "log": bool(job.get("log")),
            },
            headers=headers,
            timeout=30.0,
        )
        data = (
            resp.json()
            if resp.content
            else {"success": False, "output": None, "error": f"HTTP {resp.status_code}"}
        )
        return AgentResponse(
            agent=name,
            success=bool(data.get("success")),
            output=data.get("output"),
            error=data.get("error"),
        )


app = FastAPI(title="Nova Orchestrator")

IDENTITY = load_identity()
# Explicit standard identity log line
try:
    print(f"[NovaOS] identity loaded from {CONFIG_PATH.resolve()}")
except Exception:
    pass
SERVICE_NAME = "nova-orchestrator"
GIT_COMMIT = os.getenv("GIT_COMMIT", "unknown")
CORE_API_URL = os.getenv("CORE_API_URL", "http://core-api:8000")
AGENT_TOKEN = os.getenv("AGENT_SHARED_TOKEN") or os.getenv("NOVA_AGENT_TOKEN", "")
SERVICE_VERSION = IDENTITY.get("version", os.getenv("NOVA_ORCHESTRATOR_VERSION", "0.0.0"))

_registry = ProxyRegistry(CORE_API_URL, token=AGENT_TOKEN)
_nova = NovaAgent(_registry)


@app.on_event("startup")
async def on_startup() -> None:
    # Log identity message explicitly (aligned with sovereign standard)
    # Identity loader already prints the path; just ensuring startup clarity
    print(f"{SERVICE_NAME} online: version={IDENTITY.get('version')} commit={GIT_COMMIT}")
    # Start self-registration heartbeat to core-api
    app.state._hb_task = asyncio.create_task(_heartbeat_loop())


@app.on_event("shutdown")
async def on_shutdown() -> None:
    task = getattr(app.state, "_hb_task", None)
    if task:
        task.cancel()


async def _heartbeat_loop() -> None:
    import httpx

    ttl = 90
    payload = {
        "agent": "nova",
        "version": IDENTITY.get("version", "0.0.0"),
        "host": socket.gethostname(),
        "pid": os.getpid(),
        "capabilities": ["orchestrate", "proxy"],
    }
    headers = {"x-agent-token": AGENT_TOKEN}

    while True:
        try:
            url = f"{CORE_API_URL}/api/v1/agent/heartbeat"
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(url, json=payload, headers=headers)
        except Exception as e:  # noqa: BLE001
            print(f"heartbeat failed: {e}")
        await asyncio.sleep(ttl // 2)


@app.get("/internal/healthz")
async def healthz() -> Dict[str, str]:
    return {"status": "ok"}


@app.get("/internal/readyz")
async def readyz() -> Dict[str, str]:
    return {"status": "ok"}


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
async def status() -> Dict[str, Any]:
    return {
        "agent": "nova",
        "uptime": time.time(),
        "registry": {"base_url": CORE_API_URL},
    }


@app.post("/run")
async def run(job: Job) -> Dict[str, Any]:
    try:
        payload = {
            "agent": job.args.get("agent") or job.args.get("target") or "",
            "command": job.command,
            "args": job.args,
            "log": job.log,
            "token": AGENT_TOKEN,
            "role": os.getenv("NOVA_AGENT_ROLE", "GODMODE"),
        }
        if not payload["agent"]:
            raise HTTPException(status_code=400, detail="missing 'agent' in args")
        result = _nova.run(payload)
        return result
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        return {"success": False, "output": None, "error": str(e)}
