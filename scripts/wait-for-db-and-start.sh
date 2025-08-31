#!/usr/bin/env bash
set -euo pipefail

# Wait for Postgres
echo "⏳ Waiting for Postgres..."
until docker compose exec -T db pg_isready -U "${POSTGRES_USER:-nova}" -d "${POSTGRES_DB:-nova}" >/dev/null 2>&1; do
  sleep 1
done
echo "✅ Postgres ready"

# Start Next.js apps via pnpm workspaces
echo "🚀 Starting Next.js dev servers"
pnpm -r dev
