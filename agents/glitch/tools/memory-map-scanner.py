#!/usr/bin/env python3
"""Memory mapping scanner for suspicious regions."""

import os
import re
import sys
from pathlib import Path


def parse_memory_maps(pid):
    """Parse /proc/pid/maps file."""
    maps_file = Path(f"/proc/{pid}/maps")
    
    if not maps_file.exists():
        return None
    
    try:
        maps_content = maps_file.read_text()
        return maps_content.splitlines()
    except PermissionError:
        return None
    except Exception as e:
        print(f"Error reading maps for PID {pid}: {e}")
        return None


def analyze_memory_regions(maps_lines):
    """Analyze memory regions for suspicious patterns."""
    regions = []
    suspicious_regions = []
    
    for line in maps_lines:
        # Parse memory map format: address perms offset dev inode pathname
        parts = line.split()
        if len(parts) < 5:
            continue
        
        address_range = parts[0]
        permissions = parts[1]
        offset = parts[2]
        device = parts[3]
        inode = parts[4]
        pathname = " ".join(parts[5:]) if len(parts) > 5 else ""
        
        # Parse address range
        try:
            start_addr, end_addr = address_range.split('-')
            start_addr = int(start_addr, 16)
            end_addr = int(end_addr, 16)
            size = end_addr - start_addr
        except ValueError:
            continue
        
        region = {
            'start_addr': start_addr,
            'end_addr': end_addr,
            'size': size,
            'permissions': permissions,
            'offset': offset,
            'device': device,
            'inode': inode,
            'pathname': pathname,
            'suspicious_flags': []
        }
        
        # Check for suspicious patterns
        
        # Executable heap
        if 'heap' in pathname and 'x' in permissions:
            region['suspicious_flags'].append('executable_heap')
        
        # Executable stack
        if 'stack' in pathname and 'x' in permissions:
            region['suspicious_flags'].append('executable_stack')
        
        # Anonymous executable regions
        if not pathname and 'x' in permissions and 'r' in permissions and 'w' in permissions:
            region['suspicious_flags'].append('anonymous_rwx')
        
        # Unusually large anonymous regions
        if not pathname and size > 50 * 1024 * 1024:  # > 50MB
            region['suspicious_flags'].append('large_anonymous')
        
        # Executable regions in /tmp or /dev/shm
        if pathname and ('tmp' in pathname or '/dev/shm' in pathname) and 'x' in permissions:
            region['suspicious_flags'].append('executable_temp')
        
        # Regions with suspicious names
        suspicious_names = ['.so.', 'deleted', 'SYSV', 'memfd:']
        if pathname and any(sus in pathname for sus in suspicious_names):
            if 'x' in permissions:
                region['suspicious_flags'].append('suspicious_executable')
        
        regions.append(region)
        
        if region['suspicious_flags']:
            suspicious_regions.append(region)
    
    return regions, suspicious_regions


def format_address(addr):
    """Format address for display."""
    return f"0x{addr:016x}"


def format_size(size):
    """Format size for display."""
    if size >= 1024 * 1024:
        return f"{size // (1024 * 1024)}MB"
    elif size >= 1024:
        return f"{size // 1024}KB"
    else:
        return f"{size}B"


