#!/usr/bin/env bash
# Run a NovaOS agent through Nova's registry.
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <agent> [json-payload]" >&2
  exit 1
fi

AGENT="$1"
PAYLOAD="${2:-{}}"
TOKEN="${NOVA_AGENT_TOKEN:-}"

python - <<PYTHON "$AGENT" "$PAYLOAD" "$TOKEN"
import json, sys
from core.registry import AgentRegistry
from agents.echo.agent import EchoAgent
from agents.glitch.agent import GlitchAgent
from agents.nova.agent import NovaAgent

agent_name = sys.argv[1]
payload = json.loads(sys.argv[2] or "{}")
token = sys.argv[3] or None

registry = AgentRegistry(token=token)
registry.register("echo", EchoAgent())
registry.register("glitch", GlitchAgent())
nova = NovaAgent(registry)

job = {"agent": agent_name, "payload": payload}
if token:
    job["token"] = token

response = nova.run(job)
print(json.dumps(response, ensure_ascii=False))
PYTHON

