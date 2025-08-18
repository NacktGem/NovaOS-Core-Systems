"""Nova orchestrator agent."""
from __future__ import annotations

from typing import Any, Dict

from agents.base import Agent
from core.registry import AgentRegistry, AgentResponse


class NovaAgent(Agent):
    def __init__(self, registry: AgentRegistry) -> None:
        super().__init__("nova")
        self._registry = registry

    def run(self, job: Dict[str, Any]) -> Dict[str, Any]:
        target = job.get("agent")
        if not target:
            raise ValueError("missing target agent")
        payload = job.get("payload", {})
        token = job.get("token")
        resp: AgentResponse = self._registry.call(target, payload, token)
        return {
            "invoked": target,
            "success": resp.success,
            "output": resp.output,
            "error": resp.error,
        }
