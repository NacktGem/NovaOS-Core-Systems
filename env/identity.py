import json
from pathlib import Path
from typing import Dict, Any

# Resolve config path relative to this module file so it works regardless of CWD
CONFIG_PATH = Path(__file__).resolve().parent / "config.json"


def load_identity() -> Dict[str, Any]:
    fallback_identity = {
        "name": "Nova",
        "version": "1.1.0",
        "rules": {"require_founder_signature": True, "deny_cloud_execution": True},
    }

    try:
        if CONFIG_PATH.exists():
            resolved = str(CONFIG_PATH.resolve())
            print(f"NovaOS identity loaded from {resolved}")
            with open(CONFIG_PATH, "r", encoding="utf-8") as f:
                data = json.load(f)
                if "identity" in data:
                    return data["identity"]
                else:
                    print("⚠️ 'identity' block missing in config.json, using fallback.")
        else:
            print(f"⚠️ config.json not found at {CONFIG_PATH!s}, using fallback.")

        return fallback_identity

    except Exception as e:
        print(f"⚠️ Error loading identity config: {e}")
        return fallback_identity
