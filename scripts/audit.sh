#!/usr/bin/env bash
set -euo pipefail

if [ $# -lt 1 ]; then
  echo "usage: $0 <gdpr_scan|validate_consent|generate_audit> [args]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_AGENT="$SCRIPT_DIR/run-agent.sh"

CMD="$1"
shift || true
case "$CMD" in
  gdpr_scan)
    [ $# -eq 1 ] || { echo "usage: $0 gdpr_scan <path>" >&2; exit 1; }
    PAYLOAD="{\"path\":\"$1\"}"
    "$RUN_AGENT" audita gdpr_scan "$PAYLOAD"
    ;;
  validate_consent)
    [ $# -eq 2 ] || { echo "usage: $0 validate_consent <user_id> <consent_id>" >&2; exit 1; }
    PAYLOAD="{\"user_id\":\"$1\",\"consent_id\":\"$2\"}"
    "$RUN_AGENT" audita validate_consent "$PAYLOAD"
    ;;
  generate_audit)
    [ $# -eq 0 ] || { echo "usage: $0 generate_audit" >&2; exit 1; }
    "$RUN_AGENT" audita generate_audit
    ;;
  *)
    echo "unknown command: $CMD" >&2
    exit 1
    ;;
 esac
