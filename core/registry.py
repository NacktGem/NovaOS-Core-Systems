"""Agent registry and execution router for NovaOS."""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional
import uuid

from agents.base import BaseAgent


@dataclass
class AgentResponse:
    """Standardized agent response."""

    agent: str
    success: bool
    output: Any
    error: Optional[str] = None
    job_id: Optional[str] = None


class AgentRegistry:
    """Registers and executes NovaOS agents with token security."""

    def __init__(self, token: Optional[str] = None) -> None:
        self._agents: Dict[str, BaseAgent] = {}
        self._token = token or os.getenv("NOVA_AGENT_TOKEN")
        self._log_dir = Path("logs")
        self._log_dir.mkdir(exist_ok=True)

    def register(self, name: str, handler: BaseAgent) -> None:
        if name in self._agents:
            raise ValueError(f"agent '{name}' already registered")
        self._agents[name] = handler

    def call(self, name: str, job: Dict[str, Any], token: Optional[str] = None) -> AgentResponse:
        if self._token and token != self._token:
            resp = AgentResponse(agent=name, success=False, output=None, error="invalid agent token")
            job_id = self._log(job, resp)
            resp.job_id = job_id
            return resp
        if name not in self._agents:
            resp = AgentResponse(agent=name, success=False, output=None, error=f"agent '{name}' not found")
            job_id = self._log(job, resp)
            resp.job_id = job_id
            return resp
        agent = self._agents[name]
        try:
            result = agent.run(job)
            resp = AgentResponse(
                agent=name,
                success=bool(result.get("success")),
                output=result.get("output"),
                error=result.get("error"),
            )
        except Exception as exc:  # noqa: BLE001
            resp = AgentResponse(agent=name, success=False, output=None, error=str(exc))
        job_id = self._log(job, resp)
        resp.job_id = job_id
        return resp

    def _log(self, job: Dict[str, Any], resp: AgentResponse) -> str:
        now = datetime.now(timezone.utc)
        job_id = uuid.uuid4().hex
        entry = {
            "timestamp": now.isoformat(),
            "job_id": job_id,
            "job": job,
            "response": {
                "agent": resp.agent,
                "success": resp.success,
                "output": resp.output,
                "error": resp.error,
            },
        }
        agent_dir = self._log_dir / resp.agent
        agent_dir.mkdir(parents=True, exist_ok=True)
        filename = agent_dir / f"{job_id}.json"
        with filename.open("w", encoding="utf-8") as fh:
            json.dump(entry, fh, ensure_ascii=False, indent=2)
        print(json.dumps(entry, ensure_ascii=False))
        return job_id

