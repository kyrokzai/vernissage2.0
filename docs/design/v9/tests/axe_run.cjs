// usage: node axe_run.cjs <html> <label>  (ENGINE=chromium|webkit)
const pw=require('playwright');const fs=require('fs');const engine=process.env.ENGINE||'chromium';
const AXE=fs.readFileSync(process.env.AXE,'utf8');const html=fs.readFileSync(process.argv[2],'utf8');const label=process.argv[3]||'';
const wrap=h=>'<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>VERNISSAGE</title><style>[hidden]{display:none!important}</style></head><body>'+h+'</body></html>';
(async()=>{const b=await pw[engine].launch();const res={};
for (const [pg,w,h] of [['site-home',390,844],['site-home',1440,900],['site-home-walnut',390,844],['site-home-walnut',1440,900],['site-project',390,844],['site-project',1440,900]]) {
  const p=await b.newPage({viewport:{width:w,height:h}});await p.setContent(wrap(html));await p.waitForTimeout(1200);
  await p.evaluate(x=>{location.hash=x},pg);await p.waitForTimeout(2500);
  await p.addScriptTag({content:AXE});
  const r=await p.evaluate(async()=>{const out=await axe.run(document.querySelector('#solo'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa','best-practice']}});
    return out.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,ex:v.nodes.slice(0,2).map(n=>n.target.join(' ').slice(0,70))}))});
  res[pg+'@'+w]=r;await p.close();}
console.log(label,engine,JSON.stringify(res,null,0));await b.close()})();
