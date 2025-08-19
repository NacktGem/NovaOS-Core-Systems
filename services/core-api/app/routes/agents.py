import os
import sys
from pathlib import Path

from fastapi import APIRouter, HTTPException
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
    token: str | None = None


@router.post("/{agent}")
def run_agent(agent: str, job: Job):
    payload = {
        "agent": agent,
        "command": job.command,
        "args": job.args,
        "log": job.log,
    }
    if job.token:
        payload["token"] = job.token
    try:
        return _nova.run(payload)
    except PermissionError as exc:
        raise HTTPException(status_code=401, detail=str(exc)) from exc
    except KeyError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
