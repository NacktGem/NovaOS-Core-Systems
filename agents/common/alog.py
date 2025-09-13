import os, requests, socket, time

CORE = (os.getenv("CORE_API_URL") or "http://core-api:8000").rstrip("/")
TOKEN = os.getenv("AGENT_SHARED_TOKEN", "")
AGENT = os.getenv("AGENT_NAME", "unknown")

def _emit(level: str, msg: str, meta: dict | None = None):
    if not TOKEN:
        return
    url = f"{CORE}/api/v1/agent/log"
    body = {"agent": AGENT, "level": level, "msg": msg, "meta": meta or {}}
    try:
        requests.post(url, json=body, headers={"X-Agent-Token": TOKEN}, timeout=3)
    except Exception:
        pass

def info(msg: str, meta: dict | None = None): _emit("info", msg, meta)
def warn(msg: str, meta: dict | None = None): _emit("warn", msg, meta)
def error(msg: str, meta: dict | None = None): _emit("error", msg, meta)
def debug(msg: str, meta: dict | None = None):
    if os.getenv("NOVA_DEBUG", "").lower() in ("1", "true", "yes"):
        _emit("debug", msg, meta)