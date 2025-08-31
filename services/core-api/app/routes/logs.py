import os
from pathlib import Path

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import FileResponse

router = APIRouter(prefix="/logs", tags=["logs"])

_allow = {r.strip().upper() for r in os.getenv("NOVA_AGENT_ROLES_ALLOW", "GODMODE,SUPER_ADMIN,ADMIN_AGENT").split(",")}

@router.get("/{agent}/{job_id}.json")
async def get_log(agent: str, job_id: str, request: Request):
    role = request.headers.get("x-role", "").upper()
    if role not in _allow:
        raise HTTPException(status_code=403, detail="forbidden")
    path = Path("logs") / agent / f"{job_id}.json"
    if not path.exists():
        raise HTTPException(status_code=404, detail="not found")
    return FileResponse(path)
