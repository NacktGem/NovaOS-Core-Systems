#!/usr/bin/env bash
set -euo pipefail
pkill -f uvicorn >/dev/null 2>&1 || true
export NOVA_AGENT_ROLES_ALLOW=${NOVA_AGENT_ROLES_ALLOW:-GODMODE,SUPER_ADMIN,ADMIN_AGENT}
export PROM_ENABLED=true
pnpm exec puppeteer browsers install chrome >/dev/null 2>&1
TMP=$(mktemp -d)
openssl genrsa -out "$TMP/priv.pem" 512 >/dev/null 2>&1
openssl rsa -in "$TMP/priv.pem" -pubout -out "$TMP/pub.pem" >/dev/null 2>&1
export DATABASE_URL="sqlite:///$TMP/test.db"
export AUTH_PEPPER=pepper
export JWT_PRIVATE_KEY_PATH="$TMP/priv.pem"
export JWT_PUBLIC_KEY_PATH="$TMP/pub.pem"
export ECHO_INTERNAL_TOKEN=dev_internal_token
export CORS_ORIGINS=http://test
export REDIS_URL=redis://test
pushd services/core-api >/dev/null
uvicorn app.main:app --port 8760 &
PID=$!
popd >/dev/null
sleep 2
pnpm -r --filter "./apps/*" run e2e
kill $PID
