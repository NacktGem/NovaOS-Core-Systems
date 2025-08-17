"""Glitch service main application.

This service performs moderation tasks for chat messages. It consumes tasks
from the agents bus and applies heuristic rules. Exposes health and metrics
endpoints for monitoring. Admin endpoints require an internal token.
"""

import os
from fastapi import FastAPI, Header, HTTPException, status
from fastapi.responses import JSONResponse

from agent_core import configure_logging, RedisBus, AgentWorker  # type: ignore


app = FastAPI(title="Glitch Service")


@app.on_event("startup")
async def startup_event() -> None:
    # Configure logging once at startup
    configure_logging()


@app.get("/healthz")
async def healthz() -> JSONResponse:
    return JSONResponse({"status": "ok"})


@app.get("/metrics")
async def metrics() -> JSONResponse:
    # TODO: integrate with Prometheus client
    return JSONResponse({"metrics": {}})


# Simple admin auth via internal token from env
INTERNAL_TOKEN = os.getenv("INTERNAL_TOKEN", "")


def verify_admin(x_internal_token: str = Header("")) -> None:
    if not INTERNAL_TOKEN or x_internal_token != INTERNAL_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)


@app.post("/admin/pause")
async def admin_pause(x_internal_token: str = Header("")) -> JSONResponse:
    verify_admin(x_internal_token)
    # Implementation to pause worker would go here (stub)
    return JSONResponse({"status": "paused"})


@app.post("/admin/resume")
async def admin_resume(x_internal_token: str = Header("")) -> JSONResponse:
    verify_admin(x_internal_token)
    # Implementation to resume worker would go here (stub)
    return JSONResponse({"status": "resumed"})
