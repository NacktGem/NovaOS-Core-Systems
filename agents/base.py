"""Agent base class for NovaOS."""
from __future__ import annotations

 codex/begin-phase-2-using-.codexrc.md-dsuxs1
from abc import ABC, abstractmethod
from typing import Any, Dict


class Agent(ABC):

from typing import Any, Dict


class Agent:
main
    """Base class that all NovaOS agents extend."""

    name: str

    def __init__(self, name: str) -> None:
        self.name = name

codex/begin-phase-2-using-.codexrc.md-dsuxs1
    @abstractmethod
    def run(self, job: Dict[str, Any]) -> Any:  # pragma: no cover - interface
        """Execute a job and return a result."""

    def run(self, job: Dict[str, Any]) -> Any:  # pragma: no cover - interface
main
        raise NotImplementedError
