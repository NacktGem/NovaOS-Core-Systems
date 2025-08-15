import json
import pathlib
import sys
from unittest.mock import patch
from PIL import Image

sys.path.append(str(pathlib.Path(__file__).resolve().parents[1]))
import watcher  # type: ignore

JOBS = watcher.QUEUE_FILE


def test_priority_processing(tmp_path):
    img1 = tmp_path / 'a.png'
    img2 = tmp_path / 'b.png'
    Image.new('RGB', (10, 10), (255, 0, 0)).save(img1)
    Image.new('RGB', (10, 10), (0, 255, 0)).save(img2)
    jobs = [
        {
            'creator_id': 'u',
            'post_id': 1,
            'input_path': str(img1),
            'watermark_mode': 'overlay',
            'priority': 10,
            'created_at': '2024-01-01T00:00:00Z'
        },
        {
            'creator_id': 'u',
            'post_id': 2,
            'input_path': str(img2),
            'watermark_mode': 'overlay',
            'priority': 100,
            'created_at': '2024-01-01T00:00:00Z'
        }
    ]
    JOBS.write_text("\n".join(json.dumps(j) for j in jobs))
    order = []
    with patch('watcher.requests.post') as post:
        def side(url, json):
            order.append(json['post_id'])
        post.side_effect = side
        watcher.run_once()
    assert order == [2, 1]
