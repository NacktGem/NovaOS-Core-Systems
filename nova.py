#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import os
import sys
from typing import Any, Dict


def main() -> int:
    p = argparse.ArgumentParser(description="NovaCLI: orchestrate NovaOS agents")
    sub = p.add_subparsers(dest="cmd", required=True)

    r = sub.add_parser("run", help="Run an agent command")
    r.add_argument("agent", help="agent name, e.g., glitch")
    r.add_argument("command", help="command for the agent, e.g., hash_file")
    r.add_argument("--arg", action="append", default=[], help="key=value pairs for args")
    r.add_argument("--orchestrator", default=os.getenv("ORCHESTRATOR_URL", "http://localhost:9400"))

    ns = p.parse_args()

    if ns.cmd == "run":
        args: Dict[str, Any] = {}
        for kv in ns.arg:
            if "=" not in kv:
                print(f"invalid --arg '{kv}', expected key=value", file=sys.stderr)
                return 2
            k, v = kv.split("=", 1)
            # best-effort parse numbers/bools
            if v.lower() in {"true", "false"}:
                vv: Any = v.lower() == "true"
            else:
                try:
                    vv = int(v)
                except ValueError:
                    try:
                        vv = float(v)
                    except ValueError:
                        vv = v
            args[k] = vv

        payload = {"agent": ns.agent, "command": ns.command, "args": args}
        try:
            import requests  # type: ignore
        except Exception:
            print("ERROR: requests not installed. pip install requests", file=sys.stderr)
            return 3
        url = ns.orchestrator.rstrip("/") + "/run"
        try:
            resp = requests.post(url, json=payload, timeout=60)
            resp.raise_for_status()
            print(json.dumps(resp.json(), indent=2))
            return 0
        except Exception as e:
            print(f"request failed: {e}", file=sys.stderr)
            return 4

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
