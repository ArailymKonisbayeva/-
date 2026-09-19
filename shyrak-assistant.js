(function(){
  'use strict';
  const root=document.querySelector('#shyrakAssistantRoot');
  if(!root)return;
  const assets={idle:'assets/shyrak/shyrak-idle.png',greeting:'assets/shyrak/shyrak-talking.png',thinking:'assets/shyrak/shyrak-thinking.png',talking:'assets/shyrak/shyrak-talking.png'};
  Object.values(assets).forEach(src=>{const image=new Image();image.src=src});
  const escapeHtml=value=>String(value??'').replace(/[&<>'"]/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[ch]));
  const currentUserKey=()=>{try{return typeof currentUser==='function'?(currentUser()?.email||'guest'):'guest'}catch{return 'guest'}};
  const storageKey=()=>`adebiet-shyrak::${currentUserKey()}`;
  const initialState={status:'idle',isOpen:false,messages:[{role:'bot',text:'Сәлем! Мен Шырақпын — әдеби саяхаттағы жолсерігің. Қай бөлімді бірге зерттейміз?'}],activeHint:'',lastInteraction:0,seenHints:[]};
  function load(){try{return {...initialState,...JSON.parse(localStorage.getItem(storageKey())||'{}')}}catch{return {...initialState}}}
  const state=load();let statusTimer=null,hintTimer=null,lastContextKey='';
  function save(){localStorage.setItem(storageKey(),JSON.stringify({...state,status:'idle',activeHint:''}))}
  function works(){return window.VERIFIED_LITERARY_DATA||{}}
  function workById(id){return works()[id]||null}
  function routeContext(){
    const hash=location.hash.slice(1)||'home',parts=hash.split('/'),route=parts[0];let workId=null;
    if(route==='work')workId=parts[1];
    if(route==='games'&&parts[1])workId=parts[1];
    if(route==='assistant'&&parts[1])workId=parts[1];
    if(!workId&&['work','games','assistant'].includes(route))workId=window.currentWorkId||null;
    const labels={home:'Басты бет',map:'Әдеби саяхат',library:'Шығармалар',games:'Ойындар',assistant:'AI көмекші',achievements:'Жетістіктер',profile:'Профиль',work:'Шығарма'};
    const activeTab=document.querySelector('.ds-tabs button.active')?.textContent?.trim();
    return {route,section:activeTab||labels[route]||'Бөлім',work:workById(workId),workId};
  }
  function setStatus(status,duration){
    clearTimeout(statusTimer);state.status=status;renderStatus();
    if(duration)statusTimer=setTimeout(()=>{state.status='idle';renderStatus()},duration);
  }
  function renderStatus(){
    const shell=root.querySelector('.shyrak-assistant');if(!shell)return;shell.dataset.status=state.status;
    root.querySelectorAll('.shyrak-image').forEach(image=>image.classList.toggle('is-active',image.dataset.state===state.status));
    const mini=root.querySelector('.shyrak-mini');if(mini)mini.src=assets[state.status]||assets.idle;
  }
  function contextLabel(){const ctx=routeContext();return ctx.work?`${ctx.work.title} · ${ctx.section}`:ctx.section}
  function quickActions(){
    const ctx=routeContext();
    if(ctx.work)return [['characters','Кейіпкерлер'],['plot','Сюжет'],['themes','Негізгі идея'],['author','Авторы']];
    if(ctx.route==='games')return [['guide','Ойын ережесі'],['library','Шығарма таңдау'],['progress','Прогресс']];
    if(ctx.route==='map')return [['map','Картаны қалай зерттеймін?'],['library','Шығармалар'],['help','Не істей аласың?']];
    return [['help','Не істей аласың?'],['library','Шығарма таңдау'],['map','Әдеби карта']];
  }
  function render(){
    root.innerHTML=`<div class="shyrak-assistant" data-status="${state.status}">
      <div class="shyrak-speech" role="status" aria-live="polite" ${state.activeHint?'':'hidden'}><b>Шырақ</b><span>${escapeHtml(state.activeHint)}</span><button type="button" aria-label="Подсказканы жабу" data-shyrak-dismiss>×</button></div>
      <section class="shyrak-panel" role="dialog" aria-modal="false" aria-labelledby="shyrakTitle" ${state.isOpen?'':'hidden'}>
        <header class="shyrak-panel-head"><div class="shyrak-panel-title"><img class="shyrak-mini" src="${assets[state.status]||assets.idle}" alt=""><div><strong id="shyrakTitle">Шырақ</strong><small>Әдеби саяхаттағы жолсерігің</small></div></div><button class="shyrak-close" type="button" aria-label="Көмекшіні жабу" data-shyrak-close>×</button></header>
        <div class="shyrak-context"><span></span><b>Қазіргі контекст:</b>&nbsp;<em>${escapeHtml(contextLabel())}</em></div>
        <div class="shyrak-messages" aria-live="polite">${state.messages.map(message=>`<div class="shyrak-message ${message.role}">${escapeHtml(message.text)}${message.source?`<small>Дерек: ${escapeHtml(message.source)}</small>`:''}</div>`).join('')}</div>
        <div><div class="shyrak-quick-actions">${quickActions().map(([kind,label])=>`<button type="button" class="shyrak-quick" data-shyrak-quick="${kind}">${escapeHtml(label)}</button>`).join('')}</div><form class="shyrak-form"><input class="shyrak-input" aria-label="Шыраққа сұрақ" placeholder="Шырақтан сұра..." autocomplete="off"><button class="shyrak-send" aria-label="Сұрақты жіберу">→</button></form></div>
      </section>
      <button class="shyrak-character" type="button" aria-label="Шырақ көмекшісін ашу" aria-expanded="${state.isOpen}"><span class="shyrak-stage">${Object.entries(assets).map(([key,src])=>`<img class="shyrak-image ${state.status===key?'is-active':''}" data-state="${key}" src="${src}" alt="" draggable="false">`).join('')}</span><span class="shyrak-status-dot" aria-hidden="true"></span></button>
    </div>`;
    bind();scrollMessages();
  }
  function bind(){
    root.querySelector('.shyrak-character')?.addEventListener('click',togglePanel);
    root.querySelector('[data-shyrak-close]')?.addEventListener('click',closePanel);
    root.querySelector('[data-shyrak-dismiss]')?.addEventListener('click',dismissHint);
    root.querySelector('.shyrak-form')?.addEventListener('submit',event=>{event.preventDefault();const input=root.querySelector('.shyrak-input');sendQuestion(input?.value||'');if(input)input.value=''});
    root.querySelectorAll('[data-shyrak-quick]').forEach(button=>button.addEventListener('click',()=>sendQuestion(button.textContent,button.dataset.shyrakQuick)));
  }
  function togglePanel(){state.isOpen?closePanel():openPanel()}
  function openPanel(){state.isOpen=true;state.activeHint='';setStatus('greeting',1800);save();render();setTimeout(()=>root.querySelector('.shyrak-input')?.focus(),0)}
  function closePanel(){state.isOpen=false;setStatus('idle');save();render();root.querySelector('.shyrak-character')?.focus()}
  function dismissHint(){state.activeHint='';setStatus('idle');render()}
  function scrollMessages(){const box=root.querySelector('.shyrak-messages');if(box)box.scrollTop=box.scrollHeight}
  function findWork(text){const query=text.toLocaleLowerCase('kk-KZ');return Object.values(works()).find(work=>query.includes(work.title.toLocaleLowerCase('kk-KZ')))||routeContext().work||null}
  function answer(work,kind,text){
    const q=text.toLocaleLowerCase('kk-KZ'),ctx=routeContext(),content=work?.content||{},source=work?.sources?.find(item=>/^https:\/\//.test(item.url||''));
    if(kind==='help')return {text:'Мен ағымдағы бет пен шығарманы түсінемін: автор, жанр, кейіпкерлер, сюжет, тақырыптар және байланыстар туралы тексерілген дерекпен көмектесемін.'};
    if(kind==='map')return {text:'Картадан өңірді таңда. Ашылған панельден сол өңірге қатысты авторлар мен шығармаларды зерттей аласың.'};
    if(kind==='library')return {text:'«Шығармалар» бөлімінде 13 туынды бар. Карточканы ашып, шолу, кейіпкерлер, сюжет және тақырыптарды кезекпен қара.'};
    if(kind==='guide')return {text:'Ойын карточкасынан тапсырманы таңда. Әр жауаптан кейін түсіндірме беріледі, ал нәтиже профиліңде сақталады.'};
    if(kind==='progress')return {text:'Прогресс тек нақты әрекеттерден есептеледі: зерттелген шығармалар, аяқталған ойындар және картадан қаралған өңірлер.'};
    if(!work)return {text:`Қазір сен «${ctx.section}» бөліміндесің. Нақты әдеби жауап алу үшін шығарма атауын сұрақта жаз немесе шығарма бетіне өт.`};
    const factSource=source?.name||'';
    if(kind==='author'||/(автор|жазған|кімнің|жанр)/.test(q))return {text:`«${work.title}» — ${work.authorType==='folklore'?'қазақ халық мұрасы':`${work.author} шығармасы`}. Жанры: ${work.genre||'нақтылануда'}.`,source:factSource};
    if(kind==='characters'||/(кейіпкер|герой|персонаж)/.test(q))return content.characters?.length?{text:`Тексерілген кейіпкерлер: ${content.characters.map(item=>item.name).join(', ')}.`,source:factSource}:{text:'Бұл шығарма бойынша тексерілген кейіпкерлер тізімі жеткіліксіз. Ойдан шығарылған есім қоспаймын.'};
    if(kind==='plot'||/(сюжет|оқиға|не туралы|мазмұн)/.test(q))return content.plotSummary?{text:content.plotSummary,source:factSource}:{text:'Бұл шығарма бойынша тексерілген сюжет мазмұны жеткіліксіз.'};
    if(kind==='themes'||/(тақырып|идея|мағына)/.test(q)){const themes=(content.themes||[]).map(item=>typeof item==='string'?item:item.name);return themes.length||content.mainIdea?{text:`Әдеби интерпретация: ${themes.length?`${themes.join(', ')} тақырыптары көрінеді. `:''}${content.mainIdea||''}`,source:factSource}:{text:'Бұл шығарма бойынша тексерілген әдеби талдау жеткіліксіз.'}}
    if(/(байланыс|қарым)/.test(q))return content.relationships?.length?{text:content.relationships.map(item=>`${item.from} — ${item.type} — ${item.to}`).join('; '),source:factSource}:{text:'Тексерілген кейіпкер байланыстары қазіргі базада жоқ.'};
    if(/(сөздік|сөз мағына)/.test(q))return content.vocabulary?.length?{text:content.vocabulary.map(item=>`${item.term} — ${item.definition}`).join('; '),source:factSource}:{text:'Бұл шығарма сөздігі нақты басылым мәтінімен әлі байланыстырылмаған. Сондықтан дерек ойдан қосылмайды.'};
    return {text:`«${work.title}» туралы бұл сұраққа қазіргі тексерілген базада нақты жауап жоқ. Автор, жанр, кейіпкерлер, сюжет немесе негізгі идея туралы сұрап көр.`};
  }
  function sendQuestion(raw,kind=''){const text=raw.trim();if(!text||state.status==='thinking')return;state.activeHint='';state.messages.push({role:'user',text});state.lastInteraction=Date.now();setStatus('thinking');save();render();const messages=root.querySelector('.shyrak-messages');if(messages)messages.insertAdjacentHTML('beforeend','<div class="shyrak-message bot"><span class="shyrak-loading" aria-label="Шырақ жауап ойлап жатыр"><i></i><i></i><i></i></span> Шырақ жауап ойлап жатыр...</div>');scrollMessages();setTimeout(()=>{const response=answer(findWork(text),kind,text);state.messages.push({role:'bot',...response});state.messages=state.messages.slice(-30);setStatus('talking',Math.min(5000,1800+response.text.length*12));save();render()},520)}
  function say(text,duration=2600){if(!text)return;clearTimeout(hintTimer);state.activeHint=String(text);state.lastInteraction=Date.now();setStatus('talking',duration);render();hintTimer=setTimeout(()=>{if(state.activeHint===text)dismissHint()},duration)}
  function hintFor(ctx){if(ctx.work)return `${ctx.work.title} әлеміне қош келдің! Қаласаң, кейіпкерлері мен сюжетін бірге зерттейік.`;const hints={home:'Сәлем! Саяхатты картадан немесе шығармалар кітапханасынан бастай аласың.',map:'Өңірді таңдасаң, сол жермен байланысты қаламгерлерді көрсетемін.',library:'Қай шығарманы таңдарыңды білмесең, менен жанры немесе тақырыбы бойынша сұра.',games:'Ойын алдында шығарманың шолу бөлімін қарап шықсаң, жауап беру жеңілдейді.',assistant:'Мен осы беттегі көмекшінің де контекстін сақтаймын.',achievements:'Белгілер тек нақты оқу әрекеттеріңнен ашылады.',profile:'Мұнда сенің нақты зерттеу қадамдарың сақталады.'};return hints[ctx.route]||''}
  function onContextChange(){const ctx=routeContext(),key=`${ctx.route}:${ctx.workId||''}:${ctx.section}`;if(key===lastContextKey)return;lastContextKey=key;const seen=new Set(state.seenHints||[]),hint=hintFor(ctx);if(hint&&!seen.has(key)&&Date.now()-state.lastInteraction>12000){clearTimeout(hintTimer);hintTimer=setTimeout(()=>{state.activeHint=hint;state.seenHints=[...seen,key].slice(-30);setStatus('greeting',5200);save();render();setTimeout(()=>{if(state.activeHint===hint)dismissHint()},5200)},900)}if(state.isOpen)render()}
  document.addEventListener('keydown',event=>{if(event.key==='Escape'&&state.isOpen)closePanel()});
  document.addEventListener('click',event=>{if(event.target.closest('.ds-tabs button'))setTimeout(onContextChange,0)});
  window.addEventListener('hashchange',()=>setTimeout(onContextChange,90));
  window.ShyrakAssistant={open:openPanel,close:closePanel,send:sendQuestion,say,getState:()=>({...state,context:routeContext()})};
  render();setTimeout(onContextChange,180);
})();
