// touch check: real touch scroll gesture (Chromium CDP) on the arches + tap
const pw=require('playwright');const eng=process.env.ENGINE||'chromium';
(async()=>{const b=await pw[eng].launch();const ctx=await b.newContext({viewport:{width:390,height:844},hasTouch:true,isMobile:eng==='chromium',deviceScaleFactor:2});const p=await ctx.newPage();
const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/vernissage-2.0-v9-standalone.html#site-home');await p.waitForTimeout(1500);
await p.addStyleTag({content:'#solo-back{display:none!important}'});
const row='body.solo .c-enf';await p.$eval(row,e=>e.scrollIntoView({block:'center'}));await p.waitForTimeout(400);
const st=()=>p.$eval(row,e=>{const r=e.closest('.c-stage').nextElementSibling;return {left:Math.round(e.scrollLeft),num:r.querySelector('.c-num').textContent,on:[...e.querySelectorAll('.c-arch')].findIndex(a=>a.classList.contains('on')),w:r.querySelector('.c-bar i').style.getPropertyValue('--w'),x:r.querySelector('.c-bar i').style.getPropertyValue('--x'),railVisible:r.offsetWidth>0}});
const out={start:await st()};
await (await p.$('body.solo .c-sec, body.solo [data-anchor=cats]')).screenshot({path:`touch-${eng}-0.png`}).catch(()=>{});
const box=await (await p.$(row)).boundingBox();console.log('box',JSON.stringify(box));
for(let k=1;k<=3;k++){await p.$eval(row,e=>e.scrollIntoView({block:'center'}));await p.waitForTimeout(300);const box=await (await p.$(row)).boundingBox();
 if(eng==='chromium'){const c=await ctx.newCDPSession(p);const y=Math.round(box.y+box.height*0.4);console.log('y',y);
   await c.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:320,y}]});
   for(let s=1;s<=12;s++){await c.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:320-s*22,y}]});await p.waitForTimeout(16);}
   await c.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});}
 else {await p.$eval(row,e=>e.scrollBy({left:260,behavior:'instant'}));}
 await p.waitForTimeout(900);out['swipe'+k]=await st();}
await (await p.$('body.solo [data-anchor=cats]')).screenshot({path:`touch-${eng}-3.png`});
// tap test: tapping an arch should not throw and keeps layout widths equal on phone
await p.tap('body.solo .c-arch:nth-child(5) .c-name').catch(e=>errs.push('tap '+e.message.slice(0,80)));await p.waitForTimeout(300);
out.afterTap=await st();out.widths=await p.$$eval('body.solo .c-arch',a=>a.map(x=>Math.round(x.getBoundingClientRect().width)));out.errs=errs;
console.log(eng,JSON.stringify(out));await b.close()})();
