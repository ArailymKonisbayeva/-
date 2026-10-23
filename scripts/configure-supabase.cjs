// Generates only public config. Run: node --env-file=.env scripts/configure-supabase.cjs
const fs=require('node:fs');
const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_PUBLISHABLE_KEY;
if(!url||!key)throw Error('Set SUPABASE_URL and SUPABASE_PUBLISHABLE_KEY');
if(new URL(url).protocol!=='https:'&&!/^http:\/\/(localhost|127\.0\.0\.1):/.test(url))throw Error('HTTPS required');
if(!key.startsWith('sb_publishable_')){
 let role;try{role=JSON.parse(Buffer.from(key.split('.')[1],'base64url')).role}catch{}
 if(role!=='anon')throw Error('Only publishable or legacy anon key allowed. Never use service_role/secret.');
}
fs.writeFileSync('supabase-config.js','// Generated PUBLIC configuration. No secrets.\nwindow.SUPABASE_CONFIG = '+JSON.stringify({url,publishableKey:key},null,2)+';\n');
console.log('Public Supabase configuration written.');
