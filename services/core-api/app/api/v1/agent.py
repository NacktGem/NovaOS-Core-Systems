import json, time
from fastapi import APIRouter, Depends
from ...deps import get_redis, require_agent_token
from ...schemas.agent import AgentBeat
from ...schemas.command import AgentCommand

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

@router.post("/command")
async def command(cmd: AgentCommand, r = Depends(get_redis), _=Depends(require_agent_token)):
    # Channel pattern: agent.{name}.control or agent.all.control
    target = cmd.agent if cmd.agent != "all" else "all"
    chan = f"agent.{target}.control"
    payload = cmd.model_dump()
    await r.publish(chan, json.dumps(payload))
    return {"ok": True, "published": chan}