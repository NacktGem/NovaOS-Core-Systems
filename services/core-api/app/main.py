from fastapi import FastAPI, Depends, HTTPException, Request, Response, Cookie, Header
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import os, time, secrets
import psycopg
from psycopg.rows import dict_row
from passlib.hash import bcrypt
from app import payments

DB = os.getenv("DATABASE_URL", "postgresql://localhost/novaos")
ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")

app = FastAPI(title="Nova Core API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def db():
    return psycopg.connect(DB, row_factory=dict_row)

# --- Models
class RegisterIn(BaseModel):
    email: str
    username: str
    password: str

class LoginIn(BaseModel):
    email: str
    password: str

# --- Helpers
def set_session(resp: Response, token: str):
    resp.set_cookie("sid", token, httponly=True, secure=False, samesite="Lax", max_age=60*60*24*7)

def current_user(sid: str | None = Cookie(default=None)):
    if not sid:
        raise HTTPException(401, "No session")
    with db() as conn:
        s = conn.execute("SELECT user_id FROM auth.sessions WHERE token=%s", (sid,)).fetchone()
        if not s:
            raise HTTPException(401, "Invalid session")
        u = conn.execute("SELECT * FROM auth.users WHERE id=%s", (s["user_id"],)).fetchone()
        return u

def require_roles(*roles):
    def inner(user):
        if user["role"] in roles:
            return True
        raise HTTPException(403, "Forbidden")
    return inner

payments.get_user = current_user
app.include_router(payments.router)

# --- Routes
@app.get("/health")
def health(): return {"ok": True, "ts": time.time()}

@app.post("/auth/register")
def register(body: RegisterIn):
    pw = bcrypt.hash(body.password)
    with db() as conn:
        u = conn.execute(
          "INSERT INTO auth.users (email,username,password_hash,role) VALUES (%s,%s,%s,'VERIFIED_USER') RETURNING id",
          (body.email, body.username, pw)
        ).fetchone()
        return {"id": u["id"]}

@app.post("/auth/login")
def login(body: LoginIn, response: Response):
    with db() as conn:
        u = conn.execute("SELECT * FROM auth.users WHERE email=%s", (body.email,)).fetchone()
        if not u or not bcrypt.verify(body.password, u["password_hash"]):
            raise HTTPException(401, "Invalid credentials")
        tok = secrets.token_urlsafe(48)
        conn.execute("INSERT INTO auth.sessions (user_id, token) VALUES (%s,%s)", (u["id"], tok))
        response_data = {"user": {"id": str(u["id"]), "role": u["role"]}}
        set_session(response, tok)
        return response_data

@app.post("/auth/logout")
def logout(sid: str | None = Cookie(default=None)):
    if sid:
        with db() as conn:
            conn.execute("DELETE FROM auth.sessions WHERE token=%s", (sid,))
    return {"ok": True}

@app.get("/me")
def me(user=Depends(current_user)):
    return {"id": str(user["id"]), "email": user["email"], "role": user["role"]}

@app.get("/palettes")
def list_palettes(user=Depends(current_user)):
    with db() as conn:
        rows = conn.execute("SELECT key,name,tier,colors FROM content.palettes ORDER BY name").fetchall()
        unlocked = conn.execute("SELECT palette_key FROM content.palette_unlocks WHERE user_id=%s", (user["id"],)).fetchall()
        unlocked_keys = {r["palette_key"] for r in unlocked}
        for r in rows:
            r["unlocked"] = (r["tier"] == "FREE") or (r["key"] in unlocked_keys) or user["role"] in ("GODMODE","SUPER_ADMIN")
        return rows

class PurchaseIn(BaseModel):
    post_id: str
    price_cents: int

@app.post("/purchase")
def purchase(body: PurchaseIn, user=Depends(current_user)):
    # compute 12% split
    platform = round(body.price_cents * 0.12)
    creator = body.price_cents - platform
    with db() as conn:
        # lookup post & creator
        p = conn.execute("SELECT creator_id FROM content.posts WHERE id=%s", (body.post_id,)).fetchone()
        if not p: raise HTTPException(404,"Post not found")
        conn.execute("""
          INSERT INTO content.post_purchases (post_id,buyer_id,gross_cents,platform_cut_cents,creator_cut_cents)
          VALUES (%s,%s,%s,%s,%s)
          ON CONFLICT (post_id, buyer_id) DO NOTHING
        """,(body.post_id, user["id"], body.price_cents, platform, creator))
        conn.execute("""
          INSERT INTO ledger.vault_ledger (type,amount_cents,currency,ref)
          VALUES ('platform_cut',%s,'USD',%s)
        """,(platform, body.post_id))
    return {"ok": True, "split": {"platform": platform, "creator": creator}}

