// Emits an apply_patch patch; never writes or modifies the supplied source.
const fs=require('node:fs'),crypto=require('node:crypto');
const raw=fs.readFileSync(process.argv[2],'utf8').replace(/^\uFEFF/,'');
const paragraphs=raw.trim().split(/\r?\n\s*\r?\n/u).map(text=>text.trim());
const chapters=[];
for(let i=0;i<paragraphs.length;i+=40)chapters.push({id:'section-'+(chapters.length+1),title:(chapters.length+1)+'-бөлім',paragraphs:paragraphs.slice(i,i+40).map((text,j)=>({id:'p'+(i+j+1),text,annotations:[]}))});
const data={version:1,workId:'kar-kyzy',status:'excerpt',notice:'Бұл — пайдаланушы ұсынған «Қар қызы» хикаятының үзіндісі. Берілген мәтін түгел сақталды. Нөмірленген бөлімдер тек оқуды жеңілдету үшін жасалды, авторлық тараулар емес.',source:{title:'Пайдаланушы ұсынған «Қар қызы» мәтіні',publicDomain:false,rightsNote:'Мәтін пайдаланушының өтінішімен осы оқу жобасына енгізілді. Бұл толық хикаят немесе еркін лицензияланған басылым дегенді білдірмейді.',sourceParagraphCount:paragraphs.length,textSha256:crypto.createHash('sha256').update(paragraphs.join('\n\n')).digest('hex'),completeness:'User-provided excerpt; not independently verified against a printed edition.'},lexicon:{},chapters};
process.stdout.write('*** Begin Patch\n*** Add File: data/reader/kar-kyzy.json\n'+JSON.stringify(data,null,2).split('\n').map(l=>'+'+l).join('\n')+'\n*** End Patch');
