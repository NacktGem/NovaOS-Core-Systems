"""Riven agent: parental and survival support."""
from __future__ import annotations

import json
import math
import shutil
from pathlib import Path
from typing import Any, Dict, List, Tuple

from agents.base import BaseAgent
from agents.common.alog import info


class RivenAgent(BaseAgent):
    """Safeguards families, health, and off-grid readiness."""

    def __init__(self) -> None:
        """Establish logging directory for survival telemetry."""
        super().__init__("riven", description="Parental and survival agent")
        self._log_dir = Path("logs/riven")
        self._log_dir.mkdir(parents=True, exist_ok=True)

    def _append_json(self, filename: str, entry: Dict[str, Any]) -> None:
        """Append structured entries to Riven's journal files."""
        path = self._log_dir / filename
        data: List[Dict[str, Any]] = []
        if path.exists():
            data = json.loads(path.read_text(encoding="utf-8"))
        data.append(entry)
        path.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")

    def _haversine(self, start: Tuple[float, float], end: Tuple[float, float]) -> float:
        """Calculate great-circle distance between coordinates in meters."""
        R = 6371_000
        lat1, lon1 = map(math.radians, start)
        lat2, lon2 = map(math.radians, end)
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        return R * c

    def track_device(self, device_id: str, location: Dict[str, Any]) -> Dict[str, Any]:
        """Record device location updates for guardians."""
        entry = {"device_id": device_id, "location": location}
        self._append_json("device_track.json", entry)
        return entry

    def log_symptom(self, user: str, symptom: str) -> Dict[str, str]:
        """Track symptoms for on-call medics."""
        entry = {"user": user, "symptom": symptom}
        self._append_json("symptoms.json", entry)
        return entry

    def generate_protocol(self, title: str, steps: List[str]) -> Dict[str, Any]:
        """Produce survival or care protocol steps."""
        ordered = [f"Step {idx + 1}: {step}" for idx, step in enumerate(steps)]
        return {"title": title, "steps": ordered}

    def bugout_map(self, start: Tuple[float, float], end: Tuple[float, float]) -> Dict[str, Any]:
        """Return escape path and distance."""
        distance = self._haversine(start, end)
        return {"distance_m": distance, "path": [start, end]}

    def wipe_device(self, path: str) -> Dict[str, str]:
        """Securely remove a directory or file on-demand."""
        target = Path(path)
        if not target.exists():
            raise FileNotFoundError(f"path not found: {target}")
        if target.is_dir():
            shutil.rmtree(target)
        else:
            target.unlink()
        return {"deleted": str(target)}

    def calculate_supply_run(self, days: int, people: int) -> Dict[str, Any]:
        """Estimate required supplies for off-grid survival."""
        water_per_day = 4  # liters per person
        calories_per_day = 2200
        water_total = water_per_day * days * people
        calories_total = calories_per_day * days * people
        return {
            "water_liters": water_total,
            "calories": calories_total,
            "recommended_items": ["water purification", "solar charger", "field medical kit"],
        }

    def medical_summary(self, entries: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Synthesize symptom logs into a quick triage summary."""
        summary: Dict[str, List[str]] = {}
        for entry in entries:
            user = entry.get("user", "unknown")
            summary.setdefault(user, []).append(entry.get("symptom", ""))
        alerts = [user for user, symptoms in summary.items() if len(symptoms) >= 3]
        return {"patients": summary, "escalate": alerts}

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Dispatch Riven operations."""
        command = payload.get("command")
        args = payload.get("args", {})
        info("riven.command", {"command": command, "args": list(args.keys())})
        try:
            if command == "track_device":
                return {"success": True, "output": self.track_device(args.get("device_id"), args.get("location")), "error": None}
            if command == "log_symptom":
                return {"success": True, "output": self.log_symptom(args.get("user"), args.get("symptom")), "error": None}
            if command == "generate_protocol":
                return {"success": True, "output": self.generate_protocol(args.get("title", ""), list(args.get("steps", []))), "error": None}
            if command == "bugout_map":
                start = tuple(args.get("start", (0.0, 0.0)))
                end = tuple(args.get("end", (0.0, 0.0)))
                return {"success": True, "output": self.bugout_map(start, end), "error": None}
            if command == "wipe_device":
                return {"success": True, "output": self.wipe_device(args.get("path", "")), "error": None}
            if command == "supply_run":
                return {
                    "success": True,
                    "output": self.calculate_supply_run(int(args.get("days", 3)), int(args.get("people", 1))),
                    "error": None,
                }
            if command == "medical_summary":
                return {"success": True, "output": self.medical_summary(list(args.get("entries", []))), "error": None}
            raise ValueError(f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}

