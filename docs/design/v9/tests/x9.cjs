const pw=require('playwright');const eng=process.env.ENGINE||'chromium';const F='file://'+__dirname+'/vernissage-2.0-v9-standalone.html';
(async()=>{const b=await pw[eng].launch();const out={};const errs=[];
 // 1. walnut route + 12 combos
 let p=await b.newPage({viewport:{width:1440,height:900}});p.on('pageerror',e=>errs.push(e.message));
 await p.goto(F+'#site-home-walnut');await p.waitForTimeout(1200);
 out.walnutRoute=await p.evaluate(()=>document.querySelector('#solo .k-sec').classList.contains('k-dark'));
 out.walnut12=await p.evaluate(async()=>{const box=document.querySelector('#solo [data-k3]');let ok=0;for(const l of ['straight','corner','island'])for(const f of ['oak','walnut','ivory','graphite']){box.querySelector(`[data-lay="${l}"]`).click();box.querySelector(`[data-fin="${f}"]`).click();await new Promise(r=>setTimeout(r,40));const on=box.querySelectorAll('[data-kview] .r.on');if(on.length===1&&on[0].dataset.r===l+'-'+f)ok++;}return ok});
 await p.evaluate(()=>{location.hash='site-home'});await p.waitForTimeout(900);
 out.lightRoute=await p.evaluate(()=>!document.querySelector('#solo .k-sec').classList.contains('k-dark'));
 // 2. TOC link on project page
 await p.evaluate(()=>{location.hash='site-project'});await p.waitForTimeout(1500);
 out.heroSettled=await p.evaluate(()=>!document.querySelector('#solo .pj-pre'));
 await p.click('#solo .pj-toc a[href="#fig3"]');await p.waitForTimeout(1100);
 out.toc=await p.evaluate(()=>{const f=document.querySelector('#solo #fig3');const q=f.getBoundingClientRect();return {hl:f.classList.contains('hl'),inView:q.top>=0&&q.bottom<=innerHeight+2,hash:location.hash}});
 await p.waitForTimeout(1800);out.hlCleared=await p.evaluate(()=>!document.querySelector('#solo .pj-fig.hl'));
 await p.close();
 // 3. presentation toggle
 p=await b.newPage({viewport:{width:1280,height:900}});p.on('pageerror',e=>errs.push(e.message));await p.goto(F);await p.waitForTimeout(1800);
 await p.click('[data-k3v="walnut"]');out.presWalnut=await p.evaluate(()=>{const k=[...document.querySelectorAll('.k-sec')];return k.length+' sections, dark '+k.filter(x=>x.classList.contains('k-dark')).length});
 await p.click('[data-k3v="light"]');out.presLight=await p.evaluate(()=>[...document.querySelectorAll('.k-sec')].filter(x=>x.classList.contains('k-dark')).length);
 out.errs=errs;console.log(eng,JSON.stringify(out));await b.close()})();
