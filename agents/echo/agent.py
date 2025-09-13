"""Echo agent: message and file relay."""
from __future__ import annotations

import hashlib
from pathlib import Path
from shutil import copy2
from typing import Any, Dict, List

from agents.base import BaseAgent


class EchoAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("echo", description="Comms relay agent")

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command == "send_message":
                message = args.get("message", "")
                return {"success": True, "output": {"message": message}, "error": None}

            if command == "send_file":
                src = Path(args.get("src", ""))
                dst = Path(args.get("dst", ""))
                if not src.is_file():
                    raise FileNotFoundError(f"missing source file: {src}")
                dst.parent.mkdir(parents=True, exist_ok=True)
                copy2(src, dst)
                return {"success": True, "output": {"copied": str(dst)}, "error": None}

            if command == "send_voice":
                path = Path(args.get("path", ""))
                if not path.is_file():
                    raise FileNotFoundError(f"voice file not found: {path}")
                sha256 = hashlib.sha256(path.read_bytes()).hexdigest()
                return {"success": True, "output": {"sha256": sha256}, "error": None}

            if command == "broadcast":
                message = args.get("message", "")
                recipients: List[str] = args.get("recipients", [])
                return {
                    "success": True,
                    "output": {"message": message, "recipients": recipients},
                    "error": None,
                }

            raise ValueError(f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
