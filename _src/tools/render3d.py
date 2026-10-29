"""Ray-marched studio renders of the Sunchoice 3D objects.

Each object is a signed distance function (SDF). For every pixel a ray is fired
from a camera at z=5 and stepped forward by the SDF distance until it touches the
surface. Surfaces are shaded with a fake photo studio (sky, horizon, floor, two
softbox strips), a warm key, a cool rim, a top light and an amber fill, plus
Fresnel, clearcoat, tight speculars and soft ambient occlusion.

Usage: python render3d.py <out_dir> [size]
Outputs: obj-panel, obj-battery, obj-ring, obj-globe, obj-ribbon (.webp, transparent)
"""
import sys, os
import numpy as np
from PIL import Image

OUT = sys.argv[1]
SIZE = int(sys.argv[2]) if len(sys.argv) > 2 else 560
SS = 2  # supersample

# ---------- brand materials ----------
ORANGE_F0 = np.array([1.00, 0.56, 0.14])      # brand orange as polished metal
NAVY = np.array([0.012, 0.06, 0.20])          # deep navy lacquer
PANEL_BLUE = np.array([0.02, 0.10, 0.30])     # PV cell glass
SILVER_F0 = np.array([0.86, 0.88, 0.92])      # anodised aluminium


def norm(v):
    return v / np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-9)


def rot(x, y, z):
    x, y, z = np.radians([x, y, z])
    Rx = np.array([[1, 0, 0], [0, np.cos(x), -np.sin(x)], [0, np.sin(x), np.cos(x)]])
    Ry = np.array([[np.cos(y), 0, np.sin(y)], [0, 1, 0], [-np.sin(y), 0, np.cos(y)]])
    Rz = np.array([[np.cos(z), -np.sin(z), 0], [np.sin(z), np.cos(z), 0], [0, 0, 1]])
    return Rz @ Ry @ Rx


# ---------- SDFs (object space) ----------
def sd_round_rect2(qx, qy, bx, by, r):
    dx = np.abs(qx) - bx + r
    dy = np.abs(qy) - by + r
    return np.hypot(np.maximum(dx, 0), np.maximum(dy, 0)) + np.minimum(np.maximum(dx, dy), 0) - r


def sd_ring(p):
    q = np.hypot(p[..., 0], p[..., 2]) - 1.0
    return sd_round_rect2(q, p[..., 1], 0.17, 0.34, 0.11)


def sd_globe(p):
    return np.linalg.norm(p, axis=-1) - 1.0


def ribbon_local(p):
    th = np.arctan2(p[..., 2], p[..., 0])
    q = np.hypot(p[..., 0], p[..., 2]) - 1.0
    c, s = np.cos(th), np.sin(th)  # one full twist per lap -> two distinct faces
    return q * c - p[..., 1] * s, q * s + p[..., 1] * c


def sd_ribbon(p):
    u, v = ribbon_local(p)
    return sd_round_rect2(u, v, 0.36, 0.05, 0.04) * 0.55


def sd_panel(p):
    d = np.abs(p) - np.array([1.30, 0.055, 0.86]) + 0.035
    return np.linalg.norm(np.maximum(d, 0), axis=-1) + np.minimum(d.max(-1), 0) - 0.035


def sd_battery(p):
    r = np.hypot(p[..., 0], p[..., 2])
    body = sd_round_rect2(r, p[..., 1], 0.62, 0.95, 0.12)
    cap = sd_round_rect2(r, p[..., 1] - 1.0, 0.2, 0.09, 0.05)
    return np.minimum(body, cap)


# ---------- studio ----------
LIGHTS = [  # direction, sharpness, strength, colour
    (norm(np.array([-0.55, 0.75, 0.65])), 22, 4.2, np.array([1.0, 0.98, 0.95])),
    (norm(np.array([0.85, 0.25, -0.45])), 10, 1.6, np.array([0.75, 0.88, 1.0])),
    (norm(np.array([0.0, 1.0, 0.1])), 6, 0.6, np.array([1.0, 1.0, 1.0])),
    (norm(np.array([0.6, -0.4, 0.7])), 9, 0.5, np.array([1.0, 0.8, 0.55])),
]
KEY = LIGHTS[0][0]


