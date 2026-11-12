/*
 * Сравнительные скриншоты «референс / VERNISSAGE 2.0» по секциям.
 * node tests/compare.cjs <URL_референса> <URL_сайта> <папка> [ширины через запятую] [chromium|webkit]
 */
const pw = require('playwright');
const fs = require('fs');
const [REF, SITE, OUT, widths = '1920,1440,768,390,375', engine = 'chromium'] = process.argv.slice(2);
const SECTIONS = [
  ['hero', '.hero'], ['strip', '.strip'], ['problem', 'section:has(> .wrap > .cmp)'], ['services', '#uslugi'],
  ['furniture', '#mebel'], ['statement', '.stm'], ['quiz', '#quiz'], ['why', 'section:has(.why-grid)'],
  ['process', '#etapy'], ['portfolio', '#portfolio'], ['b2b', '#b2b'], ['offer', '.offer'], ['faq', '#faq'], ['contacts', '#contact'],
];
const H = { 1920: 1080, 1440: 900, 768: 1024, 390: 844, 375: 812 };
fs.mkdirSync(OUT, { recursive: true });
async function grab(browser, url, w, tag, theme) {
  const ctx = await browser.newContext({ viewport: { width: w, height: H[w] || 900 }, deviceScaleFactor: 1 });
  if (theme) await ctx.addInitScript((t) => localStorage.setItem('vn_theme', t), theme);
  const p = await ctx.newPage();
  await p.goto(url, { waitUntil: 'networkidle' });
  const total = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < total; y += 600) { await p.evaluate((y) => scrollTo(0, y), y); await p.waitForTimeout(90); }
  await p.waitForTimeout(800);
  await p.addStyleTag({ content: '*,*::before,*::after{transition-duration:0s!important;animation-play-state:paused!important}.progress,#glow{display:none!important}' });
  for (const [name, sel] of SECTIONS) {
    const el = p.locator(sel).first();
    if (!(await el.count())) continue;
    await el.scrollIntoViewIfNeeded();
    await p.waitForTimeout(500);
    await el.screenshot({ path: `${OUT}/${w}-${name}-${tag}.png`, timeout: 20000 }).catch((e) => console.log('skip', name, tag, e.message.split('\n')[0]));
  }
  await ctx.close();
}
(async () => {
  const b = await pw[engine].launch();
  for (const w of widths.split(',').map(Number)) {
    await grab(b, REF + '#top', w, 'ref');
    await grab(b, SITE + '?nointro', w, 'new');
    console.log('done', w);
  }
  await b.close();
})();
