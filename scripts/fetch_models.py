#!/usr/bin/env python3
import os
import json
import hashlib
import requests
import sys
from pathlib import Path

def compute_sha256(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

def get_file_size(file_path):
    return os.path.getsize(file_path)

def download_model(url, save_path, hf_token=None):
    headers = {}
    if hf_token:
        headers["Authorization"] = f"Bearer {hf_token}"

    response = requests.get(url, headers=headers, stream=True)
    response.raise_for_status()

    os.makedirs(os.path.dirname(save_path), exist_ok=True)
    with open(save_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)

def update_modelmap(model_name, sha256, size_bytes):
    modelmap_path = Path("ai_models/.modelmap.json")
    with open(modelmap_path) as f:
        modelmap = json.load(f)

    for model in modelmap["models"]:
        if model["name"] == model_name:
            model["sha256"] = sha256
            model["size_bytes"] = size_bytes
            model["status"] = "downloaded"
            model["downloaded_at"] = "2023-12-06T00:00:00Z"

    with open(modelmap_path, "w") as f:
        json.dump(modelmap, f, indent=2)

def main():
    # Get token from environment
    hf_token = os.getenv("HUGGINGFACE_TOKEN") or os.getenv("HF_API_TOKEN")
    if not hf_token:
        print("No HuggingFace token found. Please set HUGGINGFACE_TOKEN or HF_API_TOKEN environment variable.")
        sys.exit(1)

    # Load modelmap
    try:
        with open("ai_models/.modelmap.json") as f:
            modelmap = json.load(f)
    except Exception as e:
        print(f"Error loading modelmap: {e}")
        sys.exit(1)

    # Process each pending model
    for model in modelmap["models"]:
        if model["status"] == "pending":
            print(f"Processing model: {model['name']}")
            try:
                # Download the model
                save_path = os.path.join(model["path"], "model.bin")
                print(f"Downloading from {model['url']} to {save_path}")
                download_model(model["url"], save_path, hf_token)

                # Compute SHA256 and size
                sha256 = compute_sha256(save_path)
                size = get_file_size(save_path)
                print(f"Download complete. SHA256: {sha256}, Size: {size} bytes")

                # Update modelmap
                update_modelmap(model["name"], sha256, size)
                print(f"Updated modelmap for {model['name']}")

            except Exception as e:
                print(f"Error processing {model['name']}: {e}")
                continue

if __name__ == "__main__":
    main()
