"""Playwright QA: console errors, failed requests, overflow, no-JS render, mobile menu, screenshots.

    python _src/tools/qa_pw.py            (site served on 127.0.0.1:5500)

Screenshots land in _src/.shots/pw/<page>-<w>.png (full page, #shot reveals everything).
"""
import pathlib
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:5500/'
PAGES = ['index', 'about', 'services', 'solutions', 'projects', 'contact']
OUT = pathlib.Path(__file__).resolve().parents[1] / '.shots' / 'pw'
OUT.mkdir(parents=True, exist_ok=True)
IGNORE = ('google.com', 'gstatic.com', 'googleapis.com')

with sync_playwright() as p:
    b = p.chromium.launch()
    for w, h, mobile in [(1280, 800, False), (390, 844, True)]:
        ctx = b.new_context(viewport={'width': w, 'height': h}, is_mobile=mobile, has_touch=mobile, device_scale_factor=1)
        for name in PAGES:
            pg = ctx.new_page()
            errs, fails = [], []
            pg.on('console', lambda m: m.type == 'error' and errs.append(m.text))
            pg.on('pageerror', lambda e: errs.append(str(e)))
            pg.on('requestfailed', lambda r: not any(s in r.url for s in IGNORE) and fails.append(r.url))
            pg.on('response', lambda r: r.status >= 400 and not any(s in r.url for s in IGNORE) and fails.append(f'{r.status} {r.url}'))
            pg.goto(f'{BASE}{name}.html#shot', wait_until='networkidle')
            pg.wait_for_timeout(1800)
            ov = pg.evaluate('document.documentElement.scrollWidth - document.documentElement.clientWidth')
            pg.screenshot(path=str(OUT / f'{name}-{w}.png'), full_page=True)
            print(f'{name:10} {w:5}  overflow={ov}  errors={errs}  failed={fails}')
            pg.close()
        if mobile:
            pg = ctx.new_page()
            pg.goto(BASE + 'index.html', wait_until='networkidle'); pg.wait_for_timeout(3000)
            pg.click('[aria-controls=menu]')
            pg.wait_for_timeout(900)
            lock = pg.evaluate('getComputedStyle(document.body).overflow + "/" + getComputedStyle(document.documentElement).overflow')
            pg.screenshot(path=str(OUT / 'menu-open.png'))
            pg.keyboard.press('Escape'); pg.wait_for_timeout(700)
            still = pg.evaluate('document.documentElement.classList.contains("menu-open") || document.body.classList.contains("menu-open")')
            print(f'mobile menu: scroll lock={lock}  open after Escape={still}')
            pg.close()
        ctx.close()
    # JavaScript disabled: every reveal must still be visible
    ctx = b.new_context(viewport={'width': 1280, 'height': 800}, java_script_enabled=False)
    for name in PAGES:
        pg = ctx.new_page(); pg.goto(f'{BASE}{name}.html', wait_until='load')
        hidden = pg.evaluate('''[...document.querySelectorAll('[data-reveal],[data-clip],.preloader,h1,h2')].filter(e => {
            const s = getComputedStyle(e); return s.display !== 'none' && (+s.opacity < .5 || s.visibility === 'hidden' || (e.classList.contains('preloader') && s.display !== 'none'));
        }).length''')
        print(f'no-js {name:10} hidden elements={hidden}')
        if name == 'index': pg.screenshot(path=str(OUT / 'nojs-index.png'))
        pg.close()
    b.close()
