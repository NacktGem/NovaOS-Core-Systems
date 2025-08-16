import os
from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.db.base import get_session
from app.middleware.rate_limit import LoginRateLimit
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
)

app = FastAPI(title="Nova Core API")

origins = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
app.add_middleware(LoginRateLimit, redis_url=redis_url)
app.add_middleware(CSRFMiddleware)

app.include_router(auth.router)
app.include_router(palettes.router)
app.include_router(payments.router)
app.include_router(rooms.router)
app.include_router(messages.router)
app.include_router(consent.router)
app.include_router(internal.router)
app.include_router(dmca.router)
app.include_router(analytics.router)


@app.get("/healthz")
def healthz(session: Session = Depends(get_session)):
    session.execute(text("SELECT 1"))
    return {"status": "ok"}
