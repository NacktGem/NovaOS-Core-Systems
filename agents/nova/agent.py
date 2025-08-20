"""Nova orchestrator agent."""
from __future__ import annotations

from typing import Any, Dict

from agents.base import BaseAgent
from core.registry import AgentRegistry, AgentResponse


class NovaAgent(BaseAgent):
    def __init__(self, registry: AgentRegistry) -> None:
        super().__init__("nova", description="Platform orchestrator")
        self._registry = registry

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        target = payload.get("agent")
        if not target:
            return {"success": False, "output": None, "error": "missing target agent"}
        command = payload.get("command")
        args = payload.get("args", {})
        token = payload.get("token")
        job = {"command": command, "args": args, "log": payload.get("log")}
        try:
            resp: AgentResponse = self._registry.call(target, job, token)
            return {"success": resp.success, "output": resp.output, "error": resp.error, "job_id": resp.job_id}
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
