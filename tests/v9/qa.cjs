/*
 * VERNISSAGE 2.0 — проверки страниц в дизайне v9 (главная, проект) и связи с 3D-конструктором. Playwright, Chromium и WebKit.
 * Запуск:  npm run build && npm run preview
 *          node tests/v9/qa.cjs [URL] [chromium,webkit]
 *          AXE=/путь/к/axe.min.js node tests/v9/qa.cjs …   — дополнительно доступность (axe-core, WCAG 2.2 AA)
 * Пример для Vercel Preview: node tests/v9/qa.cjs https://<preview>.vercel.app/
 * Код выхода 1, если есть проваленные проверки. Это эмуляция браузеров, не настоящий iPhone.
 */
const pw = require('playwright');
const fs = require('fs');
const BASE = (process.argv[2] || 'http://127.0.0.1:4321/vernissage2.0/').replace(/\/?$/, '/');
const ENGINES = (process.argv[3] || 'chromium,webkit').split(',');
const WIDTHS = [320, 375, 390, 430, 768, 1024, 1440];
const HGT = { 320: 568, 375: 812, 390: 844, 430: 932, 768: 1024, 1024: 768, 1440: 900 };
const AXE = process.env.AXE ? fs.readFileSync(process.env.AXE, 'utf8') : null;
const rows = []; let failed = 0;
const ok = (cond, name, info = '') => { rows.push(`${cond ? '✓' : '✗'} ${name}${info ? ' — ' + info : ''}`); if (!cond) failed++; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function open(browser, path, w, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: HGT[w] || 900 }, hasTouch: w < 800, reducedMotion: opts.rm ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('response', (r) => { if (r.status() >= 400 && r.url().startsWith(BASE.replace(/\/[^/]*\/$/, ''))) errs.push(r.status() + ' ' + r.url()); });
  await p.goto(BASE + path, { waitUntil: 'load' });
  await sleep(700);
  return { p, ctx, errs };
}

