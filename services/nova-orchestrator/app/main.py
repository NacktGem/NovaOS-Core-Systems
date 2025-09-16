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
from core.registry import AgentResponse, AgentRegistry  # noqa: E402


class OrchestrationRequest(BaseModel):
    agent: str
    command: str
    args: dict = {}
    log: bool = False


def _ensure_logs_dir() -> Path:
    p = Path("/logs")
    p.mkdir(parents=True, exist_ok=True)
    return p


app = FastAPI(title="Nova Orchestrator")

IDENTITY = load_identity()
# Explicit standard identity log line
try:
    print(f"[NovaOS] identity loaded from {CONFIG_PATH.resolve()}")
except Exception:
    pass
SERVICE_NAME = "nova-orchestrator"
GIT_COMMIT = os.getenv("GIT_COMMIT", "unknown")
AGENT_TOKEN = os.getenv("AGENT_SHARED_TOKEN") or os.getenv("NOVA_AGENT_TOKEN", "")
SERVICE_VERSION = IDENTITY.get("version", os.getenv("NOVA_ORCHESTRATOR_VERSION", "0.0.0"))
_orchestrator_log = _ensure_logs_dir() / "orchestrator.log"

# Local agent registry using in-process agent implementations
_registry = AgentRegistry(token=None)
_agent_instances: Dict[str, Any] = {}


def _get_agent_instance(name: str):
    """Lazy import and cache agent singletons by name."""
    key = name.lower()
    if key in _agent_instances:
        return _agent_instances[key]
    try:
        if key == "glitch":
            from agents.glitch.agent import GlitchAgent as _Cls  # type: ignore
        elif key == "lyra":
            from agents.lyra.agent import LyraAgent as _Cls  # type: ignore
        elif key == "velora":
            from agents.velora.agent import VeloraAgent as _Cls  # type: ignore
        elif key == "audita":
            from agents.audita.agent import AuditaAgent as _Cls  # type: ignore
        elif key == "riven":
            from agents.riven.agent import RivenAgent as _Cls  # type: ignore
        elif key == "echo":
            from agents.echo.agent import EchoAgent as _Cls  # type: ignore
        else:
            raise KeyError(f"unknown agent '{name}'")
        inst = _Cls()
        _agent_instances[key] = inst
        # Register in central registry for standardized logging (job logs per agent)
        try:
            _registry.register(key, inst)
        except Exception:
            pass
        return inst
    except Exception as e:  # noqa: BLE001
        raise HTTPException(status_code=404, detail=str(e))


@app.on_event("startup")
async def on_startup() -> None:
    # Log identity message explicitly (aligned with sovereign standard)
    # Identity loader already prints the path; just ensuring startup clarity
    print(f"{SERVICE_NAME} online: version={IDENTITY.get('version')} commit={GIT_COMMIT}")
    # Start self-registration heartbeat to core-api
    app.state._hb_task = asyncio.create_task(_heartbeat_loop())
    # Preload common agents (lazy loading will also work)
    for a in ["glitch", "lyra", "velora", "audita", "riven", "echo"]:
        try:
            _get_agent_instance(a)
        except Exception:
            # Non-fatal; agent can still be imported on-demand later
            pass


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
            core_api_url = os.getenv("CORE_API_URL", "http://core-api:8000")
            url = f"{core_api_url}/api/v1/agent/heartbeat"
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
        "registry": {"base_url": os.getenv("CORE_API_URL", "http://core-api:8000")},
    }


@app.post("/run")
async def run(req: OrchestrationRequest) -> Dict[str, Any]:
    # Log orchestration request
    try:
        with _orchestrator_log.open("a", encoding="utf-8") as fh:
            fh.write(
                f"{datetime.now(timezone.utc).isoformat()} agent={req.agent} command={req.command}\n"
            )
    except Exception:
        pass

    # Resolve agent and execute via central registry
    _get_agent_instance(req.agent)
    job = {"command": req.command, "args": req.args, "log": bool(req.log)}
    try:
        resp: AgentResponse = _registry.call(req.agent, job, token=AGENT_TOKEN)
        # Flatten structured output to top-level as required
        summary = details = logs_path = None
        if isinstance(resp.output, dict):
            summary = resp.output.get("summary")
            details = resp.output.get("details")
            logs_path = resp.output.get("logs_path")
        return {
            "success": resp.success,
            "summary": summary,
            "details": details,
            "logs_path": logs_path,
            "error": resp.error,
        }
    except Exception as e:  # noqa: BLE001
        return {
            "success": False,
            "summary": None,
            "details": None,
            "logs_path": None,
            "error": str(e),
        }
