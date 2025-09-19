"""Audita service main application (Sovereign Standard compliant).

Exposes:
  - GET /internal/healthz
  - GET /internal/readyz
  - GET /version
  - GET /status
  - POST /run

Loads identity from /app/env/config.json and emits standard log line.
Self-registers with core-api via periodic heartbeat.
"""

from __future__ import annotations

import os
import asyncio
import socket
import hashlib
import shutil
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict

import psycopg  # type: ignore
from psycopg.rows import dict_row  # type: ignore
from fastapi import Depends, FastAPI, UploadFile, Form, HTTPException, Request, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel

from env.identity import load_identity, CONFIG_PATH  # type: ignore
from agents.audita.agent import AuditaAgent  # type: ignore
from agents.common.security import IdentityClaims, authorize_headers, JWTVerificationError


class RunJob(BaseModel):
    command: str
    args: Dict[str, Any] = {}


app = FastAPI(title="Audita Service")

IDENTITY = load_identity()
try:
    print(f"[NovaOS] identity loaded from {CONFIG_PATH.resolve()}")
except Exception:
    pass

SERVICE_NAME = "audita"
GIT_COMMIT = os.getenv("GIT_COMMIT", "unknown")
CORE_API_URL = os.getenv("CORE_API_URL", "http://core-api:8000")
AGENT_TOKEN = os.getenv("AGENT_SHARED_TOKEN", "")
INTERNAL_TOKEN = os.getenv("INTERNAL_TOKEN", "")

_agent = AuditaAgent()

_required_roles = {
    role.strip().lower()
    for role in os.getenv("AUDITA_REQUIRED_ROLES", "godmode,superadmin").split(",")
    if role.strip()
}


def require_identity(request: Request) -> IdentityClaims:
    try:
        roles = _required_roles or None
        return authorize_headers(request.headers, required_roles=roles)
    except JWTVerificationError as exc:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail=str(exc)) from exc


def enforce_internal_token(request: Request) -> None:
    if not INTERNAL_TOKEN:
        return
    token = request.headers.get("x-internal-token")
    if token != INTERNAL_TOKEN:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="internal access only")


@app.on_event("startup")
async def startup_event() -> None:
    app.state._hb_task = asyncio.create_task(_heartbeat_loop())


@app.on_event("shutdown")
async def shutdown_event() -> None:
    task = getattr(app.state, "_hb_task", None)
    if task:
        task.cancel()


@app.get("/internal/healthz")
async def internal_healthz(request: Request) -> JSONResponse:
    enforce_internal_token(request)
    return JSONResponse({"status": "ok"})


@app.get("/internal/readyz")
async def internal_readyz(request: Request) -> JSONResponse:
    enforce_internal_token(request)
    return JSONResponse({"status": "ok"})


@app.get("/version")
async def version() -> Dict[str, Any]:
    return {
        "service": SERVICE_NAME,
        "name": IDENTITY.get("name", "NovaOS"),
        "version": IDENTITY.get("version", os.getenv("AUDITA_VERSION", "0.0.0")),
        "commit": GIT_COMMIT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/status")
async def status_page() -> Dict[str, Any]:
    return {
        "agent": SERVICE_NAME,
    }


@app.post("/run")
async def run(job: RunJob, identity: IdentityClaims = Depends(require_identity)) -> Dict[str, Any]:
    request_id = uuid.uuid4().hex
    try:
        payload = {
            "command": job.command,
            "args": job.args,
            "requested_by": {
                "subject": identity.subject,
                "email": identity.email,
                "role": identity.role,
            },
        }
        result = _agent.run(payload)
        result.setdefault("request_id", request_id)
        return result
    except Exception as e:  # noqa: BLE001
        return {"success": False, "output": None, "error": str(e), "request_id": request_id}


async def _heartbeat_loop() -> None:
    import httpx

    ttl = 90
    headers = {"x-agent-token": AGENT_TOKEN} if AGENT_TOKEN else {}
    payload = {
        "agent": SERVICE_NAME,
        "version": IDENTITY.get("version", "0.0.0"),
        "host": socket.gethostname(),
        "pid": os.getpid(),
        "capabilities": ["compliance", "legal", "audit"],
    }

    while True:
        try:
            url = f"{CORE_API_URL.rstrip('/')}/api/v1/agent/heartbeat"
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(url, json=payload, headers=headers)
        except Exception as e:  # noqa: BLE001
            print(f"heartbeat failed: {e}")
        await asyncio.sleep(ttl // 2)


# --- Existing Audita features (preserved) ---
DB = os.getenv("DATABASE_URL", "postgresql://localhost/novaos")
STORAGE = Path(os.getenv("CONSENT_STORE", "artifacts/consents"))
STORAGE.mkdir(parents=True, exist_ok=True)


def db():
    return psycopg.connect(DB, row_factory=dict_row)


@app.post("/consent/upload")
async def upload_consent(
    user_id: str = Form(...),
    kind: str = Form(...),
    file: UploadFile | None = None,
):
    if not file:
        raise HTTPException(400, "file required")
    dest = STORAGE / f"{datetime.utcnow().timestamp()}_{file.filename}"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    sha = hashlib.sha256(dest.read_bytes()).hexdigest()
    with db() as conn:
        conn.execute(
            "INSERT INTO consent.consents (user_id,kind,sha256,file_path) VALUES (%s,%s,%s,%s)",
            (user_id, kind, sha, str(dest)),
        )
    return {"ok": True, "sha256": sha}


@app.post("/dmca/report")
def dmca_report(reporter: str, target_post: str | None = None):
    with db() as conn:
        conn.execute(
            "INSERT INTO legal.dmca_actions (reporter,target_post) VALUES (%s,%s)",
            (reporter, target_post),
        )
    return {"ok": True}


# Back-compat simple health endpoints
@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/readyz")
def readyz():
    return {"status": "ok"}