def scan_process_memory(pid):
    """Scan memory of a specific process."""
    print(f"Scanning memory maps for PID {pid}")
    
    maps_lines = parse_memory_maps(pid)
    if maps_lines is None:
        print(f"Could not read memory maps for PID {pid}")
        return
    
    regions, suspicious_regions = analyze_memory_regions(maps_lines)
    
    print(f"Total memory regions: {len(regions)}")
    print(f"Suspicious regions: {len(suspicious_regions)}")
    
    if suspicious_regions:
        print(f"\nSuspicious Memory Regions:")
        print("-" * 80)
        
        for region in suspicious_regions:
            print(f"Address: {format_address(region['start_addr'])}-{format_address(region['end_addr'])}")
            print(f"Size: {format_size(region['size'])}")
            print(f"Permissions: {region['permissions']}")
            print(f"Path: {region['pathname'] or '[anonymous]'}")
            print(f"Flags: {', '.join(region['suspicious_flags'])}")
            print("-" * 40)
    
    # Statistics
    total_executable = len([r for r in regions if 'x' in r['permissions']])
    total_writable_executable = len([r for r in regions if 'w' in r['permissions'] and 'x' in r['permissions']])
    
    print(f"\nMemory Statistics:")
    print(f"  Executable regions: {total_executable}")
    print(f"  Writable+Executable: {total_writable_executable}")
    print(f"  Heap regions: {len([r for r in regions if 'heap' in r['pathname']])}")
    print(f"  Stack regions: {len([r for r in regions if 'stack' in r['pathname']])}")
    
    # Risk assessment
    risk_score = 0
    risk_factors = []
    
    if any('executable_heap' in r['suspicious_flags'] for r in suspicious_regions):
        risk_score += 30
        risk_factors.append("Executable heap detected")
    
    if any('executable_stack' in r['suspicious_flags'] for r in suspicious_regions):
        risk_score += 25
        risk_factors.append("Executable stack detected")
    
    if len([r for r in suspicious_regions if 'anonymous_rwx' in r['suspicious_flags']]) > 3:
        risk_score += 20
        risk_factors.append("Multiple RWX anonymous regions")
    
    if any('executable_temp' in r['suspicious_flags'] for r in suspicious_regions):
        risk_score += 15
        risk_factors.append("Executable code in temp directories")
    
    print(f"\nRisk Assessment:")
    print(f"  Risk Score: {risk_score}/100")
    
    if risk_score >= 50:
        print(f"  Assessment: HIGH RISK - Possible malware or exploitation")
    elif risk_score >= 25:
        print(f"  Assessment: MEDIUM RISK - Suspicious memory patterns")
    elif risk_score > 0:
        print(f"  Assessment: LOW RISK - Minor anomalies detected")
    else:
        print(f"  Assessment: CLEAN - No suspicious memory patterns")
    
    if risk_factors:
        print(f"  Risk Factors:")
        for factor in risk_factors:
            print(f"    • {factor}")


def scan_all_processes():
    """Scan all accessible processes."""
    print("Scanning memory maps for all processes...")
    
    suspicious_pids = []
    total_processes = 0
    
    for pid_dir in Path("/proc").iterdir():
        if not pid_dir.name.isdigit():
            continue
        
        pid = int(pid_dir.name)
        total_processes += 1
        
        maps_lines = parse_memory_maps(pid)
        if maps_lines is None:
            continue
        
        regions, suspicious_regions = analyze_memory_regions(maps_lines)
        
        if suspicious_regions:
            # Get process info
            try:
                cmdline_file = pid_dir / "cmdline"
                cmdline = cmdline_file.read_text().replace('\x00', ' ').strip()
                if not cmdline:
                    cmdline = f"[PID {pid}]"
            except:
                cmdline = f"[PID {pid}]"
            
            suspicious_pids.append({
                'pid': pid,
                'cmdline': cmdline,
                'suspicious_count': len(suspicious_regions),
                'suspicious_regions': suspicious_regions
            })
    
    print(f"Scanned {total_processes} processes")
    print(f"Found {len(suspicious_pids)} processes with suspicious memory patterns")
    
    if suspicious_pids:
        print(f"\nSuspicious Processes:")
        print("-" * 80)
        
        for proc in sorted(suspicious_pids, key=lambda x: x['suspicious_count'], reverse=True):
            print(f"PID {proc['pid']}: {proc['cmdline'][:60]}")
            print(f"  Suspicious regions: {proc['suspicious_count']}")
            
            for region in proc['suspicious_regions'][:3]:  # Show first 3 regions
                print(f"    {format_address(region['start_addr'])}: {', '.join(region['suspicious_flags'])}")
            
            if len(proc['suspicious_regions']) > 3:
                print(f"    ... and {len(proc['suspicious_regions']) - 3} more")
            print()


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} <pid|--all>")
        print()
        print("Examples:")
        print(f"  {sys.argv[0]} 1234        # Scan specific process")
        print(f"  {sys.argv[0]} --all       # Scan all processes")
        sys.exit(1)
    
    if sys.argv[1] == "--all":
        scan_all_processes()
    else:
        try:
            pid = int(sys.argv[1])
            scan_process_memory(pid)
        except ValueError:
            print(f"Error: Invalid PID '{sys.argv[1]}'")
            sys.exit(1)


if __name__ == "__main__":
    main()