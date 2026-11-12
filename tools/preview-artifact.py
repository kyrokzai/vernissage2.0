"""Готовит приватное превью для claude.ai Artifact из сборки с base=/.
npx astro build --base / --outDir <папка>  →  python3 tools/preview-artifact.py <папка>
Делает пути относительными, переименовывает _assets в assets (имена с «_» зарезервированы хостингом)
и убирает каркас документа (его добавляет хостинг). Основной сайт и gh-pages не затрагиваются."""
import sys, os, re, glob, shutil
d = sys.argv[1]
p = os.path.join(d, 'index.html'); s = open(p, encoding='utf-8').read()
s = s.replace('"/_assets/', '"_assets/').replace("'/_assets/", "'_assets/").replace('(/_assets/', '(_assets/')
s = s.replace('"/media/', '"media/')
# каркас документа добавляет хостинг Artifact
s = re.sub(r'<!DOCTYPE html>|<!doctype html>', '', s)
s = re.sub(r'<html[^>]*>', '', s); s = s.replace('</html>', '')
s = re.sub(r'<head>', '', s); s = s.replace('</head>', '')
s = re.sub(r'<body[^>]*>', '', s); s = s.replace('</body>', '')
s = re.sub(r'<meta charset="utf-8"\s*/?>', '', s)
s = re.sub(r'<meta name="viewport"[^>]*>', '', s)
s = re.sub(r'<title>.*?</title>', '', s, count=1, flags=re.S)
s = ('<title>VERNISSAGE 2.0</title>\n<meta name="claude:viewport-fit-sides" content="cover">\n'
     '<script>document.documentElement.lang="ru"</script>\n') + s.lstrip()
open(p, 'w', encoding='utf-8').write(s)
for c in glob.glob(os.path.join(d, '_assets', '*.css')):
    t = open(c, encoding='utf-8').read(); t = t.replace('url(/_assets/', 'url(').replace('url("/_assets/', 'url("'); open(c, 'w', encoding='utf-8').write(t)
left = re.findall(r'["\'(]/(?:_assets|media)/', s)
print('index size', len(s), 'absolute left', len(left))
for f in glob.glob(os.path.join(d, '_assets', '*.js')):
    if re.search(r'["\']/(_assets|media)/', open(f, encoding='utf-8').read()): print('JS absolute in', f)

# имена с «_» зарезервированы хостингом
if os.path.isdir(os.path.join(d, '_assets')):
    shutil.move(os.path.join(d, '_assets'), os.path.join(d, 'assets'))
    for f in glob.glob(os.path.join(d, '**', '*'), recursive=True):
        if f.endswith(('.html', '.js', '.css')):
            t = open(f, encoding='utf-8').read()
            if '_assets/' in t: open(f, 'w', encoding='utf-8').write(t.replace('_assets/', 'assets/'))
print('готово:', d)
