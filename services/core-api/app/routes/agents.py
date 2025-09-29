import json
import os
import sys
import uuid
from datetime import datetime, timezone, timedelta
from pathlib import Path
from typing import Any, Dict, List

from fastapi import APIRouter, Cookie, Depends, Request, HTTPException, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.db.models import AgentRecord, User
from app.deps import get_redis, require_agent_token
from app.security.jwt import verify_token, get_current_user


# -------- Robust Root Resolver --------
def find_project_root(markers={".git", "pyproject.toml", "core"}, max_depth=10) -> Path:
    # start searching from the directory containing this file (not the file path)
    current = Path(__file__).resolve().parent
    for _ in range(max_depth):
        if any((current / marker).exists() for marker in markers):
            return current
        if current.parent == current:
            break
        current = current.parent

    # Fallback: check common container/workdir locations (e.g. /app)
    fallback_paths = [Path("/app")] + [Path(p) for p in sys.path if p]
    for p in fallback_paths:
        try:
            if any((p / marker).exists() for marker in markers):
                return p
        except Exception:
            continue

    # As a last resort, attempt to locate a top-level 'core' module package
    for entry in sys.path:
        try:
            cand = Path(entry) / "core"
            if cand.exists():
                return Path(entry)
        except Exception:
            continue

    raise RuntimeError("Could not locate project root")


project_root = find_project_root()
if str(project_root) not in sys.path:
    sys.path.append(str(project_root))

# -------- Agent Imports --------
from agents.audita.agent import AuditaAgent  # noqa: E402
from agents.echo.agent import EchoAgent  # noqa: E402
from agents.glitch.agent import GlitchAgent  # noqa: E402
from agents.lyra.agent import LyraAgent  # noqa: E402
from agents.nova.agent import NovaAgent  # noqa: E402
from agents.riven.agent import RivenAgent  # noqa: E402
from agents.velora.agent import VeloraAgent  # noqa: E402
from core.registry import AgentRegistry  # noqa: E402

# -------- Router & Registry --------
router = APIRouter(prefix="/agents", tags=["agents"])

_registry = AgentRegistry(
    token=os.getenv("NOVA_AGENT_TOKEN"),
    core_api_url=os.getenv("CORE_API_URL"),
    shared_secret=os.getenv("AGENT_SHARED_TOKEN"),
)
_registry.register("glitch", GlitchAgent())
_registry.register("echo", EchoAgent())
_registry.register("audita", AuditaAgent())
_registry.register("lyra", LyraAgent())
_registry.register("riven", RivenAgent())
_registry.register("velora", VeloraAgent())
_nova = NovaAgent(_registry)

_allow = {
    role.strip().upper()
    for role in os.getenv("NOVA_AGENT_ROLES_ALLOW", "GODMODE,SUPER_ADMIN,ADMIN_AGENT").split(",")
}


# -------- Job Payload Schema --------
class Job(BaseModel):
    command: str
    args: Dict[str, Any] = Field(default_factory=dict)
    log: bool = False


class AgentPayload(BaseModel):
    name: str
    display_name: str
    version: str | None = None
    host: str | None = None
    capabilities: list[str] = Field(default_factory=list)
    environment: str | None = None
    details: Dict[str, Any] = Field(default_factory=dict)


class LeakGuardSession(BaseModel):
    id: str
    user_id: str | None
    agent_id: str
    session_start: str
    flagged_at: str
    flagged_reason: str  # "consent_violation", "unauthorized_access", "data_leak", etc.
    risk_level: str  # "low", "medium", "high", "critical"
    enforcement_status: str  # "active", "blackout", "revoked", "honeypot"
    content_preview: str | None
    enforced_by: str | None
    enforced_at: str | None


class LeakGuardEnforcementRequest(BaseModel):
    session_id: str
    action: str  # "blackout", "revoke", "honeypot", "restore"
    reason: str | None = None


class LeakGuardAgentStatus(BaseModel):
    agent_id: str
    agent_name: str
    enforcement_mode: str  # "monitor", "enforce", "disabled"
    flagged_sessions: int
    active_enforcements: int
    last_activity: str | None


# -------- Agent Runner Endpoint --------
def _extract_identity(request: Request) -> Dict[str, Any] | None:
    auth = request.headers.get("authorization", "")
    if auth.lower().startswith("bearer "):
        token = auth.split(" ", 1)[1].strip()
        if token:
            try:
                claims = verify_token(token)
                return {
                    "subject": claims.get("sub"),
                    "email": claims.get("email"),
                    "role": claims.get("role"),
                }
            except Exception:
                return None
    return None


async def _online_agents(redis) -> Dict[str, Dict[str, Any]]:
    if redis is None:
        return {}
    agents: Dict[str, Dict[str, Any]] = {}
    names = await redis.smembers("agents:known")
    for name in names:
        raw = await redis.get(f"agent:{name}:state")
        if raw:
            try:
                agents[name] = json.loads(raw)
            except json.JSONDecodeError:
                continue
    return agents


