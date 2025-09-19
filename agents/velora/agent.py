"""Velora agent: analytics and business automation."""
from __future__ import annotations

import csv
import json
from datetime import datetime
from pathlib import Path
from statistics import mean
from typing import Any, Dict, Iterable, List, Sequence

from agents.base import BaseAgent
from agents.common.alog import info


class VeloraAgent(BaseAgent):
    """Transforms Nova's business telemetry into action."""

    def __init__(self) -> None:
        """Prepare storage for scheduled campaigns and exports."""
        super().__init__("velora", description="Business analytics agent")
        self._log_dir = Path("logs/velora")
        self._log_dir.mkdir(parents=True, exist_ok=True)

    def generate_report(self, metrics: Dict[str, float]) -> Dict[str, Any]:
        """Summarize numeric metrics with total, average, and ranking."""
        total = sum(metrics.values())
        ranking = sorted(metrics.items(), key=lambda item: item[1], reverse=True)
        return {
            "total": total,
            "average": total / len(metrics) if metrics else 0.0,
            "metrics": metrics,
            "leaders": ranking[:3],
        }

    def schedule_post(self, content: str, when: str) -> Dict[str, Any]:
        """Persist scheduled campaign posts with ISO timestamps."""
        when_dt = datetime.fromisoformat(when)
        schedule_file = self._log_dir / "schedule.json"
        entries: List[Dict[str, Any]] = []
        if schedule_file.exists():
            entries = json.loads(schedule_file.read_text(encoding="utf-8"))
        entry = {"content": content, "when": when_dt.isoformat()}
        entries.append(entry)
        schedule_file.write_text(json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8")
        return entry

    def forecast_revenue(self, history: Sequence[float]) -> Dict[str, float]:
        """Project next-period revenue using simple momentum and average growth."""
        if len(history) < 2:
            raise ValueError("history requires at least two points")
        momentum = history[-1] - history[-2]
        avg_growth = mean(
            history[i + 1] - history[i] for i in range(len(history) - 1)
        )
        forecast = history[-1] + (momentum + avg_growth) / 2
        return {"forecast": forecast, "momentum": momentum, "avg_growth": avg_growth}

    def export_crm(self, clients: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
        """Export CRM roster to CSV for sovereign records."""
        path = self._log_dir / "crm.csv"
        with path.open("w", newline="", encoding="utf-8") as fh:
            writer = csv.DictWriter(fh, fieldnames=["name", "email", "tier"])
            writer.writeheader()
            for client in clients:
                writer.writerow(
                    {
                        "name": client.get("name"),
                        "email": client.get("email"),
                        "tier": client.get("tier", "standard"),
                    }
                )
        return {"exported": str(path)}

    def generate_ad_copy(self, product: str, audience: str) -> Dict[str, str]:
        """Produce conversion-optimized copy for paid placements."""
        copy = (
            f"{audience.title()}, experience {product} — crafted for those who refuse compromise."
        )
        return {"ad": copy, "cta": "Book a private walkthrough"}

    def segment_customers(self, clients: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
        """Cluster customers by spend bands for tailored nurture sequences."""
        segments = {"sovereign": [], "growth": [], "drift": []}
        for client in clients:
            spend = float(client.get("lifetime_value", 0))
            if spend >= 5000:
                segments["sovereign"].append(client)
            elif spend >= 1000:
                segments["growth"].append(client)
            else:
                segments["drift"].append(client)
        return {"segments": {k: len(v) for k, v in segments.items()}, "details": segments}

    def calculate_ltv(self, monthly_spend: float, retention_months: int, margin: float = 0.6) -> Dict[str, float]:
        """Compute lifetime value using deterministic gross margin."""
        ltv = monthly_spend * retention_months * margin
        return {"ltv": ltv, "margin": margin}

    def funnel_health(self, stages: Dict[str, int]) -> Dict[str, Any]:
        """Evaluate funnel conversion rates and flag drop-off points."""
        ordered = ["impressions", "visits", "leads", "customers"]
        conversions: Dict[str, float] = {}
        alerts: List[str] = []
        for i in range(len(ordered) - 1):
            start, end = ordered[i], ordered[i + 1]
            start_count, end_count = stages.get(start, 0), stages.get(end, 0)
            rate = (end_count / start_count) if start_count else 0.0
            conversions[f"{start}_to_{end}"] = rate
            if start_count and rate < 0.05:
                alerts.append(f"Severe drop between {start} and {end}")
        return {"conversions": conversions, "alerts": alerts}

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Route Velora commands to analytics routines."""
        command = payload.get("command")
        args = payload.get("args", {})
        info("velora.command", {"command": command, "args": list(args.keys())})
        try:
            if command == "generate_report":
                return {"success": True, "output": self.generate_report(args.get("data", {})), "error": None}
            if command == "schedule_post":
                return {"success": True, "output": self.schedule_post(args.get("content", ""), args.get("when")), "error": None}
            if command == "forecast_revenue":
                return {"success": True, "output": self.forecast_revenue(args.get("history", [])), "error": None}
            if command == "crm_export":
                return {"success": True, "output": self.export_crm(args.get("clients", [])), "error": None}
            if command == "ad_generate":
                return {"success": True, "output": self.generate_ad_copy(args.get("product", ""), args.get("audience", "")), "error": None}
            if command == "segment_customers":
                return {"success": True, "output": self.segment_customers(args.get("clients", [])), "error": None}
            if command == "calculate_ltv":
                return {
                    "success": True,
                    "output": self.calculate_ltv(
                        float(args.get("monthly_spend", 0.0)),
                        int(args.get("retention_months", 1)),
                        float(args.get("margin", 0.6)),
                    ),
                    "error": None,
                }
            if command == "funnel_health":
                return {"success": True, "output": self.funnel_health(args.get("stages", {})), "error": None}
            raise ValueError(f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
