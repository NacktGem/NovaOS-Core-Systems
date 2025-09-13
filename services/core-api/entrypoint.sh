#!/usr/bin/env sh
set -e

HOST="${HOST:-0.0.0.0}"
PORT="${PORT:-8000}"
APP_MODULE="${APP_MODULE:-app.main:app}"

exec uvicorn "$APP_MODULE" --host "$HOST" --port "$PORT"
