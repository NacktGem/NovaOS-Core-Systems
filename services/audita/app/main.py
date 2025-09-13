from fastapi import FastAPI, UploadFile, Form, HTTPException
import os, hashlib, shutil, psycopg
from psycopg.rows import dict_row
from datetime import datetime
from pathlib import Path

DB = os.getenv("DATABASE_URL","postgresql://localhost/novaos")
STORAGE = Path(os.getenv("CONSENT_STORE","artifacts/consents"))
STORAGE.mkdir(parents=True, exist_ok=True)

app = FastAPI(title="Audita")

def db(): return psycopg.connect(DB, row_factory=dict_row)

@app.post("/consent/upload")
async def upload_consent(user_id: str = Form(...), kind: str = Form(...), file: UploadFile | None = None):
    if not file: raise HTTPException(400,"file required")
    dest = STORAGE / f"{datetime.utcnow().timestamp()}_{file.filename}"
    with dest.open("wb") as f:
        shutil.copyfileobj(file.file, f)
    sha = hashlib.sha256(dest.read_bytes()).hexdigest()
    with db() as conn:
        conn.execute("INSERT INTO consent.consents (user_id,kind,sha256,file_path) VALUES (%s,%s,%s,%s)",
                     (user_id, kind, sha, str(dest)))
    return {"ok": True, "sha256": sha}

@app.post("/dmca/report")
def dmca_report(reporter: str, target_post: str | None = None):
    with db() as conn:
        conn.execute("INSERT INTO legal.dmca_actions (reporter,target_post) VALUES (%s,%s)", (reporter, target_post))
    return {"ok": True}


@app.get("/healthz")
def healthz():
    return {"status": "ok"}


@app.get("/readyz")
def readyz():
    return {"status": "ok"}
