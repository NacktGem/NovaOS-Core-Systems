#!/usr/bin/env bash
set -euo pipefail

echo "🍎 Starting NovaOS development on macOS/Linux..."

echo "🐳 Starting infrastructure services..."
docker compose --profile infra up -d

echo "⏳ Waiting for Postgres..."
tries=0
while ! docker compose exec -T db pg_isready -U ${POSTGRES_USER:-nova} -d ${POSTGRES_DB:-nova_core} >/dev/null 2>&1; do
  sleep 1
  tries=$((tries + 1))
  if [ $tries -gt 120 ]; then
    echo "❌ Postgres not ready after 120s"
    exit 1
  fi
done
echo "✅ Postgres ready"

echo "🚀 Starting development servers..."
pnpm dev
