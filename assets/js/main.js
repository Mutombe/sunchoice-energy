/* Sunchoice Energy: interactions. Vanilla JS, no dependencies. */
(() => {
  'use strict';
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const touch = matchMedia('(hover: none)').matches;
  const svgNS = 'http://www.w3.org/2000/svg';
  const el = (tag, attrs = {}, parent) => {
    const n = document.createElementNS(svgNS, tag);
    for (const k in attrs) n.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(n);
    return n;
  };

  /* ---------- preloader ---------- */
  const pre = $('.preloader');
  const done = () => pre && pre.classList.add('is-done');
  if (document.readyState === 'complete') setTimeout(done, 200);
  else addEventListener('load', () => setTimeout(done, 250));
  setTimeout(done, 2600); // never block the page for long

  $$('[data-year]').forEach(n => (n.textContent = new Date().getFullYear()));

  /* ---------- split headings into word lines ---------- */
  $$('[data-split]').forEach(h => {
    let i = 0;
    const frag = document.createDocumentFragment();
    const wrap = (text, cls) => {
      text.split(/(\s+)/).forEach(part => {
        if (!part) return;
        if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
        const outer = document.createElement('span');
        outer.className = 'split-line';
        outer.style.display = 'inline-block';
        const inner = document.createElement('span');
        if (cls) inner.className = cls;
        inner.style.setProperty('--i', i++);
        inner.textContent = part;
        outer.appendChild(inner);
        frag.appendChild(outer);
      });
    };
    [...h.childNodes].forEach(n => {
      if (n.nodeType === 3) wrap(n.textContent);
      else if (n.nodeType === 1 && n.tagName === 'BR') frag.appendChild(n.cloneNode());
      else if (n.nodeType === 1) wrap(n.textContent, n.className);
    });
    h.setAttribute('aria-label', h.textContent.replace(/\s+/g, ' ').trim());
    h.textContent = '';
    h.appendChild(frag);
    $$('.split-line', h).forEach(s => s.setAttribute('aria-hidden', 'true'));
  });

  /* ---------- reveal on scroll ---------- */
  const io = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-in');
      e.target.dispatchEvent(new CustomEvent('reveal'));
      io.unobserve(e.target);
    });
  }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
  $$('[data-reveal],[data-clip],[data-split],.step,.sys,.timeline li,.chart,[data-map]').forEach(n => io.observe(n));
  // fast flicks / End key can skip IO callbacks: sweep anything already scrolled past
  let sweepQ = 0;
  const sweep = () => { sweepQ = 0; $$('[data-reveal]:not(.is-in),[data-clip]:not(.is-in),[data-split]:not(.is-in)').forEach(n => { if (n.getBoundingClientRect().top < innerHeight) { n.classList.add('is-in'); n.dispatchEvent(new CustomEvent('reveal')); io.unobserve(n); } }); };
  addEventListener('scroll', () => { if (!sweepQ) sweepQ = setTimeout(sweep, 180); }, { passive: true });
  window.__scReady = true; // reveal system is live; base.html falls back to .no-js otherwise
  // #shot reveals everything at once (for full-page screenshots / QA)
  if (location.hash === '#shot') $$('[data-reveal],[data-clip],[data-split],.step,.sys,.timeline li,.chart,[data-map]').forEach(n => { n.classList.add('is-in'); n.dispatchEvent(new CustomEvent('reveal')); });
  // anything already on screen at load (e.g. hero) reveals right away
  requestAnimationFrame(() => $$('.hero [data-reveal], .hero [data-split], .page-hero [data-reveal], .page-hero [data-split]').forEach(n => setTimeout(() => n.classList.add('is-in'), 350)));

  /* ---------- header: stick + hide on scroll down ---------- */
  const header = $('[data-header]');
  let lastY = scrollY;
  const onScroll = () => {
    const y = scrollY;
    if (header) {
      header.classList.toggle('is-stuck', y > 140);
      header.classList.toggle('is-hidden', y > 600 && y > lastY && !document.body.classList.contains('menu-open'));
    }
    lastY = y;
  };
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- mobile menu ---------- */
  const toggle = $('[data-menu-toggle]');
  const menu = $('#menu');
  const setMenu = open => {
    document.body.classList.toggle('menu-open', open);
    toggle.setAttribute('aria-expanded', open);
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.setAttribute('aria-hidden', !open);
  };
  toggle && toggle.addEventListener('click', () => setMenu(!document.body.classList.contains('menu-open')));
  menu && $$('a', menu).forEach(a => a.addEventListener('click', () => setMenu(false)));
  addEventListener('keydown', e => e.key === 'Escape' && document.body.classList.contains('menu-open') && setMenu(false));

  /* ---------- hero slider ---------- */
  const hero = $('[data-hero]');
  if (hero) {
    const slides = $$('.hero__slide', hero);
    const bars = $$('.mission__progress span', hero);
    const copy = [
      { t: 'Our Mission', p: 'Reliable, affordable solar for every Zimbabwean home and business.', h: 'about.html' },
      { t: 'Residential Solar', p: 'Hybrid systems that keep the fridge and pump running.', h: 'services.html#residential' },
      { t: 'Commercial Plants', p: 'Whole-roof plants that cut running costs for factories and offices.', h: 'services.html#commercial' },
    ];
    const T = $('[data-hero-title]', hero), P = $('[data-hero-text]', hero), L = $('[data-hero-link]', hero);
    const DUR = 7000;
    let idx = 0, timer;
    const go = n => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((s, i) => s.classList.toggle('is-active', i === idx));
      bars.forEach((b, i) => { b.classList.remove('is-active'); b.classList.toggle('is-done', i < idx); void b.offsetWidth; });
      bars[idx].classList.add('is-active');
      P.style.opacity = 0;
      setTimeout(() => { T.textContent = copy[idx].t; P.textContent = copy[idx].p; L.href = copy[idx].h; P.style.opacity = 1; }, 300);
      clearTimeout(timer);
      if (!reduce) timer = setTimeout(() => go(idx + 1), DUR);
    };
    hero.style.setProperty('--dur', DUR + 'ms');
    $('[data-hero-next]', hero).addEventListener('click', () => go(idx + 1));
    $('[data-hero-prev]', hero).addEventListener('click', () => go(idx - 1));
    if (!reduce) timer = setTimeout(() => go(1), DUR);
    else bars[0].classList.add('is-done');
  }

  /* ---------- tabs ---------- */
  $$('[data-tabs]').forEach(list => {
    const tabs = $$('[role=tab]', list);
    const select = t => {
      tabs.forEach(x => {
        const on = x === t;
        x.setAttribute('aria-selected', on);
        x.tabIndex = on ? 0 : -1;
        const panel = document.getElementById(x.getAttribute('aria-controls'));
        panel.hidden = !on;
        if (on) { panel.classList.remove('is-swapping'); void panel.offsetWidth; panel.classList.add('is-swapping'); }
      });
    };
    tabs.forEach((t, i) => {
      t.addEventListener('click', () => select(t));
      t.addEventListener('keydown', e => {
        const d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        const n = tabs[(i + d + tabs.length) % tabs.length];
        n.focus(); select(n);
      });
    });
  });

  /* ---------- statement: words light up as you scroll ---------- */
  $$('[data-words]').forEach(p => {
    const words = p.textContent.trim().split(/\s+/);
    p.innerHTML = words.map(w => `<span class="w">${w}</span>`).join(' ');
    const spans = $$('.w', p);
    const update = () => {
      const r = p.getBoundingClientRect();
      const prog = Math.min(1, Math.max(0, (innerHeight * 0.85 - r.top) / (r.height + innerHeight * 0.35)));
      const n = Math.round(prog * spans.length);
      spans.forEach((s, i) => s.classList.toggle('on', i < n));
    };
    if (reduce) spans.forEach(s => s.classList.add('on'));
    else { addEventListener('scroll', update, { passive: true }); update(); }
  });

  /* ---------- counters ---------- */
  const fmt = (v, el) => {
    const dec = +el.dataset.decimals || 0;
    let s = v.toFixed(dec);
    if (el.dataset.format === 'comma') s = Number(s).toLocaleString('en-US');
    return s;
  };
  $$('[data-count]').forEach(n => {
    const to = +(n.dataset.to || n.dataset.count);
    // the HTML carries the final figure (no-JS safe); only zero it when we will animate it
    if (reduce || location.hash === '#shot') return;
    n.textContent = fmt(0, n);
    const run = () => {
      if (reduce) { n.textContent = fmt(to, n); return; }
      const t0 = performance.now(), D = 1800;
      const tick = t => {
        const k = Math.min(1, (t - t0) / D);
        n.textContent = fmt(to * (1 - Math.pow(1 - k, 4)), n);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const o = new IntersectionObserver(([e]) => { if (e.isIntersecting) { run(); o.disconnect(); } }, { threshold: 0.6 });
    o.observe(n);
  });

  /* ---------- touch: mirror hover while card crosses the middle of the screen ---------- */
  if (touch) {
    const mid = new IntersectionObserver(es => es.forEach(e => e.target.classList.toggle('is-inview', e.isIntersecting)), { rootMargin: '-38% 0px -38% 0px' });
    $$('[data-inview]').forEach(n => mid.observe(n));
  }

  /* ---------- glass sheen follows the cursor ---------- */
  if (!touch) {
    document.addEventListener('pointermove', e => {
      const g = e.target.closest && e.target.closest('.glass');
      if (!g) return;
      const r = g.getBoundingClientRect();
      g.style.setProperty('--mx', e.clientX - r.left + 'px');
      g.style.setProperty('--my', e.clientY - r.top + 'px');
    }, { passive: true });
  }

  /* ---------- parallax ---------- */
  const par = $$('[data-parallax]');
  if (par.length && !reduce) {
    const upd = () => par.forEach(n => {
      const r = n.parentElement.getBoundingClientRect();
      if (r.bottom < 0 || r.top > innerHeight) return;
      const c = r.top + r.height / 2 - innerHeight / 2;
      const lim = r.height * 0.09; // stays inside the 10% overscan
      const y = Math.max(-lim, Math.min(lim, -c * +n.dataset.parallax));
      n.style.transform = `translate3d(0, ${y.toFixed(1)}px, 0)`;
    });
    addEventListener('scroll', upd, { passive: true }); upd();
  }

  /* ---------- project rail ---------- */
  $$('[data-rail]').forEach(rail => {
    const sec = rail.closest('section');
    const bar = $('[data-rail-bar]', sec);
    const step = () => (rail.querySelector('.proj')?.offsetWidth || 400) + 14;
    $('[data-rail-prev]', sec)?.addEventListener('click', () => rail.scrollBy({ left: -step(), behavior: 'smooth' }));
    $('[data-rail-next]', sec)?.addEventListener('click', () => rail.scrollBy({ left: step(), behavior: 'smooth' }));
    const prog = () => {
      if (!bar) return;
      const max = rail.scrollWidth - rail.clientWidth;
      const vis = rail.clientWidth / rail.scrollWidth;
      bar.style.width = vis * 100 + '%';
      bar.style.transform = `translateX(${max ? (rail.scrollLeft / max) * (1 / vis - 1) * 100 : 0}%)`;
    };
    rail.addEventListener('scroll', prog, { passive: true }); addEventListener('resize', prog); prog();
    // drag to scroll with a mouse
    let down = false, sx = 0, sl = 0, moved = false;
    rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; });
    addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) { moved = true; rail.classList.add('is-drag'); } rail.scrollLeft = sl - dx; });
    addEventListener('pointerup', () => { down = false; rail.classList.remove('is-drag'); });
    rail.addEventListener('click', e => moved && e.preventDefault(), true);
  });

  /* ---------- Zimbabwe map ---------- */
  const MAPINFO = {
    'Harare': ['Harare · Head office', '18 General Booth, Braeside. Design, stores and our installation crews all start here.'],
    'Kariba': ['Lake Kariba', 'Silent off-grid power for houseboats, lodges and fishing camps.'],
    'Bulawayo': ['Bulawayo & Matabeleland', 'Commercial roofs and family homes in the City of Kings and beyond.'],
    'Mutare': ['Mutare & Eastern Highlands', 'Systems for farms, estates and homes in the east.'],
    'Victoria Falls': ['Victoria Falls & Hwange', 'Hospitality and tourism sites where generator noise is not an option.'],
    'Gweru': ['Gweru · Midlands', 'Serviced from Harare for installs and maintenance.'],
    'Masvingo': ['Masvingo', 'Serviced from Harare for installs and maintenance.'],
    'Chinhoyi': ['Chinhoyi', 'A short drive from our Harare base.'],
    'Hwange': ['Hwange', 'Lodges and camps around the national park.'],
    'Beitbridge': ['Beitbridge', 'Serviced from Harare on request.'],
  };
  $$('[data-map]').forEach(stage => {
    const pins = $$('.pin', stage);
    const T = $('[data-map-title]', stage), X = $('[data-map-text]', stage);
    const items = $$('[data-regions] li');
    const dots = $$('.zim-dots circle', stage);
    dots.forEach(d => (d.style.animationDelay = (+d.getAttribute('cy') / 699 * 0.6 + Math.random() * 0.25).toFixed(2) + 's'));
    pins.forEach((p, i) => p.style.setProperty('--i', i));
    const pick = city => {
      const info = MAPINFO[city]; if (!info) return;
      T.textContent = info[0]; X.textContent = info[1];
      pins.forEach(p => p.classList.toggle('is-active', p.dataset.city === city));
      items.forEach(li => li.classList.toggle('is-active', li.dataset.city === city));
      const pin = pins.find(p => p.dataset.city === city);
      if (!pin) return;
      const [, x, y] = pin.getAttribute('transform').match(/translate\(([\d.]+) ([\d.]+)\)/).map(Number);
      dots.forEach(d => { const dx = d.getAttribute('cx') - x, dy = d.getAttribute('cy') - y; d.classList.toggle('lit', dx * dx + dy * dy < 46 * 46); });
    };
    pins.forEach(p => { p.addEventListener('mouseenter', () => pick(p.dataset.city)); p.addEventListener('click', () => pick(p.dataset.city)); });
    items.forEach(li => li.addEventListener('mouseenter', () => pick(li.dataset.city)));
    stage.addEventListener('reveal', () => setTimeout(() => pick('Harare'), 1100));
  });

  /* ======================================================================
     Charts: hand-built SVG, single y-axis, crosshair + tooltip, table view
     ====================================================================== */
  const C = { solar: '#d9750a', load: '#1f5aa8', ink: '#12161f' };
  const niceMax = v => { const p = Math.pow(10, Math.floor(Math.log10(v))); return Math.ceil(v / p * 2) / 2 * p; };
  const hh = h => `${String(Math.floor(h)).padStart(2, '0')}:${h % 1 ? '30' : '00'}`;

  function tooltip(host) {
    let t = $('.tip', host);
    if (!t) { t = document.createElement('div'); t.className = 'tip'; t.setAttribute('role', 'status'); host.appendChild(t); }
    return {
      show(html, x, y) {
        t.innerHTML = html; t.classList.add('is-on');
        const w = t.offsetWidth, W = host.clientWidth;
        t.style.transform = `translate(${Math.min(Math.max(x - w / 2, 0), W - w)}px, ${Math.max(y - t.offsetHeight - 14, -10)}px)`;
      },
      hide() { t.classList.remove('is-on'); },
    };
  }

  function table(target, head, rows) {
    if (!target) return;
    target.innerHTML = `<table><thead><tr>${head.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(c => `<td>${c}</td>`).join('')}</tr>`).join('')}</tbody></table>`;
  }

  /* --- day profile: solar area vs demand line --- */
  function dayData(season) {
    const S = season === 'winter' ? { rise: 6.6, set: 17.6, peak: 3.7, heat: 0.45 } : { rise: 5.6, set: 18.6, peak: 4.3, heat: 0 };
    const g = (h, m, s, a) => a * Math.exp(-((h - m) ** 2) / (2 * s * s));
    const pts = [];
    for (let h = 0; h <= 24; h += 0.5) {
      const k = (h - S.rise) / (S.set - S.rise);
      const solar = k > 0 && k < 1 ? S.peak * Math.pow(Math.sin(Math.PI * k), 1.4) : 0;
      const load = 0.42 + g(h, 6.6, 0.9, 1.5 + S.heat) + g(h, 13, 2.6, 0.55) + g(h, 19.2, 1.5, 2.1 + S.heat * 1.4);
      pts.push({ h, solar: +solar.toFixed(2), load: +load.toFixed(2) });
    }
    return pts;
  }

  function drawDay(host, season) {
    const data = dayData(season);
    const W = 640, H = 330, m = { t: 16, r: 14, b: 30, l: 36 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const ymax = 5;
    const X = h => m.l + (h / 24) * iw, Y = v => m.t + ih - (v / ymax) * ih;
    host.innerHTML = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Line chart of solar generation and household demand over 24 hours in ${season}` }, host);
    const grid = el('g', { class: 'grid' }, svg), axis = el('g', { class: 'axis' }, svg);
    for (let v = 0; v <= ymax; v += 1) {
      if (v) el('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) }, grid);
      el('text', { x: m.l - 10, y: Y(v) + 4, 'text-anchor': 'end' }, axis).textContent = v + (v === ymax ? ' kW' : '');
    }
    for (let h = 0; h <= 24; h += 4) el('text', { x: X(h), y: H - 8, 'text-anchor': 'middle' }, axis).textContent = hh(h % 24 === 0 && h ? 24 : h).replace('24:00', '24:00');
    el('line', { class: 'baseline', x1: m.l, x2: W - m.r, y1: Y(0), y2: Y(0) }, svg);
    const defs = el('defs', {}, svg);
    const lg = el('linearGradient', { id: 'solarFill', x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    el('stop', { offset: 0, 'stop-color': C.solar, 'stop-opacity': 0.42 }, lg);
    el('stop', { offset: 1, 'stop-color': C.solar, 'stop-opacity': 0.04 }, lg);
    const path = key => data.map((d, i) => `${i ? 'L' : 'M'}${X(d.h).toFixed(1)} ${Y(d[key]).toFixed(1)}`).join('');
    el('path', { class: 'area', d: `${path('solar')}L${X(24)} ${Y(0)}L${X(0)} ${Y(0)}Z`, fill: 'url(#solarFill)' }, svg);
    const sl = el('path', { class: 'line draw', d: path('solar'), stroke: C.solar }, svg);
    const ll = el('path', { class: 'line draw', d: path('load'), stroke: C.load }, svg);
    [sl, ll].forEach(p => p.style.setProperty('--len', Math.ceil(p.getTotalLength())));
    // selective direct labels
    const pk = data.reduce((a, b) => (b.solar > a.solar ? b : a));
    el('text', { class: 'label', x: X(pk.h), y: Y(pk.solar) - 10, 'text-anchor': 'middle' }, svg).textContent = `Solar · ${pk.solar.toFixed(1)} kW peak`;
    const ev = data.reduce((a, b) => (b.h > 16 && b.load > a.load ? b : a), data[0]);
    el('text', { class: 'label', x: X(ev.h) + 8, y: Y(ev.load) - 10, 'text-anchor': 'start' }, svg).textContent = 'Evening demand';
    // hover layer
    const xh = el('line', { class: 'xhair', y1: m.t, y2: Y(0) }, svg);
    const m1 = el('circle', { class: 'marker', r: 5, fill: C.solar }, svg), m2 = el('circle', { class: 'marker', r: 5, fill: C.load }, svg);
    const hit = el('rect', { class: 'hit', x: m.l, y: m.t, width: iw, height: ih }, svg);
    const tip = tooltip(host);
    const move = e => {
      const r = svg.getBoundingClientRect();
      const px = ((e.clientX - r.left) / r.width) * W;
      const h = Math.max(0, Math.min(24, Math.round(((px - m.l) / iw) * 48) / 2));
      const d = data[h * 2];
      xh.setAttribute('x1', X(h)); xh.setAttribute('x2', X(h));
      m1.setAttribute('cx', X(h)); m1.setAttribute('cy', Y(d.solar)); m2.setAttribute('cx', X(h)); m2.setAttribute('cy', Y(d.load));
      host.classList.add('is-hover');
      const net = d.solar - d.load;
      tip.show(`<b>${hh(h)}</b><div class="row"><span><i style="--c:${C.solar}"></i>Solar</span>${d.solar.toFixed(2)} kW</div><div class="row"><span><i style="--c:${C.load}"></i>Demand</span>${d.load.toFixed(2)} kW</div><div class="row" style="margin-top:4px;color:#fff"><span>${net >= 0 ? 'Charging battery' : 'From battery / grid'}</span>${Math.abs(net).toFixed(2)} kW</div>`, (X(h) / W) * r.width, (Math.min(Y(d.solar), Y(d.load)) / H) * r.height);
    };
    hit.addEventListener('pointermove', move);
    hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { host.classList.remove('is-hover'); tip.hide(); });
    // kpis
    const sum = k => data.reduce((a, d) => a + d[k], 0) * 0.5;
    const gen = sum('solar'), use = sum('load');
    const set = (k, v) => { const n = $(`[data-kpi="${k}"]`); if (n) n.textContent = v; };
    set('gen', gen.toFixed(1) + ' kWh'); set('use', use.toFixed(1) + ' kWh');
    set('self', Math.min(100, Math.round((gen * 0.9) / use * 100)) + '%'); set('peak', pk.solar.toFixed(1) + ' kW');
    table($('[data-chart-table="day"]'), ['Time', 'Solar (kW)', 'Demand (kW)'], data.filter(d => d.h % 2 === 0).map(d => [hh(d.h), d.solar.toFixed(2), d.load.toFixed(2)]));
  }

  $$('[data-chart="day"]').forEach(host => {
    let season = 'summer';
    const render = () => { drawDay(host, season); if (host.classList.contains('is-in')) { host.classList.remove('is-in'); void host.offsetWidth; requestAnimationFrame(() => host.classList.add('is-in')); } };
    render();
    $$('[data-season]').forEach(b => b.addEventListener('click', () => {
      season = b.dataset.season;
      $$('[data-season]').forEach(x => x.setAttribute('aria-pressed', x === b));
      render();
    }));
  });

  /* --- monthly generation bars (single series) --- */
  const PSH = [5.6, 5.5, 5.7, 5.6, 5.4, 5.0, 5.3, 6.0, 6.6, 6.7, 6.1, 5.5]; // approx. Harare peak-sun-hours
  const DAYS = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function drawMonthly(host, kwp) {
    const data = PSH.map((p, i) => ({ m: MON[i], v: Math.round(kwp * p * DAYS[i] * 0.78) }));
    const W = 640, H = 300, m = { t: 26, r: 8, b: 30, l: 44 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const ymax = niceMax(Math.max(...data.map(d => d.v)) * 1.08);
    const Y = v => m.t + ih - (v / ymax) * ih;
    const bw = iw / 12, gap = 6;
    host.innerHTML = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Bar chart of estimated monthly solar generation for a ${kwp} kWp array` }, host);
    const grid = el('g', { class: 'grid' }, svg), axis = el('g', { class: 'axis' }, svg);
    for (let i = 0; i <= 4; i++) {
      const v = (ymax / 4) * i;
      if (i) el('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) }, grid);
      el('text', { x: m.l - 10, y: Y(v) + 4, 'text-anchor': 'end' }, axis).textContent = Math.round(v) + (i === 4 ? '' : '');
    }
    el('text', { x: m.l - 10, y: m.t - 12, 'text-anchor': 'end' }, axis).textContent = 'kWh';
    const tip = tooltip(host);
    const best = data.reduce((a, b) => (b.v > a.v ? b : a));
    data.forEach((d, i) => {
      const x = m.l + i * bw + gap / 2, y = Y(d.v), h = Y(0) - y, w = bw - gap;
      const r = Math.min(4, w / 2);
      const bar = el('path', { class: 'bar', d: `M${x} ${Y(0)}V${y + r}Q${x} ${y} ${x + r} ${y}H${x + w - r}Q${x + w} ${y} ${x + w} ${y + r}V${Y(0)}Z`, fill: d === best ? C.solar : '#f0a65a', style: `transition-delay:${i * 0.05}s` }, svg);
      el('text', { x: x + w / 2, y: H - 8, 'text-anchor': 'middle' }, axis).textContent = d.m;
      const hit = el('rect', { class: 'hit', x: m.l + i * bw, y: m.t, width: bw, height: ih }, svg);
      const show = () => {
        bar.classList.add('is-hot');
        const rr = svg.getBoundingClientRect();
        tip.show(`<b>${d.m}</b><div class="row"><span><i style="--c:${C.solar}"></i>Generation</span>${d.v.toLocaleString()} kWh</div><div class="row"><span>Per day</span>${(d.v / DAYS[i]).toFixed(1)} kWh</div>`, ((x + w / 2) / W) * rr.width, (y / H) * rr.height);
      };
      hit.addEventListener('pointerenter', show); hit.addEventListener('pointerdown', show);
      hit.addEventListener('pointerleave', () => { bar.classList.remove('is-hot'); tip.hide(); });
    });
    el('line', { class: 'baseline', x1: m.l, x2: W - m.r, y1: Y(0), y2: Y(0) }, svg);
    el('text', { class: 'label', x: m.l + MON.indexOf(best.m) * bw + bw / 2, y: Y(best.v) - 8, 'text-anchor': 'middle' }, svg).textContent = best.v.toLocaleString();
    const total = data.reduce((a, d) => a + d.v, 0);
    const t = $('[data-monthly-total]'); if (t) t.textContent = total.toLocaleString() + ' kWh';
    table($('[data-chart-table="monthly"]'), ['Month', 'kWh'], data.map(d => [d.m, d.v.toLocaleString()]));
  }
  $$('[data-chart="monthly"]').forEach(host => {
    let kwp = 5.5;
    const render = () => { drawMonthly(host, kwp); if (host.classList.contains('is-in')) { host.classList.remove('is-in'); void host.offsetWidth; requestAnimationFrame(() => host.classList.add('is-in')); } };
    render();
    $$('[data-kwp]').forEach(b => b.addEventListener('click', () => {
      kwp = +b.dataset.kwp;
      $$('[data-kwp]').forEach(x => x.setAttribute('aria-pressed', x === b));
      render();
    }));
  });

  /* --- payback: cumulative net position (single series line) --- */
  function drawPayback(host, cost, monthly, rise) {
    const years = 12, data = [];
    let cum = -cost;
    data.push({ m: 0, v: cum });
    for (let i = 1; i <= years * 12; i++) { cum += monthly * Math.pow(1 + rise / 100, Math.floor((i - 1) / 12)); data.push({ m: i, v: cum }); }
    const W = 640, H = 320, m = { t: 20, r: 16, b: 30, l: 58 };
    const iw = W - m.l - m.r, ih = H - m.t - m.b;
    const lo = Math.min(...data.map(d => d.v)), hi = Math.max(0, ...data.map(d => d.v));
    const tick = niceMax(Math.max(hi - lo, 1) / 4);
    const yMin = Math.floor(lo / tick) * tick, yMax = Math.max(Math.ceil(hi / tick) * tick, yMin + tick);
    const X = i => m.l + (i / (years * 12)) * iw, Y = v => m.t + ih - ((v - yMin) / (yMax - yMin)) * ih;
    host.innerHTML = '';
    const svg = el('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': 'Line chart of cumulative savings minus system cost over 12 years' }, host);
    const grid = el('g', { class: 'grid' }, svg), axis = el('g', { class: 'axis' }, svg);
    for (let v = yMin; v <= yMax + 1e-6; v += tick) {
      el('line', { x1: m.l, x2: W - m.r, y1: Y(v), y2: Y(v) }, grid);
      el('text', { x: m.l - 10, y: Y(v) + 4, 'text-anchor': 'end' }, axis).textContent = (v < 0 ? '−$' : '$') + Math.abs(Math.round(v / 1000)) + 'k';
    }
    for (let y = 0; y <= years; y += 2) el('text', { x: X(y * 12), y: H - 8, 'text-anchor': 'middle' }, axis).textContent = 'Yr ' + y;
    el('line', { x1: m.l, x2: W - m.r, y1: Y(0), y2: Y(0), stroke: C.ink, 'stroke-width': 1, opacity: .35 }, svg);
    const defs = el('defs', {}, svg);
    const clipA = el('clipPath', { id: 'pbPos' }, defs); el('rect', { x: m.l, y: m.t, width: iw, height: Y(0) - m.t }, clipA);
    const d = data.map((p, i) => `${i ? 'L' : 'M'}${X(p.m).toFixed(1)} ${Y(p.v).toFixed(1)}`).join('');
    el('path', { class: 'area', d: `${d}L${X(years * 12)} ${Y(0)}L${X(0)} ${Y(0)}Z`, fill: C.solar, 'fill-opacity': .16, 'clip-path': 'url(#pbPos)' }, svg);
    const line = el('path', { class: 'line draw', d, stroke: C.load }, svg);
    line.style.setProperty('--len', Math.ceil(line.getTotalLength()));
    const be = data.find(p => p.v >= 0);
    const out = $('[data-payback]');
    if (be) {
      el('circle', { cx: X(be.m), cy: Y(0), r: 6, fill: C.solar, stroke: '#fff', 'stroke-width': 2 }, svg);
      el('text', { class: 'label', x: X(be.m), y: Y(0) - 14, 'text-anchor': be.m > years * 9 ? 'end' : 'middle' }, svg).textContent = `Break-even · ${(be.m / 12).toFixed(1)} yrs`;
      if (out) out.textContent = (be.m / 12).toFixed(1) + ' yrs';
    } else if (out) out.textContent = `> ${years} yrs`;
    const tot = $('[data-total12]'); if (tot) tot.textContent = (cum < 0 ? '−$' : '$') + Math.abs(Math.round(cum)).toLocaleString();
    const xh = el('line', { class: 'xhair', y1: m.t, y2: m.t + ih }, svg);
    const mk = el('circle', { class: 'marker', r: 5, fill: C.load }, svg);
    const hit = el('rect', { class: 'hit', x: m.l, y: m.t, width: iw, height: ih }, svg);
    const tip = tooltip(host);
    const move = e => {
      const r = svg.getBoundingClientRect();
      const i = Math.max(0, Math.min(years * 12, Math.round((((e.clientX - r.left) / r.width) * W - m.l) / iw * years * 12)));
      const p = data[i];
      xh.setAttribute('x1', X(i)); xh.setAttribute('x2', X(i)); mk.setAttribute('cx', X(i)); mk.setAttribute('cy', Y(p.v));
      host.classList.add('is-hover');
      tip.show(`<b>Year ${Math.floor(i / 12)}, month ${i % 12}</b><div class="row"><span><i style="--c:${C.load}"></i>Net position</span>${p.v < 0 ? '−' : ''}$${Math.abs(Math.round(p.v)).toLocaleString()}</div>`, (X(i) / W) * r.width, (Y(p.v) / H) * r.height);
    };
    hit.addEventListener('pointermove', move); hit.addEventListener('pointerdown', move);
    hit.addEventListener('pointerleave', () => { host.classList.remove('is-hover'); tip.hide(); });
    table($('[data-chart-table="payback"]'), ['Year', 'Net position (USD)'], data.filter(p => p.m % 12 === 0).map(p => [p.m / 12, Math.round(p.v).toLocaleString()]));
  }
  $$('[data-chart="payback"]').forEach(host => {
    const inputs = $$('[data-pb]');
    const val = k => +$(`[data-pb="${k}"]`).value;
    const render = () => {
      inputs.forEach(i => { const o = $(`[data-pb-out="${i.dataset.pb}"]`); if (o) o.textContent = i.dataset.pb === 'rise' ? i.value + '%' : '$' + (+i.value).toLocaleString(); });
      drawPayback(host, val('cost'), val('monthly'), val('rise'));
      host.classList.add('is-in');
    };
    inputs.forEach(i => i.addEventListener('input', render));
    render(); host.classList.remove('is-in');
  });

  /* ---------- system sizing calculator ---------- */
  const calc = $('[data-calc]');
  if (calc) {
    const rows = $$('.appliance', calc);
    const out = k => $(`[data-calc-out="${k}"]`);
    const SIZES = [1, 3, 5, 8, 10, 15];
    const update = () => {
      let peak = 0, energy = 0, maxW = 0;
      rows.forEach(r => {
        const q = +$('output', r).value, w = +r.dataset.w, h = +r.dataset.h;
        if (!q) return;
        peak += q * w; energy += (q * w * h) / 1000; maxW = Math.max(maxW, w);
      });
      const design = peak ? (maxW + (peak - maxW) * 0.6) / 1000 : 0; // diversity: not everything runs at once
      const need = design / 0.8;
      const kva = SIZES.find(s => s >= need) || 20;
      out('kva').textContent = peak ? kva : 0;
      out('peak').textContent = design.toFixed(1) + ' kW';
      out('energy').textContent = energy.toFixed(1) + ' kWh';
      out('panels').textContent = (energy / (5.5 * 0.75)).toFixed(1) + ' kWp';
      out('battery').textContent = ((energy * 0.6) / 0.8).toFixed(1) + ' kWh';
      out('rec').textContent = !peak ? 'Add the appliances you want to run.' : kva <= 1 ? '1 kVA covers lights, TV, Wi-Fi and laptops.' : kva <= 3 ? 'A 3 kVA system suits a typical home including the fridge and some heavier loads.' : kva <= 5 ? 'A 5 kVA system handles larger homes with pumps, aircon and kitchen loads.' : 'Your load suits a custom commercial-grade configuration. Let us assess it on site.';
      $('[data-calc-gauge]').style.width = Math.min(100, (design / 10) * 100) + '%';
    };
    rows.forEach(r => {
      const o = $('output', r);
      $$('button', r).forEach(b => b.addEventListener('click', () => { o.value = Math.max(0, Math.min(20, +o.value + +b.dataset.step)); o.textContent = o.value; update(); }));
    });
    update();
  }

  /* ---------- projects filter + lightbox ---------- */
  const filters = $$('[data-filter]');
  filters.forEach(f => f.addEventListener('click', () => {
    filters.forEach(x => x.setAttribute('aria-pressed', x === f));
    const k = f.dataset.filter;
    $$('.gallery figure').forEach(fig => fig.classList.toggle('is-hidden', k !== 'all' && fig.dataset.cat !== k));
  }));
  const lb = $('[data-lightbox]');
  if (lb) {
    const img = $('img', lb), cap = $('p', lb), close = $('button', lb);
    let last;
    const open = fig => {
      last = fig;
      const src = $('img', fig);
      img.src = src.currentSrc.replace('-sm.webp', '.webp'); img.alt = src.alt; cap.textContent = $('figcaption b', fig)?.textContent || '';
      lb.classList.add('is-open'); lb.setAttribute('aria-hidden', 'false'); close.focus();
    };
    const shut = () => { lb.classList.remove('is-open'); lb.setAttribute('aria-hidden', 'true'); last && last.focus(); };
    $$('.gallery figure').forEach(f => { f.addEventListener('click', () => open(f)); f.addEventListener('keydown', e => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), open(f))); });
    close.addEventListener('click', shut);
    lb.addEventListener('click', e => e.target === lb && shut());
    addEventListener('keydown', e => e.key === 'Escape' && lb.classList.contains('is-open') && shut());
  }

  /* ---------- forms (no backend yet: hand off to the visitor's mail app) ---------- */
  const quote = $('[data-quote]');
  if (quote) quote.addEventListener('submit', e => {
    e.preventDefault();
    if (!quote.reportValidity()) return;
    const f = new FormData(quote);
    const body = [...f.entries()].map(([k, v]) => `${k}: ${v}`).join('\n');
    location.href = `mailto:info@sunchoice.co.zw?subject=${encodeURIComponent('Quotation request: ' + (f.get('Name') || ''))}&body=${encodeURIComponent(body)}`;
    $('.form-status', quote).textContent = 'Thanks! Your email app should open with your request ready to send.';
  });
  $$('[data-news]').forEach(n => n.addEventListener('submit', e => {
    e.preventDefault();
    const b = $('button', n); b.textContent = 'Subscribed'; b.disabled = true;
  }));

  /* ---------- business hours: highlight today ---------- */
  const today = new Date().getDay();
  $$('[data-hours] [data-day]').forEach(r => {
    const [a, b = a] = r.dataset.day.split('-').map(Number);
    r.classList.toggle('is-today', today >= a && today <= b);
  });

  /* ---------- FAQ: smooth height ---------- */
  $$('[data-faq] details').forEach(d => {
    const s = $('summary', d), a = $('.answer', d);
    s.addEventListener('click', e => {
      if (reduce) return;
      e.preventDefault();
      if (d.open) {
        a.animate([{ height: a.offsetHeight + 'px', opacity: 1 }, { height: '0px', opacity: 0 }], { duration: 450, easing: 'cubic-bezier(.22,.8,.2,1)' }).onfinish = () => (d.open = false);
      } else {
        d.open = true;
        a.animate([{ height: '0px', opacity: 0 }, { height: a.offsetHeight + 'px', opacity: 1 }], { duration: 550, easing: 'cubic-bezier(.22,.8,.2,1)' });
      }
    });
  });
})();
