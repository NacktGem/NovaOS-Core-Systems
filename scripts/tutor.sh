#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <create_prompt|generate_lesson> [args]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_AGENT="$SCRIPT_DIR/run-agent.sh"

CMD="$1"
shift || true
case "$CMD" in
  create_prompt)
    [ $# -eq 1 ] || { echo "usage: $0 create_prompt <topic>" >&2; exit 1; }
    PAYLOAD="{\"topic\":\"$1\"}"
    "$RUN_AGENT" lyra create_prompt "$PAYLOAD"
    ;;
  generate_lesson)
    [ $# -eq 1 ] || { echo "usage: $0 generate_lesson <prompt_id>" >&2; exit 1; }
    PAYLOAD="{\"prompt_id\":\"$1\"}"
    "$RUN_AGENT" lyra generate_lesson "$PAYLOAD"
    ;;
  *)
    echo "unknown command: $CMD" >&2
    exit 1
    ;;
 esac
