#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "==> Ensuring pnpm is available..."
if ! command -v pnpm >/dev/null 2>&1; then
  corepack enable || true
  corepack prepare pnpm@10.14.0 --activate
fi
echo "-> pnpm: $(pnpm --version)"

echo "==> Node workspace install via pnpm..."
pnpm install

echo "==> Ensuring 'uv' is available for Python..."
if ! command -v uv >/dev/null 2>&1; then
  pipx install uv || python -m pip install --user uv
fi
echo "-> uv: $(uv --version || true)"

# Create per-project venvs under .venv/<name> and install
function setup_py() {
  local NAME="$1"
  local REQ="$2"
  local DEST=".venv/${NAME}"
  echo "---- python :: ${NAME}"
  mkdir -p "$(dirname "$DEST")"
  uv venv "$DEST"
  # shellcheck disable=SC1090
  source "${DEST}/bin/activate"
  uv pip install -r "$REQ"
  deactivate
}

echo "==> Python environments"
setup_py "agents" "agents/requirements.txt" || true
for svc in services/* ; do
  if [ -f "${svc}/requirements.txt" ]; then
    NAME=$(basename "$svc")
    setup_py "$NAME" "${svc}/requirements.txt" || true
  fi
done

echo "==> Quick sanity checks"
# Minimal Python agent test (Glitch hash) using agents venv
source .venv/agents/bin/activate || true
python - <<'PY'
from agents.glitch.agent import GlitchAgent
from agents.nova.agent import NovaAgent
from core.registry import AgentRegistry
from pathlib import Path
p = Path("artifacts/.bootstrap-test.txt")
p.parent.mkdir(parents=True, exist_ok=True)
p.write_text("hello", encoding="utf-8")
reg = AgentRegistry()
reg.register("glitch", GlitchAgent())
res = NovaAgent(reg).run({"agent":"glitch","command":"hash_file","args":{"path":str(p)}})
print("Glitch OK:", res["success"], res["output"]["sha256"])
PY
deactivate || true

echo "==> All set."