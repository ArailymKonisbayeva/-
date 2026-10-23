(()=>{
 const E=authEscape;let offset=0,query='',ascending=false,renderToken=0;
 const rpc=async(name,args={})=>{const {data,error}=await AccountAuth.client.rpc(name,args);if(error)throw error;return data;};
 const csvCell=x=>'"'+String(x??'').replace(/^[\s]*[=+@-]/,"'$&").replaceAll('"','""')+'"';
 async function render(){
  const token=++renderToken,root=document.querySelector('#app');root.innerHTML='<section class="section"><h1>Әкімшілік</h1><p role="status">Рұқсат тексерілуде…</p></section>';
  try{
   if(!await rpc('is_admin'))throw Error('Бұл бөлім тек расталған әкімшіге қолжетімді.');
   const data=await rpc('admin_accounts',{p_search:query,p_ascending:ascending,p_offset:offset,p_limit:50});
   const stats=await rpc('admin_statistics');
   if(token!==renderToken||location.hash!=='#admin')return;
   root.innerHTML=`<section class="section"><h1>Әкімшілік</h1><p>Тіркелген пайдаланушылар: <b>${data.total}</b> · Іздеу нәтижесі: ${data.filtered}</p><form id="adminSearch"><label>Аты немесе email <input name="q" maxlength="100" value="${E(query)}"></label><label>Тіркелу күні <select name="order"><option value="desc">Жаңалары алдымен</option><option value="asc" ${ascending?'selected':''}>Ескілері алдымен</option></select></label><button class="primary">Іздеу</button></form><p><button id="adminExport" class="secondary">CSV экспорт (ең көбі 1000 аккаунт)</button></p><p id="adminStatus" role="status"></p><div style="overflow:auto"><table><thead><tr><th>Аты / никнейм</th><th>Email</th><th>Тіркелген күні</th><th>Әрекеттер</th></tr></thead><tbody>${data.rows.map((u,i)=>`<tr><td>${E(u.name)} / ${E(u.nickname)}</td><td>${E(u.email)}</td><td>${E(new Date(u.created_at).toLocaleDateString('kk-KZ'))}</td><td><button data-detail="${i}">Прогресс</button> <button data-suspend="${i}" ${u.id===currentUser()?.id?'disabled':''}>${u.suspended?'Қалпына келтіру':'Бұғаттау'}</button></td></tr>`).join('')}</tbody></table></div><p><button id="adminPrev" ${offset===0?'disabled':''}>←</button> ${offset+1}–${offset+data.rows.length} <button id="adminNext" ${offset+50>=data.filtered?'disabled':''}>→</button></p><section id="adminDetail"></section><p>Бұғаттау базаға қолжетімділікті дереу тоқтатады. Аккаунтты жою және әкімші тағайындау — тек Supabase Dashboard/SQL арқылы.</p></section>`;
   const act=fn=>async()=>{try{await fn()}catch(e){document.querySelector('#adminStatus').textContent=e.message}};
   const summary=document.createElement('p');summary.textContent=`Оқу белсенділігі бар аккаунттар: ${stats.active_learners} · Зерттелген шығармалар: ${stats.completed_works} · Ойын нәтижелері: ${stats.game_results} · Жетістіктер: ${stats.achievements}`;document.querySelector('#adminSearch').before(summary);
   document.querySelector('#adminSearch').onsubmit=e=>{e.preventDefault();const f=new FormData(e.target);query=f.get('q');ascending=f.get('order')==='asc';offset=0;render()};
   document.querySelector('#adminPrev').onclick=()=>{offset=Math.max(0,offset-50);render()};document.querySelector('#adminNext').onclick=()=>{offset+=50;render()};
   root.querySelectorAll('[data-detail]').forEach(b=>b.onclick=act(async()=>{
    const u=data.rows[+b.dataset.detail],d=await rpc('admin_progress',{p_user:u.id});if(location.hash!=='#admin')return;
    const val=k=>d.progress.find(r=>r.key===k)?.value,works=val('adebiet-completed-works')||[],games=val('adebiet-game-results')||[];
    document.querySelector('#adminDetail').innerHTML=`<h2>${E(u.name)} — прогресс</h2><p>Шығарма: ${Array.isArray(works)?works.length:0} · Ойын: ${Array.isArray(games)?games.length:0} · XP: ${E(val('adebiet-xp')||0)} · Жетістік: ${d.achievements.length}</p><p>Бұл — пайдаланушы сақтаған оқу нәтижелері, емтиханның серверлік тексерілген бағалары емес.</p><details><summary>Шығармалар, ойындар, квесттер және оқу орны</summary><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${E(JSON.stringify(d,null,2))}</pre></details>`;
   }));
   root.querySelectorAll('[data-suspend]').forEach(b=>b.onclick=act(async()=>{const u=data.rows[+b.dataset.suspend];if(!confirm(`${u.email}: ${u.suspended?'қалпына келтіру':'бұғаттау'}?`))return;await rpc('admin_suspend',{p_user:u.id,p_suspended:!u.suspended});await render()}));
   document.querySelector('#adminExport').onclick=act(async()=>{
    if(!confirm('Жеке деректері бар CSV жүктеледі. Файлды қауіпсіз сақтап, тек рұқсаты бар адамдарға беріңіз. Жалғастыру керек пе?'))return;
    const result=await rpc('admin_export',{p_search:query}),keys=['id','name','nickname','email','created_at','suspended'];
    const csv='\uFEFF'+[keys.map(csvCell).join(','),...result.rows.map(r=>keys.map(k=>csvCell(r[k])).join(','))].join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})),a=document.createElement('a');a.href=url;a.download='adebiet-accounts.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
    document.querySelector('#adminStatus').textContent=`Экспорт: ${result.rows.length} / ${result.filtered}. Ең көбі 1000 жазба; қажет болса іздеуді тарылтыңыз.`;
   });
  }catch(e){if(token===renderToken)root.innerHTML=`<section class="section"><h1>Қолжетімділік жоқ</h1><p role="alert">${E(e.message)}</p><a href="#profile">Профиль</a></section>`;}
 }
 window.AdminPanel={render,csvCell};
 function profileTools(){
  if(location.hash!=='#profile'||!currentUser()||document.querySelector('#accountTools'))return;
  const box=document.createElement('section');box.id='accountTools';box.className='work-card';box.innerHTML=`<h2>Аккаунт және синхрондау</h2><p>Никнейм: ${E(currentUser().nickname)}</p><p id="syncStatus" role="status">${E(window.accountSyncStatus||'')}</p><button data-retry>Қайта синхрондау</button> <button data-resolve>Қайшылықты шешу / бұлттан жаңарту</button>${AccountStore.legacyAvailable()?'<button data-import>Ескі браузер прогресін көшіру</button>':''}${currentUser().isAdmin?'<p><a href="admin/">Әкімшілік панелі →</a></p>':''}`;
  document.querySelector('#app').append(box);box.querySelector('[data-retry]').onclick=()=>AccountStore.flush();box.querySelector('[data-resolve]').onclick=()=>AccountStore.resolve();box.querySelector('[data-import]')?.addEventListener('click',async()=>{try{await AccountStore.importLegacy()}catch(e){toast(e.message)}});
 }
 new MutationObserver(profileTools).observe(document.querySelector('#app'),{childList:true,subtree:true});
 addEventListener('account-sync',e=>{const p=document.querySelector('#syncStatus');if(p)p.textContent=e.detail.text;let banner=document.querySelector('#cloudStatus');if(!banner){banner=document.createElement('div');banner.id='cloudStatus';banner.setAttribute('role','status');document.querySelector('.topbar').after(banner)}banner.textContent=e.detail.text;banner.dataset.error=String(e.detail.error);});
 addEventListener('account-ready',()=>{if(!currentUser())document.querySelector('#cloudStatus')?.remove()});
})();
