/*
 * M3.1 Interactive Kitchen Assembly — функциональные и визуальные проверки (Playwright).
 * Запуск: pnpm preview  →  node tests/m31.cjs [папка-результатов] [URL] [браузер]
 * По умолчанию: test-results, http://127.0.0.1:4173/m31.html, chromium.
 */
const pw = require("playwright");
const fs = require("fs");
const OUT = process.argv[2] || "test-results";
const BASE_URL = process.argv[3] || "http://127.0.0.1:4173/m31.html";
const BROWSER = process.argv[4] || "chromium";
fs.mkdirSync(`${OUT}/m31`, { recursive: true });

const results = [];
const log = (name, ok, evidence = "", note = "") => results.push({ name, ok, evidence, note });

/* Инструментирование: счётчик слушателей window, перехват необработанных промисов. */
const INIT = () => {
  const counts = {};
  const add = window.addEventListener.bind(window), rem = window.removeEventListener.bind(window);
  window.addEventListener = (t, f, o) => { counts[t] = (counts[t] || 0) + 1; return add(t, f, o); };
  window.removeEventListener = (t, f, o) => { counts[t] = (counts[t] || 0) - 1; return rem(t, f, o); };
  window.__listeners = counts;
  window.__rejections = [];
  add("unhandledrejection", (e) => window.__rejections.push(String(e.reason)));
};

async function open(browser, opts = {}, url = BASE_URL) {
  const ctx = await browser.newContext({ deviceScaleFactor: 1, ...opts });
  const page = await ctx.newPage();
  const console_ = [];
  page.on("pageerror", (e) => console_.push("pageerror: " + e.message));
  page.on("console", (m) => { if (["error", "warning"].includes(m.type())) console_.push(m.type() + ": " + m.text()); });
  page.on("requestfailed", (r) => console_.push("requestfailed: " + r.url()));
  await page.addInitScript(INIT);
  await page.goto(url);
  await page.waitForTimeout(700);
  return { ctx, page, console_ };
}
const range = (page) => page.evaluate(() => { const t = document.querySelector(".m31-track"); return { top: t.getBoundingClientRect().top + scrollY, len: t.offsetHeight - innerHeight }; });
async function goP(page, p, wait = 1500) { const r = await range(page); await page.evaluate((y) => scrollTo(0, y), Math.round(r.top + p * r.len)); if (wait) await page.waitForTimeout(wait); }
const code = (page) => page.textContent(".m31-code");
const pct = (page) => page.evaluate(() => Number(document.querySelector(".m31-range input").value) / 10);
/** Снимок состояния сцены: все атрибуты, которые меняет драйвер. */
const snapshot = (page) => page.evaluate(() => [...document.querySelectorAll("[data-el]")].filter((el) => el.style.display !== "none").map((el) => {
  const c = el.querySelector("[data-clip]");
  return [el.dataset.el, el.style.display, el.getAttribute("transform"), el.getAttribute("opacity"), el.style.transform, el.style.opacity, el.style.clipPath,
    c ? ["x", "y", "width", "height"].map((a) => c.getAttribute(a)).join(",") : ""].join("|");
}).join("\n"));
/** Экранные координаты ключевых элементов (с учётом трансформаций). */
const rects = (page, ids) => page.evaluate((ids) => Object.fromEntries(ids.map((id) => {
  const el = id === "SCENE" ? document.querySelector(".m31-scene") : document.querySelector(`[data-el="${id}"]`);
  if (!el || el.style.display === "none") return [id, null];
  // Координаты относительно закреплённой секции: исключают субпиксельное «прилипание» sticky на стадии 0
  const st = document.querySelector(".m31-stage").getBoundingClientRect();
  const r = el.getBoundingClientRect();
  return [id, [r.x - st.x, r.y - st.y, r.width, r.height].map((n) => Math.round(n * 10) / 10)];
})), ids);

