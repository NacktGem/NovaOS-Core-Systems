"""Agent base class for NovaOS."""
from __future__ import annotations

from abc import ABC, abstractmethod
from typing import Any, Dict


class Agent(ABC):
    """Base class that all NovaOS agents extend."""

    name: str

    def __init__(self, name: str) -> None:
        self.name = name

    @abstractmethod
    def run(self, job: Dict[str, Any]) -> Any:  # pragma: no cover - interface
        """Execute a job and return a result."""

