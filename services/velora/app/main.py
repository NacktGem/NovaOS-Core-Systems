from fastapi import FastAPI
from pydantic import BaseModel
import psycopg, os
from psycopg.rows import dict_row

DB = os.getenv("DATABASE_URL","postgresql://localhost/novaos")
app = FastAPI(title="Velora")

def db(): return psycopg.connect(DB, row_factory=dict_row)

class EventIn(BaseModel):
  user_id: str | None = None
  name: str
  props: dict = {}

@app.post("/ingest")
def ingest(ev: EventIn):
  with db() as conn:
    conn.execute("INSERT INTO analytics.events (user_id,name,props) VALUES (%s,%s,%s)", (ev.user_id, ev.name, ev.props))
  return {"ok": True}
