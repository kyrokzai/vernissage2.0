const pw=require('playwright');const {execSync}=require('child_process');
(async()=>{const b=await pw.chromium.launch();const p=await b.newPage({viewport:{width:1440,height:900}});
await p.goto('file://'+__dirname+'/vernissage-2.0-v9-standalone.html#site-home');await p.waitForTimeout(1200);await p.addStyleTag({content:'#solo-back{display:none!important}'});let i=0;
for(const l of ['straight','corner','island'])for(const f of ['oak','walnut','ivory','graphite']){await p.click(`body.solo [data-lay=${l}]`);await p.click(`body.solo [data-fin=${f}]`);await p.waitForTimeout(1000);
 await (await p.$('body.solo .k-stage')).screenshot({path:`g-${i++}.png`});}
await b.close()})();
