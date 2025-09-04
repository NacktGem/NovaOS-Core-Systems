#!/usr/bin/env python3
"""Test script for comprehensive Glitch agent functionality."""

import asyncio
import json
import subprocess
import sys
import tempfile
import time
from pathlib import Path


def test_agent_import():
    """Test that the agent can be imported."""
    print("Testing agent import...")
    try:
        sys.path.append('.')
        from agents.glitch.agent import GlitchAgent
        agent = GlitchAgent()
        print("  ✓ Agent import successful")
        return agent
    except Exception as e:
        print(f"  ✗ Agent import failed: {e}")
        return None


def test_basic_commands(agent):
    """Test basic agent commands."""
    print("Testing basic agent commands...")
    
    # Create test file
    with tempfile.NamedTemporaryFile(mode='w', delete=False, suffix='.txt') as f:
        f.write("Hello, World! This is test data for Glitch analysis.")
        test_file = f.name
    
    try:
        # Test hash_file command
        result = agent.run({
            "command": "hash_file",
            "args": {"path": test_file}
        })
        
        if result.get("success"):
            print("  ✓ hash_file command successful")
        else:
            print(f"  ✗ hash_file failed: {result.get('error')}")
        
        # Test detect_entropy command
        result = agent.run({
            "command": "detect_entropy", 
            "args": {"path": test_file}
        })
        
        if result.get("success"):
            print("  ✓ detect_entropy command successful")
        else:
            print(f"  ✗ detect_entropy failed: {result.get('error')}")
        
        # Test scan_system command
        result = agent.run({
            "command": "scan_system",
            "args": {}
        })
        
        if result.get("success"):
            print("  ✓ scan_system command successful")
        else:
            print(f"  ✗ scan_system failed: {result.get('error')}")
        
        # Test sandbox_check command
        result = agent.run({
            "command": "sandbox_check",
            "args": {}
        })
        
        if result.get("success"):
            print("  ✓ sandbox_check command successful")
        else:
            print(f"  ✗ sandbox_check failed: {result.get('error')}")
        
    finally:
        Path(test_file).unlink(missing_ok=True)


