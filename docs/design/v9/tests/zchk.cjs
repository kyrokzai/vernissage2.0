// какой элемент сверху в центре детали (первый экран и галерея), на телефоне и ПК
const pw=require('playwright');const eng=process.env.ENGINE||'chromium';
(async()=>{const b=await pw[eng].launch();for(const w of [390,1440]){const p=await b.newPage({viewport:{width:w,height:w<700?844:900},deviceScaleFactor:w<700?3:1});
await p.goto('file://'+__dirname+'/vernissage-2.0-v9-standalone.html#site-home');await p.waitForTimeout(2800);
const r=await p.evaluate(async()=>{const top=s=>{const e=document.querySelector('#solo '+s);e.scrollIntoView({block:'center'});const q=e.getBoundingClientRect();const h=document.elementFromPoint(q.left+q.width*.3,q.top+q.height*.7);return h&&(h===e||e.contains(h))?'деталь сверху':'ПЕРЕКРЫТА: '+(h&&h.className)};
 const a=top('.v-inset.vb');await new Promise(r=>setTimeout(r,2600));const g=top('.w-detail');return {hero:a,gallery:g}});console.log(eng,w,JSON.stringify(r));await p.close()}await b.close()})();
