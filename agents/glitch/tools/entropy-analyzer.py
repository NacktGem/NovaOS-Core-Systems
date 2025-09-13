#!/usr/bin/env python3
"""Entropy analysis script for files."""

import math
import sys
from pathlib import Path


def calculate_entropy(data):
    """Calculate Shannon entropy of data."""
    if not data:
        return 0.0
    
    # Count byte frequencies
    byte_counts = {}
    for byte in data:
        byte_counts[byte] = byte_counts.get(byte, 0) + 1
    
    # Calculate entropy
    entropy = 0.0
    data_len = len(data)
    for count in byte_counts.values():
        prob = count / data_len
        if prob > 0:
            entropy -= prob * math.log2(prob)
    
    return entropy


def analyze_entropy_regions(data, block_size=256):
    """Analyze entropy in different regions."""
    regions = []
    
    for i in range(0, len(data), block_size):
        block = data[i:i+block_size]
        if len(block) < 10:  # Skip very small blocks
            continue
        
        entropy = calculate_entropy(block)
        regions.append({
            'offset': i,
            'size': len(block),
            'entropy': entropy,
            'suspicious': entropy > 7.0
        })
    
    return regions


def main():
    if len(sys.argv) != 2:
        print(f"Usage: {sys.argv[0]} <file>")
        sys.exit(1)
    
    file_path = Path(sys.argv[1])
    
    if not file_path.exists():
        print(f"Error: File {file_path} not found")
        sys.exit(1)
    
    try:
        data = file_path.read_bytes()
        
        # Overall entropy
        overall_entropy = calculate_entropy(data)
        
        print(f"File: {file_path}")
        print(f"Size: {len(data)} bytes")
        print(f"Overall entropy: {overall_entropy:.3f}")
        
        # Entropy assessment
        if overall_entropy > 7.5:
            print("Assessment: HIGH ENTROPY - Possible encryption/compression/malware")
        elif overall_entropy > 6.0:
            print("Assessment: MEDIUM ENTROPY - May contain compressed data")
        elif overall_entropy < 1.0 and len(data) > 1000:
            print("Assessment: LOW ENTROPY - Possible padding or simple data")
        else:
            print("Assessment: NORMAL ENTROPY")
        
        # Regional analysis
        regions = analyze_entropy_regions(data)
        suspicious_regions = [r for r in regions if r['suspicious']]
        
        if suspicious_regions:
            print(f"\nSuspicious regions ({len(suspicious_regions)} found):")
            for region in suspicious_regions[:10]:  # Show first 10
                print(f"  Offset {region['offset']:08x}: entropy {region['entropy']:.3f}")
        
    except Exception as e:
        print(f"Error analyzing file: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()