async function run(engine) {
  const browser = await pw[engine].launch();
  const E = (s) => `${engine}: ${s}`;

  // 1. ширины: нет горизонтальной прокрутки и ошибок; на 320×568 обе кнопки первого экрана видны
  for (const path of ['', 'portfolio/residential/', 'create-3d/']) {
    for (const w of WIDTHS) {
      const { p, ctx, errs } = await open(browser, path, w);
      const r = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
      let extra = '';
      if (path === '' && w === 320) {
        const b = await p.$$eval('.v-acts .v-btn', (a) => a.map((x) => Math.round(x.getBoundingClientRect().bottom)));
        ok(b.length === 2 && b.every((y) => y <= 568), E('320×568: обе кнопки первого экрана на экране'), b.join(', '));
      }
      ok(r.sw <= r.iw + 1 && !errs.length, E(`/${path} ${w}px: без переполнения и ошибок`), `${r.sw}/${r.iw}${errs.length ? ' ' + errs.slice(0, 2).join('; ') : ''}${extra}`);
      await ctx.close();
    }
  }

  // 2. компьютер: арки, CLS, галерея, 3D и ссылки в конструктор
  {
    const { p, ctx } = await open(browser, '', 1440);
    if (engine === 'chromium') await p.evaluate(() => { window.__cls = 0; new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true }); });
    await p.$eval('#cats', (e) => e.scrollIntoView({ block: 'center' })); await sleep(800);
    const before = await p.evaluate(() => window.__cls || 0);
    for (const a of await p.$$('.c-arch')) { const q = await a.boundingBox(); await p.mouse.move(q.x + q.width / 2, q.y + q.height / 3, { steps: 3 }); await sleep(350); }
    const ws = await p.$$eval('.c-arch', (a) => a.map((x) => Math.round(x.getBoundingClientRect().width)));
    ok(ws[5] > ws[0] * 2, E('арки: наведение раскрывает арку'), ws.join(','));
    if (engine === 'chromium') { const cls = await p.evaluate(() => window.__cls); ok(cls - before < 0.02, E('арки: наведение без сдвигов макета (CLS)'), (cls - before).toFixed(4)); }
    const hrefs = await p.$$eval('.c-arch', (a) => a.map((x) => x.getAttribute('href')));
    ok(hrefs.every((h) => /create-3d\/\?start=(kitchen|wardrobe|tv|bathroom|desk)$/.test(h)), E('арки ведут в конструктор с видом мебели'), hrefs[0]);
    const hero3d = await p.$eval('.v-acts .v-btn--s', (a) => a.getAttribute('href'));
    ok(/create-3d\/$/.test(hero3d), E('первый экран: «Создать самому в 3D» → /create-3d/'), hero3d);
    // галерея
    await p.$eval('#works', (e) => e.scrollIntoView()); await sleep(2600);
    await p.click('.w-th[data-k="3"]'); await sleep(500);
    const g = await p.evaluate(() => ({ main: document.querySelector('.w-main .ph.on')?.dataset.k, det: document.querySelector('.w-detail .ph.on')?.dataset.k, cap: document.querySelector('[data-wcap]')?.textContent }));
    ok(g.main === '3' && g.det === '3' && /Спальня/.test(g.cap), E('галерея: миниатюра → фото, деталь и подпись'), JSON.stringify(g));
    // 3D
    await p.$eval('#\\33 d', (e) => e.scrollIntoView()); await sleep(600);
    let good = 0, link = '';
    for (const l of ['straight', 'corner', 'island']) for (const f of ['oak', 'walnut', 'ivory', 'graphite']) {
      await p.click(`[data-lay="${l}"]`); await p.click(`[data-fin="${f}"]`);
      const r = await p.evaluate(() => ({ on: [...document.querySelectorAll('[data-kview] .r.on')].map((x) => x.dataset.r), href: document.querySelector('[data-k3-cta]').getAttribute('href') }));
      if (r.on.length === 1 && r.on[0] === `${l}-${f}` && r.href.endsWith(`create-3d/?start=kitchen&layout=${l}&finish=${f}`)) good++;
      link = r.href;
    }
    ok(good === 12, E('3D: 12 сочетаний — свой рендер и ссылка в конструктор с тем же выбором'), `${good}/12, ${link}`);
    // заявка → WhatsApp
    await p.evaluate(() => { window.__open = []; window.open = (u) => { window.__open.push(u); return {}; }; });
    await p.$eval('#contact', (e) => e.scrollIntoView()); await sleep(300);
    await p.click('#lead-form button[type=submit]');
    const e1 = await p.evaluate(() => ({ err: !document.getElementById('f-err').hidden, focus: document.activeElement?.id }));
    await p.fill('#f-tel', '+7 701 000 00 00'); await p.check('#f-ok'); await p.click('#lead-form button[type=submit]');
    const opened = await p.evaluate(() => window.__open[0] || '');
    ok(e1.err && e1.focus === 'f-tel' && /^https:\/\/wa\.me\/77475613005\?text=/.test(opened), E('заявка: проверка полей и сообщение в WhatsApp салона'), opened.slice(0, 60));
    await ctx.close();
  }

  // 3. телефон: меню, нижняя панель, лента арок
  {
    const { p, ctx } = await open(browser, '', 390);
    const barOn = () => p.$eval('.x-bar', (b) => b.classList.contains('on'));
    ok(!(await barOn()), E('панель: скрыта на первом экране'));
    await p.evaluate(() => scrollTo(0, 1500)); await sleep(1500);
    ok(await barOn(), E('панель: видна после первого экрана'));
    await p.click('.v-hdr [data-menu-open]'); await sleep(200);
    const m = await p.evaluate(() => ({ open: !document.querySelector('.x-menu').hidden, focus: document.activeElement?.className, bar: document.querySelector('.x-bar').classList.contains('on') }));
    await p.keyboard.press('Escape'); await sleep(200);
    const closed = await p.$eval('.x-menu', (x) => x.hidden);
    ok(m.open && /x-menu-x/.test(m.focus) && !m.bar && closed, E('меню: открывается, фокус на «Закрыть», панель прячется, Esc закрывает'), JSON.stringify(m));
    await p.$eval('#contact', (e) => e.scrollIntoView({ block: 'center' })); await sleep(1500);
    ok(!(await barOn()), E('панель: прячется у формы'));
    await p.$eval('#cats .c-enf', (e) => { e.scrollIntoView({ block: 'center' }); e.scrollBy({ left: 260, behavior: 'instant' }); }); await sleep(500);
    const rail = await p.evaluate(() => ({ n: document.querySelector('.c-num b').textContent, on: [...document.querySelectorAll('.c-arch')].findIndex((a) => a.classList.contains('on')) }));
    ok(rail.n === '2' && rail.on === 1, E('арки на телефоне: прокрутка → «2 / 6», вторая арка впереди'), JSON.stringify(rail));
    await ctx.close();
  }

  // 4. проект: «Рис. N»
  {
    const { p, ctx } = await open(browser, 'portfolio/residential/', 1440);
    await p.click('.pj-toc a[href="#fig3"]'); await sleep(1100);
    const r = await p.evaluate(() => { const f = document.getElementById('fig3'); const q = f.getBoundingClientRect(); return { hl: f.classList.contains('hl'), inView: q.top >= 0 && q.bottom <= innerHeight + 2 }; });
    ok(r.hl && r.inView, E('проект: «Рис. 3» прокручивает к рисунку и выделяет его'), JSON.stringify(r));
    await ctx.close();
  }

  // 5. «Создать в 3D»: выбор передаётся во фрейм конструктора
  {
    const { p, ctx } = await open(browser, 'create-3d/?start=kitchen&layout=corner&finish=graphite', 1440);
    const src = await p.$eval('#c3-frame', (f) => f.getAttribute('src') || '');
    ok(/embed=1/.test(src) && /start=kitchen/.test(src) && /layout=corner/.test(src) && /finish=graphite/.test(src), E('/create-3d/: выбор с сайта доходит до конструктора'), src.slice(0, 120));
    await ctx.close();
  }

  // 5б. «Создать в 3D»: навигация на разделы новой главной, возврат на главную, полноэкранный режим,
  //     конструктор во фрейме (компьютер и телефон), на телефоне нет нижней панели сайта
  for (const w of [1440, 390]) {
    const { p, ctx } = await open(browser, 'create-3d/?start=kitchen&layout=island&finish=oak', w);
    const nav = await p.$$eval('.v-nav a, .x-menu nav a', (a) => [...new Set(a.map((x) => new URL(x.href).pathname + new URL(x.href).hash))]);
    const want = ['#works', '#cats', 'create-3d/', '#how', '#contact'];
    ok(want.every((h) => nav.some((x) => x.endsWith(h))), E(`/create-3d/ ${w}px: меню ведёт на разделы новой главной`), nav.join(' '));
    const home = await p.$eval('.v-logo', (a) => new URL(a.href).pathname);
    ok(home === new URL(BASE).pathname, E(`/create-3d/ ${w}px: логотип возвращает на главную`), home);
    const full = await p.$$eval('[data-full]', (a) => a.map((x) => x.getAttribute('href')));
    ok(full.length && full.every((h) => !/embed=1/.test(h) && /start=kitchen/.test(h) && /layout=island/.test(h) && /finish=oak/.test(h)), E(`/create-3d/ ${w}px: «на весь экран» — тот же выбор без встраивания`), (full[0] || '').slice(-70));
    const fr = await (await p.waitForSelector('#c3-frame')).contentFrame();
    let inside = '';
    try { await fr.waitForFunction(() => /Модель/.test(document.body.innerText) && /Размеры/.test(document.body.innerText), null, { timeout: 45000 }); inside = await fr.evaluate(() => document.body.innerText); } catch { /* фрейм не загрузился */ }
    ok(/Модель/.test(inside) && /Размеры/.test(inside) && !/Professional|PRO-режим/.test(inside), E(`/create-3d/ ${w}px: конструктор загружен во фрейме, режим Easy`), inside ? 'шаги Easy на месте' : 'нет содержимого фрейма');
    const box = await p.$eval('#c3-frame', (f) => { const q = f.getBoundingClientRect(); return { h: Math.round(q.height), vh: innerHeight, bar: !!document.querySelector('.x-bar') }; });
    ok(box.h > box.vh * 0.55 && !box.bar, E(`/create-3d/ ${w}px: конструктор занимает экран, нижней панели сайта нет`), JSON.stringify(box));
    await ctx.close();
  }

  // 6. клавиатура: у каждого элемента в фокусе видна рамка
  {
    const { p, ctx } = await open(browser, '', 1440);
    const miss = [];
    for (let i = 0; i < 45; i++) {
      await p.keyboard.press('Tab');
      const r = await p.evaluate(() => { const a = document.activeElement; if (!a || a === document.body) return null; const cs = getComputedStyle(a); return { t: (a.textContent || a.getAttribute('aria-label') || a.tagName).trim().slice(0, 30), vis: cs.outlineStyle !== 'none' && parseFloat(cs.outlineWidth) > 0 }; });
      if (r && !r.vis) miss.push(r.t);
    }
    ok(!miss.length, E('клавиатура: видимый фокус у первых 45 элементов'), miss.slice(0, 4).join(' | '));
    await ctx.close();
  }

  // 7. уменьшение движения
  {
    const { p, ctx } = await open(browser, '', 390, { rm: true });
    const t = await p.evaluate(() => ['.c-frame', '.w-main .ph', '.k-view .r', '.x-bar', '.k-fin .sw'].map((s) => getComputedStyle(document.querySelector(s)).transitionDuration.split(',')[0]));
    const pre = await p.evaluate(() => document.querySelectorAll('.c-pre,.w-pre,.f-pre').length);
    ok(t.every((x) => x === '0s') && pre === 0, E('уменьшение движения: переходы 0 с, появления не запускаются'), t.join(','));
    await ctx.close();
  }

  // 8. доступность (axe-core), если указан AXE
  if (AXE) {
    for (const [path, w] of [['', 390], ['', 1440], ['portfolio/residential/', 390], ['portfolio/residential/', 1440]]) {
      const { p, ctx } = await open(browser, path, w);
      await sleep(1800); // первый экран проявляется ~1,5 с — проверяем контраст после анимации
      await p.addScriptTag({ content: AXE });
      const v = await p.evaluate(async () => (await axe.run(document, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] } })).violations.map((x) => `${x.id}(${x.nodes.length})`));
      ok(!v.length, E(`axe /${path} ${w}px: нет нарушений`), v.join(' '));
      await ctx.close();
    }
  }
  await browser.close();
}

(async () => {
  for (const e of ENGINES) await run(e);
  console.log(rows.join('\n'));
  console.log(`\n${rows.length - failed} из ${rows.length} проверок пройдено`);
  process.exit(failed ? 1 : 0);
})();
