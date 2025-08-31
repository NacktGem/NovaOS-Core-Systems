import os
import sys
from pathlib import Path

from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

# -------- Robust Root Resolver --------
def find_project_root(markers={".git", "pyproject.toml", "core"}, max_depth=10) -> Path:
    current = Path(__file__).resolve()
    for _ in range(max_depth):
        if any((current / marker).exists() for marker in markers):
            return current
        if current.parent == current:
            break
        current = current.parent
    raise RuntimeError("Could not locate project root")

project_root = find_project_root()
if str(project_root) not in sys.path:
    sys.path.append(str(project_root))

# -------- Agent Imports --------
from agents.echo.agent import EchoAgent  # noqa: E402
from agents.glitch.agent import GlitchAgent  # noqa: E402
from agents.nova.agent import NovaAgent  # noqa: E402
from core.registry import AgentRegistry  # noqa: E402

# -------- Router & Registry --------
router = APIRouter(prefix="/agents", tags=["agents"])

_registry = AgentRegistry(token=os.getenv("NOVA_AGENT_TOKEN"))
_registry.register("glitch", GlitchAgent())
_registry.register("echo", EchoAgent())
_nova = NovaAgent(_registry)

_allow = {
    role.strip().upper()
    for role in os.getenv("NOVA_AGENT_ROLES_ALLOW", "GODMODE,SUPER_ADMIN,ADMIN_AGENT").split(",")
}


# -------- Job Payload Schema --------
class Job(BaseModel):
    command: str
    args: dict = {}
    log: bool = False


# -------- Agent Runner Endpoint --------
@router.post("/{agent}")
async def run_agent(agent: str, job: Job, request: Request):
    # Token extraction
    token = request.headers.get("x-nova-token")
    if not token:
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]

    if token != os.getenv("NOVA_AGENT_TOKEN"):
        return JSONResponse(
            {"success": False, "output": None, "error": "invalid agent token"}, status_code=401
        )

    role = request.headers.get("x-role", "").upper()
    if role not in _allow:
        return JSONResponse(
            {"success": False, "output": None, "error": "forbidden"}, status_code=403
        )

    if agent not in _registry.agents:
        return JSONResponse(
            {"success": False, "output": None, "error": f"agent '{agent}' not found"}, status_code=404
        )

    payload = {
        "agent": agent,
        "command": job.command,
        "args": job.args,
        "log": job.log,
        "token": token,
        "role": role,
    }

    resp = _nova.run(payload)

    # Optional Prometheus-style metrics
    metrics = getattr(request.app.state, "agent_calls_total", None)
    if metrics:
        metrics.labels(agent=agent, success=str(resp.get("success"))).inc()
        if not resp.get("success"):
            request.app.state.errors_total.inc()

    return resp
