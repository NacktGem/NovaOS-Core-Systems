"""Velora agent: analytics and business automation."""
from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from agents.base import BaseAgent


class VeloraAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("velora", description="Business analytics agent")
        self._log_dir = Path("logs/velora")
        self._log_dir.mkdir(parents=True, exist_ok=True)

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command == "generate_report":
                data: Dict[str, float] = args.get("data", {})
                total = sum(data.values())
                avg = total / len(data) if data else 0
                return {
                    "success": True,
                    "output": {"total": total, "average": avg, "metrics": data},
                    "error": None,
                }

            if command == "schedule_post":
                content = args.get("content", "")
                when = datetime.fromisoformat(args.get("when"))
                schedule_file = self._log_dir / "schedule.json"
                entries: List[Dict[str, Any]] = []
                if schedule_file.exists():
                    entries = json.loads(schedule_file.read_text(encoding="utf-8"))
                entry = {"content": content, "when": when.isoformat()}
                entries.append(entry)
                schedule_file.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
                return {"success": True, "output": entry, "error": None}

            if command == "forecast_revenue":
                history: List[float] = args.get("history", [])
                if len(history) < 2:
                    raise ValueError("history requires at least two points")
                growth = history[-1] - history[-2]
                forecast = history[-1] + growth
                return {"success": True, "output": {"forecast": forecast}, "error": None}

            if command == "crm_export":
                clients: List[Dict[str, Any]] = args.get("clients", [])
                path = self._log_dir / "crm.csv"
                with path.open("w", newline="", encoding="utf-8") as fh:
                    writer = csv.DictWriter(fh, fieldnames=["name", "email"])
                    writer.writeheader()
                    for c in clients:
                        writer.writerow({"name": c.get("name"), "email": c.get("email")})
                return {"success": True, "output": {"exported": str(path)}, "error": None}

            if command == "ad_generate":
                product = args.get("product", "")
                audience = args.get("audience", "")
                copy = f"Attention {audience}! Experience the power of {product}."
                return {"success": True, "output": {"ad": copy}, "error": None}

            raise ValueError(f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
