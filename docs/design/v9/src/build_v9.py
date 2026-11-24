import base64,os,re,sys
logo=sys.argv[1]
hero=open('../v4/hero-src.html',encoding='utf-8').read()
v5=open('../v5/full-src.html',encoding='utf-8').read()
src=open('full-src.html',encoding='utf-8').read().replace('__V8_CSS__',open('v9.css',encoding='utf-8').read())
# --- утверждённый первый экран v4 (вариант Б)
a=hero.index('/* ================= ПЕРВЫЙ ЭКРАН (.v)'); b=hero.index('__IMG_CSS__',a); hero_css=hero[a:b]
tv=re.search(r'<template id="t-v">\s*(.*?)\s*</template>',hero,re.S).group(1)
tv=tv.replace('<div class="v">','<div class="v" data-v="b">',1)
tv=re.sub(r'<div class="k va [^"]*"[^>]*></div>','',tv)
tv='\n'.join(l for l in tv.split('\n') if not re.search(r'class="(v-inset|v-cap) va\b',l))
header=re.search(r'<header class="v-hdr">.*?</header>',tv,re.S).group(0)
# --- нижняя панель и меню из v5 (архитектура проверена на iPhone)
i=v5.index('/* ---- нижняя панель CTA и меню'); j=v5.index('@media (max-width:600px){body.solo .x-bar{display:flex}}')+len('@media (max-width:600px){body.solo .x-bar{display:flex}}')
bar_css=v5[i:j]
i=v5.index('<div class="x-bar" aria-hidden="true">'); j=v5.index('\n</template>',i); bar_html=v5[i:j].replace('<nav aria-label="Разделы">','<nav aria-label="Меню разделов">')
i=v5.index('  // Нижняя панель:'); j=v5.index('  function place(){'); bar_js=v5[i:j]
footer='''<footer class="x-ftr"><div class="x-in">
    <div class="x-ftr-top"><span class="v-logo" role="img" aria-label="VERNISSAGE"></span><nav aria-label="Разделы сайта в подвале"><a href="#">Работы</a><a href="#">Изготовление</a><a href="#">3D-конструктор</a><a href="#">Как заказать</a><a href="#">Контакты</a></nav></div>
    <div class="x-ftr-bot"><span>© VERNISSAGE, 2003–2026. Мебель на заказ, Астана</span><span>Instagram, TikTok</span><span>Политика конфиденциальности</span><span>3D-конструктор — технология FORMIQ</span></div>
  </div></footer>'''
renders='\n'.join('<div class="r ph-r7-%s-%s%s" data-r="%s-%s"></div>'%(l,f,' on' if (l,f)==('straight','walnut') else '',l,f) for l in ['straight','corner','island'] for f in ['oak','walnut','ivory','graphite'])
why=open('why.html',encoding='utf-8').read() if os.path.exists('why.html') else '<p>—</p>'
qa=open('qa.html',encoding='utf-8').read() if os.path.exists('qa.html') else '<p>Заполняется после проверки.</p>'
out=(src.replace('__HERO_CSS__',hero_css).replace('__HERO__',tv).replace('__HEADER__',header).replace('__FOOTER__',footer)
        .replace('__BARMENU_CSS__',bar_css).replace('__BARMENU_HTML__',bar_html).replace('__SETUPBAR_JS__',bar_js)
        .replace('__RENDERS__',renders).replace('__WHY__',why).replace('__QA__',qa).replace('__FACTS__',open('facts.html',encoding='utf-8').read()).replace('__PERF__',open('perf.html',encoding='utf-8').read()))
sv=lambda d,sw='1.6':'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">%s</svg>'%(sw,d)
WA=sv('<path d="M4.6 19.4l1.1-3.4a8 8 0 1 1 3 2.8z"/><path d="M9.3 8.6c.2 2.6 3.4 5.8 6 6l1.1-1.4-1.9-1-1 .8a5 5 0 0 1-2.5-2.5l.8-1-1-1.9z"/>')
CUBE=sv('<path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z"/><path d="M4 7.5l8 4.5 8-4.5M12 12v9"/>','1.4')
ARROW='<svg class="arr" viewBox="0 0 44 20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M2 10h39M33 3l8 7-8 7"/></svg>'
rep={'__ICON_WA__':WA,'__WA__':WA,'__ICON_CUBE__':CUBE,'__CUBE__':CUBE,'__ICON_ARROW__':ARROW,'__ICON_MENU__':sv('<path d="M4 8.5h16M4 15.5h16"/>'),'__BRANCH__':open('../v4/branches.svg.txt').read()}
for k,v in rep.items(): out=out.replace(k,v)
used=sorted(set(re.findall(r'ph-([a-z0-9-]+)',out)))
miss=[k for k in used if not os.path.exists(f'../img/{k}.webp')]; assert not miss,miss
css=['.ph-%s{background-image:url(data:image/webp;base64,%s)}'%(k,base64.b64encode(open(f'../img/{k}.webp','rb').read()).decode()) for k in used]
css.append(':root{--logo:url(data:image/svg+xml;base64,%s)}'%base64.b64encode(open(logo,'rb').read()).decode())
out=out.replace('__IMG_CSS__','\n'.join(css))
left=re.findall(r'__[A-Z_]+__',out); assert not left,left
open('vernissage-2.0-v9.html','w',encoding='utf-8').write(out); print(len(out)//1024,'KB; images',len(used))
# автономный файл для вложения: полный документ с viewport (открывается напрямую на iPhone)
head,_,body=out.partition('</style>')
std='<!doctype html>\n<html lang="ru">\n<head>\n<meta charset="utf-8">\n<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'+head+'</style>\n</head>\n<body>\n'+body+'\n</body>\n</html>\n'
open('vernissage-2.0-v9-standalone.html','w',encoding='utf-8').write(std)
