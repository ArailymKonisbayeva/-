/* Reading destinations, checked 2026-10-21. External availability is NOT a
   licence to republish, nor a claim of line-by-line textual verification. */
(()=>{
  const book=(slug,title,note='Кітапханаға кіру немесе жазылым қажет болуы мүмкін.')=>({title,url:'https://kitap.kz/books/'+slug,format:'Кітапхана',note,verification:'Атауы мен авторы каталогта салыстырылды; жабық мәтін толық тексерілген жоқ.'});
  const text=(url,title,format='Мәтін',note='Мәтін дереккөздің сайтында ашылады.')=>({url,title,format,note,verification:'Мәтіні бар бет ашылып тексерілді. Академиялық басылыммен жолма-жол салыстыру жүргізілген жоқ.'});
  const rows={
    ertostik:{mode:'local-full',note:'Сайтта дереккөздегі ертегі нұсқасының толық мәтіні бар.',sources:[]},
    alpan:{mode:'local-excerpt',note:'Сайтта пайдаланушы берген үзінді ғана бар. Толық кітапты сыртқы кітапханадан ашуға болады.',sources:[book('ulpan','Kitap.kz — Ұлпан')]},
    'kar-kyzy':{mode:'local-excerpt',note:'Пайдаланушы ұсынған үзінді сайттың ішінде оқылады. Толық шығарма ретінде белгіленбейді.',sources:[]},
    kozy:{note:'Халық жырының Бейсенбай Жылқайдаров нұсқасы. Драмалық шығарма емес; жыр нұсқаларының айырмашылығын ескеріңіз.',sources:[book('qozy-korpesh-bayan-sulu-bejsenbaj-nusqasy','Kitap.kz — Қозы Көрпеш – Баян сұлу. Бейсенбай нұсқасы','Каталогта тегін аудионұсқа көрсетілген. Мәтіннің қолжетімділігі бөлек тексерілуі тиіс.')]},
    zhabaiy:{sources:[book('zhabajy-alma','Kitap.kz — Жабайы алма')]},
    kokserak:{note:'Тікелей мәтіннің ескі PDF сілтемесі 404 қатесін берді, сондықтан қосылмады. Қазір расталған аудионұсқа ұсынылады.',sources:[{...book('kokserek','Kitap.kz — Көксерек'),format:'Аудио'}]},
    ashkan:{sources:[book('ushqan-uya','Kitap.kz — Ұшқан ұя')]},
    akbilek:{sources:[book('aqbilek','Kitap.kz — Ақбілек')]},
    zhusan:{sources:[book('zhusan-iisi','Kitap.kz — Жусан иісі')]},
    balalyk:{sources:[book('balalyq-shaqqa-sayaxat','Kitap.kz — Балалық шаққа саяхат')]},
    kan:{note:'Трилогияның үш кітабы бөлек берілген.',sources:[book('qan-men-ter-i-kitap','Қан мен тер — I кітап'),book('qan-men-ter-ii-kitap','Қан мен тер — II кітап'),book('fgkjbvskfjvb2462','Қан мен тер — III кітап')]},
    aiqai:{mode:'pending',note:'«Айқай» повесінің сенімді ашық толық мәтіні әзірге табылмады. Талдау мақалалары мен кездейсоқ жүктелген файлдар түпнұсқа орнына берілмейді. Мәтінді немесе баспа рұқсатын ұсынсаңыз, ішкі оқу бөліміне қосуға болады.',sources:[]},
    qyzyl:{note:'Расталған толық аудиожазба мен IV–V кітаптардың каталог беттері берілген. I–III кітаптардың мәтін сілтемелері әлі нақтылануда.',sources:[{...book('muxtar-auezov-qyzyl-jebe-audio','Қызыл жебе — аудиокітап (Шерхан Мұртаза)'),format:'Аудио'},book('qyzyl-zhebe-iv-kitap','Қызыл жебе — IV кітап'),book('qyzyl-zhebe-v-kitap','Қызыл жебе — V кітап')]},
    'batyr-bayan':{sources:[text('https://madeniportal.kz/literature/magzan-zumabaev-batyr-baian-poema1','Мәдениет порталы — Батыр Баян')]},
    'aqqular-uiyqtaganda':{sources:[text('https://adebiportal.kz/upload/iblock/f3c/f3c760ab00f0d53db65cb890971b1bdd.pdf','Әдебиет порталы — Аққулар ұйықтағанда','PDF','14 беттік PDF. Сыртқы сайтта ашылады; файл осы сайтқа көшірілген жоқ.')]},
    qaragoz:{note:'Әуезов драмасының I нұсқасы. Өзге редакцияларымен айырмашылық болуы мүмкін.',sources:[book('qaragoz-i-nusqa','Kitap.kz — Қарагөз. I нұсқа')]},
    'qulager-poem':{sources:[text('https://adebiportal.kz/kz/news/view/iliias-zansugirov-qulager-poema__1077','Әдебиет порталы — Құлагер (поэма)')]}
  };
  window.LITERARY_READING_SOURCES=Object.freeze(Object.fromEntries(Object.entries(rows).map(([id,row])=>[id,{mode:'external',checkedAt:'2026-10-21',...row}])));
})();
