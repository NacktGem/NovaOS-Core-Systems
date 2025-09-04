#!/usr/bin/env python3
import runpy, sys, os
from agents.common.heartbeat import run_background as hb_start
from agents.common.control import run_background as ctl_start
from agents.common.alog import info

if len(sys.argv) < 3:
    print("Usage: run_agent_runtime.py <module_path.py> <AGENT_NAME>", file=sys.stderr)
    sys.exit(2)

target, name = sys.argv[1], sys.argv[2]
os.environ.setdefault("AGENT_NAME", name)

hb_start()
ctl_start()

info("agent starting")
try:
    runpy.run_path(target, run_name="__main__")
finally:
    info("agent stopping")