def _serialize_record(record: AgentRecord, heartbeat: Dict[str, Any] | None) -> Dict[str, Any]:
    payload = {
        "name": record.name,
        "display_name": record.display_name,
        "version": record.version,
        "status": heartbeat.get("status", "online") if heartbeat else record.status,
        "host": heartbeat.get("host") if heartbeat else record.host,
        "capabilities": heartbeat.get("capabilities") if heartbeat else (record.capabilities or []),
        "environment": record.environment,
        "last_seen": (
            heartbeat.get("last_seen")
            if heartbeat
            else (record.last_seen.isoformat() if record.last_seen else None)
        ),
        "details": record.details or {},
    }
    return payload


async def _optional_user(
    access_token: str | None = Cookie(default=None, alias="access_token"),
    session: Session = Depends(get_session),
) -> User | None:
    if not access_token:
        return None
    try:
        data = verify_token(access_token)
        user_id = uuid.UUID(data["sub"])
    except Exception:
        return None
    return session.get(User, user_id)


@router.post("/{agent}")
async def run_agent(
    agent: str,
    job: Job,
    request: Request,
    current_user: User | None = Depends(_optional_user),
):
    # Token extraction
    token = request.headers.get("x-nova-token")
    if not token:
        auth = request.headers.get("authorization", "")
        if auth.lower().startswith("bearer "):
            token = auth.split(" ", 1)[1]

    if token != os.getenv("NOVA_AGENT_TOKEN"):
        return JSONResponse(
            {"success": False, "output": None, "error": "invalid agent token"}, status_code=401
        )

    header_role = request.headers.get("x-role", "").upper()
    derived_role = (current_user.role if current_user else "").upper()
    role = header_role or derived_role

    if not role:
        return JSONResponse(
            {"success": False, "output": None, "error": "missing role context"}, status_code=401
        )

    if role not in _allow:
        return JSONResponse(
            {"success": False, "output": None, "error": "forbidden"}, status_code=403
        )

    if agent not in _registry.agents:
        return JSONResponse(
            {"success": False, "output": None, "error": f"agent '{agent}' not found"},
            status_code=404,
        )

    identity = _extract_identity(request)
    if identity is None and current_user is not None:
        identity = {
            "subject": str(current_user.id),
            "email": current_user.email,
            "role": current_user.role,
        }
    if identity is None:
        identity = {"role": role}
    request_id = request.headers.get("x-request-id") or uuid.uuid4().hex
    payload = {
        "agent": agent,
        "command": job.command,
        "args": job.args,
        "log": job.log,
        "token": token,
        "role": role,
        "source": "core-api",
        "request_id": request_id,
        "identity": identity,
    }

    resp = _nova.run(payload)

    # Optional Prometheus-style metrics
    metrics = getattr(request.app.state, "agent_calls_total", None)
    if metrics:
        metrics.labels(agent=agent, success=str(resp.get("success"))).inc()
        if not resp.get("success"):
            request.app.state.errors_total.inc()

    resp.setdefault("request_id", request_id)
    return resp


@router.post("/register")
async def register_agent(
    payload: AgentPayload,
    session: Session = Depends(get_session),
    _=Depends(require_agent_token),
):
    record = session.get(AgentRecord, payload.name)
    now = datetime.now(timezone.utc)
    if record:
        record.display_name = payload.display_name
        record.version = payload.version
        record.status = "online"
        record.host = payload.host
        record.capabilities = payload.capabilities
        record.environment = payload.environment
        record.last_seen = now
        record.details = payload.details
    else:
        record = AgentRecord(
            name=payload.name,
            display_name=payload.display_name,
            version=payload.version,
            status="online",
            host=payload.host,
            capabilities=payload.capabilities,
            environment=payload.environment,
            last_seen=now,
            details=payload.details,
        )
        session.add(record)
    session.flush()
    return {"ok": True}


@router.get("")
async def list_agents(
    session: Session = Depends(get_session),
    redis=Depends(get_redis),
    _=Depends(require_agent_token),
):
    heartbeats = await _online_agents(redis)
    records = session.query(AgentRecord).order_by(AgentRecord.name).all()
    seen = set()
    agents: List[Dict[str, Any]] = []
    for record in records:
        heartbeat = heartbeats.get(record.name)
        agents.append(_serialize_record(record, heartbeat))
        seen.add(record.name)
    for name, heartbeat in heartbeats.items():
        if name in seen:
            continue
        agents.append(
            {
                "name": name,
                "display_name": name.replace("-", " ").title(),
                "version": heartbeat.get("version"),
                "status": "online",
                "host": heartbeat.get("host"),
                "capabilities": heartbeat.get("capabilities", []),
                "environment": "unknown",
                "last_seen": heartbeat.get("last_seen"),
                "details": {},
            }
        )
    return {"agents": agents}


