"""Glitch agent: basic file forensics utilities."""
from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any, Dict

from agents.base import Agent


class GlitchAgent(Agent):
    """Provides simple file forensics such as hashing."""

    def __init__(self) -> None:
        super().__init__("glitch")

    def run(self, job: Dict[str, Any]) -> Dict[str, Any]:
        path_str = job.get("path")
        if not path_str:
            raise ValueError("missing 'path'")
        path = Path(path_str)
        if not path.is_file():
            raise FileNotFoundError(f"file not found: {path}")
        data = path.read_bytes()
        sha256 = hashlib.sha256(data).hexdigest()
        return {
            "path": str(path.resolve()),
            "size": path.stat().st_size,
            "sha256": sha256,
        }
