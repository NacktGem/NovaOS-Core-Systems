import json
from pathlib import Path
from typing import List, Dict

import requests

from image_worker import process as process_image
from video_worker import process as process_video

QUEUE_FILE = Path(__file__).parent / 'jobs' / 'queue.jsonl'


def load_jobs() -> List[Dict]:
    if not QUEUE_FILE.exists():
        return []
    jobs = [json.loads(line) for line in QUEUE_FILE.read_text().splitlines() if line]
    return sorted(jobs, key=lambda j: j['priority'], reverse=True)


def run_once() -> None:
    jobs = load_jobs()
    QUEUE_FILE.write_text('')
    for job in jobs:
        if job['input_path'].lower().endswith(('.png', '.jpg', '.jpeg')):
            manifest = process_image(job)
        else:
            manifest = process_video(job)
        requests.post('http://localhost:8000/media/callback', json={'post_id': job['post_id'], 'manifest': manifest})
