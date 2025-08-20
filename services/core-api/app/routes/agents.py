import os
import sys
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

sys.path.append(str(Path(__file__).resolve().parents[4]))

from agents.echo.agent import EchoAgent  # noqa: E402
from agents.glitch.agent import GlitchAgent  # noqa: E402
from agents.nova.agent import NovaAgent  # noqa: E402
from core.registry import AgentRegistry  # noqa: E402

router = APIRouter(prefix="/agents", tags=["agents"])

_registry = AgentRegistry(token=os.getenv("NOVA_AGENT_TOKEN"))
_registry.register("glitch", GlitchAgent())
_registry.register("echo", EchoAgent())
_nova = NovaAgent(_registry)

_allow = {r.strip().upper() for r in os.getenv("NOVA_AGENT_ROLES_ALLOW", "GODMODE,SUPER_ADMIN,ADMIN_AGENT").split(",")}


class Job(BaseModel):
    command: str
    args: dict = {}
    log: bool = False


@router.post("/{agent}")
async def run_agent(agent: str, job: Job, request: Request):
    token = request.headers.get("x-nova-token")
    auth = request.headers.get("authorization")
    if not token and auth and auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1]
    expected = os.getenv("NOVA_AGENT_TOKEN")
    if token != expected:
        return JSONResponse({"success": False, "output": None, "error": "invalid agent token"}, status_code=401)
    role = request.headers.get("x-role", "").upper()
    if role not in _allow:
        return JSONResponse({"success": False, "output": None, "error": "forbidden"}, status_code=403)
    payload = {
        "agent": agent,
        "command": job.command,
        "args": job.args,
        "log": job.log,
        "token": token,
        "role": role,
    }
    resp = _nova.run(payload)
    metrics = getattr(request.app.state, "agent_calls_total", None)
    if metrics:
        metrics.labels(agent=agent, success=str(resp.get("success"))).inc()
        if not resp.get("success"):
            request.app.state.errors_total.inc()
    return resp