def env(d):
    y = d[..., 1:2]
    sky, hor, floor = np.array([0.95, 0.97, 1.0]), np.array([0.30, 0.34, 0.42]), np.array([0.16, 0.10, 0.04])
    up = np.clip(y, 0, 1) ** 0.6
    c = np.where(y > 0, hor * (1 - up) + sky * up, hor * (1 + y * 1.6).clip(0, 1) + floor * (-y * 1.6).clip(0, 1))
    c = c * (0.55 + 0.45 * np.clip(d[..., 2:3] * 0.5 + 0.5, 0, 1)) * (0.75 + 0.25 * np.clip(d[..., 0:1] + 0.6, 0, 1))
    c = c + 1.6 * np.exp(-((y - 0.18) / 0.06) ** 2) * (d[..., 2:3] > -0.2)
    c = c + 1.1 * np.exp(-((d[..., 0:1] - 0.75) / 0.08) ** 2) * (y > -0.3)
    for L, sharp, k, col in LIGHTS:
        c = c + 0.15 * k * col * np.clip((d * L).sum(-1, keepdims=True), 0, 1) ** (sharp * 4)
    return c


def fresnel(f0, ndv):
    return f0 + (1 - f0) * (1 - ndv) ** 5


def spec(n, v, power, k):
    out = 0
    for L, _, s, col in LIGHTS[:2]:
        h = norm(L + v)
        out = out + k * (s / 4.2) * col * np.clip((n * h).sum(-1, keepdims=True), 0, 1) ** power
    return out


def diffuse(n):
    out = 0
    for L, _, s, col in LIGHTS:
        out = out + (s / 4.2) * col * np.clip((n * L).sum(-1, keepdims=True), 0, 1)
    return out


def shade_metal(f0, n, v, r, ao):
    ndv = np.clip((n * v).sum(-1, keepdims=True), 0, 1)
    F = fresnel(f0, ndv)
    c = env(r) * F * 0.95 + 0.12 * f0 * diffuse(n) + spec(n, v, 120, 2.2) * np.array([1, 0.96, 0.88])
    return c * ao * np.array([1.05, 0.95, 0.82])


def shade_lacquer(base, n, v, r, ao, glow=np.array([0.0, 0.15, 0.45])):
    ndv = np.clip((n * v).sum(-1, keepdims=True), 0, 1)
    ndl = np.clip((n * KEY).sum(-1, keepdims=True), 0, 1)
    c = base * (0.35 + 0.9 * ndl) + env(r) * fresnel(np.array([0.04] * 3), ndv) * 0.75 + spec(n, v, 90, 1.4)
    return c * ao + glow * (1 - ndv) ** 3 * 0.35


def shade_pearl(n, v, r, ao):
    ndv = np.clip((n * v).sum(-1, keepdims=True), 0, 1)
    ndl = np.clip((n * KEY).sum(-1, keepdims=True), 0, 1)
    t = n[..., 1:2] * 0.5 + 0.5
    base = np.array([0.0, 0.16, 0.48]) * (1 - t) + np.array([0.20, 0.62, 1.0]) * t
    c = base * (0.35 + 0.85 * ndl) + np.array([0.30, 0.80, 1.0]) * (1 - ndv) ** 2.5 * 0.5
    c = c + env(r) * fresnel(np.array([0.04] * 3), ndv) * 0.9 + spec(n, v, 220, 2.0) + spec(n, v, 10, 0.18)
    return c * ao


# ---------- materials per object (p, n in object space) ----------
def mat_ring(p, n, *a):
    inner = (np.hypot(p[..., 0], p[..., 2]) < 0.93)[..., None] & (np.abs(n[..., 1:2]) < 0.6)
    return np.where(inner, 1, 0)


def mat_globe(p, n, *a):
    lat = np.degrees(np.arcsin(np.clip(p[..., 1], -1, 1)))
    lon = np.degrees(np.arctan2(p[..., 2], p[..., 0]))
    line = (np.abs(((lat + 90) % 25.7) - 12.85) > 12.0) | (np.abs((lon % 30) - 15) > 14.1)
    line &= np.abs(lat) < 76
    return np.where(line[..., None], 0, 2)


def mat_ribbon(p, n, *a):
    u, v = ribbon_local(p)
    return np.where((v > 0)[..., None], 0, 1)


def mat_panel(p, n, *a):
    top = n[..., 1:2] > 0.8
    inset = (np.abs(p[..., 0]) < 1.21) & (np.abs(p[..., 2]) < 0.77)
    cx = (p[..., 0] + 1.21) / (2.42 / 10)
    cz = (p[..., 2] + 0.77) / (1.54 / 6)
    gap = (np.abs(cx - np.round(cx)) < 0.045) | (np.abs(cz - np.round(cz)) < 0.07)
    bus = np.abs(((cx % 1) - 0.5)) < 0.012
    cell = top & (inset & ~gap & ~bus)[..., None]
    return np.where(cell, 3, np.where(top & (inset & (gap | bus))[..., None], 5, 4))


def mat_battery(p, n, *a):
    y = p[..., 1:2]
    band = (y > 0.18) & (y < 0.46)
    cap = y > 0.9
    strip = (np.abs(y + 0.35) < 0.05)
    return np.where(cap, 4, np.where(band | strip, 0, 1))


