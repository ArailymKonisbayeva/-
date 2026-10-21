/* Run against a dedicated Chrome test profile on :9337 and local server :8000. */
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const tabs=await(await fetch('http://127.0.0.1:9337/json')).json();
 const target=tabs.find(t=>t.type==='page');assert.ok(target,'Dedicated test page');
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let seq=0;const pending=new Map(),errors=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){const job=pending.get(m.id);pending.delete(m.id);m.error?job.reject(m.error):job.resolve(m.result)}if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text)};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}))});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description);return r.result.value};
 const wait=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await new Promise(r=>setTimeout(r,50))}throw Error('Timeout '+expression)};
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Network.setCacheDisabled',{cacheDisabled:true});
 await send('Page.addScriptToEvaluateOnNewDocument',{source:`localStorage.setItem('adebiet-user',JSON.stringify({name:'Curriculum QA',email:'curriculum-qa@example.test',loggedIn:true}));`});
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
 await send('Page.navigate',{url:'http://127.0.0.1:8000/?qa='+Date.now()+'#library'});await wait("document.querySelector('#catalog-grade')");
 assert.equal(await evaluate("document.querySelectorAll('#verifiedLibrary .work-card').length"),17);
 await evaluate("document.querySelector('#catalog-grade').value='7';document.querySelector('#catalog-grade').dispatchEvent(new Event('change'))");
 assert.equal(await evaluate("document.querySelectorAll('#verifiedLibrary .work-card').length"),3);
 await evaluate("document.querySelector('#catalog-grade').value='';document.querySelector('#catalog-query').value='Улпан';document.querySelector('#catalog-query').dispatchEvent(new Event('input'))");
 assert.equal(await evaluate("document.querySelectorAll('#verifiedLibrary .work-card').length"),1);
 const ids=await evaluate('CURRICULUM_WORK_IDS');let games=0;
 for(const id of ids){
   await evaluate(`location.hash='work/${id}'`);await wait(`document.querySelector('.wd-page h1')?.textContent===VERIFIED_LITERARY_DATA[${JSON.stringify(id)}].title`);
   assert.ok(await evaluate("document.querySelector('#themes').textContent.includes('Көркемдік ерекшеліктер')"),id+' artistry');
   assert.ok(await evaluate("document.querySelector('#vocabulary [data-term]')"),id+' glossary');
   if(await evaluate(`Boolean(window.LITERARY_WORK_COVERS?.['${id}'])`)){
     await wait("document.querySelector('.wd-hero figure img')?.naturalWidth>0");
     assert.ok(await evaluate(`document.querySelector('.wd-hero figure img').getAttribute('src')===LITERARY_WORK_COVERS['${id}']`),id+' cover');
   }
   assert.ok(await evaluate("document.querySelector('#plot').textContent.includes('Композиция')"),id+' composition');
   await evaluate("document.querySelector('#vocabulary [data-term] button').click()");await wait("document.querySelector('#reader-dialog')?.open");
   assert.ok(await evaluate("document.querySelector('#reader-dialog').textContent.includes('Қазақша мағынасы')"));
   await evaluate("document.querySelector('#reader-dialog').close()");
   for(const type of ['literary-quiz','character-guess','matching','plot-order','story-rewrite']){
     await evaluate(`openGame('${id}','${type}')`);await wait("document.querySelector('#gameSession') && (document.querySelector('.ds-question')||document.querySelector('.sq-shell'))");
     const g=await evaluate(`VERIFIED_LITERARY_DATA['${id}'].games.find(g=>g.id==='${type}')`);
     if(g.type==='quiz'){
       for(const q of g.questions){await evaluate(`answerVerifiedGame(${q.answer});nextVerifiedGame()`)}
       assert.ok(await evaluate("document.querySelector('.ds-result')?.textContent.includes('100%')"),id+' quiz result');
     }else if(g.type==='match'){
       for(const p of g.pairs){await evaluate(`(()=>{const left=[...document.querySelectorAll('.ds-match-column:first-child button')].find(b=>b.textContent===${JSON.stringify(p.left)});left.click();const right=[...document.querySelectorAll('.ds-match-column:last-child button')].find(b=>b.textContent===${JSON.stringify(p.right)});right.click()})()`)}
       await wait("document.querySelector('.ds-result')");
     }else if(g.type==='order'){
       for(let i=0;i<g.items.length;i++){const targetIndex=await evaluate(`[...document.querySelectorAll('.ds-order-item')].findIndex(x=>x.children[1].textContent===${JSON.stringify(g.items[i].text)})`);await evaluate(`orderDragStart(${targetIndex});orderDrop(${i})`)}
       await evaluate('checkOrderGame();finishVerifiedGame()');assert.ok(await evaluate("document.querySelector('.ds-result')?.textContent.includes('100%')"));
     }else{
       let node=g.storyQuest.startNode,count=0;while(g.storyQuest.nodes[node]){const n=g.storyQuest.nodes[node],i=n.choices.findIndex(c=>c.correct);await evaluate(`chooseStoryBranch(${i});nextStoryBranch()`);node=n.choices[i].next;count++}
       assert.ok(await evaluate("document.querySelector('.sq-ending')"));
       await evaluate('restartStoryQuest()');assert.ok(await evaluate("document.querySelector('.sq-shell')"));
     }
     games++;
   }
   console.log('PASS',id);
 }
 await evaluate("openGame('alpan','story-rewrite')");await wait("document.querySelector('.sq-shell')");
 const q=await evaluate("VERIFIED_LITERARY_DATA.alpan.games.find(g=>g.id==='story-rewrite').storyQuest");
 let node=q.startNode;while(q.nodes[node]){const n=q.nodes[node],i=n.choices.findIndex(c=>!c.correct);await evaluate(`chooseStoryBranch(${i});nextStoryBranch()`);node=n.choices[i].next}
 assert.ok(await evaluate("document.querySelector('.sq-ending').textContent.includes('0 / 5')"),'Wrong answers must not score 100%');
 const recordKey='adebiet-game-results::curriculum-qa@example.test';
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('${recordKey}'))[0].percent`),0);
 const count=await evaluate(`JSON.parse(localStorage.getItem('${recordKey}')).length`);
 await evaluate('finishVerifiedGame();finishVerifiedGame()');assert.equal(await evaluate(`JSON.parse(localStorage.getItem('${recordKey}')).length`),count);
 await evaluate("openGame('alpan','story-rewrite');chooseStoryBranch(0);nextStoryBranch()");
 await send('Page.reload',{ignoreCache:true});await wait("document.querySelector('#quest-resume')");
 await evaluate('resumeVerifiedQuest()');assert.ok(await evaluate("document.querySelector('.sq-scene-top').textContent.includes('2 / 5')"),'Resume saved scene');
 const qaUser=await evaluate("localStorage.getItem('adebiet-user')");
 await evaluate("localStorage.setItem('adebiet-user',JSON.stringify({name:'Second QA',email:'second-qa@example.test',loggedIn:true}));openGame('alpan','story-rewrite')");
 assert.equal(await evaluate("!!document.querySelector('#quest-resume')"),false,'Other account must not see saved quest');
 await evaluate(`localStorage.setItem('adebiet-user',${JSON.stringify(qaUser)});openGame('alpan','story-rewrite')`);
 assert.ok(await evaluate("document.querySelector('#quest-resume')"),'Original progress preserved');
 await evaluate("openGame('alpan','story-rewrite');chooseStoryBranch(0);endVerifiedGame()");
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('${recordKey}'))[0].completed`),false,'Aborted quest is not completed');
 await evaluate("location.hash='work/alpan'");await wait("document.querySelector('.wd-page h1')?.textContent==='Ұлпан'");
 await evaluate("WorkDetailPage.go('vocabulary')");assert.ok(await evaluate("verifiedStudySections('alpan').includes('vocabulary')"),'Card and page share reading progress');
 for(const id of ['ertostik','zhusan','kozy','kar-kyzy','zhabaiy','aiqai','qyzyl']){
   await evaluate(`location.hash='work/${id}'`);await wait(`document.querySelector('.wd-page h1')?.textContent===VERIFIED_LITERARY_DATA['${id}'].title`);
 }
 for(const route of ['achievements','profile','games']){await evaluate(`location.hash='${route}'`);await wait(`document.body.dataset.route==='${route}'`)}
 for(const id of ['ertostik','alpan']){await evaluate(`location.hash='read/${id}'`);await wait("document.querySelector('#reader-text [data-paragraph]')");assert.ok(await evaluate("document.querySelector('#reader-text .reader-word')"))}
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 for(const id of ids){await evaluate(`location.hash='work/${id}'`);await wait(`document.querySelector('.wd-page h1')?.textContent===VERIFIED_LITERARY_DATA[${JSON.stringify(id)}].title`);assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),id+' mobile overflow')}
 for(const id of ids)for(const type of ['literary-quiz','character-guess','matching','plot-order','story-rewrite']){
   await evaluate(`openGame('${id}','${type}')`);await wait(`document.querySelector('.ds-game-top h1')?.textContent.endsWith(VERIFIED_LITERARY_DATA['${id}'].title)`);
   assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),id+'/'+type+' mobile overflow');
 }
 await evaluate("location.hash='work/ashkan'");await wait("document.querySelector('.wd-page')");
 await evaluate("ShyrakAssistant.open();ShyrakAssistant.send('Момыш туралы түсіндір')");await wait("ShyrakAssistant.getState().status==='talking'");
 assert.ok(await evaluate("ShyrakAssistant.getState().messages.at(-1).text.includes('зергерлік')"),'Assistant detailed character');
 await evaluate('ShyrakAssistant.close()');
 for(const id of ['langi','kokpar','arkan']){
   await evaluate(`openGame('kokserak','${id}')`);await wait("document.querySelector('#ngShell')");
   await evaluate(id==='kokpar'?"NationalGames.raceMode('practice')":"NationalGames.start()");
   await wait("document.querySelector('.ng-gamebar')");
   assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),id+' mobile gameplay overflow');
   await evaluate('NationalGames.exit()');
 }
 await evaluate("openGame('kokserak','asyk')");await wait("document.querySelector('.ax-mode')");
 await evaluate("AsykGame.mode('literary')");await wait("document.querySelector('#axStart')?.disabled===false");
 await evaluate('AsykGame.start()');await wait("document.querySelector('.ax-question')");
 assert.ok(await evaluate('document.documentElement.scrollWidth<=innerWidth+1'),'Asyk mobile overflow');
 await evaluate('AsykGame.finish()');assert.ok(await evaluate("document.querySelector('.ax-result')"));
 const asykCount=await evaluate(`JSON.parse(localStorage.getItem('${recordKey}')).length`);
 assert.equal(await evaluate(`JSON.parse(localStorage.getItem('${recordKey}'))[0].gameId`),'asyk');
 await evaluate('AsykGame.finish()');assert.equal(await evaluate(`JSON.parse(localStorage.getItem('${recordKey}')).length`),asykCount);
 const screenshot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync(path.join(__dirname,'../output/curriculum-mobile.png'),Buffer.from(screenshot.data,'base64'));
 assert.equal(errors.length,0,errors.join('\n'));
 console.log(JSON.stringify({works:ids.length,games,desktop:true,mobile:true,assistant:true,errors,status:'PASS'}));ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
