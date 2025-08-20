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
    payload = {
        "agent": agent,
        "command": job.command,
        "args": job.args,
        "log": job.log,
        "token": token,
    }
    return _nova.run(payload)
