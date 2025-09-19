"""Echo agent: message and file relay."""

from __future__ import annotations

import hashlib
from pathlib import Path
from shutil import copy2
from typing import Any, Dict, List

from agents.base import BaseAgent, resolve_platform_log


class EchoAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("echo", description="Comms relay agent")
        self._platform_log = resolve_platform_log("echo")

    def _wrap(self, command: str, details: dict | None, error: str | None) -> Dict[str, Any]:
        success = error is None
        summary = f"Echo completed '{command}'" if success else f"Echo failed '{command}': {error}"
        try:
            with self._platform_log.open("a", encoding="utf-8") as fh:
                fh.write(f"{summary} | details={details} | error={error}\n")
        except Exception:
            pass
        return {
            "success": success,
            "output": {
                "summary": summary,
                "details": details or {},
                "logs_path": str(self._platform_log),
            },
            "error": error,
        }

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Echo commands.

        Supported commands:
        - send_message: { message, recipient }
        - send_file: { src, dst }
        - send_voice: { path }
        - broadcast: { message, recipients[] }
        """
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command == "send_message":
                message = args.get("message", "")
                recipient = args.get("recipient")
                details = {"message": message, "recipient": recipient, "delivery": "simulated"}
                return self._wrap(command, details, None)

            if command == "send_file":
                src = Path(args.get("src", ""))
                dst = Path(args.get("dst", ""))
                if not src.is_file():
                    raise FileNotFoundError(f"missing source file: {src}")
                dst.parent.mkdir(parents=True, exist_ok=True)
                copy2(src, dst)
                return self._wrap(command, {"copied": str(dst)}, None)

            if command == "send_voice":
                path = Path(args.get("path", ""))
                if not path.is_file():
                    raise FileNotFoundError(f"voice file not found: {path}")
                sha256 = hashlib.sha256(path.read_bytes()).hexdigest()
                return self._wrap(command, {"sha256": sha256}, None)

            if command == "broadcast":
                message = args.get("message", "")
                recipients: List[str] = args.get("recipients", [])
                return self._wrap(command, {"message": message, "recipients": recipients}, None)

            return self._wrap(command or "", None, f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return self._wrap(command or "", None, str(exc))

    def schedule_broadcast(self, when_iso: str, message: str, recipients: List[str]) -> Dict[str, Any]:
        """Placeholder: schedule a broadcast message for later delivery.

        Returns a lightweight acknowledgement structure.
        """
        return {
            "success": True,
            "output": {
                "summary": "Broadcast scheduled",
                "details": {"when": when_iso, "message": message, "recipients": recipients},
                "logs_path": str(self._platform_log),
            },
            "error": None,
        }
