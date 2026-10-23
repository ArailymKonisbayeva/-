/* UUID-isolated cache. Feature keys are canonicalized before revision-checked RPC writes. */
(()=>{
 window.escapeAccountText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const raw=window.localStorage;let owner=null,email='',client=null,ready=false,timer,busy=false,epoch=0;
 let values={},revisions={},dirty={};
 const canonical=k=>k.startsWith('adebiet-reader-v1::')?'adebiet-reader-v1::'+k.split('::').slice(2).join('::'):k.replace(/::[^:]+$/,'');
 const allowed=k=>/^(adebiet-|asyk-|shyrak-)/.test(k)&&!/(password|token|secret|adebiet-user)/i.test(k);
 const status=(text,error=false)=>{window.accountSyncStatus=text;window.dispatchEvent(new CustomEvent('account-sync',{detail:{text,error}}));};
 const cache=()=>{if(owner)raw.setItem('adebiet-cloud-cache::'+owner,JSON.stringify({values,revisions,dirty}));};
 const decode=v=>{try{return JSON.parse(v)}catch{return v}};
 window.UserStorage={getItem(k){return ready?(values[canonical(k)]??null):null},setItem(k,v){k=canonical(k);if(!ready||!allowed(k))return;v=String(v);if(values[k]===v)return;values[k]=v;dirty[k]=true;cache();status('Өзгерістер сақталуда…');clearTimeout(timer);timer=setTimeout(flush,700);},removeItem(k){this.setItem(k,'null')}};
 async function flush(){
  if(!ready||busy)return;busy=true;const generation=epoch,uid=owner;
  try{for(const k of Object.keys(dirty)){
   if(generation!==epoch)return;
   const sent=values[k],{data,error}=await client.rpc('save_progress',{p_key:k,p_value:decode(sent),p_revision:revisions[k]||0});
   if(generation!==epoch||uid!==owner)return;
   if(error)throw error;revisions[k]=data;if(values[k]===sent)delete dirty[k];cache();
  }status(Object.keys(dirty).length?'Сақталмаған өзгерістер бар':'Бұлтта сақталды');}
  catch(e){status(e.code==='40001'?'Басқа құрылғыда өзгеріс бар. Профильден синхрондау қайшылығын шешіңіз.':'Синхрондау орындалмады. Өзгерістер осы құрылғыда сақтаулы. Интернетті және аккаунт күйін тексеріңіз.',true);}
  finally{busy=false;}
 }
 window.AccountStore={flush,
  async start(supabase,user){
   epoch++;client=supabase;owner=user.id;email=user.email;ready=false;values={};revisions={};dirty={};const generation=epoch;
   let cached={};try{cached=JSON.parse(raw.getItem('adebiet-cloud-cache::'+owner)||'{}')}catch{}
   const {data,error}=await client.from('user_progress').select('key,value,revision').eq('user_id',owner);if(error)throw error;if(generation!==epoch)return;
   for(const row of data){values[row.key]=typeof row.value==='string'?row.value:JSON.stringify(row.value);revisions[row.key]=row.revision;}
   for(const k of Object.keys(cached.dirty||{}))if(allowed(k)){values[k]=cached.values[k];revisions[k]=cached.revisions[k]||0;dirty[k]=true;}
   const badges=await client.from('user_achievements').select('achievement_id').eq('user_id',owner);if(badges.error)throw badges.error;if(generation!==epoch)return;
   window.cloudAchievementIds=badges.data.map(b=>b.achievement_id);
   ready=true;cache();this.refreshGlobals();await flush();
  },
  stop(){epoch++;ready=false;owner=null;values={};dirty={};revisions={};window.cloudAchievementIds=[];clearTimeout(timer);this.refreshGlobals();},
  refreshGlobals(){if(typeof saved!=='undefined'){saved=JSON.parse(values['adebiet-favs']||'[]');xp=Number(values['adebiet-xp'])||0;completed=Number(values['adebiet-completed'])||0;gamesDone=Number(values['adebiet-games'])||0;scores=JSON.parse(values['adebiet-scores']||'[]');}},
  async resolve(){
   if(!confirm('Сақталмаған өзгерістерді JSON көшірмесіне жүктеп, бұлттағы нұсқаны қабылдайсыз ба?'))return;
   const url=URL.createObjectURL(new Blob([JSON.stringify({user_id:owner,values,dirty},null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='adebiet-progress-backup.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
   raw.removeItem('adebiet-cloud-cache::'+owner);await this.start(client,{id:owner,email});location.reload();
  },
  // Email auto-confirmation does not prove ownership of a legacy browser account.
  legacyAvailable(){return false},
  async importLegacy(){throw Error('Ескі прогресті email арқылы көшіру өшірілген: пошта иелігі расталмайды.');}
 };
 try{const old=JSON.parse(raw.getItem('adebiet-user')||'null');if(old?.email)raw.setItem('adebiet-legacy-owner',JSON.stringify({email:old.email}));raw.removeItem('adebiet-user')}catch{raw.removeItem('adebiet-user')}
 addEventListener('online',flush);setInterval(()=>{if(Object.keys(dirty).length)flush()},15000);
 addEventListener('beforeunload',e=>{if(Object.keys(dirty).length){e.preventDefault();e.returnValue='';}});
})();
