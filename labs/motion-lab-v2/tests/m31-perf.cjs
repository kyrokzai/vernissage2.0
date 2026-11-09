/*
 * M3.1 — замеры производительности (Chromium, headless, программная отрисовка без GPU).
 * Запуск: pnpm preview  →  node tests/m31-perf.cjs [URL]
 */
const { chromium } = require("playwright");
const URL_ = process.argv[2] || "http://127.0.0.1:4173/m31.html";

const OBSERVE = () => {
  window.__lcp = 0; window.__cls = 0; window.__long = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration); }).observe({ type: "longtask", buffered: true });
};

(async () => {
  const b = await chromium.launch();
  const rows = [];
  for (const [name, w, h, cpu] of [["Компьютер 1440×900", 1440, 900, 1], ["Смартфон 390×844, CPU ×4 медленнее", 390, 844, 4]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } });
    const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    if (cpu > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate: cpu });
    await p.addInitScript(OBSERVE);
    await p.goto(URL_, { waitUntil: "load" });
    await p.waitForTimeout(1500);
    const lcp = await p.evaluate(() => window.__lcp);
    const clsLoad = await p.evaluate(() => window.__cls);

    // Автопоказ на всю сборку: интервалы кадров, длинные задачи, перерисовки панели React
    const r = await p.evaluate(() => { const t = document.querySelector(".m31-track"); return { top: t.getBoundingClientRect().top + scrollY }; });
    await p.evaluate((y) => scrollTo(0, y), Math.ceil(r.top)); await p.waitForTimeout(800);
    await p.evaluate(() => { window.__long = []; window.__mut = 0; new MutationObserver((m) => { window.__mut += m.length; }).observe(document.querySelector(".m31-status"), { subtree: true, childList: true, characterData: true }); });
    await p.locator(".m31-play").click();
    const frames = await p.evaluate(() => new Promise((res) => {
      const d = []; let last = performance.now(); const t0 = last;
      const f = (now) => { d.push(now - last); last = now; if (now - t0 < 6000) requestAnimationFrame(f); else res(d); };
      requestAnimationFrame(f);
    }));
    await p.locator(".m31-play").click();
    frames.sort((a, b) => a - b);
    const q = (x) => frames[Math.min(frames.length - 1, Math.floor(frames.length * x))].toFixed(1);
    const long = await p.evaluate(() => window.__long);
    const mut = await p.evaluate(() => window.__mut);
    const pct = await p.evaluate(() => Number(document.querySelector(".m31-range input").value) / 10);

    // CLS за полную прокрутку и память после 10 полных прогонов
    const heap0 = await p.evaluate(() => (performance.memory ? performance.memory.usedJSHeapSize : 0));
    for (let i = 0; i < 10; i++) {
      await p.locator(".m31-tick").nth(5).click(); await p.waitForTimeout(1000);
      await p.locator(".m31-btn").click(); await p.waitForTimeout(1300);
    }
    await cdp.send("HeapProfiler.collectGarbage");
    const heap1 = await p.evaluate(() => (performance.memory ? performance.memory.usedJSHeapSize : 0));
    const clsAll = await p.evaluate(() => window.__cls);

    rows.push(
      `${name}`,
      `  LCP: ${Math.round(lcp)} мс   CLS при загрузке: ${clsLoad.toFixed(4)}   CLS после всей прокрутки и 10 прогонов: ${clsAll.toFixed(4)}`,
      `  Автопоказ 6 с (прошёл ${pct}% сборки): кадров ${frames.length}, медиана ${q(0.5)} мс, 95-й перцентиль ${q(0.95)} мс, 99-й ${q(0.99)} мс, кадров > 33 мс: ${frames.filter((x) => x > 33.4).length}`,
      `  Длинные задачи (> 50 мс) за автопоказ: ${long.length}${long.length ? " (макс. " + Math.round(Math.max(...long)) + " мс)" : ""}`,
      `  Изменений панели React за автопоказ: ${mut} (обновляется только при смене этапа, не на каждом кадре)`,
      `  JS heap: ${(heap0 / 1048576).toFixed(1)} → ${(heap1 / 1048576).toFixed(1)} МБ после 10 полных прогонов и сборки мусора`,
    );
    await ctx.close();
  }
  await b.close();
  console.log(rows.join("\n"));
})();
