"""Перенос утверждённого макета v9 в Astro (однократная генерация, результат закоммичен).

Вход:  docs/design/v9/vernissage-2.0-v9.html — утверждённый макет (дизайн-кандидат v9, sha256 ea4fe78f…5307b2).
Выход: src/styles/v9-site.css и src/components/v9/*.astro.

Что делает:
- стили макета без страницы-презентации (рамки ПК/iPhone, переключатели) и без орехового варианта 3D;
- разметку главной и страницы проекта режет на компоненты;
- элементы, у которых в макете фото было фоном (background-image base64), получают <Ph> — настоящий <img> с srcset
  из src/assets/v9 (astro:assets), ленивой загрузкой и alt из aria-label макета;
- ссылки «#» макета заменяет настоящими: разделы главной, /create-3d/ с параметрами конструктора, WhatsApp, телефон.

Запуск из корня репозитория: python3 docs/design/v9/tools/port_v9.py
После генерации компоненты правились вручную (см. git log), повторный запуск перезапишет правки.
"""
import re, pathlib, html

ROOT = pathlib.Path(__file__).resolve().parents[4]
SRC = ROOT / 'docs/design/v9/vernissage-2.0-v9.html'
OUT_C = ROOT / 'src/components/v9'
OUT_S = ROOT / 'src/styles/v9-site.css'
s = SRC.read_text(encoding='utf-8')

# ---------------- стили ----------------
css = re.search(r'<style>(.*?)</style>', s, re.S).group(1)
body = css[css.index('/* ================= ПЕРВЫЙ ЭКРАН (.v)'):]
cut = body.index('{background-image:url(data:')
body = body[:body.rfind('\n', 0, cut)]
lines = []
for ln in body.split('\n'):
    if 'k-dark' in ln:                       # ореховый вариант 3D не выбран владельцем
        continue
    if ln.startswith('.phone .x-') or ln.startswith('/* в рамке iPhone'):
        continue
    ln = ln.replace('body.solo .x-bar{display:flex}', '.x-bar{display:flex}')
    lines.append(ln)
body = '\n'.join(lines)
body = body.replace('VERNISSAGE × FORMIQ', 'VERNISSAGE')