def test_cli_interface():
    """Test CLI interface."""
    print("Testing CLI interface...")
    
    try:
        # Test status command
        result = subprocess.run([
            sys.executable, "-c",
            "import sys; sys.path.append('.'); from agents.glitch.cli import main; main()",
            "status"
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0:
            try:
                status_data = json.loads(result.stdout)
                if status_data.get("agent") == "glitch":
                    print("  ✓ CLI status command successful")
                else:
                    print("  ✗ CLI status returned invalid data")
            except json.JSONDecodeError:
                print("  ✗ CLI status returned invalid JSON")
        else:
            print(f"  ✗ CLI status failed: {result.stderr}")
    
    except subprocess.TimeoutExpired:
        print("  ✗ CLI status command timed out")
    except Exception as e:
        print(f"  ✗ CLI test failed: {e}")


def test_forensics_tools():
    """Test custom forensics tools."""
    print("Testing custom forensics tools...")
    
    # Create test file with some entropy
    with tempfile.NamedTemporaryFile(mode='wb', delete=False, suffix='.bin') as f:
        # Mix of low and high entropy data
        f.write(b'A' * 100)  # Low entropy
        f.write(b''.join(bytes([i % 256]) for i in range(256)))  # Higher entropy
        test_file = f.name
    
    try:
        # Test entropy analyzer
        result = subprocess.run([
            sys.executable, "agents/glitch/tools/entropy-analyzer.py", test_file
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0 and "entropy:" in result.stdout:
            print("  ✓ Entropy analyzer tool working")
        else:
            print(f"  ✗ Entropy analyzer failed: {result.stderr}")
        
        # Test hash checker
        result = subprocess.run([
            sys.executable, "agents/glitch/tools/glitch-hash-checker.py", test_file
        ], capture_output=True, text=True, timeout=10)
        
        if result.returncode == 0 and "SHA256:" in result.stdout:
            print("  ✓ Hash checker tool working")
        else:
            print(f"  ✗ Hash checker failed: {result.stderr}")
    
    except subprocess.TimeoutExpired:
        print("  ✗ Forensics tools timed out")
    except Exception as e:
        print(f"  ✗ Forensics tools test failed: {e}")
    finally:
        Path(test_file).unlink(missing_ok=True)


async def test_full_scan():
    """Test full scan functionality."""
    print("Testing full scan functionality...")
    
    try:
        sys.path.append('.')
        from agents.glitch.forensics import ForensicsEngine
        
        engine = ForensicsEngine()
        
        # Test filesystem scan
        fs_results = await engine.scan_filesystem()
        if fs_results.get("scan_complete"):
            print("  ✓ Filesystem scan completed")
        else:
            print("  ✗ Filesystem scan failed")
        
        # Test memory scan
        mem_results = await engine.scan_memory()
        if "processes_analyzed" in mem_results:
            print("  ✓ Memory scan completed")
        else:
            print("  ✗ Memory scan failed")
        
        # Test network scan
        net_results = await engine.scan_network()
        if "ports_scanned" in net_results:
            print("  ✓ Network scan completed")
        else:
            print("  ✗ Network scan failed")
    
    except Exception as e:
        print(f"  ✗ Full scan test failed: {e}")


def test_honeypot_deployment():
    """Test honeypot deployment."""
    print("Testing honeypot deployment...")
    
    try:
        sys.path.append('.')
        from agents.glitch.honeypot import HoneypotManager
        
        manager = HoneypotManager()
        
        # Deploy filesystem honeypot
        result = manager.deploy_trap("filesystem")
        if result.get("success"):
            print("  ✓ Filesystem honeypot deployed")
            
            # Check if files were created
            trap_id = result.get("trap_id")
            if trap_id:
                honeypot_dir = Path("/tmp/glitch/honeypots")
                files = list(honeypot_dir.glob(f"{trap_id}_*"))
                if files:
                    print(f"  ✓ Honeypot files created: {len(files)}")
                else:
                    print("  ✗ No honeypot files found")
        else:
            print(f"  ✗ Honeypot deployment failed: {result.get('error')}")
    
    except Exception as e:
        print(f"  ✗ Honeypot test failed: {e}")


def test_logging_system():
    """Test logging system."""
    print("Testing logging system...")
    
    try:
        sys.path.append('.')
        from agents.glitch.logging import GlitchLogger
        
        logger = GlitchLogger()
        
        # Test basic logging
        logger.log("test_event", {"message": "Test log entry"})
        print("  ✓ Basic logging successful")
        
        # Test finding logging
        finding_id = logger.log_finding("test_finding", {"details": "Test finding"}, "medium")
        if finding_id:
            print("  ✓ Finding logging successful")
        else:
            print("  ✗ Finding logging failed")
        
        # Test log stats
        stats = logger.get_log_stats()
        if stats.get("total_events", 0) > 0:
            print("  ✓ Log statistics working")
        else:
            print("  ✗ Log statistics failed")
    
    except Exception as e:
        print(f"  ✗ Logging test failed: {e}")


def test_report_generation():
    """Test report generation."""
    print("Testing report generation...")
    
    try:
        sys.path.append('.')
        from agents.glitch.reports import ReportManager
        
        manager = ReportManager()
        
        # Create test scan results
        scan_results = {
            "scan_id": f"test_scan_{int(time.time())}",
            "findings": [
                {"type": "test_finding", "threat_level": "medium"},
                {"type": "another_finding", "threat_level": "low"}
            ],
            "metrics": {"files_scanned": 100}
        }
        
        # Save report
        report_path = manager.save_scan_report(scan_results)
        if report_path.exists():
            print("  ✓ Report generation successful")
        else:
            print("  ✗ Report generation failed")
    
    except Exception as e:
        print(f"  ✗ Report test failed: {e}")


def main():
    """Run comprehensive tests."""
    print("=" * 60)
    print("GLITCH AGENT COMPREHENSIVE TEST SUITE")
    print("=" * 60)
    
    # Test 1: Agent import and initialization
    agent = test_agent_import()
    if not agent:
        print("Critical failure: Agent cannot be imported")
        return False
    
    # Test 2: Basic agent commands
    test_basic_commands(agent)
    
    # Test 3: CLI interface
    test_cli_interface()
    
    # Test 4: Custom forensics tools
    test_forensics_tools()
    
    # Test 5: Full scan functionality
    asyncio.run(test_full_scan())
    
    # Test 6: Honeypot deployment
    test_honeypot_deployment()
    
    # Test 7: Logging system
    test_logging_system()
    
    # Test 8: Report generation
    test_report_generation()
    
    print("\n" + "=" * 60)
    print("TEST SUITE COMPLETE")
    print("=" * 60)
    
    # Check for created directories and files
    glitch_dir = Path("/tmp/glitch")
    if glitch_dir.exists():
        print(f"\nGlitch data directory created: {glitch_dir}")
        for subdir in glitch_dir.iterdir():
            if subdir.is_dir():
                file_count = len(list(subdir.iterdir()))
                print(f"  {subdir.name}/: {file_count} files")
    
    return True


if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)