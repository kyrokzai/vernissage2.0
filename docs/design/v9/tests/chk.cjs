const pw=require('playwright');(async()=>{const b=await pw.chromium.launch();const p=await b.newPage({viewport:{width:390,height:844}});
await p.goto('file://'+__dirname+'/vernissage-2.0-v9-standalone.html#site-project');await p.waitForTimeout(1500);
const f=()=>p.evaluate(()=>[...document.querySelectorAll('#solo .pj-fig.full')].map(x=>({pre:x.classList.contains('f-pre'),ph:Math.round(x.querySelector('.ph').getBoundingClientRect().right),frm:Math.round(x.querySelector('.pj-frm').getBoundingClientRect().right),sw:document.documentElement.scrollWidth})));
console.log('before',JSON.stringify(await f()));for(let y=0;y<7000;y+=400){await p.evaluate(y=>scrollTo(0,y),y);await p.waitForTimeout(100);}await p.waitForTimeout(2600);console.log('after',JSON.stringify(await f()));await b.close()})();
