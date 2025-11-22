#!/usr/bin/env python3
"""Hash verification and integrity checker."""

import hashlib
import json
import sys
import time
from pathlib import Path


def calculate_hashes(file_path):
    """Calculate multiple hashes for a file."""
    try:
        with file_path.open('rb') as f:
            data = f.read()
        
        return {
            'md5': hashlib.md5(data).hexdigest(),
            'sha1': hashlib.sha1(data).hexdigest(), 
            'sha256': hashlib.sha256(data).hexdigest(),
            'sha512': hashlib.sha512(data).hexdigest()
        }
    except Exception as e:
        return {'error': str(e)}


def create_baseline(directory_path):
    """Create baseline hashes for all files in directory."""
    directory = Path(directory_path)
    
    if not directory.exists() or not directory.is_dir():
        print(f"Error: {directory_path} is not a valid directory")
        return
    
    baseline = {
        'created_at': time.time(),
        'created_at_iso': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime()),
        'directory': str(directory.resolve()),
        'files': {}
    }
    
    print(f"Creating baseline for directory: {directory}")
    
    file_count = 0
    for file_path in directory.rglob('*'):
        if file_path.is_file():
            try:
                stat_info = file_path.stat()
                relative_path = file_path.relative_to(directory)
                
                hashes = calculate_hashes(file_path)
                
                baseline['files'][str(relative_path)] = {
                    'size': stat_info.st_size,
                    'mtime': stat_info.st_mtime,
                    'permissions': oct(stat_info.st_mode)[-3:],
                    'hashes': hashes
                }
                
                file_count += 1
                if file_count % 100 == 0:
                    print(f"  Processed {file_count} files...")
                    
            except Exception as e:
                print(f"  Warning: Could not process {file_path}: {e}")
    
    # Save baseline
    baseline_file = directory / '.glitch_baseline.json'
    with baseline_file.open('w') as f:
        json.dump(baseline, f, indent=2)
    
    print(f"Baseline created with {file_count} files: {baseline_file}")


def verify_against_baseline(directory_path):
    """Verify current state against baseline."""
    directory = Path(directory_path)
    baseline_file = directory / '.glitch_baseline.json'
    
    if not baseline_file.exists():
        print(f"Error: No baseline found at {baseline_file}")
        print("Create a baseline first with: python3 glitch-hash-checker.py --create-baseline <directory>")
        return
    
    # Load baseline
    with baseline_file.open('r') as f:
        baseline = json.load(f)
    
    print(f"Verifying against baseline created: {baseline['created_at_iso']}")
    
    violations = []
    new_files = []
    missing_files = []
    
    # Check existing files in baseline
    for rel_path, baseline_info in baseline['files'].items():
        file_path = directory / rel_path
        
        if not file_path.exists():
            missing_files.append(rel_path)
            continue
        
        try:
            stat_info = file_path.stat()
            current_hashes = calculate_hashes(file_path)
            
            # Check for changes
            changes = []
            
            if stat_info.st_size != baseline_info['size']:
                changes.append(f"size changed: {baseline_info['size']} -> {stat_info.st_size}")
            
            if stat_info.st_mtime != baseline_info['mtime']:
                changes.append(f"modified time changed")
            
            if current_hashes.get('sha256') != baseline_info['hashes'].get('sha256'):
                changes.append(f"content changed (SHA256 mismatch)")
            
            if changes:
                violations.append({
                    'file': rel_path,
                    'changes': changes,
                    'baseline_hash': baseline_info['hashes'].get('sha256', 'N/A'),
                    'current_hash': current_hashes.get('sha256', 'N/A')
                })
                
        except Exception as e:
            violations.append({
                'file': rel_path,
                'changes': [f'verification error: {e}']
            })
    
    # Check for new files
    current_files = set()
    for file_path in directory.rglob('*'):
        if file_path.is_file() and file_path != baseline_file:
            try:
                relative_path = str(file_path.relative_to(directory))
                current_files.add(relative_path)
                
                if relative_path not in baseline['files']:
                    new_files.append(relative_path)
            except:
                pass
    
    # Report results
    print(f"\nVerification Results:")
    print(f"  Files in baseline: {len(baseline['files'])}")
    print(f"  Files currently: {len(current_files)}")
    print(f"  Violations: {len(violations)}")
    print(f"  New files: {len(new_files)}")
    print(f"  Missing files: {len(missing_files)}")
    
    if violations:
        print(f"\nIntegrity Violations:")
        for violation in violations[:10]:  # Show first 10
            print(f"  {violation['file']}: {', '.join(violation['changes'])}")
    
    if new_files:
        print(f"\nNew Files (not in baseline):")
        for new_file in new_files[:10]:  # Show first 10
            print(f"  {new_file}")
    
    if missing_files:
        print(f"\nMissing Files:")
        for missing_file in missing_files[:10]:  # Show first 10
            print(f"  {missing_file}")
    
    # Overall assessment
    total_issues = len(violations) + len(new_files) + len(missing_files)
    if total_issues == 0:
        print(f"\nAssessment: INTEGRITY INTACT - No changes detected")
    elif total_issues < 5:
        print(f"\nAssessment: MINOR CHANGES - {total_issues} issues found")
    elif total_issues < 20:
        print(f"\nAssessment: MODERATE CHANGES - {total_issues} issues found")  
    else:
        print(f"\nAssessment: MAJOR CHANGES - {total_issues} issues found")
    
    # Save verification report
    report = {
        'verified_at': time.time(),
        'verified_at_iso': time.strftime('%Y-%m-%d %H:%M:%S', time.localtime()),
        'baseline_created': baseline['created_at_iso'],
        'violations': violations,
        'new_files': new_files,
        'missing_files': missing_files,
        'total_issues': total_issues
    }
    
    report_file = directory / f'.glitch_verification_{int(time.time())}.json'
    with report_file.open('w') as f:
        json.dump(report, f, indent=2)
    
    print(f"\nVerification report saved: {report_file}")


