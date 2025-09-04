import os, json, threading, time, signal, sys
import redis

AGENT = os.getenv("AGENT_NAME", "unknown")
REDIS_URL = os.getenv("REDIS_URL", "redis://redis:6379/0")

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
        # nothing to print in prod; heartbeat covers liveness
        return
    if op == "cycle":
        # graceful self-terminate so Docker restart policy takes over
        os._exit(0)
    if op == "task":
        # optional: surface a lightweight signal file the agent can watch
        path = f"/tmp/agent_task_{AGENT}.json"
        try:
            with open(path, "w") as f:
                json.dump(data.get("args", {}), f)
        except Exception:
            pass

def run_background():
    client = redis.from_url(REDIS_URL, decode_responses=True)
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