const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const app={innerHTML:''};
const c={URL,window:{},document:{querySelector:s=>s==='#app'?app:null},MutationObserver:class{observe(){}},addEventListener(){},scrollTo(){}};
for(const file of ['data/verified-literary-data.js','data/curriculum-literature.js','data/reading-sources.js','reader.js'])vm.runInNewContext(fs.readFileSync(file,'utf8'),c);
(async()=>{
const db=c.window.VERIFIED_LITERARY_DATA, registry=c.window.LITERARY_READING_SOURCES;
assert.deepEqual(Object.keys(registry).sort(),Object.keys(db).sort());
let links=0;
for(const [id,row] of Object.entries(registry)){
 assert.equal(row.checkedAt,'2026-10-21');
 for(const s of row.sources){assert.equal(new URL(s.url).protocol,'https:');assert.ok(s.title&&s.note&&s.format&&s.verification);links++;}
 if(!row.mode.startsWith('local-')){
  await c.window.LiteraryReader.open(id);
  assert.ok(app.innerHTML.includes(db[id].title),id);
  assert.ok(!app.innerHTML.includes('Мәтін әзірге қолжетімсіз'),id);
  for(const s of row.sources)assert.ok(app.innerHTML.includes(s.url),id+' link');
  if(row.mode==='pending')assert.ok(app.innerHTML.includes('Мәтін дереккөзі іздестірілуде'));
 }
}
assert.equal(registry.aiqai.mode,'pending');
assert.equal(registry.alpan.mode,'local-excerpt');
assert.equal(registry.ertostik.mode,'local-full');
assert.equal(registry.kokserak.sources[0].format,'Аудио');
console.log(`PASS: ${Object.keys(db).length} reading records, ${links} destinations, external rendering and honest availability labels`);
})().catch(e=>{console.error(e);process.exitCode=1});
