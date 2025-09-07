ai_models — local model management

This folder stores model metadata and (by default) will not store large binaries.

Tracked file
- `ai_models/.modelmap.json` — metadata for models (name, type, path, url, sha256, size_bytes, status).

Fetcher
- `scripts/fetch_models.py` downloads models declared in `.modelmap.json`.
- It prefers `aria2c` if available, otherwise falls back to `curl`.

Usage (WSL, preferred):

1) Export your Hugging Face token locally (do _not_ commit it):

```bash
cd ~/NovaOS-Core-Systems-wsl
export HF_API_TOKEN="hf_..."
python3 scripts/fetch_models.py --token-env HF_API_TOKEN --yes
```

2) Run in background (to survive terminal disconnects):

```bash
cd ~/NovaOS-Core-Systems-wsl
nohup bash -c 'HF_API_TOKEN="hf_..." python3 scripts/fetch_models.py --token-env HF_API_TOKEN --yes' > fetch.log 2>&1 &
tail -f fetch.log
```

Notes
- Working in the WSL-native path (`~/NovaOS-Core-Systems-wsl`) avoids NTFS permission issues on `/mnt/d`.
- `ai_models/.modelmap.json` is allowed in git so metadata (checksums, size, status) can be tracked. Large binaries should remain uncommitted.
- To enable CI fetches, add a GitHub secret named `HF_API_TOKEN`.

