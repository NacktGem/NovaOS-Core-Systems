from fastapi import APIRouter, Depends, HTTPException, Header
from pydantic import BaseModel
import os, psycopg
from psycopg.rows import dict_row

DB = os.getenv("DATABASE_URL", "postgresql://localhost/novaos")
router = APIRouter(prefix="/payments", tags=["payments"])

class PaletteUnlockIn(BaseModel):
  palette_key: str

class TierUpgradeIn(BaseModel):
  target_tier: str  # "CREATOR_SOVEREIGN"

def db():
  return psycopg.connect(DB, row_factory=dict_row)

def get_user():
  raise HTTPException(500, "user dependency not wired")

@router.post("/unlock-palette")
def unlock_palette(body: PaletteUnlockIn, proof: str = Header(default=""), user=Depends(get_user)):
  if not proof and user["role"] not in ("GODMODE","SUPER_ADMIN"):
    raise HTTPException(400, "missing payment proof")
  with db() as conn:
    conn.execute(
      "INSERT INTO content.palette_unlocks (user_id, palette_key) VALUES (%s,%s) ON CONFLICT DO NOTHING",
      (user["id"], body.palette_key)
    )
  return {"ok": True}

@router.post("/upgrade-tier")
def upgrade_tier(body: TierUpgradeIn, proof: str = Header(default=""), user=Depends(get_user)):
  if not proof and user["role"] not in ("GODMODE","SUPER_ADMIN"):
    raise HTTPException(400, "missing payment proof")
  if body.target_tier != "CREATOR_SOVEREIGN":
    raise HTTPException(400, "invalid target")
  with db() as conn:
    conn.execute("UPDATE auth.users SET role='CREATOR_SOVEREIGN' WHERE id=%s", (user["id"],))
  return {"ok": True}
