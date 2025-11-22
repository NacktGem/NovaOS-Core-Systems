#!/usr/bin/env python3
"""Glitch CLI interface - main entry point for all Glitch operations.

This CLI provides the interface described in the Sovereign Standard requirements:
- glitch status → returns current operational status and threat level
- glitch run → performs a full scan and saves a report  
- glitch diagnose <target> → deep scan on file, folder, or app
- glitch chat → interactive terminal chat with Glitch agent
- glitch honeypot deploy → deploys stealth trap
- glitch logs → opens interactive report dashboard
- glitch help → shows available commands
"""

import argparse
import asyncio
import json
import sys
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional

# Add parent directory to path to import agent modules
sys.path.append(str(Path(__file__).parent.parent.parent))

try:
    from agents.glitch.agent import GlitchAgent
    from agents.glitch.forensics import ForensicsEngine
    from agents.glitch.honeypot import HoneypotManager 
    from agents.glitch.chat import ChatInterface
    from agents.glitch.logging import GlitchLogger
    from agents.glitch.reports import ReportManager
except ImportError as e:
    # Fallback for when modules aren't available
    print(f"Warning: Could not import all modules: {e}")
    print("Running in limited mode...")
    
    class MockAgent:
        def get_threat_level(self): return "low"
        def get_active_scans(self): return []
        def get_last_scan_time(self): return None
    
    GlitchAgent = MockAgent
    ForensicsEngine = lambda: None
    HoneypotManager = lambda: None
    ChatInterface = lambda: None
    GlitchLogger = lambda: None
    ReportManager = lambda: None


