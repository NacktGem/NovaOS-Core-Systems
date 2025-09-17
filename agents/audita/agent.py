"""Audita agent: compliance and legal checks."""
from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence

from agents.base import BaseAgent
from agents.common.alog import info


class AuditaAgent(BaseAgent):
    """Performs compliance scans, consent validation, and legal exports."""

    def __init__(self) -> None:
        """Initialize sovereign compliance log paths."""
        super().__init__("audita", description="Compliance and audit agent")
        self._log_dir = Path("logs/legal")
        self._log_dir.mkdir(parents=True, exist_ok=True)

    def validate_consent(self, files: Sequence[str]) -> Dict[str, Any]:
        """Verify presence of required consent artifacts."""
        paths = [Path(p) for p in files]
        missing = [str(p) for p in paths if not p.exists()]
        return {"valid": not missing, "missing": missing}

    def gdpr_scan(self, data: str) -> Dict[str, Any]:
        """Detect personal data signals such as emails for GDPR triage."""
        pattern = r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+"
        emails = re.findall(pattern, data or "")
        return {"emails": emails, "violations": bool(emails)}

    def generate_audit(self, entries: Iterable[Dict[str, Any]]) -> Dict[str, Any]:
        """Persist audit trail entries to CSV for export."""
        entries = list(entries)
        path = self._log_dir / "audit.csv"
        if entries:
            with path.open("w", newline="", encoding="utf-8") as fh:
                writer = csv.DictWriter(fh, fieldnames=list(entries[0].keys()))
                writer.writeheader()
                writer.writerows(entries)
        info("audita.generate_audit", {"rows": len(entries), "path": str(path)})
        return {"path": str(path), "rows": len(entries)}

    def tax_report(self, income: Sequence[float], expenses: Sequence[float]) -> Dict[str, float]:
        """Compute taxable income with transparent subtotals."""
        total_income = sum(income)
        total_expenses = sum(expenses)
        taxable = total_income - total_expenses
        return {"income": total_income, "expenses": total_expenses, "taxable": taxable}

    def dmca_notice(self, claimant: str, work: str, url: str) -> Dict[str, str]:
        """Draft a DMCA takedown notice body."""
        notice = (
            f"DMCA Notice\nClaimant: {claimant}\nWork: {work}\nURL: {url}\n"
            "Please remove the infringing material."
        )
        return {"notice": notice}

    def review_contract_terms(self, text: str) -> Dict[str, Any]:
        """Flag risky clauses (perpetual license, unilateral termination, NDA gaps)."""
        flags = []
        lowered = text.lower()
        if "perpetual" in lowered and "license" in lowered:
            flags.append("perpetual_license")
        if "terminate" in lowered and "sole discretion" in lowered:
            flags.append("unilateral_termination")
        if "non-disclosure" not in lowered and "confidential" in lowered:
            flags.append("missing_nda_language")
        return {"flags": flags, "risk": "high" if "perpetual_license" in flags else "medium" if flags else "low"}

    def assess_policy_alignment(self, policy: str) -> Dict[str, Any]:
        """Evaluate policy text against Nova's Sovereign Standard pillars."""
        pillars = {
            "consent": ["consent", "opt-in", "revocable"],
            "privacy": ["encryption", "retention", "anonymized"],
            "safety": ["moderation", "reporting", "escalation"],
        }
        matches: Dict[str, int] = {}
        text = policy.lower()
        for pillar, keywords in pillars.items():
            matches[pillar] = sum(1 for keyword in keywords if keyword in text)
        coverage = sum(1 for count in matches.values() if count)
        return {"matches": matches, "coverage_score": coverage / len(pillars)}

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Execute Audita compliance routines."""
        command = payload.get("command")
        args = payload.get("args", {})
        info("audita.command", {"command": command, "args": list(args.keys())})
        try:
            if command == "validate_consent":
                return {"success": True, "output": self.validate_consent(args.get("files", [])), "error": None}
            if command == "gdpr_scan":
                return {"success": True, "output": self.gdpr_scan(args.get("data", "")), "error": None}
            if command == "generate_audit":
                return {"success": True, "output": self.generate_audit(args.get("entries", [])), "error": None}
            if command == "tax_report":
                return {
                    "success": True,
                    "output": self.tax_report(args.get("income", []), args.get("expenses", [])),
                    "error": None,
                }
            if command == "dmca_notice":
                return {
                    "success": True,
                    "output": self.dmca_notice(args.get("claimant", ""), args.get("work", ""), args.get("infringing_url", "")),
                    "error": None,
                }
            if command == "review_contract":
                return {"success": True, "output": self.review_contract_terms(args.get("text", "")), "error": None}
            if command == "policy_alignment":
                return {"success": True, "output": self.assess_policy_alignment(args.get("text", "")), "error": None}
            raise ValueError(f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return {"success": False, "output": None, "error": str(exc)}
