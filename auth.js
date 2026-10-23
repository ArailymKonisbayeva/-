// Supabase is the sole authority. No locally invented authenticated user.
let authenticatedUser=null,authClient=null,authReady=false,recovering=false,establishing=null;
let authGeneration=0;
function currentUser(){return authenticatedUser}
const authEscape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function authError(text){const e=document.querySelector('#authMessage');if(e)e.textContent=text;}
function authForm(mode){
 const email='<label>Email<input name="email" type="email" autocomplete="email" required></label>';
 const password='<label>Құпиясөз<input name="password" type="password" autocomplete="'+(mode==='login'?'current-password':'new-password')+'" '+(mode==='login'?'':'minlength="12"')+' required></label>';
 const titles={login:'Қош келдіңіз',register:'Тіркелу',forgot:'Құпиясөзді қалпына келтіру',reset:'Жаңа құпиясөз'};
 return `<h2>${titles[mode]}</h2><form id="accountForm">${mode==='register'?'<label>Аты-жөні<input name="name" maxlength="100" required minlength="2" autocomplete="name"></label><label>Никнейм<input name="nickname" maxlength="50" required></label>':''}${mode==='reset'?'':email}${mode==='forgot'?'':password}${mode==='register'||mode==='reset'?'<label>Құпиясөзді қайталау<input name="confirm" type="password" autocomplete="new-password" required></label>':''}<p id="authMessage" role="status" class="auth-message"></p><button class="primary" type="submit" ${!authClient?'disabled':''}>${titles[mode]}</button></form><div class="auth-switch"><button onclick="showAuth('login')">Кіру</button> · <button onclick="showAuth('register')">Тіркелу</button> · <button onclick="showAuth('forgot')">Құпиясөз ұмытылды</button></div>`;
}
function showAuth(mode='login'){
 if(recovering)mode='reset';
 document.querySelector('.topbar').style.display='none';document.querySelector('.bottom-nav').style.display='none';
 document.querySelector('#app').innerHTML=`<section class="auth-shell"><div class="auth-card"><aside class="auth-intro"><img class="auth-logo" src="assets/brand/adebi-sayahat-logo.png" alt="Әдеби саяхат"><h1>ӘДЕБИ<br>САЯХАТ</h1><p>Жеке оқу жолыңыз барлық құрылғыда сақталады.</p></aside><section class="auth-form">${authForm(mode)}</section></div></section>`;
 if(!authClient)authError(authReady?'Supabase бапталмаған немесе жүктелмеді. SUPABASE_SETUP.md нұсқаулығын қараңыз.':'Қауіпсіз сессия тексерілуде…');
 document.querySelector('#accountForm').onsubmit=e=>submitAccount(e,mode);
}
async function submitAccount(event,mode){
 event.preventDefault();if(!authClient)return;const form=event.currentTarget,fields=Object.fromEntries(new FormData(form)),button=form.querySelector('button[type=submit]');button.disabled=true;authError('Күтіңіз…');
 try{
  if(fields.confirm!==undefined&&fields.password!==fields.confirm)throw Error('Құпиясөздер сәйкес емес.');
  const redirect=new URL('index.html',document.baseURI).href;let result;
  if(mode==='register')result=await authClient.auth.signUp({email:fields.email.trim(),password:fields.password,options:{emailRedirectTo:redirect,data:{name:fields.name.trim(),nickname:fields.nickname.trim()}}});
  if(mode==='login')result=await authClient.auth.signInWithPassword({email:fields.email.trim(),password:fields.password});
  if(mode==='forgot')result=await authClient.auth.resetPasswordForEmail(fields.email.trim(),{redirectTo:redirect});
  if(mode==='reset'){result=await authClient.auth.updateUser({password:fields.password});if(!result.error){recovering=false;await authClient.auth.signOut();showAuth('login');authError('Құпиясөз жаңартылды. Қайта кіріңіз.');return}}
  if(result?.error)throw result.error;
  if(mode==='register'){
   form.reset();
   if(result.data?.session){await establish();return;}
   authError('Сервер email растауын әлі талап етеді. Поштаңызды тексеріңіз немесе жоба иесі Supabase ішіндегі Confirm email баптауын өшірсін.');
  }
  if(mode==='forgot'){form.reset();authError('Егер бұл email үшін әрекет мүмкін болса, поштаға хат жіберілді. Кіріс және спам қалталарын тексеріңіз.');}
  if(mode==='login')await establish();
 }catch(e){authError(e.message||'Сұрау орындалмады. Қайта көріңіз.')}finally{button.disabled=false;}
}
function establish(){if(establishing)return establishing;establishing=establishAccount().finally(()=>{establishing=null});return establishing;}
async function establishAccount(){
 const generation=authGeneration;
 const {data,error}=await authClient.auth.getUser();if(error)throw error;const user=data.user;
 if(!user?.email_confirmed_at)throw Error('Алдымен email мекенжайын растаңыз.');
 const profile=await authClient.from('profiles').select('*').eq('id',user.id).single();if(profile.error)throw profile.error;
 if(generation!==authGeneration)return;
 if(profile.data.suspended)throw Error('Аккаунтқа қолжетімділік тоқтатылған.');
 if(authenticatedUser?.id!==user.id)await AccountStore.start(authClient,user);
 if(generation!==authGeneration)return;
 authenticatedUser={id:user.id,email:user.email,name:profile.data.name,nickname:profile.data.nickname,createdAt:profile.data.created_at,loggedIn:true};
 const role=await authClient.rpc('is_admin');
 if(generation!==authGeneration)return;
 authenticatedUser.isAdmin=!role.error&&role.data===true;
 window.dispatchEvent(new Event('account-ready'));
 document.querySelector('.topbar').style.display='flex';document.querySelector('.bottom-nav').style.display='flex';
 if(!location.hash||location.hash.includes('access_token')||location.hash.includes('error'))history.replaceState(null,'',location.pathname+location.search+'#home');
 window.dispatchEvent(new HashChangeEvent('hashchange'));
}
window.logoutUser=async()=>{await AccountStore.flush();const {error}=await authClient.auth.signOut();if(error){toast('Шығу орындалмады: '+error.message);return}authGeneration++;authenticatedUser=null;AccountStore.stop();location.hash='';location.reload();};
window.editProfile=async()=>{
 const u=currentUser();if(!u)return;const name=prompt('Аты-жөні:',u.name);if(name===null)return;const nickname=prompt('Никнейм:',u.nickname);if(nickname===null)return;
 const {error}=await authClient.from('profiles').update({name:name.trim().slice(0,100),nickname:nickname.trim().slice(0,50)}).eq('id',u.id);
 if(error){toast(error.message);return}await establish();toast('Профиль сақталды');
};
window.AccountAuth={get client(){return authClient},async refresh(){await establish()}};
window.requestAccountPassword=()=>new Promise(resolve=>{
 const dialog=document.createElement('dialog');dialog.innerHTML='<form method="dialog"><h2>Аккаунт иелігін растау</h2><label>Қазіргі құпиясөз<input type="password" name="password" autocomplete="current-password" required></label><p>Тек осы email-ге байланыстырылған ескі деректер көшіріледі. Бұрынғы жалпы XP және таңдаулылардың иесі анықталмайтындықтан көшірілмейді.</p><button value="ok">Растау</button><button value="cancel" formnovalidate>Бас тарту</button></form>';
 document.body.append(dialog);dialog.onclose=()=>{const value=dialog.returnValue==='ok'?dialog.querySelector('input').value:null;dialog.remove();resolve(value)};dialog.showModal();
});
addEventListener('DOMContentLoaded',async()=>{
 showAuth();
 try{
  const c=window.SUPABASE_CONFIG;if(!c?.url||!c.publishableKey)throw Error('Supabase конфигурациясы толтырылмаған.');
  if(c.publishableKey.startsWith('sb_secret_'))throw Error('Frontend ішінде secret key қолдануға болмайды.');
  if(c.publishableKey.startsWith('eyJ')){const body=JSON.parse(atob(c.publishableKey.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')));if(body.role!=='anon')throw Error('Тек publishable/anon key рұқсат етіледі.');}
  const {createClient}=await import('https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.57.4/+esm');
  recovering=new URLSearchParams(location.hash.slice(1)).get('type')==='recovery';
  authClient=createClient(c.url,c.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true,flowType:'implicit'}});
  authClient.auth.onAuthStateChange(event=>{setTimeout(async()=>{try{
   if(event==='PASSWORD_RECOVERY'){recovering=true;showAuth('reset');}
   if(event==='SIGNED_OUT'){authGeneration++;authenticatedUser=null;AccountStore.stop();document.querySelector('#modalRoot').innerHTML='';window.dispatchEvent(new Event('account-ready'));showAuth();}
   if(event==='SIGNED_IN'&&!recovering)await establish();
   if(event==='TOKEN_REFRESHED'&&!recovering)await establish();
  }catch(e){authenticatedUser=null;AccountStore.stop();showAuth();authError(e.message)}},0)});
  const {data,error}=await authClient.auth.getSession();if(error)throw error;authReady=true;
  if(recovering)showAuth('reset');else if(data.session)await establish();else showAuth();
 }catch(e){authReady=true;authenticatedUser=null;AccountStore.stop();showAuth();authError(e.message)}
});
