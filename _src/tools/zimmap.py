"""Builds the dot-matrix Zimbabwe map SVG (partial) from a GeoJSON outline.
Usage: python zimmap.py <ZWE.geo.json> <out.svg>"""
import sys, json, math
geo = json.load(open(sys.argv[1]))
ring = geo['features'][0]['geometry']['coordinates'][0]
K = math.cos(math.radians(19))
LON0, LAT0, S = 25.0, -15.4, 100  # top-left origin, px per degree
P = lambda lon, lat: ((lon - LON0) * K * S, (LAT0 - lat) * S)
pts = [P(*c) for c in ring]
W = round(max(p[0] for p in pts)) + 12; H = round(max(p[1] for p in pts)) + 12

def inside(x, y):
    c = False
    for (x1, y1), (x2, y2) in zip(pts, pts[1:] + pts[:1]):
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: c = not c
    return c

step = 15
dots = []
for j in range(0, H, step):
    for i in range(0, W, step):
        x, y = i + (step / 2 if (j // step) % 2 else 0), j
        if inside(x, y): dots.append(f'<circle cx="{x:.1f}" cy="{y:.1f}" r="3.7"/>')
path = 'M' + ' L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z'
cities = {'Harare': (31.05, -17.83), 'Bulawayo': (28.58, -20.15), 'Mutare': (32.67, -18.97), 'Kariba': (28.80, -16.52),
          'Victoria Falls': (25.84, -17.93), 'Gweru': (29.82, -19.45), 'Masvingo': (30.83, -20.07), 'Chinhoyi': (30.20, -17.36),
          'Hwange': (26.50, -18.36), 'Beitbridge': (30.00, -22.22)}
out = [f'<svg class="zim-map" viewBox="-6 -6 {W} {H}" role="img" aria-label="Map of Zimbabwe showing where Sunchoice Energy works">',
       f'<path class="zim-outline" d="{path}"/>', '<g class="zim-dots">' + ''.join(dots) + '</g>', '<g class="zim-pins">']
for name, (lo, la) in cities.items():
    x, y = P(lo, la)
    out.append(f'<g class="pin{" pin--hq" if name == "Harare" else ""}" data-city="{name}" transform="translate({x:.1f} {y:.1f})">'
               f'<circle class="pin-pulse" r="7"/><circle class="pin-dot" r="5"/><text x="11" y="4">{name}</text></g>')
out.append('</g></svg>')
open(sys.argv[2], 'w').write('\n'.join(out)); print(W, H, len(dots), 'dots')
