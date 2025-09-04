import os, json, threading, time, signal, sys
import redis
from urllib.parse import urlparse
from .alog import info

AGENT = os.getenv("AGENT_NAME", "unknown")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")
REDIS_DB = int(os.getenv("REDIS_DB")) if os.getenv("REDIS_DB") else None

def _parse_redis_db_from_url(redis_url: str) -> int:
    """Parse Redis database number from URL, defaulting to 0."""
    try:
        parsed = urlparse(redis_url)
        if parsed.path and len(parsed.path) > 1:
            # Extract DB number from path like '/2'
            db_str = parsed.path.lstrip('/')
            return int(db_str) if db_str.isdigit() else 0
    except:
        pass
    return 0

def _get_redis_connection():
    """Create Redis connection with proper DB selection and logging."""
    if REDIS_DB is not None:
        db_num = REDIS_DB
    else:
        db_num = _parse_redis_db_from_url(REDIS_URL)
    
    # Create base URL without database path
    parsed = urlparse(REDIS_URL)
    base_url = f"{parsed.scheme}://{parsed.netloc}"
    
    client = redis.from_url(base_url, db=db_num, decode_responses=True)
    
    # Log Redis connection for audit
    info(f"agent-{AGENT}: Connected to Redis database {db_num} at {base_url}")
    
    return client

_stop = threading.Event()

def _handle(msg):
    if not msg or msg.get("type") != "message":
        return
    try:
        data = json.loads(msg["data"])
    except Exception:
        return
    op = data.get("op")
    if op == "ping":
        info("ping received")
        return
    if op == "cycle":
        info("cycle requested; exiting for supervisor restart")
        os._exit(0)
    if op == "task":
        # optional: surface a lightweight signal file the agent can watch
        info("task received", {"args": data.get("args", {})})
        path = f"/tmp/agent_task_{AGENT}.json"
        try:
            with open(path, "w") as f:
                json.dump(data.get("args", {}), f)
        except Exception:
            pass

def run_background():
    client = _get_redis_connection()
    pubsub = client.pubsub(ignore_subscribe_messages=True)
    pubsub.subscribe(f"agent.{AGENT}.control", "agent.all.control")

    def loop():
        while not _stop.is_set():
            try:
                msg = pubsub.get_message(timeout=1.0)
                if msg: _handle(msg)
            except Exception:
                time.sleep(1.0)
    t = threading.Thread(target=loop, name="controlbus", daemon=True)
    t.start()
    return t

def stop(_sig=None, _frm=None):
    _stop.set()

signal.signal(signal.SIGINT, stop)
signal.signal(signal.SIGTERM, stop)