def shade(mid, p, n, v, r, ao):
    out = np.zeros(p.shape)
    m = mid[..., 0]
    for k, fn in {
        0: lambda: shade_metal(ORANGE_F0, n, v, r, ao),
        1: lambda: shade_lacquer(NAVY, n, v, r, ao),
        2: lambda: shade_pearl(n, v, r, ao),
        3: lambda: shade_lacquer(PANEL_BLUE, n, v, r, ao, glow=np.array([0.05, 0.25, 0.6])) + spec(n, v, 600, 3.0),
        4: lambda: shade_metal(SILVER_F0, n, v, r, ao) * np.array([0.92, 0.98, 1.1]),
        5: lambda: shade_metal(SILVER_F0 * 0.9, n, v, r, ao) * 0.85,
    }.items():
        sel = m == k
        if sel.any():
            out[sel] = np.broadcast_to(fn(), p.shape)[sel]
    return out


# ---------- renderer ----------
def render(name, sdf, matfn, pose, scale):
    N = SIZE * SS
    R = rot(*pose)
    world = lambda pw: sdf(pw @ R)  # rows: p_obj = R^T p_world
    ys, xs = np.mgrid[0:N, 0:N]
    u = (xs + 0.5) / N * 2 - 1
    v = 1 - (ys + 0.5) / N * 2
    k = 0.33 / scale
    ro = np.array([0, 0, 5.0])
    rd = norm(np.dstack([u * k, v * k, -np.ones_like(u)])).reshape(-1, 3)
    t = np.full(len(rd), 2.5)
    hit = np.zeros(len(rd), bool)
    alive = np.ones(len(rd), bool)
    for _ in range(260):
        idx = np.nonzero(alive)[0]
        if not len(idx):
            break
        d = world(ro + rd[idx] * t[idx, None])
        t[idx] += d * 0.9
        h = d < 0.0008
        hit[idx[h]] = True
        alive[idx[h]] = False
        alive[idx[t[idx] > 7.5]] = False
    idx = np.nonzero(hit)[0]
    p = ro + rd[idx] * t[idx, None]
    e = 0.0015
    ks = np.array([[1, -1, -1], [-1, -1, 1], [-1, 1, -1], [1, 1, 1]], float)
    n = norm(sum(kk * world(p + kk * e)[:, None] for kk in ks))
    ao = np.ones((len(idx), 1))
    occ = 0
    for i in range(1, 6):
        hgt = 0.06 * i
        occ += (hgt - world(p + n * hgt)) * 0.5 ** i
    ao = np.clip(1 - 2.4 * occ, 0.35, 1)[:, None]
    vv = -rd[idx]
    r = norm(rd[idx] - 2 * (rd[idx] * n).sum(-1, keepdims=True) * n)
    po, no = p @ R, n @ R
    col = shade(matfn(po, no), po, n, vv, r, ao)
    col = 1 - np.exp(-1.75 * col)
    img = np.zeros((N * N, 4))
    img[idx, :3] = col.clip(0, 1)
    img[idx, 3] = 1
    img = img.reshape(N, N, 4)
    # premultiplied 2x2 downsample for clean edges
    pm = img.copy(); pm[..., :3] *= pm[..., 3:4]
    pm = pm.reshape(SIZE, SS, SIZE, SS, 4).mean((1, 3))
    a = pm[..., 3:4]
    rgb = np.where(a > 0, pm[..., :3] / np.maximum(a, 1e-6), 0)
    out = Image.fromarray((np.dstack([rgb, a]) * 255).round().astype('uint8'), 'RGBA')
    bb = out.getchannel('A').getbbox()
    out = out.crop(bb)
    side = max(out.size) + 32
    sq = Image.new('RGBA', (side, side), (0, 0, 0, 0))
    sq.paste(out, ((side - out.width) // 2, (side - out.height) // 2))
    sq = sq.resize((400, 400), Image.LANCZOS)
    sq.save(os.path.join(OUT, name + '.webp'), 'WEBP', quality=88, method=6)
    sq.save(os.path.join(OUT, name + '.png'))
    print('rendered', name)


JOBS = {
    'obj-ring': (sd_ring, mat_ring, (52, 20, -24), 1.05),
    'obj-globe': (sd_globe, mat_globe, (18, -28, -14), 0.95),
    'obj-ribbon': (sd_ribbon, mat_ribbon, (64, 18, -30), 1.05),
    'obj-panel': (sd_panel, mat_panel, (38, -32, 12), 1.0),
    'obj-battery': (sd_battery, mat_battery, (16, -20, -12), 0.92),
}
if __name__ == '__main__':
    only = sys.argv[3:] or JOBS
    for k in only:
        render(k, *JOBS[k])
