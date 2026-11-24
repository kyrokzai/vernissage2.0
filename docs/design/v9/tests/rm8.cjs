const pw=require('playwright');const eng=process.env.ENGINE||'chromium';(async()=>{const b=await pw[eng].launch();
for(const rm of ['reduce','no-preference'])for(const w of [390,1440]){const p=await b.newPage({viewport:{width:w,height:844},reducedMotion:rm});
await p.goto('file://'+__dirname+'/vernissage-2.0-v9-standalone.html#site-home');await p.waitForTimeout(1200);
const pre=await p.evaluate(()=>document.querySelectorAll('body.solo .c-pre,body.solo .w-pre').length);
for(let y=0;y<9000;y+=500){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(120);}await p.waitForTimeout(2600);
const r=await p.evaluate(()=>({left:document.querySelectorAll('body.solo .c-pre,body.solo .w-pre,body.solo .c-in,body.solo .w-in').length,
 tr:['.c-frame','.c-frame .ph','.w-main .ph','.w-detail','.w-detail .ph','.w-th span','.w-fig .ph','.k-fin .sw','.c-sh'].map(s=>s.split(' ').pop()+':'+getComputedStyle(document.querySelector('body.solo '+s)).transitionDuration.split(',')[0])}));
console.log(eng,rm,w,'preAtLoad',pre,JSON.stringify(r));await p.close();}await b.close()})();
