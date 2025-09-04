"""Forensics engine for advanced digital forensics capabilities."""

import asyncio
import subprocess
from pathlib import Path
from typing import Dict, Any, List
import json
import time
from datetime import datetime, timezone


class ForensicsEngine:
    """Advanced forensics capabilities using available system tools."""
    
    def __init__(self):
        self.available_tools = self._check_available_tools()
        
    def _check_available_tools(self) -> Dict[str, bool]:
        """Check which forensics tools are available on the system."""
        tools = {
            'strings': self._tool_exists('strings'),
            'hexdump': self._tool_exists('hexdump'), 
            'xxd': self._tool_exists('xxd'),
            'strace': self._tool_exists('strace'),
            'lsof': self._tool_exists('lsof'),
            'tcpdump': self._tool_exists('tcpdump'),
            'sha256sum': self._tool_exists('sha256sum'),
            'md5sum': self._tool_exists('md5sum'),
            'upx': self._tool_exists('upx'),
            'netstat': self._tool_exists('netstat'),
            'ss': self._tool_exists('ss'),
        }
        return tools
    
    def _tool_exists(self, tool_name: str) -> bool:
        """Check if a tool exists in PATH."""
        try:
            subprocess.run(['which', tool_name], capture_output=True, check=True)
            return True
        except subprocess.CalledProcessError:
            return False
    
    def check_tools_available(self) -> Dict[str, bool]:
        """Return status of available forensics tools."""
        return self.available_tools.copy()
    
    async def scan_filesystem(self) -> Dict[str, Any]:
        """Scan filesystem for anomalies and suspicious files."""
        findings = []
        files_scanned = 0
        
        # Define suspicious locations
        suspicious_paths = [
            "/tmp",
            "/var/tmp", 
            "/dev/shm",
            "/home/*/.ssh",
            "/root/.ssh"
        ]
        
        for base_path in suspicious_paths:
            try:
                if '*' in base_path:
                    # Handle glob patterns (simplified)
                    continue
                    
                path = Path(base_path)
                if not path.exists():
                    continue
                    
                # Scan directory
                for file_path in path.rglob('*'):
                    if files_scanned > 1000:  # Limit scan size
                        break
                        
                    if file_path.is_file():
                        files_scanned += 1
                        
                        # Check for suspicious files
                        if self._is_suspicious_file(file_path):
                            findings.append({
                                "type": "suspicious_file",
                                "path": str(file_path),
                                "size": file_path.stat().st_size,
                                "modified": file_path.stat().st_mtime,
                                "indicators": self._get_file_indicators(file_path)
                            })
                            
            except Exception:
                continue
        
        # Check for recently modified system files
        system_paths = ["/bin", "/sbin", "/usr/bin", "/usr/sbin"]
        for sys_path in system_paths:
            try:
                path = Path(sys_path)
                if not path.exists():
                    continue
                    
                for file_path in path.iterdir():
                    if file_path.is_file():
                        files_scanned += 1
                        stat_info = file_path.stat()
                        
                        # Recently modified system binary
                        if stat_info.st_mtime > time.time() - 86400:  # 24 hours
                            findings.append({
                                "type": "system_binary_modified",
                                "path": str(file_path),
                                "modified": stat_info.st_mtime,
                                "risk": "high"
                            })
                            
            except Exception:
                continue
        
        return {
            "files_scanned": files_scanned,
            "findings": findings,
            "scan_complete": True
        }
    
    def _is_suspicious_file(self, file_path: Path) -> bool:
        """Check if a file is suspicious based on various indicators."""
        try:
            # Hidden files in tmp directories
            if file_path.name.startswith('.') and '/tmp' in str(file_path):
                return True
                
            # Executable files in temp directories
            if file_path.stat().st_mode & 0o111 and '/tmp' in str(file_path):
                return True
                
            # Files with suspicious names
            suspicious_names = ['nc', 'ncat', 'socat', 'wget', 'curl', 'backdoor']
            if any(name in file_path.name.lower() for name in suspicious_names):
                return True
                
            return False
            
        except Exception:
            return False
    
    def _get_file_indicators(self, file_path: Path) -> List[str]:
        """Get indicators for why a file is suspicious."""
        indicators = []
        
        try:
            if file_path.name.startswith('.'):
                indicators.append("hidden_file")
            if file_path.stat().st_mode & 0o111:
                indicators.append("executable")
            if '/tmp' in str(file_path):
                indicators.append("temp_directory")
            if file_path.stat().st_size == 0:
                indicators.append("empty_file")
                
        except Exception:
            pass
            
        return indicators
    
    async def scan_memory(self) -> Dict[str, Any]:
        """Scan memory for suspicious processes and artifacts.""" 
        findings = []
        processes_analyzed = 0
        
        try:
            # Get detailed process information
            if self.available_tools['lsof']:
                # Use lsof to get open files
                lsof_result = subprocess.run(
                    ['lsof', '+c', '0'], 
                    capture_output=True, text=True, timeout=30
                )
                lsof_lines = lsof_result.stdout.splitlines()[1:100]  # First 100 entries
                
                for line in lsof_lines:
                    parts = line.split()
                    if len(parts) >= 9:
                        command = parts[0]
                        pid = parts[1]
                        file_path = ' '.join(parts[8:])
                        
                        # Check for suspicious file access
                        if any(sus in file_path.lower() for sus in ['/tmp/', 'wget', 'curl']):
                            findings.append({
                                "type": "suspicious_file_access",
                                "pid": pid,
                                "command": command,
                                "file": file_path,
                                "risk": "medium"
                            })
            
            # Get process list with memory info
            ps_result = subprocess.run(
                ['ps', '-eo', 'pid,ppid,comm,cmd,%mem,%cpu'], 
                capture_output=True, text=True
            )
            
            for line in ps_result.stdout.splitlines()[1:]:
                processes_analyzed += 1
                parts = line.split()
                if len(parts) >= 6:
                    pid = parts[0]
                    comm = parts[2]
                    cmd_line = ' '.join(parts[3:])
                    
                    # Check for suspicious process patterns
                    if any(sus in cmd_line.lower() for sus in 
                           ['nc -l', 'socat', 'wget http', '/tmp/']):
                        findings.append({
                            "type": "suspicious_process",
                            "pid": pid,
                            "command": comm,
                            "cmdline": cmd_line,
                            "risk": "high"
                        })
                        
        except Exception as e:
            findings.append({
                "type": "scan_error",
                "error": str(e)
            })
        
        return {
            "processes_analyzed": processes_analyzed,
            "findings": findings
        }
    
    async def scan_network(self) -> Dict[str, Any]:
        """Scan network for suspicious connections and activity."""
        findings = []
        ports_scanned = 0
        
        try:
            # Get network connections
            if self.available_tools['netstat']:
                netstat_result = subprocess.run(
                    ['netstat', '-tuln'], 
                    capture_output=True, text=True
                )
                
                connections = []
                for line in netstat_result.stdout.splitlines()[2:]:
                    parts = line.split()
                    if len(parts) >= 4:
                        protocol = parts[0]
                        local_addr = parts[3]
                        state = parts[5] if len(parts) > 5 else "UNKNOWN"
                        
                        connections.append({
                            "protocol": protocol,
                            "local_address": local_addr,
                            "state": state
                        })
                        ports_scanned += 1
                
                # Check for suspicious ports
                suspicious_ports = ['4444', '6666', '1234', '8080']
                for conn in connections:
                    for sus_port in suspicious_ports:
                        if sus_port in conn['local_address']:
                            findings.append({
                                "type": "suspicious_port",
                                "connection": conn,
                                "risk": "high"
                            })
            
            # Use ss as fallback
            elif self.available_tools['ss']:
                ss_result = subprocess.run(
                    ['ss', '-tuln'], 
                    capture_output=True, text=True
                )
                ports_scanned = len(ss_result.stdout.splitlines()) - 1
                
        except Exception as e:
            findings.append({
                "type": "network_scan_error", 
                "error": str(e)
            })
        
        return {
            "ports_scanned": ports_scanned,
            "findings": findings
        }
    
    async def deep_scan_file(self, file_path: Path) -> Dict[str, Any]:
        """Perform deep forensic analysis of a specific file."""
        analysis = {
            "file_path": str(file_path),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "analysis_results": {}
        }
        
        if not file_path.exists():
            return {"error": f"File not found: {file_path}"}
        
        try:
            # Basic file info
            stat_info = file_path.stat()
            analysis["file_info"] = {
                "size": stat_info.st_size,
                "created": stat_info.st_ctime,
                "modified": stat_info.st_mtime,
                "accessed": stat_info.st_atime,
                "permissions": oct(stat_info.st_mode)
            }
            
            # Hash analysis
            if self.available_tools['sha256sum']:
                sha256_result = subprocess.run(
                    ['sha256sum', str(file_path)],
                    capture_output=True, text=True
                )
                if sha256_result.returncode == 0:
                    analysis["analysis_results"]["sha256"] = sha256_result.stdout.split()[0]
            
            # Strings extraction
            if self.available_tools['strings']:
                strings_result = subprocess.run(
                    ['strings', '-n', '4', str(file_path)],
                    capture_output=True, text=True
                )
                if strings_result.returncode == 0:
                    strings_list = strings_result.stdout.splitlines()[:50]  # Limit output
                    analysis["analysis_results"]["strings"] = strings_list
            
            # Hex dump (first 512 bytes)
            if self.available_tools['xxd']:
                xxd_result = subprocess.run(
                    ['xxd', '-l', '512', str(file_path)],
                    capture_output=True, text=True
                )
                if xxd_result.returncode == 0:
                    analysis["analysis_results"]["hex_dump"] = xxd_result.stdout
            
        except Exception as e:
            analysis["error"] = str(e)
        
        return analysis
    
    async def deep_scan_directory(self, dir_path: Path) -> Dict[str, Any]:
        """Deep scan of a directory structure."""
        if not dir_path.is_dir():
            return {"error": f"Not a directory: {dir_path}"}
        
        analysis = {
            "directory_path": str(dir_path),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "file_count": 0,
            "suspicious_files": [],
            "directory_analysis": {}
        }
        
        try:
            files_found = list(dir_path.rglob('*'))
            analysis["file_count"] = len([f for f in files_found if f.is_file()])
            
            # Analyze each file (limited to avoid long execution)
            for file_path in files_found[:100]:
                if file_path.is_file() and self._is_suspicious_file(file_path):
                    file_analysis = await self.deep_scan_file(file_path)
                    analysis["suspicious_files"].append(file_analysis)
            
        except Exception as e:
            analysis["error"] = str(e)
        
        return analysis
    
    async def deep_scan_process(self, process_name: str) -> Dict[str, Any]:
        """Deep scan of a specific process."""
        analysis = {
            "process_name": process_name,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "process_info": {},
            "open_files": [],
            "network_connections": []
        }
        
        try:
            # Find process PID
            ps_result = subprocess.run(
                ['ps', '-eo', 'pid,comm,cmd'],
                capture_output=True, text=True
            )
            
            target_pid = None
            for line in ps_result.stdout.splitlines()[1:]:
                if process_name.lower() in line.lower():
                    target_pid = line.split()[0]
                    analysis["process_info"]["cmdline"] = line
                    break
            
            if target_pid and self.available_tools['lsof']:
                # Get open files for process
                lsof_result = subprocess.run(
                    ['lsof', '-p', target_pid],
                    capture_output=True, text=True
                )
                if lsof_result.returncode == 0:
                    analysis["open_files"] = lsof_result.stdout.splitlines()[:20]
            
        except Exception as e:
            analysis["error"] = str(e)
        
        return analysis