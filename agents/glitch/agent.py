"""Glitch agent: forensics and security utilities."""
from __future__ import annotations

import hashlib
import math
import os
import socket
import subprocess
from pathlib import Path
from typing import Any, Dict, List

from agents.base import BaseAgent


class GlitchAgent(BaseAgent):
    """Provides file hashing, entropy checks, and simple probes."""

    def __init__(self) -> None:
        super().__init__("glitch", description="Forensics and security agent")

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command == "hash_file":
                path = Path(args.get("path", ""))
                if not path.is_file():
                    raise FileNotFoundError(f"file not found: {path}")
                data = path.read_bytes()
                sha256 = hashlib.sha256(data).hexdigest()
                md5 = hashlib.md5(data).hexdigest()
                return {
                    "success": True,
                    "output": {
                        "path": str(path.resolve()),
                        "size": path.stat().st_size,
                        "sha256": sha256,
                        "md5": md5,
                    },
                    "error": None,
                }

            if command == "scan_system":
                ps = subprocess.run(
                    ["ps", "-eo", "pid,comm"], capture_output=True, text=True, check=True
                )
                disk = subprocess.run(
                    ["df", "-h", "/"], capture_output=True, text=True, check=True
                )
                return {
                    "success": True,
                    "output": {
                        "processes": ps.stdout.strip().splitlines()[1:6],
                        "disk": disk.stdout.strip().splitlines()[1],
                    },
                    "error": None,
                }

            if command == "detect_entropy":
                path = Path(args.get("path", ""))
                if not path.is_file():
                    raise FileNotFoundError(f"file not found: {path}")
                data = path.read_bytes()
                if not data:
                    entropy = 0.0
                else:
                    counts = {byte: data.count(byte) for byte in set(data)}
                    entropy = -sum((c / len(data)) * math.log2(c / len(data)) for c in counts.values())
                return {"success": True, "output": {"entropy": entropy}, "error": None}

            if command == "sandbox_check":
                indicators: Dict[str, Any] = {}
                try:
                    indicators["cgroup"] = Path("/proc/1/cgroup").read_text()
                except Exception:  # noqa: BLE001
                    indicators["cgroup"] = ""
                indicators["container_env"] = bool(os.getenv("container") or os.getenv("CONTAINER"))
                virtualized = "docker" in indicators["cgroup"] or indicators["container_env"]
                return {
                    "success": True,
                    "output": {"virtualized": virtualized, "indicators": indicators},
                    "error": None,
                }

            if command == "network_probe":
                host = args.get("host", "127.0.0.1")
                ports: List[int] = args.get("ports", [22, 80, 443])
                open_ports: List[int] = []
                for port in ports:
                    try:
                        with socket.create_connection((host, port), timeout=0.5):
                            open_ports.append(port)
                    except Exception:
                        continue
                return {
                    "success": True,
                    "output": {"host": host, "open_ports": open_ports},
                    "error": None,
                }

            raise ValueError(f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
