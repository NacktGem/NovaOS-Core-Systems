"""Audita agent: compliance and legal checks."""
from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Any, Dict, List

from agents.base import BaseAgent


class AuditaAgent(BaseAgent):
    """Performs compliance scans and audit exports."""

    def __init__(self) -> None:
        super().__init__("audita", description="Compliance and audit agent")

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command == "validate_consent":
                files = [Path(p) for p in args.get("files", [])]
                missing = [str(p) for p in files if not p.exists()]
                return {
                    "success": True,
                    "output": {"valid": not missing, "missing": missing},
                    "error": None,
                }

            if command == "gdpr_scan":
                data = args.get("data", "")
                emails = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+", data)
                return {
                    "success": True,
                    "output": {"emails": emails, "violations": bool(emails)},
                    "error": None,
                }

            if command == "generate_audit":
                entries: List[Dict[str, Any]] = args.get("entries", [])
                log_dir = Path("logs/legal")
                log_dir.mkdir(parents=True, exist_ok=True)
                path = log_dir / "audit.csv"
                if entries:
                    with path.open("w", newline="", encoding="utf-8") as fh:
                        writer = csv.DictWriter(fh, fieldnames=entries[0].keys())
                        writer.writeheader()
                        writer.writerows(entries)
                return {"success": True, "output": {"path": str(path)}, "error": None}

            if command == "tax_report":
                income = sum(args.get("income", []))
                expenses = sum(args.get("expenses", []))
                taxable = income - expenses
                return {
                    "success": True,
                    "output": {"income": income, "expenses": expenses, "taxable": taxable},
                    "error": None,
                }

            if command == "dmca_notice":
                claimant = args.get("claimant", "")
                work = args.get("work", "")
                url = args.get("infringing_url", "")
                notice = (
                    f"DMCA Notice\nClaimant: {claimant}\nWork: {work}\nURL: {url}\n"
                    "Please remove the infringing material."
                )
                return {"success": True, "output": {"notice": notice}, "error": None}

            raise ValueError(f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