class GlitchCLI:
    """Main CLI interface for the Glitch forensics agent."""
    
    def __init__(self):
        try:
            self.agent = GlitchAgent()
            self.forensics = ForensicsEngine() if ForensicsEngine else None
            self.honeypot = HoneypotManager() if HoneypotManager else None
            self.chat = ChatInterface() if ChatInterface else None
            self.logger = GlitchLogger() if GlitchLogger else None
            self.reports = ReportManager() if ReportManager else None
        except Exception as e:
            print(f"Warning: Error initializing components: {e}")
            self.agent = MockAgent()
            self.forensics = None
            self.honeypot = None
            self.chat = None
            self.logger = None
            self.reports = None
        
    def status(self) -> Dict[str, Any]:
        """Get current operational status and threat level."""
        status_data = {
            "agent": "glitch",
            "status": "operational", 
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "version": "1.0.0",
            "threat_level": self.agent.get_threat_level() if hasattr(self.agent, 'get_threat_level') else "low",
            "active_scans": self.agent.get_active_scans() if hasattr(self.agent, 'get_active_scans') else [],
            "last_scan": self.agent.get_last_scan_time() if hasattr(self.agent, 'get_last_scan_time') else None,
            "honeypots_active": self.honeypot.get_active_count() if self.honeypot else 0,
            "findings_pending": len(self.reports.get_pending_findings()) if self.reports else 0,
            "tools_available": self.forensics.check_tools_available() if self.forensics else {},
        }
        return status_data
    
    async def run_full_scan(self) -> Dict[str, Any]:
        """Perform a full system scan and save report."""
        if not self.forensics:
            return {"error": "Forensics engine not available"}
            
        scan_id = f"scan_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}"
        
        print(f"[GLITCH] Starting full scan {scan_id}")
        if self.logger:
            self.logger.log("scan.started", {"scan_id": scan_id})
        
        results = {
            "scan_id": scan_id,
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "findings": [],
            "metrics": {}
        }
        
        try:
            # File system scan
            print("[GLITCH] Scanning file system...")
            fs_results = await self.forensics.scan_filesystem()
            results["findings"].extend(fs_results.get("findings", []))
            results["metrics"]["files_scanned"] = fs_results.get("files_scanned", 0)
            
            # Memory scan
            print("[GLITCH] Scanning memory...")
            mem_results = await self.forensics.scan_memory() 
            results["findings"].extend(mem_results.get("findings", []))
            results["metrics"]["processes_analyzed"] = mem_results.get("processes_analyzed", 0)
            
            # Network scan
            print("[GLITCH] Scanning network...")
            net_results = await self.forensics.scan_network()
            results["findings"].extend(net_results.get("findings", []))
            results["metrics"]["ports_scanned"] = net_results.get("ports_scanned", 0)
            
            # Save report
            if self.reports:
                report_path = self.reports.save_scan_report(results)
                print(f"[GLITCH] Scan complete. Report saved to: {report_path}")
            else:
                print(f"[GLITCH] Scan complete. Found {len(results['findings'])} findings.")
            
            if self.logger:
                self.logger.log("scan.completed", {
                    "scan_id": scan_id,
                    "findings_count": len(results["findings"]),
                })
            
        except Exception as e:
            results["error"] = str(e)
            print(f"[GLITCH] Scan error: {e}")
        
        return results
    
    async def diagnose_target(self, target: str) -> Dict[str, Any]:
        """Deep scan on specific file, folder, or app."""
        if not self.forensics:
            return {"error": "Forensics engine not available"}
            
        target_path = Path(target)
        
        print(f"[GLITCH] Deep scanning target: {target}")
        
        try:
            if target_path.is_file():
                return await self.forensics.deep_scan_file(target_path)
            elif target_path.is_dir():
                return await self.forensics.deep_scan_directory(target_path)
            else:
                # Treat as app/process name
                return await self.forensics.deep_scan_process(target)
        except Exception as e:
            return {"error": str(e)}
    
    def start_chat(self):
        """Start interactive chat interface."""
        if not self.chat:
            print("[GLITCH] Chat interface not available")
            return
            
        print("[GLITCH] Starting secure chat interface...")
        print("Type 'exit' to quit, 'help' for commands")
        try:
            self.chat.start_session()
        except Exception as e:
            print(f"[GLITCH] Chat error: {e}")
    
    def deploy_honeypot(self) -> Dict[str, Any]:
        """Deploy stealth honeypot trap."""
        if not self.honeypot:
            return {"error": "Honeypot manager not available"}
            
        print("[GLITCH] Deploying honeypot...")
        try:
            result = self.honeypot.deploy_trap()
            if self.logger:
                self.logger.log("honeypot.deployed", result)
            return result
        except Exception as e:
            return {"error": str(e)}
    
    def show_logs(self):
        """Open interactive report dashboard.""" 
        if not self.reports:
            print("[GLITCH] Reports dashboard not available")
            return
            
        print("[GLITCH] Opening logs dashboard...")
        try:
            self.reports.open_dashboard()
        except Exception as e:
            print(f"[GLITCH] Dashboard error: {e}")


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        prog="glitch",
        description="Glitch - Elite Digital Forensics Agent for NovaOS"
    )
    subparsers = parser.add_subparsers(dest="command", help="Available commands")
    
    # glitch status
    subparsers.add_parser("status", help="Show current operational status")
    
    # glitch run  
    subparsers.add_parser("run", help="Perform full system scan")
    
    # glitch diagnose <target>
    diagnose_parser = subparsers.add_parser("diagnose", help="Deep scan specific target")
    diagnose_parser.add_argument("target", help="File, directory, or process to scan")
    
    # glitch chat
    subparsers.add_parser("chat", help="Start interactive chat interface")
    
    # glitch honeypot
    honeypot_parser = subparsers.add_parser("honeypot", help="Honeypot operations")
    honeypot_parser.add_argument("action", choices=["deploy"], help="Honeypot action")
    
    # glitch logs
    subparsers.add_parser("logs", help="View reports dashboard")
    
    # glitch help
    subparsers.add_parser("help", help="Show this help message")
    
    if len(sys.argv) == 1:
        parser.print_help()
        return
    
    args = parser.parse_args()
    cli = GlitchCLI()
    
    try:
        if args.command == "status":
            status = cli.status()
            print(json.dumps(status, indent=2))
        
        elif args.command == "run":
            results = asyncio.run(cli.run_full_scan())
            print(f"Scan completed with {len(results['findings'])} findings")
        
        elif args.command == "diagnose":
            results = asyncio.run(cli.diagnose_target(args.target))
            print(json.dumps(results, indent=2))
        
        elif args.command == "chat":
            cli.start_chat()
        
        elif args.command == "honeypot" and args.action == "deploy":
            result = cli.deploy_honeypot()
            print(json.dumps(result, indent=2))
        
        elif args.command == "logs":
            cli.show_logs()
        
        elif args.command == "help":
            parser.print_help()
        
        else:
            parser.print_help()
    
    except KeyboardInterrupt:
        print("\n[GLITCH] Operation cancelled by user")
    except Exception as e:
        print(f"[GLITCH] Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()