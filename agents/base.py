# core/base.py

import abc
import json
import os
from datetime import datetime
from typing import Any, Dict


class BaseAgent(abc.ABC):
    """Common interface for all NovaOS agents."""

    def __init__(self, name: str, version: str = "1.0", description: str = "") -> None:
        self.name = name
        self.version = version
        self.description = description

    @abc.abstractmethod
    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute agent logic and return a standardized response.

        The response dict **must** contain the keys:
            success (bool)
            output (dict | None)
            error (str | None)
        """

    def log_result(self, result: Dict[str, Any]) -> None:
        """Persist result JSON for this agent."""
        log_dir = f"logs/{self.name}"
        os.makedirs(log_dir, exist_ok=True)
        timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
        with open(f"{log_dir}/{timestamp}.json", "w", encoding="utf-8") as fh:
            json.dump(result, fh, ensure_ascii=False, indent=2)
        print(f"[{self.name}] Result logged at {log_dir}/{timestamp}.json")


# Backwards compatibility
Agent = BaseAgent