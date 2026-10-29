"""Static site build: wraps each _src/pages/*.html in the base template and
expands <!--#include name--> partials. A page starts with a JSON meta comment:
<!--{"title": "...", "desc": "...", "page": "home", "bodyclass": "", "ogimage": "installer-sunset"}-->
Usage: python _src/tools/build.py"""
import json, os, re, glob

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
P = os.path.join(ROOT, '_src', 'partials')


def include(html):
    def rep(m):
        name = m.group(1)
        path = next(p for p in (os.path.join(P, name + '.html'), os.path.join(P, name + '.svg')) if os.path.exists(p))
        return include(open(path, encoding='utf8').read())
    return re.sub(r'<!--#include ([\w-]+)-->', rep, html)


base = open(os.path.join(P, 'base.html'), encoding='utf8').read()
for f in sorted(glob.glob(os.path.join(ROOT, '_src', 'pages', '*.html'))):
    src = open(f, encoding='utf8').read()
    m = re.match(r'<!--(\{.*?\})-->\s*', src, re.S)
    meta = {'bodyclass': '', 'scripts': '', 'ogimage': 'installer-sunset', **json.loads(m.group(1))}
    html = include(base.replace('{{content}}', src[m.end():]))
    for k, v in meta.items():
        html = html.replace('{{%s}}' % k, v)
    html = html.replace(f'data-nav="{meta["page"]}"', f'data-nav="{meta["page"]}" aria-current="page"')
    open(os.path.join(ROOT, os.path.basename(f)), 'w', encoding='utf8', newline='\n').write(html)
    print('built', os.path.basename(f))
