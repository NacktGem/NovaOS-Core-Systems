"""Audita agent: compliance and legal checks."""
from __future__ import annotations

from typing import Any, Dict, List

from agents.base import Agent


class AuditaAgent(Agent):
    """Performs simple text compliance scans."""

    def __init__(self) -> None:
        super().__init__("audita", description="Compliance and audit agent")

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command != "scan_text":
                raise ValueError(f"unknown command '{command}'")
            text = args.get("text", "")
            prohibited: List[str] = args.get("prohibited", [])
            violations = [term for term in prohibited if term in text]
            output = {"violations": violations, "compliant": not violations}
            if payload.get("log"):
                self.log_result(output)
            return {"success": True, "output": output, "error": None}
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
