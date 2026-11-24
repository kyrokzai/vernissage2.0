const pw=require('playwright');(async()=>{const b=await pw.chromium.launch();for(const w of [1440,1024,768,390]){const p=await b.newPage({viewport:{width:w,height:900}});
await p.goto('file://'+__dirname+'/vernissage-2.0-v9-standalone.html#site-home');await p.waitForTimeout(1200);
console.log(w,await p.evaluate(()=>{const m=document.querySelector('#solo .w-main').getBoundingClientRect(),s=getComputedStyle(document.querySelector('#solo .w-stage'),'::before');return [Math.round(m.height),s.height]}));await p.close()}await b.close()})();
