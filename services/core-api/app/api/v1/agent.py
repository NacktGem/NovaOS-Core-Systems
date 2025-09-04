import json, time, os
from typing import Optional
from fastapi import APIRouter, Depends
from ...deps import get_redis, require_agent_token
from ...schemas.agent import AgentBeat
from ...schemas.command import AgentCommand
from ...schemas.logs import AgentLog

router = APIRouter(prefix="/api/v1/agent", tags=["agent"])

TTL = 90  # seconds

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

LOG_MAX = int(os.getenv("AGENT_LOG_MAXLEN", "5000"))

@router.post("/log")
async def log_event(evt: AgentLog, r = Depends(get_redis), _=Depends(require_agent_token)):
    data = {
        "ts": str(int(time.time() * 1000)),
        "agent": evt.agent,
        "level": evt.level,
        "msg": evt.msg,
        "meta": json.dumps(evt.meta or {}),
    }
    await r.xadd("agent:logs", data, maxlen=LOG_MAX, approximate=True)
    await r.xadd(f"agent:{evt.agent}:logs", data, maxlen=LOG_MAX, approximate=True)
    return {"ok": True}

@router.get("/logs")
async def get_logs(agent: Optional[str] = None, limit: int = 200, r = Depends(get_redis)):
    stream = f"agent:{agent}:logs" if agent else "agent:logs"
    # newest -> oldest; we'll reverse for ascending
    entries = await r.xrevrange(stream, count=limit)
    out = []
    for sid, fields in entries:
        item = dict(fields)
        item["id"] = sid
        # decode meta JSON
        try:
            item["meta"] = json.loads(item.get("meta", "{}"))
        except Exception:
            item["meta"] = {}
        # ts as int
        try:
            item["ts"] = int(item["ts"])
        except Exception:
            pass
        out.append(item)
    out.reverse()
    return {"logs": out}

@router.post("/command")
async def command(cmd: AgentCommand, r = Depends(get_redis), _=Depends(require_agent_token)):
    # Channel pattern: agent.{name}.control or agent.all.control
    target = cmd.agent if cmd.agent != "all" else "all"
    chan = f"agent.{target}.control"
    payload = cmd.model_dump()
    await r.publish(chan, json.dumps(payload))
    return {"ok": True, "published": chan}