(async () => {
  const browser = await pw[BROWSER].launch();
  const allConsole = [];

  /* ── 1. Размеры экранов ── */
  const VPS = [
    ["desktop-1920x1080", 1920, 1080, "desktop"], ["desktop-1440x900", 1440, 900, "desktop"], ["desktop-1366x768", 1366, 768, "desktop"],
    ["tablet-1024x768", 1024, 768, "desktop"], ["tablet-820x1180", 820, 1180, "stack"], ["tablet-1180x820", 1180, 820, "desktop"],
    ["mobile-430x932", 430, 932, "phone"], ["mobile-390x844", 390, 844, "phone"], ["mobile-375x667", 375, 667, "phone"],
    ["mobile-844x390-landscape", 844, 390, "landscape"], ["mobile-932x430-landscape", 932, 430, "landscape"],
  ];
  const FULL = new Set(["desktop-1920x1080", "desktop-1440x900", "mobile-390x844", "mobile-375x667", "mobile-844x390-landscape"]);
  for (const [n, w, h, lay] of VPS) {
    const mobile = w < 1000 && (w <= 600 || h <= 520);
    const { ctx, page, console_ } = await open(browser, { viewport: { width: w, height: h }, hasTouch: mobile, isMobile: mobile && BROWSER === "chromium" });
    const layout = await page.evaluate(() => [...document.querySelector(".m31").classList].find((c) => c.startsWith("lay-")));
    await goP(page, 0.5);
    const geo = await page.evaluate(() => {
      const de = document.documentElement, s = document.querySelector(".m31-scene").getBoundingClientRect(), pnl = document.querySelector(".m31-panel").getBoundingClientRect();
      const btns = [...document.querySelectorAll(".m31-panel button, .m31-range input")].filter((b) => b.offsetParent).map((b) => { const r = b.getBoundingClientRect(); return Math.min(r.width, r.height); });
      return { sw: de.scrollWidth, cw: de.clientWidth, ih: innerHeight, iw: innerWidth, s: [s.left, s.top, s.right, s.bottom], p: [pnl.left, pnl.top, pnl.right, pnl.bottom], minBtn: Math.min(...btns) };
    });
    const overlap = lay === "landscape" ? geo.s[2] > geo.p[0] + 1 : geo.s[3] > geo.p[1] + 1;
    const inside = geo.p[3] <= geo.ih + 1 && geo.p[2] <= geo.iw + 1;
    log(`${n}: раскладка`, layout === `lay-${lay}`, layout);
    log(`${n}: нет горизонтального переполнения`, geo.sw <= geo.cw, `${geo.sw}/${geo.cw}`);
    log(`${n}: панель не перекрывает сцену и видна целиком`, !overlap && inside, `сцена ${geo.s.map(Math.round)}, панель ${geo.p.map(Math.round)}, окно ${geo.iw}×${geo.ih}`);
    log(`${n}: размер элементов управления`, geo.minBtn >= 28, `минимальная сторона ${Math.round(geo.minBtn)} px`, "кнопки этапов 28–34 px, основные кнопки 44–48 px");
    const stages = FULL.has(n) ? [0, 1, 2, 3, 4, 5] : [0, 2, 5];
    let labels = true;
    for (const k of stages) {
      await goP(page, k / 5, 1700);
      const c = await code(page);
      if (!c.startsWith(`STAGE ${k}`)) labels = false;
      await page.locator(".m31-stage").screenshot({ path: `${OUT}/m31/${n}-stage${k}.png` });
    }
    log(`${n}: этапы ${stages.join(",")} и их названия`, labels, `скриншоты ${OUT}/m31/${n}-stage*.png`);
    allConsole.push(...console_.map((c) => `${n}: ${c}`));
    await ctx.close();
  }

  /* ── 2. Функциональные проверки (компьютер и смартфон) ── */
  for (const [n, w, h] of [["1440x900", 1440, 900], ["390x844", 390, 844]]) {
    const mobile = w < 600;
    const { ctx, page, console_ } = await open(browser, { viewport: { width: w, height: h }, hasTouch: mobile });
    // На смартфоне — настоящие касания (проверка гонки touchstart → click на кнопках панели)
    const press = (sel, i = 0) => (mobile ? page.locator(sel).nth(i).tap() : page.locator(sel).nth(i).click());
    const ids = ["SCENE", "carcass-0", "carcass-1", "island-carcass", "facade-0", "facade-5", "upper-2", "island-top", "backsplash", "oven-1", "oven-4", "handle-0", "pendant-1", "stool-1"];

    // Вперёд / назад: одинаковое состояние при одинаковом прогрессе
    await goP(page, 0.37, 1800); const fwd = await snapshot(page);
    await goP(page, 0.9, 1800); await goP(page, 0.37, 2200); const back = await snapshot(page);
    log(`${n}: прокрутка назад разбирает в то же состояние`, fwd === back, `снимок ${fwd.split("\n").length} элементов`);

    // Остановка на промежуточном моменте
    await goP(page, 0.43, 1800); const s1 = await snapshot(page); await page.waitForTimeout(1000); const s2 = await snapshot(page);
    log(`${n}: остановка фиксирует промежуточное состояние`, s1 === s2, `прогресс ${await pct(page)}%`);

    // Геометрия: на каждой завершённой стадии все элементы стоят в финальных координатах
    let moved = 0; const seen = {};
    for (let k = 0; k <= 5; k++) {
      await goP(page, k / 5, 2000);
      moved += await page.evaluate(() => [...document.querySelectorAll('svg [data-el][transform]')].filter((g) => g.style.display !== "none" && g.getAttribute("transform") !== "translate(0 0)").length);
      const r = await rects(page, ids);
      for (const [id, v] of Object.entries(r)) if (v) (seen[id] ||= []).push(v.join(","));
    }
    const drift = Object.entries(seen).filter(([, v]) => new Set(v).size > 1).map(([id]) => id);
    log(`${n}: геометрия — смещённых элементов на стадиях 0–5`, moved === 0, String(moved));
    log(`${n}: геометрия — кадр сцены, корпуса, фасады, столешница, техника не меняют положение и размер между стадиями`, drift.length === 0, drift.length ? drift.join(", ") : `${Object.keys(seen).length} элементов совпадают на всех стадиях, где видимы`);

    // Быстрая прокрутка
    const r = await range(page);
    await page.evaluate((r) => { scrollTo(0, r.top + r.len); scrollTo(0, r.top); scrollTo(0, r.top + 0.62 * r.len); }, r);
    await page.waitForTimeout(2200); const fast = await snapshot(page);
    const { ctx: c2, page: p2 } = await open(browser, { viewport: { width: w, height: h } });
    await goP(p2, 0.62, 2200); const direct = await snapshot(p2); await c2.close();
    log(`${n}: быстрая прокрутка не ломает последовательность`, fast === direct, "состояние совпало с прямым переходом на 62%");

    // Ручной переход к этапам
    let manual = true;
    for (const k of [5, 0, 3, 1, 4, 2]) { await press(".m31-tick", k); await page.waitForTimeout(1300); if (!(await code(page)).startsWith(`STAGE ${k}`)) manual = false; }
    log(`${n}: ручной переход к этапам 5,0,3,1,4,2`, manual);

    // Restart
    await press(".m31-tick", 5); await page.waitForTimeout(1300);
    await press(".m31-btn"); await page.waitForTimeout(1900);
    const rs = await page.evaluate(() => ({ y: scrollY, top: document.querySelector(".m31-track").getBoundingClientRect().top + scrollY }));
    log(`${n}: Restart возвращает в начало без перезагрузки`, (await code(page)).startsWith("STAGE 0") && Math.abs(rs.y - rs.top) < 2 && (await pct(page)) === 0, `scrollY ${Math.round(rs.y)} = начало дорожки ${Math.round(rs.top)}`);

    // Play / Pause / повторный запуск / остановка прокруткой
    await press(".m31-play"); await page.waitForTimeout(1500);
    const pl1 = await pct(page), pressed = await page.getAttribute(".m31-play", "aria-pressed");
    await press(".m31-play"); const y0 = await page.evaluate(() => scrollY); await page.waitForTimeout(900); const y1 = await page.evaluate(() => scrollY); const pa1 = await pct(page); await page.waitForTimeout(1000); const pa2 = await pct(page);
    log(`${n}: Play запускает, Pause останавливает`, pl1 > 0 && pressed === "true" && y0 === y1 && pa1 === pa2 && (await page.getAttribute(".m31-play", "aria-pressed")) === "false", `прогресс через 1,5 с: ${pl1}%; после паузы прокрутка стоит (${Math.round(y0)}), сцена дошла до ${pa2}% и замерла`);
    await press(".m31-play"); await page.waitForTimeout(1200); const re = await pct(page);
    if (mobile) await page.touchscreen.tap(5, 5).catch(() => {}); // касание вне панели
    await page.mouse.move(w / 2, h / 3); await page.mouse.wheel(0, 40); await page.waitForTimeout(300);
    const st1 = await page.evaluate(() => scrollY); await page.waitForTimeout(800); const st2 = await page.evaluate(() => scrollY);
    log(`${n}: повторный Play продолжает, прокрутка посетителя останавливает автопоказ`, re > pa2 && Math.abs(st2 - st1) < 2 && (await page.getAttribute(".m31-play", "aria-pressed")) === "false", `продолжил с ${pa2}% до ${re}%`);
    await press(".m31-tick", 5); await page.waitForTimeout(1300); await press(".m31-play"); await page.waitForTimeout(1200);
    log(`${n}: Play в конце начинает сборку сначала`, (await pct(page)) < 40 && (await pct(page)) > 0, `прогресс ${await pct(page)}%`);
    await press(".m31-play");

    // 10 повторных запусков
    const before = await page.evaluate(() => ({ ...window.__listeners }));
    for (let i = 0; i < 10; i++) { await press(".m31-btn"); await page.waitForTimeout(250); await press(".m31-tick", 5); await page.waitForTimeout(250); }
    await page.waitForTimeout(1500);
    const after = await page.evaluate(() => ({ ...window.__listeners }));
    log(`${n}: 10 повторных запусков — слушатели не накапливаются, состояние верное`, JSON.stringify(before) === JSON.stringify(after) && (await code(page)).startsWith("STAGE 5"), `scroll ${before.scroll}→${after.scroll}, resize ${before.resize}→${after.resize}`);

    // 10 повторных монтирований модуля
    const b0 = await page.evaluate(() => ({ ...window.__listeners }));
    for (let i = 0; i < 10; i++) { await page.evaluate(() => window.__m31.remount()); await page.waitForTimeout(150); }
    await page.waitForTimeout(800);
    const b1 = await page.evaluate(() => ({ ...window.__listeners }));
    const ok = ["scroll", "resize", "wheel", "touchstart", "keydown", "pageshow", "orientationchange"].every((t) => (b0[t] || 0) === (b1[t] || 0));
    log(`${n}: 10 повторных монтирований — без утечек слушателей`, ok, `scroll ${b0.scroll}→${b1.scroll}, wheel ${b0.wheel}→${b1.wheel}`);
    await goP(page, 0.6, 1800);
    log(`${n}: после повторного монтирования сцена работает`, (await code(page)).startsWith("STAGE 3"), await code(page));

    // Клавиатура
    await page.evaluate(() => document.activeElement && document.activeElement.blur());
    await page.locator(".m31-play").focus(); await page.keyboard.press("Tab");
    const focusInfo = await page.evaluate(() => { const a = document.activeElement; const cs = getComputedStyle(a); return { cls: a.className, outline: cs.outlineStyle + " " + cs.outlineWidth }; });
    await page.locator(".m31-play").focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(500);
    const kbPlay = await page.getAttribute(".m31-play", "aria-pressed"); await page.keyboard.press("Enter");
    await page.locator(".m31-tick").nth(1).focus(); await page.keyboard.press("Enter"); await page.waitForTimeout(1300);
    const kbStage = await code(page);
    await page.locator(".m31-range input").focus(); for (let i = 0; i < 5; i++) await page.keyboard.press("PageUp"); await page.waitForTimeout(1200);
    log(`${n}: клавиатура — Tab, видимый фокус, Enter, стрелки ползунка`, kbPlay === "true" && kbStage.startsWith("STAGE 1") && !focusInfo.outline.startsWith("none"), `фокус: ${focusInfo.outline}; после PageUp ${await pct(page)}%`);

    // Resize и поворот
    await press(".m31-tick", 3); await page.waitForTimeout(1300);
    await page.setViewportSize(mobile ? { width: h, height: w } : { width: 390, height: 844 }); await page.waitForTimeout(1500);
    const rz = await page.evaluate(() => {
      const t = document.querySelector(".m31-track"), top = t.getBoundingClientRect().top + scrollY, len = t.offsetHeight - innerHeight;
      return { fromScroll: Math.round(Math.min(1, Math.max(0, (scrollY - top) / len)) * 1000) / 10, ui: Number(document.querySelector(".m31-range input").value) / 10, lay: [...document.querySelector(".m31").classList].find((c) => c.startsWith("lay-")), sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth };
    });
    log(`${n}: ${mobile ? "поворот экрана" : "resize окна"} — прогресс пересчитан по прокрутке`, Math.abs(rz.fromScroll - rz.ui) <= 1 && rz.sw <= rz.cw, `${rz.lay}, прогресс по прокрутке ${rz.fromScroll}% = индикатор ${rz.ui}%`);
    await page.setViewportSize({ width: w, height: h }); await page.waitForTimeout(800);

    // Reduced Motion: переключатель
    await page.getByRole("button", { name: "Reduced Motion" }).click(); await page.waitForTimeout(300);
    await goP(page, 0.47, 400);
    const partial = await page.evaluate(() => [...document.querySelectorAll('svg [data-el][transform]')].filter((g) => g.style.display !== "none" && g.getAttribute("transform") !== "translate(0 0)").length);
    const rmStage = await code(page);
    await press(".m31-tick", 0); await page.waitForTimeout(300);
    await press(".m31-play"); await page.waitForTimeout(2900); const rs1 = await code(page); await page.waitForTimeout(2700); const rs2 = await code(page);
    await press(".m31-play");
    log(`${n}: Reduced Motion — этапы без промежуточного движения, автопоказ по шагам`, partial === 0 && rmStage.startsWith("STAGE 2") && rs1.startsWith("STAGE 1") && rs2.startsWith("STAGE 2"), `на 47%: ${rmStage.slice(0, 7)}, движущихся элементов ${partial}; автопоказ: ${rs1.slice(0, 7)} → ${rs2.slice(0, 7)}`);
    await page.getByRole("button", { name: "Full Experience" }).click(); await page.waitForTimeout(300);
    const rej = await page.evaluate(() => window.__rejections);
    log(`${n}: нет необработанных ошибок промисов`, rej.length === 0, rej.join("; "));
    allConsole.push(...console_.map((c) => `${n}: ${c}`));
    await ctx.close();
  }

  /* ── 3. Системная настройка prefers-reduced-motion ── */
  {
    const { ctx, page, console_ } = await open(browser, { viewport: { width: 1440, height: 900 }, reducedMotion: "reduce" });
    const pressed = await page.getAttribute('button:has-text("Reduced Motion")', "aria-pressed");
    log("prefers-reduced-motion: режим включается автоматически", pressed === "true", `aria-pressed=${pressed}`);
    allConsole.push(...console_); await ctx.close();
  }

  /* ── 4. Ассеты: фото-режим и отказ загрузки ── */
  {
    // Кадры-заглушки для проверки конвейера: снимки демо-сцены на каждой стадии (только в памяти теста)
    const { ctx, page } = await open(browser, { viewport: { width: 1600, height: 1000 } });
    const plates = [];
    for (let k = 0; k <= 5; k++) { await goP(page, k / 5, 1700); plates.push(await page.locator(".m31-scene").screenshot({ type: "png" })); }
    await ctx.close();
    const { ctx: c1, page: p1, console_: k1 } = await open(browser, { viewport: { width: 1440, height: 900 } }, "about:blank");
    await p1.route((u) => /^\/test-plates\/stage-\d\.png$/.test(u.pathname), (route) => {
      const n = Number(new URL(route.request().url()).pathname.match(/stage-(\d)/)[1]);
      route.fulfill({ status: 200, contentType: "image/png", body: plates[n] });
    });
    await p1.goto(BASE_URL + "?plates=/test-plates/stage-{n}.png"); await p1.waitForTimeout(1500);
    const tag = await p1.textContent(".m31-tag");
    await goP(p1, 0.5, 1500); const plateState = await p1.evaluate(() => [1, 2, 3, 4, 5].map((k) => { const el = document.querySelector(`[data-el="plate-${k}"]`); return el.style.display === "none" ? "скрыт" : el.style.clipPath || "полностью"; }).join(" | "));
    await p1.locator(".m31-scene").screenshot({ path: `${OUT}/m31/photo-mode-50.png` });
    log("Ассеты: фото-режим загружает 6 кадров и раскрывает их маской по ходу монтажа", tag.includes("Фото") && plateState.includes("inset"), `${tag}; кадры 1–5 на 50%: ${plateState}`);
    allConsole.push(...k1.map((c) => "photo: " + c)); await c1.close();

    const { ctx: c2, page: p2, console_: k2 } = await open(browser, { viewport: { width: 1440, height: 900 } }, BASE_URL + "?plates=/missing/stage-{n}.webp");
    await p2.waitForTimeout(1500);
    const note = await p2.locator(".m31-tag-warn").textContent().catch(() => "");
    const demo = await p2.locator(".m31-svg").count();
    const rej = await p2.evaluate(() => window.__rejections);
    log("Ассеты: при ошибке загрузки — демо-режим с пояснением, без необработанных ошибок", demo === 1 && note.includes("демонстрационный") && rej.length === 0, note);
    // Ошибки 404 этого сценария ожидаемы и в общий счёт консоли не входят
    await c2.close(); void k2;
  }

  await browser.close();
  log("Консоль: нет ошибок, предупреждений React, сбоев загрузки ресурсов", allConsole.length === 0, allConsole.length ? allConsole.slice(0, 5).join(" | ") : `проверено ${VPS.length + 4} сессий`);

  const pass = results.filter((r) => r.ok).length;
  const lines = results.map((r) => `${r.ok ? "PASS" : "FAIL"}  ${r.name}${r.evidence ? "  — " + r.evidence : ""}${r.note ? "  (" + r.note + ")" : ""}`);
  lines.push(`\nИтого: ${pass} из ${results.length} (${BROWSER})`);
  fs.writeFileSync(`${OUT}/m31-report.txt`, lines.join("\n") + "\n");
  console.log(lines.join("\n"));
  process.exitCode = pass === results.length ? 0 : 1;
})();
