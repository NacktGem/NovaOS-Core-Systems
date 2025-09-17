"""Nova orchestrator agent."""
from __future__ import annotations

from typing import Any, Dict, List

from agents.base import BaseAgent
from core.registry import AgentRegistry, AgentResponse


class NovaAgent(BaseAgent):
    """Routes commands across the NovaOS sovereign agent mesh."""

    def __init__(self, registry: AgentRegistry) -> None:
        """Bind Nova to the shared agent registry."""
        super().__init__("nova", description="Platform orchestrator")
        self._registry = registry

    def list_agents(self) -> List[str]:
        """Expose registered agent identifiers."""
        return sorted(self._registry._agents.keys())  # noqa: SLF001 - orchestrator level access

    def dispatch(self, target: str, job: Dict[str, Any], token: str | None, role: str | None) -> AgentResponse:
        """Delegate execution to a downstream agent with RBAC context."""
        return self._registry.call(target, job, token, role)

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Execute orchestrator commands such as dispatch and discovery."""
        action = payload.get("action", "dispatch")
        if action == "list_agents":
            return {"success": True, "output": self.list_agents(), "error": None}

        target = payload.get("agent")
        if not target:
            return {"success": False, "output": None, "error": "missing target agent"}
        command = payload.get("command")
        args = payload.get("args", {})
        token = payload.get("token")
        role = payload.get("role")
        job = {"command": command, "args": args, "log": payload.get("log")}
        try:
            resp = self.dispatch(target, job, token, role)
            return {"success": resp.success, "output": resp.output, "error": resp.error, "job_id": resp.job_id}
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
