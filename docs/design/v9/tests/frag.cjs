// node frag.cjs <html> <anchor> <width> <out> ; env ENGINE, DSF, HOVER(selector), CLICK(sel,sel)
const pw=require('playwright');const fs=require('fs');const eng=process.env.ENGINE||'chromium';
const wrap=h=>h.startsWith('<!doctype')?h:'<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>V</title></head><body>'+h+'</body></html>';
(async()=>{const [f,anc,w,out]=process.argv.slice(2);const W=+w;const b=await pw[eng].launch();
const p=await b.newPage({viewport:{width:W,height:W>700?900:844},deviceScaleFactor:+(process.env.DSF||1),hasTouch:W<700});
await p.setContent(wrap(fs.readFileSync(f,'utf8')));await p.waitForTimeout(700);await p.evaluate(x=>{location.hash=x},process.env.HASH||'site-home');await p.waitForTimeout(1800);
await p.addStyleTag({content:'#solo-back{display:none!important}.x-bar{display:none!important}'});
const sel='#solo [data-anchor="'+anc+'"]';await p.$eval(sel,e=>e.scrollIntoView({block:'start'}));await p.waitForTimeout(2800);
if(process.env.CLICK)for(const c of process.env.CLICK.split(',')){await p.click('#solo '+c);await p.waitForTimeout(900);}
if(process.env.HOVER){const h=await p.$('#solo '+process.env.HOVER);const q=await h.boundingBox();await p.mouse.move(q.x+q.width*.62,q.y+q.height*.32,{steps:6});await p.waitForTimeout(2000);}
await (await p.$(sel)).screenshot({path:out});await b.close()})();
