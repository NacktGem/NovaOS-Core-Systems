import os
from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware

from app.middleware.rate_limit import LoginRateLimit
from app.middleware.request_id import RequestIDMiddleware
from app.security.csrf import CSRFMiddleware
from app.routes import (
    auth,
    palettes,
    payments,
    rooms,
    messages,
    consent,
    dmca,
    analytics,
    internal,
    agents,
    logs,
)
from app.api.v1.agent import router as agent_router
PROM_ENABLED = os.getenv("PROM_ENABLED") == "true"
app = FastAPI(title="Nova Core API")

if PROM_ENABLED:
    from prometheus_client import CONTENT_TYPE_LATEST, Counter, generate_latest

    app.state.requests_total = Counter("requests_total", "Total HTTP requests")
    app.state.agent_calls_total = Counter(
        "agent_calls_total", "Agent calls", ["agent", "success"]
    )
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
app.add_middleware(LoginRateLimit, redis_url=redis_url)
app.add_middleware(RequestIDMiddleware)
app.add_middleware(CSRFMiddleware)

app.include_router(auth.router)
app.include_router(palettes.router)
app.include_router(payments.router)
app.include_router(rooms.router)
app.include_router(messages.router)
app.include_router(consent.router)
app.include_router(internal.health_router)
app.include_router(internal.router)
app.include_router(dmca.router)
app.include_router(analytics.router)
app.include_router(agents.router)
app.include_router(agent_router)
app.include_router(logs.router)
