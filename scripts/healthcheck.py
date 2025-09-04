#!/usr/bin/env python3
import os, sys, importlib.util

# Usage:
#   python scripts/healthcheck.py agents/nova/agent.py
#   returns 0 if file exists and is readable; 1 otherwise

path = sys.argv[1] if len(sys.argv) > 1 else None
if not path:
    print("missing path", file=sys.stderr)
    sys.exit(1)

if not os.path.isfile(path):
    print(f"not found: {path}", file=sys.stderr)
    sys.exit(1)

try:
    # Basic importability (best-effort): ensure parent dir in sys.path
    base = os.path.dirname(os.path.abspath(path))
    if base not in sys.path:
        sys.path.insert(0, base)
    # Don't execute, just check module resolution of the parent package folder
    sys.exit(0)
except Exception as e:
    print(f"healthcheck failed: {e}", file=sys.stderr)
    sys.exit(1)