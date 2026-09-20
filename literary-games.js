(function(){
  'use strict';
  const works=window.VERIFIED_LITERARY_DATA||{};
  const all=Object.values(works).map(work=>({...work}));
  const unique=rows=>[...new Set(rows.filter(Boolean))];
  const rotate=(value,pool,count=3)=>unique(pool).filter(item=>item!==value).slice(0,count);
  const question=(prompt,answer,pool,explanation,skill)=>{
    const options=unique([answer,...rotate(answer,pool)]).slice(0,4);
    return {prompt,options,answer:options.indexOf(answer),explanation,skill,reviewTopic:skill};
  };
  const sentences=text=>String(text||'').split(/(?<=[.!?])\s+/).map(x=>x.trim()).filter(x=>x.length>18);
  const globalCharacters=unique(all.flatMap(w=>(w.content?.characters||[]).map(c=>c.name)));
  const globalThemes=unique(all.flatMap(w=>(w.content?.themes||[]).map(t=>typeof t==='string'?t:t.name)));
  const authors=unique(all.map(w=>w.author));
  const genres=unique(all.map(w=>w.genre));

  function orderedPlot(work){
    const events=(work.content?.plotEvents||[]).map((event,index)=>({id:event.id||`event-${index}`,text:event.text||event.description||event.label})).filter(x=>x.text);
    if(events.length>=3)return events.slice(0,5);
    const parts=unique([...sentences(work.content?.plotSummary||work.intro),work.content?.conflict,work.content?.mainIdea]);
    return parts.slice(0,5).map((text,index)=>({id:`summary-${index}`,text}));
  }
  function characterQuestions(work){
    const chars=work.content?.characters||[];
    return chars.filter(c=>c.description||c.role).slice(0,5).map(c=>question(
      c.description?`Сипаттамасы бойынша кейіпкерді тап: ${c.description}`:`«${c.role}» рөліндегі кейіпкер кім?`,
      c.name,globalCharacters,`Бұл — ${c.name}. ${c.role||c.description||''}`,'Кейіпкерді тану'
    ));
  }
  function quizQuestions(work){
    const c=work.content||{},themes=(c.themes||[]).map(t=>typeof t==='string'?t:t.name),rows=[];
    rows.push(question(`«${work.title}» шығармасының авторын таңда.`,work.author,authors,`${work.title} — ${work.author} шығармасы.`,'Автор'));
    rows.push(question(`«${work.title}» шығармасының жанрын таңда.`,work.genre,genres,`Тексерілген жанрлық белгі: ${work.genre}.`,'Жанр'));
    if(themes[0])rows.push(question(`Шығармаға тән тақырыпты таңда.`,themes[0],globalThemes,`Тексерілген тақырып: ${themes[0]}.`,'Тақырып'));
    if(c.setting)rows.push(question(`Оқиға кеңістігін таңда.`,c.setting,all.map(w=>w.content?.setting),`Оқиға кеңістігі: ${c.setting}`,'Оқиға кеңістігі'));
    return rows.slice(0,5);
  }
  function storyBranches(work){
    const c=work.content||{},themes=(c.themes||[]).map(t=>typeof t==='string'?t:t.name),anchors=unique([c.conflict,...themes,c.mainIdea]).slice(0,4);
    return anchors.slice(0,3).map((anchor,index)=>({
      prompt:index===0?`«${work.title}» әлеміндегі шешуші сәтте кейіпкер қай бағытты таңдайды?`:`Алдыңғы таңдаудан кейін оқиға қалай жалғасады?`,
      context:index===0?(c.plotSummary||work.intro):`Балама желінің өзегі: ${anchors[index-1]}`,
      options:[
        {text:`«${anchor}» бағытын ұстану`,consequence:`Оқиға «${anchor}» тақырыбын тереңдететін жаңа тармаққа өтеді.`},
        {text:'Қақтығыстан уақытша шегіну',consequence:'Кейіпкер уақыт ұтады, бірақ негізгі тартыс шешілмей, келесі таңдауға өтеді.'},
        {text:'Басқа кейіпкерден көмек сұрау',consequence:'Оқиға жеке шешімнен өзара жауапкершілікке қарай бұрылады.'}
      ]
    }));
  }
  function buildStoryQuest(work){
    const c=work.content||{},characters=c.characters||[],events=orderedPlot(work);
    const hero=characters[0]?.name||'Басты кейіпкер';
    const ally=characters[1]?.name||'жақын адам';
    const theme=(c.themes||[]).map(item=>typeof item==='string'?item:item.name)[0]||'адам таңдауы мен жауапкершілік';
    const conflict=c.conflict||events[1]?.text||c.plotSummary||work.intro;
    const original=(events.length?events.map(item=>item.text).join(' '):c.plotSummary)||work.intro;
    const consequence=(result,emotion,relations,direction,meaning)=>({result,emotion,relations,direction,meaning});
    const ending=(id,type,title,summary,heroEffect,othersEffect,plotEffect,ideaEffect,comparison)=>({id,type,title,summary,heroEffect,othersEffect,plotEffect,ideaEffect,comparison});
    return {
      startNode:'start',hero,theme,original,
      nodes:{
        start:{label:'Шешім сәті',character:hero,title:'Алғашқы таңдау',situation:conflict,choices:[
          {id:'face',icon:'↗',text:'Қиындыққа тікелей қарсы тұру',hint:'Кейіпкер жауапкершілікті өз мойнына алады.',consequence:consequence('Кейіпкер мәселені жасырмай, ашық әрекетке көшеді.','Қорқыныштың орнын батылдық пен жауапкершілік басады.',`${ally} оның ниетін түсіне бастайды.`,'Қақтығыс ертерек шиеленісіп, шешуші сәт жақындайды.',`Бұл жол ${theme} тақырыбын белсенді әрекет арқылы ашады.`),next:'public_choice'},
          {id:'listen',icon:'◎',text:`${ally} пікірін тыңдау`,hint:'Шешім өзара сенім арқылы қалыптасады.',consequence:consequence('Кейіпкер асығыс қадамнан бас тартып, өзгенің уәжін тыңдайды.','Ішкі күмән сақталғанымен, ойы айқындала түседі.',`Олардың арасындағы сенім күшейіп, жауапкершілік ортақтасады.`,'Оқиға тартыстан диалог пен түсіністікке бұрылады.',`Бұл тармақ ${theme} ұғымын қарым-қатынас арқылы зерттейді.`),next:'trust_choice'},
          {id:'leave',icon:'→',text:'Басқа жолды жалғыз таңдау',hint:'Кейіпкер тәуелсіздік үшін бұрынғы ортасынан алыстайды.',consequence:consequence('Кейіпкер таныс ортадан кетіп, шешімді жалғыз қабылдайды.','Еркіндік сезімімен бірге жалғыздық күшейеді.','Бұрынғы байланыстар әлсіреп, түсінбеушілік пайда болады.','Негізгі тартыс сыртқы оқиғадан ішкі сынаққа ауысады.',`Бұл нұсқа ${theme} тақырыбын жеке еркіндік тұрғысынан өзгертеді.`),next:'solitary_choice'}
        ]},
        public_choice:{label:'Бұрылыс',character:hero,title:'Ашық әрекеттің бағасы',situation:'Тікелей әрекет айналадағы адамдарды да таңдау жасауға мәжбүр етті.',choices:[
          {id:'share',icon:'◇',text:'Шындықты көпшілікке айту',hint:'Жасырын мәселе ортақ талқыға шығады.',consequence:consequence('Жасырын қалған қайшылық ашылады.','Кейіпкер жеңілдік сезінеді, бірақ салдардан қауіптенеді.','Біреулер қолдайды, енді біреулер қарсы тұрады.','Жеке мәселе қоғамдық жауапкершілікке айналады.',`Авторлық желідегі тартыс жаңа, ашық сипат алады.`),next:'ending_change'},
          {id:'protect',icon:'⌁',text:`${ally} қауіпсіздігін бірінші орынға қою`,hint:'Жеңістен бұрын адам тағдыры таңдалады.',consequence:consequence('Кейіпкер әрекетін баяулатып, жақын адамын қорғайды.','Ол өз шешімінің адамдық өлшемін сезінеді.',`Арадағы байланыс сенімге айналады.`,'Шиеленіс бірден шешілмей, сабырлы келісімге жол ашады.','Адамды қорғау оқиғаның құндылық өзегіне айналады.'),next:'ending_near'}
        ]},
        trust_choice:{label:'Маңызды шешім',character:hero,title:'Сенімнен кейінгі қадам',situation:'Диалог екі кейіпкерге ортақ жол табуға мүмкіндік берді.',choices:[
          {id:'together',icon:'∞',text:'Ортақ жоспармен әрекет ету',hint:'Әркім өз жауапкершілігін қабылдайды.',consequence:consequence('Кейіпкерлер келісілген қадам жасайды.','Күмән орнына өзара тірек келеді.','Қарым-қатынас тең серіктестікке өзгереді.','Қақтығыс күшпен емес, бірлескен әрекетпен шешіледі.',`${theme} идеясы ортақ жауапкершілікпен тереңдейді.`),next:'ending_hope'},
          {id:'sacrifice',icon:'△',text:'Өз мүддесінен уақытша бас тарту',hint:'Кейіпкер басқа адамның болашағын қорғайды.',consequence:consequence('Кейіпкер өз мақсатын кейінге қалдырады.','Жоғалту сезімі ішкі кемелденуге ұласады.',`${ally} бұл таңдаудың салмағын түсінеді.`,'Оқиға сыртқы жеңістен моральдық жеңіске ауысады.','Құрбандық еркін таңдау мен парыздың арақатынасын көрсетеді.'),next:'ending_near'}
        ]},
        solitary_choice:{label:'Бұрылыс',character:hero,title:'Жалғыз жолдың сынағы',situation:'Тәуелсіз шешім кейіпкерді бұрын болмаған жауапкершілікпен беттестірді.',choices:[
          {id:'return',icon:'↶',text:'Қайтып барып, сөйлесу',hint:'Қателікті мойындау әлсіздік емес.',consequence:consequence('Кейіпкер өткен байланысын қалпына келтіруге қадам жасайды.','Тәкаппарлықтың орнына шынайылық келеді.','Үзілген қарым-қатынас қайта құрыла бастайды.','Жалғыздық желісі татуласу мүмкіндігіне бұрылады.','Өзгеріс адамның шешімін қайта қарау қабілетімен байланысады.'),next:'ending_hope'},
          {id:'continue',icon:'↑',text:'Жолды жалғыз аяқтау',hint:'Еркіндік толық жауапкершілікті талап етеді.',consequence:consequence('Кейіпкер кері бұрылмай, таңдауының барлық салдарын қабылдайды.','Ішкі беріктікпен бірге айырылысу мұңы қалады.','Ескі байланыстар естелікке айналады.','Оқиға жеке қалыптасу тарихымен аяқталады.',`${theme} идеясы тәуелсіздік пен оның құны арқылы қайта оқылады.`),next:'ending_alternative'}
        ]}
      },
      endings:{
        ending_near:ending('ending_near','Түпнұсқаға жақын аяқталу','Адамдық өлшем сақталған жол','Сенің шешімдерің қақтығыстың өзегін сақтап, кейіпкерді жауапкершілікке жақындатты.','Кейіпкер әрекеттен бұрын оның адамға әсерін бағалауды үйренді.','Байланыстар сыналды, бірақ толық үзілмеді.','Негізгі тартыс сақталып, шешілу тәсілі жұмсарды.',`${theme} идеясы жауапкершілік арқылы күшейді.`,'Авторлық желінің негізгі қақтығысы сақталады, бірақ сенің нұсқаңда қарым-қатынасқа көбірек орын берілді.'),
        ending_change:ending('ending_change','Балама аяқталу','Ашық өзгеріс жолы','Жеке шешім көпшілікке әсер етіп, оқиғаның ауқымын кеңейтті.','Кейіпкер үнсіз бақылаушыдан өзгеріс бастаушысына айналды.','Қарым-қатынастар қолдау мен қарсылыққа бөлінді.','Жеке тартыс қоғамдық сипат алды.',`${theme} идеясы ашық әрекет пен азаматтық жауапкершілікке ауысты.`,'Түпнұсқадағы оқиғалар желісінен айырмасы — шешімнің салдары бір кейіпкермен шектелмейді.'),
        ending_hope:ending('ending_hope','Сәтті аяқталу','Бірлескен үміт жолы','Тыңдау мен ортақ әрекет жаңа мүмкіндік ашты.','Кейіпкер сенімнің де батылдық екенін түсінді.','Қарым-қатынастар тең серіктестікке айналды.','Тартыс келісім мен ортақ жоспар арқылы шешілді.',`${theme} идеясы ынтымақ арқылы жаңаша ашылды.`,'Авторлық желіде қайшылық алдыңғы орында болса, сенің нұсқаң өзара түсіністіктің мүмкіндігін көрсетеді.'),
        ending_alternative:ending('ending_alternative','Балама аяқталу','Еркіндіктің құны','Кейіпкер таңдаған дербес жолын соңына дейін жеткізді.','Ол ішкі беріктік тапты, бірақ жоғалтудың салмағын сезінді.','Бұрынғы байланыстар әлсіреді.','Оқиға ортақ тағдырдан жеке қалыптасу желісіне ауысты.',`${theme} идеясы еркіндік пен жалғыздықтың арақатынасы арқылы өзгерді.`,'Түпнұсқамен салыстырғанда бұл нұсқа сыртқы тартыстан гөрі кейіпкердің ішкі өзгерісіне басымдық береді.')
      }
    };
  }
  function makeGames(work){
    const c=work.content||{},plot=orderedPlot(work),chars=c.characters||[],themes=(c.themes||[]).map(t=>typeof t==='string'?t:t.name);
    const pairs=chars.slice(0,5).map(ch=>({left:ch.name,right:ch.role||ch.description}));
    const builderItems=unique([c.setting,c.conflict,c.mainIdea,...themes]).slice(0,5).map((text,index)=>({id:`anchor-${index}`,text}));
    return [
      {id:'story-builder',mechanic:'builder',title:'Сюжетті жина',icon:'book',type:'order',difficulty:'Орташа',learningObjective:'Шығарманың оқиға және мағына тіректерін бір желіге жинау',instruction:'Тексерілген әдеби тіректерді кіріспеден негізгі идеяға қарай орналастыр.',prompt:'Әдеби желіні жина',items:builderItems.length>=3?builderItems:plot,successExplanation:'Желі шығарма кеңістігі, тартысы және негізгі идеясы бойынша жиналды.',retryExplanation:'Алдымен оқиға ортасын, одан кейін тартыс пен идеяны орналастыр.'},
      {id:'plot-order',mechanic:'timeline',title:'Сюжетті ретте',icon:'branch',type:'order',difficulty:'Орташа',learningObjective:'Оқиғалардың себеп-салдар ретін түсіну',instruction:'Оқиға үзінділерін шығармадағы ретімен орналастыр.',prompt:'Оқиғаларды дұрыс ретке қой',items:plot,successExplanation:'Оқиғалар тексерілген мазмұндағы ретпен орналасты.',retryExplanation:'Оқиғаның басталуын, дамуын және шешімін қайта салыстыр.'},
      {id:'character-guess',mechanic:'character',title:'Кейіпкерді тап',icon:'users',type:'quiz',difficulty:'Жеңіл',learningObjective:'Кейіпкерлердің рөлі мен сипаттамасын ажырату',instruction:'Сипаттамаға сәйкес кейіпкерді таңда.',questions:characterQuestions(work)},
      {id:'matching',mechanic:'matching',title:'Сәйкестендіру',icon:'connections',type:'match',difficulty:'Орташа',learningObjective:'Кейіпкер мен оның шығармадағы рөлін байланыстыру',instruction:'Кейіпкерді тексерілген рөлімен сәйкестендір.',prompt:'Сәйкес жұптарды тап',pairs:pairs.length>=3?pairs:[{left:work.title,right:work.author},{left:'Жанр',right:work.genre},{left:'Тақырып',right:themes[0]||c.mainIdea}],explanation:'Жұптар тек жоба деректерінен құрылды.'},
      {id:'literary-quiz',mechanic:'quiz',title:'Тест',icon:'quiz',type:'quiz',difficulty:'Орташа',learningObjective:'Шығарма туралы негізгі деректерді бекіту',instruction:'Әр сұраққа бір дұрыс жауап таңда.',questions:quizQuestions(work)},
      {id:'story-rewrite',mechanic:'branch',title:'Сюжетті квест',icon:'branch',type:'branch',difficulty:'Шығармашылық',learningObjective:'Кейіпкер шешімінің мінезге, қарым-қатынасқа, сюжетке және негізгі идеяға әсерін талдау',instruction:'Кейіпкер атынан шешім қабылда. Әр таңдау оқиғаның бағыты мен мағынасын өзгертеді.',storyQuest:buildStoryQuest(work)}
    ].filter(game=>game.type==='order'?game.items?.length>=3:game.type==='match'?game.pairs?.length>=3:game.type==='branch'?game.storyQuest?.startNode:game.questions?.length>=3);
  }
  all.forEach(work=>{work.games=makeGames(work)});
  window.VERIFIED_LITERARY_DATA=Object.fromEntries(all.map(work=>[work.id,work]));
  window.LITERARY_GAME_DATA=Object.fromEntries(all.map(work=>[work.id,work.games]));
})();