def verify_single_file(file_path, expected_hash=None, hash_type='sha256'):
    """Verify a single file's hash."""
    file_path = Path(file_path)
    
    if not file_path.exists():
        print(f"Error: File {file_path} not found")
        return
    
    print(f"Verifying file: {file_path}")
    
    hashes = calculate_hashes(file_path)
    if 'error' in hashes:
        print(f"Error calculating hashes: {hashes['error']}")
        return
    
    print(f"File hashes:")
    for hash_name, hash_value in hashes.items():
        print(f"  {hash_name.upper()}: {hash_value}")
    
    if expected_hash:
        current_hash = hashes.get(hash_type.lower())
        if current_hash == expected_hash.lower():
            print(f"\n✓ Hash verification PASSED ({hash_type.upper()})")
        else:
            print(f"\n✗ Hash verification FAILED ({hash_type.upper()})")
            print(f"  Expected: {expected_hash}")
            print(f"  Actual:   {current_hash}")


def main():
    if len(sys.argv) < 2:
        print(f"Usage: {sys.argv[0]} [options] <target>")
        print()
        print("Options:")
        print("  --create-baseline <directory>  - Create integrity baseline")
        print("  --verify-baseline <directory>  - Verify against baseline") 
        print("  --verify-file <file> [hash]    - Verify single file hash")
        print("  --hash-type <type>             - Hash type for verification (default: sha256)")
        sys.exit(1)
    
    if sys.argv[1] == "--create-baseline":
        if len(sys.argv) != 3:
            print("Usage: --create-baseline <directory>")
            sys.exit(1)
        create_baseline(sys.argv[2])
    
    elif sys.argv[1] == "--verify-baseline":
        if len(sys.argv) != 3:
            print("Usage: --verify-baseline <directory>")
            sys.exit(1)
        verify_against_baseline(sys.argv[2])
    
    elif sys.argv[1] == "--verify-file":
        if len(sys.argv) < 3:
            print("Usage: --verify-file <file> [expected_hash]")
            sys.exit(1)
        
        file_path = sys.argv[2]
        expected_hash = sys.argv[3] if len(sys.argv) > 3 else None
        hash_type = 'sha256'
        
        # Check for hash type option
        if '--hash-type' in sys.argv:
            hash_type_idx = sys.argv.index('--hash-type')
            if hash_type_idx + 1 < len(sys.argv):
                hash_type = sys.argv[hash_type_idx + 1]
        
        verify_single_file(file_path, expected_hash, hash_type)
    
    else:
        # Default: calculate hashes for a single file
        verify_single_file(sys.argv[1])


if __name__ == "__main__":
    main()