// Производительность: загрузка, CLS, длинные задачи, кадры при прокрутке и взаимодействиях
const pw=require('playwright');const fs=require('fs');const eng=process.env.ENGINE||'chromium';
const FN=process.env.FILE||'vernissage-2.0-v9-standalone.html';const F='file://'+__dirname+'/'+FN;
async function run(b,{w,h,throttle,page}){const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:w<700?3:1,hasTouch:w<700});const p=await ctx.newPage();
 if(throttle&&eng==='chromium'){const c=await ctx.newCDPSession(p);await c.send('Emulation.setCPUThrottlingRate',{rate:throttle});}
 await p.addInitScript(()=>{window.__cls=0;window.__lt=[];try{new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true})}catch(e){}
   try{new PerformanceObserver(l=>{for(const e of l.getEntries())window.__lt.push(Math.round(e.duration))}).observe({type:'longtask',buffered:true})}catch(e){}});
 const t0=Date.now();await p.goto(F+'#'+page,{waitUntil:'load'});const loadWall=Date.now()-t0;await p.waitForTimeout(1500);
 const nav=await p.evaluate(()=>{const n=performance.getEntriesByType('navigation')[0]||{};const fcp=(performance.getEntriesByName('first-contentful-paint')[0]||{}).startTime;return {dcl:Math.round(n.domContentLoadedEventEnd||0),load:Math.round(n.loadEventEnd||0),fcp:fcp?Math.round(fcp):null,nodes:document.getElementsByTagName('*').length}});
 // кадры: прокрутка всей страницы шагами в rAF + взаимодействия
 const frames=await p.evaluate(async(mobile)=>{const ts=[];let run=true;(function loop(t){ts.push(t);if(run)requestAnimationFrame(loop)})(performance.now());
   const H=document.documentElement.scrollHeight;const t0=performance.now();const step=mobile?24:40;for(let y=0;y<H;y+=step){scrollTo(0,y);await new Promise(r=>requestAnimationFrame(r));}
   const tScroll=performance.now();const q=s=>document.querySelector('#solo '+s);
   const arches=[...document.querySelectorAll('#solo .c-arch')];if(arches.length){arches[0].scrollIntoView({block:'center'});for(const a of arches){a.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));await new Promise(r=>setTimeout(r,250));}}
   const th=[...document.querySelectorAll('#solo .w-th')];for(const t of th){t.click();await new Promise(r=>setTimeout(r,250));}
   const k=q('[data-k3]');if(k){k.scrollIntoView({block:'center'});for(const l of ['corner','island','straight']){k.querySelector(`[data-lay="${l}"]`).click();await new Promise(r=>setTimeout(r,300));for(const f of ['oak','graphite']){k.querySelector(`[data-fin="${f}"]`).click();await new Promise(r=>setTimeout(r,300));}}}
   run=false;const st=(a,b)=>{const x=[];for(let i=1;i<ts.length;i++)if(ts[i]>a&&ts[i]<=b)x.push(ts[i]-ts[i-1]);x.sort((m,n)=>m-n);return x.length?{fps:Math.round(1000/(x.reduce((m,n)=>m+n,0)/x.length)),p95:Math.round(x[Math.floor(x.length*.95)])}:null};const phases={scroll:st(t0,tScroll),interact:st(tScroll,1e12)};const d=[];for(let i=1;i<ts.length;i++)d.push(ts[i]-ts[i-1]);d.sort((a,b)=>a-b);const pct=x=>Math.round(d[Math.floor(d.length*x)]*10)/10;
   return {frames:d.length,median:pct(.5),p95:pct(.95),p99:pct(.99),max:Math.round(d[d.length-1]),over50:d.filter(x=>x>50).length,phases,fps:Math.round(1000/(d.reduce((a,b)=>a+b,0)/d.length))}},w<700);
 const extra=await p.evaluate(()=>({cls:Math.round(window.__cls*1000)/1000,longtasks:window.__lt.length,longestTask:window.__lt.length?Math.max(...window.__lt):0,heapMB:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null}));
 await ctx.close();return Object.assign({w,throttle:throttle||1,page,loadWall},nav,frames,extra);}
(async()=>{const b=await pw[eng].launch();const res=[];
 for(const cfg of [{w:1440,h:900,page:'site-home'},{w:390,h:844,page:'site-home',throttle:4}].concat(process.env.FILE?[]:[{w:390,h:844,page:'site-home-walnut',throttle:4}]).concat([{w:390,h:844,page:'site-project',throttle:4},{w:1440,h:900,page:'site-project'}]))res.push(await run(b,cfg));
 const html=fs.readFileSync(__dirname+'/'+FN,'utf8');const imgs=[...html.matchAll(/url\(data:image\/webp;base64,([A-Za-z0-9+\/=]+)\)/g)].map(m=>m[1].length*3/4);
 console.log(JSON.stringify({engine:eng,fileKB:Math.round(html.length/1024),images:imgs.length,imagesKB:Math.round(imgs.reduce((a,b)=>a+b,0)/1024),largestImgKB:Math.round(Math.max(...imgs)/1024),runs:res},null,1));await b.close()})();
