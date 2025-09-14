"""Audita agent: compliance and legal checks."""
from __future__ import annotations

import csv
import re
from pathlib import Path
from typing import Any, Dict, List

from agents.base import BaseAgent

# Optional tools for deeper validation:
# REQUIRES face_recognition or opencv-python — Not installed by default
#   pip install face_recognition  # requires dlib system deps
#   or: pip install opencv-python
# REQUIRES PyPDF2 — Not installed by default
#   pip install PyPDF2


class AuditaAgent(BaseAgent):
    """Performs compliance scans and audit exports."""

    def __init__(self) -> None:
        super().__init__("audita", description="Compliance and audit agent")
        self._platform_log = Path("/logs/audita.log")
        self._platform_log.parent.mkdir(parents=True, exist_ok=True)

    def _log(self, entry: Dict[str, Any]) -> None:
        try:
            with self._platform_log.open("a", encoding="utf-8") as fh:
                fh.write(str(entry) + "\n")
        except Exception:
            pass

    def _wrap(self, command: str, details: Dict[str, Any] | None, error: str | None) -> Dict[str, Any]:
        success = error is None
        summary = (
            f"Audita completed '{command}'"
            if success
            else f"Audita failed '{command}': {error}"
        )
        self._log({"command": command, "success": success, "error": error})
        return {
            "success": success,
            "output": {"summary": summary, "details": details or {}, "logs_path": str(self._platform_log)},
            "error": error,
        }

    def run(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        command = payload.get("command")
        args = payload.get("args", {})
        try:
            if command == "validate_consent":
                files = [Path(p) for p in args.get("files", [])]
                missing = [str(p) for p in files if not p.exists()]
                details: Dict[str, Any] = {"missing": missing}
                # Timestamp check
                ts = args.get("timestamp")
                if ts:
                    import datetime as _dt

                    try:
                        _ = _dt.datetime.fromisoformat(str(ts))
                        details["timestamp_valid"] = True
                    except Exception:
                        details["timestamp_valid"] = False
                # PDF completeness check if PyPDF2 present
                pdfs = [p for p in files if p.suffix.lower() == ".pdf" and p.exists()]
                if pdfs:
                    try:
                        import PyPDF2  # type: ignore

                        forms = []
                        for pdf in pdfs:
                            with pdf.open("rb") as fh:
                                reader = PyPDF2.PdfReader(fh)
                                form = reader.metadata is not None
                                forms.append({"file": str(pdf), "has_metadata": form, "pages": len(reader.pages)})
                        details["pdf_checks"] = forms
                    except Exception:
                        details["pdf_checks"] = "PyPDF2 not available"
                details["valid"] = not missing and bool(details.get("timestamp_valid", True))
                return self._wrap(command, details, None)

            if command == "gdpr_scan":
                data = args.get("data", "")
                emails = re.findall(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+", data)
                return self._wrap(command, {"emails": emails, "violations": bool(emails)}, None)

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
                return self._wrap(command, {"path": str(path)}, None)

            if command == "tax_report":
                income = sum(args.get("income", []))
                expenses = sum(args.get("expenses", []))
                taxable = income - expenses
                return self._wrap(command, {"income": income, "expenses": expenses, "taxable": taxable}, None)

            if command == "dmca_notice":
                claimant = args.get("claimant", "")
                work = args.get("work", "")
                url = args.get("infringing_url", "")
                # Simple required fields validation
                errors: List[str] = []
                for field, val in [("claimant", claimant), ("work", work), ("infringing_url", url)]:
                    if not val:
                        errors.append(f"missing {field}")
                if errors:
                    return self._wrap(command, None, "; ".join(errors))
                notice = (
                    f"DMCA Notice\nClaimant: {claimant}\nWork: {work}\nURL: {url}\n"
                    "Please remove the infringing material."
                )
                return self._wrap(command, {"notice": notice}, None)

            return self._wrap(command or "", None, f"unknown command '{command}'")
        except Exception as exc:  # noqa: BLE001
            return self._wrap(command or "", None, str(exc))
