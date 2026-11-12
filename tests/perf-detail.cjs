/*
 * Нагрузка в секции «От детали — к целому» (Chromium, смартфон 390×844, CPU ×4):
 * прокрутка через всю секцию шагами по 12 px (как пальцем), интервалы кадров и метрики движка
 * (пересчёт стилей, раскладка, отрисовка, время скриптов).  node tests/perf-detail.cjs [URL] [прогонов]
 */
const { chromium } = require('playwright');
const URL_ = process.argv[2] || 'http://127.0.0.1:4321/vernissage2.0/';
const RUNS = +(process.argv[3] || 3);
(async () => {
  const b = await chromium.launch(); const res = [];
  for (let r = 0; r < RUNS; r++) {
    const ctx = await b.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true }); const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 }); await cdp.send('Performance.enable');
    await p.goto(URL_ + '?nointro', { waitUntil: 'networkidle' });
    if (process.env.CSS) await p.addStyleTag({ content: process.env.CSS });
    const top = await p.evaluate(() => { const s = document.getElementById('detail'); return { t: s.getBoundingClientRect().top + scrollY - innerHeight, end: s.getBoundingClientRect().top + scrollY + s.offsetHeight }; });
    await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), top.t); await p.waitForTimeout(1500);
    if (r === 0) await b.startTracing(p, { categories: ['devtools.timeline', 'disabled-by-default-devtools.timeline'] });
    const m0 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
    const frames = await p.evaluate(async ({ a, z }) => {
      const d = []; let last = performance.now();
      for (let y = a; y <= z; y += 12) { scrollTo({ top: y, behavior: 'instant' }); await new Promise((r) => requestAnimationFrame(r)); const n = performance.now(); d.push(n - last); last = n; }
      return d.slice(1);
    }, { a: top.t, z: top.end });
    const m1 = Object.fromEntries((await cdp.send('Performance.getMetrics')).metrics.map((m) => [m.name, m.value]));
    if (r === 0) {
      const tr = JSON.parse((await b.stopTracing()).toString()).traceEvents;
      const agg = {}; for (const e of tr) if (['Paint', 'RasterTask', 'Layerize', 'UpdateLayer', 'PrePaint', 'Commit'].includes(e.name) && e.ph === 'X') { agg[e.name] = agg[e.name] || [0, 0]; agg[e.name][0]++; agg[e.name][1] += (e.dur || 0) / 1000; }
      console.log('трассировка (1-й прогон):', Object.entries(agg).map(([k, [n, ms]]) => `${k} ${n} шт / ${ms.toFixed(0)} мс`).join(', '));
    }
    frames.sort((x, y) => x - y);
    const q = (x) => frames[Math.floor(frames.length * x)];
    const dm = (k) => m1[k] - m0[k];
    res.push({ frames: frames.length, med: q(0.5), p95: q(0.95), p99: q(0.99), slow: frames.filter((f) => f > 33.4).length,
      layout: dm('LayoutCount'), style: dm('RecalcStyleCount'), layoutMs: dm('LayoutDuration') * 1000, styleMs: dm('RecalcStyleDuration') * 1000, scriptMs: dm('ScriptDuration') * 1000, taskMs: dm('TaskDuration') * 1000 });
    await ctx.close();
  }
  await b.close();
  const avg = (k) => (res.reduce((s, x) => s + x[k], 0) / res.length).toFixed(1);
  console.log(`кадров ${avg('frames')}, медиана ${avg('med')} мс, p95 ${avg('p95')} мс, p99 ${avg('p99')} мс, кадров > 33 мс: ${avg('slow')}`);
  console.log(`раскладок ${avg('layout')} (${avg('layoutMs')} мс), пересчётов стилей ${avg('style')} (${avg('styleMs')} мс), скрипты ${avg('scriptMs')} мс, всего задач ${avg('taskMs')} мс`);
})();
