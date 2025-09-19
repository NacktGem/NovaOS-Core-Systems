"""Common interface for all NovaOS agents."""

from __future__ import annotations

import abc
from typing import Any, Dict
from pathlib import Path


def resolve_platform_log(agent_name: str) -> Path:
    """Return a writable log file path for the given agent.

    Prefers /logs/<agent>.log, but gracefully falls back to ./logs or /tmp/logs if
    /logs is not writable (helpful for local dev and tests). Always ensures the
    directory exists.
    """
    candidates = [Path("/logs"), Path.cwd() / "logs", Path("/tmp/logs")]
    for cand in candidates:
        try:
            cand.mkdir(parents=True, exist_ok=True)
            test_file = cand / ".write_test"
            test_file.write_text("ok", encoding="utf-8")
            try:
                test_file.unlink()
            except Exception:
                pass
            return cand / f"{agent_name}.log"
        except Exception:
            continue
    # Last resort: relative logs dir
    fallback = Path("logs")
    fallback.mkdir(parents=True, exist_ok=True)
    return fallback / f"{agent_name}.log"


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
