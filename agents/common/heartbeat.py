import os, sys, time, json, socket, threading, requests, signal

CORE = os.getenv("CORE_API_URL", "http://core-api:8000").rstrip("/")
TOKEN = os.getenv("AGENT_SHARED_TOKEN", "")
AGENT = os.getenv("AGENT_NAME", "unknown")
INTERVAL = int(os.getenv("AGENT_HEARTBEAT_INTERVAL", "20"))

_stop = threading.Event()

def _send():
    url = f"{CORE}/api/v1/agent/heartbeat"
    payload = {
        "agent": AGENT,
        "version": os.getenv("NOVA_VERSION", "1.0.0"),
        "host": socket.gethostname(),
        "pid": os.getpid(),
        "capabilities": [c for c in os.getenv("AGENT_CAPS", "").split(",") if c],
    }
    try:
        r = requests.post(url, json=payload, headers={"X-Agent-Token": TOKEN}, timeout=4)
        r.raise_for_status()
    except Exception as e:
        # Silent fail; do not spam stdout in production
        pass

def run_background():
    def loop():
        while not _stop.is_set():
            _send()
            _stop.wait(INTERVAL)
    t = threading.Thread(target=loop, name="heartbeat", daemon=True)
    t.start()
    return t

def stop(_sig=None, _frm=None):
    _stop.set()

signal.signal(signal.SIGINT, stop)
signal.signal(signal.SIGTERM, stop)

if __name__ == "__main__":
    # Manual mode
    run_background()
    try:
        while not _stop.is_set():
            time.sleep(1)
    except KeyboardInterrupt:
        pass