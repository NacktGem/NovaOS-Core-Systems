#!/usr/bin/env python3
"""Fetch models declared in ai_models/.modelmap.json.

Usage:
  python3 scripts/fetch_models.py [--token-env HF_API_TOKEN] [--concurrency N]

Behavior:
- Reads `ai_models/.modelmap.json` from the current working directory.
- For every entry, if status != 'downloaded', attempts to download `url` -> `path`.
- Uses `aria2c` if present, falls back to `curl`.
- If `sha256` is present in the entry, validates it; otherwise records the computed sha256.
- Updates `size_bytes`, `sha256`, `status`, and `downloaded_at` and writes back `ai_models/.modelmap.json`.

This script is written to run both locally and in CI (where you should set the HF token
in the secret `HF_API_TOKEN` and expose it to the runner environment). It does not commit
changes to git (CI can commit if you want).
"""

from __future__ import annotations

import argparse
import hashlib
import json
import os
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path


def eprint(*args, **kwargs):
    print(*args, file=sys.stderr, **kwargs)


def has_aria2c() -> bool:
    return shutil.which("aria2c") is not None


def compute_sha256(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for block in iter(lambda: f.read(8192), b""):
            h.update(block)
    return h.hexdigest()


def download_with_aria2(url: str, out: Path, token: str | None) -> bool:
    cmd = ["aria2c", "-x16", "-s16", "-k1M", "-o", str(out), url]
    if token:
        cmd = ["aria2c", "-x16", "-s16", "-k1M", "--header", f"Authorization: Bearer {token}", "-o", str(out), url]
    eprint("Running:", " ".join(cmd))
    try:
        subprocess.run(cmd, check=True)
        return True
    except subprocess.CalledProcessError as exc:
        eprint("aria2c failed:", exc)
        return False


def download_with_curl(url: str, out: Path, token: str | None) -> bool:
    # Use curl with resume and follow redirects
    headers = ["-L", "-C", "-", "--retry", "5", "--retry-delay", "5", "--fail", "-o", str(out), url]
    if token:
        headers = ["-L", "-C", "-", "--retry", "5", "--retry-delay", "5", "--fail", "-H", f"Authorization: Bearer {token}", "-o", str(out), url]
    cmd = ["curl"] + headers
    eprint("Running:", " ".join(cmd))
    try:
        subprocess.run(cmd, check=True)
        return True
    except subprocess.CalledProcessError as exc:
        eprint("curl failed:", exc)
        return False


def ensure_parent(out: Path) -> None:
    out.parent.mkdir(parents=True, exist_ok=True)


def iso_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Fetch models declared in ai_models/.modelmap.json")
    parser.add_argument("--token-env", default="HF_API_TOKEN", help="Environment variable name that holds the HF token")
    parser.add_argument("--only", nargs="*", help="Optional list of model names to fetch (by name)")
    parser.add_argument("--yes", action="store_true", help="Auto-approve downloads")
    args = parser.parse_args(argv)

    repo_root = Path.cwd()
    modelmap_path = repo_root / "ai_models" / ".modelmap.json"
    if not modelmap_path.exists():
        eprint(f"modelmap not found at {modelmap_path}, creating a template and exiting")
        modelmap_path.parent.mkdir(parents=True, exist_ok=True)
        template = {"models": []}
        modelmap_path.write_text(json.dumps(template, indent=2))
        return 0

    token = os.environ.get(args.token_env)
    if not token:
        eprint(f"Warning: env var {args.token_env} not set. Requests may fail if endpoints require auth.")

    with modelmap_path.open() as f:
        modelmap = json.load(f)

    models = modelmap.get("models", [])
    if args.only:
        models = [m for m in models if m.get("name") in args.only]

    aria2 = has_aria2c()
    changed = False

    for entry in models:
        name = entry.get("name")
        url = entry.get("url")
        relpath = entry.get("path")
        if not name or not url or not relpath:
            eprint("Skipping malformed entry (missing name/url/path):", entry)
            continue

        # resolve path relative to repo root if not absolute
        out_path = Path(relpath)
        if not out_path.is_absolute():
            out_path = repo_root / out_path

        status = entry.get("status", "pending")
        if status == "downloaded" and out_path.exists():
            eprint(f"{name}: already marked downloaded and file exists, skipping")
            continue

        eprint(f"Preparing to download {name} -> {out_path}")
        ensure_parent(out_path)

        if not args.yes:
            eprint(f"About to download {name} from {url} to {out_path}")
            resp = input("Proceed? [y/N]: ").strip().lower()
            if resp != "y":
                eprint("Skipping", name)
                continue

        ok = False
        if aria2:
            ok = download_with_aria2(url, out_path, token)
        if not ok:
            ok = download_with_curl(url, out_path, token)

        if not ok:
            eprint(f"Failed to download {name}")
            entry["status"] = "failed"
            entry["http_last_checked"] = iso_now()
            changed = True
            continue

        # compute sha and size
        sha = compute_sha256(out_path)
        size = out_path.stat().st_size
        if entry.get("sha256"):
            if entry["sha256"] != sha:
                eprint(f"SHA mismatch for {name}: expected {entry['sha256']} got {sha}")
                entry["status"] = "bad_sha"
                entry["sha256"] = sha
                entry["size_bytes"] = size
                entry["downloaded_at"] = iso_now()
                changed = True
                continue

        entry["size_bytes"] = size
        entry["sha256"] = sha
        entry["status"] = "downloaded"
        entry["downloaded_at"] = iso_now()
        eprint(f"Downloaded {name}: {size} bytes, sha256 {sha}")
        changed = True

    if changed:
        modelmap["models"] = models
        modelmap_path.write_text(json.dumps(modelmap, indent=2))
        print(f"Wrote updated modelmap to {modelmap_path}")
    else:
        print("No updates made to modelmap")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
