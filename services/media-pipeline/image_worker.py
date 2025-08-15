from pathlib import Path
from typing import Dict

from PIL import Image, ImageDraw
import imagehash


def process(job: Dict) -> Dict:
    path = Path(job['input_path'])
    img = Image.open(path)
    mode = job['watermark_mode']
    if mode == 'overlay':
        draw = ImageDraw.Draw(img)
        draw.text((10, 10), 'NovaOS', fill=(255, 255, 255))
    elif mode == 'stealth':
        pixels = img.load()
        for x in range(img.width):
            for y in range(img.height):
                r, g, b = pixels[x, y]
                pixels[x, y] = ((r & ~1) | 1, g, b)
    img.save(path)
    ph = imagehash.phash(img)
    return {'hashes': [str(ph)], 'watermark_mode': mode, 'pHash': str(ph)}