FONTS = ''.join(
    "@font-face{font-family:'VN Cormorant';font-style:%s;font-weight:%s;font-display:swap;src:url(../assets/fonts/cormorant-%s-%s-%s.woff2) format('woff2');unicode-range:%s}\n"
    % (st, w, sub, w, st, rng)
    for (st, w) in [('normal', '400'), ('normal', '500'), ('normal', '600'), ('italic', '400')]
    for (sub, rng) in [('cyr', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'),
                       ('lat', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD')]
) + ''.join(
    "@font-face{font-family:'VN Manrope';font-style:normal;font-weight:200 900;font-display:swap;src:url(../assets/fonts/manrope-%s.woff2) format('woff2');unicode-range:%s}\n"
    % (sub, rng)
    for (sub, rng) in [('cyr', 'U+0301,U+0400-045F,U+0490-0491,U+04B0-04B1,U+2116'),
                       ('lat', 'U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD')]
)

HEAD = """/* VERNISSAGE 2.0 — главная и страница проекта в утверждённом дизайне v9 («Visual Design v9», 24.11.2026).
   Сгенерировано docs/design/v9/tools/port_v9.py из docs/design/v9/vernissage-2.0-v9.html, затем доработано вручную.
   Свет один: тёплый, сверху справа — все тени уходят вниз-влево (токены --lift-1/2/3).
   Страница «Создать в 3D» использует свои стили (v9.css + create3d.css) и сюда не подключается. */
""" + FONTS + """:root{
  color-scheme:light;
  --ivory:#F6F1E8; --paper:#F2EBE0; --stone:#EDE4D6; --stone-2:#E4D9C9; --ink:#241F1A; --ink-2:#4A4239; --muted:#6A6055;
  --bronze:#8E6A43; --bronze-text:#73512F; --bronze-line:#A8885F; --line:#DCD1C1; --line-2:#CFC3B1;
  --serif:'VN Cormorant','Cormorant Garamond','Times New Roman',Georgia,serif;
  --sans:'VN Manrope','Manrope','Segoe UI',system-ui,-apple-system,sans-serif;
  --ease-out:cubic-bezier(.22,.8,.2,1); --ease-soft:cubic-bezier(.4,.1,.2,1);
}
*{box-sizing:border-box}
html{-webkit-text-size-adjust:100%;text-size-adjust:100%}
body{margin:0;background:var(--ivory);color:var(--ink);font:400 16px/1.6 var(--sans);-webkit-font-smoothing:antialiased;overflow-x:hidden}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:21;background:var(--ivory)}
a{color:inherit}
:focus-visible{outline:2px solid var(--bronze-text);outline-offset:3px}
[hidden]{display:none!important}
.skip{position:absolute;left:12px;top:-60px;z-index:60;background:var(--ink);color:var(--ivory);padding:12px 16px;border-radius:3px;font:600 15px/1 var(--sans);text-decoration:none}
.skip:focus{top:calc(12px + env(safe-area-inset-top,0px))}
/* фото: в макете — фон элемента, на сайте — <img> с srcset внутри того же элемента */
:where([data-ph]){position:relative;overflow:hidden}
[data-ph] img{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;display:block}
"""
TAIL = """
/* обычные (не «старого стиля») цифры Cormorant — после всех правил со свойством font */
.v,.v *,.site,.site *,.x-bar,.x-menu{font-feature-settings:"lnum" 1}
"""
OUT_S.write_text(HEAD + '\n' + body.strip() + '\n' + TAIL, encoding='utf-8')

# ---------------- разметка ----------------
tpl = {t: re.search(r'<template id="%s">(.*?)</template>' % t, s, re.S).group(1) for t in ('t-home', 't-project')}

def sizes_for(name, cls, attrs, where):
    if name == 'v4b-hero': return '(max-width: 1100px) 100vw, 56vw', True
    if name == 'v4b-hero-m': return '100vw', True
    if name == 'v4b-inset': return '(max-width: 600px) 120px, 220px', False
    if name.startswith('r7-'): return '(max-width: 600px) 100vw, 62vw', False
    if name.startswith('k7-sw'): return '120px', False
    if name.startswith('w8d-'): return '(max-width: 600px) 130px, 240px', False
    if where == 'project':
        if name == 'w8-wide' and 'ph' in cls.split(): return '100vw', False
        return '(max-width: 600px) 100vw, 62vw', False
    if 'ph' not in cls.split(): return '110px', False                      # миниатюры галереи
    if 'data-k=' in attrs: return '(max-width: 600px) 100vw, 62vw', False  # главное фото галереи
    if name in ('w8-rest-wide', 'w8-jac'): return '(max-width: 600px) 100vw, 55vw', False
    return '(max-width: 600px) 72vw, 40vw', False                          # арки

PH = re.compile(r'<(div|span|i)((?:\s+[a-z-]+(?:="[^"]*")?)*)\s*></\1>')

def convert_images(h, where):
    def rep(m):
        tag, attrs = m.group(1), m.group(2)
        cm = re.search(r'class="([^"]*)"', attrs)
        if not cm or not re.search(r'\bph-[a-z0-9-]+', cm.group(1)):
            return m.group(0)
        cls = cm.group(1)
        name = re.search(r'\bph-([a-z0-9-]+)', cls).group(1)
        rest_cls = ' '.join(c for c in cls.split() if not c.startswith('ph-'))
        alt = ''
        am = re.search(r'aria-label="([^"]*)"', attrs)
        if am: alt = am.group(1)
        other = re.sub(r'\s*class="[^"]*"', '', attrs)
        other = re.sub(r'\s*aria-label="[^"]*"', '', other)
        other = re.sub(r'\s*role="img"', '', other)
        sz, eager = sizes_for(name, cls, attrs, where)
        extra = ''
        if name == 'v4b-hero': extra = ' skipMedia="(max-width: 560px)"'
        if name == 'v4b-hero-m': extra = ' skipMedia="(min-width: 700px)"'
        if eager: extra += ' eager'
        tagp = '' if tag == 'div' else ' tag="%s"' % tag
        return '<Ph name="%s"%s class="%s" alt="%s" sizes="%s"%s%s />' % (name, tagp, rest_cls, alt, sz, extra, other)
    return PH.sub(rep, h)

ICON_MENU_A = re.compile(r'<a class="v-ic" href="#" aria-label="Открыть меню">(.*?)</a>', re.S)

def links(h):
    nav = [('Работы', "{base + '#works'}"), ('Изготовление', "{base + '#cats'}"), ('3D-конструктор', "{base + 'create-3d/'}"),
           ('Как заказать', "{base + '#how'}"), ('Контакты', "{base + '#contact'}")]
    for label, href in nav:
        h = h.replace('<a href="#">%s</a>' % label, '<a href=%s>%s</a>' % (href, label))
    h = h.replace('<a class="v-logo" href="#"', '<a class="v-logo" href={base}')
    h = h.replace('class="v-phone" href="#"', 'class="v-phone" href={CONTACTS.phoneHref}')
    h = h.replace('class="f-tel" href="#"', 'class="f-tel" href={CONTACTS.phoneHref}')
    h = h.replace('class="x-menu-tel" href="#"', 'class="x-menu-tel" href={CONTACTS.phoneHref}')
    h = h.replace('class="v-wa" href="#"', 'class="v-wa" href={wa} target="_blank" rel="noopener noreferrer"')
    h = h.replace('class="v-ic" href="#" aria-label="Написать в WhatsApp"', 'class="v-ic" href={wa} target="_blank" rel="noopener noreferrer" aria-label="Написать в WhatsApp"')
    h = ICON_MENU_A.sub(lambda m: '<button class="v-ic" type="button" data-menu-open aria-controls="x-menu" aria-expanded="false" aria-label="Открыть меню">%s</button>' % m.group(1), h)
    h = h.replace('class="v-btn v-btn--p" href="#"', "class=\"v-btn v-btn--p\" href={base + '#contact'}")
    h = h.replace('class="v-btn v-btn--s" href="#"', "class=\"v-btn v-btn--s\" href={base + 'create-3d/'}")
    h = h.replace('<a class="p" href="#"', "<a class=\"p\" href={base + '#contact'}")
    h = h.replace('<a class="s" href="#"', "<a class=\"s\" href={base + 'create-3d/'}")
    h = h.replace('<a class="w" href="#"', '<a class="w" href={wa} target="_blank" rel="noopener noreferrer"')
    return h

def write(name, front, markup):
    (OUT_C / (name + '.astro')).write_text('---\n' + front.strip() + '\n---\n' + markup.strip() + '\n', encoding='utf-8')

OUT_C.mkdir(parents=True, exist_ok=True)
COMMON = """import Ph from './Ph.astro';
import { CONTACTS, waLink } from '../../data/site';
import { createLink, CATEGORY_LINKS } from '../../data/create3d';
const base = import.meta.env.BASE_URL;
const wa = waLink('Здравствуйте! Хочу рассчитать мебель на заказ.');
"""

home = tpl['t-home']
proj = tpl['t-project']

# шапка (одна на обе страницы)
hdr = re.search(r'<header class="v-hdr">.*?</header>', home, re.S).group(0)
write('Header', COMMON, links(hdr))

def section(h, start_pat):
    a = h.index(start_pat)
    # конец — парный закрывающий тег верхнего уровня
    tag = re.match(r'<([a-z]+)', h[a:]).group(1)
    depth, i = 0, a
    for m in re.finditer(r'<(/?)%s\b[^>]*>' % tag, h[a:]):
        depth += -1 if m.group(1) else 1
        if depth == 0:
            return h[a:a + m.end()]
    raise ValueError(start_pat)

hero = section(home, '<div class="v"')
hero = hero.replace(hdr, '<Header />')
write('Hero', COMMON + "import Header from './Header.astro';", links(convert_images(hero, 'home')))
for comp, pat in [('Categories', '<section class="x-sec c-sec"'), ('Works', '<section class="x-sec w-sec"'),
                  ('Kit3D', '<section class="x-sec k-sec"'), ('Steps', '<section class="x-sec" data-anchor="how"'),
                  ('Lead', '<section class="x-sec f-sec"')]:
    write(comp, COMMON, links(convert_images(section(home, pat), 'home')))
write('Footer', COMMON, links(section(home, '<footer class="x-ftr">')))
bar = section(home, '<div class="x-bar"')
menu = section(home, '<div class="x-menu"')
write('Bar', COMMON, links(bar) + '\n' + links(menu))
art = section(proj, '<article class="x-in">')
write('ProjectArticle', COMMON, links(convert_images(art, 'project')))
print('ok')
