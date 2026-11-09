const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();
 for (const [w,h,sc] of [[1440,900,'Кухня'],[1440,900,'Ресторан'],[390,844,'Ресторан']]) {
  const p=await b.newPage({viewport:{width:w,height:h}}); await p.goto(process.argv[3]||'http://127.0.0.1:4173/'); await p.waitForTimeout(500);
  await p.getByRole('tab',{name:sc}).click(); await p.locator('.tick').first().click(); await p.waitForTimeout(1200);
  await p.locator('.play').click();
  const r=await p.evaluate(()=>new Promise(res=>{const d=[];let l=performance.now();const t0=l;const f=n=>{d.push(n-l);l=n;if(n-t0<4000)requestAnimationFrame(f);else{d.sort((a,b)=>a-b);res({frames:d.length,median:d[d.length>>1].toFixed(1),p95:d[Math.floor(d.length*.95)].toFixed(1),over33:d.filter(x=>x>33.4).length})}};requestAnimationFrame(f)}));
  console.log(`${w}×${h} ${sc}: кадров за 4 с ${r.frames}, медиана ${r.median} мс, 95-й перцентиль ${r.p95} мс, кадров дольше 33 мс: ${r.over33}`);
  await p.close(); }
 await b.close();})();
