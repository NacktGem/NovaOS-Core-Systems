"""Velora agent: analytics and business automation."""

from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List

from agents.base import BaseAgent, resolve_platform_log

# Optional analytics tools:
# REQUIRES pandas — Not installed by default
#   pip install pandas


class VeloraAgent(BaseAgent):
    def __init__(self) -> None:
        super().__init__("velora", description="Business analytics agent")
        self._log_dir = Path("logs/velora")
        self._log_dir.mkdir(parents=True, exist_ok=True)
        self._platform_log = resolve_platform_log("velora")

    def _log(self, entry: Dict[str, Any]) -> None:
        try:
            self._platform_log.write_text(
                (
                    self._platform_log.read_text(encoding="utf-8")
                    if self._platform_log.exists()
                    else ""
                )
                + json.dumps(entry)
                + "\n",
                encoding="utf-8",
            )
        except Exception:
            pass

    def _wrap(
        self, command: str, details: Dict[str, Any] | None, error: str | None
    ) -> Dict[str, Any]:
        success = error is None
        summary = (
            f"Velora completed '{command}'" if success else f"Velora failed '{command}': {error}"
        )
        self._log({"command": command, "success": success, "error": error})
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
        """Execute Velora analytics operations.

        Common commands include generate_report, schedule_post, forecast_revenue,
        crm_export, ad_generate, analyze_dataset.
        """
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command == "generate_report":
                data: Dict[str, float] = args.get("data", {})
                total = sum(data.values())
                avg = total / len(data) if data else 0
                details = {"total": total, "average": avg, "metrics": data}
                return self._wrap(command, details, None)

            if command == "schedule_post":
                content = args.get("content", "")
                when = datetime.fromisoformat(args.get("when"))
                schedule_file = self._log_dir / "schedule.json"
                entries: List[Dict[str, Any]] = []
                if schedule_file.exists():
                    entries = json.loads(schedule_file.read_text(encoding="utf-8"))
                entry = {"content": content, "when": when.isoformat()}
                entries.append(entry)
                schedule_file.write_text(
                    json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8"
                )
                return self._wrap(command, entry, None)

            if command == "forecast_revenue":
                history: List[float] = args.get("history", [])
                if len(history) < 2:
                    raise ValueError("history requires at least two points")
                growth = history[-1] - history[-2]
                forecast = history[-1] + growth
                return self._wrap(command, {"forecast": forecast}, None)

            if command == "crm_export":
                clients: List[Dict[str, Any]] = args.get("clients", [])
                path = self._log_dir / "crm.csv"
                with path.open("w", newline="", encoding="utf-8") as fh:
                    writer = csv.DictWriter(fh, fieldnames=["name", "email"])
                    writer.writeheader()
                    for c in clients:
                        writer.writerow({"name": c.get("name"), "email": c.get("email")})
                return self._wrap(command, {"exported": str(path)}, None)

            if command == "ad_generate":
                product = args.get("product", "")
                audience = args.get("audience", "")
                copy = f"Attention {audience}! Experience the power of {product}."
                return self._wrap(command, {"ad": copy}, None)

            if command == "analyze_dataset":
                # Accept CSV or JSON file
                path = Path(args.get("path", ""))
                if not path.is_file():
                    return self._wrap(command, None, f"dataset not found: {path}")
                # Try pandas for richer analysis
                df = None
                try:
                    import pandas as pd  # type: ignore

                    if path.suffix.lower() == ".csv":
                        df = pd.read_csv(path)
                    else:
                        df = pd.read_json(path)
                    summary = {
                        "rows": int(df.shape[0]),
                        "cols": int(df.shape[1]),
                        "columns": list(map(str, df.columns)),
                    }
                    numeric = df.select_dtypes(include=["number"]).describe().to_dict()
                    details = {"summary": summary, "numeric_stats": numeric}
                    return self._wrap(command, details, None)
                except Exception:
                    # Lightweight fallback without pandas
                    try:
                        if path.suffix.lower() == ".csv":
                            with path.open("r", encoding="utf-8") as fh:
                                reader = csv.DictReader(fh)
                                rows = list(reader)
                                cols = reader.fieldnames or []
                        else:
                            rows = json.loads(path.read_text(encoding="utf-8"))
                            if isinstance(rows, dict):
                                rows = [rows]
                            cols = list(rows[0].keys()) if rows else []
                        details = {"rows": len(rows), "columns": cols[:50]}
                        return self._wrap(command, details, None)
                    except Exception as e:
                        return self._wrap(command, None, str(e))

            return self._wrap(command or "", None, f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return self._wrap(command or "", None, str(exc))

    def generate_funnel_report(self, events: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Compute a simple conversion funnel from event data."""
        stages = ["view", "click", "signup", "purchase"]
        counts = {s: 0 for s in stages}
        for e in events:
            s = str(e.get("stage", "")).lower()
            if s in counts:
                counts[s] += 1
        return self._wrap("generate_funnel_report", {"stages": counts}, None)

    def segment_audience(self, users: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Segment users by rough activity level."""
        segments = {"low": 0, "medium": 0, "high": 0}
        for u in users:
            a = int(u.get("activity", 0))
            if a >= 80:
                segments["high"] += 1
            elif a >= 30:
                segments["medium"] += 1
            else:
                segments["low"] += 1
        return self._wrap("segment_audience", {"segments": segments}, None)

    def forecast_kpis(self, history: Dict[str, List[float]]) -> Dict[str, Any]:
        """Naive last-delta forecast per KPI."""
        out: Dict[str, float] = {}
        for k, series in history.items():
            if len(series) >= 2:
                out[k] = series[-1] + (series[-1] - series[-2])
        return self._wrap("forecast_kpis", {"forecast": out}, None)
