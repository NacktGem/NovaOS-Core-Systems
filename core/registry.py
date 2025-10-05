"""Agent registry and execution router for NovaOS."""
from __future__ import annotations

import json
import os
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Optional

try:
    import requests
except ModuleNotFoundError:  # pragma: no cover - fallback to stdlib
    requests = None  # type: ignore[assignment]

from agents.base import BaseAgent


@dataclass
class AgentResponse:
    """Standardized agent response with audit metadata."""

    agent: str
    success: bool
    output: Any
    error: Optional[str] = None
    job_id: Optional[str] = None
    request_id: Optional[str] = None
    role: Optional[str] = None


class AgentRegistry:
    """Registers and executes NovaOS agents with token security and auditing."""

    def __init__(
        self,
        token: Optional[str] = None,
        *,
        core_api_url: Optional[str] = None,
        shared_secret: Optional[str] = None,
    ) -> None:
        self._agents: Dict[str, BaseAgent] = {}
        self._token = token or os.getenv("NOVA_AGENT_TOKEN")
        self._log_dir = Path("logs")
        self._log_dir.mkdir(exist_ok=True)
        base_url = core_api_url or os.getenv("CORE_API_URL")
        self._core_api_url = base_url.rstrip("/") if base_url else None
        self._shared_secret = shared_secret or os.getenv("AGENT_SHARED_TOKEN") or self._token
        if self._core_api_url and requests is not None:
            self._session = requests.Session()
        else:
            self._session = None

    def register(self, name: str, handler: BaseAgent) -> None:
        if name in self._agents:
            raise ValueError(f"agent '{name}' already registered")
        self._agents[name] = handler

    @property
    def agents(self) -> Dict[str, BaseAgent]:
        """Expose a copy of registered agents for orchestration layers."""
        return dict(self._agents)

    def call(
        self,
        name: str,
        job: Dict[str, Any],
        token: Optional[str] = None,
        role: Optional[str] = None,
        *,
        source: Optional[str] = None,
        request_id: Optional[str] = None,
        identity: Optional[Dict[str, Any]] = None,
    ) -> AgentResponse:
        if self._token and token != self._token:
            resp = AgentResponse(agent=name, success=False, output=None, error="invalid agent token", role=role)
            job_id = self._log(job, resp, role, source, identity, request_id)
            resp.job_id = job_id
            resp.request_id = request_id
            return resp
        if name not in self._agents:
            resp = AgentResponse(
                agent=name,
                success=False,
                output=None,
                error=f"agent '{name}' not found",
                role=role,
            )
            job_id = self._log(job, resp, role, source, identity, request_id)
            resp.job_id = job_id
            resp.request_id = request_id
            return resp
        agent = self._agents[name]
        try:
            result = agent.run(job)
            resp = AgentResponse(
                agent=name,
                success=bool(result.get("success")),
                output=result.get("output"),
                error=result.get("error"),
                role=role,
            )
        except Exception as exc:  # noqa: BLE001
            resp = AgentResponse(agent=name, success=False, output=None, error=str(exc), role=role)
        job_id = self._log(job, resp, role, source, identity, request_id)
        resp.job_id = job_id
        resp.request_id = request_id or getattr(resp, "request_id", None)
        return resp

    def _log(
        self,
        job: Dict[str, Any],
        resp: AgentResponse,
        role: Optional[str],
        source: Optional[str],
        identity: Optional[Dict[str, Any]],
        request_id: Optional[str],
    ) -> str:
        now = datetime.now(timezone.utc)
        job_id = uuid.uuid4().hex
        request_id = request_id or uuid.uuid4().hex
        entry = {
            "timestamp": now.isoformat(),
            "job_id": job_id,
            "request_id": request_id,
            "role": role,
            "source": source or "registry",
            "job": job,
            "response": {
                "agent": resp.agent,
                "success": resp.success,
                "error": resp.error,
            },
        }
        if resp.output is not None:
            entry["response"]["output"] = resp.output
        if identity:
            entry["identity"] = identity
        agent_dir = self._log_dir / resp.agent
        agent_dir.mkdir(parents=True, exist_ok=True)
        filename = agent_dir / f"{job_id}.json"
        with filename.open("w", encoding="utf-8") as fh:
            json.dump(entry, fh, ensure_ascii=False, indent=2)
        self._push_audit(entry)
        resp.request_id = request_id
        print(json.dumps(entry, ensure_ascii=False))
        return job_id

    def _push_audit(self, entry: Dict[str, Any]) -> None:
        if not self._core_api_url or not self._shared_secret:
            return
        url = f"{self._core_api_url}/api/v1/agent/audit"
        headers = {"X-Agent-Token": self._shared_secret}
        try:
            if self._session is not None:
                self._session.post(url, json=entry, headers=headers, timeout=5)
            else:  # pragma: no cover - fallback path
                from urllib.request import Request, urlopen

                data = json.dumps(entry, default=str).encode("utf-8")
                req = Request(
                    url,
                    data=data,
                    headers={**headers, "Content-Type": "application/json"},
                    method="POST",
                )
                urlopen(req, timeout=5)
        except Exception:
            # Audit delivery is best-effort; failures should never impact execution.
            pass

