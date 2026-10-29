"""QA helper: slice a tall screenshot into readable chunks. Usage: python slice.py <png> [slice_px] [out_w]"""
import sys
from PIL import Image
src = sys.argv[1]; sl = int(sys.argv[2]) if len(sys.argv) > 2 else 2250; ow = int(sys.argv[3]) if len(sys.argv) > 3 else 720
im = Image.open(src)
for i in range(0, im.height, sl):
    c = im.crop((0, i, im.width, min(i + sl, im.height)))
    c.resize((ow, c.height * ow // im.width)).convert('RGB').save(src[:-4] + '_%d.jpg' % (i // sl), quality=80)
print(im.size)
