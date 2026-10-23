const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function scenario(seed,response){
 const values=new Map(seed?[['public-reader-count:https://example.test',JSON.stringify(seed)]]:[]),strong={textContent:''},small={textContent:''};let mounted=false,calls=0;
 const box={setAttribute(){},querySelector:s=>s==='strong'?strong:small};
 const target={querySelector:()=>mounted?box:null,append(){mounted=true}};
 const c={window:{SUPABASE_CONFIG:{url:'https://example.test',publishableKey:'public'}},localStorage:{getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,v)},document:{querySelector:s=>s==='.home-hero-copy'?target:{},querySelectorAll:()=>mounted?[box]:[],createElement:()=>box},MutationObserver:class{observe(){}},addEventListener(){},AbortSignal,fetch:async()=>{calls++;if(response instanceof Error)throw response;return{ok:true,json:async()=>response}}};
 vm.runInNewContext(fs.readFileSync('reader-count.js','utf8'),c);await c.window.PublicReaderCount.refresh();return{strong,small,values,calls};
}
(async()=>{
 const old={count:27,updatedAt:'2026-01-01T12:00:00Z'};
 let r=await scenario(old,new Error('offline'));assert.ok(r.strong.textContent.includes('27'));assert.equal(r.small.textContent,'Тіркелген аккаунттар');assert.deepEqual(JSON.parse([...r.values.values()][0]),old);
 r=await scenario(old,31);assert.ok(r.strong.textContent.includes('31'));assert.equal(JSON.parse([...r.values.values()][0]).count,31);assert.equal(r.calls,1);
 r=await scenario(null,0);assert.ok(r.strong.textContent.includes('0 оқырман'));
 r=await scenario(null,new Error('offline'));assert.ok(!r.strong.textContent.includes('0'));assert.ok(r.strong.textContent.includes('қолжетімсіз'));
 r=await scenario(old,{count:999});assert.ok(r.strong.textContent.includes('27'));
 console.log('PASS: fresh count, legitimate zero, offline cached count/date, empty cache, invalid response, request deduplication');
})().catch(e=>{console.error(e);process.exitCode=1});
