/* Public aggregate only. Independent of the private progress/account cache. */
(()=>{
 const config=window.SUPABASE_CONFIG||{},key='public-reader-count:'+config.url;
 let cached=null,pending=null,lastAttempt=0,failed=false;
 const valid=x=>x&&Number.isSafeInteger(x.count)&&x.count>=0&&Number.isFinite(Date.parse(x.updatedAt))&&Date.parse(x.updatedAt)<=Date.now()+60000;
 try{const value=JSON.parse(localStorage.getItem(key));if(valid(value))cached=value}catch{}
 function paint(){
  for(const box of document.querySelectorAll('.public-reader-count')){
   const title=cached?`Бізбен бірге — ${cached.count.toLocaleString('kk-KZ')} оқырман`:failed?'Оқырмандар саны уақытша қолжетімсіз':'Деректер жүктелуде…';
   const note=cached?'Тіркелген аккаунттар':failed?'Байланыс қалпына келгенде қайта тексереміз.':'Тіркелген аккаунттар саны';
   if(box.querySelector('strong').textContent!==title)box.querySelector('strong').textContent=title;
   if(box.querySelector('small').textContent!==note)box.querySelector('small').textContent=note;
  }
 }
 async function refresh(force=false){
  if(pending)return pending;if(!force&&Date.now()-lastAttempt<60000)return;
  lastAttempt=Date.now();
  pending=(async()=>{try{
   if(!config.url||!config.publishableKey)throw Error('Missing public config');
   const r=await fetch(config.url+'/rest/v1/rpc/public_reader_count',{method:'POST',headers:{apikey:config.publishableKey,'Content-Type':'application/json'},body:'{}',signal:AbortSignal.timeout(8000)});
   if(!r.ok)throw Error('Counter unavailable');const count=await r.json();
   if(!Number.isSafeInteger(count)||count<0)throw Error('Invalid aggregate');
   cached={count,updatedAt:new Date().toISOString()};failed=false;
   try{localStorage.setItem(key,JSON.stringify(cached))}catch{/* The in-memory value remains available. */}
  }catch{failed=true}finally{paint();pending=null}})();
  return pending;
 }
 function mount(){
  const target=document.querySelector('.home-hero-copy')||document.querySelector('.auth-intro');if(!target||target.querySelector('.public-reader-count'))return;
  const box=document.createElement('div');box.className='public-reader-count';box.setAttribute('role','status');box.setAttribute('aria-live','polite');box.innerHTML='<strong></strong><small></small>';target.append(box);paint();refresh();
 }
 new MutationObserver(mount).observe(document.querySelector('#app'),{childList:true,subtree:true});
 addEventListener('online',()=>{if(document.querySelector('.public-reader-count'))refresh(true)});
 window.PublicReaderCount={refresh,mount};mount();
})();
