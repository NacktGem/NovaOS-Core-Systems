#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 2 ]; then
  echo "usage: $0 <agent> <command> [json-args]" >&2
  exit 1
fi

AGENT="$1"
COMMAND="$2"
if [ $# -ge 3 ]; then
  ARGS="$3"
else
  ARGS='{}'
fi
TOKEN="${NOVA_AGENT_TOKEN:-}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${SCRIPT_DIR}/.."

python - "$AGENT" "$COMMAND" "$ARGS" "$TOKEN" <<'PYTHON'
import json, sys
from core.registry import AgentRegistry
from agents.echo.agent import EchoAgent
from agents.glitch.agent import GlitchAgent
from agents.lyra.agent import LyraAgent
from agents.velora.agent import VeloraAgent
from agents.audita.agent import AuditaAgent
from agents.riven.agent import RivenAgent
from agents.nova.agent import NovaAgent

agent_name = sys.argv[1]
command = sys.argv[2]
args = json.loads(sys.argv[3] or "{}")
token = sys.argv[4] or None

registry = AgentRegistry(token=token)
registry.register("echo", EchoAgent())
registry.register("glitch", GlitchAgent())
registry.register("lyra", LyraAgent())
registry.register("velora", VeloraAgent())
registry.register("audita", AuditaAgent())
registry.register("riven", RivenAgent())
nova = NovaAgent(registry)

job = {"agent": agent_name, "command": command, "args": args}
if token:
    job["token"] = token

response = nova.run(job)
print(json.dumps(response, ensure_ascii=False))
PYTHON
