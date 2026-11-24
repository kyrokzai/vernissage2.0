const pw=require('playwright');const eng=process.env.ENGINE||'chromium';
(async()=>{const b=await pw[eng].launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2,hasTouch:true});
await p.goto('file://'+__dirname+'/vernissage-2.0-v9-standalone.html#site-home');await p.waitForTimeout(1500);await p.addStyleTag({content:'#solo-back{display:none!important}'});
await p.$eval('body.solo .k-stage',e=>e.scrollIntoView({block:'start'}));await p.evaluate(()=>scrollBy(0,-12));await p.waitForTimeout(300);
await p.tap('body.solo [data-lay=corner]');await p.tap('body.solo [data-fin=ivory]');await p.waitForTimeout(900);
const r=await p.evaluate(()=>{const q=s=>document.querySelector('body.solo '+s).getBoundingClientRect();return {stageTop:Math.round(q('.k-niche').top),stageBottom:Math.round(q('.k-niche').bottom),lastSwatchBottom:Math.round(q('[data-fin=graphite]').bottom),vh:innerHeight,on:document.querySelector('body.solo .k-view .r.on').dataset.r,bar:document.querySelector('.x-bar')&&document.querySelector('.x-bar').classList.contains('on')}});
console.log(eng,JSON.stringify(r));await p.screenshot({path:`kview-${eng}.png`});await b.close()})();
