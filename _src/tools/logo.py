"""Builds colour / white logo variants from the transparent dark-bg logo.
The mark's sun (rays + crescent) is tinted brand orange, the panel grid brand blue."""
import sys, os
import numpy as np
from PIL import Image
src, out = sys.argv[1:3]
im = np.array(Image.open(src).convert('RGBA')).astype(float)
a = im[..., 3]; lum = im[..., :3].mean(-1) / 250  # white-ish art, use luminance as shading
h, w = a.shape
yy, xx = np.mgrid[0:h, 0:w]
ORANGE, BLUE, INK, GREY = (243, 146, 28), (26, 91, 160), (24, 28, 36), (93, 103, 118)

def tint(region_rgb):
    rgb = np.zeros((h, w, 3))
    for mask, col in region_rgb: rgb[mask] = col
    return rgb

grid = (yy >= 166) & (yy < 245) & (xx < 386)
mark = yy < 245
word = (yy >= 245) & (yy < 310)
energy = yy >= 310

def build(cols, name, crop):
    rgb = tint([(mark & ~grid, cols[0]), (grid, cols[1]), (word, cols[2]), (energy, cols[3])])
    rgb *= (0.82 + 0.18 * lum[..., None])  # keep a touch of the original shading
    img = Image.fromarray(np.dstack([rgb.clip(0, 255), a]).astype('uint8'))
    img = img.crop(crop); img.save(os.path.join(out, name)); return img

full = (88, 30, 506, 356)
build((ORANGE, BLUE, INK, GREY), 'logo-color.png', full)
build(((255,)*3, (255,)*3, (255,)*3, (200, 206, 216)), 'logo-white.png', full)
mk = build((ORANGE, BLUE, INK, GREY), 'mark-color.png', (182, 30, 422, 245))
mw = build(((255,)*3, (190, 210, 235), (255,)*3, (255,)*3), 'mark-white.png', (182, 30, 422, 245))

# horizontal lockup: mark + wordmark side by side (for headers)
for cols, name in (((ORANGE, BLUE, INK, GREY), 'logo-h-color.png'), (((255,)*3, (255,)*3, (255,)*3, (205, 212, 222)), 'logo-h-white.png')):
    rgb = tint([(mark & ~grid, cols[0]), (grid, cols[1]), (word, cols[2]), (energy, cols[3])]) * (0.82 + 0.18 * lum[..., None])
    img = Image.fromarray(np.dstack([rgb.clip(0, 255), a]).astype('uint8'))
    m = img.crop((182, 30, 422, 245)); t = img.crop((88, 250, 506, 356))
    s = 0.62 * m.height / t.height; t = t.resize((round(t.width * s), round(t.height * s)), Image.LANCZOS)
    canvas = Image.new('RGBA', (m.width + 26 + t.width, m.height), (0, 0, 0, 0))
    canvas.paste(m, (0, 0), m); canvas.paste(t, (m.width + 26, (m.height - t.height) // 2 + 4), t)
    canvas = canvas.crop(canvas.getbbox())
    canvas.thumbnail((640, 200), Image.LANCZOS); canvas.save(os.path.join(out, name))
mk.resize((180, 180 * mk.height // mk.width)).save(os.path.join(out, 'favicon.png'))
print('done')
