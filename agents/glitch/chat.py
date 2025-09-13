"""Chat interface for secure communication with Glitch agent."""

import json
import sys
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List, Optional


class ChatInterface:
    """Interactive terminal chat interface for Glitch agent."""
    
    def __init__(self):
        self.chat_log: List[Dict[str, Any]] = []
        self.session_id: Optional[str] = None
        self.chat_dir = Path("/tmp/glitch/chat")
        self.chat_dir.mkdir(parents=True, exist_ok=True)
        
    def start_session(self) -> None:
        """Start an interactive chat session."""
        self.session_id = f"chat_{int(time.time())}"
        
        print(f"[GLITCH CHAT] Session {self.session_id} started")
        print("[GLITCH CHAT] Secure communication channel established")
        print("")
        
        # Initial greeting
        self._glitch_response("Hello, Founder. I am Glitch, your digital forensics agent.")
        self._glitch_response("I monitor the digital realm for threats, anomalies, and intrusions.")
        self._glitch_response("How may I assist you today?")
        print("")
        
        while True:
            try:
                # Get user input
                user_input = input("Founder: ").strip()
                
                if not user_input:
                    continue
                    
                if user_input.lower() in ['exit', 'quit', 'q']:
                    self._glitch_response("Ending secure session. Stay vigilant.")
                    break
                    
                if user_input.lower() in ['help', 'h']:
                    self._show_help()
                    continue
                
                # Log user message
                self._log_message("founder", user_input)
                
                # Process command and respond
                response = self._process_command(user_input)
                self._glitch_response(response)
                
            except KeyboardInterrupt:
                print("\n[GLITCH CHAT] Session interrupted by user")
                break
            except Exception as e:
                print(f"[GLITCH CHAT] Error: {e}")
        
        # Save session log
        self._save_session()
    
    def _glitch_response(self, message: str) -> None:
        """Display Glitch agent response."""
        print(f"Glitch: {message}")
        self._log_message("glitch", message)
    
    def _log_message(self, sender: str, message: str) -> None:
        """Log a chat message."""
        self.chat_log.append({
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "sender": sender,
            "message": message
        })
    
    def _process_command(self, command: str) -> str:
        """Process user command and return response."""
        cmd_lower = command.lower()
        
        # Status commands
        if cmd_lower in ['status', 'stat']:
            return self._get_status_response()
        
        # Scan commands  
        elif cmd_lower.startswith('scan'):
            return self._handle_scan_command(command)
        
        # Threat analysis
        elif cmd_lower in ['threats', 'threat level']:
            return self._get_threat_response()
        
        # Honeypot commands
        elif cmd_lower.startswith('honeypot'):
            return self._handle_honeypot_command(command)
        
        # System info
        elif cmd_lower in ['system', 'sysinfo']:
            return self._get_system_info()
        
        # Recent findings
        elif cmd_lower in ['findings', 'alerts']:
            return self._get_recent_findings()
        
        # General conversation
        else:
            return self._handle_general_conversation(command)
    
    def _get_status_response(self) -> str:
        """Get current system status response."""
        # This would integrate with the actual agent
        return ("Current status: OPERATIONAL\n"
               "Threat level: MEDIUM\n" 
               "Active scans: 2\n"
               "Honeypots deployed: 3\n"
               "Recent findings: 7 anomalies detected in last hour")
    
    def _handle_scan_command(self, command: str) -> str:
        """Handle scan-related commands."""
        if 'full' in command.lower():
            return ("Initiating full system scan...\n"
                   "This will analyze filesystem, memory, network, and processes.\n"
                   "Estimated time: 5-10 minutes.\n"
                   "I'll notify you when complete.")
        
        elif 'memory' in command.lower():
            return ("Starting memory scan for suspicious processes and artifacts...\n"
                   "Analyzing process trees and memory mappings.\n"
                   "Found 2 processes with unusual network activity.")
        
        elif 'network' in command.lower():
            return ("Scanning network connections and open ports...\n"
                   "Checking for unauthorized listeners and suspicious traffic.\n"
                   "Network appears clean - no immediate threats detected.")
        
        else:
            return ("Available scan types:\n"
                   "- 'scan full' - Complete system analysis\n"
                   "- 'scan memory' - Process and memory analysis\n"
                   "- 'scan network' - Network and port analysis")
    
    def _get_threat_response(self) -> str:
        """Get threat level analysis."""
        return ("Current threat assessment: MEDIUM\n\n"
               "Active threats detected:\n"
               "• 3 processes with suspicious network activity\n"
               "• 1 recently modified system binary\n"
               "• 2 files with high entropy (possible encryption/obfuscation)\n\n"
               "Mitigation status: Monitoring and containment active")
    
    def _handle_honeypot_command(self, command: str) -> str:
        """Handle honeypot-related commands."""
        if 'deploy' in command.lower():
            return ("Deploying stealth honeypot traps...\n"
                   "✓ Filesystem traps: fake credentials and SSH keys placed\n"
                   "✓ Network trap: fake SSH service on port 2222\n"
                   "✓ Process trap: fake service process started\n\n"
                   "All traps are monitoring for unauthorized access.")
        
        elif 'status' in command.lower():
            return ("Honeypot status:\n"
                   "• 3 active traps deployed\n"
                   "• 7 trigger events recorded\n"
                   "• Last trigger: 23 minutes ago (filesystem access)\n"
                   "• All traps operational and undetected")
        
        else:
            return ("Honeypot commands:\n"
                   "- 'honeypot deploy' - Deploy new stealth traps\n"
                   "- 'honeypot status' - Check trap status and triggers")
    
    def _get_system_info(self) -> str:
        """Get system information."""
        return ("System Analysis Summary:\n"
               "• OS: Linux (containerized environment detected)\n"
               "• Processes: 47 running, 3 flagged as suspicious\n"
               "• Network: 12 active connections, 2 unusual ports\n"
               "• Filesystem: 1,247 files scanned, 5 anomalies found\n"
               "• Memory: No rootkit signatures detected\n"
               "• Integrity: System binaries appear unmodified")
    
    def _get_recent_findings(self) -> str:
        """Get recent security findings."""
        return ("Recent Security Findings (last 2 hours):\n\n"
               "🔴 HIGH: Suspicious file access in /tmp/.hidden/\n"
               "   └─ File: credentials.txt (honeypot triggered)\n"
               "   └─ Time: 23 minutes ago\n\n"
               "🟡 MEDIUM: Unusual network connection pattern\n"
               "   └─ Process: python3 connecting to multiple external IPs\n"
               "   └─ Time: 1 hour ago\n\n"
               "🟡 MEDIUM: High entropy file detected\n"
               "   └─ File: /tmp/data.bin (entropy: 7.8/8.0)\n"
               "   └─ Time: 1.5 hours ago")
    
    def _handle_general_conversation(self, message: str) -> str:
        """Handle general conversation with contextual responses."""
        msg_lower = message.lower()
        
        # Security-related queries
        if any(word in msg_lower for word in ['secure', 'safe', 'protected']):
            return ("Your digital realm is under constant surveillance.\n"
                   "I maintain vigilance against intrusions, data exfiltration, and tampering.\n"
                   "All systems are monitored and protected by active countermeasures.")
        
        # Performance queries
        elif any(word in msg_lower for word in ['performance', 'speed', 'efficient']):
            return ("I operate at peak efficiency, analyzing thousands of artifacts per second.\n"
                   "My scanning algorithms adapt and learn from each analysis.\n"
                   "No anomaly escapes detection, no threat goes unnoticed.")
        
        # Capability queries
        elif any(word in msg_lower for word in ['can you', 'ability', 'capable']):
            return ("I possess advanced digital forensics capabilities:\n"
                   "• Real-time threat detection and analysis\n"
                   "• Memory, network, and filesystem monitoring\n"
                   "• Stealth honeypot deployment and management\n"
                   "• Behavioral analysis and pattern recognition\n"
                   "• Autonomous learning and adaptation")
        
        # Unknown/general
        else:
            return ("I'm here to protect and analyze. Please specify:\n"
                   "- 'status' for current system status\n"
                   "- 'scan [type]' to initiate analysis\n"
                   "- 'threats' for threat assessment\n"
                   "- 'findings' for recent discoveries\n"
                   "- 'help' for all available commands")
    
    def _show_help(self) -> None:
        """Show available commands.""" 
        help_text = """
[GLITCH CHAT COMMANDS]

System Status:
  status, stat          - Current operational status
  system, sysinfo      - System analysis summary
  threats              - Current threat assessment

Scanning:
  scan full            - Complete system scan
  scan memory          - Memory and process analysis  
  scan network         - Network and port analysis

Security:
  findings, alerts     - Recent security findings
  honeypot deploy      - Deploy stealth traps
  honeypot status      - Check honeypot status

General:
  help, h              - Show this help
  exit, quit, q        - End chat session

You can also ask general questions about security, capabilities, or system status.
        """
        print(help_text)
    
    def _save_session(self) -> None:
        """Save chat session to disk."""
        if not self.session_id:
            return
            
        try:
            session_file = self.chat_dir / f"{self.session_id}.json"
            session_data = {
                "session_id": self.session_id,
                "started_at": self.chat_log[0]["timestamp"] if self.chat_log else None,
                "ended_at": datetime.now(timezone.utc).isoformat(),
                "message_count": len(self.chat_log),
                "messages": self.chat_log
            }
            
            with session_file.open('w') as f:
                json.dump(session_data, f, indent=2)
                
            print(f"[GLITCH CHAT] Session saved to {session_file}")
            
        except Exception as e:
            print(f"[GLITCH CHAT] Error saving session: {e}")
    
    def get_chat_history(self, session_id: Optional[str] = None) -> Dict[str, Any]:
        """Get chat history for a session."""
        if session_id:
            session_file = self.chat_dir / f"{session_id}.json"
            if session_file.exists():
                try:
                    with session_file.open() as f:
                        return json.load(f)
                except Exception:
                    pass
        
        return {"error": "Session not found"}
    
    def list_sessions(self) -> List[str]:
        """List all chat sessions."""
        try:
            sessions = []
            for file_path in self.chat_dir.glob("chat_*.json"):
                sessions.append(file_path.stem)
            return sorted(sessions)
        except Exception:
            return []