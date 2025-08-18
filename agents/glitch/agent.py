"""Glitch agent: basic file forensics utilities."""
from __future__ import annotations

import hashlib
from pathlib import Path
from typing import Any, Dict

from agents.base import Agent


class GlitchAgent(Agent):
    """Provides simple file forensics such as hashing."""

    def __init__(self) -> None:
        super().__init__("glitch", description="Forensics and hashing agent")

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command != "hash_file":
                raise ValueError(f"unknown command '{command}'")
            path_str = args.get("path")
            if not path_str:
                raise ValueError("missing 'path'")
            path = Path(path_str)
            if not path.is_file():
                raise FileNotFoundError(f"file not found: {path}")
            data = path.read_bytes()
            sha256 = hashlib.sha256(data).hexdigest()
            output = {
                "path": str(path.resolve()),
                "size": path.stat().st_size,
                "sha256": sha256,
            }
            if payload.get("log"):
                self.log_result(output)
            return {"success": True, "output": output, "error": None}
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
