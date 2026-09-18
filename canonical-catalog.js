// Compatibility view of the central verified database. No second metadata copy is maintained here.
const CANONICAL_CATALOG=Object.freeze(Object.fromEntries(Object.values(window.VERIFIED_LITERARY_DATA||{}).map(work=>[work.id,Object.freeze({
  workId:work.id,title:work.title,author:work.author,authorType:work.authorType,genre:work.genre,period:work.period,
  verificationStatus:work.verificationStatus,
  sourceNotes:work.verificationStatus==='VERIFIED'?'Негізгі әдеби дерек тексерілген.':'Жанр, нұсқа немесе шығарма аясына қатысты ескерту бар.',
  sourceUrl:work.sources?.[0]?.url||''
})])));
// Ескі интерфейс бір ғана works массивін пайдаланатындықтан, канондық метадерек оған тек оқуға арналған түрде көшіріледі.
if(typeof works!=='undefined') works.forEach(w=>{let c=CANONICAL_CATALOG[w.id];if(c){w.title=c.title;w.author=c.author;w.genre=c.genre;w.period=c.period;w.verificationStatus=c.verificationStatus;w.sourceNotes=c.sourceNotes;}});
// Пайдаланушы ұсынған кеңейтілген дерек базасы UI-дің негізгі массивімен ID-алиастар арқылы байланыстырылды.
// Ол автоматты түрде VERIFIED мәртебесін алмайды: фактіні жариялау үшін бөлек дереккөзбен тексеру қажет.
const PROVIDED_ID_ALIASES=Object.freeze({alpan:'ulpan','kar-kyzy':'qar-qyzy',kozy:'qozy-korpesh-bayan-sulu',zhabaiy:'zhabaiy-alma',kokserak:'kokserak',ashkan:'ushqan-uya',ertostik:'er-tostik',zhusan:'zhusan-iisi',balalyk:'balalyk-shakka-sayahat',kan:'qan-men-ter',qyzyl:'qyzyl-zhebe'});
const PROVIDED_WORK_INDEX=Object.freeze(Object.fromEntries((window.providedLiteraryWorks||[]).map(x=>[x.id,Object.freeze(x)])));
if(typeof works!=='undefined') works.forEach(w=>{let supplied=PROVIDED_WORK_INDEX[PROVIDED_ID_ALIASES[w.id]||w.id];if(supplied){w.legacySuppliedModule=supplied;w.providedDataStatus='UNVERIFIED_IMPORTED_NOT_PUBLISHED';}});
