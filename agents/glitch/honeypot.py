"""Honeypot management for deploying stealth traps."""

import json
import os
import subprocess
import tempfile
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, List


class HoneypotManager:
    """Manages deployment and monitoring of stealth honeypot traps."""
    
    def __init__(self):
        self.honeypots: Dict[str, Dict[str, Any]] = {}
        self.honeypot_dir = Path("/tmp/glitch/honeypots")
        self.honeypot_dir.mkdir(parents=True, exist_ok=True)
        
        # Load existing honeypots
        self._load_honeypots()
    
    def _load_honeypots(self) -> None:
        """Load honeypot state from disk."""
        state_file = self.honeypot_dir / "honeypots.json"
        if state_file.exists():
            try:
                with state_file.open() as f:
                    self.honeypots = json.load(f)
            except Exception:
                self.honeypots = {}
    
    def _save_honeypots(self) -> None:
        """Save honeypot state to disk."""
        state_file = self.honeypot_dir / "honeypots.json"
        try:
            with state_file.open('w') as f:
                json.dump(self.honeypots, f, indent=2)
        except Exception:
            pass
    
    def get_active_count(self) -> int:
        """Get count of active honeypots."""
        return len([h for h in self.honeypots.values() if h.get("status") == "active"])
    
    def deploy_trap(self, trap_type: str = "filesystem") -> Dict[str, Any]:
        """Deploy a stealth honeypot trap."""
        trap_id = f"trap_{int(time.time())}"
        
        if trap_type == "filesystem":
            return self._deploy_filesystem_trap(trap_id)
        elif trap_type == "network":
            return self._deploy_network_trap(trap_id)
        elif trap_type == "process":
            return self._deploy_process_trap(trap_id)
        else:
            return {"error": f"Unknown trap type: {trap_type}"}
    
    def _deploy_filesystem_trap(self, trap_id: str) -> Dict[str, Any]:
        """Deploy filesystem-based honeypot."""
        try:
            # Create honeypot files in common target locations
            trap_paths = []
            
            # Create fake credential files
            fake_creds_path = self.honeypot_dir / f"{trap_id}_credentials.txt"
            fake_creds_path.write_text(
                "# Production Database Credentials\n"
                "DB_HOST=db.internal.company.com\n"
                "DB_USER=admin\n"
                "DB_PASS=SuperSecret123!\n"
                "API_KEY=ak_live_abcdef1234567890\n"
            )
            trap_paths.append(str(fake_creds_path))
            
            # Create fake SSH key
            fake_ssh_key = self.honeypot_dir / f"{trap_id}_id_rsa"
            fake_ssh_key.write_text(
                "-----BEGIN OPENSSH PRIVATE KEY-----\n"
                "b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAFwAAAAdzc2gtcn\n"
                "NhAAAAAwEAAQAAAQEAyWkKzKhJRvgEfCcHqrHh7CfUuNKKJoKC8rA5kF2QcGgJVXmPtLwM\n"
                "-----END OPENSSH PRIVATE KEY-----\n"
            )
            trap_paths.append(str(fake_ssh_key))
            
            # Create fake config files
            fake_config = self.honeypot_dir / f"{trap_id}_config.ini"
            fake_config.write_text(
                "[database]\n"
                "host = localhost\n"
                "username = root\n"
                "password = password123\n"
                "[api]\n"
                "secret_key = sk_test_fake_key_12345\n"
            )
            trap_paths.append(str(fake_config))
            
            # Set up monitoring script
            monitor_script = self.honeypot_dir / f"{trap_id}_monitor.sh"
            monitor_script.write_text(f"""#!/bin/bash
# Honeypot monitor for {trap_id}
LOG_FILE="{self.honeypot_dir}/{trap_id}_access.log"

while true; do
    for file in {' '.join(trap_paths)}; do
        if [ -f "$file" ]; then
            # Check if file was accessed recently
            if [ "$file" -nt "$LOG_FILE" ] || [ ! -f "$LOG_FILE" ]; then
                echo "$(date): HONEYPOT TRIGGERED - $file accessed" >> "$LOG_FILE"
                # Could send alert here
            fi
        fi
    done
    sleep 10
done
""")
            monitor_script.chmod(0o755)
            
            honeypot_data = {
                "trap_id": trap_id,
                "type": "filesystem",
                "status": "active",
                "deployed_at": datetime.now(timezone.utc).isoformat(),
                "trap_paths": trap_paths,
                "monitor_script": str(monitor_script),
                "triggers": 0
            }
            
            self.honeypots[trap_id] = honeypot_data
            self._save_honeypots()
            
            return {
                "success": True,
                "trap_id": trap_id,
                "type": "filesystem",
                "paths_deployed": len(trap_paths),
                "message": "Filesystem honeypot deployed successfully"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _deploy_network_trap(self, trap_id: str) -> Dict[str, Any]:
        """Deploy network-based honeypot."""
        try:
            # Create a fake service on an unusual port
            fake_port = 2222  # Fake SSH port
            
            # Create a simple netcat listener script
            listener_script = self.honeypot_dir / f"{trap_id}_listener.sh"
            listener_script.write_text(f"""#!/bin/bash
# Network honeypot listener for {trap_id}
LOG_FILE="{self.honeypot_dir}/{trap_id}_network.log"

echo "Starting network honeypot on port {fake_port}"
while true; do
    echo "$(date): Connection attempt to port {fake_port}" >> "$LOG_FILE"
    echo "SSH-2.0-OpenSSH_7.4" | nc -l -p {fake_port} -q 1
    sleep 1
done
""")
            listener_script.chmod(0o755)
            
            honeypot_data = {
                "trap_id": trap_id,
                "type": "network", 
                "status": "active",
                "deployed_at": datetime.now(timezone.utc).isoformat(),
                "port": fake_port,
                "listener_script": str(listener_script),
                "triggers": 0
            }
            
            self.honeypots[trap_id] = honeypot_data
            self._save_honeypots()
            
            return {
                "success": True,
                "trap_id": trap_id,
                "type": "network",
                "port": fake_port,
                "message": "Network honeypot deployed successfully"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def _deploy_process_trap(self, trap_id: str) -> Dict[str, Any]:
        """Deploy process-based honeypot.""" 
        try:
            # Create fake process that looks like a service
            fake_process_script = self.honeypot_dir / f"{trap_id}_service.py"
            fake_process_script.write_text(f"""#!/usr/bin/env python3
# Fake service process for honeypot {trap_id}
import time
import os
import json
from datetime import datetime

LOG_FILE = "{self.honeypot_dir}/{trap_id}_process.log"

def log_event(event):
    with open(LOG_FILE, 'a') as f:
        f.write(f"{{datetime.now().isoformat()}}: {{event}}\\n")

log_event("Fake service started")

# Simulate a service process
while True:
    # Check if process is being monitored
    try:
        # This would trigger alerts if someone is monitoring processes
        with open('/proc/self/stat', 'r') as f:
            stat_data = f.read()
        
        # Check for common monitoring tools
        ps_count = os.popen('ps aux | grep -c python').read()
        if int(ps_count) > 5:
            log_event("Possible monitoring detected")
    except:
        pass
    
    time.sleep(60)  # Sleep for 1 minute
""")
            fake_process_script.chmod(0o755)
            
            honeypot_data = {
                "trap_id": trap_id,
                "type": "process",
                "status": "active", 
                "deployed_at": datetime.now(timezone.utc).isoformat(),
                "process_script": str(fake_process_script),
                "triggers": 0
            }
            
            self.honeypots[trap_id] = honeypot_data
            self._save_honeypots()
            
            return {
                "success": True,
                "trap_id": trap_id,
                "type": "process",
                "message": "Process honeypot deployed successfully"
            }
            
        except Exception as e:
            return {"success": False, "error": str(e)}
    
    def check_triggers(self) -> List[Dict[str, Any]]:
        """Check all honeypots for triggers."""
        triggers = []
        
        for trap_id, honeypot in self.honeypots.items():
            if honeypot.get("status") != "active":
                continue
                
            trap_type = honeypot.get("type")
            
            if trap_type == "filesystem":
                fs_triggers = self._check_filesystem_triggers(trap_id, honeypot)
                triggers.extend(fs_triggers)
            elif trap_type == "network":
                net_triggers = self._check_network_triggers(trap_id, honeypot)
                triggers.extend(net_triggers)
            elif trap_type == "process":
                proc_triggers = self._check_process_triggers(trap_id, honeypot)
                triggers.extend(proc_triggers)
        
        return triggers
    
    def _check_filesystem_triggers(self, trap_id: str, honeypot: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check filesystem honeypot for triggers."""
        triggers = []
        
        try:
            log_file = Path(f"{self.honeypot_dir}/{trap_id}_access.log")
            if log_file.exists():
                # Read new log entries
                log_content = log_file.read_text()
                new_triggers = log_content.count("HONEYPOT TRIGGERED")
                
                if new_triggers > honeypot.get("triggers", 0):
                    triggers.append({
                        "trap_id": trap_id,
                        "type": "filesystem",
                        "trigger_count": new_triggers,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "details": log_content.split('\n')[-5:]  # Last 5 log lines
                    })
                    
                    # Update trigger count
                    honeypot["triggers"] = new_triggers
                    self._save_honeypots()
        
        except Exception:
            pass
        
        return triggers
    
    def _check_network_triggers(self, trap_id: str, honeypot: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check network honeypot for triggers.""" 
        triggers = []
        
        try:
            log_file = Path(f"{self.honeypot_dir}/{trap_id}_network.log")
            if log_file.exists():
                log_content = log_file.read_text()
                connection_attempts = log_content.count("Connection attempt")
                
                if connection_attempts > honeypot.get("triggers", 0):
                    triggers.append({
                        "trap_id": trap_id,
                        "type": "network",
                        "connection_attempts": connection_attempts,
                        "timestamp": datetime.now(timezone.utc).isoformat(),
                        "port": honeypot.get("port")
                    })
                    
                    honeypot["triggers"] = connection_attempts
                    self._save_honeypots()
        
        except Exception:
            pass
        
        return triggers
    
    def _check_process_triggers(self, trap_id: str, honeypot: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Check process honeypot for triggers."""
        triggers = []
        
        try:
            log_file = Path(f"{self.honeypot_dir}/{trap_id}_process.log")
            if log_file.exists():
                log_content = log_file.read_text()
                monitoring_events = log_content.count("monitoring detected")
                
                if monitoring_events > honeypot.get("triggers", 0):
                    triggers.append({
                        "trap_id": trap_id,
                        "type": "process",
                        "monitoring_events": monitoring_events,
                        "timestamp": datetime.now(timezone.utc).isoformat()
                    })
                    
                    honeypot["triggers"] = monitoring_events
                    self._save_honeypots()
        
        except Exception:
            pass
        
        return triggers
    
    def list_honeypots(self) -> Dict[str, Any]:
        """List all deployed honeypots."""
        return {
            "total_honeypots": len(self.honeypots),
            "active_honeypots": self.get_active_count(),
            "honeypots": self.honeypots
        }
    
    def remove_honeypot(self, trap_id: str) -> Dict[str, Any]:
        """Remove a honeypot trap."""
        if trap_id not in self.honeypots:
            return {"success": False, "error": "Honeypot not found"}
        
        try:
            honeypot = self.honeypots[trap_id]
            
            # Clean up files
            if honeypot.get("type") == "filesystem":
                for path in honeypot.get("trap_paths", []):
                    try:
                        Path(path).unlink()
                    except Exception:
                        pass
            
            # Remove from registry
            del self.honeypots[trap_id]
            self._save_honeypots()
            
            return {"success": True, "message": f"Honeypot {trap_id} removed"}
            
        except Exception as e:
            return {"success": False, "error": str(e)}