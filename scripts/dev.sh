#!/usr/bin/env bash
set -euo pipefail

# Wait for Postgres
echo "⏳ Waiting for Postgres..."
until docker compose exec -T db pg_isready -U "${POSTGRES_USER:-nova}" -d "${POSTGRES_DB:-nova}" >/dev/null 2>&1; do
  sleep 1
done
echo "✅ Postgres ready"

# Start Python services (each service container exposes its own port via uvicorn in its Dockerfile CMD)
# If you want to run them locally instead of inside containers, replace with uvicorn calls.

# Start Next.js apps via pnpm workspaces
echo "🚀 Starting Next.js dev servers"
pnpm -r dev
