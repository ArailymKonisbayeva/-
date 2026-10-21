const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'..'),ctx=vm.createContext({window:{}});
const run=name=>vm.runInContext(fs.readFileSync(path.join(root,name),'utf8'),ctx,{filename:name});
run('data/verified-literary-data.js');
const old=ctx.window.VERIFIED_LITERARY_DATA,oldIds=Object.keys(old);
run('data/curriculum-literature.js');run('data/curriculum-exercises.js');run('data/curriculum-analysis.js');
const before=JSON.stringify(ctx.window.VERIFIED_LITERARY_DATA);
run('data/curriculum-literature.js');run('data/curriculum-exercises.js');run('data/curriculum-analysis.js');
assert.equal(JSON.stringify(ctx.window.VERIFIED_LITERARY_DATA),before,'Repeated enrichment must be idempotent');
run('literary-games.js');
const db=ctx.window.VERIFIED_LITERARY_DATA,ids=ctx.window.CURRICULUM_WORK_IDS;
assert.equal(ids.length,10);assert.equal(Object.keys(db).length,17);assert.equal(db['abai-zholy'],undefined);assert.ok(!ids.includes('abai-zholy'));
oldIds.forEach(id=>{assert.ok(db[id]);for(const g of old[id].games)assert.ok(db[id].games.some(x=>x.id===g.id),'Preserve '+id+'/'+g.id)});
assert.equal(db.kozy.authorType,'folklore');assert.equal(db['qozy-drama'],undefined);assert.equal(db['qulager-poem'].author,'Ілияс Жансүгіров');
const expected={kokserak:[7,9],balalyk:[7],ashkan:[7],'batyr-bayan':[8],'aqqular-uiyqtaganda':[8],alpan:[9,10],kan:[10],akbilek:[12],qaragoz:[12],'qulager-poem':[10]};
let questions=0,paths=0;
for(const id of ids){const w=db[id];assert.equal(JSON.stringify(w.grades),JSON.stringify(expected[id]));
  assert.ok(w.content.characters.length>=3);assert.ok(w.content.vocabulary.length);assert.ok(w.content.artistry.length);assert.ok(w.content.plotEvents.length>=3,id+' order data');
  assert.ok(w.content.readingGuide.composition);assert.ok(w.content.characters[0].study.motivation);assert.ok(w.questIntroduction.rule);
  const gameIds=w.games.map(g=>g.id);assert.equal(new Set(gameIds).size,gameIds.length);
  for(const name of ['literary-quiz','character-guess','matching','plot-order','story-rewrite'])assert.ok(gameIds.includes(name),id+'/'+name);
  for(const r of (w.content.relatedWorks||[])){assert.ok(db[r.workId]);assert.ok(db[r.workId].content.relatedWorks.some(x=>x.workId===id))}
  for(const g of w.games){
    if(g.type==='quiz')for(const q of g.questions){assert.ok(q.explanation);assert.ok(q.options.length>=2);assert.equal(new Set(q.options).size,q.options.length);assert.ok(q.answer>=0&&q.answer<q.options.length);questions++}
    if(g.type==='match'){assert.equal(new Set(g.pairs.map(p=>p.right)).size,g.pairs.length,id+' ambiguous matching')}
    if(g.type==='order')assert.equal(new Set(g.items.map(i=>i.id)).size,g.items.length);
    if(g.storyQuest){const q=g.storyQuest;const walk=(node,seen=new Set())=>{if(q.endings[node]){paths++;return}assert.ok(q.nodes[node],id+' dangling '+node);assert.ok(!seen.has(node),id+' cycle');const next=new Set(seen);next.add(node);assert.ok(q.nodes[node].choices.some(c=>c.correct));for(const ch of q.nodes[node].choices){assert.ok(ch.consequence.result);walk(ch.next,next)}};walk(q.startNode)}
  }
}
for(const file of ['reader.js','experience.js','work-detail.js','shyrak-assistant.js','literary-games.js','national-games.js','asyk-game.js','data/curriculum-literature.js','data/curriculum-exercises.js','data/curriculum-analysis.js'])new vm.Script(fs.readFileSync(path.join(root,file),'utf8'),{filename:file});
const dictionary=JSON.parse(fs.readFileSync(path.join(root,'data/reader/apertium-kaz-rus.json'),'utf8'));
for(const id of ids)for(const v of db[id].content.vocabulary)if(v.definitionSource?.lemma)for(const translation of v.translations)assert.ok(dictionary.entries[v.definitionSource.lemma].includes(translation),'Curated translation must exist in referenced local dictionary');
console.log(JSON.stringify({works:Object.keys(db).length,curriculum:ids.length,questions,questPaths:paths,status:'PASS'}));
