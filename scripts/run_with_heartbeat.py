#!/usr/bin/env python3
import importlib.util, runpy, sys, os
from agents.common.heartbeat import run_background

if len(sys.argv) < 3:
    print("Usage: run_with_heartbeat.py <module_path.py> <AGENT_NAME>", file=sys.stderr)
    sys.exit(2)

target, name = sys.argv[1], sys.argv[2]
os.environ.setdefault("AGENT_NAME", name)

# Start heartbeat thread
run_background()

# Execute target module as a script
runpy.run_path(target, run_name="__main__")