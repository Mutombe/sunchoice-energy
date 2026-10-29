# Sunchoice Energy website

Static, dependency-free marketing site for Sunchoice Energy (Harare, Zimbabwe).
Open `index.html` in a browser, or upload the whole folder (minus `_src/`) to any web host.

## Pages
| File | Content |
|---|---|
| `index.html` | Hero slider, tabbed About and bento, 3D "how it works", service cards, glass stats, day-profile chart, process, project rail, Zimbabwe map, partners, FAQ |
| `about.html` | Story, six promises, Phocos certification, journey, team, sustainability |
| `services.html` | Residential, commercial, recreational and maintenance, use cases, hardware, FAQ |
| `solutions.html` | 1/3/5 kVA systems, sizing calculator, monthly generation chart, payback chart |
| `projects.html` | Filterable gallery of real Sunchoice projects with lightbox, map |
| `contact.html` | Quotation form, details, hours, Google map |

## Editing
The root `*.html` files are **generated**. Edit the sources, then rebuild:

```
_src/pages/*.html      page bodies (first line is a JSON meta comment: title, description, nav key)
_src/partials/*.html   header, footer, CTA, partners, service cards, map section, icons
python _src/tools/build.py
```

- Styles: `assets/css/style.css` (brand tokens at the top: orange `#F3921C`, blue `#1A5BA0`, navy `#081325`).
- Behaviour: `assets/js/main.js` (slider, reveals, tabs, counters, charts, map, calculator, lightbox).

## Asset tools (`_src/tools/`)
- `images.py`: converts the raw photo folders into named WebP files (`name.webp` 1800px and `name-sm.webp` 820px) plus monochrome partner logos.
- `logo.py`: builds the colour and white logo, mark and horizontal lockups from the transparent logo.
- `render3d.py`: ray-marches the 3D objects (`obj-panel`, `obj-ribbon`, `obj-battery`, `obj-globe`, `obj-ring`). Poses and scale are in `JOBS` at the bottom. Takes about 4 minutes.
- `zimmap.py`: builds the dot-matrix Zimbabwe map partial from a GeoJSON outline.
- `qa_pw.py`: the main QA run (Playwright). Serve the site on port 5500, then `python _src/tools/qa_pw.py`. It checks every page at 1280 and 390 for console errors, failed requests and horizontal overflow, tests the mobile menu, confirms nothing is hidden with JavaScript off, and saves full-page screenshots to `_src/.shots/pw/`.
- `qa.html` and `qa.sh`: measure the hero against the viewport and count rendered lines for every small text element, so copy that is one line on desktop but wraps on a phone shows up.
- `shot.sh`, `slice.py` and `frame.html`: quick headless screenshots (`#shot` on a URL reveals all animated content at once).
- `copyfix.py`: the record of the copy pass (no dash characters, no hollow superlatives).

## Fonts
Manrope (variable) and Geist Mono are self-hosted from `assets/fonts/`, under the SIL Open Font License (licence files are alongside them). The site makes no Google Fonts requests.

## Copy rules
- No em or en dashes anywhere. Use commas, colons or "to" for ranges.
- No "seamless", "robust", "bespoke", "comprehensive", "tailored", "revolution" and similar.
- Small text keeps to its budget: card bullets about 34 characters, card titles about 26, paragraphs no more than four lines on a phone.

## Before launch
1. **License the iStock photos.** Every `istockphoto-*` source image is a watermarked comp. Buy the licences, run `images.py` on the clean files, and the site updates automatically because the filenames stay the same.
2. **Phone number.** The old site only had placeholder numbers, so none is shown. Add the real number and WhatsApp to `_src/partials/header.html`, `footer.html` and `cta.html`, and to `contact.html`.
3. **Form backend.** The quotation form currently opens the visitor's email app, addressed to info@sunchoice.co.zw. Point it at Formspree, Netlify Forms or your own endpoint for in-page submissions.
4. **Figures.** The stats are general solar facts (sunshine hours, irradiation, warranty lengths). Swap in real company numbers (installs, kWp installed, years trading) when available. Chart data is illustrative and labelled as such.
