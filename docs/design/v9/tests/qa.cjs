const pw=require('playwright');const fs=require('fs');const engine=process.env.ENGINE||'chromium';
const html=fs.readFileSync('vernissage-2.0-v9.html','utf8');
const wrap=h=>'<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>VERNISSAGE</title><style>[hidden]{display:none!important}</style></head><body>'+h+'</body></html>';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{let B=[];const b={newPage:async o=>{const x=await pw[engine].launch();B.push(x);return x.newPage(o)}};const R={widths:{},interact:{},keyboard:{},reduced:{},bar:{}};
 // 1) ширины
 for (const w of [320,375,390,430,768,1024,1440]) for (const pg of ['site-home','site-project']) {
   const p=await b.newPage({viewport:{width:w,height:w===768?1024:w===1024?768:w>1024?900:(w===320?568:844)}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>m.type()==='error'&&errs.push(m.text().slice(0,100)));
   let crashed=false;p.on('crash',()=>{crashed=true});
   await p.setContent(wrap(html));await sleep(900);await p.evaluate(x=>{location.hash=x},pg);await sleep(2400);
   if(crashed){R.widths[pg+'@'+w]={crash:true};console.log('crash',w,pg);await p.close().catch(()=>{});for(const x of B.splice(0))await x.close().catch(()=>{});continue;}
   const r=await p.evaluate(()=>{const W=document.documentElement.clientWidth;
     const over=[...document.querySelectorAll('#solo *')].filter(e=>{const q=e.getBoundingClientRect();if(!(q.width>0&&q.right>W+1))return false;if(e.closest('.c-enf,.w-strip,.v-cats,.v-branch,.x-menu,.w-main,.k-view,.pj-frm,.pj-hero,.w-detail,.frm'))return false;return true}).slice(0,4).map(e=>(e.className||e.tagName).toString().slice(0,30));
     const acts=document.querySelector('#solo .v-acts');const btn=acts?[...acts.querySelectorAll('.v-btn')].map(x=>Math.round(x.getBoundingClientRect().bottom)):[];
     const small=[...document.querySelectorAll('#solo a,#solo button,#solo input,#solo textarea')].filter(e=>{if(e.closest('p,li>span,dd')&&getComputedStyle(e).display==='inline'&&e.closest('p'))return false;const q=e.getBoundingClientRect();return q.width>0&&q.height>0&&getComputedStyle(e).visibility!=='hidden'&&(q.height<24||q.width<24)}).map(e=>(e.textContent||e.className).trim().slice(0,24));
     return {sw:document.documentElement.scrollWidth,cw:W,over,ctaBottom:btn,vh:innerHeight,smallTargets:[...new Set(small)].slice(0,6)}});
   R.widths[pg+'@'+w]=Object.assign(r,{errs});
   if(pg==='site-home'){await p.addStyleTag({content:'#solo-back{display:none!important}'});await p.screenshot({path:`w-${engine}-${w}.png`});}
   await p.close();for(const x of B.splice(0))await x.close();}
 // 2) интерактив и анимации (ПК)
 let p=await b.newPage({viewport:{width:1440,height:900}});await p.setContent(wrap(html));await sleep(900);await p.evaluate(()=>{location.hash='site-home'});await sleep(2200);
 R.interact.arch=await p.evaluate(async()=>{const a=[...document.querySelectorAll('#solo .c-arch')];const w0=a.map(x=>Math.round(x.getBoundingClientRect().width));
   a[3].dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));await new Promise(r=>setTimeout(r,1000));const w1=a.map(x=>Math.round(x.getBoundingClientRect().width));
   return {before:w0,afterHoverSpalni:w1,on:a.findIndex(x=>x.classList.contains('on'))}});
 R.interact.gallery=await p.evaluate(async()=>{const g=document.querySelector('#solo [data-gallery]');g.querySelector('.w-th[data-k="3"]').click();await new Promise(r=>setTimeout(r,800));
   return {pressed:g.querySelector('.w-th[aria-pressed="true"]').dataset.k,visible:g.querySelector('.w-main .ph.on').dataset.k,caption:g.querySelector('[data-wcap]').textContent}});
 R.interact.k3=await p.evaluate(async()=>{const box=document.querySelector('#solo [data-k3]');const res=[];
   for(const l of ['straight','corner','island'])for(const f of ['oak','walnut','ivory','graphite']){box.querySelector(`[data-lay="${l}"]`).click();box.querySelector(`[data-fin="${f}"]`).click();await new Promise(r=>setTimeout(r,60));
     const on=box.querySelectorAll('[data-kview] .r.on');const img=on.length===1?getComputedStyle(on[0]).backgroundImage.slice(0,22):'';res.push(on.length===1&&on[0].dataset.r===l+'-'+f&&img.startsWith('url("data:image/webp')?'ok':'FAIL '+l+f)}
   return {combos:res.length,ok:res.filter(x=>x==='ok').length,state:box.querySelector('[data-kstate]').textContent}});
 // 3) клавиатура
 R.keyboard=await (async()=>{const seen=[];let noRing=[];for(let i=0;i<60;i++){await p.keyboard.press('Tab');const info=await p.evaluate(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const cs=getComputedStyle(e);
     const ring=(cs.outlineStyle!=='none'&&parseFloat(cs.outlineWidth)>0)||cs.boxShadow!=='none';return {t:(e.getAttribute('aria-label')||e.textContent||e.id||e.className).trim().replace(/\s+/g,' ').slice(0,28),ring,arch:e.classList.contains('c-arch')?e.classList.contains('on'):null}});
     if(!info)continue;seen.push(info.t);if(!info.ring)noRing.push(info.t);if(info.arch===false)noRing.push('arch-not-open:'+info.t);}
   return {focusedCount:seen.length,sample:seen.slice(0,24),noVisibleFocus:[...new Set(noRing)]}})();
 await p.close();
 // 4) уменьшенное движение
 p=await b.newPage({viewport:{width:390,height:844},reducedMotion:'reduce'});await p.setContent(wrap(html));await sleep(900);await p.evaluate(()=>{location.hash='site-home'});await sleep(1500);
 R.reduced=await p.evaluate(()=>{const q=s=>getComputedStyle(document.querySelector('#solo '+s));return {archTransition:q('.c-arch').transitionDuration,heroH1Anim:q('.v-h1').animationName,branchAnim:q('.v-branch').animationName,barTransition:getComputedStyle(document.querySelector('#solo .x-bar')).transitionDuration,kRender:q('.k-view .r').transitionDuration}});
 await p.close();
 // 5) нижняя панель (iPhone)
 p=await b.newPage({viewport:{width:390,height:664},isMobile:engine!=='firefox',hasTouch:true});await p.setContent(wrap(html));await sleep(900);await p.evaluate(()=>{location.hash='site-home'});await sleep(1800);
 const bar=async(where,extra)=>p.evaluate(async([where,extra])=>{const s=document.querySelector('#solo');let y=where==='form'?s.querySelector('.x-form').getBoundingClientRect().top+scrollY-200:where==='end'?document.documentElement.scrollHeight:where;
   window.scrollTo(0,y);await new Promise(r=>setTimeout(r,300));if(extra==='menu')s.querySelector('a.v-ic[aria-label="Открыть меню"]').click();if(extra==='focus')s.querySelector('#f-name').focus({preventScroll:true});await new Promise(r=>setTimeout(r,600));
   const b=s.querySelector('.x-bar'),br=b.getBoundingClientRect(),m=s.querySelector('.x-menu');const r={on:b.classList.contains('on'),bottom:Math.round(br.bottom),vh:innerHeight,menu:!m.hidden};
   if(extra==='menu'){m.querySelector('.x-menu-x').click();await new Promise(r=>setTimeout(r,400));r.after=b.classList.contains('on')}
   if(extra==='focus'){document.activeElement.blur();await new Promise(r=>setTimeout(r,400));r.after=b.classList.contains('on')}return r},[where,extra]);
 R.bar={top:await bar(0),down:await bar(2600),up:await bar(0),form:await bar('form'),end:await bar('end'),menu:await bar(2600,'menu'),focus:await bar(2600,'focus')};
 await p.close();
 fs.writeFileSync(`qa-${engine}.json`,JSON.stringify(R,null,1));console.log(engine,'done');for(const x of B)await x.close()})();