# LeakGuard Enforcement Endpoints
@router.get("/leakguard/sessions", response_model=List[LeakGuardSession])
def get_flagged_sessions(
    status: str | None = None,  # Filter by enforcement status
    risk_level: str | None = None,  # Filter by risk level
    limit: int = 25,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get LeakGuard flagged sessions for enforcement dashboard"""
    if user.role not in ["godmode", "jules", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Mock data - replace with actual database queries to LeakGuard flagged sessions table
    flagged_sessions = [
        LeakGuardSession(
            id="lg_session_001",
            user_id="user_123",
            agent_id="agent_velora",
            session_start=(datetime.utcnow() - timedelta(hours=3)).isoformat(),
            flagged_at=(datetime.utcnow() - timedelta(hours=2)).isoformat(),
            flagged_reason="consent_violation",
            risk_level="high",
            enforcement_status="active",
            content_preview="User attempted to access restricted content without proper consent...",
            enforced_by=None,
            enforced_at=None,
        ),
        LeakGuardSession(
            id="lg_session_002",
            user_id="user_456",
            agent_id="agent_lyra",
            session_start=(datetime.utcnow() - timedelta(hours=6)).isoformat(),
            flagged_at=(datetime.utcnow() - timedelta(hours=4)).isoformat(),
            flagged_reason="data_leak",
            risk_level="critical",
            enforcement_status="blackout",
            content_preview="Potential unauthorized data transmission detected...",
            enforced_by="jules",
            enforced_at=(datetime.utcnow() - timedelta(hours=1)).isoformat(),
        ),
        LeakGuardSession(
            id="lg_session_003",
            user_id=None,  # Anonymous session
            agent_id="agent_riven",
            session_start=(datetime.utcnow() - timedelta(hours=1)).isoformat(),
            flagged_at=(datetime.utcnow() - timedelta(minutes=30)).isoformat(),
            flagged_reason="unauthorized_access",
            risk_level="medium",
            enforcement_status="honeypot",
            content_preview="Suspicious access pattern detected from unknown source...",
            enforced_by="godmode_auto",
            enforced_at=(datetime.utcnow() - timedelta(minutes=25)).isoformat(),
        ),
    ]

    # Apply filters
    if status:
        flagged_sessions = [s for s in flagged_sessions if s.enforcement_status == status]
    if risk_level:
        flagged_sessions = [s for s in flagged_sessions if s.risk_level == risk_level]

    return flagged_sessions[:limit]


@router.post("/leakguard/enforce")
def enforce_leakguard_action(
    enforcement_request: LeakGuardEnforcementRequest,
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Enforce LeakGuard action on flagged session"""
    if user.role not in ["godmode", "jules", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    valid_actions = ["blackout", "revoke", "honeypot", "restore"]
    if enforcement_request.action not in valid_actions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid enforcement action"
        )

    # Mock implementation - replace with actual enforcement logic
    return {
        "success": True,
        "session_id": enforcement_request.session_id,
        "action": enforcement_request.action,
        "enforced_by": user.username,
        "enforced_at": datetime.utcnow().isoformat(),
        "reason": enforcement_request.reason,
    }


@router.get("/leakguard/status", response_model=List[LeakGuardAgentStatus])
def get_leakguard_agent_status(
    user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    """Get LeakGuard enforcement status for all agents"""
    if user.role not in ["godmode", "jules", "admin"]:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied")

    # Mock data - replace with actual agent status queries
    agent_statuses = [
        LeakGuardAgentStatus(
            agent_id="agent_velora",
            agent_name="Velora",
            enforcement_mode="enforce",
            flagged_sessions=5,
            active_enforcements=2,
            last_activity=(datetime.utcnow() - timedelta(minutes=15)).isoformat(),
        ),
        LeakGuardAgentStatus(
            agent_id="agent_lyra",
            agent_name="Lyra",
            enforcement_mode="monitor",
            flagged_sessions=2,
            active_enforcements=0,
            last_activity=(datetime.utcnow() - timedelta(hours=1)).isoformat(),
        ),
        LeakGuardAgentStatus(
            agent_id="agent_riven",
            agent_name="Riven",
            enforcement_mode="enforce",
            flagged_sessions=3,
            active_enforcements=1,
            last_activity=(datetime.utcnow() - timedelta(minutes=5)).isoformat(),
        ),
        LeakGuardAgentStatus(
            agent_id="agent_nova",
            agent_name="Nova",
            enforcement_mode="disabled",
            flagged_sessions=0,
            active_enforcements=0,
            last_activity=None,
        ),
    ]

    return agent_statuses
