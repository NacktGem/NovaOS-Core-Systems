"""Structured logging system for Glitch agent."""

import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional


class GlitchLogger:
    """Structured JSON logging system for forensic findings and events."""
    
    def __init__(self):
        self.logs_dir = Path("/tmp/glitch/logs")
        self.logs_dir.mkdir(parents=True, exist_ok=True)
        
        # Initialize log files
        self.findings_log = self.logs_dir / f"findings_{datetime.now().strftime('%Y-%m-%d')}.jsonl"
        self.events_log = self.logs_dir / f"events_{datetime.now().strftime('%Y-%m-%d')}.jsonl"
        self.audit_log = self.logs_dir / f"audit_{datetime.now().strftime('%Y-%m-%d')}.jsonl"
    
    def log(self, event_type: str, data: Dict[str, Any], severity: str = "info") -> None:
        """Log an event with structured data."""
        log_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "event_type": event_type,
            "severity": severity,
            "agent": "glitch",
            "data": data,
            "log_version": "1.0"
        }
        
        # Write to events log
        self._write_log_entry(self.events_log, log_entry)
        
        # Also write to findings log if it's a finding
        if event_type.startswith(('finding', 'threat', 'anomaly', 'suspicious')):
            self._write_log_entry(self.findings_log, log_entry)
    
    def log_finding(self, finding_type: str, details: Dict[str, Any], 
                   threat_level: str = "low", confidence: float = 0.5) -> str:
        """Log a security finding with forensic metadata."""
        import hashlib
        
        # Generate finding ID
        finding_id = f"finding_{int(datetime.now().timestamp())}_{hash(str(details)) & 0xFFFF:04x}"
        
        finding_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "finding_id": finding_id,
            "finding_type": finding_type,
            "threat_level": threat_level,
            "confidence": confidence,
            "details": details,
            "hash": hashlib.sha256(json.dumps(details, sort_keys=True).encode()).hexdigest()[:16],
            "agent": "glitch",
            "version": "1.0"
        }
        
        # Write to findings log
        self._write_log_entry(self.findings_log, finding_entry)
        
        # Also log as event
        self.log(f"finding.{finding_type}", {
            "finding_id": finding_id,
            "threat_level": threat_level,
            "confidence": confidence
        }, severity=self._severity_from_threat_level(threat_level))
        
        return finding_id
    
    def log_command(self, command: str, args: Dict[str, Any], result: Dict[str, Any]) -> None:
        """Log command execution."""
        command_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "command": command,
            "args": args,
            "success": result.get("success", False),
            "execution_time": result.get("execution_time"),
            "error": result.get("error")
        }
        
        self.log("command.executed", command_entry)
    
    def log_scan(self, scan_type: str, results: Dict[str, Any]) -> str:
        """Log scan results."""
        scan_id = f"scan_{int(datetime.now().timestamp())}"
        
        scan_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "scan_id": scan_id,
            "scan_type": scan_type,
            "results": results,
            "findings_count": len(results.get("findings", [])),
            "duration": results.get("duration"),
            "status": results.get("status", "completed")
        }
        
        self.log("scan.completed", scan_entry)
        return scan_id
    
    def log_honeypot_event(self, trap_id: str, event_type: str, details: Dict[str, Any]) -> None:
        """Log honeypot trigger events."""
        honeypot_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "trap_id": trap_id,
            "event_type": event_type,
            "details": details,
            "source_ip": details.get("source_ip"),
            "user_agent": details.get("user_agent"),
            "attack_vector": details.get("attack_vector")
        }
        
        self.log(f"honeypot.{event_type}", honeypot_entry, severity="warning")
    
    def log_audit_event(self, action: str, user: str, resource: str, 
                       outcome: str, details: Dict[str, Any] = None) -> None:
        """Log audit events for compliance."""
        audit_entry = {
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "action": action,
            "user": user,
            "resource": resource,
            "outcome": outcome,
            "details": details or {},
            "session_id": details.get("session_id") if details else None
        }
        
        self._write_log_entry(self.audit_log, audit_entry)
    
    def _write_log_entry(self, log_file: Path, entry: Dict[str, Any]) -> None:
        """Write a log entry to the specified file."""
        try:
            with log_file.open('a', encoding='utf-8') as f:
                f.write(json.dumps(entry) + '\n')
        except Exception as e:
            # Fallback logging to stderr if file write fails
            print(f"[LOG ERROR] Failed to write to {log_file}: {e}", file=sys.stderr)
            print(f"[LOG ERROR] Entry: {json.dumps(entry)}", file=sys.stderr)
    
    def _severity_from_threat_level(self, threat_level: str) -> str:
        """Convert threat level to log severity."""
        mapping = {
            "critical": "critical",
            "high": "error", 
            "medium": "warning",
            "low": "info"
        }
        return mapping.get(threat_level.lower(), "info")
    
    def get_recent_findings(self, hours: int = 24, threat_level: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get recent findings from logs."""
        findings = []
        cutoff_time = datetime.now(timezone.utc).timestamp() - (hours * 3600)
        
        try:
            if self.findings_log.exists():
                with self.findings_log.open('r') as f:
                    for line in f:
                        try:
                            entry = json.loads(line.strip())
                            
                            # Check timestamp
                            entry_time = datetime.fromisoformat(entry["timestamp"].replace('Z', '+00:00')).timestamp()
                            if entry_time < cutoff_time:
                                continue
                            
                            # Filter by threat level if specified
                            if threat_level and entry.get("threat_level") != threat_level.lower():
                                continue
                            
                            findings.append(entry)
                        except (json.JSONDecodeError, KeyError, ValueError):
                            continue
        except Exception:
            pass
        
        # Sort by timestamp (newest first)
        findings.sort(key=lambda x: x["timestamp"], reverse=True)
        return findings
    
    def get_events(self, event_type: Optional[str] = None, hours: int = 24) -> List[Dict[str, Any]]:
        """Get recent events from logs."""
        events = []
        cutoff_time = datetime.now(timezone.utc).timestamp() - (hours * 3600)
        
        try:
            if self.events_log.exists():
                with self.events_log.open('r') as f:
                    for line in f:
                        try:
                            entry = json.loads(line.strip())
                            
                            # Check timestamp
                            entry_time = datetime.fromisoformat(entry["timestamp"].replace('Z', '+00:00')).timestamp()
                            if entry_time < cutoff_time:
                                continue
                            
                            # Filter by event type if specified
                            if event_type and not entry.get("event_type", "").startswith(event_type):
                                continue
                            
                            events.append(entry)
                        except (json.JSONDecodeError, KeyError, ValueError):
                            continue
        except Exception:
            pass
        
        # Sort by timestamp (newest first)
        events.sort(key=lambda x: x["timestamp"], reverse=True)
        return events
    
    def get_audit_logs(self, hours: int = 24, user: Optional[str] = None) -> List[Dict[str, Any]]:
        """Get audit log entries."""
        audit_entries = []
        cutoff_time = datetime.now(timezone.utc).timestamp() - (hours * 3600)
        
        try:
            if self.audit_log.exists():
                with self.audit_log.open('r') as f:
                    for line in f:
                        try:
                            entry = json.loads(line.strip())
                            
                            # Check timestamp
                            entry_time = datetime.fromisoformat(entry["timestamp"].replace('Z', '+00:00')).timestamp()
                            if entry_time < cutoff_time:
                                continue
                            
                            # Filter by user if specified
                            if user and entry.get("user") != user:
                                continue
                            
                            audit_entries.append(entry)
                        except (json.JSONDecodeError, KeyError, ValueError):
                            continue
        except Exception:
            pass
        
        # Sort by timestamp (newest first)
        audit_entries.sort(key=lambda x: x["timestamp"], reverse=True)
        return audit_entries
    
    def get_log_stats(self) -> Dict[str, Any]:
        """Get statistics about log files."""
        stats = {
            "log_directory": str(self.logs_dir),
            "total_findings": 0,
            "total_events": 0,
            "total_audit_entries": 0,
            "log_files": {},
            "latest_finding": None,
            "threat_level_counts": {"critical": 0, "high": 0, "medium": 0, "low": 0}
        }
        
        # Count findings
        if self.findings_log.exists():
            try:
                with self.findings_log.open('r') as f:
                    for line in f:
                        try:
                            entry = json.loads(line.strip())
                            stats["total_findings"] += 1
                            
                            threat_level = entry.get("threat_level", "low")
                            if threat_level in stats["threat_level_counts"]:
                                stats["threat_level_counts"][threat_level] += 1
                            
                            if not stats["latest_finding"] or entry["timestamp"] > stats["latest_finding"]:
                                stats["latest_finding"] = entry["timestamp"]
                        except (json.JSONDecodeError, KeyError):
                            continue
            except Exception:
                pass
        
        # Count events
        if self.events_log.exists():
            try:
                with self.events_log.open('r') as f:
                    stats["total_events"] = sum(1 for line in f)
            except Exception:
                pass
        
        # Count audit entries
        if self.audit_log.exists():
            try:
                with self.audit_log.open('r') as f:
                    stats["total_audit_entries"] = sum(1 for line in f)
            except Exception:
                pass
        
        # File sizes
        for log_file in [self.findings_log, self.events_log, self.audit_log]:
            if log_file.exists():
                stats["log_files"][log_file.name] = {
                    "size_bytes": log_file.stat().st_size,
                    "modified": log_file.stat().st_mtime
                }
        
        return stats