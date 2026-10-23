const assert=require('node:assert/strict');
(async()=>{
const tabs=await(await fetch('http://127.0.0.1:9337/json')).json(),target=tabs.find(t=>t.type==='page');
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};
const wait=async q=>{for(let i=0;i<100;i++){if(await ev(q))return;await new Promise(r=>setTimeout(r,100))}throw Error(q)};
try{
await send('Page.enable');await send('Page.navigate',{url:'http://127.0.0.1:8000/?karqa='+Date.now()+'#read/kar-kyzy'});
await wait("document.querySelectorAll('[data-paragraph]').length===40");
assert.equal(await ev("document.querySelector('.reader-page h1').textContent"),'Қар қызы');
assert.equal(await ev("document.querySelectorAll('[data-chapter]').length"),14);
assert.ok(await ev("document.querySelector('.reader-notice').textContent.includes('үзінді')"));
await ev("document.querySelector('#reader-search').value='Нұржан';document.querySelector('#reader-search').dispatchEvent(new Event('input'))");
await wait("document.querySelector('#reader-hits').textContent!=='0 нәтиже'");
await ev("document.querySelector('#reader-search').value='';document.querySelector('#reader-search').dispatchEvent(new Event('input'));document.querySelector('.reader-word').click()");
await wait("document.querySelector('#reader-dialog').open");
await ev("document.querySelector('#reader-dialog').close();document.querySelector('[data-chapter=\"13\"]').click()");
await wait("document.querySelector('#reader-text').textContent.includes('Сенің де сорпалығың бар')");
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'));
console.log('PASS: internal reader, 14 sections, search, word dialog, final paragraph, mobile width');
}finally{await send('Emulation.clearDeviceMetricsOverride');ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
