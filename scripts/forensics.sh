#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <hash|entropy|scan|probe> [args]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_AGENT="$SCRIPT_DIR/run-agent.sh"

CMD="$1"
shift || true
case "$CMD" in
  hash)
    [ $# -eq 1 ] || { echo "usage: $0 hash <path>" >&2; exit 1; }
    PAYLOAD="{\"path\":\"$1\"}"
    "$RUN_AGENT" glitch hash_file "$PAYLOAD"
    ;;
  entropy)
    [ $# -eq 1 ] || { echo "usage: $0 entropy <path>" >&2; exit 1; }
    PAYLOAD="{\"path\":\"$1\"}"
    "$RUN_AGENT" glitch detect_entropy "$PAYLOAD"
    ;;
  scan)
    [ $# -eq 0 ] || { echo "usage: $0 scan" >&2; exit 1; }
    "$RUN_AGENT" glitch scan_system
    ;;
  probe)
    HOST="${1:-127.0.0.1}"
    shift || true
    if [ $# -gt 0 ]; then
      PORTS=$(printf ',%s' "$@")
      PORTS="${PORTS:1}"
    else
      PORTS="22,80,443"
    fi
    PAYLOAD="{\"host\":\"$HOST\",\"ports\":[${PORTS}] }"
    "$RUN_AGENT" glitch network_probe "$PAYLOAD"
    ;;
  *)
    echo "unknown command: $CMD" >&2
    exit 1
    ;;
esac
