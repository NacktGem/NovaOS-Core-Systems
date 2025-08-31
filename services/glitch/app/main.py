"""Glitch service main application.

This service performs moderation tasks for chat messages. It consumes tasks
from the agents bus and applies heuristic rules. Exposes health and metrics
endpoints for monitoring. Admin endpoints require an internal token.
"""

import os
import asyncio
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.responses import PlainTextResponse, JSONResponse

from agent_core import configure_logging  # type: ignore

app = FastAPI(title="Glitch Service")

# Simple in-memory paused flag for the worker(s)
_worker_paused = asyncio.Event()
_worker_paused.set()  # set() == not paused; clear() == paused

# Simple Prometheus-like metric counters
_metrics = {"processed": 0, "errors": 0}

INTERNAL_TOKEN = os.getenv("INTERNAL_TOKEN", "")


@app.on_event("startup")
async def startup_event() -> None:
    configure_logging()


@app.get("/healthz")
async def healthz() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.get("/readyz")
async def readyz() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.get("/metrics")
async def metrics() -> PlainTextResponse:
    # Render simple text metrics in Prometheus exposition format
    body = []
    body.append(f"glitch_processed_total {_metrics['processed']}")
    body.append(f"glitch_errors_total {_metrics['errors']}")
    return PlainTextResponse("\n".join(body), media_type="text/plain; version=0.0.4")


def verify_admin(x_internal_token: str = Header("")) -> None:
    if not INTERNAL_TOKEN or x_internal_token != INTERNAL_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


@app.post("/admin/pause")
async def admin_pause(x_internal_token: str = Header("")) -> JSONResponse:
    verify_admin(x_internal_token)
    _worker_paused.clear()
    return JSONResponse({"status": "paused"})


@app.post("/admin/resume")
async def admin_resume(x_internal_token: str = Header("")) -> JSONResponse:
    verify_admin(x_internal_token)
    _worker_paused.set()
    return JSONResponse({"status": "resumed"})


# Example worker coroutine that respects the paused state
async def worker_loop():
    while True:
        await _worker_paused.wait()
        # Process a task (placeholder for real work)
        try:
            # ... task processing logic ...
            _metrics['processed'] += 1
        except Exception:
            _metrics['errors'] += 1
        await asyncio.sleep(1)


# Start background worker if not already managed externally
@app.on_event("startup")
async def start_worker_task():
    app.state._worker_task = asyncio.create_task(worker_loop())
