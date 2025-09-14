"""Riven agent: parental and survival support."""
from __future__ import annotations

import json
import math
import shutil
from pathlib import Path
from typing import Any, Dict, List, Tuple

from agents.base import BaseAgent


class RivenAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("riven", description="Parental and survival agent")
        self._log_dir = Path("logs/riven")
        self._log_dir.mkdir(parents=True, exist_ok=True)
        self._platform_log = Path("/logs/riven.log")
        self._platform_log.parent.mkdir(parents=True, exist_ok=True)

    def _append_json(self, filename: str, entry: Dict[str, Any]) -> None:
        path = self._log_dir / filename
        data: List[Dict[str, Any]] = []
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
        data.append(entry)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def _haversine(self, start: Tuple[float, float], end: Tuple[float, float]) -> float:
        R = 6371_000
        lat1, lon1 = map(math.radians, start)
        lat2, lon2 = map(math.radians, end)
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command == "track_device":
                entry = {"device_id": args.get("device_id"), "location": args.get("location")}
                self._append_json("device_track.json", entry)
                return self._wrap(command, entry, None)

            if command == "log_symptom":
                entry = {"user": args.get("user"), "symptom": args.get("symptom")}
                self._append_json("symptoms.json", entry)
                # Simple alerting rules
                symptom = (entry.get("symptom") or "").lower()
                alert = "green"
                if any(k in symptom for k in ["chest pain", "faint", "severe", "bleeding"]):
                    alert = "red"
                elif any(k in symptom for k in ["fever", "vomit", "dizzy"]):
                    alert = "yellow"
                entry["alert_level"] = alert
                return self._wrap(command, entry, None)

            if command == "generate_protocol":
                title = args.get("title", "")
                steps = [f"Step {i+1}: {s}" for i, s in enumerate(args.get("steps", []))]
                protocol = {"title": title, "steps": steps}
                return self._wrap(command, protocol, None)

            if command == "bugout_map":
                start = tuple(args.get("start", (0.0, 0.0)))
                end = tuple(args.get("end", (0.0, 0.0)))
                distance = self._haversine(start, end)
                path = [start, end]
                return self._wrap(command, {"distance_m": distance, "path": path}, None)

            if command == "wipe_device":
                target = Path(args.get("path", ""))
                if not target.exists():
                    return self._wrap(command, None, f"path not found: {target}")
                if target.is_dir():
                    shutil.rmtree(target)
                else:
                    target.unlink()
                return self._wrap(command, {"deleted": str(target)}, None)

            return self._wrap(command or "", None, f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return self._wrap(command or "", None, str(exc))

    def _wrap(self, command: str, details: Dict[str, Any] | None, error: str | None) -> Dict[str, Any]:
        success = error is None
        summary = (
            f"Riven completed '{command}'"
            if success
            else f"Riven failed '{command}': {error}"
        )
        try:
            with self._platform_log.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({"command": command, "success": success, "error": error}) + "\n")
        except Exception:
            pass
        return {
            "success": success,
            "output": {"summary": summary, "details": details or {}, "logs_path": str(self._platform_log)},
            "error": error,
        }

