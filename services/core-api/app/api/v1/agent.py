import json
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from ...db.base import get_session
from ...db.models import AgentRecord
from ...deps import get_redis, require_agent_token
from ...schemas.agent import AgentBeat

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])

TTL = 90  # seconds


class AgentLogEntry(BaseModel):
    agent: str = Field(..., min_length=2, max_length=64)
    level: str = Field(..., min_length=3, max_length=16)
    msg: str = Field(..., min_length=1, max_length=2048)
    meta: Dict[str, Any] = Field(default_factory=dict)


class AgentAuditEntry(BaseModel):
    timestamp: datetime
    job_id: str
    request_id: str
    role: str | None = None
    source: str = "registry"
    job: Dict[str, Any]
    response: Dict[str, Any]
    identity: Dict[str, Any] | None = None

@router.post("/heartbeat")
async def heartbeat(beat: AgentBeat, r = Depends(get_redis), _=Depends(require_agent_token)):
    key = f"agent:{beat.agent}:state"
    payload = {
        "agent": beat.agent,
        "version": beat.version,
        "host": beat.host,
        "pid": beat.pid,
        "capabilities": beat.capabilities,
        "last_seen": int(time.time()),
    }
    await r.set(key, json.dumps(payload), ex=TTL)
    await r.sadd("agents:known", beat.agent)
    return {"ok": True}

@router.get("/online")
async def online(r = Depends(get_redis)):
    names = await r.smembers("agents:known")
    out = []
    for name in sorted(names):
        raw = await r.get(f"agent:{name}:state")
        if raw:
            out.append(json.loads(raw))
    return {"agents": out}


@router.post("/log")
async def ingest_log(entry: AgentLogEntry, _=Depends(require_agent_token)):
    base = Path("logs/agent") / entry.agent
    base.mkdir(parents=True, exist_ok=True)
    record = {
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "agent": entry.agent,
        "level": entry.level.lower(),
        "message": entry.msg,
        "meta": entry.meta,
    }
    logfile = base / f"{datetime.utcnow().strftime('%Y-%m-%d')}.jsonl"
    with logfile.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(record, ensure_ascii=False) + "\n")
    return {"ok": True}


@router.post("/audit")
async def audit_event(
    entry: AgentAuditEntry,
    session: Session = Depends(get_session),
    _=Depends(require_agent_token),
):
    base = Path("logs/audit")
    base.mkdir(parents=True, exist_ok=True)
    payload = entry.dict()
    logfile = base / f"{entry.request_id}.json"
    with logfile.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=2, default=str)

    agent_name = entry.response.get("agent") or entry.job.get("agent")
    if agent_name:
        record = session.get(AgentRecord, agent_name)
        if record:
            record.last_seen = entry.timestamp
            record.status = "online" if entry.response.get("success") else "degraded"
            record.details = {**(record.details or {}), "last_audit_request": entry.request_id}
            session.flush()

    return {"ok": True, "request_id": entry.request_id}