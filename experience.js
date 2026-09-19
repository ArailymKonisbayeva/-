/* Unified product experience. Loaded last so the original features stay available
   while all primary routes use one verified data source and one design system. */
(function(){
  'use strict';

  const root=()=>document.querySelector('#app');
  const data=()=>window.VERIFIED_LITERARY_DATA||{};
  const list=()=>Object.values(data());
  const byId=id=>data()[id]||null;
  const esc=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const scopedKey=key=>{const user=typeof currentUser==='function'?currentUser():null;return `${key}::${user?.email||'guest'}`};
  const store={
    read(key,fallback){try{const value=JSON.parse(localStorage.getItem(scopedKey(key)));return value??fallback}catch{return fallback}},
    write(key,value){localStorage.setItem(scopedKey(key),JSON.stringify(value));return value}
  };
  const completedWorks=()=>store.read('adebiet-completed-works',[]).filter(id=>byId(id));
  const gameResults=()=>store.read('adebiet-game-results',[]);
  const visitedRegions=()=>store.read('adebiet-visited-regions',[]);
  const activities=()=>store.read('adebiet-activity',[]);
  const studied=()=>store.read('adebiet-study-progress',{});
  let activeWorkTab='overview';
  let activeGame=null;

  function logActivity(type,label){
    const rows=activities();
    rows.unshift({type,label,date:new Date().toISOString()});
    store.write('adebiet-activity',rows.slice(0,20));
  }
  function syncNav(name){
    document.querySelectorAll('[data-go]').forEach(button=>button.classList.toggle('active',button.dataset.go===name));
    const user=currentUser();
    const initial=(user?.name||user?.email||'A').trim().charAt(0).toUpperCase()||'A';
    document.querySelectorAll('.avatar, .user-avatar').forEach(avatar=>{avatar.textContent=initial;});
  }
  function statusLabel(work){
    return work.verificationStatus==='VERIFIED'?'Тексерілген дерек':'Ішінара тексерілген';
  }
  function safeSources(work){
    return (work.sources||[]).filter(source=>/^https:\/\//.test(source.url||''));
  }
  function sourceLinks(work){
    const sources=safeSources(work);
    return sources.length?`<div class="ds-source-list">${sources.map(source=>`<a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.name)} ↗</a>`).join('')}</div>`:'';
  }
  function workMeta(work){
    return `<div class="ds-work-meta"><span class="tag">${esc(work.genre||'Жанр нақтылануда')}</span><span class="tag">${work.authorType==='folklore'?'Халық мұрасы':'Авторлық шығарма'}</span><span class="ds-status">${statusLabel(work)}</span></div>`;
  }
  function favoriteButton(id){
    const isSaved=typeof saved!=='undefined'&&saved.includes(id);
    return `<button class="heart ${isSaved?'saved':''}" onclick="toggleFav('${id}')" aria-label="${isSaved?'Таңдаулылардан алып тастау':'Таңдаулыларға қосу'}">${isSaved?'♥':'♡'}</button>`;
  }
  const workCovers={alpan:'assets/works/covers/alpan.png',balalyk:'assets/works/covers/balalyk.png',kan:'assets/works/covers/kan.png',qyzyl:'assets/works/covers/qyzyl.png'};
  function icon(name){return window.LiteraryIcons?.render?.(name,'ds-inline-icon')||''}
  function workVisual(work,kind='card'){
    const cover=workCovers[work.id];
    return cover?`<div class="ds-work-image ${kind}"><img src="${cover}" alt="«${esc(work.title)}» шығармасының мұқабасы" loading="lazy"></div>`:`<div class="ds-work-image ${kind} fallback tone-${esc(work.tone||'cream')}" aria-hidden="true"><span>Әдеби саяхат</span><b>${esc(work.title)}</b><small>${esc(work.period||'Қазақ әдебиеті')}</small></div>`;
  }
  function makeWorkCard(work){
    const done=completedWorks().includes(work.id);
    const progress=Math.min(100,Math.round(((studied()[work.id]||[]).length/7)*100));
    return `<article class="work-card ds-library-card">${workVisual(work)}<div class="ds-library-copy">${favoriteButton(work.id)}<div class="ds-library-tags"><span class="tag">${esc(work.genre||'Дерек нақтылануда')}</span>${done?'<span class="ds-chip">✓ Зерттелді</span>':''}</div><h3>${esc(work.title)}</h3><div class="ds-library-author">${esc(work.author)}</div><p>${esc(work.intro||'Бұл шығарма туралы тексерілген мәлімет толықтырылуда.')}</p><div class="ds-card-progress"><span><b>${progress}%</b> зерттелді</span><i><em style="width:${progress}%"></em></i></div><button class="small-btn" onclick="openWork('${work.id}')">Зерттеу ${icon('arrowRight')}</button></div></article>`;
  }

  window.card=function(work){return makeWorkCard(byId(work.id)||work)};
  window.toggleFav=function(id){
    if(typeof saved==='undefined')return;
    saved=saved.includes(id)?saved.filter(item=>item!==id):[...saved,id];
    localStorage.setItem('adebiet-favs',JSON.stringify(saved));
    toast(saved.includes(id)?'Таңдаулыларға қосылды':'Таңдаулылардан алынды');
    const hash=location.hash.slice(1);
    if(hash.startsWith('work/'))renderWork(id);else if(hash==='library')renderLibrary();else renderHome();
  };

  function renderHome(){
    const done=completedWorks().length;
    const played=gameResults().length;
    const featured=['alpan','balalyk','kan'].map(byId).filter(Boolean);
    root().innerHTML=`<section class="home-hero"><div class="home-hero-copy"><span class="ds-kicker">Қазақ әдебиетіне интерактивті саяхат</span><h1>Оқы. Түсін.<br><em>Байланысын көр.</em></h1><p>Шығарманың әлеміне кіріп, кейіпкерлер мен сюжетті зертте. Ойын арқылы біліміңді бекітіп, әдеби Қазақстанның бағытын аш.</p><div class="actions"><button class="primary" data-go="map">Әдеби саяхатты бастау ${icon('compass')}</button><button class="secondary" data-go="library">Шығармаларды зерттеу ${icon('arrowRight')}</button></div><div class="home-stats"><span><b>13</b> шығарма</span><span><b>20</b> өңір</span><span><b>${done}</b> зерттелді</span><span><b>${played}</b> ойын</span></div></div><div class="home-literary-scene"><div class="home-route" aria-hidden="true"><i></i><i></i><i></i><i></i></div><button class="home-scene-card card-a" onclick="openWork('alpan')">${workVisual(byId('alpan'),'hero')}<span>Ұлпан</span></button><button class="home-scene-card card-b" onclick="openWork('qyzyl')">${workVisual(byId('qyzyl'),'hero')}<span>Қызыл жебе</span></button><div class="home-shyrak"><img src="assets/shyrak/shyrak-talking.png" alt="Әдеби саяхаттың жолсерігі Шырақ"><span><b>Шырақ</b> Саяхатты бірге бастайық!</span></div></div></section>
    <section class="home-steps"><div class="section-head"><div><span class="ds-kicker">Оқу бағыты</span><h2>Саяхатты неден бастау?</h2></div></div><div class="home-step-grid">${[['01','book','Шығарманы таңда','13 туындының ішінен қызықтырған шығарманы аш.'],['02','search','Әлемін зертте','Сюжет, кейіпкерлер мен негізгі идеяның байланысын көр.'],['03','gamepad','Ойын арқылы тексер','Алты әдеби механикамен біліміңді бекіт.']].map(x=>`<article><span>${x[0]}</span><i>${icon(x[1])}</i><h3>${x[2]}</h3><p>${x[3]}</p></article>`).join('')}</div></section>
    <section class="section home-featured"><div class="section-head"><div><span class="ds-kicker">Оқырман таңдауы</span><h2>Таңдаулы шығармалар</h2></div><button class="link" data-go="library">Барлығын көру ${icon('arrowRight')}</button></div><div class="cards">${featured.map(makeWorkCard).join('')}</div></section>
    <section class="home-discover"><article class="home-games-preview"><span class="ds-kicker">Ойнап бекіту</span><h2>Ойындар</h2><p>Сюжетті ретте, кейіпкерді тап немесе ұлттық ойын арқылы шығарма деректерін қайтала.</p><div class="home-game-pills"><span>${icon('book')} Әдеби ойындар</span><span>${icon('gamepad')} Ұлттық ойындар</span></div><button class="primary" data-go="games">Ойындарды ашу ${icon('arrowRight')}</button></article><article class="home-map-preview"><div><span class="ds-kicker">20 өңір · бір әдеби кеңістік</span><h2>Әдеби саяхат картасы</h2><p>Қаламгерлер мен шығармалардың Қазақстан өңірлерімен байланысын зертте.</p><button class="secondary" data-go="map">Картаға өту ${icon('map')}</button></div><div class="home-map-lines" aria-hidden="true"><i></i><i></i><i></i><b></b></div></article></section>`;
    syncNav('home');window.scrollTo(0,0);
  }

  function renderLibrary(){
    root().innerHTML=`<section class="ds-page"><div class="ds-page-head"><div><span class="ds-kicker">Сандық кітапхана</span><h1>Шығармалар</h1><p>13 туындының тексерілген метадерегі мен әдеби модульдері. Расталмаған бөлімдер әдейі бос қалдырылған.</p></div><div class="ds-mini-stat"><b>${completedWorks().length}</b><span>зерттелді</span></div></div><div class="filterbar"><button class="filter active" onclick="filterVerifiedLibrary('all',this)">Барлығы</button><button class="filter" onclick="filterVerifiedLibrary('verified',this)">Толық тексерілген</button><button class="filter" onclick="filterVerifiedLibrary('folklore',this)">Халық мұрасы</button><button class="filter" onclick="filterVerifiedLibrary('games',this)">Ойындары бар</button></div><div id="verifiedLibrary" class="cards">${list().map(makeWorkCard).join('')}</div></section>`;
    syncNav('library');window.scrollTo(0,0);
  }
  window.filterVerifiedLibrary=function(filter,button){
    document.querySelectorAll('.filterbar .filter').forEach(item=>item.classList.toggle('active',item===button));
    const works=list().filter(work=>filter==='all'||filter==='verified'&&work.verificationStatus==='VERIFIED'||filter==='folklore'&&work.authorType==='folklore'||filter==='games'&&(work.games||[]).length);
    const box=document.querySelector('#verifiedLibrary');
    if(box)box.innerHTML=works.length?works.map(makeWorkCard).join(''):'<div class="ds-empty">Бұл сүзгі бойынша шығарма табылмады.</div>';
  };

  function sectionAvailability(work,key){return work.content&&work.content[key]&&(!(Array.isArray(work.content[key]))||work.content[key].length)}
  function overviewSection(work){
    const c=work.content||{};
    return `<article class="ds-section-card"><h2>Шығарма туралы</h2><p>${esc(c.plotSummary||work.intro||'Қысқаша мазмұн тексеріліп жатыр.')}</p>${c.setting?`<div class="ds-fact-note"><b>Оқиға кеңістігі:</b> ${esc(c.setting)}</div>`:''}${c.conflict?`<div class="ds-fact-note" style="margin-top:10px"><b>Негізгі тартыс:</b> ${esc(c.conflict)}</div>`:''}${!c.plotSummary?'<div class="ds-empty">Толық әдеби сипаттама дереккөзбен тексеріліп жатыр.</div>':''}</article>`;
  }
  function charactersSection(work){
    const rows=work.content?.characters||[];
    return `<article class="ds-section-card"><h2>Кейіпкерлер</h2><p>Төменде тек дереккөзбен расталған есімдер мен рөлдер берілген.</p>${rows.length?`<div class="ds-character-grid">${rows.map(character=>`<article class="ds-character"><small>${esc(character.role||'Рөлі')}</small><b>${esc(character.name)}</b><p>${esc(character.description||'Сипаттамасы нақтылануда.')}</p>${character.action?`<p><b>Маңызды әрекет:</b> ${esc(character.action)}</p>`:''}</article>`).join('')}</div>`:'<div class="ds-empty">Кейіпкерлер туралы егжей-тегжейлі дерек әлі тексеріліп жатыр.</div>'}</article>`;
  }
  function plotSection(work){
    const events=work.content?.plotEvents||[];
    return `<article class="ds-section-card"><h2>Сюжет</h2><div class="ds-fact-note">Бұл бөлімде шығарма оқиғалары туралы спойлер болуы мүмкін.</div>${events.length?`<div class="ds-timeline">${events.map((event,index)=>`<div class="ds-event"><span class="ds-event-index">${index+1}</span><div><b>${esc(event.label||`Оқиға ${index+1}`)}</b><p>${esc(event.text)}</p></div></div>`).join('')}</div>`:`<div class="ds-empty">Оқиғалардың толық реті сенімді мәтіндік дерекпен тексеріліп жатыр.</div>`}</article>`;
  }
  function themesSection(work){
    const themes=work.content?.themes||[];
    const idea=work.content?.mainIdea;
    return `<article class="ds-section-card"><h2>Тақырыптар және негізгі идея</h2><div class="ds-fact-note interpretation"><b>Интерпретация:</b> Бұл бөлім мәтінге негізделген әдеби талдау ретінде беріледі, автордың тікелей мәлімдемесі емес.</div>${themes.length?`<div class="ds-chip-list">${themes.map(theme=>`<span class="ds-chip">${esc(typeof theme==='string'?theme:theme.name)}</span>`).join('')}</div>`:''}${idea?`<p>${esc(idea)}</p>`:'<div class="ds-empty">Талдау формулировкасы қосымша дерекпен нақтылануда.</div>'}</article>`;
  }
  function relationsSection(work){
    const rows=work.content?.relationships||[];
    return `<article class="ds-section-card"><h2>Кейіпкерлер байланысы</h2>${rows.length?rows.map(row=>`<div class="ds-relation"><b>${esc(row.from)}</b> <span>→ ${esc(row.type)} →</span> <b>${esc(row.to)}</b>${row.note?`<p>${esc(row.note)}</p>`:''}</div>`).join(''):'<div class="ds-empty">Тексерілген байланыстар әзірге енгізілмеді.</div>'}</article>`;
  }
  function vocabularySection(work){
    const rows=work.content?.vocabulary||[];
    return `<article class="ds-section-card"><h2>Сөздік</h2><p>Мағыналар шығарма контексімен сәйкес келгенде ғана жарияланады.</p>${rows.length?`<div class="ds-vocab">${rows.map(row=>`<div><b>${esc(row.term)}</b><span>${esc(row.definition)}</span></div>`).join('')}</div>`:'<div class="ds-empty">Бұл шығармаға арналған тексерілген сөздік толықтырылуда.</div>'}</article>`;
  }
  function sectionHtml(work,key){return ({overview:overviewSection,characters:charactersSection,plot:plotSection,themes:themesSection,relations:relationsSection,vocabulary:vocabularySection}[key]||overviewSection)(work)}
  function workProgress(id){return Math.min(100,Math.round(((studied()[id]||[]).length/6)*100))}
  function renderWork(id){
    const work=byId(id);
    if(work&&window.WorkDetailPage){window.currentWorkId=id;window.WorkDetailPage.render(work);syncNav('library');return}
    if(!work){root().innerHTML='<section class="ds-page"><div class="ds-empty"><h2>Шығарма табылмады</h2><p>Кітапханаға оралып, қолжетімді шығарманы таңдаңыз.</p><button class="primary" data-go="library">Кітапханаға оралу</button></div></section>';return}
    window.currentWorkId=id;
    const progress=workProgress(id);
    root().innerHTML=`<section class="ds-work-hero"><div class="ds-work-title"><button class="back" data-go="library">← Шығармаларға оралу</button>${workMeta(work)}<h1>${esc(work.title)}</h1><p class="lead">${esc(work.author)}${work.authorType==='folklore'?' · халық ауыз әдебиеті':''}</p></div><aside class="ds-work-summary"><span class="ds-kicker">Қысқаша</span><p>${esc(work.intro||'Шығарма туралы тексерілген кіріспе әзірленуде.')}</p>${sourceLinks(work)}</aside></section><section class="ds-work-layout"><div><nav class="ds-tabs" aria-label="Шығарма бөлімдері">${[['overview','Шолу'],['characters','Кейіпкерлер'],['plot','Сюжет'],['themes','Тақырыптар'],['relations','Байланыстар'],['vocabulary','Сөздік']].map(([key,label])=>`<button class="${activeWorkTab===key?'active':''}" onclick="renderVerifiedSection('${id}','${key}')">${label}</button>`).join('')}</nav><div id="verifiedWorkContent" class="ds-work-content">${sectionHtml(work,activeWorkTab)}</div></div><aside class="ds-study-aside"><span class="ds-kicker">Оқу жолы</span><h3>Зерттеу прогресі</h3><div class="ds-progress-label"><span>Қаралған бөлімдер</span><b class="js-work-progress">${progress}%</b></div><div class="track"><div class="fill js-work-progress-fill" style="width:${progress}%"></div></div><p>Алдымен деректерді зерттеп, кейін мазмұнға сай ойынмен біліміңізді бекітіңіз.</p><div class="actions"><button class="primary" onclick="openWorkGames('${id}')">Ұлттық ойындарды ашу</button><button class="secondary" onclick="openAssistantFor('${id}')">AI көмекші</button><button class="secondary" onclick="markWorkComplete('${id}')">${completedWorks().includes(id)?'✓ Зерттелді':'Зерттелді деп белгілеу'}</button></div></aside></section>`;
    markStudied(id,activeWorkTab,false);syncNav('library');window.scrollTo(0,0);
  }
  function markStudied(id,section,rerender=true){
    const progress=studied(),items=new Set(progress[id]||[]);items.add(section);progress[id]=[...items];store.write('adebiet-study-progress',progress);
    const value=workProgress(id),label=document.querySelector('.js-work-progress'),fill=document.querySelector('.js-work-progress-fill');
    if(label)label.textContent=`${value}%`;if(fill)fill.style.width=`${value}%`;
    if(rerender)logActivity('section',`${byId(id)?.title}: ${section}`);
  }
  window.renderVerifiedSection=function(id,key){
    const work=byId(id),box=document.querySelector('#verifiedWorkContent');if(!work||!box)return;
    activeWorkTab=key;document.querySelectorAll('.ds-tabs button').forEach((button,index)=>button.classList.toggle('active',['overview','characters','plot','themes','relations','vocabulary'][index]===key));
    box.innerHTML=sectionHtml(work,key);markStudied(id,key,true);
  };
  window.openWork=function(id){activeWorkTab='overview';if(location.hash!==`#work/${id}`)location.hash=`work/${id}`;renderWork(id)};
  window.markWorkComplete=function(id){
    const set=new Set(completedWorks());set.add(id);store.write('adebiet-completed-works',[...set]);
    if(typeof completed!=='undefined'){completed=set.size;localStorage.setItem('adebiet-completed',String(completed))}
    logActivity('work',`«${byId(id)?.title}» зерттелді`);toast('Шығарма зерттелгендер тізіміне қосылды');renderWork(id);
  };
  window.completeWork=function(){const id=location.hash.split('/')[1]||window.currentWorkId;if(id)window.markWorkComplete(id)};

  function gameCard(work,game){
    return `<article class="game-card"><div class="game-icon">${esc(game.icon||'◇')}</div><span class="tag">${esc(game.difficulty||'Орташа')}</span><h3>${esc(game.title)}</h3><span class="learning-objective"><b>Оқу мақсаты:</b> ${esc(game.learningObjective)}</span><button class="small-btn" onclick="openGame('${work.id}','${game.id}')">Ойынды бастау →</button></article>`;
  }
  function renderGameCenter(){
    if(window.NationalGames)return window.NationalGames.renderHub();
    const playable=list().filter(work=>(work.games||[]).length);
    root().innerHTML=`<section class="ds-page"><div class="ds-page-head"><div><span class="ds-kicker">Ойнап бекіту</span><h1>Ойын орталығы</h1><p>Әр ойын нақты шығармаға және оқу мақсатына байланысты. Сұрақтар тек тексерілген әдеби деректерден құрылады.</p></div><div class="ds-mini-stat"><b>${gameResults().length}</b><span>аяқталған сессия</span></div></div><div class="ds-grid">${playable.map(work=>`<article class="ds-card ${work.tone||'cream'}"><div class="ds-card-icon">◇</div><h3>${esc(work.title)}</h3><p>${(work.games||[]).length} оқу ойыны · ${esc(work.author)}</p><button class="small-btn" style="margin-top:17px" onclick="openWorkGames('${work.id}')">Ойындарды таңдау →</button></article>`).join('')}</div>${playable.length<list().length?`<section class="section"><div class="ds-empty">Қалған шығармаларға ойындар тек әдеби дерек толық тексерілгеннен кейін қосылады.</div></section>`:''}</section>`;
    syncNav('games');window.scrollTo(0,0);
  }
  function renderWorkGames(id){
    if(window.NationalGames)return window.NationalGames.renderWorkHub(id);
    const work=byId(id);if(!work)return renderGameCenter();const games=work.games||[];
    root().innerHTML=`<section class="ds-page"><button class="back" data-go="games">← Ойын орталығына</button><div class="ds-page-head"><div><span class="ds-kicker">${esc(work.title)}</span><h1>Ойындарды таңдаңыз</h1><p>Механика шығарма мазмұнына сай таңдалған. Әр жауаптан кейін қысқа түсіндірме беріледі.</p></div></div>${games.length?`<div class="game-grid">${games.map(game=>gameCard(work,game)).join('')}</div>`:`<div class="ds-empty">Бұл шығармаға арналған тексерілген ойындар кейінірек қосылады.</div>`}<div class="actions"><button class="secondary" onclick="openWork('${id}')">Шығармаға оралу</button></div></section>`;
    syncNav('games');window.scrollTo(0,0);
  }
  window.games=function(){if(location.hash!=='#games')location.hash='games';renderGameCenter()};
  window.openWorkGames=function(id){location.hash=`games/${id}`};
  window.openGame=function(workId,gameId){location.hash=`games/${workId}/${gameId}`};
  window.launchGame=function(){const work=byId(window.currentWorkId)||list().find(item=>(item.games||[]).length);const game=work?.games?.[0];if(work&&game)window.openGame(work.id,game.id);else window.games()};

  function gameByIds(workId,gameId){const work=byId(workId);return {work,game:work?.games?.find(item=>item.id===gameId)}}
  function renderGamePage(workId,gameId){
    if(window.NationalGames&&window.NationalGames.has(gameId))return window.NationalGames.renderGame(workId,gameId);
    const {work,game}=gameByIds(workId,gameId);
    if(!work||!game){root().innerHTML='<section class="ds-page"><div class="ds-empty">Ойын табылмады.<br><button class="primary" data-go="games">Ойын орталығына</button></div></section>';return}
    activeGame={workId,gameId,index:0,score:0,answers:[],order:null,done:false};
    root().innerHTML=`<section class="ds-game-shell"><div class="ds-game-nav"><button class="back" onclick="openWorkGames('${workId}')">← Ойын орталығына</button><button class="ds-end-game" onclick="endVerifiedGame()">Аяқтау</button></div><div class="ds-game-top"><div><span class="ds-kicker">${esc(work.title)}</span><h1>${esc(game.title)}</h1><p class="muted">${esc(game.instruction)}</p></div><span class="tag">${esc(game.difficulty)}</span></div><div class="ds-fact-note"><b>Оқу мақсаты:</b> ${esc(game.learningObjective)}</div><div id="gameSession"></div></section>`;
    renderGameStep();syncNav('games');window.scrollTo(0,0);
  }
  function renderGameStep(){
    const {work,game}=gameByIds(activeGame.workId,activeGame.gameId),box=document.querySelector('#gameSession');if(!box)return;
    if(game.type==='order')return renderOrderGame(work,game,box);
    if(game.type==='match')return renderMatchGame(work,game,box);
    const question=game.questions[activeGame.index],total=game.questions.length,progress=Math.round((activeGame.index/total)*100);
    box.innerHTML=`<div class="ds-progress-label"><span>${activeGame.index+1} / ${total}</span><span>${progress}%</span></div><div class="track"><div class="fill" style="width:${progress}%"></div></div><article class="ds-question" style="margin-top:16px"><span class="ds-status">${esc(question.skill||game.difficulty)}</span><h2>${esc(question.prompt)}</h2><div class="ds-options">${question.options.map((option,index)=>`<button class="ds-option" onclick="answerVerifiedGame(${index})">${esc(option)}</button>`).join('')}</div><div id="gameFeedback"></div></article>`;
  }
  window.answerVerifiedGame=function(index){
    if(!activeGame||activeGame.done)return;const {game}=gameByIds(activeGame.workId,activeGame.gameId),question=game.questions[activeGame.index],buttons=[...document.querySelectorAll('.ds-option')],correct=index===question.answer;
    buttons.forEach((button,i)=>{button.disabled=true;if(i===question.answer)button.classList.add('correct');if(i===index&&!correct)button.classList.add('wrong')});
    if(correct)activeGame.score++;activeGame.answers.push({correct,topic:question.reviewTopic||game.learningObjective});activeGame.done=true;
    document.querySelector('#gameFeedback').innerHTML=`<div class="ds-feedback"><b>${correct?'Дұрыс жауап.':'Бұл жолы қате.'}</b><br>${esc(question.explanation)}<br><button class="primary" style="margin-top:12px" onclick="nextVerifiedGame()">${activeGame.index===game.questions.length-1?'Нәтижені көру':'Келесі сұрақ →'}</button></div>`;
  };
  window.nextVerifiedGame=function(){
    const {game}=gameByIds(activeGame.workId,activeGame.gameId);activeGame.index++;activeGame.done=false;if(activeGame.index>=game.questions.length)finishVerifiedGame();else renderGameStep();
  };
  function renderOrderGame(work,game,box){
    if(!activeGame.order)activeGame.order=[...game.items].reverse();
    box.innerHTML=`<div class="ds-progress-label"><span>1 тапсырма</span><span>Сүйреп немесе батырмамен реттеңіз</span></div><article class="ds-question"><h2>${esc(game.prompt||'Оқиғаларды дұрыс ретке қойыңыз')}</h2><div class="ds-order-list">${activeGame.order.map((item,index)=>`<div class="ds-order-item" draggable="true" ondragstart="orderDragStart(${index})" ondragover="event.preventDefault()" ondrop="orderDrop(${index})"><span class="ds-event-index">${index+1}</span><span>${esc(item.text)}</span><span class="ds-order-controls"><button onclick="moveOrderItem(${index},-1)" aria-label="Жоғары жылжыту">↑</button><button onclick="moveOrderItem(${index},1)" aria-label="Төмен жылжыту">↓</button></span></div>`).join('')}</div><button class="primary" style="margin-top:17px" onclick="checkOrderGame()">Ретін тексеру</button><div id="gameFeedback"></div></article>`;
  }
  window.moveOrderItem=function(index,direction){const next=index+direction;if(!activeGame?.order||next<0||next>=activeGame.order.length)return;[activeGame.order[index],activeGame.order[next]]=[activeGame.order[next],activeGame.order[index]];renderGameStep()};
  window.orderDragStart=function(index){if(activeGame)activeGame.dragIndex=index};
  window.orderDrop=function(index){if(!activeGame||activeGame.dragIndex==null||activeGame.dragIndex===index)return;const [item]=activeGame.order.splice(activeGame.dragIndex,1);activeGame.order.splice(index,0,item);activeGame.dragIndex=null;renderGameStep()};
  window.checkOrderGame=function(){
    const {game}=gameByIds(activeGame.workId,activeGame.gameId),correct=activeGame.order.every((item,index)=>item.id===game.items[index].id);activeGame.score=correct?1:0;activeGame.answers=[{correct,topic:game.learningObjective}];activeGame.done=true;
    document.querySelector('#gameFeedback').innerHTML=`<div class="ds-feedback"><b>${correct?'Реті дұрыс.':'Ретті тағы бір қарап шығыңыз.'}</b><br>${esc(correct?game.successExplanation:game.retryExplanation)}<br><button class="primary" style="margin-top:12px" onclick="${correct?'finishVerifiedGame()':'retryOrderGame()'}">${correct?'Нәтижені көру':'Қайта реттеу'}</button></div>`;
  };
  window.retryOrderGame=function(){activeGame.done=false;renderGameStep()};
  function renderMatchGame(work,game,box){
    if(!activeGame.matchRights)activeGame.matchRights=[...game.pairs.map((pair,index)=>({text:pair.right,index}))].sort(()=>Math.random()-.5);
    activeGame.matchSolved=activeGame.matchSolved||[];
    const solved=new Set(activeGame.matchSolved);
    box.innerHTML=`<article class="ds-question"><div class="ds-progress-label"><span>${solved.size} / ${game.pairs.length} жұп</span><span>Екі байланысты элементті таңдаңыз</span></div><h2>${esc(game.prompt||'Сәйкес жұптарды табыңыз')}</h2><div class="ds-match-board"><div class="ds-match-column">${game.pairs.map((pair,index)=>`<button class="ds-match-card ${solved.has(index)?'solved':''} ${activeGame.matchLeft===index?'selected':''}" ${solved.has(index)?'disabled':''} onclick="selectMatchLeft(${index})">${esc(pair.left)}</button>`).join('')}</div><div class="ds-match-column">${activeGame.matchRights.map((item,index)=>`<button class="ds-match-card ${solved.has(item.index)?'solved':''}" ${solved.has(item.index)?'disabled':''} onclick="selectMatchRight(${index})">${esc(item.text)}</button>`).join('')}</div></div><div id="gameFeedback">${activeGame.matchMessage?`<div class="ds-feedback ${activeGame.matchMessage.ok?'ok':'bad'}">${esc(activeGame.matchMessage.text)}</div>`:''}</div></article>`;
  }
  window.selectMatchLeft=function(index){if(!activeGame||activeGame.matchSolved?.includes(index))return;activeGame.matchLeft=index;activeGame.matchMessage=null;renderGameStep()};
  window.selectMatchRight=function(rightIndex){if(!activeGame||activeGame.matchLeft==null){activeGame.matchMessage={ok:false,text:'Алдымен сол жақтағы элементті таңдаңыз.'};return renderGameStep()}const {game}=gameByIds(activeGame.workId,activeGame.gameId),right=activeGame.matchRights[rightIndex],ok=right.index===activeGame.matchLeft;if(ok){activeGame.matchSolved.push(activeGame.matchLeft);activeGame.score=activeGame.matchSolved.length;activeGame.answers.push({correct:true,topic:game.pairs[activeGame.matchLeft].left});activeGame.matchMessage={ok:true,text:'Дұрыс жұп!'};activeGame.matchLeft=null;if(activeGame.matchSolved.length===game.pairs.length){activeGame.done=true;return setTimeout(finishVerifiedGame,450)}}else{activeGame.answers.push({correct:false,topic:game.pairs[activeGame.matchLeft].left});activeGame.matchMessage={ok:false,text:'Бұл жұп сәйкес емес. Тағы байқап көріңіз.'};activeGame.matchLeft=null}renderGameStep()};
  window.checkMatchGame=function(){
    const {game}=gameByIds(activeGame.workId,activeGame.gameId),selects=[...document.querySelectorAll('[data-match]')];let score=0;
    selects.forEach((select,index)=>{const ok=select.value===game.pairs[index].right;select.style.borderColor=ok?'#80aa8d':'#c98b7c';if(ok)score++});activeGame.score=score;activeGame.answers=game.pairs.map((pair,index)=>({correct:selects[index].value===pair.right,topic:pair.left}));activeGame.done=true;
    document.querySelector('#gameFeedback').innerHTML=`<div class="ds-feedback"><b>${score} / ${game.pairs.length} жұп дұрыс.</b><br>${esc(game.explanation)}<br><button class="primary" style="margin-top:12px" onclick="finishVerifiedGame()">Нәтижені көру</button></div>`;
  };
  window.finishVerifiedGame=function(){finishVerifiedGame()};
  window.endVerifiedGame=function(){if(!activeGame)return;const answered=activeGame.answers.length;if(!answered&&activeGame.score===0){activeGame.answers=[{correct:false,topic:'Аяқталмаған тапсырма'}]}finishVerifiedGame()};
  function finishVerifiedGame(){
    const endButton=document.querySelector('.ds-end-game');if(endButton){endButton.disabled=true;endButton.textContent='Аяқталды'}
    const {work,game}=gameByIds(activeGame.workId,activeGame.gameId),total=game.type==='order'?1:game.type==='match'?game.pairs.length:game.questions.length,percent=Math.round(activeGame.score/total*100),review=[...new Set(activeGame.answers.filter(item=>!item.correct).map(item=>item.topic))];
    const rows=gameResults();rows.unshift({workId:work.id,gameId:game.id,score:activeGame.score,total,percent,date:new Date().toISOString(),learningObjective:game.learningObjective});store.write('adebiet-game-results',rows.slice(0,100));logActivity('game',`${work.title}: ${game.title} — ${percent}%`);
    document.querySelector('#gameSession').innerHTML=`<article class="ds-question ds-result"><span class="ds-kicker">Ойын аяқталды</span><div class="ds-result-score">${percent}%</div><h2>${activeGame.score} / ${total} дұрыс</h2><p>${percent>=80?'Материал жақсы меңгерілген.':percent>=50?'Жақсы бастама. Қате жауаптарды қайта қарап, тағы бір рет байқап көріңіз.':'Бұл — үйренудің бір бөлігі. Шығарма бөлімдерін қайта қарап, асықпай қайталаңыз.'}</p>${review.length?`<div class="ds-fact-note"><b>Қайталау ұсынылады:</b> ${review.map(esc).join(', ')}</div>`:''}<div class="actions" style="justify-content:center"><button class="primary" onclick="openGame('${work.id}','${game.id}')">Қайта ойнау</button><button class="secondary" onclick="openWorkGames('${work.id}')">Басқа ойын таңдау</button><button class="secondary" onclick="openWork('${work.id}')">Шығармаға оралу</button></div></article>`;
  }

  function assistantContext(id){return byId(id||window.currentWorkId)||null}
  function renderAssistant(workId){
    if(workId)window.currentWorkId=workId;const work=assistantContext(workId);
    root().innerHTML=`<section class="ds-page"><div class="ds-page-head"><div><span class="ds-kicker">Дерекке негізделген көмек</span><h1>AI әдеби көмекші</h1><p>${work?`Ағымдағы контекст: «${esc(work.title)}». Жауап тек жобаның тексерілген өрістерінен құрылады.`:'Шығарманы таңдаңыз. Дерек жетіспесе, көмекші оны ашық айтады.'}</p></div></div><section class="assistant-layout"><aside class="assistant-card"><h3>Шығарма контексті</h3><select id="assistantWork" class="search-input" onchange="changeAssistantWork(this.value)"><option value="">Шығарманы таңдаңыз</option>${list().map(item=>`<option value="${item.id}" ${work?.id===item.id?'selected':''}>${esc(item.title)}</option>`).join('')}</select><h3 style="margin-top:22px">Жылдам сұрақтар</h3><button class="quick" onclick="askVerifiedAssistant('author')">Авторы мен жанры →</button><button class="quick" onclick="askVerifiedAssistant('characters')">Кейіпкерлері →</button><button class="quick" onclick="askVerifiedAssistant('plot')">Сюжеті →</button><button class="quick" onclick="askVerifiedAssistant('themes')">Тақырыптары →</button><button class="quick" onclick="askVerifiedAssistant('relations')">Байланыстары →</button><button class="quick" onclick="askVerifiedAssistant('vocabulary')">Сөздігі →</button><div class="assistant-shyrak-inline"><img src="assets/shyrak/shyrak-thinking.png" alt="Шырақ"><p><b>Шырақ</b><br>Сұрағыңды нақты жазсаң, деректен бірге іздейміз.</p></div></aside><div class="chat"><div class="chat-head">${icon('sparkles')} Әдеби көмекші <span class="muted">· тексерілген контекст</span></div><div class="messages" id="messages"><div class="bubble bot">Сәлем! Мен шығарма туралы тек тексерілген дерекке сүйеніп жауап беремін. Факт пен әдеби интерпретацияны бөлек көрсетемін.</div></div><form class="chat-form" onsubmit="askVerifiedAssistant('input');return false"><input id="chatInput" placeholder="Мысалы: Көксеректің кейіпкерлері кім?" autocomplete="off"><button>Жіберу</button></form></div></section></section>`;
    syncNav('assistant');window.scrollTo(0,0);
  }
  window.openAssistantFor=function(id){window.currentWorkId=id;location.hash=`assistant/${id}`};
  window.changeAssistantWork=function(id){window.currentWorkId=id||null;renderAssistant(id)};
  function findMentionedWork(text){const q=text.toLocaleLowerCase('kk-KZ');return list().find(work=>q.includes(work.title.toLocaleLowerCase('kk-KZ')))||assistantContext()}
  function assistantAnswer(work,kind,text){
    if(!work)return 'Алдымен сол жақтағы тізімнен шығарманы таңдаңыз немесе сұрақта оның атауын жазыңыз.';
    const c=work.content||{},q=(text||'').toLocaleLowerCase('kk-KZ'),source=safeSources(work)[0],sourceNote=source?`<br><small>Дерек: <a href="${esc(source.url)}" target="_blank" rel="noopener">${esc(source.name)}</a></small>`:'';
    if(kind==='author'||/(автор|жазған|кімнің|кім жаз)/.test(q))return `<b>Факт:</b> «${esc(work.title)}» — ${work.authorType==='folklore'?'жеке авторы көрсетілмейтін халық ауыз әдебиеті мұрасы':`${esc(work.author)} шығармасы`}. Жанры: ${esc(work.genre||'нақтылануда')}.${sourceNote}`;
    if(kind==='characters'||/(кейіпкер|герой|персонаж)/.test(q))return c.characters?.length?`<b>Факт:</b> тексерілген кейіпкерлер: ${c.characters.map(item=>esc(item.name)).join(', ')}.${sourceNote}`:'Бұл шығарма бойынша кейіпкерлер тізімі қазіргі тексерілген базада жеткіліксіз. Ойдан шығарылған есім қоспаймын.';
    if(kind==='plot'||/(сюжет|оқиға|не туралы|мазмұн)/.test(q))return c.plotSummary?`<b>Фактографиялық мазмұн:</b> ${esc(c.plotSummary)}${sourceNote}`:'Бұл шығарма бойынша тексерілген сюжет мазмұны жеткіліксіз.';
    if(kind==='themes'||/(тақырып|идея|мағына|theme)/.test(q)){const themes=(c.themes||[]).map(item=>typeof item==='string'?item:item.name);return themes.length||c.mainIdea?`<b>Интерпретация:</b> ${themes.length?`шығармада ${themes.map(esc).join(', ')} тақырыптары көрініс табады. `:''}${esc(c.mainIdea||'')}${sourceNote}`:'Бұл шығарма бойынша тексерілген әдеби талдау жеткіліксіз.'}
    if(kind==='relations'||/(байланыс|қарым|relationship)/.test(q))return c.relationships?.length?`<b>Факт:</b> ${c.relationships.map(item=>`${esc(item.from)} — ${esc(item.type)} — ${esc(item.to)}`).join('; ')}.${sourceNote}`:'Тексерілген кейіпкер байланыстары қазіргі базада жоқ.';
    if(kind==='vocabulary'||/(сөздік|сөз мағына|лексик)/.test(q))return c.vocabulary?.length?`<b>Мәтіндік сөздік:</b> ${c.vocabulary.map(item=>`${esc(item.term)} — ${esc(item.definition)}`).join('; ')}.${sourceNote}`:'Бұл шығармаға арналған сөздер нақты басылым мәтінімен әлі байланыстырылмаған. Сондықтан жалпы сөздерді шығарма сөздігі деп көрсетпеймін.';
    if(/(жанр)/.test(q))return `<b>Факт:</b> «${esc(work.title)}» жанры — ${esc(work.genre||'нақтылануда')}.${sourceNote}`;
    return `«${esc(work.title)}» туралы бұл сұраққа қазіргі тексерілген құрылымдық базада нақты жауап жоқ. Автор, жанр, кейіпкерлер, сюжет, тақырыптар немесе байланыстар туралы сұрап көріңіз.`;
  }
  window.askVerifiedAssistant=function(kind){
    const input=document.querySelector('#chatInput'),text=kind==='input'?(input?.value.trim()||''):kind;if(!text)return;const box=document.querySelector('#messages');if(!box)return;
    const labels={author:'Авторы мен жанры',characters:'Кейіпкерлері',plot:'Сюжеті',themes:'Тақырыптары',relations:'Кейіпкер байланыстары',vocabulary:'Сөздігі'};box.insertAdjacentHTML('beforeend',`<div class="bubble user">${esc(labels[kind]||text)}</div>`);if(input)input.value='';const work=findMentionedWork(text),answer=assistantAnswer(work,kind,text);box.insertAdjacentHTML('beforeend',`<div class="bubble bot">${answer}</div>`);box.scrollTop=box.scrollHeight;
  };
  window.askLibrary=window.askVerifiedAssistant;
  window.assistant=function(){renderAssistant()};

  function achievementData(){
    const done=completedWorks(),results=gameResults(),regions=visitedRegions();
    return [
      {icon:'▤',title:'Алғашқы шығарма',description:'Бір шығарманы зерттелді деп белгілеу',unlocked:done.length>=1},
      {icon:'◇',title:'Ойынға алғашқы қадам',description:'Бір оқу ойынын аяқтау',unlocked:results.length>=1},
      {icon:'✓',title:'Нәтижелі оқу',description:'Ойында кемінде 80% нәтиже көрсету',unlocked:results.some(row=>row.percent>=80)},
      {icon:'⌖',title:'Өңір зерттеушісі',description:'Картадан 5 өңірді зерттеу',unlocked:regions.length>=5},
      {icon:'▥',title:'Әдеби топтама',description:'3 шығарманы зерттеу',unlocked:done.length>=3},
      {icon:'◎',title:'Қазақстанды таны',description:'Картадағы 20 өңірдің бәрін зерттеу',unlocked:regions.length>=20}
    ];
  }
  function renderAchievements(){
    const rows=achievementData(),unlocked=rows.filter(row=>row.unlocked).length;
    root().innerHTML=`<section class="ds-page"><div class="ds-page-head"><div><span class="ds-kicker">Нақты әрекетке негізделген</span><h1>Жетістіктер</h1><p>Белгілер тек орындалған оқу әрекеттеріне сүйенеді. Жалған streak немесе жасанды прогресс көрсетілмейді.</p></div><div class="ds-mini-stat"><b>${unlocked}/${rows.length}</b><span>ашылған белгі</span></div></div><div class="achievements">${rows.map(row=>`<article class="work-card achievement ${row.unlocked?'':'locked'}"><span class="badge">${row.icon}</span><div><b>${esc(row.title)}</b><p class="muted">${esc(row.description)}</p><small>${row.unlocked?'Ашылды ✓':'Әлі жабық'}</small></div></article>`).join('')}</div></section>`;
    syncNav('achievements');window.scrollTo(0,0);
  }
  window.achievements=renderAchievements;

  function renderProfile(){
    const user=typeof currentUser==='function'?currentUser():null,done=completedWorks(),results=gameResults(),regions=visitedRegions(),badges=achievementData().filter(row=>row.unlocked),rows=activities(),name=user?.name||'Оқырман';
    root().innerHTML=`<section class="profile-top"><div class="big-avatar">${esc(name.charAt(0).toUpperCase())}</div><div><span class="ds-kicker">Жеке оқу кеңістігі</span><h1>${esc(name)}</h1><p class="muted">${user?.email?esc(user.email):'Қонақ режимі'}</p></div></section><div class="ds-profile-grid"><article class="stat-card"><span class="muted">Зерттелген</span><strong>${done.length}</strong><span class="muted">13 шығарманың ішінен</span></article><article class="stat-card"><span class="muted">Ойын сессиясы</span><strong>${results.length}</strong><span class="muted">нақты нәтиже</span></article><article class="stat-card"><span class="muted">Өңір</span><strong>${regions.length}</strong><span class="muted">20 өңірдің ішінен</span></article><article class="stat-card"><span class="muted">Жетістік</span><strong>${badges.length}</strong><span class="muted">ашылған белгі</span></article></div><section class="section"><div class="section-head"><div><h2>Соңғы әрекеттер</h2><p>Тек осы құрылғыда шынымен орындалған қадамдар</p></div></div><div class="ds-card">${rows.length?`<div class="ds-activity-list">${rows.slice(0,8).map(row=>`<div class="ds-activity"><span>${esc(row.label)}</span><span>${new Date(row.date).toLocaleDateString('kk-KZ')}</span></div>`).join('')}</div>`:'<div class="ds-empty">Әзірге тіркелген оқу әрекеті жоқ.</div>'}</div></section><section class="section"><div class="section-head"><div><h2>Таңдаулылар</h2><p>${typeof saved!=='undefined'?saved.length:0} шығарма сақталған</p></div></div><div class="cards">${typeof saved!=='undefined'&&saved.length?saved.map(byId).filter(Boolean).map(makeWorkCard).join(''):'<div class="ds-empty">Таңдаулы шығарма әлі жоқ.</div>'}</div></section>${user?'<div class="actions"><button class="secondary" onclick="editProfile()">Профильді өңдеу</button><button class="secondary" onclick="logoutUser()">Шығу</button></div>':''}`;
    syncNav('profile');window.scrollTo(0,0);
  }
  window.profile=renderProfile;window.profileNew=renderProfile;

  window.search=function(){
    document.querySelector('#modalRoot').innerHTML=`<div class="modal-overlay" onclick="if(event.target===this)closeModal()"><div class="modal" role="dialog" aria-modal="true" aria-labelledby="searchTitle"><div class="modal-head"><div><span class="ds-kicker">Жылдам навигация</span><h2 id="searchTitle">Іздеу</h2></div><button onclick="closeModal()" aria-label="Жабу">✕</button></div><input autofocus class="search-input" id="searchInput" placeholder="Шығарма, автор немесе жанр..." oninput="doSearch()"><div id="results" class="empty">Іздеу сөзін енгізіңіз</div></div></div>`;document.querySelector('#searchInput')?.focus();
  };
  window.doSearch=function(){
    const input=document.querySelector('#searchInput'),out=document.querySelector('#results'),q=(input?.value||'').trim().toLocaleLowerCase('kk-KZ');if(!out)return;
    if(!q){out.innerHTML='<div class="empty">Іздеу сөзін енгізіңіз</div>';return}
    const rows=list().filter(work=>[work.title,work.author,work.genre,...(work.content?.characters||[]).map(item=>item.name)].join(' ').toLocaleLowerCase('kk-KZ').includes(q));
    out.innerHTML=rows.length?rows.map(work=>`<button class="search-result" onclick="closeModal();openWork('${work.id}')"><span><b>${esc(work.title)}</b><br><small class="muted">${esc(work.author)} · ${esc(work.genre||'')}</small></span><span>→</span></button>`).join(''):'<div class="ds-empty">Нәтиже табылмады. Басқа атау немесе авторды байқап көріңіз.</div>';
  };

  const originalRegionSelect=window.selectLiteraryRegion;
  if(typeof originalRegionSelect==='function')window.selectLiteraryRegion=function(id){const set=new Set(visitedRegions());if(!set.has(id)){set.add(id);store.write('adebiet-visited-regions',[...set]);logActivity('region','Әдеби картадан жаңа өңір зерттелді')}return originalRegionSelect(id)};

  function handleRoute(){
    const user=typeof currentUser==='function'?currentUser():{loggedIn:true};
    if(!user||!user.loggedIn){if(typeof showAuth==='function')showAuth('login');return}
    const hash=location.hash.slice(1)||'home',parts=hash.split('/'),route=parts[0];
    if(route==='map'||route==='author')return syncNav('map');
    if(route==='work')return renderWork(parts[1]);
    if(route==='games'&&parts.length===3)return renderGamePage(parts[1],parts[2]);
    if(route==='games'&&parts.length===2)return renderWorkGames(parts[1]);
    if(route==='games')return renderGameCenter();
    if(route==='assistant')return renderAssistant(parts[1]);
    if(route==='library')return renderLibrary();
    if(route==='achievements')return renderAchievements();
    if(route==='profile')return renderProfile();
    if(route==='home'||!route)return renderHome();
  }
  window.addEventListener('hashchange',()=>setTimeout(handleRoute,0));
  setTimeout(handleRoute,80);
})();
