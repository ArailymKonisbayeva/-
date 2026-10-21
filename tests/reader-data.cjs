const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = fs.readFileSync(path.join(root, 'reader.js'), 'utf8');
const context = { window: {}, document: { querySelector: () => ({}) },
  MutationObserver: class { observe() {} }, addEventListener() {} };
vm.runInNewContext(source, context);
const ranges = context.window.LiteraryReader.ranges;
assert.equal(ranges({text:'Төрт түлік!',annotations:[
  {quote:'Төрт',type:'word'}, {quote:'Төрт түлік',type:'phrase'}]})[0].type,'phrase');
assert.equal(ranges({text:'сөз, сөз.',annotations:[{quote:'сөз',occurrence:1}]})[0].start,5);
assert.equal(ranges({text:'сөз',annotations:[{quote:'жоқ'},{quote:'сөз',start:1,end:3}]}).length,0);
assert.equal(ranges({text:'abc',annotations:[{start:0,end:3,type:'sentence'}]})[0].end,3);
const data = JSON.parse(fs.readFileSync(path.join(root,'data/reader/ertostik.json'),'utf8'));
assert.equal(data.status,'full');
assert.equal(data.chapters.length,12);
const paragraphs=data.chapters.flatMap(c=>c.paragraphs);
assert.equal(paragraphs.length,159);
assert.deepEqual(paragraphs.slice(0,4).map(p=>p.id),['p1','p2','p3','p4']);
assert.equal(data.chapters[0].id,'opening');
assert.equal(data.chapters[1].id,'birth');
assert.ok(paragraphs[0].text.startsWith('Ерте заманда Ерназар'));
assert.ok(paragraphs.at(-1).text.endsWith('Одан кейін ұзақ жылдар өмір сүріп, мақсаттарына жетеді.'));
// Hash was checked against every narrative paragraph of the source page.
// Only whitespace/paragraph layout is normalized, never letters or punctuation.
const normalized=paragraphs.map(p=>p.text).join(' ').replace(/\s+/gu,' ').trim();
const digest=require('node:crypto').createHash('sha256').update(normalized).digest('hex');
assert.equal(digest,'07599383251849e963f45128fd024bdaac29cb01fb327eb4fe3390da8d6f0692');
assert.equal(digest,data.source.textSha256);
assert.match(data.source.url,/^https:\/\//);
assert.ok(data.source.rightsNote);
const ids = new Set();
let count=0;
for(const chapter of data.chapters) for(const p of chapter.paragraphs){
  assert.ok(!ids.has(p.id));ids.add(p.id);
  const all={...p,annotations:[...(p.annotations||[]),...(data.annotationIndex?.[p.id]||[])]};
  assert.equal(ranges(all).length,all.annotations.length);
  for(const a of ranges(all)){
    assert.ok(data.lexicon[a.entryId]);
    assert.equal(p.text.slice(a.start,a.end),a.quote);
    count++;
  }
}
for(const entry of Object.values(data.lexicon)){
  for(const field of ['term','basicMeaning','simpleExplanation','contextualMeaning'])assert.ok(entry[field]);
  assert.match(entry.source.url,/^https:\/\//);
}
new vm.Script(fs.readFileSync(path.join(root,'experience.js'),'utf8'));
console.log(`PASS: syntax, full-text integrity, ranges, ${ids.size} reading blocks, ${count} annotations, ${Object.keys(data.lexicon).length} sourced entries`);
