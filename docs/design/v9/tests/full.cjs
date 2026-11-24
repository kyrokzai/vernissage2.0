// full-page shots: node full.cjs <hash> <width> <out> (ENGINE, DSF)
const pw=require('playwright');const eng=process.env.ENGINE||'chromium';
(async()=>{const [h,w,out]=process.argv.slice(2);const W=+w;const b=await pw[eng].launch();
const p=await b.newPage({viewport:{width:W,height:W>700?900:844},deviceScaleFactor:+(process.env.DSF||1)});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto('file://'+__dirname+'/vernissage-2.0-v9-standalone.html#'+h);await p.waitForTimeout(1500);
await p.addStyleTag({content:'#solo-back{display:none!important}.x-bar{display:none!important}'});
const H=await p.evaluate(()=>document.documentElement.scrollHeight);for(let y=0;y<H;y+=400){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(90);}
await p.evaluate(()=>scrollTo(0,0));await p.waitForTimeout(2800);
await p.screenshot({path:out,fullPage:true});console.log(out,H,errs);await b.close()})();
