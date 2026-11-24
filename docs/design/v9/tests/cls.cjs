// CLS: separately after load, after scrolling, after hovering the arches (desktop 1440)
const pw = require('playwright');
(async () => {
  const b = await pw.chromium.launch();
  const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
  await p.addInitScript(() => {
    window.__s = [];
    new PerformanceObserver(l => {
      for (const e of l.getEntries()) {
        if (e.hadRecentInput) continue;
        window.__s.push({
          v: e.value,
          src: (e.sources || []).slice(0, 2).map(s => s.node ? String(s.node.className || s.node.nodeName).slice(0, 30) : '?')
        });
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  const file = process.env.FILE || 'vernissage-2.0-v9-standalone.html';
  await p.goto('file://' + __dirname + '/' + file + '#site-home');
  await p.waitForTimeout(2500);
  const sum = () => p.evaluate(() => Math.round(window.__s.reduce((a, e) => a + e.v, 0) * 1000) / 1000);
  const afterLoad = await sum();
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 300) { await p.mouse.wheel(0, 300); await p.waitForTimeout(60); }
  await p.waitForTimeout(1500);
  const afterScroll = await sum();
  await p.evaluate(() => document.querySelector('#solo .c-enf').scrollIntoView({ block: 'center' }));
  await p.waitForTimeout(800);
  const beforeHover = await sum();
  const arches = await p.locator('#solo .c-arch').all();
  for (const a of arches) {
    const q = await a.boundingBox();
    await p.mouse.move(q.x + q.width / 2, q.y + q.height / 3, { steps: 4 });
    await p.waitForTimeout(500);
  }
  const afterHover = await sum();
  const top = await p.evaluate(() => window.__s.slice().sort((x, y) => y.v - x.v).slice(0, 4));
  console.log(file, JSON.stringify({ afterLoad, afterScroll, beforeHover, afterHover, top }));
  await b.close();
})();
