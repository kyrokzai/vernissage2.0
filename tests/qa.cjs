/*
 * VERNISSAGE 2.0 — функциональные проверки (Playwright, Chromium и WebKit).
 * Запуск: npm run build && npm run preview   →   node tests/qa.cjs [URL] [chromium,webkit] [ширины]
 * Отчёт печатается в консоль; код выхода 1, если есть проваленные проверки.
 */
const pw = require('playwright');
const URL_ = process.argv[2] || 'http://127.0.0.1:4321/vernissage2.0/';
const ENGINES = (process.argv[3] || 'chromium,webkit').split(',');
const WIDTHS = (process.argv[4] || '1920,1440,768,390,375').split(',').map(Number);
const H = { 1920: 1080, 1440: 900, 768: 1024, 390: 844, 375: 812 };
const rows = []; let failed = 0;
const ok = (cond, name, info = '') => { rows.push(`${cond ? '✓' : '✗'} ${name}${info ? ' — ' + info : ''}`); if (!cond) failed++; };

async function page(browser, w, opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: w, height: H[w] || 900 }, hasTouch: w < 800, isMobile: false, reducedMotion: opts.rm ? 'reduce' : 'no-preference' });
  const p = await ctx.newPage();
  const errors = [], bad = [];
  p.on('pageerror', (e) => errors.push(e.message));
  p.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()); });
  p.on('response', (r) => { if (r.status() >= 400) bad.push(r.status() + ' ' + r.url()); });
  return { ctx, p, errors, bad };
}
const scrollAll = async (p) => {
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y <= total; y += 450) { await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(90); }
  await p.waitForTimeout(1200);
};

