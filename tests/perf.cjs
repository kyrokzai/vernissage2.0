/*
 * Производительность (Chromium): LCP, CLS, объём первой загрузки, длинные задачи и кадры
 * при прокрутке авторского блока. Смартфон — с замедлением CPU ×4 и сетью «быстрый 4G».
 * node tests/perf.cjs [URL]
 */
const { chromium } = require('playwright');
const URL_ = process.argv[2] || 'http://127.0.0.1:4321/vernissage2.0/';
const OBS = () => {
  window.__lcp = 0; window.__cls = 0; window.__long = [];
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__long.push(e.duration); }).observe({ type: 'longtask', buffered: true });
};
(async () => {
  const b = await chromium.launch(); const out = [];
  for (const [name, w, h, cpu, net] of [['Компьютер 1440×900', 1440, 900, 1, null], ['Смартфон 390×844, CPU ×4, 4G', 390, 844, 4, { latency: 60, downloadThroughput: 9e6 / 8, uploadThroughput: 3e6 / 8 }]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const p = await ctx.newPage();
    const cdp = await ctx.newCDPSession(p);
    if (cpu > 1) await cdp.send('Emulation.setCPUThrottlingRate', { rate: cpu });
    if (net) { await cdp.send('Network.enable'); await cdp.send('Network.emulateNetworkConditions', { offline: false, ...net }); }
    let bytes = 0; p.on('response', async (r) => { try { const l = Number(r.headers()['content-length']); bytes += l || (await r.body()).length; } catch { /* видео потоком */ } });
    await p.addInitScript(OBS);
    const t0 = Date.now();
    await p.goto(URL_ + '?nointro', { waitUntil: 'load' }); const load = Date.now() - t0;
    await p.waitForTimeout(2500);
    const lcp = await p.evaluate(() => window.__lcp), cls0 = await p.evaluate(() => window.__cls);
    const first = bytes;
    await p.evaluate(() => { window.__long = []; });
    const frames = await p.evaluate(async () => {
      const s = document.getElementById('detail'); const top = s.getBoundingClientRect().top + scrollY, span = s.offsetHeight - innerHeight;
      const d = []; let last = performance.now();
      for (let i = 0; i <= 240; i++) {
        scrollTo({ top: top + (span * i) / 240, behavior: 'instant' });
        await new Promise((r) => requestAnimationFrame(r)); const n = performance.now(); d.push(n - last); last = n;
      }
      return d.slice(1);
    });
    const long = await p.evaluate(() => window.__long);
    // остальная страница
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 400) { await p.evaluate((y) => scrollTo({ top: y, behavior: 'instant' }), y); await p.waitForTimeout(50); }
    await p.waitForTimeout(1500);
    const cls1 = await p.evaluate(() => window.__cls);
    frames.sort((a, c) => a - c); const q = (x) => frames[Math.floor(frames.length * x)].toFixed(1);
    out.push(name,
      `  load: ${load} мс, LCP: ${Math.round(lcp)} мс, CLS при загрузке: ${cls0.toFixed(3)}, CLS за всю страницу: ${cls1.toFixed(3)}`,
      `  первая загрузка: ${(first / 1024).toFixed(0)} КБ; вся страница после прокрутки: ${(bytes / 1048576).toFixed(1)} МБ`,
      `  «От детали — к целому», 240 шагов прокрутки: медиана кадра ${q(0.5)} мс, 95-й перцентиль ${q(0.95)} мс; длинных задач: ${long.length}${long.length ? ' (макс. ' + Math.round(Math.max(...long)) + ' мс)' : ''}`);
    await ctx.close();
  }
  await b.close(); console.log(out.join('\n'));
})();
