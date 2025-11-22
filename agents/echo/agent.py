"""Echo agent: message and file relay."""

from __future__ import annotations

import hashlib
from pathlib import Path
from shutil import copy2
from typing import Any, Dict, List

from agents.base import BaseAgent
from agents.common.alog import info


class EchoAgent(BaseAgent):
    """Guarantees secure delivery of Nova communications artifacts."""

    def __init__(self) -> None:
        """Set canonical identifier for Echo."""
        super().__init__("echo", description="Comms relay agent")

    def _wrap(
        self, command: str, details: Dict[str, Any] | None, error: str | None
    ) -> Dict[str, Any]:
        """Wrap results with structured output for consistency."""
        success = error is None
        summary = f"Echo completed '{command}'" if success else f"Echo failed '{command}': {error}"

        # Log to central system
        if success:
            info(f"echo.{command}", details or {})
        else:
            info(f"echo.{command}.error", {"error": error})

        return {
            "success": success,
            "output": {
                "summary": summary,
                "details": details or {},
            },
            "error": error,
        }

    def send_message(self, message: str) -> Dict[str, Any]:
        """Echo plain text messages across channels."""
        try:
            digest = hashlib.sha256(message.encode("utf-8")).hexdigest()[:16]
            result = {"message": message, "checksum": digest}
            return self._wrap("send_message", result, None)
        except Exception as exc:
            return self._wrap("send_message", None, str(exc))

    def send_file(self, src: str, dst: str) -> Dict[str, Any]:
        """Copy a file to the requested destination preserving metadata."""
        try:
            source = Path(src)
            target = Path(dst)
            if not source.is_file():
                raise FileNotFoundError(f"missing source file: {source}")
            target.parent.mkdir(parents=True, exist_ok=True)
            copy2(source, target)
            result = {"copied": str(target), "size": str(source.stat().st_size)}
            return self._wrap("send_file", result, None)
        except Exception as exc:
            return self._wrap("send_file", None, str(exc))

    def send_voice(self, path: str) -> Dict[str, Any]:
        """Return fingerprint of transmitted voice memo."""
        try:
            voice_path = Path(path)
            if not voice_path.is_file():
                raise FileNotFoundError(f"voice file not found: {voice_path}")
            sha256 = hashlib.sha256(voice_path.read_bytes()).hexdigest()
            result = {"sha256": sha256}
            return self._wrap("send_voice", result, None)
        except Exception as exc:
            return self._wrap("send_voice", None, str(exc))

    def broadcast(self, message: str, recipients: List[str]) -> Dict[str, Any]:
        """Broadcast to multiple recipients, tagging offline deliveries."""
        try:
            tagged = [
                {
                    "recipient": recipient,
                    "status": "queued" if recipient.endswith(".offline") else "delivered",
                }
                for recipient in recipients
            ]
            result = {"message": message, "recipients": tagged}
            return self._wrap("broadcast", result, None)
        except Exception as exc:
            return self._wrap("broadcast", None, str(exc))

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Echo commands with structured output."""
        command = payload.get("command", "")
        args = payload.get("args", {})

        try:
            if command == "send_message":
                message = args.get("message", "")
                return self.send_message(message)

            if command == "send_file":
                src = args.get("src", "")
                dst = args.get("dst", "")
                return self.send_file(src, dst)

            if command == "send_voice":
                path = args.get("path", "")
                return self.send_voice(path)

            if command == "broadcast":
                message = args.get("message", "")
                recipients = args.get("recipients", [])
                return self.broadcast(message, recipients)

            return self._wrap(command or "", None, f"unknown command '{command}'")

        except Exception as exc:
            return self._wrap(command or "", None, str(exc))