async function run(engine, w) {
  const browser = await pw[engine].launch();
  const T = `[${engine} ${w}]`;
  const mobile = w < 1160;

  /* 1. загрузка, вступление, горизонтальная прокрутка, ошибки */
  {
    const { ctx, p, errors, bad } = await page(browser, w);
    await p.goto(URL_, { waitUntil: 'networkidle' });
    ok(await p.locator('#intro').isVisible(), `${T} вступление показано`);
    ok(await p.evaluate(() => document.documentElement.classList.contains('lock')), `${T} прокрутка заблокирована во время вступления`);
    await p.waitForTimeout(600);
    await p.mouse.move(w / 2, 300);
    if (mobile) await p.locator('.in-hint').click({ force: true }); else await p.mouse.wheel(0, 300);
    await p.waitForTimeout(2600);
    ok(!(await p.locator('#intro').count()), `${T} вступление открывается (${mobile ? 'кнопка' : 'колесо'}) и удаляется`);
    ok(!(await p.evaluate(() => document.documentElement.classList.contains('lock'))), `${T} блокировка прокрутки снята`);
    await scrollAll(p);
    const ov = await p.evaluate(() => ({ sw: document.documentElement.scrollWidth, iw: innerWidth }));
    ok(ov.sw <= ov.iw, `${T} нет горизонтальной прокрутки`, `${ov.sw} ≤ ${ov.iw}`);
    const lz = await p.evaluate(() => [...document.querySelectorAll('main .lz')].filter((e) => !e.closest('.cyc') && !e.closest('.hero-card')).length);
    ok(lz === 0, `${T} все отложенные фото загрузились при прокрутке`, `осталось ${lz}`);
    const hidden = await p.evaluate(() => [...document.querySelectorAll('[data-r],[data-split]')].filter((e) => !e.classList.contains('in')).length);
    ok(hidden === 0, `${T} все блоки проявились`, `не проявилось ${hidden}`);
    const small = await p.evaluate(() => [...document.querySelectorAll('main a, main button, header a, header button')]
      .filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(e).visibility !== 'hidden' && (r.height < 24 || r.width < 24); })
      .map((e) => (e.textContent || e.className).trim().slice(0, 30)));
    ok(small.length === 0, `${T} размер кликабельных элементов ≥ 24px`, small.join(' | '));
    ok(errors.length === 0, `${T} нет ошибок JavaScript`, errors.slice(0, 3).join(' | '));
    ok(bad.length === 0, `${T} нет ответов 4xx/5xx`, bad.slice(0, 3).join(' | '));
    await ctx.close();
  }

  /* 2. навигация, тема, меню */
  {
    const { ctx, p } = await page(browser, w);
    await p.goto(URL_ + '?nointro', { waitUntil: 'networkidle' });
    const hrefs = await p.$$eval('.nav a, .menu-nav a', (as) => as.map((a) => a.getAttribute('href')));
    const missing = await p.evaluate((hs) => hs.filter((h) => !document.querySelector(h)), hrefs);
    ok(missing.length === 0, `${T} все пункты меню ведут к существующим разделам`, missing.join(','));
    if (mobile) {
      ok(await p.locator('#menu-btn').isVisible(), `${T} кнопка меню видна`);
      await p.locator('#menu-btn').click({ force: true }); await p.waitForTimeout(700);
      ok(await p.locator('#menu').isVisible(), `${T} меню открывается`);
      await p.locator('.menu-nav a[href="#faq"]').click({ force: true }); await p.waitForTimeout(2500);
      ok(!(await p.locator('#menu').isVisible()), `${T} меню закрывается после выбора пункта`);
      const top = await p.evaluate(() => document.getElementById('faq').getBoundingClientRect().top);
      ok(Math.abs(top) < 200, `${T} переход к разделу из меню`, `top=${Math.round(top)}`);
      await p.locator('#menu-btn').click({ force: true }); await p.waitForTimeout(500); await p.keyboard.press('Escape'); await p.waitForTimeout(600);
      ok(!(await p.locator('#menu').isVisible()), `${T} Esc закрывает меню`);
    } else ok(await p.locator('.nav').isVisible(), `${T} навигация в шапке видна`);
    await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await p.locator('#theme-btn').click({ force: true }); await p.waitForTimeout(1400);
    ok((await p.getAttribute('html', 'data-theme')) === 'light', `${T} переключение на светлую тему`);
    await p.reload({ waitUntil: 'networkidle' });
    ok((await p.getAttribute('html', 'data-theme')) === 'light', `${T} тема запоминается после перезагрузки`);
    const bg = await p.evaluate(() => getComputedStyle(document.body).backgroundColor);
    ok(bg === 'rgb(246, 242, 234)', `${T} светлый фон страницы`, bg);
    await p.locator('#theme-btn').click({ force: true }); await p.waitForTimeout(1400);
    ok((await p.getAttribute('html', 'data-theme')) === 'dark', `${T} возврат к тёмной теме`);
    await ctx.close();
  }

  /* 3. квиз */
  {
    const { ctx, p, errors } = await page(browser, w);
    await p.goto(URL_ + '?nointro', { waitUntil: 'networkidle' });
    await p.locator('#quiz').scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
    await p.locator('#q-next').click({ force: true });
    ok((await p.locator('.q-err-nav').textContent()).includes('Выберите'), `${T} квиз: пустой шаг не пропускается, есть подсказка`);
    await p.locator('label.opt:has(input[value="Квартира в новостройке"])').click({ force: true }); await p.waitForTimeout(700);
    ok((await p.locator('#q-label').textContent()) === 'Шаг 2 из 5', `${T} квиз: автопереход после выбора объекта`);
    await p.locator('label.opt:has(input[value="Ремонт"])').click({ force: true });
    await p.locator('#q-next').click({ force: true }); await p.waitForTimeout(500);
    await p.locator('#area-num').fill('1500'); await p.locator('#q-next').click({ force: true }); await p.waitForTimeout(200);
    ok((await p.locator('#area-err').textContent()).includes('от 20 до 1000'), `${T} квиз: проверка площади`);
    await p.locator('#area-num').fill('120'); await p.locator('#q-next').click({ force: true }); await p.waitForTimeout(500);
    await p.locator('#q-back').click({ force: true }); await p.waitForTimeout(400);
    ok((await p.locator('#q-label').textContent()) === 'Шаг 3 из 5' && (await p.inputValue('#area-num')) === '120', `${T} квиз: «Назад» сохраняет ответы`);
    await p.locator('#q-next').click({ force: true }); await p.waitForTimeout(400);
    await p.locator('label.opt:has(input[value="В ближайшее время"])').click({ force: true }); await p.waitForTimeout(700);
    await p.locator('#q-name').fill('Айгерим');
    await p.locator('#q-phone').click({ force: true }); await p.keyboard.type('87071234567');
    ok((await p.inputValue('#q-phone')) === '+7 (707) 123-45-67', `${T} квиз: маска телефона +7`, await p.inputValue('#q-phone'));
    await p.locator('#q-next').click({ force: true }); await p.waitForTimeout(300);
    ok(await p.locator('#q-result').isHidden(), `${T} квиз: без согласия заявка не собирается`);
    await p.locator('#q-consent').check(); await p.locator('#q-next').click({ force: true }); await p.waitForTimeout(1200);
    ok(await p.locator('#q-result').isVisible(), `${T} квиз: итоговая сводка`);
    const est = await p.locator('#r-est-val').textContent();
    ok(est === 'Ремонт от 8 400 000 ₸', `${T} квиз: ориентировочный расчёт 120 м² × 70 000 ₸`, est);
    ok((await p.locator('#r-est .est-k').textContent()).includes('не окончательная'), `${T} квиз: цена помечена как ориентировочная`);
    const wa = await p.getAttribute('#r-wa', 'href');
    const msg = decodeURIComponent(wa.split('text=')[1] || '');
    ok(wa.startsWith('https://wa.me/77475613005?text=') && msg.includes('Площадь: 120 м²') && msg.includes('+7 (707) 123-45-67'), `${T} квиз: готовое сообщение в WhatsApp`);
    await p.locator('#r-again').click({ force: true }); await p.waitForTimeout(400);
    ok((await p.locator('#q-label').textContent()) === 'Шаг 1 из 5', `${T} квиз: «Пройти заново»`);
    await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await p.locator('.strip a[data-pick="Мебель на заказ"]').dispatchEvent('click'); await p.waitForTimeout(1200);
    ok((await p.locator('#q-pick').textContent()).includes('Мебель на заказ'), `${T} квиз: выбор услуги из полосы услуг`);
    ok(errors.length === 0, `${T} квиз без ошибок JavaScript`, errors.join(' | '));
    await ctx.close();
  }

  /* 4. галереи и FAQ */
  {
    const { ctx, p, errors } = await page(browser, w);
    await p.goto(URL_ + '?nointro', { waitUntil: 'networkidle' });
    await p.locator('.bt[data-gal="wardrobe"]').scrollIntoViewIfNeeded(); await p.waitForTimeout(500);
    await p.locator('.bt[data-gal="wardrobe"]').click({ force: true }); await p.waitForTimeout(700);
    ok(await p.locator('#lb').evaluate((e) => e.classList.contains('on')), `${T} галерея открывается`);
    const n0 = await p.locator('#lb-count').textContent();
    const demo0 = await p.locator('#lb-demo').isVisible();
    if (mobile) {
      const box = await p.locator('#lb-stage').boundingBox();
      await p.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2); await p.mouse.down();
      for (let i = 1; i <= 8; i++) await p.mouse.move(box.x + box.width * (0.8 - i * 0.07), box.y + box.height / 2);
      await p.mouse.up(); await p.waitForTimeout(900);
    } else { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(900); }
    const n1 = await p.locator('#lb-count').textContent();
    ok(n0.startsWith('1 /') && n1.startsWith('2 /'), `${T} галерея листается (${mobile ? 'свайп' : 'стрелка'})`, `${n0} → ${n1}`);
    ok(demo0 && await p.locator('#lb-demo').isHidden(), `${T} демо-фото помечено в галерее, реальное — без пометки`);
    await p.keyboard.press('Escape'); await p.waitForTimeout(600);
    ok(!(await p.locator('#lb').evaluate((e) => e.classList.contains('on'))), `${T} Esc закрывает галерею`);
    await p.locator('.cs[data-case="jacadi"]').scrollIntoViewIfNeeded(); await p.locator('.cs[data-case="jacadi"]').click({ force: true }); await p.waitForTimeout(700);
    ok((await p.locator('#lb-title').textContent()).includes('Jacadi') && await p.locator('#lb-demo').isHidden(), `${T} кейс Jacadi — реальная работа, без пометки «демо»`);
    await p.locator('#lb-x').click({ force: true }); await p.waitForTimeout(500);
    await p.locator('.pf').first().scrollIntoViewIfNeeded(); await p.locator('.pf').first().click({ force: true }); await p.waitForTimeout(700);
    for (let i = 0; i < 6; i++) { await p.keyboard.press('ArrowRight'); await p.waitForTimeout(950); }
    const vid = await p.evaluate(() => { const v = document.querySelector('.lb-slide.cur video'); return v ? { src: !!v.currentSrc, paused: v.paused } : null; });
    ok(vid && vid.src, `${T} видео в галерее портфолио подключается`, JSON.stringify(vid));
    await p.keyboard.press('Escape'); await p.waitForTimeout(400);
    const det = p.locator('#faq details').nth(2);
    await det.scrollIntoViewIfNeeded(); await det.locator('summary').click({ force: true }); await p.waitForTimeout(300);
    ok(await det.evaluate((d) => d.open), `${T} FAQ раскрывается`);
    ok(errors.length === 0, `${T} галереи без ошибок JavaScript`, errors.join(' | '));
    await ctx.close();
  }

  /* 5. блок «От детали — к целому» и видео */
  {
    const { ctx, p } = await page(browser, w);
    await p.goto(URL_ + '?nointro', { waitUntil: 'networkidle' });
    const r = await p.evaluate(() => { const s = document.getElementById('detail'); return { t: s.getBoundingClientRect().top + scrollY, span: s.offsetHeight - innerHeight }; });
    await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round(r.t + r.span * 0.68)); await p.waitForTimeout(2200);
    const v = await p.evaluate(() => { const v = document.querySelector('.dw-video'); return { src: v.currentSrc.split('/').pop(), paused: v.paused, t: v.currentTime }; });
    ok(v.src && !v.paused && v.t > 0, `${T} видео интерьера воспроизводится`, JSON.stringify(v));
    ok(await p.locator('.dw-ch li.on h3').textContent() === 'Детали складываются в целое', `${T} главы меняются по прокрутке`);
    await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), Math.round(r.t + r.span * 0.99)); await p.waitForTimeout(800);
    const q = await p.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.dw-final')).getPropertyValue('--q')));
    ok(q > 0.95, `${T} финал: знак VERNISSAGE`, 'q=' + q);
    await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' })); await p.waitForTimeout(800);
    ok(await p.evaluate(() => document.querySelector('.dw-video').paused), `${T} видео ставится на паузу вне экрана`);
    await ctx.close();
  }

  /* 6. уменьшение движения */
  {
    const { ctx, p, errors } = await page(browser, w, { rm: true });
    await p.goto(URL_, { waitUntil: 'networkidle' });
    await p.locator('.in-hint').click({ force: true }); await p.waitForTimeout(400);
    ok(!(await p.locator('#intro').count()), `${T} reduced motion: вступление закрывается сразу`);
    const dw = await p.evaluate(() => getComputedStyle(document.querySelector('.dw-pin')).position === 'relative' && getComputedStyle(document.querySelector('.dw-stage')).display === 'none');
    ok(dw, `${T} reduced motion: авторский блок статичен`);
    const auto = await p.evaluate(() => [...document.querySelectorAll('video')].some((v) => !v.paused));
    ok(!auto, `${T} reduced motion: видео не запускается само`);
    await scrollAll(p);
    const vis = await p.evaluate(() => [...document.querySelectorAll('[data-r]')].every((e) => getComputedStyle(e).opacity === '1'));
    ok(vis, `${T} reduced motion: все блоки видны`);
    ok(errors.length === 0, `${T} reduced motion: нет ошибок`, errors.join(' | '));
    await ctx.close();
  }

  /* 7. клавиатура и ссылки */
  {
    const { ctx, p } = await page(browser, w);
    await p.goto(URL_ + '?nointro', { waitUntil: 'networkidle' });
    await p.keyboard.press('Tab');
    const first = await p.evaluate(() => document.activeElement?.className);
    ok(first === 'skip', `${T} первый Tab — «Перейти к содержимому»`, first);
    const links = await p.$$eval('a[href]', (as) => as.map((a) => ({ h: a.getAttribute('href'), t: a.target, r: a.rel })));
    const ext = links.filter((l) => /^https?:/.test(l.h));
    ok(ext.every((l) => l.t === '_blank' && l.r.includes('noopener')), `${T} внешние ссылки открываются в новой вкладке с noopener`);
    ok(links.some((l) => l.h === 'tel:+77475613005'), `${T} телефон — ссылка tel:`);
    ok(links.some((l) => l.h.startsWith('https://wa.me/77475613005')), `${T} ссылка WhatsApp`);
    ok(links.some((l) => l.h.includes('2gis.kz')) && links.some((l) => l.h.includes('instagram.com/company_vernissage')), `${T} 2ГИС и соцсети`);
    const hashes = links.filter((l) => l.h.startsWith('#') && l.h.length > 1).map((l) => l.h);
    const dead = await p.evaluate((hs) => [...new Set(hs)].filter((h) => !document.querySelector(h)), hashes);
    ok(dead.length === 0, `${T} все якорные ссылки ведут на разделы`, dead.join(','));
    await ctx.close();
  }
  await browser.close();
}

(async () => {
  for (const e of ENGINES) for (const w of WIDTHS) {
    try { await run(e, w); } catch (err) { ok(false, `[${e} ${w}] исключение`, err.message.split('\n').slice(0, 4).join(' ~ ')); }
  }
  console.log(rows.join('\n'));
  console.log(`\nИтого: ${rows.length - failed} из ${rows.length} проверок пройдено, провалено ${failed}.`);
  process.exit(failed ? 1 : 0);
})();
