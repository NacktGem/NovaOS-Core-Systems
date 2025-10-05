import json, time
from pathlib import Path

JOBS = Path("artifacts/jobs/media")
JOBS.mkdir(parents=True, exist_ok=True)

def process_job(p):
    data = json.loads(p.read_text())
    outdir = Path(f"artifacts/media/{data['creator_id']}/{data['post_id']}")
    outdir.mkdir(parents=True, exist_ok=True)
    manifest = outdir / "manifest.json"
    manifest.write_text(json.dumps({"job": data, "status":"processed"}, indent=2))

def main():
    while True:
        for p in JOBS.glob("*.json"):
            process_job(p)
            p.unlink(missing_ok=True)
        time.sleep(1)

if __name__ == "__main__":
    main()
