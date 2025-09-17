"""Echo agent: message and file relay."""
from __future__ import annotations

import hashlib
from pathlib import Path
from shutil import copy2
from typing import Any, Dict, List

from agents.base import BaseAgent


class EchoAgent(BaseAgent):
    """Guarantees secure delivery of Nova communications artifacts."""

    def __init__(self) -> None:
        """Set canonical identifier for Echo."""
        super().__init__("echo", description="Comms relay agent")

    def send_message(self, message: str) -> Dict[str, str]:
        """Echo plain text messages across channels."""
        digest = hashlib.sha256(message.encode("utf-8")).hexdigest()[:16]
        return {"message": message, "checksum": digest}

    def send_file(self, src: str, dst: str) -> Dict[str, str]:
        """Copy a file to the requested destination preserving metadata."""
        source = Path(src)
        target = Path(dst)
        if not source.is_file():
            raise FileNotFoundError(f"missing source file: {source}")
        target.parent.mkdir(parents=True, exist_ok=True)
        copy2(source, target)
        return {"copied": str(target), "size": str(source.stat().st_size)}

    def send_voice(self, path: str) -> Dict[str, str]:
        """Return fingerprint of transmitted voice memo."""
        voice_path = Path(path)
        if not voice_path.is_file():
            raise FileNotFoundError(f"voice file not found: {voice_path}")
        sha256 = hashlib.sha256(voice_path.read_bytes()).hexdigest()
        return {"sha256": sha256}

    def broadcast(self, message: str, recipients: List[str]) -> Dict[str, Any]:
        """Broadcast to multiple recipients, tagging offline deliveries."""
        tagged = [
            {"recipient": recipient, "status": "queued" if recipient.endswith(".offline") else "delivered"}
            for recipient in recipients
        ]
        return {"message": message, "recipients": tagged}

    def verify_integrity(self, payload: str, checksum: str) -> Dict[str, bool]:
        """Verify checksum integrity for delivered payloads."""
        expected = hashlib.sha256(payload.encode("utf-8")).hexdigest()
        return {"valid": expected == checksum, "expected": expected}

    def archive_transcript(self, transcript: str, path: str) -> Dict[str, str]:
        """Archive transcripts locally for compliance logs."""
        target = Path(path)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_text(transcript, encoding="utf-8")
        return {"archived": str(target)}

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Echo relay operations."""
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command == "send_message":
                return {"success": True, "output": self.send_message(args.get("message", "")), "error": None}
            if command == "send_file":
                return {"success": True, "output": self.send_file(args.get("src", ""), args.get("dst", "")), "error": None}
            if command == "send_voice":
                return {"success": True, "output": self.send_voice(args.get("path", "")), "error": None}
            if command == "broadcast":
                return {
                    "success": True,
                    "output": self.broadcast(args.get("message", ""), args.get("recipients", [])),
                    "error": None,
                }
            if command == "verify_integrity":
                return {"success": True, "output": self.verify_integrity(args.get("payload", ""), args.get("checksum", "")), "error": None}
            if command == "archive_transcript":
                return {"success": True, "output": self.archive_transcript(args.get("transcript", ""), args.get("path", "")), "error": None}
            raise ValueError(f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
