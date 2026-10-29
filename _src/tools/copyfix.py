"""One-off copy pass: remove dash characters, hollow superlatives and fragment-pair headings."""
import pathlib, re
ROOT = pathlib.Path(__file__).resolve().parents[2]
R = [
  ('About Sunchoice Energy — Zimbabwean', 'About Sunchoice Energy | Zimbabwean'),
  ('Contact Sunchoice Energy — get', 'Contact Sunchoice Energy | Get'),
  ('Sunchoice Energy — Solar power', 'Sunchoice Energy | Solar power'),
  ('Our work — solar projects', 'Our work | Solar projects'),
  ('Solar services — residential', 'Solar services: residential'),
  ('Typical solar systems — 1, 3', 'Typical solar systems: 1, 3'),
  ('20–25 year', '20 to 25 year'),
  ('Monday – Friday', 'Monday to Friday'), ('9am – 5pm', '9am to 5pm'), ('10am – 3pm', '10am to 3pm'),
  ('Mon–Fri 9am–5pm · Sat 10am–3pm', 'Mon to Fri 9am to 5pm, Sat 10am to 3pm'),
  ('Mon–Fri 9–5 · Sat 10–3', 'Mon to Fri 9 to 5, Sat 10 to 3'),
  ('Sep–Oct', 'Sep and Oct'),
  ('revolutionising the way people harness and use solar power, one roof at a time.',
   'putting dependable solar power on Zimbabwean roofs, one installation at a time.'),
  ('with a comprehensive range of products and services tailored to your energy needs, from',
   'sized to how you actually use power, from'),
  ('so you get cutting-edge, reliable systems.', 'so the kit on your roof is current and dependable.'),
  ('<h3>Comprehensive services</h3>', '<h3>End-to-end service</h3>'),
  ('Phocos is a renowned manufacturer of high-quality solar power electronics',
   'Phocos is a German manufacturer of solar power electronics'),
  ('so you benefit from state-of-the-art technology installed to the manufacturer\'s own standards.',
   'so your system is installed to the manufacturer\'s own standards.'),
  ('A seamless solar journey.', 'From first call to switch-on.'),
  ('Robust, weather-proof wiring', 'Weather-proof wiring and mounts'),
  ('A robust system for large properties', 'A heavier system for large properties'),
  ('<span class="tone-muted">We design it bespoke.</span>', '<span class="tone-muted">We design it from scratch.</span>'),
  ('Join the solar revolution with Sunchoice Energy. Tell us', 'Tell us'),
  ('Founded in Zimbabwe. <span class="tone-sun">Built for its sun.</span>',
   'A Zimbabwean company <span class="tone-sun">built around local sun.</span>'),
  ('Four parts, one system. <span class="tone-sun">Engineered to work as one.</span>',
   'Four parts that work <span class="tone-sun">as one system.</span>'),
  ('Solar for every roof, <span class="tone-muted">every budget, every use.</span>',
   'Solar for homes, businesses <span class="tone-muted">and places to unwind.</span>'),
  ('data-split>Real roofs. Real results.</h2>', 'data-split>Recent roofs we have powered.</h2>'),
  ('<h1 data-split>Real roofs. Real results.</h1>', '<h1 data-split>Roofs we have put to work.</h1>'),
  ('Three starting points. <span class="tone-muted">Endless configurations.</span>',
   'Three starting points <span class="tone-muted">you can build on.</span>'),
  ('Harare-based. <span class="tone-muted">Nationwide reach.</span>',
   'Based in Harare, <span class="tone-muted">working nationwide.</span>'),
  ('Sunchoice Energy — interactions.', 'Sunchoice Energy: interactions.'),
  ('Charts — hand-built SVG', 'Charts: hand-built SVG'),
  ("'Quotation request — '", "'Quotation request: '"),
]
files = list((ROOT/'_src/pages').glob('*.html')) + list((ROOT/'_src/partials').glob('*.html')) + [ROOT/'assets/js/main.js']
used = set()
for f in files:
    s = o = f.read_text(encoding='utf-8')
    for a, b in R:
        if a in s: used.add(a); s = s.replace(a, b)
    if s != o: f.write_text(s, encoding='utf-8'); print('updated', f.name)
for a, _ in R:
    if a not in used: print('UNUSED:', a)
