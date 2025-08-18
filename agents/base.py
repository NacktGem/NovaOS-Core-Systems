"""Agent base class for NovaOS."""
from __future__ import annotations

from typing import Any, Dict


class Agent:
    """Base class that all NovaOS agents extend."""

    name: str

    def __init__(self, name: str) -> None:
        self.name = name

    def run(self, job: Dict[str, Any]) -> Any:  # pragma: no cover - interface
        raise NotImplementedError
