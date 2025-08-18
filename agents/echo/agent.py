"""Echo agent: returns the provided message."""
from __future__ import annotations

from typing import Any, Dict

from agents.base import Agent


class EchoAgent(Agent):
    def __init__(self) -> None:
        super().__init__("echo")

    def run(self, job: Dict[str, Any]) -> Dict[str, Any]:
        message = job.get("message", "")
        return {"echo": message}
