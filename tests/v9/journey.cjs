/*
 * VERNISSAGE 2.0 × FORMIQ — сквозной путь посетителя на настоящем сайте:
 *   главная → каталог (арка «Кухни») → 3D-конструктор → настройка мебели (планировка, посудомоечная машина, предмет интерьера,
 *   размер, цвет) → заявка → «на весь экран» и «На сайт салона» → логотип → заявка с сайта → нижняя панель (телефон) →
 *   снова конструктор: проект сохранился. Плюс ошибки JavaScript и консоли на сайте и в конструкторе.
 * Запуск:  node tests/v9/journey.cjs <URL сайта> [chromium,webkit]
 *          SHOTS=/папка node tests/v9/journey.cjs …   — снимки экрана каждого шага
 * Пример:  node tests/v9/journey.cjs https://<preview>.vercel.app/
 * Компьютер 1440×900 и телефон 390×844 с касанием. Код выхода 1, если есть проваленные проверки. Это эмуляция, не настоящий iPhone.
 */
const pw = require('playwright');
const path = require('path');
const BASE = (process.argv[2] || 'http://127.0.0.1:4321/vernissage2.0/').replace(/\/?$/, '/');
const ENGINES = (process.argv[3] || 'chromium,webkit').split(',');
const SHOTS = process.env.SHOTS || '';
const rows = []; let failed = 0;
const ok = (cond, name, info = '') => { rows.push(`${cond ? '✓' : '✗'} ${name}${info ? ' — ' + info : ''}`); if (!cond) failed++; return cond; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const same = (a, b) => { const x = new URL(a), y = new URL(b); return x.origin === y.origin && x.pathname === y.pathname; };

async function run(engine, w, h) {
  const E = (s) => `[${engine} ${w}px] ${s}`;
  const browser = await pw[engine].launch();
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: w < 800 });
  const p = await ctx.newPage();
  const errs = [], posts = [];
  p.on('pageerror', (e) => errs.push(e.message));
  // ошибки консоли, кроме панели отзывов Vercel на Preview (vercel.live) — она не часть сайта
  const cons = [];
  p.on('console', (m) => { if (m.type() === 'error' && !/vercel\.live|_vercel\/insights|feedback/i.test(m.text() + (m.location()?.url || ''))) cons.push(m.text().slice(0, 120)); });
  p.on('request', (r) => { if (r.method() !== 'GET' && r.method() !== 'HEAD') posts.push(`${r.method()} ${r.url()}`); });
  const shot = async (n) => { if (SHOTS) await p.screenshot({ path: path.join(SHOTS, `${engine}-${w}-${n}.png`) }); };
  try {
    // 1. главная
    await p.goto(BASE, { waitUntil: 'load' }); await sleep(1200);
    const home = await p.evaluate(() => ({
      h1: document.querySelector('h1')?.innerText.trim() || '',
      tech: (document.body.innerText.match(/Технология FORMIQ/g) || []).length,
      formiq: (document.body.innerText.match(/FORMIQ/g) || []).length,
      wm: [...document.querySelectorAll('.wm')].map((e) => e.textContent.trim()),
    }));
    ok(!!home.h1, E('главная открылась'), home.h1.replace(/\s+/g, ' ').slice(0, 50));
    ok(home.tech === 2 && home.formiq === 2, E('главная: «Технология FORMIQ» только в 3D-разделе и подвале'), `${home.tech} из ${home.formiq}`);
    ok(home.wm.length > 0 && home.wm.every((t) => t === 'VERNISSAGE'), E('главная: водяной знак на рендерах — VERNISSAGE'), home.wm.join(','));
    await shot('1-home');

    // 2. каталог → 3D-конструктор
    await p.$eval('#cats', (e) => e.scrollIntoView()); await sleep(900);
    await shot('2-catalog');
    const arch = p.locator('#cats a.c-arch', { hasText: 'Кухни' });
    await Promise.all([p.waitForURL(/create-3d\/\?start=kitchen/, { timeout: 20000 }), arch.click()]);
    ok(/create-3d\/\?start=kitchen$/.test(p.url()), E('каталог: арка «Кухни» открывает конструктор с кухней'), p.url().replace(BASE, '/'));

    // 3. конструктор во фрейме
    const fl = p.frameLocator('#c3-frame');
    const step = (name) => fl.getByRole('button', { name: new RegExp(`^\\d?\\s*${name}$`) });
    await step('Модель').waitFor({ timeout: 45000 }); await sleep(2500);
    const kitchen = await fl.getByRole('button', { name: 'Кухня', exact: true }).getAttribute('aria-pressed');
    const inside = await fl.locator('body').innerText();
    ok(kitchen === 'true' && !/Professional|PRO-режим|Studio PRO/.test(inside), E('конструктор: открыт Easy, выбрана кухня, PRO нет'), `кухня=${kitchen}`);
    ok(!/Powered by FORMIQ/.test(inside) && /Все права защищены © FORMIQ/.test(inside), E('конструктор: только «Все права защищены © FORMIQ»'));
    await shot('3-configurator');

    // 4. настройка: планировка, размер, цвет фасадов
    await fl.getByRole('button', { name: 'Угловая', exact: true }).click(); await sleep(1200);
    const corner = await fl.getByRole('button', { name: 'Угловая', exact: true }).getAttribute('aria-pressed');
    ok(corner === 'true', E('настройка: планировка «Угловая»'));
    const dw = fl.locator('[data-dishwasher="450"]');
    await dw.click(); await sleep(800);
    ok(await dw.getAttribute('aria-pressed') === 'true', E('новая мебель: посудомоечная машина 45 см'));
    await fl.locator('[data-interior-open]').click(); await sleep(1000);
    const nItems = await fl.locator('[data-interior-add]').count();
    await fl.locator('[data-interior-add="wooden_chair"]').click(); await sleep(1200);
    const closeBtn = fl.getByRole('button', { name: 'Закрыть', exact: true });
    if (await closeBtn.isVisible().catch(() => false)) { await closeBtn.click(); await sleep(600); }
    ok(nItems >= 16, E('каталог интерьера: открылся, предмет добавлен'), `${nItems} предметов в каталоге, добавлен стул`);
    await shot('3b-interior');
    await step('Размеры').click(); await sleep(800);
    const len = fl.getByRole('spinbutton').first();
    const before = Number(await len.inputValue());
    await fl.getByRole('button', { name: /стены A: больше/ }).first().click(); await sleep(800);
    const after = Number(await len.inputValue());
    ok(after > before, E('настройка: длина кухни увеличена'), `${before} → ${after} мм`);
    await shot('4-size');
    await step('Цвет').click(); await sleep(800);
    await fl.getByRole('button', { name: 'Тёмный орех', exact: true }).first().click(); await sleep(1200);
    const walnut = await fl.getByRole('button', { name: 'Тёмный орех', exact: true }).first().getAttribute('aria-pressed');
    ok(walnut === 'true', E('настройка: фасады «Тёмный орех»'));
    await shot('5-colour');

    // 5. заявка в конструкторе: сводка выбора, приём заявок не подключён — ничего не отправляется
    await step('Заявка').click(); await sleep(1000);
    const sum = (await fl.locator('body').innerText()).replace(/\s+/g, ' ');
    ok(/Угловая/.test(sum) && /Фасады Тёмный орех/.test(sum) && sum.includes(String(after)), E('заявка: в сводке угловая кухня, тёмный орех и новый размер'));
    ok(/Интерьер в проекте:? ?1 предм/.test(sum) && /не входят/.test(sum), E('заявка: предмет интерьера отмечен «в расчёт не входят»'), (sum.match(/Интерьер в проекте.{0,80}/) || ['нет строки'])[0]);
    const nPosts = posts.length;
    await fl.getByRole('button', { name: 'Отправить проект на расчёт' }).click(); await sleep(1500);
    const sent = (await fl.locator('body').innerText()).replace(/\s+/g, ' ');
    ok(/Приём заявок ещё не подключён/.test(sent) && posts.length === nPosts, E('заявка: честное сообщение «Приём заявок ещё не подключён», данные никуда не уходят'), posts.slice(nPosts).join(' ') || 'запросов нет');
    await shot('6-request');

    // 6. возврат на главную. Во фрейме возврат — логотип сайта (конструктор прячет свою ссылку, когда встроен);
    //    в режиме «на весь экран» — ссылка конструктора «На сайт салона», она должна вести на этот сайт.
    const fullHref = await p.$eval('[data-full]', (a) => a.href);
    const fp = await ctx.newPage();
    await fp.goto(fullHref, { waitUntil: 'load' });
    let fullOk = false;
    try { await fp.getByRole('button', { name: /^\d?\s*Модель$/ }).waitFor({ timeout: 45000 }); fullOk = true; } catch { /* не загрузился */ }
    ok(fullOk && !/embed=1/.test(fullHref) && /start=kitchen/.test(fullHref), E('«на весь экран»: конструктор открыт отдельно, с тем же выбором'), fullHref.replace(/^https:\/\/[^/]+/, ''));
    const back = fp.locator('a:visible', { hasText: 'На сайт салона' }).first();
    let backHref = '';
    try { await back.waitFor({ timeout: 45000 }); backHref = await back.getAttribute('href'); } catch { /* ссылки нет */ }
    ok(!!backHref && same(backHref, BASE), E('конструктор на весь экран: «На сайт салона» ведёт на этот сайт'), backHref || 'ссылки нет');
    if (backHref && same(backHref, BASE)) {
      await Promise.all([fp.waitForURL((u) => same(u.href, BASE), { timeout: 20000 }), back.click()]);
      ok(same(fp.url(), BASE), E('«На сайт салона» открывает главную'), fp.url());
    }
    await fp.close();
    const wa = await p.$eval('.v-wa, .v-ic[href*="wa.me"]', (a) => a.href);
    ok(/^https:\/\/wa\.me\/77475613005/.test(wa), E('страница конструктора: WhatsApp салона для заявки'), wa.slice(0, 40));
    await Promise.all([p.waitForURL((u) => same(u.href, BASE), { timeout: 20000 }), p.click('.v-head .v-logo, header .v-logo')]);
    ok(same(p.url(), BASE), E('логотип возвращает на главную'), p.url().replace(BASE, '/') || '/');

    // 7. заявка с сайта → WhatsApp салона с готовым сообщением
    await sleep(800);
    await p.evaluate(() => { window.__open = []; window.open = (u) => { window.__open.push(u); return {}; }; });
    await p.$eval('#contact', (e) => e.scrollIntoView()); await sleep(900);
    await p.fill('#f-tel', '+7 701 000 00 00'); await p.locator('#f-ok').check();
    await p.click('#lead-form button[type=submit]'); await sleep(400);
    const opened = await p.evaluate(() => window.__open[0] || '');
    ok(/^https:\/\/wa\.me\/77475613005\?text=/.test(opened), E('заявка с главной открывает WhatsApp салона'), decodeURIComponent(opened.split('text=')[1] || '').slice(0, 50));
    await shot('7-lead');

    // 8. нижняя панель на телефоне: появляется при прокрутке, ведёт в конструктор
    if (w < 800) {
      await p.evaluate(() => scrollTo(0, 1600)); await sleep(1500);
      const bar = await p.evaluate(() => { const b = document.querySelector('.x-bar'); const a = [...b.querySelectorAll('a')].map((x) => x.getAttribute('href')); return { on: b.classList.contains('on'), h: b.getBoundingClientRect().height, a }; });
      ok(bar.on && bar.a.some((h) => /create-3d\/$/.test(h)) && bar.a.some((h) => /wa\.me/.test(h)), E('нижняя панель: видна при прокрутке, «3D» и WhatsApp'), `${Math.round(bar.h)} px`);
      await Promise.all([p.waitForURL(/create-3d\/$/, { timeout: 20000 }), p.locator('.x-bar a[href$="create-3d/"]').first().click()]);
    } else {
      await Promise.all([p.waitForURL(/create-3d\/$/, { timeout: 20000 }), p.locator('.v-nav a[href$="create-3d/"]').first().click()]);
    }

    // 9. снова конструктор без параметров: проект сохранился на этом устройстве
    await step('Модель').waitFor({ timeout: 45000 }); await sleep(2500);
    await step('Заявка').click(); await sleep(1000);
    const again = (await fl.locator('body').innerText()).replace(/\s+/g, ' ');
    const kept = { угловая: /Угловая/.test(again), орех: /Фасады Тёмный орех/.test(again), размер: again.includes(String(after)), интерьер: /Интерьер в проекте:? ?1 предм/.test(again) };
    ok(Object.values(kept).every(Boolean), E('возврат в конструктор: проект сохранился (угловая, орех, размер, интерьер)'), Object.entries(kept).filter(([, v]) => !v).map(([k]) => 'нет: ' + k).join(', ') || (again.match(/Код проекта \S+/) || [''])[0]);
    await shot('8-restored');
    ok(errs.length === 0, E('без ошибок JavaScript'), errs.slice(0, 2).join(' | '));
    ok(cons.length === 0, E('без ошибок в консоли (сайт и конструктор)'), cons.slice(0, 2).join(' | '));
  } catch (e) {
    ok(false, E('путь прерван'), e.message.split('\n')[0]);
    await shot('error').catch(() => {});
  }
  await browser.close();
}

(async () => {
  for (const engine of ENGINES) for (const [w, h] of [[1440, 900], [390, 844]]) await run(engine, w, h);
  console.log(`Сквозной путь: ${BASE}\n` + rows.join('\n') + `\n\nИтог: ${rows.length - failed}/${rows.length}`);
  process.exit(failed ? 1 : 0);
})();
