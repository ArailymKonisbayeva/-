// In-memory progress only. Existing browser/cloud data is not read or deleted.
(()=>{
 window.escapeAccountText=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 let values=new Map();
 window.UserStorage={getItem(k){return values.get(String(k))??null},setItem(k,v){values.set(String(k),String(v))},removeItem(k){values.delete(String(k))}};
 window.cloudAchievementIds=[];
 window.AccountStore={stop(){values.clear();window.cloudAchievementIds=[];if(typeof saved!=='undefined'){saved=[];xp=0;completed=0;gamesDone=0;scores=[];}}};
})();
