import os
import subprocess
import tempfile
from pathlib import Path
from typing import Dict

from PIL import Image
import imagehash


def process(job: Dict) -> Dict:
    path = Path(job['input_path'])
    tmp = tempfile.mkdtemp()
    out = Path(tmp) / 'watermarked.mp4'
    wm_filter = "null"
    if job['watermark_mode'] == 'overlay':
        wm_filter = "drawtext=text='NovaOS':fontcolor=white@0.5:x=10:y=H-30"
    elif job['watermark_mode'] == 'stealth':
        wm_filter = "drawtext=text='N':fontcolor=white@0.1:x=10:y=H-30"
    subprocess.run(['ffmpeg', '-y', '-i', str(path), '-vf', wm_filter, str(out)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    frame = Path(tmp) / 'frame0.png'
    subprocess.run(['ffmpeg', '-y', '-i', str(out), '-vframes', '1', str(frame)], check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    img = Image.open(frame)
    ph = imagehash.phash(img)
    return {'hashes': [str(ph)], 'watermark_mode': job['watermark_mode'], 'pHash': str(ph)}
