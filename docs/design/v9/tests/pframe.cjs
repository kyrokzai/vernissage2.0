const pw=require('playwright');(async()=>{const b=await pw.webkit.launch();const p=await b.newPage({viewport:{width:390,height:844},deviceScaleFactor:2});
await p.goto('file://'+__dirname+'/vernissage-2.0-v9-standalone.html');await p.waitForTimeout(3000);
const ph=await p.$('#p-home-m .pw');await ph.scrollIntoViewIfNeeded();await p.waitForTimeout(800);await ph.screenshot({path:'pframe.png'});await b.close()})();
