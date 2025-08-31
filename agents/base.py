"""Common interface for all NovaOS agents."""
from __future__ import annotations

import abc
from typing import Any, Dict


class BaseAgent(abc.ABC):
    """Base class that defines the required agent interface."""

    def __init__(self, name: str, version: str = "1.0", description: str = "") -> None:
        self.name = name
        self.version = version
        self.description = description

    @abc.abstractmethod
    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Execute agent logic and return a standardized response."""


# Backwards compatibility alias
Agent = BaseAgent
