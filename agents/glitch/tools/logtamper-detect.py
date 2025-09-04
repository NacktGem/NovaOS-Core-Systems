#!/usr/bin/env python3
"""Log tampering detection script."""

import json
import re
import sys
from collections import defaultdict
from datetime import datetime
from pathlib import Path


def parse_syslog_timestamp(line):
    """Extract timestamp from syslog format."""
    # Match patterns like "Dec 25 10:30:45" or "2025-01-01T10:30:45"
    timestamp_patterns = [
        r'^(\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2})',  # Dec 25 10:30:45
        r'^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})',   # ISO format
        r'^(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})',   # YYYY-MM-DD HH:MM:SS
    ]
    
    for pattern in timestamp_patterns:
        match = re.match(pattern, line)
        if match:
            return match.group(1)
    return None


def detect_timestamp_anomalies(log_lines):
    """Detect timestamp anomalies that may indicate tampering."""
    timestamps = []
    anomalies = []
    
    for i, line in enumerate(log_lines):
        if not line.strip():
            continue
            
        timestamp = parse_syslog_timestamp(line.strip())
        if timestamp:
            timestamps.append((i, timestamp, line))
    
    if len(timestamps) < 2:
        return anomalies
    
    # Check for duplicate timestamps
    timestamp_counts = defaultdict(list)
    for line_num, timestamp, line in timestamps:
        timestamp_counts[timestamp].append((line_num, line))
    
    for timestamp, occurrences in timestamp_counts.items():
        if len(occurrences) > 5:  # More than 5 identical timestamps
            anomalies.append({
                'type': 'duplicate_timestamps',
                'timestamp': timestamp,
                'count': len(occurrences),
                'lines': [occ[0] for occ in occurrences[:5]]  # First 5 line numbers
            })
    
    # Check for timestamp gaps (simplified)
    sorted_timestamps = sorted(timestamps)
    for i in range(1, len(sorted_timestamps)):
        prev_line_num = sorted_timestamps[i-1][0]
        curr_line_num = sorted_timestamps[i][0]
        
        # If line numbers are sequential but timestamps are identical
        if curr_line_num - prev_line_num == 1:
            if sorted_timestamps[i-1][1] == sorted_timestamps[i][1]:
                anomalies.append({
                    'type': 'sequential_duplicate',
                    'lines': [prev_line_num, curr_line_num],
                    'timestamp': sorted_timestamps[i][1]
                })
    
    return anomalies


def detect_content_anomalies(log_lines):
    """Detect content-based tampering indicators.""" 
    anomalies = []
    
    # Check for suspicious patterns
    suspicious_patterns = [
        r'wget\s+http',
        r'curl\s+http',
        r'nc\s+-l',
        r'socat',
        r'/tmp/\w+\.(sh|py|bin)',
        r'chmod\s+\+x',
        r'rm\s+-rf\s+/',
    ]
    
    for i, line in enumerate(log_lines):
        line_lower = line.lower()
        for pattern in suspicious_patterns:
            if re.search(pattern, line_lower):
                anomalies.append({
                    'type': 'suspicious_command',
                    'line_number': i,
                    'pattern': pattern,
                    'content': line.strip()[:100]  # First 100 chars
                })
    
    # Check for authentication anomalies
    auth_failures = []
    for i, line in enumerate(log_lines):
        if any(phrase in line.lower() for phrase in 
               ['failed password', 'authentication failure', 'invalid user']):
            auth_failures.append(i)
    
    if len(auth_failures) > 20:  # Many auth failures
        anomalies.append({
            'type': 'excessive_auth_failures',
            'count': len(auth_failures),
            'lines': auth_failures[:10]  # First 10 line numbers
        })
    
    return anomalies


def analyze_log_structure(log_lines):
    """Analyze log file structure for tampering indicators."""
    structure_info = {
        'total_lines': len(log_lines),
        'empty_lines': 0,
        'malformed_lines': 0,
        'timestamp_formats': defaultdict(int)
    }
    
    for line in log_lines:
        if not line.strip():
            structure_info['empty_lines'] += 1
            continue
        
        timestamp = parse_syslog_timestamp(line.strip())
        if timestamp:
            # Determine timestamp format
            if re.match(r'\w{3}\s+\d{1,2}\s+\d{2}:\d{2}:\d{2}', timestamp):
                structure_info['timestamp_formats']['syslog'] += 1
            elif re.match(r'\d{4}-\d{2}-\d{2}T', timestamp):
                structure_info['timestamp_formats']['iso'] += 1
            else:
                structure_info['timestamp_formats']['other'] += 1
        else:
            structure_info['malformed_lines'] += 1
    
    return structure_info


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <log_file>")
        sys.exit(1)
    
    log_file = Path(sys.argv[1])
    
    if not log_file.exists():
        print(f"Error: Log file {log_file} not found")
        sys.exit(1)
    
    try:
        with log_file.open('r', encoding='utf-8', errors='ignore') as f:
            log_lines = f.readlines()
        
        print(f"Analyzing log file: {log_file}")
        print(f"Total lines: {len(log_lines)}")
        
        # Structure analysis
        structure = analyze_log_structure(log_lines)
        print(f"\nStructure Analysis:")
        print(f"  Empty lines: {structure['empty_lines']}")
        print(f"  Malformed lines: {structure['malformed_lines']}")
        print(f"  Timestamp formats: {dict(structure['timestamp_formats'])}")
        
        # Timestamp anomalies
        timestamp_anomalies = detect_timestamp_anomalies(log_lines)
        if timestamp_anomalies:
            print(f"\nTimestamp Anomalies ({len(timestamp_anomalies)} found):")
            for anomaly in timestamp_anomalies:
                print(f"  {anomaly['type']}: {anomaly}")
        
        # Content anomalies
        content_anomalies = detect_content_anomalies(log_lines)
        if content_anomalies:
            print(f"\nContent Anomalies ({len(content_anomalies)} found):")
            for anomaly in content_anomalies[:10]:  # Show first 10
                print(f"  {anomaly['type']}: Line {anomaly.get('line_number', 'N/A')}")
        
        # Overall assessment
        total_anomalies = len(timestamp_anomalies) + len(content_anomalies)
        if total_anomalies > 10:
            print(f"\nAssessment: HIGH RISK - {total_anomalies} anomalies detected")
        elif total_anomalies > 3:
            print(f"\nAssessment: MEDIUM RISK - {total_anomalies} anomalies detected")
        elif total_anomalies > 0:
            print(f"\nAssessment: LOW RISK - {total_anomalies} anomalies detected")
        else:
            print("\nAssessment: CLEAN - No obvious tampering detected")
        
        # Export results as JSON
        results = {
            'file': str(log_file),
            'analysis_timestamp': datetime.now().isoformat(),
            'structure': structure,
            'timestamp_anomalies': timestamp_anomalies,
            'content_anomalies': content_anomalies,
            'total_anomalies': total_anomalies
        }
        
        json_file = log_file.with_suffix('.tamper_analysis.json')
        with json_file.open('w') as f:
            json.dump(results, f, indent=2)
        
        print(f"\nDetailed results saved to: {json_file}")
        
    except Exception as e:
        print(f"Error analyzing log file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()