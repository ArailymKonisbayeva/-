// Opt-in real API checks. Use a disposable staging project and three confirmed accounts.
const assert=require('node:assert/strict');const env=process.env,url=env.SUPABASE_URL,key=env.SUPABASE_PUBLISHABLE_KEY;
const required=['SUPABASE_URL','SUPABASE_PUBLISHABLE_KEY','TEST_USER_A_EMAIL','TEST_USER_A_PASSWORD','TEST_USER_B_EMAIL','TEST_USER_B_PASSWORD','TEST_ADMIN_EMAIL','TEST_ADMIN_PASSWORD'];
if(required.some(k=>!env[k])){console.log('SKIP live Supabase tests: configure .env test accounts first.');process.exit(0)}
async function call(path,token,method='GET',body){const r=await fetch(url+path,{method,headers:{apikey:key,Authorization:'Bearer '+(token||key),'Content-Type':'application/json'},body:body===undefined?undefined:JSON.stringify(body)});const text=await r.text();let data;try{data=JSON.parse(text)}catch{data=text}return{ok:r.ok,status:r.status,data}}
async function login(label){const r=await call('/auth/v1/token?grant_type=password',null,'POST',{email:env[`TEST_${label}_EMAIL`],password:env[`TEST_${label}_PASSWORD`]});assert.ok(r.ok,'Test account login failed: '+label);return r.data}
(async()=>{
 const a=await login('USER_A'),b=await login('USER_B'),admin=await login('ADMIN');
 const read=await call('/rest/v1/profiles?select=id',a.access_token);assert.ok(read.ok);assert.deepEqual(read.data.map(x=>x.id),[a.user.id]);assert.ok(!(await call('/rest/v1/profiles?select=id',null)).ok,'Anonymous enumeration');
 for(const fn of ['admin_accounts','admin_export','is_admin']){const r=await call('/rest/v1/rpc/'+fn,a.access_token,'POST',{});if(fn==='is_admin')assert.equal(r.data,false);else assert.ok(!r.ok,'Non-admin RPC denied');}
 for(const body of [{suspended:false},{created_at:new Date().toISOString()}])assert.ok(!(await call('/rest/v1/profiles?id=eq.'+a.user.id,a.access_token,'PATCH',body)).ok,'Protected profile column');
 const k='adebiet-test-'+Date.now();let r=await call('/rest/v1/rpc/save_progress',a.access_token,'POST',{p_key:k,p_value:{passed:true},p_revision:0});assert.ok(r.ok,'Save own progress');const first=r.data;
 assert.ok(!(await call('/rest/v1/rpc/save_progress',a.access_token,'POST',{p_key:k,p_value:{passed:false},p_revision:0})).ok,'Revision conflict');
 r=await call('/rest/v1/user_progress?user_id=eq.'+a.user.id,b.access_token);assert.ok(r.ok);assert.equal(r.data.length,0,'Cross-user progress read');
 assert.ok(!(await call('/rest/v1/user_progress',b.access_token,'POST',{user_id:a.user.id,key:k,value:{hacked:true}})).ok,'Cross-user insert');
 assert.ok(!(await call('/rest/v1/user_achievements',b.access_token,'POST',{user_id:b.user.id,achievement_id:'fake'})).ok,'Cannot award badges directly');
 const a2=await login('USER_A');r=await call('/rest/v1/user_progress?key=eq.'+k,a2.access_token);assert.equal(r.data[0].revision,first,'Progress after fresh login');
 r=await call('/rest/v1/rpc/admin_accounts',admin.access_token,'POST',{});assert.ok(r.ok&&r.data.total>=3,'Admin listing');
 assert.ok((await call('/rest/v1/rpc/admin_progress',admin.access_token,'POST',{p_user:a.user.id})).ok,'Admin progress');assert.ok((await call('/rest/v1/rpc/admin_export',admin.access_token,'POST',{})).ok,'Admin audited export');
 assert.ok((await call('/auth/v1/logout',a2.access_token,'POST')).ok,'Logout');
 console.log('PASS live: login, persistence, isolation, protected columns, conflict, admin read/export, logout. Retained test key: '+k);
 console.log('MANUAL REQUIRED: signup, confirmation mail, duplicate signup, recovery email/link/new password, suspend/restore, browser acceptance.');
})().catch(e=>{console.error(e.message);process.exitCode=1});
