#!/usr/bin/env bash
set -euo pipefail

(cd services/core-api && uvicorn app.main:app --reload --port 8000) &
(cd services/echo && uvicorn app.main:app --reload --port 8010) &
(cd services/audita && uvicorn app.main:app --reload --port 8020) &
(cd services/velora && uvicorn app.main:app --reload --port 8030) &
wait
