from __future__ import annotations

import asyncio
import os
import socket
import time
from datetime import datetime, timezone
from typing import Any, Dict

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from env.identity import load_identity, CONFIG_PATH
from agents.lyra.agent import LyraAgent


class RunJob(BaseModel):
    command: str
    args: Dict[str, Any] = {}
    log: bool = False


app = FastAPI(title="Lyra Service")

IDENTITY = load_identity()
print(f"[NovaOS] identity loaded from {CONFIG_PATH.resolve()}")

SERVICE_NAME = "lyra"
GIT_COMMIT = os.getenv("GIT_COMMIT", "unknown")
CORE_API_URL = os.getenv("CORE_API_URL", "http://core-api:8000")
AGENT_TOKEN = os.getenv("AGENT_SHARED_TOKEN", "")
SERVICE_VERSION = IDENTITY.get("version", os.getenv("LYRA_VERSION", "0.0.0"))

_agent = LyraAgent()


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
        "capabilities": ["education", "creative", "herbalist"],
    }

    while True:
        try:
            url = f"{CORE_API_URL.rstrip('/')}/api/v1/agent/heartbeat"
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
        "version": SERVICE_VERSION,
        "commit": GIT_COMMIT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/status")
async def status() -> Dict[str, Any]:
    return {
        "agent": SERVICE_NAME,
        "state": {
            "log_dir": str(_agent._log_dir),  # internal path used by LyraAgent
        },
    }


@app.post("/run")
async def run(job: RunJob) -> Dict[str, Any]:
    try:
        payload = {"command": job.command, "args": job.args}
        return _agent.run(payload)
    except HTTPException:
        raise
    except Exception as e:  # noqa: BLE001
        return {"success": False, "output": None, "error": str(e)}
