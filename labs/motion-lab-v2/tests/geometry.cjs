const { chromium } = require('playwright');
const S=process.argv[2]||'test-results';require('fs').mkdirSync(S+'/v2shots',{recursive:true}); const url=process.argv[3]||'http://127.0.0.1:4173/';
(async()=>{const b=await chromium.launch(); const p=await b.newPage({viewport:{width:1440,height:900}}); await p.goto(url); await p.waitForTimeout(500);
 for (const sc of ['Кухня','Гостиная','Ресторан']) { await p.getByRole('tab',{name:sc}).click(); await p.waitForTimeout(300);
  const N=await p.locator('.tick').count(); const r=await p.evaluate(()=>{const t=document.querySelector('.track');return {top:t.getBoundingClientRect().top+scrollY,len:t.offsetHeight-innerHeight}});
  for(let k=0;k<N;k++){ await p.evaluate(y=>scrollTo(0,y), r.top+k/(N-1)*r.len); await p.waitForTimeout(2200);
   const bad=await p.evaluate(()=>[...document.querySelectorAll('.scene-svg g[transform^="translate"]')].map(g=>g.getAttribute('transform')).filter(t=>!/^translate\(0 0\)$/.test(t)));
   const op=await p.evaluate(()=>[...document.querySelectorAll('.scene-svg g[opacity]')].map(g=>+g.getAttribute('opacity')).filter(o=>o>0.001&&o<0.999).length);
   if(bad.length||op) console.log(sc,'этап',k+1,'смещены:',bad.slice(0,6),'полупрозрачных групп:',op); }
 }
 console.log('done'); await b.close();})();
