// Temporary reader profile: no server account or persistent session; password is never stored.
let authenticatedUser=null;
function currentUser(){return authenticatedUser}
const authEscape=window.escapeAccountText;
function showAuth(){
 document.querySelector('.topbar').style.display='none';
 document.querySelector('.bottom-nav').style.display='none';
 document.querySelector('#app').innerHTML=`<section class="auth-shell"><div class="auth-card"><aside class="auth-intro"><img class="auth-logo" src="assets/brand/adebi-sayahat-logo.png" alt="Әдеби саяхат"><h1>ӘДЕБИ<br>САЯХАТ</h1><p>Әдеби саяхатыңызды бірден бастаңыз.</p></aside><section class="auth-form"><h2>Тіркелу / Кіру</h2><form id="accountForm"><label>Аты-жөні<input name="name" maxlength="100" minlength="2" autocomplete="name" required></label><label>Никнейм<input name="nickname" maxlength="50" required></label><label>Email<input name="email" type="email" maxlength="254" autocomplete="email" required></label><label>Құпиясөз<input name="password" type="password" minlength="6" autocomplete="new-password" required></label><button class="primary" type="submit">Саяхатты бастау →</button></form></section></div></section>`;
 document.querySelector('#accountForm').onsubmit=submitAccount;
}
function submitAccount(event){
 event.preventDefault();
 const fields=Object.fromEntries(new FormData(event.currentTarget));
 const name=String(fields.name||'').trim().slice(0,100),nickname=String(fields.nickname||'').trim().slice(0,50);
 const email=String(fields.email||'').trim().slice(0,254);
 if(name.length<2||!nickname||!/^\S+@\S+\.\S+$/.test(email)||String(fields.password||'').length<6)return;
 event.currentTarget.reset();
 AccountStore.stop();
 authenticatedUser={id:crypto.randomUUID(),name,nickname,email,createdAt:new Date().toISOString(),loggedIn:true,isAdmin:false};
 window.dispatchEvent(new Event('account-ready'));
 document.querySelector('.topbar').style.display='flex';document.querySelector('.bottom-nav').style.display='flex';
 history.replaceState(null,'',location.pathname+location.search+'#home');
 window.dispatchEvent(new HashChangeEvent('hashchange'));
}
window.logoutUser=()=>{authenticatedUser=null;AccountStore.stop();location.reload()};
window.editProfile=()=>{
 const u=currentUser();if(!u)return;
 const name=prompt('Аты-жөні:',u.name);if(name===null)return;
 const nickname=prompt('Никнейм:',u.nickname);if(nickname===null)return;
 if(name.trim().length<2||!nickname.trim())return;
 u.name=name.trim().slice(0,100);u.nickname=nickname.trim().slice(0,50);
 window.dispatchEvent(new HashChangeEvent('hashchange'));
};
addEventListener('DOMContentLoaded',showAuth);
