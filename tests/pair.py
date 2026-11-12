"""Склеивает пары «референс | VERNISSAGE 2.0» в один JPEG на секцию.
python3 tests/pair.py <папка_с_png> <папка_вывода> [масштаб]"""
import sys, os, glob
from PIL import Image, ImageDraw
src, out = sys.argv[1], sys.argv[2]
scale = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
os.makedirs(out, exist_ok=True)
for ref in sorted(glob.glob(os.path.join(src, '*-ref.png'))):
    new = ref.replace('-ref.png', '-new.png')
    if not os.path.exists(new): continue
    a, b = Image.open(ref).convert('RGB'), Image.open(new).convert('RGB')
    s = scale if a.width > 700 else min(1, scale * 2)
    a = a.resize((int(a.width * s), int(a.height * s))); b = b.resize((int(b.width * s), int(b.height * s)))
    W = a.width + b.width + 30; H = max(a.height, b.height) + 34
    im = Image.new('RGB', (W, H), (232, 228, 220)); d = ImageDraw.Draw(im)
    d.text((6, 8), 'REFERENCE', fill=(40, 40, 40)); d.text((a.width + 36, 8), 'VERNISSAGE 2.0', fill=(40, 40, 40))
    im.paste(a, (0, 34)); im.paste(b, (a.width + 30, 34))
    im.save(os.path.join(out, os.path.basename(ref).replace('-ref.png', '.jpg')), quality=78)
print('ok')
