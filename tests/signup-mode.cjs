const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
async function run(result,mode='register'){
 const message={textContent:''},button={disabled:false};let entered=0,reset=0;
 const form={querySelector:()=>button,reset(){reset++}},fields={email:'test@example.test',password:'long-test-password',confirm:'long-test-password',name:'Test',nickname:'test'};
 const c={window:{},document:{baseURI:'https://example.test/index.html',querySelector:()=>message},addEventListener(){},URL,FormData:class{constructor(){return Object.entries(fields)}},result,enter:()=>entered++};
 vm.createContext(c);vm.runInContext(fs.readFileSync('auth.js','utf8'),c);
 vm.runInContext('authClient={auth:{signUp:async()=>result,resetPasswordForEmail:async()=>result}};establish=async()=>enter();',c);
 await c.submitAccount({preventDefault(){},currentTarget:form},mode);return{entered,reset,message:message.textContent,disabled:button.disabled};
}
(async()=>{
 let r=await run({data:{session:{access_token:'test-session'}}});assert.equal(r.entered,1);assert.equal(r.reset,1);assert.equal(r.disabled,false);
 r=await run({data:{session:null}});assert.equal(r.entered,0);assert.ok(r.message.includes('Confirm email'));
 r=await run({error:{message:'User already registered'}});assert.equal(r.entered,0);assert.equal(r.message,'User already registered');
 r=await run({data:{}},'forgot');assert.equal(r.entered,0);assert.ok(r.message.includes('поштаға хат'));
 const store=fs.readFileSync('account-store.js','utf8');assert.ok(store.includes('legacyAvailable(){return false}'));assert.ok(store.includes('async importLegacy(){throw Error('));
 console.log('PASS: real-session signup path, confirmation-required fallback, duplicate error, password reset mail, legacy import disabled');
})().catch(e=>{console.error(e);process.exitCode=1});
