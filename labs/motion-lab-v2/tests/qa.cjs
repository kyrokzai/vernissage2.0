const { chromium } = require('playwright');
const S=process.argv[2]||'test-results';require('fs').mkdirSync(S+'/v2shots',{recursive:true}); const url=process.argv[3]||'http://127.0.0.1:4173/';
const VPS=[['1920',1920,1080],['1440',1440,900],['390',390,844],['375',375,812]];
const results=[]; const ok=(n,c,info='')=>{results.push(`${c?'PASS':'FAIL'}  ${n}${info?'  — '+info:''}`)};
(async()=>{const b=await chromium.launch();
 for (const [n,w,h] of VPS) {
  const ctx=await b.newContext({viewport:{width:w,height:h}, deviceScaleFactor:1, hasTouch: w<800, isMobile: w<800});
  const p=await ctx.newPage(); const errs=[]; p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error'&&!/fonts/.test(m.text()))errs.push(m.text())});
  await p.goto(url); await p.waitForTimeout(800);
  const range=()=>p.evaluate(()=>{const t=document.querySelector('.track');const top=t.getBoundingClientRect().top+scrollY;return {top,len:t.offsetHeight-innerHeight}});
  const goP=async(v,wait=1300)=>{const r=await range(); await p.evaluate(y=>scrollTo(0,y), r.top+v*r.len); await p.waitForTimeout(wait);};
  const state=()=>p.evaluate(()=>({pct:document.querySelector('.pct')?.textContent, stage:document.querySelector('.caption h2')?.textContent, n:document.querySelector('.cap-n')?.textContent, sw:document.documentElement.scrollWidth, cw:document.documentElement.clientWidth}));
  for (const sc of ['Кухня','Гостиная','Ресторан']) {
    await goP(0.0); await p.getByRole('tab',{name:sc}).click(); await p.waitForTimeout(600);
    for (const v of [0,0.5,1]) { await goP(v); await p.locator('.stage').screenshot({path:`${S}/v2shots/${n}-${sc}-${v*100}.png`}); }
    const st=await state(); ok(`${n} ${sc}: конец сборки`, /100/.test(st.pct||'100') && /0\d \/ 0\d/.test(st.n), `${st.n} «${st.stage}»`);
  }
  // обратная прокрутка: кадр на 35% после 80% → 35% должен совпасть с прямым кадром на 35%
  await p.getByRole('tab',{name:'Кухня'}).click(); await goP(0); await goP(0.35,1500);
  const svgF=await p.evaluate(()=>document.querySelector('.scene-svg').outerHTML);
  await p.locator('.scene-box').screenshot({path:`${S}/v2shots/rev-${n}-a.png`});
  await goP(0.8,1500); await goP(0.35,2500);
  const svgB=await p.evaluate(()=>document.querySelector('.scene-svg').outerHTML);
  await p.locator('.scene-box').screenshot({path:`${S}/v2shots/rev-${n}-b.png`});
  ok(`${n} обратная прокрутка: разметка сцены идентична`, svgF===svgB);
  // геометрия: на каждом завершённом этапе все показанные элементы стоят в финальных координатах
  let moved=0;
  for (let k=0;k<8;k++){ await goP(k/7,2200); moved+=await p.evaluate(()=>[...document.querySelectorAll('.scene-svg g[transform^="translate"]')].filter(g=>!/translate\(0 0\)|translate\(-?0 -?0\)/.test(g.getAttribute('transform'))).length); }
  ok(`${n} геометрия неизменна: на 8 этапах кухни смещённых элементов`, moved===0, String(moved));
  // ползунок с клавиатуры
  await goP(0,900); const thumb=p.locator('.scrub-slider [role=slider]'); await thumb.focus();
  for(let i=0;i<10;i++) await p.keyboard.press('PageUp'); await p.waitForTimeout(1200);
  const sAfter=await state(); ok(`${n} ползунок (клавиатура)`, parseInt(sAfter.pct||'0')>0 || w<800, `прогресс ${sAfter.pct??'(скрыт на смартфоне)'}`);
  // кнопка этапа 4
  await p.locator('.tick').nth(3).click(); await p.waitForTimeout(1500);
  const s4=await state(); ok(`${n} кнопка этапа 4`, /^04/.test(s4.n), s4.n+' «'+s4.stage+'»');
  // автовоспроизведение и остановка колесом
  await p.locator('.play').click(); await p.waitForTimeout(1200); const a1=await p.evaluate(()=>scrollY);
  await p.waitForTimeout(800); const a2=await p.evaluate(()=>scrollY);
  await p.mouse.wheel(0,-10); await p.waitForTimeout(400); const a3=await p.evaluate(()=>scrollY); await p.waitForTimeout(600); const a4=await p.evaluate(()=>scrollY);
  ok(`${n} автовоспроизведение и остановка`, a2>a1 && Math.abs(a4-a3)<3, `прокрутка ${Math.round(a1)}→${Math.round(a2)}, после остановки стоит`);
  // До / После
  await goP(0.5,900); await p.getByRole('button',{name:'До / После'}).click(); await p.waitForTimeout(500);
  const box=await p.locator('.cmp').boundingBox();
  await p.mouse.move(box.x+box.width*0.5, box.y+box.height*0.5); await p.mouse.down(); await p.mouse.move(box.x+box.width*0.25, box.y+box.height*0.5,{steps:5}); await p.mouse.up();
  const v=await p.locator('.cmp-handle').getAttribute('aria-valuenow'); ok(`${n} «До / После»: перетаскивание`, Math.abs(parseInt(v)-25)<=2, `разделитель ${v}%`);
  await p.locator('.stage').screenshot({path:`${S}/v2shots/${n}-compare.png`});
  await p.getByRole('button',{name:'Сборка'}).click();
  const st=await state(); ok(`${n} нет горизонтального переполнения`, st.sw<=st.cw, `${st.sw}/${st.cw}`);
  ok(`${n} нет ошибок JavaScript`, errs.length===0, errs.join(' | '));
  await ctx.close();
 }
 // уменьшение движения
 const ctx=await b.newContext({viewport:{width:1440,height:900}, reducedMotion:'reduce'}); const p=await ctx.newPage(); await p.goto(url); await p.waitForTimeout(600);
 const r=await p.evaluate(()=>{const t=document.querySelector('.track');return {top:t.getBoundingClientRect().top+scrollY,len:t.offsetHeight-innerHeight}});
 await p.evaluate(y=>scrollTo(0,y), r.top+0.4*r.len); await p.waitForTimeout(80);
 const rm=await p.evaluate(()=>({rm:document.querySelector('.page').classList.contains('rm'), pct:document.querySelector('.pct').textContent}));
 ok('уменьшение движения: включено по системной настройке и без сглаживания', rm.rm && rm.pct==='40%', JSON.stringify(rm));
 await p.locator('.stage').screenshot({path:`${S}/v2shots/rm-1440.png`});
 await b.close(); console.log(results.join('\n'));
})();
