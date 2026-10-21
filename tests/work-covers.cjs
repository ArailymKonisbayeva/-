const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
vm.runInContext(fs.readFileSync(path.join(root,'data/work-covers.js'),'utf8'),ctx);
const covers=ctx.window.LITERARY_WORK_COVERS;
assert.equal(Object.keys(covers).length,4);
for(const [id,file] of Object.entries(covers)){
  const b=fs.readFileSync(path.join(root,file));
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',id+' PNG');
  const width=b.readUInt32BE(16),height=b.readUInt32BE(20);
  assert.ok(height>width&&width>=512,id+' portrait dimensions');
}
for(const file of ['experience.js','work-detail.js','national-games.js']){
  const code=fs.readFileSync(path.join(root,file),'utf8');new vm.Script(code);
  assert.ok(code.includes('window.LITERARY_WORK_COVERS'),file+' uses cover manifest');
}
console.log('PASS: four portrait covers and three display integrations');
