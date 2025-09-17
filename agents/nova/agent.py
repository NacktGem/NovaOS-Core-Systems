"""Nova orchestrator agent."""
from __future__ import annotations

import json
import os
import uuid
from typing import Any, Dict, List, Optional

try:
    import requests
except ModuleNotFoundError:  # pragma: no cover
    requests = None  # type: ignore[assignment]

from agents.base import BaseAgent
from core.registry import AgentRegistry, AgentResponse


class NovaAgent(BaseAgent):
    """Routes commands across the NovaOS sovereign agent mesh."""

    def __init__(self, registry: AgentRegistry) -> None:
        """Bind Nova to the shared agent registry."""
        super().__init__("nova", description="Platform orchestrator")
        self._registry = registry
        self._core_api_url = (os.getenv("CORE_API_URL") or "http://core-api:8000").rstrip("/")
        self._shared_token = os.getenv("AGENT_SHARED_TOKEN") or os.getenv("NOVA_AGENT_TOKEN", "")

    def list_agents(self) -> List[Dict[str, Any]]:
        """Expose registered agent metadata sourced from core-api."""
        headers = {"X-Agent-Token": self._shared_token} if self._shared_token else {}
        try:
            url = f"{self._core_api_url}/api/agents"
            if requests is not None:
                resp = requests.get(url, headers=headers, timeout=5)
                resp.raise_for_status()
                data = resp.json()
            else:  # pragma: no cover - fallback path
                from urllib.request import Request, urlopen

                req = Request(url, headers=headers)
                with urlopen(req, timeout=5) as http_resp:
                    data = json.loads(http_resp.read().decode("utf-8"))
            agents = data.get("agents") or []
            if isinstance(agents, list):
                return agents
        except Exception:
            pass
        # Fallback: introspect local registry when API lookup fails.
        return [
            {"name": name, "status": "unknown", "capabilities": []}
            for name in sorted(self._registry._agents.keys())  # noqa: SLF001
        ]

    def dispatch(
        self,
        target: str,
        job: Dict[str, Any],
        token: Optional[str],
        role: Optional[str],
        *,
        source: Optional[str] = None,
        request_id: Optional[str] = None,
        identity: Optional[Dict[str, Any]] = None,
    ) -> AgentResponse:
        """Delegate execution to a downstream agent with RBAC context."""
        request_id = request_id or uuid.uuid4().hex
        response = self._registry.call(
            target,
            job,
            token,
            role,
            source=source or "nova",
            request_id=request_id,
            identity=identity,
        )
        response.request_id = request_id
        return response

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
        identity = payload.get("identity")
        job = {
            "command": command,
            "args": args,
            "log": payload.get("log"),
            "requested_by": identity or {"role": role},
        }
        source = payload.get("source") or "nova"
        request_id = payload.get("request_id") or uuid.uuid4().hex
        try:
            resp = self.dispatch(
                target,
                job,
                token,
                role,
                source=source,
                request_id=request_id,
                identity=identity,
            )
            return {
                "success": resp.success,
                "output": resp.output,
                "error": resp.error,
                "job_id": resp.job_id,
                "request_id": resp.request_id or request_id,
            }
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
