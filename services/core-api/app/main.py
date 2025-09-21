import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.middleware.rate_limit import LoginRateLimit
from app.middleware.request_id import RequestIDMiddleware
from app.middleware.audit import AuditMiddleware
from app.security.csrf import CSRFMiddleware
from app.routes import (
    analytics,
    agents,
    auth,
    compliance,
    consent,
    dmca,
    internal,
    logs,
    messages,
    palettes,
    payments,
    platform,
    rooms,
    # stripe_integration,  # Temporarily disabled - missing stripe dependency
    system_audit,
)
from app.api.v1.agent import router as agent_router

PROM_ENABLED = os.getenv("PROM_ENABLED") == "true"
app = FastAPI(title="Nova Core API")


@app.on_event("startup")
def _load_identity_on_startup():
    try:
        # import here to ensure env package is available at runtime
        from env.identity import load_identity

        load_identity()
    except Exception as e:
        print(f"⚠️ Failed to load identity on startup: {e}")


if PROM_ENABLED:
    from prometheus_client import CONTENT_TYPE_LATEST, Counter, generate_latest

    app.state.requests_total = Counter("requests_total", "Total HTTP requests")
    app.state.agent_calls_total = Counter("agent_calls_total", "Agent calls", ["agent", "success"])
    app.state.errors_total = Counter("errors_total", "Total errors")

    @app.middleware("http")
    async def metrics_middleware(request: Request, call_next):
        app.state.requests_total.inc()
        try:
            response = await call_next(request)
        except Exception:  # noqa: BLE001
            app.state.errors_total.inc()
            raise
        if response.status_code >= 500:
            app.state.errors_total.inc()
        return response

    @app.get("/metrics")
    async def metrics():
        return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:3000,http://localhost:3001,http://localhost:3002",
).split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")

# Add audit middleware first (before other middleware for comprehensive logging)
try:
    import redis.asyncio as redis

    redis_client = redis.from_url(redis_url)
    app.add_middleware(AuditMiddleware, redis_client=redis_client)
except ImportError:
    # Redis not available, use database-only audit middleware
    app.add_middleware(AuditMiddleware, redis_client=None)

app.add_middleware(LoginRateLimit, redis_url=redis_url)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(CSRFMiddleware)

app.include_router(auth.router)
app.include_router(palettes.router)
app.include_router(payments.router)
# app.include_router(stripe_integration.router)  # Temporarily disabled - missing stripe dependency
app.include_router(compliance.router)
app.include_router(rooms.router)
app.include_router(messages.router)
app.include_router(consent.router)
app.include_router(internal.health_router, prefix="/internal")
app.include_router(internal.router)
app.include_router(dmca.router)
app.include_router(analytics.router)
app.include_router(agents.router)
app.include_router(agent_router)
app.include_router(logs.router)
app.include_router(platform.router)
app.include_router(system_audit.router)

# --- Agent Run Endpoint ---
from pydantic import BaseModel
from typing import Dict, Any


class RunAgentRequest(BaseModel):
    agent: str
    command: str
    args: Dict[str, Any] = {}
    log: bool = False


@app.post("/run")
async def run_agent_orchestrator(request: RunAgentRequest):
    """
    Orchestrator endpoint for running agents.
    This acts as a bridge between the frontend and the actual agents.
    """
    try:
        # Create a registry instance for agents that need it
        from core.registry import AgentRegistry

        registry = AgentRegistry()

        # Import agent modules dynamically
        if request.agent == "nova":
            from agents.nova.agent import NovaAgent

            agent_instance = NovaAgent(registry)
        elif request.agent == "echo":
            from agents.echo.agent import EchoAgent

            agent_instance = EchoAgent()
        elif request.agent == "glitch":
            from agents.glitch.agent import GlitchAgent

            agent_instance = GlitchAgent()
        elif request.agent == "lyra":
            from agents.lyra.agent import LyraAgent

            agent_instance = LyraAgent()
        elif request.agent == "velora":
            from agents.velora.agent import VeloraAgent

            agent_instance = VeloraAgent()
        elif request.agent == "audita":
            from agents.audita.agent import AuditaAgent

            agent_instance = AuditaAgent()
        elif request.agent == "riven":
            from agents.riven.agent import RivenAgent

            agent_instance = RivenAgent()
        else:
            return {"success": False, "output": None, "error": f"Unknown agent: {request.agent}"}

        # Run the agent with the provided command and args
        result = agent_instance.run({"command": request.command, "args": request.args})

        return result

    except Exception as e:
        return {"success": False, "output": None, "error": str(e)}


# --- Sovereign Standard: /version ---
from datetime import datetime, timezone  # noqa: E402

GIT_COMMIT = os.getenv("GIT_COMMIT", "unknown")


@app.get("/version")
def version():
    return {
        "service": "core-api",
        "version": os.getenv("CORE_API_VERSION", "0.0.0"),
        "commit": GIT_COMMIT,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }
