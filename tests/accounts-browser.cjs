// Dedicated QA browser only. No test account creation or login.
const assert=require('node:assert/strict');
(async()=>{
const tabs=await(await fetch('http://127.0.0.1:9337/json')).json(),target=tabs.find(t=>t.type==='page');
const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let seq=0;const pending=new Map(),errors=[];
ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text)};
const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
const ev=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.text);return r.result.value};
const wait=async q=>{for(let i=0;i<100;i++){if(await ev(q))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timeout: '+q)};
try{
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:"localStorage.setItem('adebiet-user',JSON.stringify({email:'legacy-qa@example.test',password:'test-only-plaintext',loggedIn:true}));"});
 await send('Page.navigate',{url:'http://127.0.0.1:8000/?accounts-qa='+Date.now()+'#admin'});
 await wait("typeof authReady!=='undefined' && authReady && document.querySelector('#accountForm')");
 const configured=await ev('Boolean(SUPABASE_CONFIG.url && SUPABASE_CONFIG.publishableKey)');
 if(configured)assert.ok(await ev('Boolean(AccountAuth.client)'), 'Configured SDK must load');
 assert.equal(await ev('currentUser()'),null);assert.equal(await ev("localStorage.getItem('adebiet-user')"),null);
 assert.equal(await ev("document.querySelector('#accountForm button[type=submit]').disabled"),!configured);
 assert.equal(await ev("document.querySelector('#adminSearch')"),null);
 await ev("showAuth('register')");assert.ok(await ev("document.querySelector('input[name=nickname]')!==null"));
 await ev("showAuth('forgot')");assert.equal(await ev("document.querySelector('input[type=password]')"),null);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.ok(await ev('document.documentElement.scrollWidth<=innerWidth+1'));
 assert.deepEqual(errors,[]);console.log('PASS browser: no fake legacy login, plaintext removed, admin denied, configuration/SDK readiness, forms and mobile layout. Signup and email delivery not tested.');
}finally{await send('Emulation.clearDeviceMetricsOverride');ws.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
