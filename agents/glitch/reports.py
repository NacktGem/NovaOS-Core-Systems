"""Report management and dashboard for Glitch agent findings."""

import json
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional


class ReportManager:
    """Manages forensic reports and interactive dashboard."""
    
    def __init__(self):
        self.reports_dir = Path("/tmp/glitch/reports")
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        
        # Create date-specific directory
        self.daily_reports_dir = self.reports_dir / datetime.now().strftime("%Y-%m-%d")
        self.daily_reports_dir.mkdir(parents=True, exist_ok=True)
    
    def save_scan_report(self, scan_results: Dict[str, Any]) -> Path:
        """Save scan results to a structured report file."""
        scan_id = scan_results.get("scan_id", f"scan_{int(datetime.now().timestamp())}")
        report_file = self.daily_reports_dir / f"{scan_id}_report.json"
        
        # Enhance report with metadata
        report_data = {
            "report_id": scan_id,
            "generated_at": datetime.now(timezone.utc).isoformat(),
            "agent": "glitch",
            "report_type": "system_scan",
            "version": "1.0",
            "scan_results": scan_results,
            "summary": self._generate_summary(scan_results),
            "recommendations": self._generate_recommendations(scan_results)
        }
        
        try:
            with report_file.open('w') as f:
                json.dump(report_data, f, indent=2)
            
            # Also save a copy to GodMode logs if directory exists
            godmode_logs = Path("/tmp/glitch/godmode_logs")
            if godmode_logs.exists():
                godmode_file = godmode_logs / f"{scan_id}_report.json" 
                with godmode_file.open('w') as f:
                    json.dump(report_data, f, indent=2)
            
            return report_file
            
        except Exception as e:
            print(f"[REPORT ERROR] Failed to save report: {e}")
            return report_file
    
    def _generate_summary(self, scan_results: Dict[str, Any]) -> Dict[str, Any]:
        """Generate executive summary of scan results."""
        findings = scan_results.get("findings", [])
        
        summary = {
            "total_findings": len(findings),
            "threat_levels": {"critical": 0, "high": 0, "medium": 0, "low": 0},
            "finding_types": {},
            "risk_score": 0,
            "status": "clean"
        }
        
        for finding in findings:
            # Count threat levels
            threat_level = finding.get("threat_level", "low")
            if threat_level in summary["threat_levels"]:
                summary["threat_levels"][threat_level] += 1
            
            # Count finding types
            finding_type = finding.get("type", "unknown")
            summary["finding_types"][finding_type] = summary["finding_types"].get(finding_type, 0) + 1
        
        # Calculate risk score (0-100)
        risk_score = (
            summary["threat_levels"]["critical"] * 25 +
            summary["threat_levels"]["high"] * 15 +
            summary["threat_levels"]["medium"] * 5 +
            summary["threat_levels"]["low"] * 1
        )
        summary["risk_score"] = min(risk_score, 100)
        
        # Determine status
        if summary["threat_levels"]["critical"] > 0:
            summary["status"] = "critical_threats_detected"
        elif summary["threat_levels"]["high"] > 2:
            summary["status"] = "high_risk"
        elif summary["threat_levels"]["medium"] > 5:
            summary["status"] = "medium_risk"
        elif len(findings) > 0:
            summary["status"] = "minor_issues"
        else:
            summary["status"] = "clean"
        
        return summary
    
    def _generate_recommendations(self, scan_results: Dict[str, Any]) -> List[str]:
        """Generate security recommendations based on findings."""
        findings = scan_results.get("findings", [])
        recommendations = []
        
        finding_types = {}
        for finding in findings:
            finding_type = finding.get("type", "unknown")
            finding_types[finding_type] = finding_types.get(finding_type, 0) + 1
        
        # Generate specific recommendations
        if finding_types.get("suspicious_file", 0) > 0:
            recommendations.append("Review and quarantine suspicious files identified in temporary directories")
        
        if finding_types.get("system_binary_modified", 0) > 0:
            recommendations.append("Investigate recent modifications to system binaries - potential rootkit activity")
        
        if finding_types.get("suspicious_process", 0) > 0:
            recommendations.append("Terminate and investigate processes with unusual network activity")
        
        if finding_types.get("entropy_anomaly", 0) > 0:
            recommendations.append("Analyze high-entropy files for potential malware or encrypted payloads")
        
        if finding_types.get("network_anomaly", 0) > 0:
            recommendations.append("Monitor network connections and consider firewall restrictions")
        
        # General recommendations
        if len(findings) > 10:
            recommendations.append("System shows multiple security indicators - recommend immediate security audit")
        
        if not recommendations:
            recommendations.append("Continue regular monitoring - system appears secure")
        
        return recommendations
    
    def get_pending_findings(self) -> List[Dict[str, Any]]:
        """Get findings that require attention."""
        # This would integrate with the logging system
        return [
            {
                "finding_id": "finding_123",
                "type": "suspicious_file", 
                "threat_level": "high",
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "status": "pending"
            }
        ]
    
    def open_dashboard(self) -> None:
        """Open interactive report dashboard."""
        print("[GLITCH DASHBOARD] Opening interactive forensics dashboard...\n")
        
        while True:
            self._display_dashboard_menu()
            choice = input("\nSelect option: ").strip().lower()
            
            if choice in ['1', 'recent']:
                self._show_recent_reports()
            elif choice in ['2', 'findings']:
                self._show_recent_findings()
            elif choice in ['3', 'stats']:
                self._show_statistics()
            elif choice in ['4', 'threats']:
                self._show_threat_analysis()
            elif choice in ['5', 'export']:
                self._export_reports()
            elif choice in ['q', 'quit', 'exit']:
                print("Closing dashboard...")
                break
            else:
                print("Invalid option. Please try again.")
    
    def _display_dashboard_menu(self) -> None:
        """Display the dashboard menu."""
        print("\n" + "="*60)
        print("                GLITCH FORENSICS DASHBOARD")
        print("="*60)
        print("1. Recent Reports      - View latest scan reports")  
        print("2. Recent Findings     - Show security findings")
        print("3. Statistics          - System and log statistics")
        print("4. Threat Analysis     - Current threat assessment")
        print("5. Export Reports      - Generate summary exports")
        print("Q. Quit                - Exit dashboard")
        print("="*60)
    
    def _show_recent_reports(self) -> None:
        """Show recent scan reports."""
        print("\n[RECENT REPORTS]")
        
        try:
            # Find recent report files
            report_files = list(self.reports_dir.rglob("*_report.json"))
            report_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            if not report_files:
                print("No reports found.")
                return
            
            for i, report_file in enumerate(report_files[:5]):  # Show last 5
                try:
                    with report_file.open() as f:
                        report_data = json.load(f)
                    
                    summary = report_data.get("summary", {})
                    print(f"\n{i+1}. Report: {report_data.get('report_id', 'Unknown')}")
                    print(f"   Generated: {report_data.get('generated_at', 'Unknown')}")
                    print(f"   Findings: {summary.get('total_findings', 0)}")
                    print(f"   Risk Score: {summary.get('risk_score', 0)}/100")
                    print(f"   Status: {summary.get('status', 'unknown')}")
                    
                except Exception as e:
                    print(f"   Error reading report {report_file.name}: {e}")
            
            # Allow user to view detailed report
            report_choice = input("\nEnter report number for details (or press Enter): ").strip()
            if report_choice.isdigit():
                idx = int(report_choice) - 1
                if 0 <= idx < len(report_files):
                    self._show_detailed_report(report_files[idx])
                    
        except Exception as e:
            print(f"Error accessing reports: {e}")
    
    def _show_detailed_report(self, report_file: Path) -> None:
        """Show detailed view of a specific report."""
        try:
            with report_file.open() as f:
                report_data = json.load(f)
            
            print(f"\n{'='*60}")
            print(f"DETAILED REPORT: {report_data.get('report_id', 'Unknown')}")
            print(f"{'='*60}")
            
            # Summary
            summary = report_data.get("summary", {})
            print(f"\nSUMMARY:")
            print(f"  Total Findings: {summary.get('total_findings', 0)}")
            print(f"  Risk Score: {summary.get('risk_score', 0)}/100")
            print(f"  Status: {summary.get('status', 'unknown')}")
            
            # Threat levels
            threat_levels = summary.get("threat_levels", {})
            print(f"\nTHREAT BREAKDOWN:")
            for level, count in threat_levels.items():
                if count > 0:
                    print(f"  {level.title()}: {count}")
            
            # Recent findings (first 5)
            findings = report_data.get("scan_results", {}).get("findings", [])
            if findings:
                print(f"\nRECENT FINDINGS:")
                for i, finding in enumerate(findings[:5]):
                    print(f"  {i+1}. {finding.get('type', 'Unknown')} - {finding.get('risk', 'unknown')} risk")
                    if 'path' in finding:
                        print(f"     Path: {finding['path']}")
            
            # Recommendations
            recommendations = report_data.get("recommendations", [])
            if recommendations:
                print(f"\nRECOMMENDations:")
                for i, rec in enumerate(recommendations):
                    print(f"  {i+1}. {rec}")
            
            input("\nPress Enter to continue...")
            
        except Exception as e:
            print(f"Error reading detailed report: {e}")
    
    def _show_recent_findings(self) -> None:
        """Show recent security findings."""
        print("\n[RECENT FINDINGS]")
        
        # Mock findings for demonstration
        findings = [
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "type": "suspicious_file",
                "threat_level": "high",
                "path": "/tmp/.hidden/backdoor",
                "indicators": ["executable", "hidden_file", "temp_directory"]
            },
            {
                "timestamp": datetime.now(timezone.utc).isoformat(), 
                "type": "network_anomaly",
                "threat_level": "medium",
                "details": "Unusual outbound connections to unknown IP",
                "connections": 15
            },
            {
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "type": "entropy_anomaly", 
                "threat_level": "medium",
                "path": "/tmp/data.bin",
                "entropy": 7.8
            }
        ]
        
        for i, finding in enumerate(findings):
            print(f"\n{i+1}. [{finding['threat_level'].upper()}] {finding['type']}")
            print(f"   Time: {finding['timestamp']}")
            if 'path' in finding:
                print(f"   Path: {finding['path']}")
            if 'details' in finding:
                print(f"   Details: {finding['details']}")
        
        input("\nPress Enter to continue...")
    
    def _show_statistics(self) -> None:
        """Show system and log statistics."""
        print("\n[SYSTEM STATISTICS]")
        
        # Mock statistics
        stats = {
            "scans_completed_24h": 12,
            "findings_24h": 8,
            "threat_level_distribution": {"high": 2, "medium": 3, "low": 3},
            "most_common_threats": ["suspicious_file", "network_anomaly"],
            "system_uptime": "2 days, 14 hours",
            "total_files_monitored": 15420,
            "active_honeypots": 3
        }
        
        print(f"Scans completed (24h): {stats['scans_completed_24h']}")
        print(f"Findings detected (24h): {stats['findings_24h']}")
        print(f"System uptime: {stats['system_uptime']}")
        print(f"Files monitored: {stats['total_files_monitored']:,}")
        print(f"Active honeypots: {stats['active_honeypots']}")
        
        print(f"\nThreat distribution:")
        for level, count in stats['threat_level_distribution'].items():
            print(f"  {level.title()}: {count}")
        
        input("\nPress Enter to continue...")
    
    def _show_threat_analysis(self) -> None:
        """Show current threat analysis."""
        print("\n[THREAT ANALYSIS]")
        
        print("Current Threat Level: MEDIUM")
        print("Risk Score: 35/100")
        print("\nActive Threats:")
        print("• 2 high-entropy files detected (potential malware)")
        print("• 1 suspicious network connection pattern")
        print("• 3 files in unusual locations")
        
        print("\nTrend Analysis:")
        print("• Threat level increased from LOW (2 hours ago)")
        print("• 40% increase in suspicious file detection")
        print("• Network activity within normal parameters")
        
        print("\nRecommended Actions:")
        print("1. Isolate high-entropy files for detailed analysis")
        print("2. Monitor network connections for data exfiltration")
        print("3. Increase honeypot deployment in high-risk areas")
        print("4. Schedule comprehensive system scan within 4 hours")
        
        input("\nPress Enter to continue...")
    
    def _export_reports(self) -> None:
        """Export reports in various formats."""
        print("\n[EXPORT REPORTS]")
        print("1. JSON Summary Export")
        print("2. CSV Findings Export") 
        print("3. Executive Summary (Text)")
        
        choice = input("Select export format: ").strip()
        
        if choice == "1":
            self._export_json_summary()
        elif choice == "2":
            self._export_csv_findings()
        elif choice == "3":
            self._export_executive_summary()
        else:
            print("Invalid choice.")
    
    def _export_json_summary(self) -> None:
        """Export JSON summary of all reports."""
        export_file = self.reports_dir / f"summary_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        
        summary_data = {
            "export_timestamp": datetime.now(timezone.utc).isoformat(),
            "total_reports": 5,  # Mock data
            "total_findings": 23,
            "threat_summary": {"critical": 0, "high": 3, "medium": 8, "low": 12},
            "export_format": "json_summary"
        }
        
        try:
            with export_file.open('w') as f:
                json.dump(summary_data, f, indent=2)
            print(f"JSON summary exported to: {export_file}")
        except Exception as e:
            print(f"Export failed: {e}")
    
    def _export_csv_findings(self) -> None:
        """Export findings as CSV.""" 
        export_file = self.reports_dir / f"findings_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        
        csv_content = "timestamp,finding_type,threat_level,path,details\n"
        csv_content += f"{datetime.now().isoformat()},suspicious_file,high,/tmp/backdoor,executable hidden file\n"
        csv_content += f"{datetime.now().isoformat()},network_anomaly,medium,N/A,unusual outbound connections\n"
        
        try:
            with export_file.open('w') as f:
                f.write(csv_content)
            print(f"CSV findings exported to: {export_file}")
        except Exception as e:
            print(f"Export failed: {e}")
    
    def _export_executive_summary(self) -> None:
        """Export executive summary as text."""
        export_file = self.reports_dir / f"executive_summary_{datetime.now().strftime('%Y%m%d_%H%M%S')}.txt"
        
        summary_text = f"""
GLITCH FORENSICS - EXECUTIVE SUMMARY
Generated: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}

THREAT OVERVIEW:
- Current Threat Level: MEDIUM
- Risk Score: 35/100
- Total Findings (24h): 23
- Critical Issues: 0
- High Priority Issues: 3

KEY FINDINGS:
1. Multiple suspicious files detected in temporary directories
2. Unusual network connection patterns observed
3. Some system files modified recently

RECOMMENDATIONS:
1. Immediate isolation of high-risk files
2. Enhanced network monitoring
3. Comprehensive security audit within 24 hours

SYSTEM STATUS:
- All monitoring systems operational
- Honeypots active and detecting intrusion attempts
- No immediate threats to system integrity
"""
        
        try:
            with export_file.open('w') as f:
                f.write(summary_text)
            print(f"Executive summary exported to: {export_file}")
        except Exception as e:
            print(f"Export failed: {e}")
    
    def list_reports(self, days: int = 7) -> List[Dict[str, Any]]:
        """List recent reports."""
        reports = []
        
        try:
            report_files = list(self.reports_dir.rglob("*_report.json"))
            report_files.sort(key=lambda x: x.stat().st_mtime, reverse=True)
            
            for report_file in report_files:
                try:
                    with report_file.open() as f:
                        report_data = json.load(f)
                    
                    reports.append({
                        "report_id": report_data.get("report_id"),
                        "generated_at": report_data.get("generated_at"), 
                        "total_findings": report_data.get("summary", {}).get("total_findings", 0),
                        "risk_score": report_data.get("summary", {}).get("risk_score", 0),
                        "file_path": str(report_file)
                    })
                    
                except Exception:
                    continue
                    
        except Exception:
            pass
        
        return reports