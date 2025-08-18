"""Agent registry and execution router for NovaOS."""
from __future__ import annotations

import json
import os
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

from agents.base import Agent


@dataclass
class AgentResponse:
    """Standardized agent response."""

    agent: str
    success: bool
    output: Any
    error: Optional[str] = None


class AgentRegistry:
    """Registers and executes NovaOS agents with token security."""

    def __init__(self, token: Optional[str] = None) -> None:
        self._agents: Dict[str, Agent] = {}
        self._token = token or os.getenv("NOVA_AGENT_TOKEN")
        self._log_dir = Path("logs")
        self._log_dir.mkdir(exist_ok=True)

    def register(self, name: str, handler: Agent) -> None:
        if name in self._agents:
            raise ValueError(f"agent '{name}' already registered")
        self._agents[name] = handler

    def call(self, name: str, job: Dict[str, Any], token: Optional[str] = None) -> AgentResponse:
        if self._token and token != self._token:
            resp = AgentResponse(agent=name, success=False, output=None, error="invalid agent token")
            self._log(job, resp)
            raise PermissionError("invalid agent token")
        if name not in self._agents:
            resp = AgentResponse(agent=name, success=False, output=None, error=f"agent '{name}' not found")
            self._log(job, resp)
            raise KeyError(f"agent '{name}' not found")
        agent = self._agents[name]
        try:
            output = agent.run(job)
            resp = AgentResponse(agent=name, success=True, output=output)
        except Exception as exc:  # noqa: BLE001
            resp = AgentResponse(agent=name, success=False, output=None, error=str(exc))
        self._log(job, resp)
        return resp

    def _log(self, job: Dict[str, Any], resp: AgentResponse) -> None:
        now = datetime.now(timezone.utc)
        entry = {
            "timestamp": now.isoformat(),
            "job": job,
            "response": {
                "agent": resp.agent,
                "success": resp.success,
                "output": resp.output,
                "error": resp.error,
            },
        }
        filename = self._log_dir / f"{resp.agent}-{int(now.timestamp())}.json"
        with filename.open("w", encoding="utf-8") as fh:
            json.dump(entry, fh, ensure_ascii=False, indent=2)
        print(json.dumps(entry, ensure_ascii=False))

