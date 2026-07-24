// ── 전역 상태 ──────────────────────────────────────────
let weatherMode = localStorage.getItem('weatherMode') || 'drought';

// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════

// 페이지 로드 시 자동 실행

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // 1. Google Sheets 데이터 로드
    const success = await initializeGoogleSheets();
    
    // 2. SVG 라이브러리 로드
    await loadSVGLibrary();
    
    // 3. 설정 데이터 로드 (MONTHLY_SCHEDULE, allPlants 등)
    await loadConfigData();
    
    if (success) {
      console.log('✅ Google Sheets 데이터 로드 완료');
    } else {
      console.warn('⚠️ Google Sheets 로드 중 일부 데이터를 localhost에서 복원함');
    }
  } catch (err) {
    console.error('❌ 초기화 실패:', err);
  }
});

function toggleHeader() {
  const header = document.getElementById('mainHeader');
  const btn = document.getElementById('headerToggleBtn');
  
  header.classList.toggle('collapsed');
  
  if (header.classList.contains('collapsed')) {
    btn.innerText = '🔽';
  } else {
    btn.innerText = '🔼';
  }
}

// 문서 ID를 안전하게 변환 (슬래시, 공백 제거)
const toDocId = str => String(str).replace(/[\/\s\.]/g,'_').slice(0,100);

function startRealtimeSync() {
  console.log('✅ 실시간 동기화 스킵 (Google Sheets 사용)');
}

// MONTHLY_SCHEDULE은 Google Sheets에서 로드됨

// ══════════════════════════════════════════════════════════
// 농약·비료 통합 DB — 내 과수원 작물 기준 (~1MB)
// 화성시 새솔동 · 유실수15종 + 밭작물 기반
// ══════════════════════════════════════════════════════════

const SUPPLY_DB = {

// ── 비료 DB ──────────────────────────────────────────────
fertilizers: [
  // ① 농협 보유 5종
  {id:'f01',name:'단한번비료',type:'비료',npk:'N22-P9-K9',form:'완효성 기비',
   feature:'한 번 시용으로 1작기 전체 · 코팅 질소 서방출',
   crops:['수박','참외','오이','호박','고구마','감자','배추','무','콩','옥수수'],
   months:[3,4,5],timing:'정식·파종 1주 전 기비',
   amount:'10a당 40~60kg (3.3㎡당 130~200g)',
   caution:'추비 불필요 · 뿌리 직접 접촉 금지',
   priority:1},
  {id:'f02',name:'엔케이플러스',type:'비료',npk:'N17-P0-K17',form:'착과추비',
   feature:'인산 없음 — 착과·과실 비대기 전용',
   crops:['사과','살구','대추','감나무','모과','헤이즐넛','앵두','마르멜로',
          '블랙베리','복분자','오디','으름','다래','무화과',
          '수박','참외','마늘','양파','콩'],
   months:[4,5,6,7,8,9],timing:'발아·착과 확인 후 ~ 과실 비대기',
   amount:'과수 주당 30~50g · 채소 10a당 20kg',
   caution:'기비 단독 사용 금지 · 인산 별도 보충',
   priority:1},
  {id:'f03',name:'원예맞춤고추비료',type:'비료',npk:'N12-P6-K12+Ca·Mg',form:'과실비대',
   feature:'칼슘·마그네슘 포함 — 착색·내병성·열과 방지',
   crops:['수박','참외','오이','호박','사과','살구','무화과','고추'],
   months:[5,6,7,8],timing:'착과 후 ~ 수확 전 2~3회 분시',
   amount:'포기당 20~30g · 3.3㎡당 100g',
   caution:'고온 건조시 금지 · 비 전날 시용 권장',
   priority:1},
  {id:'f04',name:'일회만비료',type:'비료',npk:'N21-P9-K9',form:'완효성 기비',
   feature:'코팅 3~4개월 지속 · 단기채소 전용',
   crops:['배추','무','감자','고구마','양파','마늘','선비잡이콩','머루콩','동부','파','옥수수'],
   months:[3,4,8,9,10],timing:'파종·정식 전 기비 1회',
   amount:'10a당 40~50kg · 3.3㎡당 160~200g',
   caution:'과채류 장기재배 부적합 · 추비 불필요',
   priority:2},
  {id:'f05',name:'슈퍼복합비료',type:'비료',npk:'N21-P17-K17',form:'범용 기비·추비',
   feature:'질소·인산·칼리 균형 — 과수·채소 전용',
   crops:['사과','살구','대추','감나무','모과','헤이즐넛','앵두','마르멜로',
          '오디','으름','다래','머루포도','바이오체리',
          '수박','참외','오이','호박','배추','무','감자','고구마','양파','마늘'],
   months:[3,4,5,8,9,10,11],timing:'기비: 파종 전 / 추비: 생육 중기',
   amount:'기비 10a당 30~40kg · 추비 포기당 10~20g',
   caution:'⚠ 블루베리 절대 금지(pH 상승) · 과다시 염류 집적',
   priority:3},

  // ② 추가 비료 (유기·산성·기타)
  {id:'f06',name:'황산암모늄(유안)',type:'비료',npk:'N21 (황산형)',form:'산성 질소비료',
   feature:'토양 산성화 — 블루베리 pH 4.5~5.5 유지 필수',
   crops:['블루베리'],
   months:[3,4,5,6],timing:'4~6월 생육기 2~3회 분시',
   amount:'주당 30~50g',
   caution:'pH 계속 모니터링 · 일반 작물 과용 금지',
   priority:1},
  {id:'f07',name:'피트모스',type:'기타',npk:'-',form:'토양 개량',
   feature:'pH 낮춤 · 보수력 향상 — 블루베리 전용 토양 조성',
   crops:['블루베리'],
   months:[2,3,10],timing:'식재 전 토양 개량',
   amount:'식재 구덩이 30% 혼합',
   caution:'한번 조성 후 3~5년 효과',
   priority:1},
  {id:'f08',name:'완숙 퇴비',type:'비료',npk:'N1-P1-K1 유기',form:'유기질 기비',
   feature:'토양 미생물·유기물 보충 · 장기적 토양 개선',
   crops:['사과','살구','대추','감나무','모과','헤이즐넛','앵두',
          '오디','으름','다래','블랙베리','복분자','무화과',
          '수박','참외','오이','호박','배추','감자','고구마'],
   months:[11,2,3],timing:'낙엽 후 또는 파종 2~3주 전',
   amount:'과수 주당 5~10kg · 채소 10a당 2,000kg',
   caution:'미숙 퇴비 사용 금지 — 가스 피해',
   priority:2},
  {id:'f09',name:'고토석회',type:'비료',npk:'Ca·Mg',form:'토양 pH 교정',
   feature:'산성 토양 중화 · 칼슘·마그네슘 보충',
   crops:['배추','무','감자','양파','마늘','파','콩','옥수수'],
   months:[7,8],timing:'파종·정식 2~3주 전',
   amount:'10a당 150~200kg (3.3㎡당 500g)',
   caution:'석회 후 2주 이내 파종·시비 금지',
   priority:2},
  {id:'f10',name:'붕산(붕소)',type:'비료',npk:'B 17%',form:'미량원소 엽면시비',
   feature:'개화·결실 향상 — 낙과·기형과 방지',
   crops:['사과','살구','배','감나무','모과','다래','으름'],
   months:[4],timing:'개화 3~5일 전 엽면살포',
   amount:'0.3% 수용액 엽면 살포',
   caution:'개화 중 살포 절대 금지 · 과용시 약해',
   priority:1},
  {id:'f11',name:'황산칼륨',type:'비료',npk:'K2O 50%',form:'칼리 추비',
   feature:'염화물 없음 — 과실 당도·착색 향상',
   crops:['사과','살구','블랙베리','복분자','수박','참외','블루베리'],
   months:[8,9],timing:'과실 성숙기 1~2회',
   amount:'주당 30~80g',
   caution:'염화칼륨 대체 사용 · 블루베리 소량만',
   priority:2},
  {id:'f12',name:'염화칼슘(칼슘)',type:'비료',npk:'Ca 36%',form:'엽면시비',
   feature:'사과 고두병·열과·배꼽썩음병 예방',
   crops:['사과','살구','수박','참외'],
   months:[6,7],timing:'적과 후 2~3회 반복 엽면시비',
   amount:'0.3~0.5% 수용액',
   caution:'고온 한낮 살포 금지 — 약해',
   priority:2},
],

// ── 농약 DB ───────────────────────────────────────────────
pesticides: [
  // 살균제
  {id:'p01',name:'리도밀골드수화제',type:'농약',ingredient:'메탈락실+만코제브',
   target:'역병·노균병',form:'수화제',
   crops:['수박','참외','오이','호박','감자','고구마','포도'],
   months:[6,7,8],timing:'장마 직전 예방 · 발병 초기',
   amount:'1,000배 희석 · 10a당 100~150L',
   interval:7,preharvest:7,
   caution:'수확 7일 전 중지 · 동일 계통 연용 금지',
   priority:1},
  {id:'p02',name:'로브랄수화제',type:'농약',ingredient:'이프로디온',
   target:'탄저병·회색곰팡이',form:'수화제',
   crops:['블랙베리','복분자','블루베리','사과','살구','포도','오이'],
   months:[5,6,7,8],timing:'발병 초기 · 수확 전',
   amount:'1,000배 · 7~10일 간격',
   interval:7,preharvest:7,
   caution:'동일 계통 연용 금지 · 저항성 관리',
   priority:1},
  {id:'p03',name:'실바코액상수화제',type:'농약',ingredient:'테부코나졸',
   target:'탄저병·흰가루병',form:'액상수화제',
   crops:['사과','살구','다래','으름','수박','참외'],
   months:[5,6,7,8],timing:'발병 초기',
   amount:'2,000배',
   interval:10,preharvest:14,
   caution:'수확 14일 전 중지',
   priority:2},
  {id:'p04',name:'훼나리몰수화제',type:'농약',ingredient:'훼나리몰',
   target:'흰가루병',form:'수화제',
   crops:['사과','살구','다래','수박','참외','오이','호박'],
   months:[4,5,6,9,10],timing:'발병 초기 또는 예방',
   amount:'3,000배',
   interval:7,preharvest:7,
   caution:'고온기 사용 주의',
   priority:2},
  {id:'p05',name:'플린트수화제',type:'농약',ingredient:'트리플록시스트로빈',
   target:'흰가루병·탄저병',form:'수화제',
   crops:['수박','참외','오이','사과','포도'],
   months:[5,6,7],timing:'발병 초기',
   amount:'3,000배',
   interval:7,preharvest:5,
   caution:'동일 계통 연용 금지',
   priority:2},
  {id:'p06',name:'스위치입상수화제',type:'농약',ingredient:'사이프로디닐+플루디옥소닐',
   target:'회색곰팡이·흑성병',form:'입상수화제',
   crops:['블랙베리','복분자','블루베리','사과','살구','딸기'],
   months:[4,5,6,9,10],timing:'발병 초기',
   amount:'1,000배',
   interval:7,preharvest:3,
   caution:'수확 3일 전 중지',
   priority:1},
  {id:'p07',name:'알리에테수화제',type:'농약',ingredient:'포세틸알루미늄',
   target:'역병 예방',form:'수화제',
   crops:['수박','참외','오이','포도','다래'],
   months:[5,6,7],timing:'예방 위주 · 장마 전',
   amount:'500배',
   interval:7,preharvest:7,
   caution:'친환경 인증 가능 품목 확인',
   priority:2},
  {id:'p08',name:'코사이드수화제',type:'농약',ingredient:'수산화동(구리)',
   target:'세균병·역병·탄저병 예방',form:'수화제',
   crops:['사과','살구','배','대추','모과','감나무','헤이즐넛','앵두','마르멜로'],
   months:[3,4,10,11],timing:'발아 전·낙엽 후 전정 후',
   amount:'600~1,000배',
   interval:14,preharvest:21,
   caution:'철제 농기구와 혼용 금지 · 동 과잉 축적 주의',
   priority:2},

  // 살충제
  {id:'p09',name:'코니도수화제',type:'농약',ingredient:'이미다클로프리드',
   target:'진딧물·가루이·총채벌레',form:'수화제',
   crops:['사과','살구','대추','매실','수박','참외','오이','배추','다래','으름'],
   months:[4,5,6,9],timing:'발생 초기',
   amount:'2,000배',
   interval:7,preharvest:14,
   caution:'꿀벌 독성 — 개화기 절대 금지 · 수확 14일 전 중지',
   priority:1},
  {id:'p10',name:'가우초수화제',type:'농약',ingredient:'이미다클로프리드',
   target:'진딧물·굴파리',form:'수화제',
   crops:['사과','배추','감자','고구마'],
   months:[4,5,9],timing:'발생 초기',
   amount:'2,000배',
   interval:7,preharvest:14,
   caution:'코니도와 동일 성분 — 교호 사용',
   priority:2},
  {id:'p11',name:'모스피란수화제',type:'농약',ingredient:'아세타미프리드',
   target:'진딧물·응애·굴파리',form:'수화제',
   crops:['사과','살구','배','감나무','대추','배추','무','마늘','양파'],
   months:[4,5,6,9,10],timing:'발생 초기 · 코니도 저항성 발생시',
   amount:'2,000배',
   interval:7,preharvest:7,
   caution:'꿀벌 독성 주의 · 개화기 금지',
   priority:1},
  {id:'p12',name:'밀베녹수화제',type:'농약',ingredient:'밀베멕틴',
   target:'응애',form:'수화제',
   crops:['사과','살구','오이','수박','참외','호박','다래'],
   months:[6,7,8],timing:'응애 발생 초기 · 고온건조기',
   amount:'1,500배',
   interval:7,preharvest:7,
   caution:'저항성 발생 — 동일 약제 연용 금지 · 로테이션',
   priority:1},
  {id:'p13',name:'렘페이지액상수화제',type:'농약',ingredient:'클로르페나피르',
   target:'응애·나방',form:'액상수화제',
   crops:['사과','살구','수박','참외','오이','콩'],
   months:[6,7,8],timing:'응애 밀도 높을 때 · 밀베녹 저항성',
   amount:'1,000배',
   interval:7,preharvest:7,
   caution:'어류 독성 강함 — 수계 유입 금지',
   priority:2},
  {id:'p14',name:'트레본유제',type:'농약',ingredient:'에토펜프록스',
   target:'노린재·나방류',form:'유제',
   crops:['콩','수박','사과','머루포도','복숭아'],
   months:[7,8,9],timing:'저녁 방제 권장',
   amount:'1,000배',
   interval:7,preharvest:7,
   caution:'어류 독성 강함 · 수계 오염 주의',
   priority:1},
  {id:'p15',name:'카라테수화제',type:'농약',ingredient:'람다사이할로트린',
   target:'나방·노린재·진딧물',form:'수화제',
   crops:['사과','살구','배추','콩','양파'],
   months:[5,6,7,8,9],timing:'발생 초기',
   amount:'1,000배',
   interval:7,preharvest:7,
   caution:'꿀벌 독성 — 개화기 금지',
   priority:2},
  {id:'p16',name:'다이아톤유제',type:'농약',ingredient:'디아지논',
   target:'복숭아심식나방·굴파리',form:'유제',
   crops:['사과','살구','복숭아'],
   months:[6,7],timing:'6월 초순 1세대 방제',
   amount:'1,000배',
   interval:10,preharvest:14,
   caution:'수확 14일 전 중지',
   priority:2},
  {id:'p17',name:'더스반유제',type:'농약',ingredient:'클로르피리포스',
   target:'심식나방·굼벵이(토양)',form:'유제',
   crops:['사과','살구'],
   months:[5,6],timing:'토양 해충 방제',
   amount:'토양 처리 1,000배',
   interval:14,preharvest:21,
   caution:'수확 21일 전 중지 · 지하수 오염 주의',
   priority:3},
  {id:'p18',name:'인사이터액상수화제',type:'농약',ingredient:'페녹시카브',
   target:'응애 알·깍지벌레',form:'액상수화제',
   crops:['사과','살구','블랙베리','다래'],
   months:[3,4],timing:'발아 전 · 월동 해충',
   amount:'1,000배',
   interval:14,preharvest:14,
   caution:'발아 후 사용 주의',
   priority:3},

  // 친환경
  {id:'e01',name:'석회유황합제',type:'친환경',ingredient:'황화칼슘',
   target:'응애알·깍지벌레·흰가루병 예방',form:'액제',
   crops:['사과','살구','배','대추','감나무','모과','헤이즐넛','앵두',
          '오디','다래','으름','블랙베리','무화과'],
   months:[2,3,11],timing:'발아 전(2~3월) · 낙엽 후(11월)',
   amount:'5~7배 희석 (발아 전)',
   interval:30,preharvest:60,
   caution:'개화 직전 사용 절대 금지 · 석회 묻으면 눈 세척',
   priority:1},
  {id:'e02',name:'기계유유제(클린유)',type:'친환경',ingredient:'석유계 광유',
   target:'응애알·깍지벌레·진딧물 월동',form:'유제',
   crops:['사과','살구','배','대추','감나무','모과','헤이즐넛','앵두',
          '오디','다래','으름','블랙베리','복분자','무화과','포도'],
   months:[2,3,11],timing:'발아 전 · 낙엽 후',
   amount:'20~25배 희석',
   interval:30,preharvest:60,
   caution:'발아 후 사용 절대 금지 — 약해 심각',
   priority:1},
  {id:'e03',name:'보르도액',type:'친환경',ingredient:'황산구리+생석회',
   target:'세균병·역병·탄저병 예방',form:'혼합액',
   crops:['사과','살구','배','포도','감나무','다래','으름','배추'],
   months:[4,5,10],timing:'예방 위주 · 전정 후',
   amount:'4-4식(황산구리4:생석회4:물100)',
   interval:14,preharvest:21,
   caution:'새 새순 약해 주의 · 금속 부식',
   priority:2},
  {id:'e04',name:'수화유황',type:'친환경',ingredient:'황(S)',
   target:'흰가루병·응애 예방',form:'수화제',
   crops:['사과','살구','포도','수박','오이','참외','호박','다래'],
   months:[4,5,9,10],timing:'발생 초기 · 예방',
   amount:'500~800배',
   interval:7,preharvest:7,
   caution:'고온(32°C↑) 약해 — 서늘한 날 사용',
   priority:2},
  {id:'e05',name:'님오일',type:'친환경',ingredient:'아자디락틴',
   target:'진딧물·응애·나방 초기',form:'유제',
   crops:['수박','참외','오이','배추','사과','살구'],
   months:[4,5,6,9],timing:'발생 초기',
   amount:'500~1,000배',
   interval:5,preharvest:0,
   caution:'고온기 약해 주의 · 직사광선 피해 살포',
   priority:2},
  {id:'e06',name:'톱신페이스트',type:'친환경',ingredient:'티오파네이트메틸',
   target:'전정 절단면 보호·부패 방지',form:'도포제',
   crops:['사과','살구','배','대추','감나무','모과','헤이즐넛','앵두',
          '오디','다래','으름','블랙베리','복분자','무화과','블루베리'],
   months:[2,3,11,12],timing:'전정 즉시 절단면 도포',
   amount:'절단면에 직접 도포',
   interval:0,preharvest:0,
   caution:'전정 직후 즉시 사용 — 시간 경과시 효과 없음',
   priority:1},
],

// ── 월별 시비 스케줄 (업로드 파일 기반 완전판) ────────────
fertSchedule: {
  2: [
    {group:'전체 과수·유실수', emoji:'🌳',
     work:'기비 (완효성 비료)',
     detail:'낙엽 후 동면에서 깨어나기 전 — 뿌리 흡수 최적기',
     fertilizer:'단한번비료 또는 일회만비료',
     nhFert:['단한번비료','슈퍼복합비료'],
     amount:'주당 100~200g (수종별 상이)',
     timing:'2월 초~중 (살구 등 조기 개화종은 2월 초 필수)',
     caution:'살구·앵두 등 조기 개화종 — 2월 초 필수 (고온해 1월말)'},
    {group:'석회유황합제 동계 방제', emoji:'🧪',
     work:'발아 전 병해충 방제',
     detail:'응애알·깍지벌레·월동 병원균 사전 제거',
     fertilizer:'석회유황합제 5~7배 희석',
     nhFert:[],
     amount:'수관 전체 골고루',
     timing:'2월 중하순 · 발아 전',
     caution:'개화 시작 후 절대 금지'},
  ],
  3: [
    {group:'살구·앵두·오디·블랙베리', emoji:'🌸',
     work:'NK+ 추비 1차 (발아·개화기)',
     detail:'이른 개화종 — 개화 직후 칼리 보강',
     fertilizer:'엔케이플러스',
     nhFert:['엔케이플러스'],
     amount:'주당 30~50g',
     timing:'3월 초~중 (개화 후 즉시)',
     caution:'개화 중 토양 시비 — 뿌리권 외부에 시용'},
    {group:'블루베리', emoji:'🫐',
     work:'기비 (산성 비료)',
     detail:'pH 4.5~5.5 유지 — 황산암모늄 형태 질소',
     fertilizer:'황산암모늄(유안) + 피트모스',
     nhFert:[],
     amount:'주당 30~50g',
     timing:'3월 초',
     caution:'슈퍼복합비료 절대 사용 금지'},
    {group:'수박·참외·오이·호박 정식 준비', emoji:'🍉',
     work:'기비 밭 준비',
     detail:'정식 2주 전 전층 시비 + 경운',
     fertilizer:'단한번비료 또는 슈퍼복합비료',
     nhFert:['단한번비료','슈퍼복합비료'],
     amount:'10a당 40~60kg',
     timing:'3월 중~하순 (정식 2주 전)',
     caution:'미숙 퇴비 혼용 금지'},
  ],
  4: [
    {group:'사과·배·감나무·대추·모과·헤이즐넛', emoji:'🍎',
     work:'NK+ 추비 (발아기)',
     detail:'발아 확인 후 칼리 질소 공급',
     fertilizer:'엔케이플러스',
     nhFert:['엔케이플러스'],
     amount:'주당 30~50g',
     timing:'4월 발아 확인 후',
     caution:'기온 10°C 이상 확인 후 시용'},
    {group:'사과·살구·배·감나무 붕소 엽면',emoji:'💊',
     work:'붕소 엽면시비 (착과율 향상)',
     detail:'꽃 피기 직전 붕소 살포',
     fertilizer:'붕산 0.3% 수용액',
     nhFert:[],
     amount:'엽면 골고루',
     timing:'개화 3~5일 전',
     caution:'개화 중 살포 절대 금지'},
    {group:'무화과·다래·으름', emoji:'🍈',
     work:'NK+ 추비 (신초 발생기)',
     detail:'새잎 발생 후 질소·칼리 보강',
     fertilizer:'엔케이플러스',
     nhFert:['엔케이플러스'],
     amount:'주당 20~30g',
     timing:'4월 중 신초 5~10cm',
     caution:'질소 과다 금지 — 도장지 유발'},
    {group:'블루베리', emoji:'🫐',
     work:'NK+ 추비 (개화기)',
     detail:'개화 직후 칼리 보강',
     fertilizer:'엔케이플러스 소량',
     nhFert:['엔케이플러스'],
     amount:'주당 20~30g',
     timing:'4월 개화 후',
     caution:'고온해 4월 말로 앞당김 가능'},
  ],
  5: [
    {group:'수박·참외·오이·호박 착과 후', emoji:'🍉',
     work:'착과 후 추비 (칼리 강화)',
     detail:'착과 확인 후 10일 이내 칼리 공급',
     fertilizer:'원예맞춤고추비료 또는 엔케이플러스',
     nhFert:['원예맞춤고추비료','엔케이플러스'],
     amount:'포기당 20~30g',
     timing:'착과 후 7~10일',
     caution:'착과 전 질소 과다 금지 — 착과 불량'},
    {group:'블랙베리·복분자', emoji:'🫐',
     work:'착과기 NK+ 추비',
     detail:'착과 시작 전 칼리 보강',
     fertilizer:'엔케이플러스',
     nhFert:['엔케이플러스'],
     amount:'주당 30~50g',
     timing:'5월 하순 꽃눈 형성기',
     caution:'염화칼륨 사용 금지'},
    {group:'무화과·다래', emoji:'🍈',
     work:'슈퍼복합 착과기 추비',
     detail:'착과 시작 균형 영양 공급',
     fertilizer:'슈퍼복합비료 소량',
     nhFert:['슈퍼복합비료'],
     amount:'주당 50~80g',
     timing:'5월 착과 확인 후',
     caution:'질소 과다 금지'},
    {group:'감자·양파·마늘 수확 준비', emoji:'🥔',
     work:'수확 전 비료 중단',
     detail:'수확 3~4주 전 모든 시비 중단',
     fertilizer:'중단',
     nhFert:[],
     amount:'—',
     timing:'수확 예정일 3~4주 전',
     caution:'지속 시비 시 저장성·품질 저하'},
  ],
  6: [
    {group:'전체 과수 — 장마 전 NK+ 완료', emoji:'🌳',
     work:'장마 전 NK+ 추비 완료 (핵심)',
     detail:'6월 초 장마 전 완료 — 장마 중 시비 금지',
     fertilizer:'엔케이플러스',
     nhFert:['엔케이플러스'],
     amount:'주당 30~50g',
     timing:'6월 1~5일 (장마 전 반드시 완료)',
     caution:'⚠ 6월 10일 이후 장마 시작 시 시비 금지'},
    {group:'사과·살구 칼슘 엽면', emoji:'🍎',
     work:'칼슘 엽면시비 (고두병 예방)',
     detail:'과실 비대기 칼슘 부족 방지',
     fertilizer:'염화칼슘 0.3~0.5% 수용액',
     nhFert:[],
     amount:'엽면 2~3회 반복',
     timing:'6월 중 ~ 7월 중순',
     caution:'고온 한낮 살포 금지'},
    {group:'수박·단호박 수확 전', emoji:'🍉',
     work:'수확 20일 전 시비 중단',
     detail:'당도 향상을 위한 시비 중단',
     fertilizer:'중단',
     nhFert:[],
     amount:'—',
     timing:'수확 예정 20일 전',
     caution:'지속 시비 시 당도 저하'},
  ],
  7: [
    {group:'블랙베리·복분자 수확 후', emoji:'🫐',
     work:'수확 직후 NK+ 추비',
     detail:'이듬해 결과지 확보 — 수확 직후가 적기',
     fertilizer:'엔케이플러스',
     nhFert:['엔케이플러스'],
     amount:'주당 50~80g',
     timing:'수확 종료 직후',
     caution:'질소 과다 시 월동 불량'},
    {group:'무화과 (온실) 고온기', emoji:'🍈',
     work:'고온기 시비 중단',
     detail:'35°C 이상 온실 — 7월 시비 중단',
     fertilizer:'중단',
     nhFert:[],
     amount:'—',
     timing:'낮 최고 32°C 이상 지속 시',
     caution:'8월 소강기 오전 6~8시에만 재개'},
  ],
  8: [
    {group:'사과·헤이즐넛 칼리 추비', emoji:'🍎',
     work:'과실 성숙기 칼리 추비',
     detail:'당도·착색 향상 — 폭염 소강기 이용',
     fertilizer:'슈퍼복합비료 또는 황산칼륨',
     nhFert:['슈퍼복합비료'],
     amount:'주당 50~80g',
     timing:'8월 소강기 오전 8시 이전',
     caution:'폭염 지속 시 시비 금지'},
    {group:'감나무·대추 NK+ 비대기', emoji:'🍑',
     work:'과실 비대기 NK+ 추비',
     detail:'늦개화 수종 — 8월 비대기 핵심',
     fertilizer:'엔케이플러스',
     nhFert:['엔케이플러스'],
     amount:'주당 30~50g',
     timing:'8월 초~중 (소강기 이용)',
     caution:'고온기 — 반드시 오전 8시 이전'},
    {group:'가을 채소 파종 준비 (배추·무·양파·마늘)', emoji:'🥬',
     work:'토양 pH 교정 및 기비',
     detail:'고토석회 + 완숙퇴비 전층 혼화',
     fertilizer:'고토석회 + 완숙퇴비',
     nhFert:['일회만비료'],
     amount:'고토석회 10a당 150kg · 퇴비 2,000kg',
     timing:'8월 중순 (파종 2~3주 전)',
     caution:'석회 후 2주 이내 파종 금지'},
  ],
  9: [
    {group:'마늘·양파 기비', emoji:'🧄',
     work:'파종·정식 기비',
     detail:'밭 전면 살포 후 경운 혼화',
     fertilizer:'일회만비료 또는 슈퍼복합비료',
     nhFert:['일회만비료','슈퍼복합비료'],
     amount:'퇴비 2kg/㎡ · 복합비료 80g/㎡',
     timing:'파종·정식 7~10일 전',
     caution:'질소 과다 시 구 비대 불량'},
    {group:'배추·김장무 추비', emoji:'🥬',
     work:'정식 후 NK+ 추비',
     detail:'활착 후 생육 촉진',
     fertilizer:'엔케이플러스',
     nhFert:['엔케이플러스'],
     amount:'포기당 10~15g',
     timing:'정식 2주 후 ~ 결구 전',
     caution:'결구기 질소 과다 시 속잎 썩음'},
    {group:'무화과 2기작 NK+', emoji:'🍈',
     work:'2기작 과실 비대기',
     detail:'9월 2기작 착과 후 NK+ 보강',
     fertilizer:'엔케이플러스',
     nhFert:['엔케이플러스'],
     amount:'주당 20~30g',
     timing:'9월 착과 확인 후',
     caution:'10월 이후 시비 금지 — 월동 준비'},
  ],
  10: [
    {group:'전체 과수 가을 기비 준비', emoji:'🌳',
     work:'인산·칼리 공급 (낙엽 전)',
     detail:'낙엽 전 뿌리 흡수 극대화',
     fertilizer:'슈퍼복합비료 소량',
     nhFert:['슈퍼복합비료'],
     amount:'주당 50~100g',
     timing:'10월 중순 낙엽 전',
     caution:'질소 금지 — 월동 불량 원인'},
    {group:'헤이즐넛 수확 후 추비', emoji:'🌰',
     work:'수확 직후 추비',
     detail:'이듬해 결실 준비',
     fertilizer:'슈퍼복합비료',
     nhFert:['슈퍼복합비료'],
     amount:'주당 100~150g',
     timing:'수확 종료 직후',
     caution:''},
  ],
  11: [
    {group:'전체 과수 유기질 기비', emoji:'🌳',
     work:'완숙 퇴비 기비',
     detail:'낙엽 완료 후 ~ 토양 동결 전',
     fertilizer:'완숙 퇴비',
     nhFert:[],
     amount:'주당 5~10kg 수관 하부',
     timing:'11월 낙엽 완료 후',
     caution:'미숙 퇴비 금지'},
    {group:'마늘·양파 월동 비료', emoji:'🧄',
     work:'월동 준비 소량 시비',
     detail:'동해 방지 · 이른 봄 생육 준비',
     fertilizer:'슈퍼복합비료 소량',
     nhFert:['슈퍼복합비료'],
     amount:'20g/㎡ 표면 시용',
     timing:'11월 하순 본격 동결 전',
     caution:'과다 시 동해 심화'},
    {group:'동계 방제 준비', emoji:'🧪',
     work:'석회유황합제·기계유 준비',
     detail:'2~3월 발아 전 방제 준비',
     fertilizer:'석회유황합제 + 기계유유제',
     nhFert:[],
     amount:'—',
     timing:'11월 ~ 2월 발아 전',
     caution:''},
  ],
  12: [],
  1: [],
},

// ── 병해충별 방제력 (월별·수종별) ────────────────────────
pestSchedule: {
  2: [
    {target:'월동 해충 전체',pests:['응애알','깍지벌레','진딧물 월동란'],
     crops:['사과','살구','배','대추','감나무','모과','헤이즐넛','앵두','오디','다래','으름','블랙베리','무화과'],
     products:['석회유황합제','기계유유제(클린유)'],
     timing:'발아 전 · 기온 5°C 이상',
     method:'수관 전체 흠뻑 살포'},
  ],
  3: [
    {target:'병해 예방',pests:['흑성병','부란병'],
     crops:['사과','배','살구'],
     products:['코사이드수화제','보르도액'],
     timing:'발아 직전',
     method:'전정 후 절단면 + 수관 살포'},
  ],
  4: [
    {target:'진딧물·총채벌레',pests:['진딧물','총채벌레'],
     crops:['사과','살구','배','다래','으름','수박','참외','오이'],
     products:['코니도수화제','모스피란수화제'],
     timing:'발생 초기 · 개화 전',
     method:'개화 중 절대 금지'},
    {target:'흰가루병 예방',pests:['흰가루병'],
     crops:['사과','살구','오이','수박','참외','호박'],
     products:['훼나리몰수화제','수화유황'],
     timing:'발아 후 신초 발생기',
     method:'7~10일 간격 예방'},
  ],
  5: [
    {target:'진딧물 2차',pests:['진딧물','응애'],
     crops:['사과','살구','다래','으름','배추','양파'],
     products:['모스피란수화제','밀베녹수화제'],
     timing:'발생 초기',
     method:'잎 뒤 꼼꼼히 살포'},
    {target:'역병 예방',pests:['역병','노균병'],
     crops:['수박','참외','오이','호박','감자'],
     products:['리도밀골드수화제','알리에테수화제'],
     timing:'정식 후 활착 확인 후 예방',
     method:'장마 전 예방 위주'},
  ],
  6: [
    {target:'장마 전 긴급 방제',pests:['역병','탄저병','흰가루병'],
     crops:['수박','참외','오이','호박','사과','블랙베리','복분자'],
     products:['리도밀골드수화제','로브랄수화제','플린트수화제'],
     timing:'6월 1~5일 (장마 전 반드시)',
     method:'살균제+살충제 동시 방제'},
    {target:'심식나방 1세대',pests:['복숭아심식나방'],
     crops:['사과','살구'],
     products:['다이아톤유제'],
     timing:'6월 초순',
     method:'봉지 씌우기 병행'},
  ],
  7: [
    {target:'장마 후 긴급 방제',pests:['역병','탄저병'],
     crops:['수박','참외','오이','호박'],
     products:['리도밀골드수화제','로브랄수화제'],
     timing:'맑아진 후 24시간 내',
     method:'비 맞은 잎 건조 후 살포'},
    {target:'응애 성수기',pests:['점박이응애','차응애'],
     crops:['사과','살구','오이','수박','참외'],
     products:['밀베녹수화제','렘페이지액상수화제'],
     timing:'고온건조기 주 1회',
     method:'잎 뒤 꼼꼼히 · 로테이션'},
    {target:'노린재',pests:['갈색날개노린재','썩덩나무노린재'],
     crops:['콩','수박','사과'],
     products:['트레본유제','카라테수화제'],
     timing:'7월 이동 시작',
     method:'저녁 방제 · 방충망 설치'},
  ],
  8: [
    {target:'탄저병·회색곰팡이',pests:['탄저병','회색곰팡이'],
     crops:['수박','살구','블랙베리','포도'],
     products:['로브랄수화제','스위치입상수화제'],
     timing:'수확 전',
     method:'수확 3~7일 전 최종 방제'},
    {target:'응애·노린재 최성기',pests:['응애','노린재'],
     crops:['콩','사과','수박'],
     products:['밀베녹수화제','트레본유제'],
     timing:'폭염 소강기 저녁',
     method:'고온 한낮 방제 금지'},
  ],
  9: [
    {target:'가을 진딧물',pests:['복숭아혹진딧물','목화진딧물'],
     crops:['사과','배추','양파','마늘'],
     products:['모스피란수화제','코니도수화제'],
     timing:'발생 초기',
     method:'2차 발생 — 조기 방제'},
    {target:'흰가루병 2차',pests:['흰가루병'],
     crops:['사과','살구','오이','호박'],
     products:['훼나리몰수화제'],
     timing:'기온 서늘해질 때',
     method:'예방 위주 살포'},
  ],
  10: [
    {target:'낙엽 후 방제',pests:['깍지벌레','월동 병원균'],
     crops:['사과','살구','배','감나무','대추'],
     products:['코사이드수화제','기계유유제(클린유)'],
     timing:'낙엽 70% 이상',
     method:'동계 방제 준비'},
  ],
  11: [
    {target:'월동 준비 방제',pests:['응애알','깍지벌레'],
     crops:['전체 과수'],
     products:['기계유유제(클린유)'],
     timing:'낙엽 완료 후',
     method:'수관 + 줄기 꼼꼼히'},
  ],
},

};

checkedTasks = JSON.parse(localStorage.getItem('checkedTasks') || '{}');

// ══════════════════════════════════════════════════════════
// 농약·비료 통합 DB — 내 과수원 작물 기준 (~1MB)
// 화성시 새솔동 · 유실수15종 + 밭작물 기반

// ── 날짜 상태 (선택 가능) ──────────────────────────────────
let SELECTED_DATE = (() => {
  const saved = localStorage.getItem('selectedDate');
  if (saved) { const d = new Date(saved + 'T00:00:00'); if (!isNaN(d)) return d; }
  const d = new Date(); d.setHours(0,0,0,0); return d;
})();
const REAL_TODAY = (() => { const d = new Date(); d.setHours(0,0,0,0); return d; })();

function getToday()    { return SELECTED_DATE; }
function getMonthNum() { return SELECTED_DATE.getMonth()+1; }
function getDay()      { return SELECTED_DATE.getDate(); }
// ── 날짜 유틸 ─────────────────────────────────────────────
function daysUntil(y, m, d) {
  const target = new Date(y, m-1, d);
  return Math.round((target - SELECTED_DATE) / 86400000);
}
function fmt(d) {
  const days = ['일','월','화','수','목','금','토'];
  return `${d.getMonth()+1}/${d.getDate()}(${days[d.getDay()]})`;
}
function toYMD(d) {
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}`;
}
function isToday(d) {
  return d.getFullYear()===REAL_TODAY.getFullYear()
      && d.getMonth()===REAL_TODAY.getMonth()
      && d.getDate()===REAL_TODAY.getDate();
}

// ── 날짜 선택 기능 ─────────────────────────────────────────

// ── 날짜 이동 (전날·다음날) ────────────────────────────────
function prevDay() {
  const d = new Date(SELECTED_DATE);
  d.setDate(d.getDate() - 1);
  SELECTED_DATE = d;
  localStorage.setItem('selectedDate', toYMD(d));
  renderAll();
}
function nextDay() {
  const d = new Date(SELECTED_DATE);
  d.setDate(d.getDate() + 1);
  SELECTED_DATE = d;
  localStorage.setItem('selectedDate', toYMD(d));
  renderAll();
}

function openDatePicker() {
  const picker = document.getElementById('hiddenDatePicker');
  if (!picker) return;
  picker.value = toYMD(SELECTED_DATE);
  try { picker.showPicker(); } catch(e) { picker.click(); }
}

function onDatePicked(val) {
  if (!val) return;
  const d = new Date(val + 'T00:00:00');
  if (isNaN(d)) return;
  SELECTED_DATE = d;
  localStorage.setItem('selectedDate', val);
  renderAll();
}

function goToday() {
  SELECTED_DATE = new Date(); SELECTED_DATE.setHours(0,0,0,0);
  localStorage.removeItem('selectedDate');
  renderAll();
}

function updateDateUI() {
  const dayNames = ['일','월','화','수','목','금','토'];
  const d = SELECTED_DATE;
  const isTd = isToday(d);
  const label = `${d.getFullYear()}.${d.getMonth()+1}.${d.getDate()}(${dayNames[d.getDay()]})`;

  const badge = document.getElementById('todayBadge');
  if (badge) badge.textContent = (isTd ? '오늘 ' : '') + label;

  const lbl = document.getElementById('datePickerLabel');
  if (lbl) lbl.textContent = label + (isTd ? ' (오늘)' : '');

  const titleEl = document.getElementById('todayTitle');
  if (titleEl) titleEl.textContent =
    `${d.getMonth()+1}월 ${d.getDate()}일 ${isTd?'(오늘) ':''}작업 목록`;

  const irangEl = document.getElementById('irangTitle');
  if (irangEl) irangEl.textContent = `${d.getMonth()+1}월 이랑 작물 상태`;
}

// ── 오늘 날짜 배지 ────────────────────────────────────
// 날짜 UI는 updateDateUI()로 초기화

// ── 날씨 모드 ─────────────────────────────────────────
function setWeather(mode) {
  weatherMode = mode;
  localStorage.setItem('weatherMode', mode);
  document.getElementById('btnDrought').classList.toggle('active', mode==='drought');
  document.getElementById('btnNormal').classList.toggle('active', mode==='normal');
  renderAll();
}
// 날씨 모드 초기 UI는 initApp()에서 처리

// ── 작업 데이터 (월별) ───────────────────────────────
// ══════════════════════════════════════════════════════════
// 날짜별 상세 작업 시스템
// 월별 → 날짜 범위별로 구분, 선택 날짜 기준 자동 표시
// ══════════════════════════════════════════════════════════

// 날짜 범위 비교 헬퍼
function inRange(d, m1, d1, m2, d2) {
  const s = d.getMonth()+1, day = d.getDate();
  const from = s*100+day, to_s = m1*100+d1, to_e = m2*100+d2;
  return from >= to_s && from <= to_e;
}
function onDate(d, m, day) {
  return d.getMonth()+1 === m && d.getDate() === day;
}
function afterDate(d, m, day) {
  const s = d.getMonth()+1, dt = d.getDate();
  return s > m || (s === m && dt >= day);
}
function beforeDate(d, m, day) {
  const s = d.getMonth()+1, dt = d.getDate();
  return s < m || (s === m && dt <= day);
}

function getDateTasks(selDate) {
  const m   = selDate.getMonth()+1;
  const day = selDate.getDate();
  const tasks = [];
  const id = (n) => `${m}${String(day).padStart(2,'0')}_${n}`;

  // ── 4월 ─────────────────────────────────────────────────
  if (m === 4) {
    tasks.push({id:id('a1'), name:'다래·으름 덩굴 점검',
      detail:'구조물 클립 20~30cm 간격 확인', loc:'1구역 1이랑', urgent:false});
    tasks.push({id:id('a2'), name:'어수리·곤드레 새순 수확',
      detail:'10·9·8·7·5이랑 묘목 그늘', loc:'2구역 동쪽 이랑', urgent:false});
    tasks.push({id:id('a3'), name:'유실수 개화 상태 점검',
      detail:'살구5종·사과3·매실2 착과 확인', loc:'2구역 5·7·8·9·10이랑', urgent:false});
    if (day >= 10) tasks.push({id:id('a4'), name:'잡초 선제 제거',
      detail:'전체 이랑 초기 잡초 호미로 제거', loc:'전체', urgent:false});
  }

  // ── 5월 ─────────────────────────────────────────────────
  if (m === 5) {
    // 5/1~9: 생강·콩 파종
    if (day <= 9) {
      tasks.push({id:id('s1'), name:'★ 생강 심기',
        detail:'토종10+개량20 · 7이랑 0~9.6m · 30cm 도랑 파기', loc:'2구역 7이랑', urgent:true});
      tasks.push({id:id('s2'), name:'비료·물주기 (생강 정식 후)',
        detail:'퇴비 1kg/㎡ 살포 · 파종 후 30분 이상 충분 관수', loc:'2구역 7이랑', urgent:true});
    }
    // 5/9~10: 모종 정식 주간
    if (day >= 9 && day <= 12) {
      tasks.push({id:id('s3'), name:'★ 수박·단호박 모종 정식',
        detail:'블랙망고수박·애플수박·자몽애플수박·흑피미니꼬꼬마·애플미니꼬꼬마·보우짱단호박·접목수박', loc:'1구역 1이랑 고랑①~⑪', urgent:true});
      tasks.push({id:id('s4'), name:'★ 오이·호박·참외 모종 정식',
        detail:'백다다기오이·쿠카멜론①②·애호박①②·맷돌호박①②·망고참외·꿀참외 기둥유인 설치', loc:'1구역 2이랑', urgent:true});
      tasks.push({id:id('s5'), name:'노지 수박·참외 정식 (2구역)',
        detail:'개구리·베타카로틴·사과참외 / 망고수박①②③ / 접목애플수박① / 복수박①②', loc:'2구역 2·4이랑', urgent:false});
    }
    // 5/10~20: 머루콩 파종 한계
    if (day >= 10 && day <= 20) {
      tasks.push({id:id('s6'), name:'★ 머루콩 파종 (한계일 주의!)',
        detail:`5/10~20 엄수 · 3이랑 직파 · 25cm 간격 · 오늘이 D-${20-day}일`,
        loc:'2구역 3이랑', urgent:true});
    }
    // 5/1~15: 감자 구 비대 관리
    if (day <= 15) {
      tasks.push({id:id('potato1'), name:'🥔 감자 구 비대 관리',
        detail:'꽃 피기 시작 → 꽃 제거(구 비대 집중) · 복토 5~7cm · NK+ 추비', loc:'사이구역 C·D이랑', urgent:false, judge:'ok'});
    }
    // 5/1~31: 감자 역병 예방 (장마 전 필수)
    tasks.push({id:id('potato2'), name:'🥔 감자 역병 예방 방제',
      detail:'리도밀골드수화제(1,000배) · 7~10일 간격 · 5월부터 장마 전 필수', loc:'사이구역 C·D이랑', urgent:false, judge:'pest'});
    // 5/1~20: 땅콩 파종 준비
    if (day <= 20) {
      tasks.push({id:id('peanut1'), name:'🥜 땅콩 파종 준비 (5월 중순)',
        detail:'지온 15°C 이상 확인 · 두둑 높이 10~15cm · 파종 간격 25~30cm · 껍질 벗긴 종자 준비', loc:'2구역 빈 이랑', urgent:false, judge:'ok'});
    }
    // 5/13~19: 고구마 모종
    if (day >= 13 && day <= 19) {
      tasks.push({id:id('s7'), name:'🍠 고구마 모종 정식',
        detail:'흐린날·저녁 정식 권장 · 활착률↑ · 두둑 높이 30cm 이상 필수 · 모종 30cm 간격 비스듬히 꽂기', loc:'사이구역 A·B이랑', urgent:false});
    }
    // 5/15~31: 땅콩 파종
    if (day >= 15) {
      tasks.push({id:id('peanut2'), name:'🥜 땅콩 파종 (지온 15°C 이상)',
        detail:'껍질 벗겨 파종 · 25~30cm 간격 · 3~4cm 깊이 · 파종 후 가볍게 진압 · 두둑 배수 필수', loc:'2구역 빈 이랑', urgent:false, judge:'ok'});
    }
    // 5/25~31: 선비잡이콩 파종
    if (day >= 25) {
      tasks.push({id:id('s8'), name:'★ 선비잡이콩 파종',
        detail:'5/25~6/5 · 1이랑 전체 직파 · 25cm 간격', loc:'2구역 1이랑', urgent:true});
    }
    // 5월 전체: 비료·멀칭·물주기
    tasks.push({id:id('s9'), name:'멀칭 실시',
      detail:`${localStorage.getItem('weatherMode')==='drought'?'★건조대비 비닐멀칭 전면 실시':'비닐멀칭 실시'} · 토양수분 유지`, loc:'파종 이랑', urgent:localStorage.getItem('weatherMode')==='drought'});
    tasks.push({id:id('s10'), name:'물주기',
      detail:`${localStorage.getItem('weatherMode')==='drought'?'★건조·30분 이상 충분 관수':'기본 관수'} · 정식 이랑 우선`, loc:'전체', urgent:false});
  }

  // ── 6월 ─────────────────────────────────────────────────
  if (m === 6) {
    // 6/1~14: 마늘·양파 수확
    if (day <= 14) {
      tasks.push({id:id('j1'), name:'양파 수확',
        detail:'잎 쓰러지면 수확 · 맑은날 연속 2일후', loc:'1구역 3이랑 4~13m', urgent:false});
    }
    if (day >= 15 && day <= 30) {
      tasks.push({id:id('j2'), name:'★ 마늘 수확',
        detail:'맑은날 연속 2일후 수확 · 잎 2/3 갈변 시', loc:'1구역 3이랑 13~22m', urgent:true});
      tasks.push({id:id('j3'), name:'★ 동부 파종 (마늘 수확 즉시)',
        detail:'마늘 수확 당일 or 다음날 즉시 파종 · 4~22m (18m)', loc:'1구역 3이랑', urgent:true});
    }
    // 6월 2주차: 잡초 대규모 제거
    if (day >= 8 && day <= 21) {
      tasks.push({id:id('j4'), name:'★ 장마 전 잡초 대규모 제거',
        detail:'장마 전 선제 제거 필수 · 호미·낫 사용', loc:'전체', urgent:true});
    }
    // 6월 3주차: 병충해 예방
    if (day >= 14 && day <= 21) {
      tasks.push({id:id('j5'), name:`★ 병충해 예방 살포 ${localStorage.getItem('weatherMode')==='normal'?'(장마전 필수)':''}`,
        detail:'살균제 1회 · 역병·탄저병 예방 · 장마 직전', loc:'전체', urgent:localStorage.getItem('weatherMode')==='normal'});
    }
    // 블랙베리 수확
    if (day >= 20) {
      tasks.push({id:id('j6'), name:'블랙베리·앵두 수확 시작',
        detail:'매주 수확 · 7월 중순 최성기', loc:'1구역 2이랑', urgent:false});
    }
    // 수박 착과 절위 관리
    tasks.push({id:id('j7'), name:'수박 순치기 (착과절 관리)',
      detail:'어미줄기 적심 · 아들줄기 2개 유인 · 15~20절 착과', loc:'1구역 1이랑', urgent:false});
    tasks.push({id:id('j8'), name:'참외 손자줄기 순치기',
      detail:'아들줄기 12~15절 적심 → 손자줄기 착과', loc:'1·2구역', urgent:false});
    // 6월: 감자 수확 (장마 전 완료 필수)
    if (day >= 1 && day <= 20) {
      tasks.push({id:id('potato_j1'), name:'🥔 감자 수확 (장마 전 완료 필수!)',
        detail:'잎·줄기 황변 후 맑은날 연속 2일 후 수확 · 수확 후 즉시 그늘 건조 · 6월 중순 전 완료', loc:'사이구역 C·D이랑', urgent:day>=10, judge:day>=10?'urgent':'ok'});
    }
    // 6월: 고구마 덩굴 관리
    tasks.push({id:id('swpotato_j1'), name:'🍠 고구마 덩굴 유인·관리',
      detail:'덩굴 방향 정리 · 과도한 가지덩굴 제거 · 제초 필수 (덩굴 파고들기 전)', loc:'사이구역 A·B이랑', urgent:false, judge:'ok'});
    // 6월: 땅콩 발아·초기 관리
    tasks.push({id:id('peanut_j1'), name:'🥜 땅콩 발아 확인·결주 보식',
      detail:'파종 후 10~14일 발아 확인 · 결주 즉시 보식 · 잡초 제거 (초기 가장 중요)', loc:'2구역 빈 이랑', urgent:false, judge:'ok'});
  }

  // ── 7월 ─────────────────────────────────────────────────
  if (m === 7) {
    // 폭염 경고 (7월 전체)
    tasks.push({id:id('p0'), name:'⚠️ 폭염 주의 — 오전 6~9시만 작업', judge:'warn',
      detail:'33°C↑ 예보시 오전 작업만 · 오후 전면 금지 · 수분 충분히', loc:'전체', urgent:true});

    tasks.push({id:id('p1'), name:'블랙베리·복분자 수확',
      detail:'7월 중순 최성기 · 매주 수확', loc:'1구역 2이랑', urgent:false});
    tasks.push({id:id('p2'), name:'살구 5종 수확',
      detail:'킹코트·하코트(6~7월) · 백살구·B360(6~7월) · 대천황(7월)', loc:'2구역 7·8·9이랑', urgent:false});
    tasks.push({id:id('p3'), name:'오이·쿠카멜론 수확',
      detail:'백다다기오이·쿠카멜론①② · 기둥유인 상태 점검', loc:'1구역 2이랑', urgent:false});
    tasks.push({id:id('p4'), name:'참외 수확',
      detail:'망고참외·꿀참외·개구리참외·베타카로틴참외·사과참외', loc:'1·2구역', urgent:false});
    tasks.push({id:id('p5'), name:'★ 수박 착과 확인·그물망 점검',
      detail:'블랙망고·애플·자몽·흑피·애플미니꼬꼬마×4 · 천장 그물망 · 조류망', loc:'1구역 1이랑', urgent:true});

    // 집중호우 대비
    tasks.push({id:id('p6'), name:`★ ${localStorage.getItem('weatherMode')==='drought'?'집중호우 대비 지지대 보강':'장마중 배수로 점검'}`,
      detail:localStorage.getItem('weatherMode')==='drought'?'덩굴·클립·지주 긴급 보강 · 호우 예보시 전날 실시':'배수로 막힘 확인·제거', loc:'전체', urgent:true});
    tasks.push({id:id('p7'), name:'병충해 방제',
      detail:localStorage.getItem('weatherMode')==='drought'?'호우 직후 24시간 내 살균제 살포':'장마중 역병·탄저병 예방 · 역병약 살포', loc:'전체', urgent:true});
    tasks.push({id:id('p8'), name:'잡초 제거',
      detail:'장마후 급성장 · 수박 이랑 우선', loc:'전체', urgent:false});
    // 7월: 고구마 순 뒤집기·덩굴 관리
    tasks.push({id:id('swpotato_p1'), name:'🍠 고구마 순 뒤집기',
      detail:'장마 후 덩굴이 땅에 닿아 뿌리 내림 방지 · 2주마다 덩굴 들어 돌리기 · 구 비대 집중', loc:'사이구역 A·B이랑', urgent:false, judge:'ok'});
    // 7월: 땅콩 개화·배토
    tasks.push({id:id('peanut_p1'), name:'🥜 땅콩 배토 (꽃 핀 후 필수)',
      detail:'꽃 진 후 자방병(씨방줄기)이 땅 속 파고들 수 있도록 포기 주변 흙 북돋우기 · 2~3cm · 수분 유지', loc:'2구역 빈 이랑', urgent:false, judge:'ok'});
    tasks.push({id:id('peanut_p2'), name:'🥜 땅콩 병해충 점검',
      detail:'갈색무늬병(잎 갈변) · 진딧물 발생 확인 · 장마 후 급증 · 이프로디온 방제', loc:'2구역 빈 이랑', urgent:false, judge:'pest'});
  }

  // ── 8월 ─────────────────────────────────────────────────
  if (m === 8) {
    tasks.push({id:id('ag0'), name:'⚠️ 폭염 — 오전 6~8시·저녁 17~19시만', judge:'warn',
      detail:'8월 연속폭염 · 열사병 위험 · 혼자 작업 특히 주의', loc:'전체', urgent:true});

    if (day <= 19) {
      tasks.push({id:id('ag1'), name:`★ 수박 수확 (8/20전 완료 D-${19-day}일)`,
        detail:'복수박·접목애플수박·망고수박·꼬꼬마수박 전량 수확', loc:'1구역·2구역', urgent:true});
    }
    if (onDate(selDate, 8, 20) || (day >= 18 && day <= 22)) {
      tasks.push({id:id('ag2'), name:'★ 8/20 김장무 파종 (날짜 엄수!)',
        detail:'청수무·모아무 · 4이랑 전체 · 가뭄시 파종 후 2회/일 관수', loc:'2구역 4이랑', urgent:true});
    }
    tasks.push({id:id('ag3'), name:'호박 수확',
      detail:'애호박①②(고랑①⑨) · 맷돌호박①②(고랑⑦⑧) · 착과 후 10~14일', loc:'1구역 2이랑', urgent:false});
    tasks.push({id:id('ag4'), name:'고구마 덩굴 정리',
      detail:'과도한 덩굴 제거 · 구 비대 집중', loc:'사이구역 A·B이랑', urgent:false});
    if (day >= 20) {
      tasks.push({id:id('ag5'), name:'배추 모종 발아 준비',
        detail:'8월 하순 실내 발아 시작 · 9월초 정식 예정', loc:'실내', urgent:false});
    }
    tasks.push({id:id('ag6'), name:'병충해 방제 (노린재)',
      detail:'8월 노린재 급증 · 방제 시기 · 저녁 방제 권장', loc:'전체', urgent:false});
    // 8월: 고구마 덩굴 정리 및 구 비대 집중
    tasks.push({id:id('swpotato_ag1'), name:'🍠 고구마 덩굴 정리 (구 비대 집중)',
      detail:'과도한 덩굴 잘라 제거 · 구 비대 집중 · 수확 3주 전 비료 중단 필수', loc:'사이구역 A·B이랑', urgent:false, judge:'ok'});
    // 8월: 땅콩 결실 관리
    tasks.push({id:id('peanut_ag1'), name:'🥜 땅콩 결실 관리',
      detail:'자방병 땅속 침투 최대기 · 배토 추가 · 건조시 관수 필수 · 수확 준비 (9~10월)', loc:'2구역 빈 이랑', urgent:false, judge:'ok'});
  }

  // ── 9월 ─────────────────────────────────────────────────
  if (m === 9) {
    if (day <= 10) {
      tasks.push({id:id('sp1'), name:'★ 배추 모종 정식',
        detail:'9월초 · C·D이랑 전체', loc:'사이구역 C·D이랑', urgent:true});
    }
    if (day >= 15 && day <= 25) {
      tasks.push({id:id('sp2'), name:'★ 양파 정식 (비온후 2~3일 맑은날 최적)',
        detail:'중만생종 400주 · 6이랑 전체', loc:'2구역 6이랑', urgent:true});
    }
    tasks.push({id:id('sp3'), name:'생강 수확 준비',
      detail:'야간기온 보며 결정 · 서리 전 완료 필수', loc:'2구역 7이랑', urgent:false});
    tasks.push({id:id('sp4'), name:'동부 수확',
      detail:'맑은날 베어 그늘 2~3일 건조', loc:'1구역 3이랑', urgent:false});
    tasks.push({id:id('sp5'), name:'머루포도 수확',
      detail:'9~10월 · 묘목 측 위치', loc:'1구역 3이랑 2~4m', urgent:false});
    tasks.push({id:id('sp6'), name:'가을비료 투입',
      detail:'유실수·다년생 이랑 퇴비', loc:'2구역 전체', urgent:false});
    tasks.push({id:id('sp7'), name:'잡초 제거',
      detail:'가을비 후 급성장 · 양파 정식 전 완료 필수', loc:'전체', urgent:false});
    // 9월: 고구마 수확 준비
    tasks.push({id:id('swpotato_sp1'), name:'🍠 고구마 수확 준비 (10월초)',
      detail:'야간기온 15°C 이하 시 수확 준비 · 시험 굴취 1~2개 확인 · 서리 전 완료 계획 수립', loc:'사이구역 A·B이랑', urgent:false, judge:'ok'});
    // 9월: 땅콩 수확 (9월 하순~10월)
    if (day >= 20) {
      tasks.push({id:id('peanut_sp1'), name:'🥜 땅콩 수확 시작 (9월하순~10월)',
        detail:'잎이 노랗게 변하면 수확 적기 · 시험 수확 1포기로 꼬투리 성숙도 확인 · 뽑아서 2~3일 밭에 건조', loc:'2구역 빈 이랑', urgent:false, judge:'ok'});
    }
  }

  // ── 10월 ─────────────────────────────────────────────────
  if (m === 10) {
    if (day <= 15) {
      tasks.push({id:id('oc1'), name:'★ 고구마 수확 (서리 전 완료)',
        detail:'야간 5°C이하 예보 전주에 완료 · 서리 전 절대 완료', loc:'사이구역 A·B이랑', urgent:true});
    }
    tasks.push({id:id('oc2'), name:'★ 생강 수확 (지온 10°C이하 전)',
      detail:'야간기온 5°C이하 예보시 즉시 수확', loc:'2구역 7이랑', urgent:true});
    if (day <= 10) {
      tasks.push({id:id('oc3'), name:'★ 마늘 파종 (비온후 3~4일 최적)',
        detail:'한지형 · 2이랑+3이랑 13~22m · 남도·의성마늘', loc:'2구역 2이랑+1구역 3이랑', urgent:true});
    }
    tasks.push({id:id('oc4'), name:'머루콩·선비잡이콩 수확',
      detail:'꼬투리 70%이상 마른날 · 맑은날', loc:'2구역 1·3이랑', urgent:false});
    tasks.push({id:id('oc5'), name:'마르멜로·모과 수확 (서리 전)',
      detail:'서리 전 완료 · 10월 중순까지', loc:'2구역 5이랑', urgent:true});
    tasks.push({id:id('oc6'), name:'돌고·아리수 사과 수확',
      detail:'10월 중순~하순', loc:'2구역 10이랑', urgent:false});
    tasks.push({id:id('oc7'), name:'월동 멀칭',
      detail:'다년생 이랑 짚·부직포 피복', loc:'2구역 동쪽 이랑', urgent:false});
    tasks.push({id:id('oc8'), name:'배추 결구 확인',
      detail:'겉잎 묶어주기 · 진딧물 방제', loc:'사이구역 C·D이랑', urgent:false});
  }

  // ── 11월 ─────────────────────────────────────────────────
  if (m === 11) {
    tasks.push({id:id('n1'), name:'선비잡이콩·머루콩 수확 완료',
      detail:'꼬투리 건조 확인 · 저장', loc:'2구역 1·3이랑', urgent:false});
    tasks.push({id:id('n2'), name:'김장무 수확',
      detail:'4이랑 전체 · 김장 준비', loc:'2구역 4이랑', urgent:false});
    tasks.push({id:id('n3'), name:'배추 수확 (11월 중순~)',
      detail:'결구 단단히 된 것부터 수확', loc:'사이구역 C·D이랑', urgent:false});
    tasks.push({id:id('n4'), name:'유실수 전정 준비',
      detail:'전정가위 소독·점검 · 낙엽 후 전정 시작', loc:'2구역 전체', urgent:false});
    tasks.push({id:id('n5'), name:'마늘·양파 월동 관리',
      detail:'짚 피복 · 동해 방지', loc:'2구역 2·6이랑+1구역 3이랑', urgent:false});
  }

  // ── 12월~3월: 동절기 ──────────────────────────────────
  if (m === 12 || m <= 3) {
    tasks.push({id:id('w1'), name:'유실수 전정',
      detail:'낙엽 완료 후 · 배상형·세장방추형 수형 잡기', loc:'2구역 전체', urgent:false});
    tasks.push({id:id('w2'), name:'월동 상태 점검',
      detail:'다년생 피복 상태 · 마늘·양파 생육 확인', loc:'전체', urgent:false});
    if (m === 3) {
      tasks.push({id:id('w3'), name:'봄 준비 — 비료 투입',
        detail:'유기질 퇴비 살포 · 멀칭 준비', loc:'전체', urgent:false});
      tasks.push({id:id('w4'), name:'묘목 구입 계획 수립',
        detail:'4월 정식 묘목 사전 주문', loc:'—', urgent:false});
    }
  }

  // ── 보유 농자재 구입 알림 추가 ──────────────────────────
  if (typeof getSupplyTasksForMonth !== 'undefined') {
    getSupplyTasksForMonth(m, day).forEach(t => tasks.push(t));
  }

  // ── 이달의 시비 작업 자동 추가 ──────────────────────────
  if (typeof myFertSchedule !== 'undefined') {
    const fertsThisMonth = myFertSchedule[m] || [];
    fertsThisMonth.forEach((f, fi) => {
      // 농협 비료 연계: 이 작업에 맞는 비료 찾기
      const nhMatched = [];
      if (typeof nhFertilizers !== 'undefined') {
        for (const [fname, finfo] of Object.entries(nhFertilizers)) {
          if (!finfo.months.includes(m)) continue;
          // 그룹 작물과 교차 확인
          const gWords = f.group.split(/[·,·\s]+/);
          const matched = finfo.crops.some(c =>
            gWords.some(g => g.includes(c.split(' ')[0]) || c.includes(g))
          );
          if (matched) nhMatched.push(fname);
        }
      }
      // 대표 비료 1개 강조 + 나머지 보조 표시
      let nhStr = '';
      if (nhMatched.length) {
        // priority 기준 정렬
        const sortedNh = [...nhMatched].sort((a,b) =>
          (nhFertilizers[a]?.priority||9) - (nhFertilizers[b]?.priority||9)
        );
        const top = sortedNh[0];
        const fi  = nhFertilizers[top];
        const amtShort = fi ? fi.amount.split('·')[0].trim() : '';
        nhStr = `⭐ ${top}(${amtShort})`;
        if (sortedNh.length > 1) {
          const rest = sortedNh.slice(1).join('·');
          nhStr += ` 외 ${sortedNh.length-1}종(${rest})`;
        }
      }
      tasks.push({
        id:     id('fert' + fi),
        name:   '🌱 시비: ' + f.work,
        detail: f.fertilizer + (f.amount !== '—' ? ' · ' + f.amount : '')
                + (f.caution ? ' ⚠ ' + f.caution : ''),
        loc:    f.group,
        urgent: false,
        judge:  'fert',
        timing: f.timing,
        nhFert: nhStr,
      });
    });
  }

  // ── 이달의 주요 병해충 경보 자동 추가 ────────────────────
  if (typeof myPlantPests !== 'undefined') {
    const warned = new Set();
    for (const [group, info] of Object.entries(myPlantPests)) {
      if (!info.peak_months.includes(m)) continue;
      info.pests.forEach((pestName, pi) => {
        if (warned.has(pestName)) return;
        warned.add(pestName);
        const p = (typeof pestDetail !== 'undefined') ? pestDetail[pestName] : null;
        tasks.push({
          id:     id('pest' + pestName.replace(/[^a-z가-힣]/gi,'')),
          name:   '🐛 병해충 주의: ' + pestName,
          detail: p ? p.symptom + ' · 방제: ' + p.control : '이달 발생 주의',
          loc:    info.emoji + ' ' + group,
          urgent: false,
          judge:  'pest',
        });
      });
    }
  }

  // ── SUPPLY_DB 이달 방제 스케줄 ───────────────────────
  if (typeof SUPPLY_DB !== 'undefined') {
    const dbPest = SUPPLY_DB.pestSchedule[m] || [];
    dbPest.forEach((sched, si) => {
      tasks.push({
        id:     id('dbpest_' + si),
        name:   '🧪 방제: ' + sched.target,
        detail: sched.products.join('·') + ' · ' + sched.method,
        loc:    sched.crops.slice(0,3).join('·') + (sched.crops.length>3?' 외':''),
        urgent: false,
        judge:  'pest',
        timing: sched.timing,
      });
    });
  }

  // ── 생육일수 등록 작물 기반 중간 작업 자동 추가 ──────────
  try {
    const _gp = JSON.parse(localStorage.getItem('plants') || '[]');
    _gp.forEach(function(gp) {
      var planted = new Date(gp.dateStr);
      var elapsed = Math.round((selDate - planted) / 86400000);
      var totalDays = gp.totalDays || 120;
      var pinchDay = gp.pinchDay || 0;
      var fruitDay = gp.fruitDay || 0;
      var remaining = totalDays - elapsed;
      var rootCrops = ['감자','고구마','생강','양파','마늘','배추','김장무','열무','무'];
      var isRoot = rootCrops.some(function(r){ return (gp.name||'').includes(r); });
      // 순치기 (D-3~D+5)
      if (pinchDay > 0) {
        var pl = pinchDay - elapsed;
        if (pl >= -3 && pl <= 5) {
          var lbl = gp.name.includes('고구마') ? '덩굴 뒤집기' : '순치기';
          tasks.push({ id:id('gp_p_'+gp.id), name:'🌿 [생육] '+gp.name+' '+lbl+(pl<=0?' — 지금!':' D-'+Math.max(0,pl)+'일'), detail:'심은 후 '+elapsed+'일째 · 위치: '+gp.loc, loc:gp.loc, urgent:pl<=0, judge:pl<=0?'urgent':'warn' });
        }
      }
      // 착과 확인 (D-3~D+7)
      if (fruitDay > 0 && !isRoot) {
        var fl = fruitDay - elapsed;
        if (fl >= -3 && fl <= 7) {
          tasks.push({ id:id('gp_f_'+gp.id), name:'🍉 [생육] '+gp.name+' 착과 확인'+(fl<=0?' — 지금!':' D-'+Math.max(0,fl)+'일'), detail:'착과 후 포기당 1개 남기기 · 위치: '+gp.loc, loc:gp.loc, urgent:fl<=0, judge:fl<=0?'urgent':'ok' });
        }
      }
      // 수확 (D-7~D+14)
      if (remaining >= -14 && remaining <= 7) {
        var hw = gp.name.includes('생강')?'굴취':gp.name.includes('마늘')||gp.name.includes('양파')?'수확·굴취':gp.name.includes('배추')?'결구·수확':'수확';
        tasks.push({ id:id('gp_h_'+gp.id), name:'✂️ [생육] '+gp.name+' '+hw+(remaining<=0?' — 시기!':' D-'+remaining+'일'), detail:'심은 후 '+elapsed+'일째/총 '+totalDays+'일 · 위치: '+gp.loc, loc:gp.loc, urgent:remaining<=0, judge:remaining<=0?'urgent':'warn' });
      }
      // 고구마 북주기
      if (gp.name.includes('고구마')) {
        var cd = Math.round(totalDays*0.35), cl = cd-elapsed;
        if (cl >= -2 && cl <= 5) tasks.push({ id:id('gp_c_'+gp.id), name:'🍠 [생육] '+gp.name+' 북주기 (구비대)', detail:'포기 주변 흙 북돋우기 · 칼륨 추비 · 위치: '+gp.loc, loc:gp.loc, urgent:false, judge:'ok' });
      }
      // 땅콩 배토
      if (gp.name.includes('땅콩')) {
        var bd = Math.round(totalDays*0.40), bl = bd-elapsed;
        if (bl >= -2 && bl <= 5) tasks.push({ id:id('gp_b_'+gp.id), name:'🥜 [생육] '+gp.name+' 배토 (꽃 핀 후)', detail:'자방병 땅속 파고들게 흙 2~3cm 북돋우기 · 위치: '+gp.loc, loc:gp.loc, urgent:false, judge:'ok' });
      }
    });
  } catch(e) {}

  return tasks;
}

// 이 날짜 이번 주 준비사항 (날짜 기반)
function getNextWeekPrep(month) {
  const preps = {
    4: [{name:'수박·오이·호박·참외 모종 구입', detail:'모종 주문 or 농자재마트 방문 · 금요일 미리 구입'}],
    5: [{name:'머루콩 씨앗 확인', detail:'5/10~20 파종 준비'}, {name:'생강 씨생강 구입', detail:'토종10+개량20 · 지온 18°C 확인'}],
    6: [{name:'동부 씨앗 구입', detail:'마늘 수확 후 즉시 파종 · 검정동부 권장'}, {name:'장마 대비 약제 구입', detail:'살균제·살충제 잔량 확인'}],
    7: [{name:'조류망 점검', detail:'수박 그물망 긴장도 확인'}, {name:'병해 약제 준비', detail:'역병·탄저병 살균제'}],
    8: [{name:'배추 모종 발아 준비', detail:'8월 하순 실내 발아'}, {name:'김장무 씨앗 확인', detail:'8/20 파종 준비'}],
    9: [{name:'마늘 씨마늘 구입', detail:'한지형 · 10월 파종 준비'}, {name:'양파 모종 확인', detail:'400주 예약'}],
    10:[{name:'월동 멀칭 자재 준비', detail:'짚·부직포 · 다년생 이랑 피복'}, {name:'전정 도구 점검', detail:'전정가위 소독·날 갈기'}],
    11:[{name:'김장 준비', detail:'무·배추 수확 후 바로 김장'}, {name:'씨앗 저온 보관', detail:'콩류·씨앗 봉투 밀봉 냉장'}],
  };
  return preps[month] || [];
}

function renderTip(month) {
  const tips = {
    5: {title:'5월 핵심 팁', text:'★ 파종 후 멀칭이 수확량을 결정합니다\n건조한 날이 많으면 비닐 or 짚 멀칭 즉시 실시\n고구마 모종은 흐린 날 저녁에 심어야 활착률↑'},
    6: {title:'6월 핵심 팁', text:'장마 전 잡초 대규모 제거가 핵심입니다\n마늘 수확 후 동부는 즉시 파종 (한계일 주의)\n장마 직전 살균제 1회 살포 — 역병 예방'},
    7: {title:'7월 핵심 팁', text:'폭염일 오전 6~9시 작업 후 귀가 원칙\n집중호우 전날 덩굴·지지대 반드시 보강\n수박 착과 후 포기당 1개만 남기기'},
    8: {title:'8월 핵심 팁', text:'8/20 김장무 파종 날짜는 절대 엄수\n수박은 8/20 이전 전량 수확 완료 필수\n폭염 연속 → 오전 6~8시 집중 작업'},
    9: {title:'9월 핵심 팁', text:'양파 정식은 비온 후 2~3일 맑은 날이 최적\n생강은 첫서리 전 수확 — 야간기온 보며 결정\n태풍 예보시 덩굴 보강 후 대피'},
    10: {title:'10월 핵심 팁', text:'고구마·생강은 야간 5°C 이하 전주에 수확\n마늘 파종은 비온 후 3~4일 촉촉할때 최적\n콩류 꼬투리 70%이상 마른날 맑은날 수확'},
  };
  const tip = tips[month];
  const box = document.getElementById('tipBox');
  if (tip) {
    box.innerHTML = `<div class="tip-box"><div class="tip-title">💡 ${tip.title}</div><div class="tip-text">${tip.text.replace(/\n/g,'<br>')}</div></div>`;
  }
}

// ── 오늘 날씨 알림 ────────────────────────────────────────
function renderWeatherAlert() {
  const month = getMonthNum();
  const day   = getDay();
  let alerts  = [];
  const mode  = localStorage.getItem('weatherMode') || 'drought';

  if (month === 5) {
    alerts.push({type:'ok', icon:'☀️', text:'파종·정식 가능 시기', sub:'대기 건조 — 파종 후 물주기 충분히 필수'});
    if (mode === 'drought')
      alerts.push({type:'warn', icon:'⚠️', text:'가뭄형 모드: 관수 2배 권장', sub:'멀칭 즉시 실시 · 파종 후 30분 이상 충분히 관수'});
  } else if (month === 7) {
    alerts.push({type:'danger', icon:'🌧️', text:'7월 집중호우 가능성', sub:'작업 전날 기상청 예보 확인 필수 | 지지대 점검'});
    alerts.push({type:'warn',   icon:'🌡️', text:'폭염 주의 — 오전 6~9시만 작업', sub:'33°C↑ 예보시 오후 작업 금지'});
  } else if (month === 8) {
    alerts.push({type:'danger', icon:'🌡️', text:'8월 연속 폭염 주의', sub:'오전 6~8시·저녁 17~19시만 야외 작업'});
    if (day >= 15 && day <= 22)
      alerts.push({type:'danger', icon:'📅', text:'8/20 김장무 파종 임박', sub:'D-' + daysUntil(2026,8,20) + '일 — 날짜 엄수'});
  } else if (month === 10) {
    alerts.push({type:'warn', icon:'🍂', text:'서리 주의', sub:'야간 0°C↓ 예보시 고구마·생강·모과 긴급 수확'});
  }

  const box = document.getElementById('weatherAlertBox');
  if (!box) return;
  box.innerHTML = alerts.map(a =>
    `<div class="weather-alert alert-${a.type}">
      <div class="alert-icon">${a.icon}</div>
      <div>
        <div class="alert-text">${a.text}</div>
        <div class="alert-sub">${a.sub}</div>
      </div>
    </div>`).join('');
}

// ── 오늘 작업 렌더 (날짜 기반) ────────────────────────────
function renderTasks() {
  const tasks    = getDateTasks(SELECTED_DATE);
  const list     = document.getElementById('taskList');
  const todayKey = toYMD(SELECTED_DATE);
  if (!list) return;

  // 선택 날짜 외 7일 이상 지난 체크 자동 정리
  const cutoff = new Date(SELECTED_DATE);
  cutoff.setDate(cutoff.getDate() - 30); // 30일간 완료 기록 유지
  const cutoffStr = toYMD(cutoff);
  Object.keys(checkedTasks).forEach(k => {
    const datePart = k.substring(0, 10); // YYYY-MM-DD
    if (datePart < cutoffStr) delete checkedTasks[k];
  });
  localStorage.setItem('checkedTasks', JSON.stringify(checkedTasks));

  // 완료된 반복 작업(월 기반) 제외 옵션
  const monthKey = todayKey.slice(0,7);
  const hideDone = localStorage.getItem('hideDoneTasks') === 'true';
  const _wlForTask = JSON.parse(localStorage.getItem('workLog') || '[]');
  const todayStr = toYMD(REAL_TODAY);
  // 오늘 이전에 기록된 작업 이름 목록
  const loggedNames = new Set(_wlForTask.filter(e => e.date < todayStr).map(e => e.name));

  const visibleTasks = tasks.filter(t => {
    const k1 = todayKey + '-' + t.id;
    const k2 = monthKey + '-' + t.id;
    // workLog에 이미 기록된 작업은 숨김 (오늘 제외)
    if (loggedNames.has(t.name)) {
      const todayLogged = workLog.some(e => e.name === t.name && e.date === todayKey);
      if (!todayLogged) return false; // 어제 이전에 기록됐으면 숨김
    }
    // ★ 생육일수에 등록된 작물의 관련 작업은 숨김 ([생육] 태그가 없는 것만 체크)
    if (!t.name.includes('[생육]') && !t.name.includes('🌿 [생육]') && !t.name.includes('🍉 [생육]') && !t.name.includes('✂️ [생육]') && !t.name.includes('🍠 [생육]') && !t.name.includes('🥜 [생육]')) {
      try {
        var _gk = JSON.parse(localStorage.getItem('plants') || '[]').map(function(p){ return p.name.toLowerCase().replace(/[①②③④⑤⑥⑦⑧⑨⑩\s]/g,'').slice(0,4); }).filter(function(k){ return k.length>=2; });
        if (_gk.length > 0) {
          var _tn = t.name.toLowerCase();
          if (_gk.some(function(k){ return _tn.includes(k); })) return false;
        }
      } catch(e) {}
    }
    const isDone = !!(checkedTasks[k1] || checkedTasks[k2]);
    if (hideDone && isDone) return false;
    return true;
  });
  const doneCount = tasks.filter(t => {
    return checkedTasks[todayKey+'-'+t.id] || checkedTasks[monthKey+'-'+t.id];
  }).length;
  list.innerHTML = visibleTasks.map(t => {
    const key  = todayKey + '-' + t.id;
    const monthKey2 = todayKey.slice(0,7);
    const done = checkedTasks[key] || checkedTasks[monthKey2 + '-' + t.id];
    // judge 배지 설정
    const j = t.judge || (t.urgent ? 'urgent' : 'ok');
    const judgeMap = {
      ok:     {label:'✅ 가능',    bg:'#E8F5E9', tc:'#1B5E20'},
      urgent: {label:'⚡ 지금당장', bg:'#FFEBEE', tc:'#C62828'},
      warn:   {label:'⚠️ 주의',   bg:'#FFF3E0', tc:'#E65100'},
      bad:    {label:'❌ 금지',   bg:'#FFEBEE', tc:'#C62828'},
      fert:   {label:'🌱 시비',   bg:'#F1F8E9', tc:'#33691E'},
      pest:   {label:'🐛 병해충', bg:'#FFF8E1', tc:'#E65100'},
    };
    const jd = judgeMap[j] || judgeMap.ok;
    const isPestFert = (j === 'pest' || j === 'fert');
    const linkBtn = isPestFert
      ? `<button onclick="showTab('pest')" style="font-size:10px;background:white;
          border:1px solid ${jd.tc};color:${jd.tc};border-radius:6px;
          padding:2px 8px;cursor:pointer;font-family:inherit;font-weight:600;
          white-space:nowrap;flex-shrink:0">→ 상세</button>`
      : '';
    return `<div class="task-item">
      <div class="task-check ${done?'done':''}" onclick="toggleTask('${key}',this)"></div>
      <div class="task-info">
        <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:2px">
          <span class="task-name ${done?'done':''}" style="flex:1;min-width:0">${t.name}</span>
          <span style="font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;
            background:${jd.bg};color:${jd.tc};white-space:nowrap;flex-shrink:0">${jd.label}</span>
          ${linkBtn}
        </div>
        <div class="task-detail">${t.detail}</div>
        <div class="task-location">${t.loc}${t.timing ? ' · ⏰ ' + t.timing : ''}</div>
        ${t.nhFert ? `<div style="margin-top:5px">
          <span style="font-size:10px;background:#1565C0;color:white;
            border-radius:6px 0 0 6px;padding:3px 7px;font-weight:700">🏪 최우선비료</span><span style="font-size:10px;background:#E3F2FD;color:#1565C0;
            border-radius:0 6px 6px 0;padding:3px 8px;font-weight:600">${t.nhFert}</span>
          </div>` : ''}
      </div>
    </div>`;
  }).join('') || '<div style="text-align:center;padding:30px 16px;color:#9E9E9E"><div style="font-size:32px">✅</div><div style="font-size:17px;margin-top:8px">이 날은 등록된 작업이 없습니다</div></div>';

  const total = visibleTasks.length;
  const badge = document.getElementById('taskCountBadge');
  const prog  = document.getElementById('progressFill');
  if (badge) badge.textContent = total + '개';
  if (prog)  prog.style.width  = total ? (doneCount/total*100)+'%' : '0%';

  const month = getMonthNum();
  // 생육일수 등록 작물 키워드 (이번주 준비사항 필터)
  var _gkNext = [];
  try { _gkNext = JSON.parse(localStorage.getItem('plants')||'[]').map(function(p){ return p.name.toLowerCase().replace(/[①②③④⑤⑥⑦⑧⑨⑩\s]/g,'').slice(0,4); }).filter(function(k){ return k.length>=2; }); } catch(e) {}
  const next = getNextWeekPrep(month).filter(function(n) {
    if (!_gkNext.length) return true;
    var nm = n.name.toLowerCase();
    return !_gkNext.some(function(k){ return nm.includes(k); });
  });
  const nc    = document.getElementById('nextWeekCard');
  if (nc) nc.style.display = next.length ? 'block' : 'none';
  if (next.length) {
    const nwl = document.getElementById('nextWeekList');
    if (nwl) nwl.innerHTML = next.map(n =>
      `<div class="task-item"><div class="task-info">
        <div class="task-name">${n.name}</div>
        <div class="task-detail">${n.detail}</div>
      </div></div>`).join('');
  }
  renderTip(month);
}

function toggleHideDone() {
  const cur = localStorage.getItem('hideDoneTasks') === 'true';
  localStorage.setItem('hideDoneTasks', (!cur).toString());
  const btn = document.getElementById('hideDoneBtn');
  if (btn) {
    btn.textContent = !cur ? '👁 완료 보기' : '✅ 완료 숨기기';
    btn.style.background   = !cur ? '#E8F5E9' : '#F5F5F5';
    btn.style.color        = !cur ? '#1B5E20' : '#546E7A';
    btn.style.borderColor  = !cur ? '#A5D6A7' : '#E0E0E0';
  }
  renderTasks();
}

function toggleTask(key, el) {
  const wasChecked = !!checkedTasks[key];
  checkedTasks[key] = !checkedTasks[key];
  if (!checkedTasks[key]) {
    delete checkedTasks[key];
    } else {
    }
  localStorage.setItem('checkedTasks', JSON.stringify(checkedTasks));

  // 완료 시 기록장에 저장
  if (!wasChecked && checkedTasks[key]) {
    const taskItem  = el.closest ? el.closest('.task-item') : el.parentElement;
    const nameEl    = taskItem?.querySelector('.task-name');
    const detailEl  = taskItem?.querySelector('.task-detail');
    const locEl     = taskItem?.querySelector('.task-location');
    const judgeSpan = taskItem?.querySelector('[style*="border-radius:10px"]');
    const taskName  = nameEl?.textContent?.trim() || '';
    const taskDetail= detailEl?.textContent?.trim() || '';
    const taskLoc   = locEl?.textContent?.trim() || '';
    const taskJudge = key.includes('fert') ? 'fert'
                    : key.includes('pest') ? 'pest'
                    : (judgeSpan?.textContent?.includes('지금') ? 'urgent' : 'ok');
    if (taskName) recordWork(taskName, taskDetail, taskLoc, taskJudge);
  }

  const taskItem = el.closest ? el.closest('.task-item') : el.parentElement;
  el.classList.toggle('done', !!checkedTasks[key]);
  const nameEl = taskItem?.querySelector('.task-name');
  if (nameEl) nameEl.classList.toggle('done', !!checkedTasks[key]);
  updateTaskProgress();
}

function updateTaskProgress() {
  const tasks    = getDateTasks(SELECTED_DATE);
  const todayKey = toYMD(SELECTED_DATE);
  const monthKey = todayKey.slice(0,7); // YYYY-MM
  const total = tasks.length;
  const done  = tasks.filter(t => {
    const k1 = todayKey + '-' + t.id;
    const k2 = monthKey + '-' + t.id;
    return checkedTasks[k1] || checkedTasks[k2];
  }).length;
  const badge = document.getElementById('taskCountBadge');
  const prog  = document.getElementById('progressFill');
  if (badge) badge.textContent = total + '개';
  if (prog)  prog.style.width  = total ? (done/total*100)+'%' : '0%';
}

// ── D-day 데이터 ─────────────────────────────────────────
function getDDayData() {
  return [
    {label:'파종 한계', crop:'머루콩',       date:[2026,6,10], cls:'dday-red'},
    {label:'파종 한계', crop:'선비잡이콩',   date:[2026,6,15], cls:'dday-orange'},
    {label:'파종 한계', crop:'동부(마늘후작)',date:[2026,7,15], cls:'dday-orange'},
    {label:'파종 필수', crop:'김장무(8/20)', date:[2026,8,20], cls:'dday-red'},
    {label:'정식 한계', crop:'고구마모종',   date:[2026,6,15], cls:'dday-orange'},
    {label:'정식 시기', crop:'양파(9월중하순)',date:[2026,9,20],cls:'dday-blue'},
    {label:'파종 시기', crop:'마늘(10월초)', date:[2026,10,5], cls:'dday-purple'},
    {label:'정식 필수', crop:'배추(9월초)',  date:[2026,9,5],  cls:'dday-green'},
    {label:'파종 필수', crop:'🥔감자(3월중)', date:[2026,3,20], cls:'dday-amber'},
    {label:'파종 한계', crop:'🥜땅콩(5월중)', date:[2026,5,20], cls:'dday-green'},
    {label:'수확 필수', crop:'🥔감자(장마전)', date:[2026,6,15],cls:'dday-red'},
  ];
}
function getHarvestData() {
  return [
    {label:'수확 시작', crop:'블랙베리·복분자',  date:[2026,7,15], cls:'dday-green'},
    {label:'수확 시작', crop:'살구5종',          date:[2026,6,20], cls:'dday-orange'},
    {label:'수확 필수', crop:'수박전량(8/20전)', date:[2026,8,20], cls:'dday-red'},
    {label:'수확 시작', crop:'고구마',           date:[2026,10,1], cls:'dday-amber'},
    {label:'수확 한계', crop:'생강(서리전)',      date:[2026,10,25],cls:'dday-orange'},
    {label:'수확 시기', crop:'머루콩',           date:[2026,10,15],cls:'dday-green'},
    {label:'수확 시기', crop:'마르멜로·모과',    date:[2026,10,20],cls:'dday-purple'},
    {label:'수확 시기', crop:'돌고·아리수사과', date:[2026,10,10],cls:'dday-blue'},
    {label:'수확 필수', crop:'🥔감자(장마전)',   date:[2026,6,15], cls:'dday-red'},
    {label:'수확 시작', crop:'🥜땅콩',           date:[2026,9,25], cls:'dday-green'},
    {label:'수확 한계', crop:'🍠고구마(서리전)', date:[2026,10,20],cls:'dday-orange'},
  ];
}

// ── D-day 렌더 ────────────────────────────────────────
function renderDDay() {
  const ddayData = getDDayData();
  const harvestData = getHarvestData();
  // 생육일수 등록 작물 키워드
  var _gkDday = [];
  try { _gkDday = JSON.parse(localStorage.getItem('plants')||'[]').map(function(p){ return p.name.toLowerCase().replace(/[①②③④⑤⑥⑦⑧⑨⑩\s\(\)]/g,'').slice(0,4); }).filter(function(k){ return k.length>=2; }); } catch(e) {}
  function inGrowList(cropName) {
    if (!_gkDday.length) return false;
    var cn = cropName.toLowerCase().replace(/[①②③④⑤⑥⑦⑧⑨⑩\s\(\)]/g,'');
    return _gkDday.some(function(k){ return cn.includes(k); });
  }
  function buildGrid(data) {
    return data.map(d => {
      const days = daysUntil(...d.date);
      const isInGrow = inGrowList(d.crop);
      var label, extraStyle = '';
      if (isInGrow) { label = '✅ 완료'; extraStyle = 'opacity:0.6;'; }
      else { label = days < 0 ? '완료' : days === 0 ? '오늘!' : `D-${days}`; }
      const sub = `${d.date[1]}/${d.date[2]}`;
      return `<div class="dday-item ${d.cls}" style="${extraStyle}">
        <div class="dday-label">${d.label}${isInGrow?' 🌿':''}</div>
        <div class="dday-crop">${d.crop}</div>
        <div class="dday-num">${label}</div>
        <div class="dday-sub">${sub}${isInGrow?' · 생육중':''}</div>
      </div>`;
    }).join('');
  }
  document.getElementById('ddayGrid').innerHTML = buildGrid(ddayData);
  document.getElementById('harvestGrid').innerHTML = buildGrid(harvestData);
}

// ── 이랑 현황 데이터 ─────────────────────────────────
function getIrangData(month) {
  // 품종별 색상 분류
  const isWatermelon = (t) => /수박/.test(t);
  const isCucumber   = (t) => /오이|쿠카멜론/.test(t);
  const isMelon      = (t) => /참외/.test(t);
  const isHobok      = (t) => /호박/.test(t);
  const isBean       = (t) => /콩|동부/.test(t);

  const B = (t) => {
    const style = isWatermelon(t) ? 'color:#1B5E20;background:#C8E6C9'   // 수박 — 녹색
                : isCucumber(t)   ? 'color:#2E7D32;background:#E8F5E9'   // 오이 — 초록색
                : isMelon(t)      ? 'color:#E65100;background:#FFF9C4'   // 참외 — 노랑색
                : isHobok(t)      ? 'color:#1565C0;background:#E3F2FD'   // 호박 — 파랑색
                : isBean(t)       ? 'color:#795548;background:#EFEBE9'   // 콩 — 황토색
                :                   'color:#6A1B9A;background:#F3E5F5';  // 나머지 — 보라색
    return `<span style="${style};font-weight:700;border-radius:5px;padding:1px 6px;display:inline-block;margin:1px 2px">${t}</span>`;
  };
  const base = [
    {zone:'1구역 구조물', name:'1이랑 (천장유인)', color:'#E8F5E9', border:'#2E7D32',
      crops: month<=5
        ? `다래4주+으름4주 덩굴유인중\n${B('블랙망고수박·애플수박·자몽애플수박')}\n${B('흑피·애플미니꼬꼬마×4·보우짱단호박×2')}\n${B('접목수박(고랑⑪)')} 모종 정식`
        : month<=7
        ? `다래+으름 덩굴 무성(천장덮기)\n${B('블랙망고수박·애플수박·자몽애플수박')} 착과중\n${B('흑피·애플미니꼬꼬마수박×4')} 착과·그물망\n${B('보우짱단호박①②')} 착과·접목수박 고랑⑩ 안착`
        : `수박·단호박 수확완료\n다래·으름 낙엽 시작`,
      status: month<=5?'active':month<=9?'harvest':'prepare'},

    {zone:'1구역 구조물', name:'2이랑 (기둥유인)', color:'#E3F2FD', border:'#1565C0',
      crops: month<=5
        ? `블랙베리9+복분자2 꽃핌\n${B('백다다기오이·쿠카멜론①②')} 정식\n${B('애호박①②·맷돌호박①②')} 정식\n${B('망고참외·꿀참외')} 정식`
        : month<=7
        ? `블랙베리·복분자 수확중\n${B('백다다기오이·쿠카멜론①②')} 수확중\n${B('망고참외·꿀참외')} 수확중\n${B('맷돌호박①②')} 착과중(조류망2겹)\n${B('애호박①②')} 수확중`
        : `블랙베리 수확완료·전정\n${B('백다다기오이·쿠카멜론①②')} 수확완료\n${B('애호박·맷돌호박·망고참외·꿀참외')} 수확완료`,
      status: month<=5?'active':month<=8?'harvest':'prepare'},

    {zone:'1구역 구조물', name:'3이랑 (마늘→동부)', color:'#F3E5F5', border:'#6A1B9A',
      crops: month<=5
        ? `바이오체리 열매달림\n머루포도 덩굴생육\n양파(4~13m)+마늘(13~22m) 비대중`
        : month<=6
        ? `양파·마늘 수확완료\n→ 동부 파종 완료·생육초기`
        : month<=9
        ? `머루포도 수확중\n동부 생육중·수확`
        : `동부 수확완료\n마늘 파종완료·생육초기`,
      status: month<=5?'active':month<=9?'harvest':'active'},

    {zone:'사이구역', name:'A·B이랑 (고구마)', color:'#FFF3E0', border:'#E65100',
      crops: month<=5
        ? `${B('고구마')} 모종 정식 (5월중순)\n순 활착중`
        : month<=9
        ? `${B('고구마')} 덩굴 왕성 생육\n구 비대중`
        : `${B('고구마')} 수확 (10월초~중순)\n서리 전 완료 필수`,
      status: month<=5?'prepare':month<=9?'active':'harvest'},

    {zone:'사이구역', name:'C·D이랑 (감자→배추)', color:'#FFF3E0', border:'#BF360C',
      crops: month<=5
        ? `${B('감자')} 꽃핌·구 비대중`
        : month<=8
        ? `${B('감자')} 수확완료\n${B('배추')} 모종 준비중`
        : `${B('배추')} 결구중 (11월 수확)`,
      status: month<=5?'active':month<=8?'wait':'active'},

    {zone:'2구역', name:'1이랑 15m (선비잡이콩)', color:'#DCEDC8', border:'#33691E',
      crops: month<=5
        ? `${B('선비잡이콩')} 파종(5/25~6/5)\n발아 준비중`
        : month<=9
        ? `${B('선비잡이콩')} 왕성 생육\n덩굴뻗기·착협중`
        : `${B('선비잡이콩')} 수확(11월초~중)\n꼬투리 건조중`,
      status: month<=5?'prepare':month<=9?'active':'harvest'},

    {zone:'2구역', name:'2이랑 14.6m (참외+수박→마늘)', color:'#FFF9C4', border:'#854F0B',
      crops: month<=5
        ? `${B('개구리참외·베타카로틴참외·사과참외')} 정식\n${B('망고수박①②③')} 정식\n${B('접목애플수박①')} 정식`
        : month<=8
        ? `${B('개구리·베타카로틴·사과참외')} 수확중(6~8월)\n${B('망고수박①②③')} 착과·수확중\n${B('접목애플수박①')} 착과중`
        : `참외·수박 수확완료\n마늘 파종완료·생육초기`,
      status: month<=5?'prepare':month<=8?'harvest':'active'},

    {zone:'2구역', name:'3이랑 13.4m (머루콩·헤이즐넛)', color:'#DCEDC8', border:'#558B2F',
      crops: month<=5
        ? `헤이즐넛①② 생육\n${B('머루콩')} 파종(5/10~20)·발아`
        : month<=9
        ? `헤이즐넛 생육\n${B('머루콩')} 왕성 생육`
        : `헤이즐넛 개화\n${B('머루콩')} 수확(10~11월)`,
      status: month<=5?'active':month<=9?'active':'harvest'},

    {zone:'2구역', name:'4이랑 12.6m (노지수박→김장무)', color:'#FFCCBC', border:'#BF360C',
      crops: month<=5
        ? `황근대5+청근대4 수확중\n${B('복수박①②·접목애플수박②')} 모종 정식`
        : month<=7
        ? `황·청근대 정리완료\n${B('복수박①②')} 착과·수확중(8/20전)\n${B('접목애플수박②')} 착과중`
        : month<=8
        ? `수박 수확완료(8/20전)\n${B('김장무')} 파종(8/20)·생육중`
        : `${B('김장무')} 생육중·수확준비(10~11월)`,
      status: month<=5?'active':month<=7?'harvest':month<=8?'active':'harvest'},

    {zone:'2구역', name:'5이랑 11.4m (매실·모과+어수리)', color:'#FFF3E0', border:'#BF360C',
      crops: month<=5
        ? `남고·노천매실 착과(수확전)\n마르멜로·모과 꽃핌·착과\n어수리6포기 새순수확`
        : month<=7
        ? `남고·노천매실 수확(6~7월)\n마르멜로·모과 과실 비대중\n어수리 하엽`
        : `마르멜로 수확(10월)\n대실모과·모과 수확(10~11월)\n어수리 고사`,
      status: month<=5?'harvest':month<=9?'active':'harvest'},

    {zone:'2구역', name:'6이랑 10.3m (양파전용)', color:'#E0F2F1', border:'#00695C',
      crops: month<=8
        ? `비어있음\n${B('양파')} 정식 준비(9월중하순)`
        : `${B('양파')} 정식완료\n생육초기·월동준비`,
      status: month<=8?'wait':'active'},

    {zone:'2구역', name:'7이랑 9.6m (생강+살구+어수리)', color:'#FFF3E0', border:'#E65100',
      crops: month<=5
        ? `앵두 수확시작(5~6월)\n백살구·B360살구 착과중\n${B('토종생강+개량생강')} 싹트기\n어수리·곤드레 수확`
        : month<=9
        ? `${B('토종생강+개량생강')} 왕성 생육\n살구 수확완료\n어수리·곤드레 하엽`
        : `${B('생강')} 수확(10월하순)\n어수리·곤드레 고사`,
      status: month<=5?'harvest':month<=9?'active':'harvest'},

    {zone:'2구역', name:'8이랑 8.6m (대천황살구+어수리+곤드레)', color:'#E8F5E9', border:'#388E3C',
      crops: month<=5
        ? `어수리3·곤드레4 새순수확\n대천황살구 착과중`
        : month<=7
        ? `어수리·곤드레 하엽\n대천황살구 수확(7월)`
        : `어수리·곤드레 고사(월동)\n살구 수확완료`,
      status: month<=5?'harvest':month<=7?'harvest':'wait'},

    {zone:'2구역', name:'9이랑 7.1m (킹코트·하코트살구+어수리+곤드레)', color:'#E8F5E9', border:'#2E7D32',
      crops: month<=5
        ? `어수리4·곤드레3 새순수확\n킹코트·하코트살구 착과중`
        : month<=7
        ? `어수리·곤드레 하엽\n킹코트·하코트살구 수확(6~7월)`
        : `어수리·곤드레 고사(월동)\n살구 수확완료`,
      status: month<=5?'harvest':month<=7?'harvest':'wait'},

    {zone:'2구역', name:'10이랑 6.5m (나가노·돌고·아리수사과+어수리)', color:'#E8F5E9', border:'#1B5E20',
      crops: month<=5
        ? `어수리3포기 새순수확\n나가노·돌고·아리수사과 개화·착과`
        : month<=9
        ? `어수리 하엽\n사과 과실 비대중`
        : `어수리 고사(월동)\n돌고·아리수사과 수확(10월)`,
      status: month<=5?'harvest':month<=9?'active':'harvest'},
  ];
  return base;
}

function renderIrang() {
  const month = getMonthNum();
  const data = getIrangData(month);
  const statusLabel = {active:'생육중', harvest:'수확중', prepare:'준비중', wait:'대기중'};
  const statusClass = {active:'status-active', harvest:'status-harvest', prepare:'status-prepare', wait:'status-wait'};
  document.getElementById('irangList').innerHTML = data.map(d =>
    `<div class="irang-item" style="background:${d.color};border-left-color:${d.border}">
      <div class="irang-zone">${d.zone}</div>
      <div class="irang-name">${d.name}</div>
      <div class="irang-crops">${d.crops.replace(/\\n/g,'<br>').replace(/\[([^\]]+)\]/g,'<span style="color:#1565C0;font-weight:700">$1</span>')}</div>
      <span class="irang-status ${statusClass[d.status]}">${statusLabel[d.status]}</span>
    </div>`
  ).join('');
}

// ── 이랑현황 CSV 내보내기 ─────────────────────────────────
function exportIrangCSV() {
  // plantsDB 기반, 없으면 allPlants 기반
  var src = (typeof plantsDB !== 'undefined' && plantsDB.length > 0) ? plantsDB
          : (typeof allPlants !== 'undefined' ? allPlants : []);
  if (!src.length) { showToast('⚠ 식물 데이터가 없습니다'); return; }
  var rows = [['이랑','구역','식물명','이모지','분류','수량','위치','메모','상태']];
  var zOrder = ['1구역','사이구역','2구역','온실'];
  var sorted = src.slice().sort(function(a,b){
    var zi = zOrder.indexOf(a.zone||'')-zOrder.indexOf(b.zone||'');
    return zi!==0?zi:(a.irang||'').localeCompare(b.irang||'');
  });
  sorted.forEach(function(p) {
    var loc = (typeof getPlantLoc === 'function') ? getPlantLoc(p) : {zone:p.zone,irang:p.irang,spot:p.spot};
    rows.push([loc.irang||p.irang||'',loc.zone||p.zone||'',p.name||'',p.emoji||'',p.cat||'',p.qty||1,loc.spot||p.spot||'',p.note||'',p.status||'active']);
  });
  var bom='\uFEFF';
  var csv=rows.map(function(r){return r.map(function(v){return '"'+String(v||'').replace(/"/g,'""')+'"';}).join(',');}).join('\n');
  var blob=new Blob([bom+csv],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob);
  var a=document.createElement('a');
  a.href=url; a.download='이랑현황_'+toYMD(REAL_TODAY)+'.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('📥 이랑현황 CSV 저장됨 ('+sorted.length+'종)');
}

// ── 이랑현황 CSV 가져오기 ─────────────────────────────────
function importIrangCSV(event) {
  var file=event.target.files[0]; if(!file) return;
  var reader=new FileReader();
  reader.onload=function(e){
    try{
      var text=e.target.result;
      if(text.charCodeAt(0)===0xFEFF) text=text.slice(1);
      var lines=text.split(/\r?\n/).filter(function(l){return l.trim();});
      if(lines.length<2){showToast('⚠ CSV 데이터가 없습니다');return;}
      function parseLine(line){
        var result=[],inQ=false,cur='';
        for(var i=0;i<line.length;i++){var ch=line[i];if(ch==='"'){if(inQ&&line[i+1]==='"'){cur+='"';i++;}else inQ=!inQ;}else if(ch===','&&!inQ){result.push(cur);cur='';}else cur+=ch;}
        result.push(cur); return result;
      }
      var header=parseLine(lines[0]).map(function(h){return h.trim();});
      var idx={};
      ['이랑','구역','식물명','이모지','분류','수량','위치','메모','상태'].forEach(function(h){idx[h]=header.indexOf(h);});
      if(idx['식물명']<0){showToast('⚠ CSV 형식 오류: "식물명" 열이 없습니다');return;}
      var updated=0,added=0;
      var src=(typeof plantsDB!=='undefined'&&plantsDB.length>0)?plantsDB:(typeof allPlants!=='undefined'?allPlants:[]);
      for(var i=1;i<lines.length;i++){
        var cols=parseLine(lines[i]);
        var name=(cols[idx['식물명']]||'').trim(); if(!name) continue;
        var existing=src.find(function(p){return p.name===name;});
        if(existing){
          if(idx['이랑']>=0&&cols[idx['이랑']].trim()) existing.irang=cols[idx['이랑']].trim();
          if(idx['구역']>=0&&cols[idx['구역']].trim()) existing.zone=cols[idx['구역']].trim();
          if(idx['위치']>=0) existing.spot=cols[idx['위치']].trim();
          if(idx['메모']>=0) existing.note=cols[idx['메모']].trim();
          if(idx['수량']>=0&&cols[idx['수량']].trim()) existing.qty=parseInt(cols[idx['수량']])||existing.qty;
          if(idx['상태']>=0&&cols[idx['상태']].trim()) existing.status=cols[idx['상태']].trim();
          updated++;
        } else {
          var newP={id:'csv_'+Date.now()+'_'+i,name:name,
            irang:(idx['이랑']>=0?cols[idx['이랑']].trim():''),
            zone:(idx['구역']>=0?cols[idx['구역']].trim():'기타'),
            emoji:(idx['이모지']>=0?cols[idx['이모지']].trim():'🌱'),
            cat:(idx['분류']>=0?cols[idx['분류']].trim():'채소'),
            qty:(idx['수량']>=0?parseInt(cols[idx['수량']])||1:1),
            spot:(idx['위치']>=0?cols[idx['위치']].trim():''),
            note:(idx['메모']>=0?cols[idx['메모']].trim():''),
            status:(idx['상태']>=0?cols[idx['상태']].trim():'active')};
          if(typeof plantsDB!=='undefined') plantsDB.push(newP);
          else if(typeof allPlants!=='undefined') allPlants.push(newP);
          added++;
        }
      }
      // DB 저장
      if(typeof savePlantsDB==='function') savePlantsDB();
      renderIrang();
      showToast('✅ CSV 불러오기 완료 — 업데이트 '+updated+'건, 신규 '+added+'건');
    }catch(err){showToast('❌ CSV 오류: '+err.message);}
    event.target.value='';
  };
  reader.readAsText(file,'UTF-8');
}

// ── 월별 일정 렌더 ───────────────────────────────────
function renderMonthly() {
  renderMonthlyTable('all');
}

function toggleMonth(num) {
  const body = document.getElementById(`body-${num}`);
  const arr = document.getElementById(`arr-${num}`);
  const isOpen = body.classList.contains('open');
  body.classList.toggle('open', !isOpen);
  arr.style.transform = isOpen ? '' : 'rotate(90deg)';
}

// ── 탭 전환 ──────────────────────────────────────────
// ── 전체 렌더 ────────────────────────────────────────────

function initSearch() {
  const q = document.getElementById('searchInput');
  const val = q ? q.value : '';
  renderSearchResults(val, 'all');
}

function renderAll() {
  updateDateUI();
  renderWeatherAlert();
  renderTasks();
  renderDDay();
  renderIrang();
  renderMonthly();
  renderGrow();
  renderPruningList();
  renderPruneChecklist();
  initSearch();
  // 재배 그림 가이드 초기화
  if (typeof showGuide === 'function') {
    showGuide('watermelon');
  }
}

let wxAutoLoaded = false;
function showTab(id) {
  // 탭 전환 시 TTS 자동 정지
  try { if (typeof ttsStop === 'function') ttsStop(); } catch(e) {}
  // 직접 id 참조 (querySelectorAll 루프 제거 - iOS 성능)
  ['today','search','supply','monthly','wxlive','pest','pruning','grow','guide','sheet','backup'].forEach(t => {
    const s = document.getElementById('sec-' + t);
    const b = document.getElementById('tab-' + t);
    const n = document.getElementById('nav-' + t);
    if (s) s.classList.remove('active');
    if (b) b.classList.remove('active');
    if (n) n.classList.remove('active');
  });
  const sec = document.getElementById('sec-' + id);
  const btn = document.getElementById('tab-' + id);
  const nav = document.getElementById('nav-' + id);
  if (sec) sec.classList.add('active');
  if (btn) btn.classList.add('active');
  if (nav) nav.classList.add('active');

  if (id === 'wxlive' && !wxAutoLoaded) { wxAutoLoaded = true; loadWeatherMain(); }
  if (id === 'monthly') { renderMonthlyTable(String(REAL_TODAY.getMonth()+1)); renderDDay(); }
  if (id === 'pruning') { loadPruningImages(); }
  if (id === 'backup') {
    try { if (typeof window._onEnterBackupTab === 'function') window._onEnterBackupTab(); } catch(e) {}
  }
  if (id === 'grow') {
    try { if (typeof updateGrowStorageBanner === 'function') updateGrowStorageBanner(); } catch(e) {}
    renderGrow();
  }
  if (id === 'search') {
    try { renderBackupList(); } catch(e) {}
  }
  if (id === 'pest')    { renderNhFertList(); }
  if (id === 'supply')  { if (typeof initSupply==='function') initSupply(); if (typeof renderRecommendDB==='function') renderRecommendDB('전체'); }
  if (id === 'irang')   { showTab('search'); switchPlantMgmt('irang'); return; }
  if (id === 'dday')    { showTab('monthly'); setTimeout(function(){ toggleDdayPanel(); }, 50); return; }
  if (id === 'guide')   { if (typeof showGuide==='function') showGuide('watermelon'); }
  if (id === 'pruning') {
    renderPruneChecklist();
    setTimeout(() => { const pd=document.getElementById('pdfIllustDiv'); if(pd) pd.style.display='block'; }, 300);
  }
  if (id === 'sheet') {
    const _wl = localStorage.getItem('workLog');
    if (_wl) { try { workLog = JSON.parse(_wl); } catch(e) { workLog = []; } }
    else { workLog = []; }
    renderWorkLog();
    if (!sheetAutoLoaded) { sheetAutoLoaded = true; renderPendingList(); }
  }
}

// ── 생육일수 기능 ─────────────────────────────────────
plants = (function() {
  try { var d = JSON.parse(localStorage.getItem('plants') || '[]'); return Array.isArray(d) ? d : []; }
  catch(e) { return []; }
})();
plants.forEach(function(p){ try { if (!Array.isArray(p.events)) p.events = []; } catch(e){} });
let growStorageMode = localStorage.getItem('growStorageMode') || 'local';

function togglePlantForm() {
  const form = document.getElementById('plantForm');
  form.classList.toggle('open');
  if (form.classList.contains('open')) {
    // 오늘 날짜로 초기화
    const t = getToday();
    const dd = t.toISOString().split('T')[0];
    document.getElementById('fDate').value = dd;
    document.getElementById('fNote').value = '';
  }
}

// fCrop 이벤트는 initApp()에서 등록

function savePlant() {
  const sel = document.getElementById('fCrop').value;
  const parts = sel.split('|');
  let name, emoji, loc, totalDays, pinchDay, fruitDay;
  if (parts[0] === '직접입력') {
    name = document.getElementById('fCustomName').value.trim() || '작물';
    emoji = '🌱'; loc = '직접입력';
    totalDays = 120; pinchDay = 0; fruitDay = 60;
  } else {
    [name, emoji, loc, totalDays, pinchDay, fruitDay] = parts;
    totalDays = parseInt(totalDays) || 120;
    pinchDay  = parseInt(pinchDay)  || 0;
    fruitDay  = parseInt(fruitDay)  || 0;
  }
  const dateVal = document.getElementById('fDate').value;
  const note = document.getElementById('fNote').value.trim();
  if (!dateVal) { alert('날짜를 선택하세요'); return; }
  const id = Date.now().toString();
  plants.push({ id, name, emoji, loc, dateStr: dateVal, totalDays, pinchDay, fruitDay, note, events: [], updatedAt: new Date().toISOString() });
  savePlantsAll();
  togglePlantForm();
  renderGrow();
}

function deletePlant(id) {
  if (!confirm('삭제할까요?')) return;
  plants = plants.filter(function(p){ return p.id !== id; });
  savePlantsLocal();
  renderGrow();
}

// ── 생육일수 항목 수정 모달 ──────────────────────────────
function openGrowEditModal(id) {
  var p = plants.find(function(x){ return x.id === id; });
  if (!p) return;
  var existing = document.getElementById('growEditModal');
  if (existing) existing.remove();
  var modal = document.createElement('div');
  modal.id = 'growEditModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:flex-end;justify-content:center;';
  modal.innerHTML =
    '<div style="background:white;border-radius:16px 16px 0 0;padding:20px;width:100%;max-width:500px;max-height:85vh;overflow-y:auto">'
    +'<div style="font-size:15px;font-weight:700;color:#2E7D32;margin-bottom:14px">✏️ 생육 기록 수정 — '+p.name+'</div>'
    +'<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">심은 날짜</div>'
    +'<input type="date" id="geDate" value="'+p.dateStr+'" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div>'
    +'<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">총 재배일수 (수확까지)</div>'
    +'<input type="number" id="geTotalDays" value="'+(p.totalDays||120)+'" min="1" max="365" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
    +'<div><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">순치기 일째 (0=없음)</div>'
    +'<input type="number" id="gePinchDay" value="'+(p.pinchDay||0)+'" min="0" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div>'
    +'<div><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">착과 확인 일째 (0=없음)</div>'
    +'<input type="number" id="geFruitDay" value="'+(p.fruitDay||0)+'" min="0" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div></div>'
    +'<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">위치</div>'
    +'<input type="text" id="geLoc" value="'+(p.loc||'')+'" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div>'
    +'<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">메모</div>'
    +'<input type="text" id="geNote" value="'+(p.note||'')+'" placeholder="예: 접목묘, 흑비닐 멀칭" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +'<button onclick="document.getElementById(\'growEditModal\').remove()" style="padding:12px;background:#F5F5F5;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;color:#546E7A">취소</button>'
    +'<button onclick="saveGrowEdit(\''+id+'\')" style="padding:12px;background:#2E7D32;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">✅ 저장</button>'
    +'</div></div>';
  document.body.appendChild(modal);
}

function editPlant(id) {
  var p = plants.find(function(x){ return x.id === id; });
  if (!p) return;
  var ov = document.createElement('div');
  ov.setAttribute('data-editov','1');
  ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center';
  var inner = document.createElement('div');
  inner.style.cssText = 'background:white;border-radius:14px;padding:20px;width:90%;max-width:400px;max-height:85vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3)';
  inner.innerHTML = '<div style="font-size:15px;font-weight:700;color:#1B5E20;margin-bottom:14px">✏️ 작물 수정</div>'
    + '<div style="font-size:11px;color:#9E9E9E;margin-bottom:6px">작물명</div>'
    + '<input id="_pName" value="' + (p.name||'') + '" style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;font-size:14px;margin-bottom:10px;box-sizing:border-box">'
    + '<div style="font-size:11px;color:#9E9E9E;margin-bottom:6px">심은 날짜</div>'
    + '<input id="_pDate" type="date" value="' + (p.dateStr||'') + '" style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;font-size:14px;margin-bottom:10px;box-sizing:border-box">'
    + '<div style="font-size:11px;color:#9E9E9E;margin-bottom:6px">위치</div>'
    + '<input id="_pLoc" value="' + (p.loc||'') + '" style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;font-size:14px;margin-bottom:10px;box-sizing:border-box">'
    + '<div style="font-size:11px;color:#9E9E9E;margin-bottom:6px">메모</div>'
    + '<textarea id="_pNote" rows="3" style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;font-size:14px;margin-bottom:16px;box-sizing:border-box;resize:vertical">' + (p.note||'') + '</textarea>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    + '<button onclick="document.querySelector(\'[data-editov]\').remove()" style="padding:11px;background:#F5F5F5;border:none;border-radius:8px;font-size:14px;cursor:pointer">취소</button>'
    + '<button onclick="_savePlantEdit(\'' + id + '\')" style="padding:11px;background:#1B5E20;color:white;border:none;border-radius:8px;font-size:14px;cursor:pointer;font-weight:700">저장</button>'
    + '</div>';
  ov.appendChild(inner);
  ov.addEventListener('click', function(ev){ if(ev.target===ov) ov.remove(); });
  document.body.appendChild(ov);
}

function _savePlantEdit(id) {
  var idx = plants.findIndex(function(x){ return x.id === id; });
  if (idx < 0) return;
  var nm = document.getElementById('_pName'); if(nm) plants[idx].name    = nm.value || plants[idx].name;
  var dt = document.getElementById('_pDate'); if(dt) plants[idx].dateStr = dt.value || plants[idx].dateStr;
  var lc = document.getElementById('_pLoc');  if(lc) plants[idx].loc     = lc.value;
  var nt = document.getElementById('_pNote'); if(nt) plants[idx].note    = nt.value;
  plants[idx].updatedAt = new Date().toISOString();
  savePlantsLocal();

  var ov = document.querySelector('[data-editov]'); if(ov) ov.remove();
  renderGrow();
  showToast('✅ 작물 수정 완료');
}

function saveGrowEdit(id) {
  var p = plants.find(function(x){ return x.id === id; });
  if (!p) return;
  var dateVal = document.getElementById('geDate')?.value;
  if (!dateVal) { showToast('⚠ 날짜를 선택하세요'); return; }
  p.dateStr    = dateVal;
  p.totalDays  = parseInt(document.getElementById('geTotalDays')?.value) || p.totalDays;
  p.pinchDay   = parseInt(document.getElementById('gePinchDay')?.value)  || 0;
  p.fruitDay   = parseInt(document.getElementById('geFruitDay')?.value)  || 0;
  p.loc        = document.getElementById('geLoc')?.value.trim()  || p.loc;
  p.note       = document.getElementById('geNote')?.value.trim() || '';
  localStorage.setItem('plants', JSON.stringify(plants));
  document.getElementById('growEditModal')?.remove();
  renderGrow();
  showToast('✅ 생육 기록 수정 완료');
}

function getStage(days, total, pinchDay, fruitDay, name) {
  const needPinch = pinchDay > 0;
  const needFruit = fruitDay > 0;
  // 근채류·엽채류 전용 단계
  const rootCrops = ['감자','고구마','생강','양파','마늘','배추','김장무','열무','무'];
  const isRoot = rootCrops.some(r => (name||'').includes(r));

  if (days < 0) return {cls:'stage-seed', label:'심기 전', icon:'🌰'};
  if (days === 0) return {cls:'stage-seed', label:'오늘 심음!', icon:'🌱'};
  if (days <= 7) return {cls:'stage-seed', label:'발아·출아 대기', icon:'🌰'};

  if (isRoot) {
    const pct = days / total;
    if (days <= 20)  return {cls:'stage-sprout', label:'출아·초기생육', icon:'🌱'};
    if (pct < 0.35)  return {cls:'stage-grow',   label:'잎 생육중', icon:'🌿'};
    if (pct < 0.65)  return {cls:'stage-flower',  label:'구·덩이 비대중', icon:'🔵'};
    if (pct < 0.90)  return {cls:'stage-fruit',   label:'비대 완성기', icon:'💛'};
    if (days >= total - 10) return {cls:'stage-harvest', label:'✂️ 수확 시기!', icon:'✂️'};
    return {cls:'stage-fruit', label:'수확 임박', icon:'💛'};
  }

  // 순치기 시기
  if (needPinch && days >= pinchDay - 3 && days <= pinchDay + 5)
    return {cls:'stage-flower', label:'⚠️ 순치기 시기!', icon:'✂️'};

  // 착과 시기
  if (needFruit && days >= fruitDay - 3 && days <= fruitDay + 10)
    return {cls:'stage-fruit', label:'🍉 착과 확인!', icon:'🍉'};

  // 수확 시기
  if (days >= total - 5 && days <= total + 14)
    return {cls:'stage-harvest', label:'✂️ 수확 시기!', icon:'✂️'};
  if (days > total + 14)
    return {cls:'stage-harvest', label:'수확 완료?', icon:'✅'};

  // 일반 생육 단계 (pinchDay 기준 상대적으로)
  const pivot = needPinch ? pinchDay : Math.floor(total * 0.3);
  if (days <= 14) return {cls:'stage-sprout', label:'발아·초기', icon:'🌱'};
  if (days < pivot) return {cls:'stage-grow', label:'생육중', icon:'🌿'};
  if (needFruit && days < fruitDay) return {cls:'stage-flower', label:'개화·순치기후', icon:'🌸'};
  return {cls:'stage-grow', label:'생육중', icon:'🌿'};
}

function getProgressColor(days, total) {
  const pct = days / total;
  if (pct < 0.3) return '#66BB6A';
  if (pct < 0.6) return '#FFA726';
  if (pct < 0.9) return '#E65100';
  return '#C62828';
}
function sanitizePlant(p) {
  if (!p || typeof p !== 'object') return null;
  p.id        = (typeof p.id === 'string' && p.id) ? p.id : ('gr_' + Date.now() + '_' + Math.random().toString(36).slice(2,7));
  p.name      = (typeof p.name === 'string' && p.name) ? p.name : '이름없음';
  p.emoji     = (typeof p.emoji === 'string' && p.emoji) ? p.emoji : '🌱';
  // dateStr 보정: plantDate, addedDate 등 다른 필드에서 fallback
  if (typeof p.dateStr !== 'string' || !p.dateStr ||
      isNaN(new Date(p.dateStr + 'T00:00:00').getTime())) {
    // 다른 날짜 필드에서 대체
    const fallback = p.plantDate || p.addedDate || p.planted_date || '';
    if (fallback && /^\d{4}-\d{2}-\d{2}/.test(String(fallback))) {
      p.dateStr = String(fallback).slice(0, 10);
    } else if (fallback && String(fallback).includes('T')) {
      p.dateStr = String(fallback).slice(0, 10);
    } else {
      // 진짜 없을 때만 오늘 날짜
      try { p.dateStr = toYMD(REAL_TODAY); } catch(e) { p.dateStr = new Date().toISOString().slice(0,10); }
    }
  }
  var td = Number(p.totalDays);
  p.totalDays = (isFinite(td) && td > 0) ? td : 120;
  var pd = Number(p.pinchDay); p.pinchDay = isFinite(pd) ? pd : 0;
  var fd = Number(p.fruitDay); p.fruitDay = isFinite(fd) ? fd : 0;
  if (typeof p.note !== 'string') p.note = '';
  if (!Array.isArray(p.events)) p.events = [];
  return p;
}

function renderGrow() {
  const list = document.getElementById('growList');
  const subtitle = document.getElementById('growSubtitle');
  if (!list || !subtitle) return;
  // 방어: 모든 작물 객체 필드 보정 (undefined.replace 등 방지)
  plants = (plants || []).filter(function(p){ return p && typeof p === 'object'; }).map(sanitizePlant).filter(Boolean);
  if (!plants.length) {
    list.innerHTML = `<div class="grow-empty">
      <div class="grow-empty-icon">🌰</div>
      <div class="grow-empty-text">아직 등록된 작물이 없어요</div>
      <div class="grow-empty-sub">위 ＋버튼을 눌러 추가해 보세요</div>
    </div>`;
    subtitle.textContent = '심은 작물이 없습니다';
    return;
  }

  // 정렬: 1차 수확까지 남은 일수 오름차순, 2차 경과일수 내림차순
  const sorted = [...plants].sort((a, b) => {
    const now = REAL_TODAY;
    const elA = Math.max(0, Math.round((now - new Date(a.dateStr + 'T00:00:00')) / 86400000));
    const elB = Math.max(0, Math.round((now - new Date(b.dateStr + 'T00:00:00')) / 86400000));
    const remA = Math.max(0, (a.totalDays || 120) - elA);
    const remB = Math.max(0, (b.totalDays || 120) - elB);
    if (remA !== remB) return remA - remB;   // 수확까지 남은 일수 오름차순
    return elB - elA;                         // 경과일수 내림차순
  });
  subtitle.textContent = `${plants.length}종 관리 중`;

  list.innerHTML = sorted.map(p => {
    const planted   = new Date(p.dateStr + 'T00:00:00');
    const today     = REAL_TODAY;  // 항상 실제 오늘 기준
    const elapsedRaw = Math.round((today - planted) / 86400000);
    const elapsed   = Math.max(0, elapsedRaw);
    const remaining = Math.max(0, p.totalDays - elapsed);
    const pct       = Math.min(100, Math.max(0, Math.round(elapsed / p.totalDays * 100)));
    const pinchDay  = p.pinchDay  || 0;
    const fruitDay  = p.fruitDay  || 0;
    const stage     = getStage(elapsed, p.totalDays, pinchDay, fruitDay, p.name);
    const barColor  = getProgressColor(elapsed, p.totalDays);
    const plantedFmt = (p.dateStr||'').replace(/-/g, '/').slice(5);
    const elapsedLabel = elapsedRaw < 0 ? '예정' : '일째';

    // 수확 메시지
    const rootCropCheck = ['감자','고구마','생강','양파','마늘','배추','김장무','열무','무'];
    const isRootForMsg = rootCropCheck.some(r => p.name.includes(r));
    const harvestWord = p.name.includes('마늘') || p.name.includes('양파') ? '수확·굴취' :
                        p.name.includes('생강') ? '굴취' :
                        p.name.includes('배추') ? '결구·수확' :
                        p.name.includes('무') ? '수확' : '수확';
    // 수확까지 남은 일수에 따라 색상 구분
    const harvestColor = remaining <= 0  ? 'var(--red)' :
                         remaining <= 7  ? '#E65100' :
                         remaining <= 14 ? '#F9A825' : '#1B5E20';
    const harvestMsg = remaining > 0
      ? '<span style="color:'+harvestColor+';font-weight:700">🌾 '+harvestWord+'까지 약 <strong>'+remaining+'일</strong> 남음</span>'
      : '<span style="color:var(--red);font-weight:700">✂️ '+harvestWord+' 시기 도달!</span>';

    // 다음 작업 알림 계산
    let nextAction = '';
    const rootCropNames = ['감자','고구마','생강','양파','마늘','배추','김장무','열무','무'];
    const isRootCrop = rootCropNames.some(r => p.name.includes(r));
    if (pinchDay > 0) {
      const pinchLeft = pinchDay - elapsed;
      const pinchActionLabel = p.name.includes('고구마') ? '덩굴 뒤집기!' : '순치기!';
      const pinchDetail = p.name.includes('고구마') ? '고구마 덩굴뒤집기 — 부정근 제거' : '어미줄기 적심하세요';
      if (pinchLeft > 0 && pinchLeft <= 7)
        nextAction = `<div style="background:#FFF3E0;border-radius:6px;padding:5px 8px;margin-top:5px;font-size:16px;color:#E65100"><strong>⚠️ D-${pinchLeft}일 후 ${pinchActionLabel}</strong> (${pinchDay}일째)</div>`;
      else if (pinchLeft <= 0 && pinchLeft >= -7)
        nextAction = `<div style="background:#FFEBEE;border-radius:6px;padding:5px 8px;margin-top:5px;font-size:16px;color:#C62828"><strong>🔴 지금 ${pinchActionLabel}</strong> ${pinchDetail}</div>`;
    }
    if (fruitDay > 0 && !nextAction) {
      const fruitLeft = fruitDay - elapsed;
      if (fruitLeft > 0 && fruitLeft <= 7)
        nextAction = `<div style="background:#E3F2FD;border-radius:6px;padding:5px 8px;margin-top:5px;font-size:16px;color:#1565C0"><strong>🍉 D-${fruitLeft}일 후 착과 확인!</strong> (${fruitDay}일째)</div>`;
      else if (fruitLeft <= 0 && fruitLeft >= -10)
        nextAction = `<div style="background:#E8F5E9;border-radius:6px;padding:5px 8px;margin-top:5px;font-size:16px;color:#1B5E20"><strong>🍉 착과 확인 시기!</strong> 포기당 1개 남기기</div>`;
    }
    if (remaining <= 7 && remaining > 0 && !nextAction)
      nextAction = `<div style="background:#FFF9C4;border-radius:6px;padding:5px 8px;margin-top:5px;font-size:16px;color:#854F0B"><strong>✂️ D-${remaining}일 후 수확!</strong> 준비하세요</div>`;

    // 순치기·착과 일정 요약
    let schedule = '';
    const rootCheck2 = ['감자','고구마','생강','양파','마늘','배추','김장무','열무','무'];
    const isRootSched = rootCheck2.some(r => p.name.includes(r));
    const schedItems = [];
    if (pinchDay > 0) {
      const lbl = p.name.includes('고구마') ? `덩굴뒤집기 ${pinchDay}일째` : `순치기 ${pinchDay}일째`;
      schedItems.push(lbl);
    }
    if (fruitDay > 0 && !isRootSched) schedItems.push(`착과확인 ${fruitDay}일째`);
    if (isRootSched) {
      const midLbl = p.name.includes('배추')||p.name.includes('무') ? '결구시작' :
                     p.name.includes('마늘')||p.name.includes('양파') ? '구비대기' : '비대기';
      schedItems.push(`${midLbl} ${Math.round(p.totalDays*0.5)}일째`);
    }
    const hvLbl = p.name.includes('생강') ? '굴취' :
                  p.name.includes('마늘')||p.name.includes('양파') ? '수확·굴취' :
                  p.name.includes('배추') ? '결구수확' : '수확';
    schedItems.push(`${hvLbl} ${p.totalDays}일째`);
    schedule = `<div style="font-size:10px;color:#9E9E9E;margin-top:3px">${schedItems.join(' → ')}</div>`;

    // 이벤트 목록 HTML (ES5 문자열 연결, backtick 없음)
    var _evArr = Array.isArray(p.events) ? p.events.slice().sort(function(a,b){return (a.date||'').localeCompare(b.date||'');}) : [];
    var _eic = {'파종':'🌾','정식':'🌿','발아':'🌱','개화':'🌸','착과':'🍎','수확':'🎉','순치기':'✂️','기타':'📝'};
    var _evHtml = '';
    if (_evArr.length) {
      _evHtml += '<div style="margin-top:5px;border-top:1px solid #F0F0F0;padding-top:4px">';
      for (var _ei=0; _ei<_evArr.length; _ei++) {
        var _ev = _evArr[_ei];
        _evHtml += '<div style="display:flex;align-items:center;gap:4px;padding:2px 0;font-size:11px">'
          + '<span style="background:#E8F5E9;color:#1B5E20;padding:1px 5px;border-radius:5px;font-weight:700;flex-shrink:0">'+(_eic[_ev.type]||'•')+' '+_ev.type+'</span>'
          + '<span style="color:#546E7A;flex-shrink:0">'+_ev.date+'</span>'
          + (_ev.daysFrom>0?'<span style="color:#9E9E9E;flex-shrink:0;margin-left:2px">+'+_ev.daysFrom+'일</span>':'')
          + '<span style="color:#9E9E9E;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-left:2px">'+(_ev.note||'')+'</span>'
          + '<button data-pid="'+p.id+'" data-eid="'+_ev.id+'" onclick="event.stopPropagation();editGrowEvent(this.dataset.pid,this.dataset.eid)" style="background:none;border:none;color:#90CAF9;font-size:11px;cursor:pointer;padding:0 2px;flex-shrink:0">✏️</button>'
          + '<button data-pid="'+p.id+'" data-eid="'+_ev.id+'" onclick="event.stopPropagation();deleteGrowEvent(this.dataset.pid,this.dataset.eid)" style="background:none;border:none;color:#BDBDBD;font-size:12px;cursor:pointer;padding:0 2px;flex-shrink:0">✕</button>'
          + '</div>';
      }
      _evHtml += '</div>';
    }
    // 헤더 색상 — 수확 임박도에 따라
    const headerBg = remaining <= 0  ? '#C62828' :
                     remaining <= 7  ? '#E65100' :
                     remaining <= 14 ? '#F57F17' : '#1B5E20';

    // 수확까지 표시
    const harvestBadge = remaining <= 0
      ? '<span style="background:rgba(255,255,255,0.2);color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:700">✂️ '+harvestWord+' 시기!</span>'
      : '<span style="background:rgba(255,255,255,0.2);color:white;padding:2px 8px;border-radius:10px;font-size:11px;font-weight:600">🌾 수확까지 <strong>'+remaining+'일</strong></span>';

    // nextAction 알림 (간결하게)
    var alertHtml = '';
    if (nextAction) alertHtml = nextAction;

    return '<div style="border:1.5px solid '+headerBg+';border-radius:10px;margin-bottom:10px;overflow:hidden">'

      // ── 헤더 (클릭 → 수정 모달) ──
      + '<div onclick="openGrowEditModal(\''+p.id+'\')" style="background:'+headerBg+';padding:9px 12px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px">'
      +   '<div style="display:flex;align-items:center;gap:6px;flex:1;min-width:0">'
      +     '<span style="font-size:18px;flex-shrink:0">'+p.emoji+'</span>'
      +     '<span style="font-size:14px;font-weight:700;color:white;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+p.name+'</span>'
      +     '<span style="font-size:10px;color:rgba(255,255,255,0.7);flex-shrink:0">✏️</span>'
      +   '</div>'
      +   '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0">'
      +     harvestBadge
      +     '<button onclick="event.stopPropagation();deletePlant(\''+p.id+'\')" style="background:none;border:none;color:rgba(255,255,255,0.7);font-size:16px;cursor:pointer;padding:0 2px;line-height:1">✕</button>'
      +     '<button onclick="event.stopPropagation();editPlant(\''+ p.id +'\')" style="background:none;border:none;color:rgba(255,255,255,0.85);font-size:14px;cursor:pointer;padding:0 4px">✏️</button>'
      +   '</div>'
      + '</div>'

      // ── 경과일 + 진행바 ──
      + '<div style="padding:8px 12px;background:#F9FBF9;border-bottom:1px solid #E8F5E9;display:flex;align-items:center;gap:10px">'
      +   '<div style="text-align:center;flex-shrink:0">'
      +     '<div style="font-size:22px;font-weight:800;color:'+headerBg+';line-height:1">'+elapsed+'</div>'
      +     '<div style="font-size:10px;color:#9E9E9E">'+elapsedLabel+'</div>'
      +   '</div>'
      +   '<div style="flex:1;min-width:0">'
      +     '<div style="display:flex;justify-content:space-between;font-size:10px;color:#9E9E9E;margin-bottom:3px">'
      +       '<span>심은날: '+plantedFmt+(p.note?' · '+p.note:'')+'</span>'
      +       '<span>'+pct+'%</span>'
      +     '</div>'
      +     '<div style="height:6px;background:#E0E0E0;border-radius:3px;overflow:hidden">'
      +       '<div style="height:100%;width:'+pct+'%;background:'+barColor+';border-radius:3px;transition:width 0.3s"></div>'
      +     '</div>'
      +     '<div style="font-size:10px;color:#9E9E9E;margin-top:2px">'+schedItems.join(' → ')+'</div>'
      +   '</div>'
      + '</div>'

      // ── 알림 ──
      + (alertHtml ? '<div style="padding:0 12px 4px">'+alertHtml+'</div>' : '')

      // ── 이벤트 목록 ──
      + '<div style="padding:6px 12px">'
      + (_evArr.length
          ? _evHtml
          : '<div style="font-size:11px;color:#BDBDBD;padding:4px 0">이벤트 기록 없음</div>'
        )
      + '</div>'

      // ── 이벤트 추가 버튼 ──
      + '<div style="padding:4px 12px 10px">'
      +   '<button data-pid="'+p.id+'" onclick="openUnifiedAddModal(this.dataset.pid)"'
      +     ' style="width:100%;padding:6px;background:#F1F8E9;border:1px dashed '+headerBg+';'
      +     'border-radius:8px;color:'+headerBg+';font-size:11px;font-weight:600;cursor:pointer;font-family:inherit">'
      +     '+ 이벤트 기록 추가 (파종·착과·수확 등)'
      +   '</button>'
      + '</div>'
      + '</div>';
  }).join('');
}

// ── 전정 가이드 데이터 ────────────────────────────────────
const pruningData = [
  {group:"3/20입고 (식재21일)",name:"으름나무 홍화대실으름",shape:"덩굴형",judge:"✅ 가능",method:"주간 90~100cm 절단 · 측지 전부 기부 제거 · 와이어 2단 유인",bg:"#E8F5E9",tc:"#1B5E20",cls:"ok"},
  {group:"3/20입고 (식재21일)",name:"자가결실 다래 용성2호",shape:"덩굴형",judge:"✅ 가능",method:"주간 50~60cm 절단 · 측지 전부 제거 · 와이어 바인더 고정",bg:"#E8F5E9",tc:"#1B5E20",cls:"ok"},
  {group:"3/20입고 (식재21일)",name:"블랙베리(슈퍼복분자)×9",shape:"블랙베리형",judge:"✅ 가능",method:"건강 줄기 4~5개 선발 · 나머지 기부 제거 · 45° 와이어 유인",bg:"#E8F5E9",tc:"#1B5E20",cls:"ok"},
  {group:"3/20입고 (식재21일)",name:"키위 그린키위(참다래)",shape:"덩굴형",judge:"✅ 가능",method:"접합부 위 2~3눈 남기고 절단 · 측지 전부 제거 · 지지대 1단 유인",bg:"#E8F5E9",tc:"#1B5E20",cls:"ok"},
  {group:"3/20입고 (식재21일)",name:"자가결실 다래 레몬프레시",shape:"덩굴형",judge:"✅ 가능",method:"주간 50~60cm 절단 · 측지 전부 제거 (용성2호와 동일)",bg:"#E8F5E9",tc:"#1B5E20",cls:"ok"},
  {group:"3/20입고 (식재21일)",name:"으름나무 백화대실으름",shape:"덩굴형",judge:"✅ 가능",method:"주간 90~100cm 절단 · 와이어 2단 유인 (홍화대실으름과 동일)",bg:"#E8F5E9",tc:"#1B5E20",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"뽕나무 제왕오디",shape:"저수고형",judge:"✅ 가능",method:"접목부 위 40~50cm 절단 · 측지 전부 제거 · 수고 80cm 한계 엄수",bg:"#E3F2FD",tc:"#1565C0",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"대추나무 사과대추 태상왕",shape:"화분형",judge:"⚠️ 주의",method:"도장지·교차지만 가볍게 제거 · 본전정은 11~12월",bg:"#FFF3E0",tc:"#E65100",cls:"warn"},
  {group:"3/27입고 (식재14일)",name:"뽕나무 K-3배체 슈퍼오디",shape:"저수고형",judge:"✅ 가능",method:"40~50cm 강전정 · 측지 전부 제거 · 수고 80cm 한계",bg:"#E3F2FD",tc:"#1565C0",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"감나무 대왕감(오오타네나시)",shape:"화분형",judge:"⚠️ 주의",method:"도장지만 가볍게 제거 · 본전정은 낙엽 후(11~12월)",bg:"#FFF3E0",tc:"#E65100",cls:"warn"},
  {group:"3/27입고 (식재14일)",name:"뽕나무 슈퍼오디(울트라)",shape:"저수고형",judge:"✅ 가능",method:"40~50cm 강전정 · 측지 전부 제거 · 80cm 한계 (K-3배체와 동일)",bg:"#E3F2FD",tc:"#1565C0",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"붉은 매실나무 노천",shape:"배상형",judge:"✅ 가능",method:"주간 60~80cm 절단 · 배상형 주지 3개 방향 눈 확인 · 톱신페이스트 도포",bg:"#EDE7F6",tc:"#6A1B9A",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"매실나무 남고",shape:"배상형",judge:"✅ 가능",method:"주간 60~80cm 절단 · 배상형 수형 시작 · 절단면 즉시 처리",bg:"#EDE7F6",tc:"#6A1B9A",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"단감나무 태추",shape:"화분형",judge:"⚠️ 주의",method:"도장지만 가볍게 제거 · 화분 활착 후 본전정",bg:"#FFF3E0",tc:"#E65100",cls:"warn"},
  {group:"3/27입고 (식재14일)",name:"포도나무 MBA (머루포도)",shape:"덩굴형",judge:"✅ 가능",method:"주간 지지대 1단 높이 절단 · 측지 전부 제거 · 지지대 설치 후 유인",bg:"#E8F5E9",tc:"#1B5E20",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"두릅나무 민두릅",shape:"관목형",judge:"✅ 가능",method:"주간 60cm 절단 · 약한 줄기 기부 제거 · 4~5월 새순 수확 임박",bg:"#DCEDC8",tc:"#33691E",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"바이오체리나무",shape:"배상형",judge:"✅ 가능",method:"주간 60~80cm 절단 · 배상형 주지 3개 위치 눈 확인 · 톱신페이스트",bg:"#EDE7F6",tc:"#6A1B9A",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"무화과나무 시카고하디",shape:"관목형",judge:"✅ 가능",method:"발아 직전 지금이 적기 · 주간 절단 · 주지 2~3개 방향 설정",bg:"#DCEDC8",tc:"#33691E",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"사과나무 나가노신구",shape:"세장방추형",judge:"✅ 가능",method:"주간 90~100cm 절단 · 경쟁지 제거 · 측지 60~70° 수평유인 (M26왜성)",bg:"#FFF9C4",tc:"#854F0B",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"복분자나무 ×2",shape:"블랙베리형",judge:"✅ 가능",method:"건강 줄기 3~4개 선발 · 나머지 기부 제거 · 수확 후 결과지 제거",bg:"#E8F5E9",tc:"#1B5E20",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"자가결실 다래 일세다래",shape:"덩굴형",judge:"✅ 가능",method:"주간 지지대 1단 높이 절단 · 주지 방향 1~2개 설정 유인",bg:"#E8F5E9",tc:"#1B5E20",cls:"ok"},
  {group:"3/27입고 (식재14일)",name:"으름나무 슈퍼대실으름",shape:"덩굴형",judge:"❌ 전정금지",method:"전정 금지 · 활착 최우선 · 지지대 고정만 점검",bg:"#FFEBEE",tc:"#C62828",cls:"bad"},
  {group:"4/3입고 (식재7일)",name:"무화과나무 롱다우트",shape:"관목형",judge:"✅ 가능",method:"발아 직전 지금이 적기 · 주간 절단 · 주지 2~3개 방향 설정",bg:"#DCEDC8",tc:"#33691E",cls:"ok"},
  {group:"4/3입고 (식재7일)",name:"헤이즐넛 바르셀로나",shape:"관목형",judge:"✅ 가능",method:"주간 60cm 절단 · 흡지 즉시 제거 · 주지 3~5개 선발 목표",bg:"#DCEDC8",tc:"#33691E",cls:"ok"},
  {group:"4/3입고 (식재7일)",name:"앵두나무 대홍앵",shape:"관목형",judge:"✅ 가능",method:"주간 60cm 절단 · 주지 3~4개 방향 눈 확인 · 자가수정 가능",bg:"#DCEDC8",tc:"#33691E",cls:"ok"},
  {group:"4/3입고 (식재7일)",name:"모과나무 대실모과",shape:"배상형",judge:"⚡ ⚡지금당장",method:"⚡적아(눈따기) 최우선 — 지금 당장! · 주간 80~100cm 절단",bg:"#FFEBEE",tc:"#C62828",cls:"urgent"},
  {group:"4/3입고 (식재7일)",name:"살구나무 B360",shape:"배상형",judge:"✅ 가능",method:"주간 60~80cm 절단 · 배상형 주지 3개 목표 · 발아 후 방제 준비",bg:"#EDE7F6",tc:"#6A1B9A",cls:"ok"},
  {group:"4/3입고 (식재7일)",name:"크랩 사과나무 돌고",shape:"세장방추형",judge:"✅ 가능",method:"주간 90~100cm 절단 · 경쟁지 제거 · 측지 수평유인 (수분수)",bg:"#FFF9C4",tc:"#854F0B",cls:"ok"},
  {group:"4/3입고 (식재7일)",name:"서양모과나무 마르멜로",shape:"배상형",judge:"⚡ ⚡지금당장",method:"⚡적아(눈따기) 최우선 — 지금이 마지막 기회! · 주간 80~100cm",bg:"#FFEBEE",tc:"#C62828",cls:"urgent"},
  {group:"4/3입고 (식재7일)",name:"피코튬(복숭아×자두×살구)",shape:"배상형",judge:"✅ 가능",method:"주간 60~80cm 절단 · 배상형 주지 3개 목표 · 발아 전 방제 준비",bg:"#EDE7F6",tc:"#6A1B9A",cls:"ok"},
  {group:"4/3입고 (식재7일)",name:"백살구나무",shape:"배상형",judge:"✅ 가능",method:"주간 60~80cm 절단 · 수형 시작 · 수세 유지 중요 (수분수)",bg:"#EDE7F6",tc:"#6A1B9A",cls:"ok"},
  {group:"4/3입고 (식재7일)",name:"살구나무 킹코트(대천황)",shape:"배상형",judge:"⚠️ 주의",method:"도장지·경쟁지만 최소 제거 · 강전정 금지",bg:"#FFF3E0",tc:"#E65100",cls:"warn"},
  {group:"4/3입고 (식재7일)",name:"사과나무 아리수",shape:"세장방추형",judge:"✅ 가능",method:"주간 90~100cm 절단 · 경쟁지 제거 · 측지 수평유인 (M26왜성)",bg:"#FFF9C4",tc:"#854F0B",cls:"ok"},
  {group:"4/3입고 (식재7일)",name:"블루베리 패트리오트",shape:"블루베리형",judge:"✅ 가능",method:"노쇠 줄기 1~2개 제거 · 주지 5~6개 유지 · pH 4.5~5.5 확인",bg:"#E8F5E9",tc:"#1B5E20",cls:"ok"},
  {group:"4/3입고 (식재7일)",name:"살구나무 하코드",shape:"배상형",judge:"✅ 가능",method:"주간 60~80cm 절단 · 수형 시작 · 수세 유지 (수분수)",bg:"#EDE7F6",tc:"#6A1B9A",cls:"ok"},
  {group:"4/3입고 (식재7일)",name:"헤이즐넛 초거대향",shape:"관목형",judge:"✅ 가능",method:"흡지 즉시 제거 · 주지 3~5개 선발 시작 · 바르셀로나 개화기 일치",bg:"#DCEDC8",tc:"#33691E",cls:"ok"},
  {group:"4/3입고 (식재7일)",name:"청무화과나무 바나네",shape:"관목형",judge:"✅ 가능",method:"발아 직전 지금이 적기 · 주간 절단 · 주지 2~3개 방향 설정",bg:"#DCEDC8",tc:"#33691E",cls:"ok"}
];

let pruneFilter = 'all';
let pruneChecked = JSON.parse(localStorage.getItem('pruneChecked') || '{}');

// ── 묘목 목록 → 그림 이동 ────────────────────────────────
function jumpToImage(gi, ii) {
  // 1. 전정 탭으로 이동
  showTab('pruning');
  // 2. 해당 그룹 표시
  showGroup(gi);
  // 3. 해당 이미지 표시
  moveInGroup(gi, ii);
  // 4. 삽화 영역으로 스크롤
  setTimeout(() => {
    const el = document.getElementById('grp-' + gi + '-img-' + ii);
    if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }, 100);
}

// ── 필터 (가나다 목록에서 판정별 숨기기) ─────────────────
function filterPruning(cls) {
  pruneFilter = cls;
  // 버튼 활성화
  ['all','ok','urgent','warn','bad'].forEach(c => {
    const btn = document.getElementById('pf-' + c);
    if (!btn) return;
    const active = c === cls;
    if (c === 'all') {
      btn.style.background = active ? '#2E7D32' : 'white';
      btn.style.color      = active ? 'white'   : '#2E7D32';
    } else {
      const colors = {ok:['#1B5E20','#C8E6C9'], urgent:['#C62828','#FFCDD2'],
                      warn:['#E65100','#FFE0B2'], bad:['#C62828','#FFCDD2']};
      const [tc, bc] = colors[c] || ['#757575','#E0E0E0'];
      btn.style.background = active ? tc   : 'white';
      btn.style.color      = active ? 'white' : tc;
      btn.style.borderColor= active ? tc : bc;
    }
  });
  // 항목 필터링 (pruningData 가나다 순서 기반)
  const items = document.querySelectorAll('[id^="pruning-item-"]');
  items.forEach((el, rank) => {
    // rank → sorted_idx → cls 확인은 data-cls 속성으로
    const itemCls = el.getAttribute('data-cls');
    if (!itemCls) { el.style.display = 'block'; return; }
    el.style.display = (cls === 'all' || itemCls === cls) ? 'block' : 'none';
  });
}

function renderPruningList() {
  const list = document.getElementById('pruningList');
  if (!list) return;
  const filtered = pruneFilter === 'all' ? pruningData : pruningData.filter(p => p.cls === pruneFilter);
  if (!filtered.length) {
    list.innerHTML = '<div class="grow-empty"><div class="grow-empty-icon">🌳</div><div class="grow-empty-text">해당 항목 없음</div></div>';
    return;
  }
  let html = '';
  let curGroup = '';
  filtered.forEach(p => {
    if (p.group !== curGroup) {
      curGroup = p.group;
      const gc = p.group.includes('3/20') ? '#1B5E20' : p.group.includes('3/27') ? '#1565C0' : '#C62828';
      html += `<div style="padding:8px 16px;background:${gc};color:white;font-size:16px;font-weight:700">${p.group}</div>`;
    }
    html += `<div style="padding:11px 16px;border-bottom:1px solid #F5F5F5;background:${p.bg}20">
      <div style="display:flex;align-items:flex-start;gap:10px">
        <div style="flex:1">
          <div style="font-size:17px;font-weight:700;color:${p.tc}">${p.name}</div>
          <div style="display:flex;gap:6px;margin-top:3px;flex-wrap:wrap">
            <span style="font-size:10px;background:${p.bg};color:${p.tc};padding:1px 7px;border-radius:10px;font-weight:700">${p.shape}</span>
            <span style="font-size:10px;background:${p.cls==='urgent'?'#FFEBEE':p.cls==='bad'?'#FFEBEE':p.cls==='warn'?'#FFF3E0':'#E8F5E9'};color:${p.cls==='urgent'||p.cls==='bad'?'#C62828':p.cls==='warn'?'#E65100':'#1B5E20'};padding:1px 7px;border-radius:10px;font-weight:700">${p.judge}</span>
          </div>
          <div style="font-size:16px;color:#424242;margin-top:5px;line-height:1.6">${p.method}</div>
        </div>
      </div>
    </div>`;
  });
  list.innerHTML = html;
}

function renderPruneChecklist() {
  const list = document.getElementById('pruneCheckList');
  if (!list) return;
  // 긴급 → 가능 → 주의 순 정렬
  const order = {urgent:0, ok:1, warn:2, bad:3};
  const sorted = [...pruningData].sort((a,b) => (order[a.cls]||9)-(order[b.cls]||9));
  list.innerHTML = sorted.map((p,i) => {
    const key = 'prune_' + i;
    const done = pruneChecked[key];
    return `<div class="task-item">
      <div class="task-check ${done?'done':''}" onclick="togglePrune('${key}',this)"></div>
      <div class="task-info">
        <div class="task-name ${done?'done':''}" style="color:${p.tc}">${p.name}</div>
        <div class="task-detail" style="font-size:16px">${p.method}</div>
        <div class="task-location">${p.group} · ${p.shape}</div>
      </div>
    </div>`;
  }).join('');
  updatePruneProgress();
}

function togglePrune(key, el) {
  pruneChecked[key] = !pruneChecked[key];
  if (!pruneChecked[key]) delete pruneChecked[key];
  localStorage.setItem('pruneChecked', JSON.stringify(pruneChecked));
  el.classList.toggle('done');
  const nameEl = el.nextElementSibling?.querySelector('.task-name');
  if (nameEl) nameEl.classList.toggle('done');
  updatePruneProgress();
}

function updatePruneProgress() {
  const total = pruningData.length;
  const done = Object.keys(pruneChecked).filter(k => k.startsWith('prune_') && pruneChecked[k]).length;
  const pct = Math.round(done/total*100);
  const prog = document.getElementById('pruneProgress');
  const badge = document.getElementById('pruneCheckBadge');
  if (prog) prog.style.width = pct + '%';
  if (badge) badge.textContent = done + ' / ' + total;
}

// ── PDF 전정 삽화 탭 전환 ────────────────────────────────
function showPdfPage(n) {
  // 하위호환성 유지 (구 코드 호출 대비)
  showGroup(n > 0 ? n-1 : 0);
}

const groupCounts = [1, 6, 9, 7, 9, 6];
let currentGroupImgIdx = Array(6).fill(0);

function showGroup(gi) {
  for (let i = 0; i < 6; i++) {
    const grp = document.getElementById('grp-' + i);
    const btn = document.getElementById('gtab-' + i);
    if (!grp || !btn) continue;
    const active = i === gi;
    grp.style.display    = active ? 'block' : 'none';
    btn.style.background = active ? '#1B5E20' : 'rgba(255,255,255,0.15)';
    btn.style.border     = active ? '1.5px solid white' : '1.5px solid rgba(255,255,255,0.5)';
  }
}

function moveInGroup(gi, imgIdx) {
  const count = groupCounts[gi];
  if (imgIdx < 0 || imgIdx >= count) return;
  // 현재 이미지 숨기기
  const cur = currentGroupImgIdx[gi];
  const curEl = document.getElementById('grp-' + gi + '-img-' + cur);
  if (curEl) curEl.style.display = 'none';
  // 새 이미지 표시
  const newEl = document.getElementById('grp-' + gi + '-img-' + imgIdx);
  if (newEl) newEl.style.display = 'block';
  currentGroupImgIdx[gi] = imgIdx;
  // 화면 상단으로 스크롤
  newEl && newEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ══════════════════════════════════════════════════════════
// 전체 작물·묘목 데이터베이스 (87개)
// ══════════════════════════════════════════════════════════
// allPlants는 Google Sheets에서 로드됨
const allPlants = [];

// 위치 변경 저장소 (localStorage)
let locationChanges = JSON.parse(localStorage.getItem('locationChanges') || '{}');
let currentEditId = null;
let searchFilterMode = '전체';

// 이랑 옵션 맵
const irangOptions = {
  '1구역':   ['1이랑','2이랑','3이랑'],
  '사이구역':['A·B이랑','C·D이랑'],
  '2구역':   ['1이랑','2이랑','3이랑','4이랑','5이랑','6이랑','7이랑','8이랑','9이랑','10이랑'],
  '온실':    ['온실 내부','온실 앞'],
};

// 단일 DB 헬퍼 — plantsDB 우선, 없으면 allPlants
function getActivePlants() {
  if (typeof plantsDB !== 'undefined' && plantsDB.length > 0)
    return plantsDB.filter(p => p.status !== 'deleted');
  return (typeof allPlants !== 'undefined' ? allPlants : []);
}

// 실제 위치 가져오기 — plantsDB 직접값 우선, locationChanges overlay
function getPlantLoc(p) {
  // plantsDB에 같은 id가 있으면 그 값 우선
  const dbP = (typeof plantsDB !== 'undefined') ? plantsDB.find(x => x.id === p.id) : null;
  const base = dbP || p;
  const ch = locationChanges[p.id];
  if (ch) return {zone:ch.zone, irang:ch.irang, spot:ch.spot, changed:true};
  return {zone:base.zone||p.zone, irang:base.irang||p.irang, spot:base.spot||p.spot, changed:false};
}

// ── 검색 기능 ──────────────────────────────────────────────
function onSearchInput(val) {
  const clr = document.getElementById('searchClear');
  if (clr) clr.classList.toggle('visible', val.length > 0);
  renderSearchResults(val, searchFilterMode);
}

function clearSearch() {
  const inp = document.getElementById('searchInput');
  if (inp) { inp.value = ''; inp.focus(); }
  document.getElementById('searchClear')?.classList.remove('visible');
  renderSearchResults('', searchFilterMode);
}

function searchByFilter(filter) {
  searchFilterMode = filter;
  document.querySelectorAll('.search-filter-btn').forEach(btn => {
    btn.classList.toggle('active', btn.textContent.includes(filter) || (filter==='전체' && btn.id==='sf-all'));
  });
  const q = document.getElementById('searchInput')?.value || '';
  renderSearchResults(q, filter);
}

function highlight(text, query) {
  if (!query) return text;
  const re = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')})`, 'gi');
  return text.replace(re, '<mark>$1</mark>');
}

function renderSearchResults(query, filter) {
  const box = document.getElementById('searchResults');
  if (!box) return;

  let list = getActivePlants();

  // 카테고리·구역 필터
  if (filter !== '전체') {
    list = list.filter(p => {
      const loc = getPlantLoc(p);
      return p.cat === filter || loc.zone === filter;
    });
  }

  // 텍스트 검색
  if (query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter(p => {
      const loc = getPlantLoc(p);
      return p.name.toLowerCase().includes(q)
          || loc.zone.includes(q)
          || loc.irang.includes(q)
          || loc.spot.toLowerCase().includes(q)
          || p.cat.includes(q);
    });
  }

  // 결과 없음
  if (!list.length) {
    box.innerHTML = `<div class="result-empty">
      <div style="font-size:36px;margin-bottom:8px">🔍</div>
      <div style="font-size:17px;font-weight:600;color:#9E9E9E">"${query || filter}" 검색 결과 없음</div>
    </div>`;
    return;
  }

  // 총 개수 표시
  let html = `<div style="font-size:16px;color:#9E9E9E;margin-bottom:8px;padding:0 4px">${list.length}개 찾음</div>`;

  list.forEach(p => {
    const loc  = getPlantLoc(p);
    const chBadge = loc.changed ? '<span class="changed-badge">위치변경됨</span>' : '';
    const nameHtml = highlight(p.name, query.trim());
    html += `<div class="search-result-item" onclick="openEditModal('${p.id}')">
      <div class="result-emoji">${p.emoji}</div>
      <div class="result-info">
        <div class="result-name">${nameHtml}${chBadge}</div>
        <div class="result-loc">📍 ${loc.zone} · ${loc.irang} · ${loc.spot}</div>
        <div class="result-cat">${p.cat}</div>
      </div>
      <div style="display:flex;gap:5px;flex-shrink:0">
        <button class="result-edit-btn"
          onclick="event.stopPropagation();openEditModal('${p.id}')">✏️ 위치변경</button>
        <button style="padding:5px 9px;background:#FFF3E0;border:1px solid #FFB74D;
          color:#E65100;border-radius:7px;font-size:16px;font-weight:700;cursor:pointer;
          font-family:inherit;white-space:nowrap"
          onclick="event.stopPropagation();openEditQuantityModal('${p.id}')">📊 수량</button>
        <button style="padding:5px 9px;background:#FFEBEE;border:1px solid #EF9A9A;
          color:#C62828;border-radius:7px;font-size:16px;font-weight:700;cursor:pointer;
          font-family:inherit;white-space:nowrap"
          onclick="event.stopPropagation();confirmDeletePlant('${p.id}','${p.name}')">🗑️ 삭제</button>
      </div>
    </div>`;
  });

  box.innerHTML = html;
}

// ── 모달 관련 ──────────────────────────────────────────────
function updateIrangOptions() {
  const zone = document.getElementById('editZone').value;
  const sel  = document.getElementById('editIrang');
  const opts = irangOptions[zone] || [];
  sel.innerHTML = opts.map(o => `<option value="${o}">${o}</option>`).join('');
}

function openEditModal(id) {
  const p = getActivePlants().find(x => x.id === id);
  if (!p) return;
  currentEditId = id;
  const loc = getPlantLoc(p);

  document.getElementById('modalTitle').textContent = p.emoji + ' ' + p.name;
  document.getElementById('modalSub').textContent   =
    loc.changed
      ? `현재: ${loc.zone} · ${loc.irang} · ${loc.spot}  (변경된 위치)`
      : `원래 위치: ${p.zone} · ${p.irang} · ${p.spot}`;

  // 폼 세팅
  document.getElementById('editZone').value = loc.zone;
  updateIrangOptions();
  document.getElementById('editIrang').value = loc.irang;
  document.getElementById('editSpot').value  = loc.spot;
  document.getElementById('editMemo').value  = locationChanges[id]?.memo || '';

  document.getElementById('editModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeModal(e) {
  if (e && e.target !== document.getElementById('editModal')) return;
  document.getElementById('editModal').classList.remove('open');
  document.body.style.overflow = '';
}

function saveLocation() {
  if (!currentEditId) return;
  // plantsDB·allPlants 양쪽에서 찾기
  const pDB = (typeof plantsDB !== 'undefined') ? plantsDB.find(x => x.id === currentEditId) : null;
  const pAP = (typeof allPlants !== 'undefined') ? allPlants.find(x => x.id === currentEditId) : null;
  const p   = pDB || pAP;
  if (!p) return;

  saveUndoSnapshot();
  const zone  = document.getElementById('editZone').value;
  const irang = document.getElementById('editIrang').value;
  const spot  = document.getElementById('editSpot').value.trim() || '미입력';
  const memo  = document.getElementById('editMemo').value.trim();
  const now   = getToday();
  const dateStr = `${now.getMonth()+1}/${now.getDate()}`;

  // ① locationChanges 업데이트 (기존 백업 시스템 유지)
  if (zone === p.zone && irang === p.irang && spot === p.spot) {
    delete locationChanges[currentEditId];
  } else {
    locationChanges[currentEditId] = {
      zone, irang, spot, memo, date: dateStr,
      origZone: p.zone, origIrang: p.irang, origSpot: p.spot,
    };
  }
  localStorage.setItem('locationChanges', JSON.stringify(locationChanges));

  // ② plantsDB 직접 업데이트 (단일 DB 통합 핵심)
  if (pDB) {
    pDB.zone  = zone;
    pDB.irang = irang;
    pDB.spot  = spot;
    pDB.updatedAt = new Date().toISOString();
    if (typeof savePlantsDBLocal === 'function') savePlantsDBLocal();
  }

  autoBackup(p.name);
  document.getElementById('editModal').classList.remove('open');
  document.body.style.overflow = '';

  // ③ 두 패널 동시 갱신
  const q = document.getElementById('searchInput')?.value || '';
  renderSearchResults(q, searchFilterMode);
  renderChangeLog();
  renderBackupList();
  // 이랑 패널이 열려 있으면 갱신
  var pIrang = document.getElementById('pm-panel-irang');
  if (pIrang && pIrang.style.display !== 'none') renderIrangInPanel();
  showToast(`✅ ${p.name} 위치 저장 완료 — 두 패널 모두 반영`);
}

// 위치 변경 이력
function renderChangeLog() {
  const card = document.getElementById('changeLogCard');
  const list = document.getElementById('changeLogList');
  if (!card || !list) return;
  const keys = Object.keys(locationChanges);
  card.style.display = keys.length ? 'block' : 'none';
  if (!keys.length) return;

  list.innerHTML = keys.map(id => {
    const p  = allPlants.find(x => x.id===id);
    const ch = locationChanges[id];
    if (!p||!ch) return '';
    return `<div class="task-item">
      <div class="task-info">
        <div class="task-name">${p.emoji} ${p.name}</div>
        <div class="task-detail" style="color:#C62828">
          이전: ${ch.origZone} · ${ch.origIrang} · ${ch.origSpot}
        </div>
        <div class="task-detail" style="color:#1B5E20">
          변경: ${ch.zone} · ${ch.irang} · ${ch.spot}
          ${ch.memo ? ` · ${ch.memo}` : ''}
        </div>
        <div class="task-location">${ch.date} 변경</div>
      </div>
      <button onclick="resetOne('${id}')" class="reset-btn">되돌리기</button>
    </div>`;
  }).join('');
}

function resetOne(id) {
  const p = allPlants.find(x => x.id===id);
  if (!p) return;
  if (!confirm(`"${p.name}" 위치를 원래대로 되돌릴까요?`)) return;
  delete locationChanges[id];
  localStorage.setItem('locationChanges', JSON.stringify(locationChanges));
  const q = document.getElementById('searchInput')?.value || '';
  renderSearchResults(q, searchFilterMode);
  renderChangeLog();
  showToast(`↩️ ${p.name} 원래 위치로 복원`);
}

function clearAllChanges() {
  if (!confirm('모든 위치 변경을 초기화할까요?\n(백업은 유지됩니다 — 필요시 복원 가능)')) return;
  // 초기화 전 자동 백업
  if (Object.keys(locationChanges).length > 0) {
    const safeEntry = {
      id:      getTimestamp(),
      label:   '전체 초기화 전 자동 안전 백업',
      dateStr: getDateTimeStr(),
      changes: JSON.parse(JSON.stringify(locationChanges)),
      note:    '전체 초기화 직전 자동 저장',
      auto:    true,
    };
    backupHistory.unshift(safeEntry);
    if (backupHistory.length > 30) backupHistory = backupHistory.slice(0, 30);
    localStorage.setItem('backupHistory', JSON.stringify(backupHistory));
  }
  locationChanges = {};
  localStorage.setItem('locationChanges', JSON.stringify(locationChanges));
  const q = document.getElementById('searchInput')?.value || '';
  renderSearchResults(q, searchFilterMode);
  renderChangeLog();
  renderBackupList();
  showToast('🗑️ 초기화 완료 · 백업에서 복원 가능');
}

// ══════════════════════════════════════════════════════════
// 날짜별 백업 · 되돌리기 시스템
// ══════════════════════════════════════════════════════════
let backupHistory = JSON.parse(localStorage.getItem('backupHistory') || '[]');
// 형식: [{id, label, timestamp, dateStr, changes:{...}, note, auto}]

function getTimestamp() {
  const d = new Date();
  return 'bk_' + d.getTime() + '_' + Math.random().toString(36).slice(2,7); // 고유 문자열 ID
}

function getDateTimeStr() {
  const d = SELECTED_DATE;
  const r = new Date(); // 실제 현재 시각 (시분 표시용)
  const pad = n => String(n).padStart(2,'0');
  return `${d.getFullYear()}.${pad(d.getMonth()+1)}.${pad(d.getDate())} `
       + `${pad(r.getHours())}:${pad(r.getMinutes())}`;
}

// 자동 백업 (위치 저장 시 호출)
function autoBackup(plantName) {
  const changes = JSON.parse(JSON.stringify(locationChanges)); // 딥카피
  const changedCount = Object.keys(changes).length;
  if (changedCount === 0) return;

  const entry = {
    id:        getTimestamp(),
    label:     `자동 백업 — ${plantName} 위치 변경`,
    dateStr:   getDateTimeStr(),
    changes,
    note:      '',
    auto:      true,
  };
  backupHistory.unshift(entry);
  // 최대 30개 보관
  if (backupHistory.length > 30) backupHistory = backupHistory.slice(0, 30);
  localStorage.setItem('backupHistory', JSON.stringify(backupHistory));
  renderBackupList();
}

// 수동 백업
function createManualBackup() {
  const changedCount = Object.keys(locationChanges).length;
  if (changedCount === 0) {
    showToast('⚠️ 변경된 위치가 없어 백업할 내용이 없습니다');
    return;
  }
  const label = prompt('백업 이름을 입력하세요 (예: 5월 배치 확정)', getDateTimeStr() + ' 수동 백업');
  if (label === null) return; // 취소

  const changes = JSON.parse(JSON.stringify(locationChanges));
  const entry = {
    id:      getTimestamp(),
    label:   label || getDateTimeStr() + ' 수동 백업',
    dateStr: getDateTimeStr(),
    changes,
    note:    '수동 백업',
    auto:    false,
  };
  backupHistory.unshift(entry);
  if (backupHistory.length > 30) backupHistory = backupHistory.slice(0, 30);
  localStorage.setItem('backupHistory', JSON.stringify(backupHistory));
  renderBackupList();
  showToast('💾 수동 백업 완료 — ' + entry.label + ' · ' + _storageInfoStr());
}

// 백업으로 되돌리기
function restoreBackup(backupId) {
  const entry = backupHistory.find(b => String(b.id) === String(backupId));
  if (!entry) return;

  const changedNames = Object.keys(entry.changes).map(id => {
    const p = allPlants.find(x => x.id === id);
    return p ? p.name : id;
  }).slice(0, 3).join(', ') + (Object.keys(entry.changes).length > 3 ? ' 외' : '');

  if (!confirm(
    `"${entry.label}"
(${entry.dateStr})

`
    + `이 시점으로 되돌립니다.
변경된 항목: ${Object.keys(entry.changes).length}개 (${changedNames})

현재 위치 변경 내용은 덮어씌워집니다.`
  )) return;

  // 현재 상태를 먼저 자동 백업 (복원 전 안전 백업)
  const safeBackup = {
    id:      getTimestamp(),
    label:   '복원 전 자동 안전 백업',
    dateStr: getDateTimeStr(),
    changes: JSON.parse(JSON.stringify(locationChanges)),
    note:    `"${entry.label}" 복원 전 자동 저장`,
    auto:    true,
  };
  if (Object.keys(locationChanges).length > 0) {
    backupHistory.unshift(safeBackup);
    if (backupHistory.length > 30) backupHistory = backupHistory.slice(0, 30);
  }

  // 복원
  locationChanges = JSON.parse(JSON.stringify(entry.changes));
  localStorage.setItem('locationChanges', JSON.stringify(locationChanges));
  localStorage.setItem('backupHistory',  JSON.stringify(backupHistory));

  // UI 갱신
  const q = document.getElementById('searchInput')?.value || '';
  renderSearchResults(q, searchFilterMode);
  renderChangeLog();
  renderBackupList();
  showToast(`↩️ "${entry.label}" 으로 복원 완료`);
}

// 백업 단건 삭제
function deleteBackup(backupId) {
  const entry = backupHistory.find(b => String(b.id) === String(backupId));
  if (!entry) return;
  if (!confirm(`"${entry.label}" 백업을 삭제할까요?`)) return;
  backupHistory = backupHistory.filter(b => String(b.id) !== String(backupId));
  localStorage.setItem('backupHistory', JSON.stringify(backupHistory));
  renderBackupList();
  showToast('🗑️ 백업 삭제 완료');
}

// 백업 바로가기 — 해당 위치로 스크롤 + 강조 (카드는 항상 펼쳐져 있음)
function openBackupCard() {
  var card = document.getElementById('backupCard');
  if (!card) return;
  try { renderBackupList(); } catch(e){}
  // 살짝 강조 효과
  card.style.transition = 'box-shadow 0.3s';
  card.style.boxShadow = '0 0 0 3px #FFD54F';
  setTimeout(function(){ card.style.boxShadow = ''; }, 1400);
  card.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// 백업 목록 렌더
function renderBackupList() {
  const box = document.getElementById('backupList');
  // 헤더 개수 라벨 갱신
  const cntLabel = document.getElementById('backupCountLabel');
  const n0 = (typeof backupHistory !== 'undefined' && backupHistory) ? backupHistory.length : 0;
  if (cntLabel) {
    cntLabel.textContent = n0 ? ('백업 ' + n0 + '개') : '';
  }
  // 바로가기 버튼 배지 갱신
  const gotoCnt = document.getElementById('backupGotoCount');
  if (gotoCnt) gotoCnt.textContent = n0 ? ('(' + n0 + '개)') : '';
  // 백업 용량 표시 (제목 아래)
  const usageEl = document.getElementById('usageBackup');
  if (usageEl) {
    let bytes = 0;
    try { bytes = (localStorage.getItem('backupHistory') || '').length * 2; } catch(e) {}
    usageEl.textContent = n0
      ? ('💽 백업 용량 ' + (typeof _fmtBytes==='function' ? _fmtBytes(bytes) : (bytes+' B')) + ' · ' + n0 + '개 보관 중')
      : '💽 저장된 백업이 없습니다';
  }
  if (!box) return;
  if (!backupHistory.length) {
    box.innerHTML = '<div class="backup-empty">💾 아직 백업이 없습니다<br>위치를 변경하면 자동 백업됩니다</div>';
    return;
  }

  box.innerHTML = backupHistory.map(b => {
    if (!b || typeof b !== 'object') return '';
    if (!b.changes || typeof b.changes !== 'object') b.changes = {};
    const count = Object.keys(b.changes).length;
    // 변경 항목 이름 최대 3개 미리보기
    const names = Object.keys(b.changes).slice(0, 3).map(id => {
      const p = allPlants.find(x => x.id === id);
      const ch = b.changes[id];
      return p ? `${p.emoji} ${p.name} → ${ch.irang}` : id;
    }).join(' · ');
    const more = count > 3 ? ` 외 ${count-3}개` : '';
    const autoBadge = b.auto ? '<span class="auto-backup-badge">자동</span>' : '';

    const dateBadge = b.selectedDate
      ? `<span style="font-size:10px;background:#E3F2FD;color:#1565C0;padding:2px 7px;border-radius:10px;font-weight:700;margin-left:4px">📅 ${b.selectedDate}</span>`
      : '';
    return `<div class="backup-item">
      <div class="backup-header">
        <span class="backup-date">${b.dateStr} ${autoBadge}${dateBadge}</span>
        <span class="backup-count">${count}개 변경</span>
      </div>
      <div style="font-size:17px;font-weight:600;color:#424242;margin-bottom:3px">${b.label}</div>
      <div class="backup-detail">${names}${more}</div>
      ${b.note && !b.auto ? `<div style="font-size:10px;color:#9E9E9E;margin-top:2px">📝 ${b.note}</div>` : ''}
      <div class="backup-actions">
        <button class="btn-restore"    onclick="restoreBackup('${b.id}')">↩️ 복원</button>
        <button class="btn-del-backup" onclick="deleteBackup('${b.id}')">🗑️ 삭제</button>
      </div>
    </div>`;
  }).join('');
}

// ── 즉시 되돌리기 (마지막 변경 취소) ─────────────────────
let lastChangeSnapshot = null; // 직전 locationChanges 스냅샷

function saveUndoSnapshot() {
  lastChangeSnapshot = JSON.parse(JSON.stringify(locationChanges));
  const btn = document.getElementById('undoBtn');
  if (btn) btn.disabled = false;
}

function undoLastChange() {
  if (!lastChangeSnapshot) {
    showToast('⚠️ 되돌릴 변경 내용이 없습니다');
    return;
  }
  if (!confirm('마지막 위치 변경을 취소할까요?')) return;
  locationChanges = JSON.parse(JSON.stringify(lastChangeSnapshot));
  lastChangeSnapshot = null;
  localStorage.setItem('locationChanges', JSON.stringify(locationChanges));
  const btn = document.getElementById('undoBtn');
  if (btn) btn.disabled = true;
  const q = document.getElementById('searchInput')?.value || '';
  renderSearchResults(q, searchFilterMode);
  renderChangeLog();
  renderBackupList();
  showToast('↩️ 마지막 변경 취소 완료');
}

// 선택된 날짜로 백업 (날짜 레이블 포함)
function createDateBackup() {
  const changedCount = Object.keys(locationChanges).length;
  const d = SELECTED_DATE;
  const dayNames = ['일','월','화','수','목','금','토'];
  const dateLabel = `${d.getMonth()+1}/${d.getDate()}(${dayNames[d.getDay()]})`;

  if (changedCount === 0) {
    showToast('⚠️ 변경된 위치가 없어 백업할 내용이 없습니다');
    return;
  }
  const label = `📅 ${dateLabel} 날짜 백업`;
  const changes = JSON.parse(JSON.stringify(locationChanges));
  const entry = {
    id:      Date.now(),
    label,
    dateStr: getDateTimeStr(),
    selectedDate: toYMD(d),
    changes,
    note:    `선택 날짜 ${dateLabel} 기준 백업`,
    auto:    false,
  };
  backupHistory.unshift(entry);
  if (backupHistory.length > 30) backupHistory = backupHistory.slice(0, 30);
  localStorage.setItem('backupHistory', JSON.stringify(backupHistory));
  renderBackupList();
  showToast(`💾 ${dateLabel} 날짜 백업 완료 · ` + _storageInfoStr());
}

// 전체 백업 삭제
function clearAllBackups() {
  if (!backupHistory.length) { showToast('백업이 없습니다'); return; }
  if (!confirm(`백업 ${backupHistory.length}개를 모두 삭제할까요?`)) return;
  backupHistory = [];
  localStorage.setItem('backupHistory', JSON.stringify(backupHistory));
  renderBackupList();
  showToast('🗑️ 전체 백업 삭제 완료');
}

// ══════════════════════════════════════════════════════════
// 달력 날짜 선택기
// ══════════════════════════════════════════════════════════
let calYear  = 0;
let calMonth = 0;  // 0-indexed
let calTempDate = null; // 선택 중인 날짜 (확정 전)

// 작업 있는 날짜 계산 (월별 캐시)
function hasTasks(y, m, d) {
  const dt = new Date(y, m, d);
  return getDateTasks(dt).length > 0;
}

function calOpen() {
  const d  = SELECTED_DATE;
  calYear  = d.getFullYear();
  calMonth = d.getMonth();
  calTempDate = new Date(d);
  renderCal();
  document.getElementById('calModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function calClose() {
  document.getElementById('calModal').classList.remove('open');
  document.body.style.overflow = '';
}

function calOverlayClick(e) {
  if (e.target === document.getElementById('calModal')) calClose();
}

function calMonthMove(dir) {
  calMonth += dir;
  if (calMonth > 11) { calMonth = 0;  calYear++; }
  if (calMonth < 0)  { calMonth = 11; calYear--; }
  renderCal();
}

function calYearMove(dir) {
  calYear += dir;
  renderCal();
}

function calSelectDay(y, m, d) {
  calTempDate = new Date(y, m, d);
  renderCalDays(); // 날짜만 다시 그림
  // 선택 표시 업데이트
  const dayNames = ['일','월','화','수','목','금','토'];
  const dn = dayNames[calTempDate.getDay()];
  document.getElementById('calSelectedDisplay').textContent =
    `선택: ${y}년 ${m+1}월 ${d}일(${dn})`;
}

function calConfirm() {
  if (!calTempDate) return;
  SELECTED_DATE = new Date(calTempDate);
  localStorage.setItem('selectedDate', toYMD(SELECTED_DATE));
  calClose();
  renderAll();
}

// 달력 전체 렌더
function renderCal() {
  // 헤더
  const monthNames = ['1월','2월','3월','4월','5월','6월',
                      '7월','8월','9월','10월','11월','12월'];
  document.getElementById('calYearLabel').textContent  = calYear + '년';
  document.getElementById('calMonthLabel').textContent = monthNames[calMonth];

  // 선택 날짜 표시
  const dayNames = ['일','월','화','수','목','금','토'];
  if (calTempDate) {
    const dn = dayNames[calTempDate.getDay()];
    document.getElementById('calSelectedDisplay').textContent =
      `선택: ${calTempDate.getFullYear()}년 ${calTempDate.getMonth()+1}월 ${calTempDate.getDate()}일(${dn})`;
  }

  // 빠른 월 이동 버튼 (4~11월 농사 시즌)
  const quickBox = document.getElementById('calQuickMonths');
  const farmMonths = [4,5,6,7,8,9,10,11];
  quickBox.innerHTML = farmMonths.map(m => {
    const active = (m-1 === calMonth && calYear === new Date().getFullYear())
                   ? 'active-month' : '';
    return `<button class="cal-quick-btn ${active}"
      onclick="calYear=${calYear};calMonth=${m-1};renderCal()">${m}월</button>`;
  }).join('') + `<button class="cal-quick-btn" onclick="calGoToday()">오늘</button>`;

  renderCalDays();
}

function calGoToday() {
  const t = new Date();
  calYear  = t.getFullYear();
  calMonth = t.getMonth();
  calTempDate = new Date(t);
  calTempDate.setHours(0,0,0,0);
  renderCal();
}

// 날짜 셀만 렌더 (빠른 갱신용)
function renderCalDays() {
  const box  = document.getElementById('calDays');
  const today = REAL_TODAY;
  const selY  = calTempDate ? calTempDate.getFullYear() : -1;
  const selM  = calTempDate ? calTempDate.getMonth()    : -1;
  const selD  = calTempDate ? calTempDate.getDate()     : -1;

  // 해당 월 1일 요일, 마지막 날
  const firstDay  = new Date(calYear, calMonth, 1).getDay();
  const lastDate  = new Date(calYear, calMonth+1, 0).getDate();
  // 이전 달 마지막 날
  const prevLast  = new Date(calYear, calMonth, 0).getDate();

  let cells = '';

  // 이전 달 빈 칸
  for (let i = 0; i < firstDay; i++) {
    const d = prevLast - firstDay + 1 + i;
    cells += `<button class="cal-day other-month" 
      onclick="calMonth > 0 ? calMonth-- : (calMonth=11,calYear--); calSelectDay(calYear,calMonth,${d}); renderCal()">
      ${d}</button>`;
  }

  // 이번 달
  for (let d = 1; d <= lastDate; d++) {
    const dt  = new Date(calYear, calMonth, d);
    const dow = dt.getDay();
    const isToday_  = calYear === today.getFullYear()
                   && calMonth === today.getMonth()
                   && d === today.getDate();
    const isSel     = calYear === selY && calMonth === selM && d === selD;
    const taskDot   = hasTasks(calYear, calMonth, d) ? 'has-tasks' : '';
    const dowCls    = dow === 0 ? 'sunday' : dow === 6 ? 'saturday' : '';
    const cls = [
      'cal-day',
      isToday_ ? 'today' : '',
      isSel    ? 'selected' : '',
      taskDot,
      dowCls,
    ].filter(Boolean).join(' ');

    cells += `<button class="${cls}"
      onclick="calSelectDay(${calYear},${calMonth},${d})">${d}</button>`;
  }

  // 다음 달 빈 칸 (6줄 맞춤)
  const total = firstDay + lastDate;
  const remain = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let i = 1; i <= remain; i++) {
    cells += `<button class="cal-day other-month"
      onclick="calMonth < 11 ? calMonth++ : (calMonth=0,calYear++); calSelectDay(calYear,calMonth,${i}); renderCal()">
      ${i}</button>`;
  }

  box.innerHTML = cells;
}

function scrollToPruningList() {
  const el = document.getElementById('pruningListCard');
  if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
}

// ── 전정 가이드 날씨 (Open-Meteo 무료 API) ──────────────────
async function loadPruningWeather() {
  const body  = document.getElementById('pruningWeatherBody');
  const title = document.getElementById('pruningDateTitle');
  const btn   = document.getElementById('weatherRefreshBtn');
  if (!body) return;

  const d = REAL_TODAY;
  const dayNames = ['일','월','화','수','목','금','토'];
  const dateStr = `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일(${dayNames[d.getDay()]})`;
  if (title) title.textContent = `${dateStr} 전정 — 날씨 및 핵심 원칙`;
  if (btn) btn.textContent = '⏳ 로딩중...';
  body.innerHTML = `<div style="text-align:center;padding:16px;color:#9E9E9E">
    <div style="font-size:24px">🌤️</div>
    <div style="font-size:16px;margin-top:6px">날씨 불러오는 중...</div></div>`;

  function vec2dir(deg) {
    const dirs = ['북','북북동','북동','동북동','동','동남동','남동','남남동',
                  '남','남남서','남서','서남서','서','서북서','북서','북북서'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  // WMO 코드 → 상세 날씨 정보
  function wmo2info(code) {
    if (code === 0)  return {icon:'☀️', label:'맑음',       bg:'#FFFDE7', tc:'#F57F17'};
    if (code === 1)  return {icon:'🌤️', label:'대체로 맑음', bg:'#FFFDE7', tc:'#F57F17'};
    if (code === 2)  return {icon:'⛅',  label:'구름 많음',  bg:'#ECEFF1', tc:'#546E7A'};
    if (code === 3)  return {icon:'☁️', label:'흐림',       bg:'#ECEFF1', tc:'#546E7A'};
    if (code === 45) return {icon:'🌫️', label:'안개',       bg:'#ECEFF1', tc:'#546E7A'};
    if (code === 48) return {icon:'🌫️', label:'짙은 안개 (서리 안개)', bg:'#ECEFF1', tc:'#455A64'};
    if (code === 51) return {icon:'🌦️', label:'이슬비 (약)',  bg:'#E3F2FD', tc:'#1565C0'};
    if (code === 53) return {icon:'🌦️', label:'이슬비 (보통)', bg:'#E3F2FD', tc:'#1565C0'};
    if (code === 55) return {icon:'🌧️', label:'이슬비 (강)',  bg:'#E3F2FD', tc:'#0D47A1'};
    if (code === 61) return {icon:'🌧️', label:'비 (약)',     bg:'#E3F2FD', tc:'#1565C0'};
    if (code === 63) return {icon:'🌧️', label:'비 (보통)',   bg:'#BBDEFB', tc:'#0D47A1'};
    if (code === 65) return {icon:'🌧️', label:'비 (강)',     bg:'#90CAF9', tc:'#0D47A1'};
    if (code === 71) return {icon:'❄️', label:'눈 (약)',     bg:'#E8F5E9', tc:'#1B5E20'};
    if (code === 73) return {icon:'❄️', label:'눈 (보통)',   bg:'#C8E6C9', tc:'#1B5E20'};
    if (code === 75) return {icon:'❄️', label:'눈 (강)',     bg:'#A5D6A7', tc:'#1B5E20'};
    if (code === 77) return {icon:'🌨️', label:'싸락눈',      bg:'#E8F5E9', tc:'#2E7D32'};
    if (code === 80) return {icon:'🌦️', label:'소나기 (약)', bg:'#E3F2FD', tc:'#1565C0'};
    if (code === 81) return {icon:'🌧️', label:'소나기 (보통)',bg:'#BBDEFB', tc:'#0D47A1'};
    if (code === 82) return {icon:'⛈️', label:'강한 소나기', bg:'#90CAF9', tc:'#0D47A1'};
    if (code === 85) return {icon:'🌨️', label:'눈 소나기',   bg:'#E8F5E9', tc:'#2E7D32'};
    if (code === 95) return {icon:'⛈️', label:'뇌우',        bg:'#FFEBEE', tc:'#C62828'};
    if (code === 96) return {icon:'⛈️', label:'뇌우+우박',   bg:'#FFEBEE', tc:'#C62828'};
    if (code === 99) return {icon:'⛈️', label:'강한 뇌우+우박',bg:'#FFEBEE',tc:'#B71C1C'};
    return {icon:'🌤️', label:'맑음', bg:'#FFFDE7', tc:'#F57F17'};
  }

  // 서리 위험 평가
  function frostRisk(minTemp) {
    if (minTemp <= 0)  return {level:'⚠️ 서리 위험!', bg:'#FFEBEE', tc:'#C62828', tip:'절단면·신초 동해 주의'};
    if (minTemp <= 3)  return {level:'🟡 서리 주의',  bg:'#FFF3E0', tc:'#E65100', tip:'새벽 기온 확인 필요'};
    return null;
  }

  // 안개 평가
  function fogInfo(wcode, humidity) {
    const isFog = (wcode === 45 || wcode === 48);
    if (isFog) return {warn:true,  msg:'⚠ 안개 — 약제 살포 효과 없음', bg:'#ECEFF1', tc:'#455A64'};
    if (humidity >= 90) return {warn:false, msg:'💧 고습도 — 안개 발생 가능', bg:'#E3F2FD', tc:'#1565C0'};
    return null;
  }

  try {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=37.1994&longitude=126.8316'
      + '&daily=temperature_2m_max,temperature_2m_min,'
      + 'precipitation_probability_max,windspeed_10m_max,'
      + 'winddirection_10m_dominant,weathercode,'
      + 'precipitation_sum,snowfall_sum,et0_fao_evapotranspiration'
      + '&hourly=relativehumidity_2m,dewpoint_2m,visibility,freezinglevel_height'
      + '&current_weather=true'
      + '&timezone=Asia%2FSeoul&forecast_days=1';

    const res  = await fetch(url);
    if (!res.ok) throw new Error('서버 오류 ' + res.status);
    const data = await res.json();

    const curr    = data.current_weather;
    const daily   = data.daily;
    const hourly  = data.hourly;

    const maxTemp  = Math.round(daily.temperature_2m_max[0]);
    const minTemp  = Math.round(daily.temperature_2m_min[0]);
    const windMs   = (daily.windspeed_10m_max[0] / 3.6).toFixed(1);
    const rainPct  = daily.precipitation_probability_max[0];
    const windDir  = vec2dir(daily.winddirection_10m_dominant[0]);
    const wcode    = daily.weathercode[0];
    const precip   = daily.precipitation_sum[0];       // mm
    const snowfall = daily.snowfall_sum[0];             // cm
    const curTemp  = Math.round(curr.temperature);
    const curWind  = (curr.windspeed / 3.6).toFixed(1);

    // 시간별 평균 습도 (오전 6~18시)
    const humHours = hourly.relativehumidity_2m.slice(6, 18);
    const avgHum   = Math.round(humHours.reduce((a,b)=>a+b,0) / humHours.length);

    // 최저 시정 (오전 6~18시)
    const visHours = hourly.visibility ? hourly.visibility.slice(6, 18) : [];
    const minVis   = visHours.length ? Math.min(...visHours) : 999999;

    // 날씨 정보
    const winfo  = wmo2info(wcode);
    const frost  = frostRisk(minTemp);
    const fog    = fogInfo(wcode, avgHum);

    // 추가 기상 알림 생성
    const alerts = [];
    if (frost)       alerts.push(frost);
    if (fog)         alerts.push(fog);
    if (snowfall > 0) alerts.push({level:`❄️ 적설 ${snowfall.toFixed(1)}cm`, bg:'#E8F5E9', tc:'#1B5E20', tip:'노지 작업 주의'});
    if (precip > 10)  alerts.push({level:`🌧️ 강수량 ${precip.toFixed(1)}mm`, bg:'#E3F2FD', tc:'#1565C0', tip:'작업 취소 고려'});
    if (minVis < 500) alerts.push({level:`🌫️ 시정 ${(minVis/1000).toFixed(1)}km — 짙은 안개`, bg:'#ECEFF1', tc:'#455A64', tip:'약제 살포 금지'});

    // 전정 조건
    let tempBg='#E3F2FD', tempTc='#1565C0', tempCond='전정 가능';
    if      (maxTemp >= 15) { tempBg='#E8F5E9'; tempTc='#1B5E20'; tempCond='전정 최적 ✅'; }
    else if (maxTemp < 10)  { tempBg='#FFF3E0'; tempTc='#E65100'; tempCond='⚠ 기온 낮음'; }

    let windBg='#E8F5E9', windTc='#1B5E20', windCond='작업 양호 ✅';
    if      (windMs >= 10) { windBg='#FFEBEE'; windTc='#C62828'; windCond='⚠ 강풍 주의'; }
    else if (windMs >= 5)  { windBg='#FFF3E0'; windTc='#E65100'; windCond='바람 보통'; }

    let rainBg='#E8F5E9', rainTc='#1B5E20';
    if      (rainPct >= 70) { rainBg='#FFEBEE'; rainTc='#C62828'; }
    else if (rainPct >= 40) { rainBg='#FFF3E0'; rainTc='#E65100'; }

    body.innerHTML = `
      <!-- 날씨 상태 메인 배지 -->
      <div style="background:${winfo.bg};border-radius:10px;padding:12px 14px;
        margin-bottom:8px;display:flex;align-items:center;gap:12px">
        <div style="font-size:40px;line-height:1">${winfo.icon}</div>
        <div>
          <div style="font-size:18px;font-weight:800;color:${winfo.tc}">${winfo.label}</div>
          <div style="font-size:16px;color:${winfo.tc};opacity:0.85;margin-top:2px">
            현재 ${curTemp}°C · 풍속 ${curWind}m/s · 습도 ${avgHum}%
          </div>
        </div>
      </div>

      <!-- 4분할 기상 정보 -->
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-bottom:8px">
        <div style="background:${tempBg};border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:${tempTc};font-weight:700">최고 / 최저기온</div>
          <div style="font-size:22px;font-weight:800;color:${tempTc}">${maxTemp}° / ${minTemp}°</div>
          <div style="font-size:10px;color:${tempTc}">${tempCond}</div>
        </div>
        <div style="background:${windBg};border-radius:8px;padding:10px;text-align:center">
          <div style="font-size:10px;color:${windTc};font-weight:700">최대풍속</div>
          <div style="font-size:20px;font-weight:800;color:${windTc}">${windDir} ${windMs}m/s</div>
          <div style="font-size:10px;color:${windTc}">${windCond}</div>
        </div>
        <div style="background:${rainBg};border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:10px;color:${rainTc};font-weight:700">강수확률 / 강수량</div>
          <div style="font-size:18px;font-weight:800;color:${rainTc}">${rainPct}%${precip>0?' · '+precip.toFixed(1)+'mm':''}</div>
        </div>
        <div style="background:#F5F5F5;border-radius:8px;padding:8px;text-align:center">
          <div style="font-size:10px;color:#546E7A;font-weight:700">습도 / 일교차</div>
          <div style="font-size:18px;font-weight:800;color:#37474F">${avgHum}% / ${maxTemp-minTemp}°C</div>
        </div>
      </div>

      <!-- 적설 표시 (눈이 올 경우) -->
      ${snowfall > 0 ? `
      <div style="background:#E8F5E9;border-radius:8px;padding:9px 12px;margin-bottom:8px;
        display:flex;align-items:center;gap:8px">
        <span style="font-size:22px">❄️</span>
        <div>
          <div style="font-size:16px;font-weight:700;color:#1B5E20">적설 예보 ${snowfall.toFixed(1)}cm</div>
          <div style="font-size:16px;color:#2E7D32">노지 전정 작업 시 미끄럼 주의</div>
        </div>
      </div>` : ''}

      <!-- 기상 알림 (서리·안개·강수 등) -->
      ${alerts.map(a => `
      <div style="background:${a.bg};border-radius:8px;padding:9px 12px;margin-bottom:7px;
        display:flex;align-items:center;gap:8px">
        <div style="flex:1">
          <div style="font-size:16px;font-weight:700;color:${a.tc}">${a.level}</div>
          ${a.tip ? `<div style="font-size:16px;color:${a.tc};opacity:0.9;margin-top:2px">${a.tip}</div>` : ''}
        </div>
      </div>`).join('')}

      <!-- 오늘 전정 원칙 -->
      <div style="background:#E8F5E9;border-radius:8px;padding:10px">
        <div style="font-size:16px;font-weight:700;color:#1B5E20;margin-bottom:5px">오늘 전정 핵심 원칙</div>
        <div style="font-size:16px;color:#2E7D32;line-height:2.0">
          ① 강전정 금지 — 식재 직후 어린 묘목, 약전정만<br>
          ② 절단면 처리 필수 — 모든 절단 즉시 톱신페이스트<br>
          ③ 기온 ${maxTemp}°C ${maxTemp>=10?'✅ 작업 가능 (10시 이후)':'⚠ 낮음 — 오후 권장'}<br>
          ④ 풍속 ${windMs}m/s ${parseFloat(windMs)>=7?'⚠ 강풍 — 절단면 건조 주의':'— 작업 양호'}${wcode===45||wcode===48?'<br>⑤ 안개 — 약제 살포 금지':''}
        </div>
      </div>
      <div style="font-size:10px;color:#BDBDBD;text-align:right;margin-top:6px">
        화성시 남양읍 · 방금 갱신
      </div>`;

    if (btn) btn.textContent = '🔄 날씨갱신';

  } catch(err) {
    console.error('날씨 오류:', err);
    body.innerHTML = `
      <div style="background:#FFEBEE;border-radius:8px;padding:12px;margin-bottom:10px;text-align:center">
        <div style="font-size:17px;color:#C62828;font-weight:700">⚠ 날씨를 불러올 수 없습니다</div>
        <div style="font-size:16px;color:#E53935;margin-top:4px">인터넷 연결 확인 후 🔄 날씨갱신을 눌러주세요</div>
      </div>
      <div style="background:#E8F5E9;border-radius:8px;padding:10px">
        <div style="font-size:16px;font-weight:700;color:#1B5E20;margin-bottom:4px">전정 핵심 원칙</div>
        <div style="font-size:16px;color:#2E7D32;line-height:1.9">
          ① 강전정 금지 — 식재 직후 어린 묘목, 약전정만<br>
          ② 절단면 처리 필수 — 모든 절단 즉시 톱신페이스트<br>
          ③ 오전 10시 이후 시작 — 기온 10°C 이상 확인<br>
          ④ 강풍 대비 — 절단면 빠른 건조 우려 시 방향 조정
        </div>
      </div>`;
    if (btn) btn.textContent = '🔄 날씨갱신';
  }
}

// ── 14일 장기예보 ─────────────────────────────────────────
let forecastLoaded = false;

function toggleForecast() {
  const panel = document.getElementById('forecastPanel');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen && !forecastLoaded) loadForecast();
  if (!isOpen) panel.scrollIntoView({behavior:'smooth', block:'start'});
}

async function loadForecast() {
  const body = document.getElementById('forecastBody');
  if (!body) return;

  function vec2dir(deg) {
    const dirs = ['북','북북동','북동','동북동','동','동남동','남동','남남동',
                  '남','남남서','남서','서남서','서','서북서','북서','북북서'];
    return dirs[Math.round(deg / 22.5) % 16];
  }

  function wmo2icon(code) {
    if (code === 0)  return '☀️';
    if (code <= 2)   return '🌤️';
    if (code === 3)  return '☁️';
    if (code <= 48)  return '🌫️';
    if (code <= 55)  return '🌦️';
    if (code <= 67)  return '🌧️';
    if (code <= 77)  return '❄️';
    if (code <= 82)  return '🌦️';
    return '⛈️';
  }

  function wmo2label(code) {
    if (code === 0)  return '맑음';
    if (code === 1)  return '대체로 맑음';
    if (code === 2)  return '구름 많음';
    if (code === 3)  return '흐림';
    if (code === 45 || code === 48) return '안개';
    if (code <= 55)  return '이슬비';
    if (code <= 65)  return '비';
    if (code <= 67)  return '진눈깨비';
    if (code <= 77)  return '눈';
    if (code <= 82)  return '소나기';
    if (code <= 99)  return '뇌우';
    return '맑음';
  }

  // 작업 적합도 평가
  function workScore(maxT, minT, windMs, rainPct, snowfall) {
    if (rainPct >= 70 || snowfall > 0.5) return {label:'작업 불가', bg:'#FFEBEE', tc:'#C62828', bar:0};
    if (rainPct >= 40) return {label:'작업 주의', bg:'#FFF3E0', tc:'#E65100', bar:30};
    if (maxT < 5)      return {label:'기온 낮음', bg:'#FFF3E0', tc:'#E65100', bar:30};
    if (windMs >= 10)  return {label:'강풍 주의', bg:'#FFF3E0', tc:'#E65100', bar:40};
    if (maxT >= 10 && maxT < 15) return {label:'작업 가능', bg:'#E3F2FD', tc:'#1565C0', bar:65};
    if (maxT >= 15 && maxT < 30) return {label:'작업 최적', bg:'#E8F5E9', tc:'#1B5E20', bar:100};
    if (maxT >= 30)    return {label:'폭염 주의', bg:'#FFF3E0', tc:'#E65100', bar:40};
    return {label:'작업 가능', bg:'#E3F2FD', tc:'#1565C0', bar:65};
  }

  try {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=37.1994&longitude=126.8316'
      + '&daily=temperature_2m_max,temperature_2m_min,'
      + 'precipitation_probability_max,windspeed_10m_max,'
      + 'winddirection_10m_dominant,weathercode,'
      + 'precipitation_sum,snowfall_sum,uv_index_max'
      + '&timezone=Asia%2FSeoul&forecast_days=14';

    const res  = await fetch(url);
    if (!res.ok) throw new Error('서버 오류');
    const data = await res.json();
    const daily = data.daily;
    const N = daily.time.length;

    const dayNames = ['일','월','화','수','목','금','토'];

    // 월별 농사 핵심 작업
    const monthWork = {
      4:  '다래·으름 점검 · 유실수 개화 확인',
      5:  '수박·오이·참외 정식 · 머루콩 파종 · 생강 심기',
      6:  '마늘·양파 수확 · 동부 파종 · 장마 전 방제',
      7:  '블랙베리 수확 · 수박 착과 · 병해 방제',
      8:  '수박 수확(8/20전) · 김장무 파종(8/20)',
      9:  '양파 정식 · 생강 수확 준비 · 배추 정식',
      10: '고구마·생강 수확 · 마늘 파종',
      11: '콩류 수확 · 배추 수확 · 유실수 전정 준비',
    };

    let html = '';

    // 주차별 그룹핑
    let weekGroup = -1;
    for (let i = 0; i < N; i++) {
      const dateStr = daily.time[i];
      const dt      = new Date(dateStr + 'T00:00:00');
      const dow     = dt.getDay();
      const month   = dt.getMonth() + 1;
      const mday    = dt.getDate();
      const isWeekend = (dow === 0 || dow === 6);

      const maxT  = Math.round(daily.temperature_2m_max[i]);
      const minT  = Math.round(daily.temperature_2m_min[i]);
      const windKmh = daily.windspeed_10m_max[i];
      const windMs  = (windKmh / 3.6).toFixed(1);
      const rainPct = daily.precipitation_probability_max[i];
      const windDir = vec2dir(daily.winddirection_10m_dominant[i]);
      const wcode   = daily.weathercode[i];
      const precip  = daily.precipitation_sum[i] || 0;
      const snow    = daily.snowfall_sum[i] || 0;
      const wicon   = wmo2icon(wcode);
      const wlabel  = wmo2label(wcode);
      const score   = workScore(maxT, minT, parseFloat(windMs), rainPct, snow);

      // 오늘 여부
      const todayDt = new Date(); todayDt.setHours(0,0,0,0);
      const isToday = dt.getTime() === todayDt.getTime();

      // 주말 배경 강조
      const rowBg = isToday ? '#E8F5E9' : isWeekend ? '#FFF9C4' : 'white';
      const rowBorder = isToday ? '2px solid #2E7D32' : isWeekend ? '1.5px solid #F9A825' : '1px solid #F0F0F0';

      // 서리 경고
      const frostWarn = minT <= 0 ? ' ❄️서리' : minT <= 3 ? ' 🟡서리주의' : '';

      html += `
        <div onclick="toggleFcDetail(${i})"
          style="background:${rowBg};border:${rowBorder};border-radius:10px;
          padding:11px 12px;margin-bottom:6px;cursor:pointer">
          <div style="display:flex;align-items:center;gap:8px">
            <!-- 날짜 -->
            <div style="width:52px;flex-shrink:0">
              <div style="font-size:${isToday?'13px':'12px'};font-weight:${isToday?'800':'700'};
                color:${isWeekend?(dow===0?'#C62828':'#1565C0'):'#37474F'}">
                ${isToday?'오늘 ':''}${month}/${mday}(${dayNames[dow]})
              </div>
            </div>
            <!-- 날씨 아이콘 -->
            <div style="font-size:22px;flex-shrink:0">${wicon}</div>
            <!-- 기온 -->
            <div style="flex-shrink:0;text-align:center;min-width:54px">
              <span style="font-size:15px;font-weight:800;color:#C62828">${maxT}°</span>
              <span style="font-size:17px;color:#9E9E9E"> / </span>
              <span style="font-size:17px;font-weight:600;color:#1565C0">${minT}°</span>
              <div style="font-size:9px;color:#9E9E9E">${frostWarn}</div>
            </div>
            <!-- 강수확률 -->
            <div style="flex-shrink:0;text-align:center;min-width:36px">
              <div style="font-size:10px;color:#9E9E9E">강수</div>
              <div style="font-size:17px;font-weight:700;
                color:${rainPct>=70?'#C62828':rainPct>=40?'#E65100':'#9E9E9E'}">${rainPct}%</div>
            </div>
            <!-- 작업 적합도 -->
            <div style="flex:1;text-align:right">
              <span style="font-size:10px;font-weight:700;
                background:${score.bg};color:${score.tc};
                padding:3px 8px;border-radius:10px">${score.label}</span>
            </div>
          </div>
          <!-- 상세 (기본 숨김) -->
          <div id="fc-detail-${i}" style="display:none;margin-top:10px;
            padding-top:8px;border-top:1px solid #E0E0E0">
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:16px;color:#546E7A">
              <div>🌤 날씨: <b style="color:#37474F">${wlabel}</b></div>
              <div>💨 풍속: <b style="color:#37474F">${windDir} ${windMs}m/s</b></div>
              <div>🌧 강수량: <b style="color:#37474F">${precip>0?precip.toFixed(1)+'mm':'없음'}</b></div>
              <div>❄️ 적설: <b style="color:#37474F">${snow>0?snow.toFixed(1)+'cm':'없음'}</b></div>
            </div>
            ${monthWork[month] ? `
            <div style="margin-top:7px;background:#E8F5E9;border-radius:6px;padding:6px 8px;
              font-size:16px;color:#1B5E20">
              🌱 ${month}월 주요 작업: ${monthWork[month]}
            </div>` : ''}
          </div>
        </div>`;
    }

    // 범례
    html += `
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:10px;font-size:10px">
        <span style="background:#E8F5E9;color:#1B5E20;padding:3px 8px;border-radius:10px;font-weight:700">작업 최적</span>
        <span style="background:#E3F2FD;color:#1565C0;padding:3px 8px;border-radius:10px;font-weight:700">작업 가능</span>
        <span style="background:#FFF3E0;color:#E65100;padding:3px 8px;border-radius:10px;font-weight:700">작업 주의</span>
        <span style="background:#FFEBEE;color:#C62828;padding:3px 8px;border-radius:10px;font-weight:700">작업 불가</span>
        <span style="background:#FFF9C4;color:#854F0B;padding:3px 8px;border-radius:10px;font-weight:700">🟡 주말</span>
      </div>
      <div style="font-size:10px;color:#BDBDBD;margin-top:8px;text-align:right">
        화성시 남양읍 · 14일 예보 · 탭하면 상세보기
      </div>`;

    body.innerHTML = html;
    forecastLoaded = true;

  } catch(err) {
    body.innerHTML = `<div style="text-align:center;padding:20px;color:#C62828">
      <div style="font-size:17px;font-weight:700">⚠ 장기예보를 불러올 수 없습니다</div>
      <div style="font-size:16px;margin-top:6px">인터넷 연결 확인 후 다시 시도하세요</div>
      <button onclick="forecastLoaded=false;loadForecast()"
        style="margin-top:10px;background:#E3F2FD;border:none;color:#1565C0;
        border-radius:8px;padding:8px 16px;font-size:16px;font-weight:700;
        cursor:pointer;font-family:inherit">🔄 다시 시도</button>
    </div>`;
  }
}

function toggleFcDetail(i) {
  const el = document.getElementById('fc-detail-' + i);
  if (!el) return;
  el.style.display = el.style.display === 'none' ? 'block' : 'none';
}

// ── 날씨 섹션 전용 함수 ───────────────────────────────────
let wxForecastLoaded = false;

// 현재 날씨 (날씨 탭용 — loadPruningWeather 재사용)
async function loadWeatherMain() {
  const btn    = document.getElementById('wxRefreshBtn');
  const body   = document.getElementById('wxliveBody');
  const dateEl = document.getElementById('wxlive-date');
  if (!body) return;

  const d = REAL_TODAY;
  const dayNames = ['일','월','화','수','목','금','토'];
  const dateStr = `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일(${dayNames[d.getDay()]})`;
  if (dateEl) dateEl.textContent = dateStr + ' 날씨';
  if (btn) btn.textContent = '⏳ 로딩중...';
  body.innerHTML = `<div style="text-align:center;padding:20px;color:#9E9E9E">
    <div style="font-size:28px">🌤️</div>
    <div style="font-size:16px;margin-top:8px">날씨 정보 불러오는 중...</div>
  </div>`;

  function vec2dir(deg) {
    const dirs=['북','북북동','북동','동북동','동','동남동','남동','남남동',
                '남','남남서','남서','서남서','서','서북서','북서','북북서'];
    return dirs[Math.round((deg||0)/22.5)%16];
  }
  function wmo2info(code) {
    if(code===0)  return{icon:'☀️',label:'맑음',        bg:'#FFFDE7',tc:'#F57F17'};
    if(code===1)  return{icon:'🌤️',label:'대체로 맑음', bg:'#FFFDE7',tc:'#F57F17'};
    if(code===2)  return{icon:'⛅',label:'구름 많음',    bg:'#ECEFF1',tc:'#546E7A'};
    if(code===3)  return{icon:'☁️',label:'흐림',        bg:'#ECEFF1',tc:'#546E7A'};
    if(code<=48)  return{icon:'🌫️',label:'안개',        bg:'#ECEFF1',tc:'#455A64'};
    if(code<=55)  return{icon:'🌦️',label:'이슬비',      bg:'#E3F2FD',tc:'#1565C0'};
    if(code<=65)  return{icon:'🌧️',label:'비',          bg:'#E3F2FD',tc:'#0D47A1'};
    if(code<=77)  return{icon:'🌨️',label:'눈',          bg:'#E8EAF6',tc:'#3949AB'};
    if(code<=82)  return{icon:'🌧️',label:'소나기',      bg:'#E3F2FD',tc:'#1565C0'};
    if(code<=99)  return{icon:'⛈️',label:'뇌우',        bg:'#EDE7F6',tc:'#4527A0'};
    return{icon:'🌡️',label:'알 수 없음',bg:'#F5F5F5',tc:'#9E9E9E'};
  }

  // 타임아웃 포함 fetch (Promise.race 방식 — iOS 호환)
  function fetchWithTimeout(url, ms) {
    const fetchPromise = fetch(url, {cache: 'no-cache'});
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('요청 시간 초과 (' + ms/1000 + '초)')), ms)
    );
    return Promise.race([fetchPromise, timeoutPromise]);
  }

  // open-meteo API (forecast_days=7로 충분한 데이터 요청)
  // 현재날씨 전용 — hourly 제외, forecast_days=3으로 경량화
  const url = 'https://api.open-meteo.com/v1/forecast'
    + '?latitude=37.1994&longitude=126.8316'
    + '&current=temperature_2m,apparent_temperature,weathercode,'
    + 'windspeed_10m,winddirection_10m,relative_humidity_2m,precipitation'
    + '&daily=temperature_2m_max,temperature_2m_min,weathercode,'
    + 'precipitation_probability_max,precipitation_sum,'
    + 'windspeed_10m_max,winddirection_10m_dominant'
    + '&timezone=Asia%2FSeoul'
    + '&forecast_days=3';

  fetchWithTimeout(url, 10000)
    .then(res => {
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    })
    .then(data => {
      if (btn) btn.textContent = '🔄 새로고침';

      const curr  = data.current  || {};
      const daily = data.daily    || {};
      const hourly= data.hourly   || {};

      // 현재 날씨 파싱
      const temp    = Math.round(curr.temperature_2m        ?? 0);
      const feels   = Math.round(curr.apparent_temperature  ?? temp);
      const wcode   = curr.weathercode ?? 0;
      const wind    = Math.round(curr.windspeed_10m         ?? 0);
      const windDir = vec2dir(curr.winddirection_10m        ?? 0);
      const humid   = Math.round(curr.relative_humidity_2m  ?? 0);
      const precip  = (curr.precipitation ?? 0).toFixed(1);
      const info    = wmo2info(wcode);

      // 오늘 최고·최저
      const maxT = Math.round((daily.temperature_2m_max || [])[0] ?? temp + 3);
      const minT = Math.round((daily.temperature_2m_min || [])[0] ?? temp - 3);
      const rain = ((daily.precipitation_probability_max||[])[0] ?? 0);
      const rainSum = ((daily.precipitation_sum||[])[0] ?? 0).toFixed(1);

      // 이번 주 7일 예보
      const weekDays = (daily.weathercode || []).slice(0, 7).map((wc, i) => {
        const dt = new Date(REAL_TODAY); dt.setDate(dt.getDate() + i);
        const dayLabel = i === 0 ? '오늘' : i === 1 ? '내일' : dayNames[dt.getDay()] + '요일';
        const wi = wmo2info(wc);
        const dMax = Math.round((daily.temperature_2m_max||[])[i] ?? 0);
        const dMin = Math.round((daily.temperature_2m_min||[])[i] ?? 0);
        const dRain= (daily.precipitation_probability_max||[])[i] ?? 0;
        return `<div style="flex:1;min-width:52px;text-align:center;padding:8px 4px;
          background:${i===0?'rgba(255,255,255,0.25)':'transparent'};border-radius:8px">
          <div style="font-size:10px;color:rgba(255,255,255,0.85);margin-bottom:3px">${dayLabel}</div>
          <div style="font-size:20px;margin:2px 0">${wi.icon}</div>
          <div style="font-size:16px;font-weight:700;color:white">${dMax}°</div>
          <div style="font-size:16px;color:rgba(255,255,255,0.7)">${dMin}°</div>
          ${dRain >= 30 ? `<div style="font-size:10px;color:#B3E5FC">💧${dRain}%</div>` : ''}
        </div>`;
      }).join('');

      const hourlyHtml = ''; // 시간별 예보는 별도 탭에서 제공

      // 농업 알림
      const alerts = [];
      if (rain >= 70)      alerts.push({icon:'🌧️', msg:'강수 확률 높음 — 방제·시비 금지', color:'#E3F2FD', tc:'#1565C0'});
      if (maxT >= 33)      alerts.push({icon:'🌡️', msg:'폭염 예상 — 오전 8시 전 작업 권장', color:'#FFEBEE', tc:'#C62828'});
      if (minT <= 2)       alerts.push({icon:'🧊', msg:'저온 주의 — 서리·동해 대비 필요', color:'#E8EAF6', tc:'#3949AB'});
      if (wind >= 15)      alerts.push({icon:'💨', msg:'강풍 주의 — 유인·지주 점검 필요', color:'#FFF3E0', tc:'#E65100'});
      if (rainSum >= 10)   alerts.push({icon:'🌊', msg:'많은 비 예보 — 배수로 점검 필요', color:'#E3F2FD', tc:'#0D47A1'});
      const alertHtml = alerts.map(a => `
        <div style="background:${a.color};border-radius:8px;padding:8px 12px;margin-bottom:6px;
          display:flex;align-items:center;gap:8px;font-size:16px;color:${a.tc};font-weight:600">
          <span style="font-size:16px">${a.icon}</span>${a.msg}
        </div>`).join('');

      body.innerHTML = `
        <!-- 현재 날씨 카드 -->
        <div style="background:linear-gradient(135deg,${info.tc},${info.tc}CC);
          border-radius:14px;padding:16px;margin-bottom:10px;color:white">
          <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
            <div>
              <div style="font-size:48px;font-weight:800;line-height:1">${temp}°</div>
              <div style="font-size:17px;opacity:0.9;margin-top:2px">${info.label}</div>
              <div style="font-size:16px;opacity:0.75;margin-top:2px">
                체감 ${feels}° · 최고 ${maxT}° 최저 ${minT}°
              </div>
            </div>
            <div style="font-size:52px">${info.icon}</div>
          </div>
          <div style="display:flex;gap:14px;margin-top:12px;flex-wrap:wrap;font-size:16px;opacity:0.9">
            <span>💨 ${windDir} ${wind}km/h</span>
            <span>💧 습도 ${humid}%</span>
            <span>🌧️ 강수 확률 ${rain}%</span>
            ${parseFloat(precip) > 0 ? `<span>☔ 강수 ${precip}mm</span>` : ''}
          </div>
          <!-- 7일 예보 -->
          <div style="display:flex;gap:4px;margin-top:12px;overflow-x:auto;
            scrollbar-width:none;-webkit-overflow-scrolling:touch;padding-bottom:4px">
            ${weekDays}
          </div>
        </div>

        <!-- 농업 알림 -->
        ${alertHtml ? `<div style="margin-bottom:10px">${alertHtml}</div>` : ''}

        <!-- 오늘 시간별 예보 -->
        ${hourlyHtml ? `
        <div style="margin-bottom:10px">
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:8px">⏰ 오늘 시간별</div>
          <div style="display:flex;gap:6px;overflow-x:auto;-webkit-overflow-scrolling:touch;
            scrollbar-width:none;padding-bottom:4px">
            ${hourlyHtml}
          </div>
        </div>` : ''}

        <!-- 위치 안내 -->
        <div style="font-size:10px;color:#BDBDBD;text-align:right;margin-top:4px">
          📍 화성시 남양읍 신외리 (37.20°N 126.83°E)
        </div>`;
    })
    .catch(err => {
      if (btn) btn.textContent = '🔄 새로고침';
      body.innerHTML = `
        <div style="background:#FFEBEE;border-radius:10px;padding:16px;text-align:center">
          <div style="font-size:20px;margin-bottom:8px">⚠️</div>
          <div style="font-size:17px;color:#C62828;font-weight:700;margin-bottom:6px">
            날씨 정보를 불러오지 못했습니다
          </div>
          <div style="font-size:16px;color:#E53935;margin-bottom:12px;line-height:1.7">
            오류: ${err.message}<br>
            인터넷 연결 상태를 확인하거나 잠시 후 다시 시도하세요
          </div>
          <button onclick="loadWeatherMain()"
            style="padding:10px 24px;background:#1B5E20;color:white;border:none;
            border-radius:8px;font-size:17px;font-weight:700;cursor:pointer;font-family:inherit">
            🔄 다시 시도
          </button>
        </div>`;
    });
}

function toggleWeatherForecast() {
  const panel = document.getElementById('wxForecastPanel');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen && !wxForecastLoaded) loadWeatherForecast();
  if (!isOpen) panel.scrollIntoView({behavior:'smooth', block:'start'});
}

async function loadWeatherForecast() {
  const body = document.getElementById('wxForecastBody');
  if (!body) return;

  function vec2dir(deg){const dirs=['북','북북동','북동','동북동','동','동남동','남동','남남동','남','남남서','남서','서남서','서','서북서','북서','북북서'];return dirs[Math.round(deg/22.5)%16];}
  function wmo2icon(c){return c===0?'☀️':c<=2?'🌤️':c===3?'☁️':c<=48?'🌫️':c<=55?'🌦️':c<=67?'🌧️':c<=77?'❄️':c<=82?'🌦️':'⛈️';}
  function wmo2label(c){return c===0?'맑음':c===1?'대체로 맑음':c===2?'구름 많음':c===3?'흐림':c<=48?'안개':c<=55?'이슬비':c<=65?'비':c<=67?'진눈깨비':c<=77?'눈':c<=82?'소나기':'뇌우';}
  function workScore(maxT,minT,windMs,rainPct,snow){
    if(rainPct>=70||snow>0.5) return{label:'작업 불가',bg:'#FFEBEE',tc:'#C62828'};
    if(rainPct>=40) return{label:'작업 주의',bg:'#FFF3E0',tc:'#E65100'};
    if(maxT<5) return{label:'기온 낮음',bg:'#FFF3E0',tc:'#E65100'};
    if(windMs>=10) return{label:'강풍 주의',bg:'#FFF3E0',tc:'#E65100'};
    if(maxT>=15&&maxT<30) return{label:'작업 최적',bg:'#E8F5E9',tc:'#1B5E20'};
    if(maxT>=10) return{label:'작업 가능',bg:'#E3F2FD',tc:'#1565C0'};
    if(maxT>=30) return{label:'폭염 주의',bg:'#FFF3E0',tc:'#E65100'};
    return{label:'작업 가능',bg:'#E3F2FD',tc:'#1565C0'};
  }

  const monthWork={4:'다래·으름 점검·유실수 개화',5:'수박·오이·참외 정식·머루콩 파종',6:'마늘·양파 수확·동부 파종',7:'블랙베리 수확·수박 착과 관리',8:'수박 수확(8/20전)·김장무 파종',9:'양파 정식·생강 수확 준비',10:'고구마·생강 수확·마늘 파종',11:'콩류·배추 수확·유실수 전정 준비'};
  const dayNames=['일','월','화','수','목','금','토'];

  try {
    const url='https://api.open-meteo.com/v1/forecast?latitude=37.1994&longitude=126.8316'
      +'&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,'
      +'windspeed_10m_max,winddirection_10m_dominant,weathercode,precipitation_sum,snowfall_sum'
      +'&timezone=Asia%2FSeoul&forecast_days=14';
    const res=await fetch(url);
    if(!res.ok) throw new Error('서버오류');
    const data=await res.json();
    const daily=data.daily;
    let html='';
    for(let i=0;i<daily.time.length;i++){
      const dt=new Date(daily.time[i]+'T00:00:00');
      const dow=dt.getDay();
      const m=dt.getMonth()+1, md=dt.getDate();
      const maxT=Math.round(daily.temperature_2m_max[i]);
      const minT=Math.round(daily.temperature_2m_min[i]);
      const windMs=(daily.windspeed_10m_max[i]/3.6).toFixed(1);
      const rainPct=daily.precipitation_probability_max[i];
      const windDir=vec2dir(daily.winddirection_10m_dominant[i]);
      const wcode=daily.weathercode[i];
      const precip=daily.precipitation_sum[i]||0;
      const snow=daily.snowfall_sum[i]||0;
      const score=workScore(maxT,minT,parseFloat(windMs),rainPct,snow);
      const todayDt=new Date();todayDt.setHours(0,0,0,0);
      const isToday=dt.getTime()===todayDt.getTime();
      const isWE=dow===0||dow===6;
      const rowBg=isToday?'#E8F5E9':isWE?'#FFF9C4':'white';
      const rowBorder=isToday?'2px solid #2E7D32':isWE?'1.5px solid #F9A825':'1px solid #F0F0F0';
      const frostW=minT<=0?' ❄️서리':minT<=3?' 🟡서리주의':'';
      html+=`<div onclick="toggleWxDetail(${i})" style="background:${rowBg};border:${rowBorder};border-radius:10px;padding:11px 12px;margin-bottom:6px;cursor:pointer">
        <div style="display:flex;align-items:center;gap:8px">
          <div style="width:60px;flex-shrink:0"><div style="font-size:${isToday?'13px':'12px'};font-weight:${isToday?'800':'700'};color:${dow===0?'#C62828':dow===6?'#1565C0':'#37474F'}">${isToday?'오늘 ':''}${m}/${md}(${dayNames[dow]})</div></div>
          <div style="font-size:22px;flex-shrink:0">${wmo2icon(wcode)}</div>
          <div style="flex-shrink:0;text-align:center;min-width:54px">
            <span style="font-size:15px;font-weight:800;color:#C62828">${maxT}°</span>
            <span style="font-size:16px;color:#9E9E9E"> / </span>
            <span style="font-size:17px;font-weight:600;color:#1565C0">${minT}°${frostW}</span>
          </div>
          <div style="flex-shrink:0;text-align:center;min-width:36px">
            <div style="font-size:10px;color:#9E9E9E">강수</div>
            <div style="font-size:17px;font-weight:700;color:${rainPct>=70?'#C62828':rainPct>=40?'#E65100':'#9E9E9E'}">${rainPct}%</div>
          </div>
          <div style="flex:1;text-align:right"><span style="font-size:10px;font-weight:700;background:${score.bg};color:${score.tc};padding:3px 8px;border-radius:10px">${score.label}</span></div>
        </div>
        <div id="wx-detail-${i}" style="display:none;margin-top:10px;padding-top:8px;border-top:1px solid #E0E0E0">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:16px;color:#546E7A">
            <div>🌤 날씨: <b style="color:#37474F">${wmo2label(wcode)}</b></div>
            <div>💨 풍속: <b style="color:#37474F">${windDir} ${windMs}m/s</b></div>
            <div>🌧 강수량: <b style="color:#37474F">${precip>0?precip.toFixed(1)+'mm':'없음'}</b></div>
            <div>❄️ 적설: <b style="color:#37474F">${snow>0?snow.toFixed(1)+'cm':'없음'}</b></div>
          </div>
          ${monthWork[m]?`<div style="margin-top:7px;background:#E8F5E9;border-radius:6px;padding:6px 8px;font-size:16px;color:#1B5E20">🌱 ${m}월 주요 작업: ${monthWork[m]}</div>`:''}
        </div>
      </div>`;
    }
    html+=`<div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:8px;font-size:10px">
      <span style="background:#E8F5E9;color:#1B5E20;padding:3px 8px;border-radius:10px;font-weight:700">작업 최적</span>
      <span style="background:#E3F2FD;color:#1565C0;padding:3px 8px;border-radius:10px;font-weight:700">작업 가능</span>
      <span style="background:#FFF3E0;color:#E65100;padding:3px 8px;border-radius:10px;font-weight:700">작업 주의</span>
      <span style="background:#FFEBEE;color:#C62828;padding:3px 8px;border-radius:10px;font-weight:700">작업 불가</span>
      <span style="background:#FFF9C4;color:#854F0B;padding:3px 8px;border-radius:10px;font-weight:700">🟡 주말</span>
    </div>
    <div style="font-size:10px;color:#BDBDBD;margin-top:6px;text-align:right">화성시 남양읍 · 14일 예보</div>`;
    body.innerHTML=html;
    wxForecastLoaded=true;
  } catch(err) {
    body.innerHTML=`<div style="text-align:center;padding:20px;color:#C62828">
      <div style="font-size:17px;font-weight:700">⚠ 장기예보를 불러올 수 없습니다</div>
      <button onclick="wxForecastLoaded=false;loadWeatherForecast()" style="margin-top:10px;background:#E3F2FD;border:none;color:#1565C0;border-radius:8px;padding:8px 16px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit">🔄 다시 시도</button></div>`;
  }
}

function toggleWxDetail(i){
  const el=document.getElementById('wx-detail-'+i);
  if(el) el.style.display=el.style.display==='none'?'block':'none';
}

// ══════════════════════════════════════════════════════════
// 병해충·시비 통합 시스템 — 내 작물 기준
// ══════════════════════════════════════════════════════════

// ── 내 작물 병해충 매핑 ───────────────────────────────────
// {작물그룹: {pests:[병해충명...], notes:설명}}
const myPlantPests = {
  '다래·으름·키위': {
    emoji:'🍇', plants:['다래 일세','다래 레몬프레시','다래 참다래(키위)','다래 용성2호','으름 토종','으름 슈퍼대실','으름 백화대실','으름 홍화대실'],
    pests:['진딧물','응애','흰가루병','회색곰팡이병'],
    peak_months:[4,5,6,9,10]
  },
  '블랙베리·복분자': {
    emoji:'🫐', plants:['블랙베리(슈퍼복분자)','복분자'],
    pests:['진딧물','응애','회색곰팡이병','탄저병'],
    peak_months:[5,6,7,8]
  },
  '사과 3종': {
    emoji:'🍎', plants:['나가노신구 사과','돌고 사과','아리수 사과'],
    pests:['진딧물','응애','탄저병','복숭아심식나방','흰가루병'],
    peak_months:[5,6,7,8,9]
  },
  '살구 5종': {
    emoji:'🍑', plants:['백살구','B360살구','대천황살구(킹코트)','킹코트살구(하코트)','하코드살구'],
    pests:['진딧물','복숭아심식나방','탄저병','흰가루병'],
    peak_months:[5,6,7]
  },
  '매실 2종': {
    emoji:'🌸', plants:['남고 매실','노천 매실'],
    pests:['진딧물','응애','흰가루병'],
    peak_months:[4,5,6,9]
  },
  '무화과 4종': {
    emoji:'🍈', plants:['무화과 시카고하디','무화과 롱다우트','무화과 바나네','무화과 피코튬'],
    pests:['응애','진딧물','역병'],
    peak_months:[6,7,8]
  },
  '블루베리': {
    emoji:'🫐', plants:['블루베리 패트리오트'],
    pests:['진딧물','회색곰팡이병'],
    peak_months:[5,6,7]
  },
  '헤이즐넛·모과·마르멜로·앵두·머루포도·바이오체리': {
    emoji:'🌰', plants:['헤이즐넛 바르셀로나','헤이즐넛 초거대향','모과(대실모과)','마르멜로(서양모과)','앵두(대홍앵)','머루포도(MBA)','바이오체리'],
    pests:['진딧물','응애','흰가루병'],
    peak_months:[5,6,7,8]
  },
  '수박·단호박·접목수박': {
    emoji:'🍉', plants:['블랙망고수박','애플수박','자몽애플수박','흑피애플미니꼬꼬마수박①','흑피애플미니꼬꼬마수박②','애플미니꼬꼬마수박①','애플미니꼬꼬마수박②','보우짱 단호박①','보우짱 단호박②','접목수박','망고수박①','망고수박②','망고수박③','복수박①','복수박②','접목애플수박①','접목애플수박②'],
    pests:['역병','탄저병','흰가루병','진딧물','노린재'],
    peak_months:[6,7,8]
  },
  '오이·쿠카멜론·호박': {
    emoji:'🥒', plants:['백다다기오이','쿠카멜론①','쿠카멜론②','애호박①','애호박②','맷돌호박①','맷돌호박②'],
    pests:['역병','흰가루병','진딧물','응애'],
    peak_months:[5,6,7,8]
  },
  '참외 5종': {
    emoji:'🍈', plants:['망고참외','꿀참외','개구리참외','베타카로틴참외','사과참외'],
    pests:['역병','흰가루병','진딧물'],
    peak_months:[6,7,8]
  },
  '콩류(머루콩·선비잡이콩·동부)': {
    emoji:'🫘', plants:['머루콩','선비잡이콩','동부(마늘 후작)'],
    pests:['노린재','진딧물'],
    peak_months:[7,8,9]
  },
  '고구마·감자·생강': {
    emoji:'🍠', plants:['고구마','감자(봄재배)','토종생강','개량생강'],
    pests:['역병','진딧물','노린재'],
    peak_months:[5,6,7,8]
  },
  '🥔 감자(병해충 집중관리)': {
    emoji:'🥔', plants:['감자(봄재배)'],
    pests:['역병','진딧물'],
    peak_months:[5,6]
  },
  '🥜 땅콩(병해충 관리)': {
    emoji:'🥜', plants:['땅콩'],
    pests:['진딧물','응애','회색곰팡이병'],
    peak_months:[6,7,8,9]
  },
  '마늘·양파·배추·무': {
    emoji:'🧄', plants:['마늘(3이랑)','마늘(2이랑 후작)','양파','양파(6이랑)','배추(가을)','김장무'],
    pests:['진딧물'],
    peak_months:[9,10,11]
  },
};

// ── 내 작물 시비 스케줄 ───────────────────────────────────
// {월: [{group, plants, work, detail, fertilizer, amount, timing, caution}]}

// ── 농협 구입 비료 5종 ────────────────────────────────────
// 우선순위 기준:
// priority 1 = ⭐⭐⭐ 최우선 (이 작물·이 시기 전용)
// priority 2 = ⭐⭐ 권장 (적합하지만 범용)
// priority 3 = ⭐ 보조 (대체 사용 가능)
// 우선순위 결정 로직: 전용도(crops 수 적을수록) × 시기 적합도
const nhFertilizers = {
  '단한번비료': {
    priority: 1,
    npk:     'N22-P9-K9 완효성',
    type:    '완효성 기비',
    feature: '1회 시용으로 1작기 전체 · 완효성 코팅 질소',
    crops:   ['수박','참외','오이','호박','고구마','감자','배추','무'],
    months:  [4,5,6],
    timing:  '정식·파종 전 기비 1회',
    amount:  '3.3㎡당 130~200g · 뿌리에 직접 닿지 않게',
    caution: '추비 불필요 · 과수목 사용 비권장',
    color:   '#E8F5E9', tc: '#1B5E20',
  },
  '엔케이플러스': {
    priority: 1,
    npk:     'N17-P0-K17 (인산 없음)',
    type:    '착과·결실기 추비',
    feature: '인산 없이 질소·칼리만 — 과실 비대·당도 향상',
    crops:   ['사과','살구','매실','블랙베리','복분자','수박','참외','마늘','양파'],
    months:  [5,6,7,8,9],
    timing:  '착과 확인 후 ~ 과실 비대기',
    amount:  '과수 주당 30~50g · 채소 포기당 10~20g',
    caution: '기비 단독 사용 금지 · 인산 별도 보충 필요',
    color:   '#E3F2FD', tc: '#1565C0',
  },
  '원예맞춤고추비료': {
    priority: 1,
    npk:     'N12-P6-K12 + Ca·Mg',
    type:    '착과 후 2~3회 분시',
    feature: '칼슘·마그네슘 포함 — 과실 비대·착색·내병성 강화',
    crops:   ['수박','참외','오이','호박','사과','살구'],
    months:  [5,6,7,8],
    timing:  '착과 후 ~ 수확 전 · 2~3회 나눠 시용',
    amount:  '포기당 20~30g · 3.3㎡당 100g',
    caution: '고온 건조 시 시용 금지 · 비 오기 전날 시용 권장',
    color:   '#FFF3E0', tc: '#E65100',
  },
  '일회만비료': {
    priority: 2,
    npk:     'N21-P9-K9 완효성코팅',
    type:    '완효성 기비',
    feature: '완효성 코팅 3~4개월 지속 · 단기 채소 전용',
    crops:   ['배추','무','감자','고구마','양파','마늘','선비잡이콩','머루콩','동부'],
    months:  [3,4,8,9,10],
    timing:  '파종·정식 전 기비 1회 · 3.3㎡당 160~200g',
    amount:  '10a당 40~50kg',
    caution: '과채류 장기 재배 부적합 · 추비 불필요',
    color:   '#F3E5F5', tc: '#6A1B9A',
  },
  '슈퍼복합비료': {
    priority: 3,
    npk:     'N21-P17-K17 균형형',
    type:    '범용 기비·추비',
    feature: '질소·인산·칼리 균형 — 과수·채소 모두 사용 가능',
    crops:   ['사과','살구','매실','헤이즐넛','모과','마르멜로','앵두','머루포도',
              '바이오체리','수박','참외','오이','호박','배추','무','감자','고구마',
              '양파','마늘','콩류'],
    months:  [3,4,5,8,9,10,11],
    timing:  '기비: 파종·정식 전 / 추비: 생육 중기',
    amount:  '기비 10a당 30~40kg · 추비 포기당 10~20g',
    caution: '⚠ 블루베리 절대 사용 금지(pH 상승) · 과다 시 염류 집적',
    color:   '#ECEFF1', tc: '#37474F',
  },
};

// 날짜·작물 기반 오늘 사용 가능 비료 목록 반환 (우선순위 정렬)
function getTodayFertilizers(month, cropNames) {
  const result = [];
  for (const [fname, finfo] of Object.entries(nhFertilizers)) {
    if (!finfo.months.includes(month)) continue;
    const matched = finfo.crops.filter(c =>
      cropNames.some(p => p.includes(c) || c.includes(p.split(' ')[0]))
    );
    if (matched.length > 0) {
      result.push({...finfo, fname, matched});
    }
  }
  // 우선순위 정렬 (1→2→3)
  result.sort((a,b) => (a.priority||9) - (b.priority||9));
  return result;
}

// 비료 목록에서 대표 비료 1개 선정
function getRepresentativeFert(fertList) {
  if (!fertList.length) return null;
  // priority 1 중 매칭 작물 가장 많은 것
  const p1 = fertList.filter(f => f.priority === 1);
  if (p1.length) {
    return p1.sort((a,b) => b.matched.length - a.matched.length)[0];
  }
  return fertList[0]; // 없으면 첫 번째
}

const myFertSchedule = {
  3: [
    {group:'전체 과수', emoji:'🌳',
     work:'밑거름 (기비)',
     detail:'낙엽 후 동면에서 깨어나기 전 — 뿌리 흡수력 최고',
     fertilizer:'퇴비+복합비료(N:P:K=8:8:8)',
     amount:'퇴비 5~10kg/주 · 복합비료 100~200g/주',
     timing:'3월 초순 발아 전',
     caution:'질소 과다 금지 — 도장지 유발'},
    {group:'🥔 감자', emoji:'🥔',
     work:'감자 파종 기비 (3월 중순)',
     detail:'파종 1주 전 밭 전면 살포 후 경운 혼화',
     fertilizer:'완효성 복합비료(N:P:K=8:8:8) + 퇴비',
     amount:'퇴비 2kg/㎡ · 복합비료 60~80g/㎡',
     timing:'파종 7~10일 전',
     caution:'질소 과다 금지 — 잎만 무성 · 씨감자 절단면 건조 필수'}
  ],
  4: [
    {group:'사과·살구·매실', emoji:'🍎🍑🌸',
     work:'개화기 엽면시비',
     detail:'꽃 피기 직전 붕소 살포 — 결실율 향상',
     fertilizer:'붕소(요산나트륨) 0.3% 수용액',
     amount:'엽면 골고루 살포',
     timing:'개화 3~5일 전',
     caution:'개화 중 살포 금지 — 화분 손상'},
    {group:'다래·으름·키위', emoji:'🍇🌿',
     work:'질소 추비 1차',
     detail:'신초 발생기 — 덩굴 생장 촉진',
     fertilizer:'요소(N 46%) 수용액 0.3%',
     amount:'주당 물 5L 관주',
     timing:'4월 중순 새순 5~10cm',
     caution:'과다 시 도장지 발생'}
  ],
  5: [
    {group:'수박·참외·오이·호박', emoji:'🍉🍈🥒',
     work:'정식 밑거름',
     detail:'정식 1주 전 두둑에 기비 시용',
     fertilizer:'완숙 퇴비+복합비료',
     amount:'퇴비 2kg/㎡ · 복합비료 50g/㎡',
     timing:'정식 7~10일 전',
     caution:'미숙 퇴비 사용 금지 — 뿌리 손상'},
    {group:'블랙베리·복분자', emoji:'🫐',
     work:'결실비료',
     detail:'착과 시작 전 칼륨 보강',
     fertilizer:'황산칼륨(K₂O 50%)',
     amount:'주당 30~50g 토양 시용',
     timing:'5월 하순 꽃눈 형성기',
     caution:'염화칼륨 사용 금지 — 염분 피해'},
    {group:'블루베리', emoji:'🫐',
     work:'산성비료 시용',
     detail:'pH 4.5~5.5 유지 필수',
     fertilizer:'황산암모늄(유안) — 산성화 효과',
     amount:'주당 50~80g',
     timing:'5월 초 신초 발생기',
     caution:'일반 복합비료 금지 — pH 상승'},
    {group:'🍠 고구마', emoji:'🍠',
     work:'고구마 정식 기비 (5월 중순)',
     detail:'두둑 만들기 전 밭 전면 시용 · 칼륨 강화 필수',
     fertilizer:'완효성 복합비료(N:P:K=5:5:8) · 칼리 강화형',
     amount:'퇴비 1kg/㎡ · 복합비료 40~50g/㎡',
     timing:'정식 7~10일 전 두둑 만들기 직전',
     caution:'질소 과다 금지 — 덩굴만 무성 · 칼륨 충분히 줘야 구 비대↑'},
    {group:'🥜 땅콩', emoji:'🥜',
     work:'땅콩 파종 기비 (5월 중순)',
     detail:'파종 전 밭 전면 시용 · 석회로 pH 교정 병행',
     fertilizer:'완효성 복합비료(N:P:K=8:8:8) + 석회',
     amount:'복합비료 50~60g/㎡ · 석회 100~150g/㎡ (산성토 교정)',
     timing:'파종 7~10일 전',
     caution:'질소 과다 금지 — 꼬투리 형성 불량 · 고토석회로 pH 6.0~6.5 유지'}
  ],
  6: [
    {group:'수박·참외·오이', emoji:'🍉🍈🥒',
     work:'착과 후 추비',
     detail:'착과 확인 후 10일 이내 시용',
     fertilizer:'복합비료(N:P:K=6:6:12) 칼륨 강화형',
     amount:'포기당 20~30g 또는 관주',
     timing:'착과 후 7~10일',
     caution:'착과 전 질소 과다 금지 — 착과 불량'},
    {group:'사과·살구', emoji:'🍎🍑',
     work:'적과 후 칼슘 엽면시비',
     detail:'과실 비대기 칼슘 부족 예방',
     fertilizer:'염화칼슘 0.3~0.5% 수용액',
     amount:'엽면 골고루 2~3회 반복',
     timing:'적과 후 ~ 7월 중순',
     caution:'고온 한낮 살포 금지 — 약해'}
  ],
  7: [
    {group:'수박·단호박·호박', emoji:'🍉🎃',
     work:'수확 전 비료 중단',
     detail:'수확 2~3주 전 모든 비료 중단',
     fertilizer:'중단',
     amount:'—',
     timing:'수확 예정일 20일 전',
     caution:'비료 지속 시 당도 저하·저장성 불량'},
    {group:'블랙베리·복분자', emoji:'🫐',
     work:'수확 후 추비',
     detail:'수확 직후 이듬해 꽃눈 분화 준비',
     fertilizer:'복합비료(8:8:8)',
     amount:'주당 50~100g',
     timing:'수확 종료 직후',
     caution:'질소 과다 시 월동 불량'},
    {group:'🍠 고구마', emoji:'🍠',
     work:'고구마 칼륨 추비 (구 비대기)',
     detail:'정식 후 40~50일 · 구 비대 시작 신호 확인 후 시용',
     fertilizer:'황산칼륨(K₂O 50%)',
     amount:'포기당 10~15g · 이랑 옆에 홈 파고 시용',
     timing:'7월 상중순 덩굴 왕성기',
     caution:'질소 추가 절대 금지 · 이후 비료 중단'},
    {group:'🥜 땅콩', emoji:'🥜',
     work:'땅콩 개화기 추비',
     detail:'꽃이 피기 시작하면 칼슘·칼륨 보충 · 배토와 함께 시용',
     fertilizer:'황산칼슘(석고) + 황산칼륨',
     amount:'석고 100g/㎡ 배토 시 혼입 · 칼륨 20g/㎡',
     timing:'개화 시작 후 배토 시',
     caution:'질소 추가 금지 — 꼬투리 형성 방해'}
  ],
  8: [
    {group:'전체 채소 후작 준비', emoji:'🥬',
     work:'토양 개량',
     detail:'마늘·양파·배추 파종 전 토양 pH 교정',
     fertilizer:'고토석회(산성토양 교정)',
     amount:'10~20kg/3.3㎡',
     timing:'8월 중순 (파종 2~3주 전)',
     caution:'석회 후 2주 이내 파종·시비 금지'},
    {group:'사과 3종', emoji:'🍎',
     work:'칼리 추비',
     detail:'과실 성숙기 당도·착색 향상',
     fertilizer:'황산칼륨',
     amount:'주당 50~80g',
     timing:'8월 상순',
     caution:'질소 추가 금지 — 과실 비대 저해'}
  ],
  9: [
    {group:'마늘·양파', emoji:'🧄🧅',
     work:'파종·정식 기비',
     detail:'밭 전면 살포 후 경운 혼화',
     fertilizer:'퇴비+복합비료(8:8:8)',
     amount:'퇴비 2kg/㎡ · 복합비료 80g/㎡',
     timing:'파종·정식 7~10일 전',
     caution:'질소 과다 시 구 비대 불량'},
    {group:'배추', emoji:'🥬',
     work:'정식 후 추비',
     detail:'활착 후 1~2주 간격 2~3회',
     fertilizer:'요소(N) 또는 복합비료',
     amount:'포기당 5~10g',
     timing:'정식 2주 후 ~ 결구 전',
     caution:'결구기 질소 과다 시 속 잎 썩음'}
  ],
  10: [
    {group:'전체 과수', emoji:'🌳',
     work:'가을 밑거름 준비',
     detail:'낙엽 전 인산·칼륨 흡수 극대화',
     fertilizer:'용성인비+황산칼륨',
     amount:'인산 100g/주 · 칼륨 50g/주',
     timing:'10월 중순 낙엽 전',
     caution:'질소 금지 — 월동 불량 원인'},
    {group:'헤이즐넛', emoji:'🌰',
     work:'수확 후 추비',
     detail:'수확 직후 이듬해 결실 준비',
     fertilizer:'복합비료(8:8:8)',
     amount:'주당 100~150g',
     timing:'수확 종료 직후',
     caution:''}
  ],
  11: [
    {group:'전체 과수', emoji:'🌳',
     work:'유기물 퇴비 기비',
     detail:'낙엽 후 ~ 토양 동결 전',
     fertilizer:'완숙 퇴비',
     amount:'5~10kg/주 수관 하부 토양 혼입',
     timing:'11월 낙엽 완료 후',
     caution:'미숙 퇴비 사용 금지'},
    {group:'마늘·양파 월동', emoji:'🧄🧅',
     work:'월동 비료',
     detail:'동해 방지 및 이른 봄 생육 준비',
     fertilizer:'복합비료 소량',
     amount:'20g/㎡ 표면 시용',
     timing:'11월 하순 본격 동결 전',
     caution:'과다 시 동해 심화'}
  ],
  12: [],
  1: [],
  2: [
    {group:'전체 과수 준비', emoji:'🌳',
     work:'기비 계획 수립',
     detail:'3월 발아 전 시용할 비료 준비',
     fertilizer:'퇴비·복합비료 구입 준비',
     amount:'—',
     timing:'2월 중순까지',
     caution:''}
  ],
};

// 병해충 상세 데이터
const pestDetail = {
  '흰가루병':   {emoji:'🍃',type:'곰팡이',symptom:'흰 가루 → 황변·낙엽',control:'훼나리몰(훼나리몰수화제)·트리플록시스트로빈(플린트수화제·로만스액상수화제)',risk_temp:[12,25],risk_hum:60,bg:'#F3E5F5',tc:'#6A1B9A'},
  '역병':       {emoji:'🌿',type:'난균류',symptom:'줄기 기부 갈변 → 시들음',control:'메탈락실(리도밀골드수화제·메타실수화제)·포세틸알루미늄(알리에테수화제)',risk_temp:[23,32],risk_hum:80,bg:'#E8F5E9',tc:'#1B5E20'},
  '탄저병':     {emoji:'🍎',type:'곰팡이',symptom:'과실 갈색 반점 → 썩음',control:'이프로디온(로브랄수화제)·테부코나졸(실바코액상수화제)',risk_temp:[22,30],risk_hum:75,bg:'#FFEBEE',tc:'#C62828'},
  '진딧물':     {emoji:'🐛',type:'해충', symptom:'새순 집단 기생 → 황변',control:'이미다클로프리드(코니도수화제·가우초수화제)·아세타미프리드(모스피란수화제·아타라수화제)',risk_temp:[18,26],risk_hum:0,bg:'#FFF9C4',tc:'#854F0B'},
  '응애':       {emoji:'🕷️',type:'해충',symptom:'잎 흰 반점·황변·거미줄',control:'밀베멕틴(밀베녹수화제)·클로르페나피르(렘페이지액상수화제)',risk_temp:[28,40],risk_hum:0,bg:'#FFF3E0',tc:'#E65100'},
  '노린재':     {emoji:'🦂',type:'해충',symptom:'과실·종실 흡즙 → 기형',control:'에토펜프록스(트레본유제)·람다사이할로트린(카라테수화제)',risk_temp:[25,38],risk_hum:0,bg:'#E8F5E9',tc:'#2E7D32'},
  '복숭아심식나방':{emoji:'🦋',type:'해충',symptom:'과실 속 굴식·낙과',control:'디아지논(다이아톤유제)·클로르피리포스(더스반유제)',risk_temp:[18,28],risk_hum:0,bg:'#FCE4EC',tc:'#C2185B'},
  '회색곰팡이병':{emoji:'🍇',type:'곰팡이',symptom:'꽃·과실에 잿빛 곰팡이',control:'이프로디온(로브랄수화제)·사이프로디닐(스위치입상수화제)',risk_temp:[12,22],risk_hum:85,bg:'#ECEFF1',tc:'#455A64'},
};

// SUPPLY_DB 기반 — 작물별 보유 농약 조회
function getDbPesticidesForCrop(cropName) {
  if (typeof SUPPLY_DB === 'undefined') return [];
  return SUPPLY_DB.pesticides.filter(p =>
    p.crops.some(c => cropName.includes(c.split(' ')[0]) || c.includes(cropName.split(' ')[0]))
  );
}

// SUPPLY_DB 기반 — 월별 비료 조회 (myFertSchedule 보완)
function getDbFertForMonth(month) {
  if (typeof SUPPLY_DB === 'undefined') return [];
  return SUPPLY_DB.fertSchedule[month] || [];
}

// SUPPLY_DB 기반 — 이달 방제 스케줄
function getDbPestScheduleForMonth(month) {
  if (typeof SUPPLY_DB === 'undefined') return [];
  return SUPPLY_DB.pestSchedule[month] || [];
}

// 월별 방제·시비력 (통합)
const pestCalendar = {
  3:  [{work:'밑거름(기비)',     fert:'퇴비+복합비료 전체 과수·채소밭', type:'시비'},
       {work:'월동 병해충 방제', fert:'기계유유제(클린유) · 석회유황합제',      type:'방제'},
       {work:'🥔감자 파종 기비', fert:'완효성 복합비료+퇴비 — 감자 파종 전',  type:'시비'}],
  4:  [{work:'개화기 엽면시비',  fert:'붕소 0.3% — 사과·살구·매실',      type:'시비'},
       {work:'진딧물 1차 방제',  fert:'이미다클로프리드 — 전체',         type:'방제'},
       {work:'다래·으름 질소 추비',fert:'요소 0.3% 관주',               type:'시비'},
       {work:'🥔감자 역병 예방', fert:'리도밀골드수화제 1,000배 — 감자',  type:'방제'}],
  5:  [{work:'정식 기비',        fert:'퇴비+복합비료 — 수박·참외·오이',   type:'시비'},
       {work:'블루베리 산성비료', fert:'황산암모늄 — pH 유지',            type:'시비'},
       {work:'블랙베리 칼리비료', fert:'황산칼륨',                       type:'시비'},
       {work:'장마 전 방제 준비',fert:'살균제·살충제 재고 확인',          type:'방제'},
       {work:'🍠고구마 정식 기비',fert:'칼리강화 복합비료+퇴비 — 고구마', type:'시비'},
       {work:'🥜땅콩 파종 기비', fert:'복합비료+석회 — 땅콩 · pH 6.0~6.5', type:'시비'}],
  6:  [{work:'착과 후 추비',     fert:'칼륨강화 복합비료 — 수박·참외',    type:'시비'},
       {work:'칼슘 엽면시비',    fert:'염화칼슘 0.3% — 사과·살구',       type:'시비'},
       {work:'역병·탄저병 방제', fert:'살균제 — 장마 직전 필수',         type:'방제'},
       {work:'흰가루병 방제',    fert:'수박·오이·참외 — 플린트수화제(트리플록시스트로빈)',type:'방제'},
       {work:'🥔감자 역병 긴급 방제',fert:'메탈락실 — 장마 전 필수·수확 전 완료', type:'방제'},
       {work:'🥜땅콩 발아기 잡초 방제',fert:'발아 후 초기 잡초 제거 필수',type:'방제'}],
  7:  [{work:'수확 전 비료 중단',fert:'수박·단호박 — 수확 20일 전 중단', type:'시비'},
       {work:'블랙베리 수확 후 추비',fert:'복합비료',                    type:'시비'},
       {work:'응애·노린재 방제', fert:'밀베멕틴·에토펜프록스',           type:'방제'},
       {work:'장마 후 긴급 방제',fert:'살균제 24시간 내 살포',           type:'방제'},
       {work:'🍠고구마 칼륨 추비',fert:'황산칼륨 — 구 비대기',          type:'시비'},
       {work:'🥜땅콩 개화기 배토·칼슘',fert:'석고+황산칼륨 — 배토 시 혼입',type:'시비'},
       {work:'🥜땅콩 갈색무늬병 방제',fert:'이프로디온(로브랄수화제) — 장마 후',type:'방제'}],
  8:  [{work:'사과 칼리 추비',   fert:'황산칼륨 — 당도·착색 향상',       type:'시비'},
       {work:'토양 석회 교정',   fert:'고토석회 — 마늘·배추 파종 전',    type:'시비'},
       {work:'탄저병 방제',      fert:'수박·살구 수확 전',               type:'방제'},
       {work:'🍠고구마 비료 중단',fert:'수확 3주 전 전량 중단 — 덩굴만 정리',type:'시비'},
       {work:'🥜땅콩 결실기 관수',fert:'건조시 관수 필수 — 꼬투리 충실',  type:'시비'}],
  9:  [{work:'마늘·양파 기비',   fert:'퇴비+복합비료',                  type:'시비'},
       {work:'배추 추비',        fert:'요소 — 정식 2주 후 ~ 결구 전',    type:'시비'},
       {work:'가을 진딧물 방제', fert:'아세타미프리드',                  type:'방제'},
       {work:'🥜땅콩 수확 후 토양 관리',fert:'퇴비 환원 — 다음 작기 준비',type:'시비'}],
  10: [{work:'과수 가을 기비',   fert:'용성인비+황산칼륨',              type:'시비'},
       {work:'헤이즐넛 추비',    fert:'복합비료 — 수확 후',             type:'시비'},
       {work:'낙엽 전 방제',     fert:'코사이드수화제(동수화제)',                    type:'방제'}],
  11: [{work:'유기물 퇴비 기비', fert:'완숙 퇴비 전체 과수',            type:'시비'},
       {work:'마늘·양파 월동 비료',fert:'복합비료 소량',                type:'시비'},
       {work:'월동 해충 방제',   fert:'기계유유제(클린유)',                    type:'방제'}],
  12: [{work:'방제 장비·비료 계획',fert:'연간 계획 수립',               type:'계획'}],
  1:  [{work:'비료 재고 파악',   fert:'3월 기비용 구입 준비',           type:'계획'}],
  2:  [{work:'동계 방제',        fert:'석회유황합제',                   type:'방제'},
       {work:'기비 준비',        fert:'퇴비·복합비료 구입',             type:'시비'}],
};

async function loadPestInfo() {
  const panel   = document.getElementById('pestLivePanel');
  const pestEl  = document.getElementById('pestLiveBody');
  const fertEl  = document.getElementById('fertLiveBody');
  const dateEl  = document.getElementById('pestDateTitle');
  const fdateEl = document.getElementById('fertDateTitle');
  const btn     = document.getElementById('pestRefreshBtn');
  if (!panel) return;

  // 패널 표시
  panel.style.display = 'block';

  const d = REAL_TODAY;
  const dayNames = ['일','월','화','수','목','금','토'];
  const month    = d.getMonth() + 1;
  const dateStr  = `${d.getMonth()+1}월 ${d.getDate()}일(${dayNames[d.getDay()]})`;
  if (dateEl)  dateEl.textContent  = `${dateStr} 병해충 위험도`;
  if (fdateEl) fdateEl.textContent = `${dateStr} 시비 작업`;
  if (btn) btn.textContent = '⏳ 분석 중...';

  if (pestEl) pestEl.innerHTML = `<div style="text-align:center;padding:20px;color:#9E9E9E">
    <div style="font-size:24px">🔬</div><div style="font-size:16px;margin-top:6px">날씨 분석 중...</div></div>`;

  // ── 시비 먼저 표시 (날씨 불필요) ────────────────────────
  const todayFerts = myFertSchedule[month] || [];
  if (fertEl) {
    if (todayFerts.length === 0) {
      fertEl.innerHTML = `<div style="text-align:center;padding:20px;color:#9E9E9E">
        <div style="font-size:28px">✅</div>
        <div style="font-size:17px;margin-top:8px">${month}월은 주요 시비 작업이 없습니다</div></div>`;
    } else {
      let fHtml = '';
      todayFerts.forEach(f => {
        fHtml += `
          <div style="border-left:3px solid #2E7D32;padding:10px 12px;margin-bottom:8px;
            background:#F9FBE7;border-radius:0 8px 8px 0">
            <div style="display:flex;align-items:center;gap:8px;margin-bottom:5px">
              <span style="font-size:20px">${f.emoji}</span>
              <div>
                <div style="font-size:17px;font-weight:700;color:#1B5E20">${f.work}</div>
                <div style="font-size:10px;color:#558B2F">${f.group}</div>
              </div>
            </div>
            <div style="font-size:16px;color:#37474F;line-height:1.8">
              📋 내용: ${f.detail}<br>
              💊 비료: <b>${f.fertilizer}</b>${f.amount !== '—' ? `<br>📏 용량: ${f.amount}` : ''}<br>
              ${(() => {
                if (typeof nhFertilizers === 'undefined') return '';
                const nhM = [];
                for (const [fn, fi] of Object.entries(nhFertilizers)) {
                  if (!fi.months.includes(month)) continue;
                  const gw = f.group.split(/[·,·\s]+/);
                  if (fi.crops.some(c => gw.some(g => g.includes(c.split(' ')[0])||c.includes(g))))
                    nhM.push(fn);
                }
                return nhM.length
                  ? `<span style="display:inline-block;margin-top:3px;font-size:10px;
                      background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:8px;
                      font-weight:700">🏪 보유비료: ${(() => {
                      const sorted = [...nhM].sort((a,b)=>(nhFertilizers[a]?.priority||9)-(nhFertilizers[b]?.priority||9));
                      const top = sorted[0];
                      const fi = nhFertilizers[top];
                      const amt = fi ? fi.amount.split('·')[0].trim() : '';
                      const topStr = '⭐ ' + top + '(' + amt + ')';
                      const rest = sorted.slice(1).join('·');
                      return sorted.length > 1 ? topStr + ' 외 ' + (sorted.length-1) + '종(' + rest + ')' : topStr;
                    })()}</span><br>`
                  : '';
              })()}
              ⏰ 시기: ${f.timing}
              ${f.caution ? `<br>⚠️ 주의: <span style="color:#E65100">${f.caution}</span>` : ''}
            </div>
          </div>`;
      });
      fertEl.innerHTML = fHtml;
    }
  }

  // ── 날씨 데이터로 병해충 위험도 분석 ────────────────────
  try {
    const url = 'https://api.open-meteo.com/v1/forecast'
      + '?latitude=37.1994&longitude=126.8316'
      + '&daily=temperature_2m_max,temperature_2m_min,'
      + 'precipitation_probability_max,precipitation_sum,windspeed_10m_max'
      + '&hourly=relativehumidity_2m'
      + '&timezone=Asia%2FSeoul&forecast_days=1';
    const res  = await fetch(url);
    if (!res.ok) throw new Error('날씨 오류');
    const data = await res.json();
    const daily = data.daily, hourly = data.hourly;

    const maxTemp = daily.temperature_2m_max[0];
    const minTemp = daily.temperature_2m_min[0];
    const rainPct = daily.precipitation_probability_max[0];
    const precip  = daily.precipitation_sum[0] || 0;
    const windMs  = (daily.windspeed_10m_max[0]/3.6).toFixed(1);
    const humH    = hourly.relativehumidity_2m.slice(6,18);
    const avgHum  = Math.round(humH.reduce((a,b)=>a+b,0)/humH.length);

    // 내 작물 그룹 × 병해충 교차 분석
    const groupRisks = [];

    for (const [group, info] of Object.entries(myPlantPests)) {
      const inSeason = info.peak_months.includes(month);
      const groupPestResults = [];

      for (const pestName of info.pests) {
        const p = pestDetail[pestName];
        if (!p) continue;

        let score = 0;
        const reasons = [];

        if (maxTemp >= p.risk_temp[0] && maxTemp <= p.risk_temp[1] + 5) {
          score += 2; reasons.push(`기온${Math.round(maxTemp)}°C`);
        }
        if (p.risk_hum > 0 && avgHum >= p.risk_hum) {
          score += 2; reasons.push(`습도${avgHum}%`);
        }
        if (p.risk_hum > 0 && precip > 5) {
          score += 1; reasons.push(`강수${precip.toFixed(1)}mm`);
        }
        if (inSeason) score += 1;

        if (score >= 1) {
          let level, lBg, lTc;
          if      (score >= 5) { level='🔴 높음'; lBg='#FFEBEE'; lTc='#C62828'; }
          else if (score >= 3) { level='🟡 보통'; lBg='#FFF3E0'; lTc='#E65100'; }
          else                 { level='🟢 낮음'; lBg='#E8F5E9'; lTc='#1B5E20'; }
          groupPestResults.push({pestName, p, score, level, lBg, lTc, reasons});
        }
      }

      if (groupPestResults.length > 0) {
        const maxScore = Math.max(...groupPestResults.map(r => r.score));
        groupPestResults.sort((a,b) => b.score - a.score);
        groupRisks.push({group, info, pests: groupPestResults, maxScore, inSeason});
      }
    }

    groupRisks.sort((a,b) => b.maxScore - a.maxScore);

    // 요약
    const highCount = groupRisks.filter(g => g.maxScore >= 5).length;
    const midCount  = groupRisks.filter(g => g.maxScore >= 3 && g.maxScore < 5).length;
    let sumBg='#E8F5E9',sumTc='#1B5E20',sumMsg='오늘 내 작물 병해충 위험 낮음 ✅';
    if (highCount >= 1) { sumBg='#FFEBEE'; sumTc='#C62828'; sumMsg=`🔴 ${highCount}개 작물군 높은 위험 — 즉시 방제 검토`; }
    else if (midCount >= 2) { sumBg='#FFF3E0'; sumTc='#E65100'; sumMsg=`🟡 ${midCount}개 작물군 주의 필요`; }

    let html = `
      <div style="background:${sumBg};border-radius:10px;padding:12px 14px;margin-bottom:10px">
        <div style="font-size:17px;font-weight:800;color:${sumTc}">${sumMsg}</div>
        <div style="font-size:16px;color:${sumTc};opacity:0.85;margin-top:3px">
          ${Math.round(maxTemp)}°C · 습도${avgHum}% · 강수${rainPct}% · ${month}월 기준
        </div>
      </div>`;

    if (groupRisks.length === 0) {
      html += `<div style="text-align:center;padding:20px;color:#9E9E9E">
        <div style="font-size:32px">✅</div>
        <div style="font-size:17px;margin-top:8px">오늘은 내 작물의 병해충 위험이 낮습니다</div></div>`;
    } else {
      groupRisks.forEach(g => {
        const topScore = g.pests[0].score;
        const gBg = topScore>=5?'#FFF0F0':topScore>=3?'#FFFBF0':'#F0FFF4';
        const gBorder = topScore>=5?'#C62828':topScore>=3?'#E65100':'#2E7D32';
        html += `
          <div style="background:${gBg};border-left:3px solid ${gBorder};
            border-radius:0 10px 10px 0;padding:10px 12px;margin-bottom:10px">
            <div style="font-size:17px;font-weight:800;color:#37474F;margin-bottom:6px">
              ${g.info.emoji} ${g.group}
              ${g.inSeason?'<span style="font-size:10px;background:#FFEBEE;color:#C62828;padding:2px 7px;border-radius:10px;margin-left:6px;font-weight:700">⚠ 최성기</span>':''}
            </div>
            ${g.pests.map(r=>`
              <div style="display:flex;align-items:flex-start;gap:8px;
                padding:6px 8px;background:white;border-radius:8px;margin-bottom:5px">
                <span style="font-size:18px;flex-shrink:0">${r.p.emoji}</span>
                <div style="flex:1;min-width:0">
                  <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span style="font-size:16px;font-weight:700;color:${r.p.tc}">${r.pestName}</span>
                    <span style="font-size:10px;background:${r.lBg};color:${r.lTc};
                      padding:2px 8px;border-radius:10px;font-weight:700">${r.level}</span>
                    <span style="font-size:10px;color:#9E9E9E">${r.reasons.join('·')}</span>
                  </div>
                  <div style="font-size:16px;color:#546E7A;margin-top:3px">
                    🔬 ${r.p.symptom} &nbsp;|&nbsp; 💊 ${r.p.control}
                  </div>
                </div>
              </div>`).join('')}
          </div>`;
      });
    }

    if (pestEl) pestEl.innerHTML = html;
    if (btn) btn.textContent = '🔄 오늘 병해충·시비';

  } catch(err) {
    if (pestEl) pestEl.innerHTML = `<div style="background:#FFF3E0;border-radius:8px;padding:12px;text-align:center">
      <div style="font-size:16px;color:#E65100;font-weight:700">⚠ 날씨 연결 실패 — 병해충 분석 불가</div>
      <div style="font-size:16px;color:#E65100;margin-top:4px">시비 정보는 위에서 확인하세요</div></div>`;
    if (btn) btn.textContent = '🔄 오늘 병해충·시비';
  }
}

let pestCalLoaded = false;
function togglePestCalendar() {
  const panel = document.getElementById('pestCalendarPanel');
  if (!panel) return;
  const isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (!isOpen && !pestCalLoaded) { renderPestCalendar(); pestCalLoaded = true; }
  if (!isOpen) panel.scrollIntoView({behavior:'smooth', block:'start'});
}

function renderPestCalendar() {
  const body = document.getElementById('pestCalBody');
  if (!body) return;
  const curMonth = REAL_TODAY.getMonth() + 1;
  const mNames   = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];
  let html = '';
  for (let m = 1; m <= 12; m++) {
    const works = pestCalendar[m] || [];
    if (works.length === 0) continue;
    const isCur = m === curMonth;
    const typeColors = {시비:{bg:'#E8F5E9',tc:'#1B5E20'}, 방제:{bg:'#FFEBEE',tc:'#C62828'}, 계획:{bg:'#E3F2FD',tc:'#1565C0'}};
    html += `
      <div style="background:${isCur?'#F1F8E9':'#FAFAFA'};border-radius:10px;
        padding:10px 12px;margin-bottom:8px;border-left:3px solid ${isCur?'#2E7D32':'#E0E0E0'}">
        <div style="font-size:17px;font-weight:700;color:${isCur?'#1B5E20':'#37474F'};margin-bottom:8px">
          ${mNames[m-1]}${isCur?' ← 이번달':''}
        </div>
        ${works.map(w => {
          const tc = typeColors[w.type] || {bg:'#F5F5F5',tc:'#757575'};
          return `<div style="display:flex;gap:8px;margin-bottom:6px;align-items:flex-start">
            <span style="font-size:10px;font-weight:700;background:${tc.bg};color:${tc.tc};
              padding:2px 8px;border-radius:10px;white-space:nowrap;flex-shrink:0">${w.type} ${w.work}</span>
            <span style="font-size:16px;color:#546E7A;line-height:1.5">${w.fert}</span>
          </div>`;
        }).join('')}
      </div>`;
  }
  body.innerHTML = html;
}

// ── 보유비료 현황 렌더 ───────────────────────────────────
function renderNhFertList() {
  const el = document.getElementById('nhFertList');
  if (!el || typeof nhFertilizers === 'undefined') return;
  const month = REAL_TODAY.getMonth() + 1;

  let html = '';
  for (const [fname, f] of Object.entries(nhFertilizers)) {
    const active = f.months.includes(month);
    const border = active ? `2px solid ${f.tc}` : '1px solid #E0E0E0';
    const bg     = active ? f.color : '#FAFAFA';
    const tcCol  = active ? f.tc    : '#9E9E9E';

    // 이달 내 작물 매칭
    const allMyPlantNames = typeof allPlants !== 'undefined'
      ? allPlants.map(p => p.name) : [];
    const matched = f.crops.filter(c =>
      allMyPlantNames.some(p => p.includes(c.split(' ')[0]) || c.includes(p.split(' ')[0]))
    ).slice(0, 4);

    html += `
      <div style="border:${border};background:${bg};border-radius:10px;
        padding:11px 13px;margin-bottom:8px">
        <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
          <div style="flex:1">
            <div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:4px">
              <span style="font-size:17px;font-weight:800;color:${tcCol}">${fname}</span>
              <span style="font-size:10px;background:${active?f.color:'#F5F5F5'};
                color:${tcCol};padding:2px 8px;border-radius:10px;font-weight:700">
                ${f.type}</span>
              ${active
                ? (f.priority===1
                    ? `<span style="font-size:10px;background:#C62828;color:white;
                        padding:2px 9px;border-radius:10px;font-weight:700">⭐ 최우선 사용</span>`
                    : f.priority===2
                      ? `<span style="font-size:10px;background:#E65100;color:white;
                          padding:2px 9px;border-radius:10px;font-weight:700">⭐⭐ 권장</span>`
                      : `<span style="font-size:10px;background:#FFF3E0;color:#E65100;
                          padding:2px 9px;border-radius:10px;font-weight:700">보조 사용</span>`)
                : `<span style="font-size:10px;background:#F5F5F5;color:#9E9E9E;
                    padding:2px 8px;border-radius:10px">이달 미사용(${f.months.join('·')}월)</span>`}
            </div>
            <div style="font-size:16px;font-weight:600;color:${tcCol};margin-bottom:3px">
              📊 ${f.npk}
            </div>
            <div style="font-size:16px;color:#546E7A;margin-bottom:4px">${f.feature}</div>
            ${matched.length > 0 ? `
            <div style="font-size:10px;color:${tcCol};font-weight:600">
              🌱 내 작물 적용: ${matched.join(' · ')}${matched.length < f.crops.length ? ' 외' : ''}
            </div>` : ''}
            <div style="background:white;border-radius:6px;padding:7px 10px;margin-top:7px;
              font-size:16px;color:#37474F;line-height:1.9">
              📏 <b style="color:${tcCol}">용량: ${f.amount}</b><br>
              ⏰ 시기: ${f.timing}<br>
              ${f.caution ? `⚠️ <span style="color:#E65100">${f.caution}</span>` : ''}
            </div>
          </div>
        </div>
      </div>`;
  }
  el.innerHTML = html;
}

// ══════════════════════════════════════════════════════════
// 농약·비료 통합 DB — 내 과수원 작물 기준 (~1MB)
// 화성시 새솔동 · 유실수15종 + 밭작물 기반

// ── 농협 농약 성분 → 제품명 매핑 ────────────────────────────
const nhPesticideMap = {
  '훼나리몰':         '훼나리몰수화제',
  '트리플록시스트로빈': '플린트수화제',
  '메탈락실':         '리도밀골드수화제',
  '포세틸알루미늄':   '알리에테수화제',
  '이프로디온':       '로브랄수화제',
  '테부코나졸':       '실바코액상수화제',
  '사이프로디닐':     '스위치입상수화제',
  '이미다클로프리드': '코니도수화제',
  '아세타미프리드':   '모스피란수화제',
  '에토펜프록스':     '트레본유제',
  '람다사이할로트린': '카라테수화제',
  '밀베멕틴':         '밀베녹수화제',
  '클로르페나피르':   '렘페이지액상수화제',
  '디아지논':         '다이아톤유제',
  '클로르피리포스':   '더스반유제',
  '페녹시카브':       '인사이터액상수화제',
  '보르도액':         '보르도액(동수화제)',
  '기계유':           '기계유유제(클린유)',
  '석회유황합제':     '석회유황합제',
};

// ── 재배 그림 탭 전환 ────────────────────────────────────
const guideNames = ['watermelon','tomato','melon','cucumber','pumpkin','graft','graft_melon','graft_pumpkin'];
function showGuide(name) {
  guideNames.forEach(n => {
    const el  = document.getElementById('guide-' + n);
    const btn = document.getElementById('gtab-' + n);
    if (!el || !btn) return;
    const active = n === name;
    el.style.display    = active ? 'block' : 'none';
    btn.style.background= active ? '#1B5E20' : 'white';
    btn.style.color     = active ? 'white'   : '#757575';
    btn.style.borderColor= active ? '#1B5E20' : '#E0E0E0';
  });
}

// ══════════════════════════════════════════════════════════
// 구글 스프레드시트 LayoutData 연동
// ══════════════════════════════════════════════════════════
SHEET_ID = '17b2tw8uVm-cqpHoyhm1JkZfC5d4CcM1Ng7J9Z6tIhK4';
const SHEET_GID = '0';
const SHEET_NAME = 'LayoutData';

let gsheetData = [];   // 불러온 데이터 캐시
let gsheetHeaders = []; // 헤더 행

// 읽기: 공개 CSV export API
function loadSheetData() {
  const btn  = document.getElementById('sheetRefreshBtn');
  const body = document.getElementById('sheetBody');
  if (btn) btn.textContent = '⏳ 불러오는 중...';
  if (body) body.innerHTML = '<div style="text-align:center;padding:20px;color:#9E9E9E">'
    + '<div style="font-size:20px">📊</div>'
    + '<div style="font-size:16px;margin-top:8px">구글 시트 연결 중...</div></div>';

  // 기존 스크립트 제거
  const old = document.getElementById('sheetScript');
  if (old) old.remove();

  const timer = setTimeout(() => {
    if (btn) btn.textContent = '🔄 새로고침';
    if (body) body.innerHTML = '<div style="background:#FFEBEE;border-radius:8px;padding:14px">'
      + '<div style="font-size:17px;font-weight:700;color:#C62828">⚠ 시간 초과</div>'
      + '<div style="font-size:16px;color:#E53935;margin-top:6px;line-height:1.8">'
      + '구글 시트 공유 설정 확인:<br>공유 → "링크 있는 모든 사용자" → 뷰어 이상</div>'
      + '<button onclick="loadSheetData()" style="margin-top:10px;width:100%;padding:10px;'
      + 'background:#1B5E20;color:white;border:none;border-radius:8px;'
      + 'font-size:17px;font-weight:700;cursor:pointer;font-family:inherit">🔄 다시 시도</button></div>';
  }, 10000);

  const cbName = 'sheetCb_' + Date.now();
  window[cbName] = function(data) {
    clearTimeout(timer);
    delete window[cbName];
    const s = document.getElementById('sheetScript');
    if (s) s.remove();
    if (btn) btn.textContent = '🔄 새로고침';
    try {
      if (!data || !data.table) throw new Error('데이터 없음 — 시트가 비어있거나 비공개입니다');
      const cols = data.table.cols;
      const rows = data.table.rows || [];
      gsheetHeaders = cols.map(c => c.label || c.id || '');
      gsheetData    = rows.map(r =>
        (r.c || []).map(cell => (cell && cell.v !== null && cell.v !== undefined) ? String(cell.v).trim() : '')
      ).filter(r => r.some(c => c));
      renderSheetTable();
      showToast('✅ 시트 연동 성공 (' + gsheetData.length + '행)');
    } catch(err) {
      if (body) body.innerHTML = '<div style="background:#FFEBEE;border-radius:8px;padding:14px">'
        + '<div style="font-size:17px;font-weight:700;color:#C62828">⚠ ' + err.message + '</div>'
        + '<button onclick="loadSheetData()" style="margin-top:10px;width:100%;padding:10px;'
        + 'background:#1B5E20;color:white;border:none;border-radius:8px;'
        + 'font-size:17px;font-weight:700;cursor:pointer;font-family:inherit">🔄 다시 시도</button></div>';
    }
  };

  const script = document.createElement('script');
  script.id  = 'sheetScript';
  script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`
             + `?gid=${SHEET_GID}&tqx=out:json;responseHandler:${cbName}`;
  script.onerror = () => {
    clearTimeout(timer);
    delete window[cbName];
    if (btn) btn.textContent = '🔄 새로고침';
    if (body) body.innerHTML = '<div style="background:#FFEBEE;border-radius:8px;padding:14px">'
      + '<div style="font-size:17px;font-weight:700;color:#C62828">⚠ 시트 로드 실패</div>'
      + '<div style="font-size:16px;color:#E53935;margin-top:6px">공유 설정 확인 후 다시 시도하세요</div>'
      + '<button onclick="loadSheetData()" style="margin-top:10px;width:100%;padding:10px;'
      + 'background:#1B5E20;color:white;border:none;border-radius:8px;'
      + 'font-size:17px;font-weight:700;cursor:pointer;font-family:inherit">🔄 다시 시도</button></div>';
  };
  document.head.appendChild(script);
}

// 테이블 렌더링
function renderSheetTable() {
  const body = document.getElementById('sheetBody');
  if (!body) return;

  if (!gsheetData.length) {
    body.innerHTML = '<div style="text-align:center;padding:20px;color:#9E9E9E">데이터가 없습니다</div>';
    return;
  }

  // 검색 필터
  const q = (document.getElementById('sheetSearch')?.value || '').toLowerCase();
  const filtered = q
    ? gsheetData.filter(row => row.some(cell => cell.toLowerCase().includes(q)))
    : gsheetData;

  const total = gsheetData.length;
  const shown = filtered.length;

  let html = `<div style="font-size:16px;color:#9E9E9E;margin-bottom:8px">
    전체 ${total}행 중 ${shown}행 표시</div>`;

  // 테이블 (가로 스크롤)
  html += `<div style="overflow-x:auto;-webkit-overflow-scrolling:touch;border-radius:8px;border:1px solid #E0E0E0">
    <table style="width:100%;border-collapse:collapse;font-size:16px;min-width:${Math.max(gsheetHeaders.length * 90, 300)}px">
      <thead>
        <tr style="background:#1B5E20;position:sticky;top:0">
          ${gsheetHeaders.map(h =>
            `<th style="padding:8px 10px;color:white;font-weight:700;text-align:left;
              white-space:nowrap">${h}</th>`
          ).join('')}
        </tr>
      </thead>
      <tbody>
        ${filtered.map((row, ri) => `
          <tr style="background:${ri%2===0?'white':'#F9FBE7'}" onclick="showRowDetail(${ri})">
            ${row.map(cell =>
              `<td style="padding:7px 10px;border-bottom:1px solid #F0F0F0;
                white-space:nowrap;cursor:pointer">${cell||'—'}</td>`
            ).join('')}
          </tr>`
        ).join('')}
      </tbody>
    </table>
  </div>`;

  body.innerHTML = html;
}

// 행 상세 보기
function showRowDetail(rowIdx) {
  const body   = document.getElementById('sheetBody');
  const q      = (document.getElementById('sheetSearch')?.value || '').toLowerCase();
  const filtered = q
    ? gsheetData.filter(row => row.some(cell => cell.toLowerCase().includes(q)))
    : gsheetData;
  const row    = filtered[rowIdx];
  if (!row) return;

  const detail = gsheetHeaders.map((h,i) => `
    <div style="display:flex;gap:10px;padding:8px 0;border-bottom:1px solid #F0F0F0;align-items:flex-start">
      <span style="font-size:16px;font-weight:700;color:#1B5E20;min-width:90px;flex-shrink:0">${h}</span>
      <span style="font-size:16px;color:#37474F;flex:1">${row[i]||'—'}</span>
    </div>`).join('');

  document.getElementById('rowDetailContent').innerHTML = detail;
  document.getElementById('rowDetailModal').classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeRowDetail() {
  document.getElementById('rowDetailModal').classList.remove('open');
  document.body.style.overflow = '';
}

// 기록 추가 (Apps Script Web App 경유)
// ⚠ 쓰기는 Google Apps Script 배포 URL이 필요
// 현재는 로컬 임시 저장 후 시트 URL로 안내
let pendingEntries = JSON.parse(localStorage.getItem('sheetPending') || '[]');

function openAddRecord() {
  const modal = document.getElementById('addRecordModal');
  if (!modal) return;
  // 헤더 기반으로 입력 폼 동적 생성
  const form = document.getElementById('addRecordForm');
  if (form && gsheetHeaders.length) {
    form.innerHTML = gsheetHeaders.map((h,i) =>
      `<div class="modal-field">
        <div class="modal-label">${h}</div>
        <input type="text" class="modal-text" id="rec_${i}"
          placeholder="${h} 입력..." autocomplete="off">
      </div>`
    ).join('');
  } else if (form) {
    form.innerHTML = `<div style="text-align:center;padding:16px;color:#9E9E9E">
      먼저 시트 데이터를 불러오세요</div>`;
  }
  modal.classList.add('open');
  document.body.style.overflow = 'hidden';
}

function closeAddRecord(e) {
  if (e && e.target !== document.getElementById('addRecordModal')) return;
  document.getElementById('addRecordModal').classList.remove('open');
  document.body.style.overflow = '';
}

function saveRecord() {
  if (!gsheetHeaders.length) {
    showToast('먼저 시트 데이터를 불러오세요');
    return;
  }
  const entry = {};
  let hasData = false;
  gsheetHeaders.forEach((h,i) => {
    const val = document.getElementById('rec_'+i)?.value.trim() || '';
    entry[h] = val;
    if (val) hasData = true;
  });
  entry['_timestamp'] = new Date().toISOString().slice(0,19).replace('T',' ');

  if (!hasData) { showToast('⚠ 최소 한 개 이상 입력하세요'); return; }

  pendingEntries.push(entry);
  localStorage.setItem('sheetPending', JSON.stringify(pendingEntries));

  document.getElementById('addRecordModal').classList.remove('open');
  document.body.style.overflow = '';
  renderPendingList();
  showToast('✅ 임시 저장 완료 (시트에 직접 입력 후 동기화 필요)');
}

function renderPendingList() {
  const el = document.getElementById('pendingList');
  if (!el) return;
  const card = document.getElementById('pendingCard');
  if (card) card.style.display = pendingEntries.length ? 'block' : 'none';
  if (!pendingEntries.length) return;

  el.innerHTML = pendingEntries.map((e,i) => {
    const preview = Object.entries(e)
      .filter(([k]) => !k.startsWith('_'))
      .slice(0,3)
      .map(([k,v]) => v ? `${k}: ${v}` : '')
      .filter(Boolean).join(' · ');
    return `<div style="padding:8px 0;border-bottom:1px solid #F0F0F0;
      display:flex;align-items:flex-start;justify-content:space-between;gap:8px">
      <div>
        <div style="font-size:16px;color:#1B5E20;font-weight:600">${e._timestamp}</div>
        <div style="font-size:16px;color:#37474F;margin-top:2px">${preview}</div>
      </div>
      <button onclick="deletePending(${i})" style="background:#FFEBEE;border:none;color:#C62828;
        border-radius:6px;padding:4px 8px;font-size:16px;cursor:pointer;font-family:inherit;
        flex-shrink:0">삭제</button>
    </div>`;
  }).join('');
}

function deletePending(i) {
  pendingEntries.splice(i,1);
  localStorage.setItem('sheetPending', JSON.stringify(pendingEntries));
  renderPendingList();
  showToast('🗑️ 임시 기록 삭제');
}

function openSheet() {
  window.open('https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit#gid=${SHEET_GID}', '_blank');
}

let sheetAutoLoaded = false;

// ══════════════════════════════════════════════════════════
// 농자재 관리 시스템 v2 — 작물 지정 + 전체 적용
// ══════════════════════════════════════════════════════════

mySupplies = JSON.parse(localStorage.getItem('mySupplies') || '[]');

// 기본 보유비료 5종 초기화
function initDefaultSupplies() {
  if (mySupplies.length === 0) {
    const defaults = [
      {id:'s1',type:'비료',name:'단한번비료',ingredient:'N22-P9-K9 완효성',amount:'보유중',
       purchaseTime:'보유중',months:'4·5·6',
       crops:['수박','참외','오이','호박','고구마','감자','배추','무'],addedDate:''},
      {id:'s2',type:'비료',name:'엔케이플러스',ingredient:'N17-K17 착과추비',amount:'보유중',
       purchaseTime:'보유중',months:'5·6·7·8·9',
       crops:['사과','살구','매실','블랙베리','복분자','수박','참외','마늘','양파'],addedDate:''},
      {id:'s3',type:'비료',name:'원예맞춤고추비료',ingredient:'N12-P6-K12+Ca·Mg',amount:'보유중',
       purchaseTime:'보유중',months:'5·6·7·8',
       crops:['수박','참외','오이','호박','사과','살구'],addedDate:''},
      {id:'s4',type:'비료',name:'일회만비료',ingredient:'N21-P9-K9 완효성',amount:'보유중',
       purchaseTime:'보유중',months:'3·4·8·9·10',
       crops:['배추','무','감자','고구마','양파','마늘','선비잡이콩','머루콩','동부'],addedDate:''},
      {id:'s5',type:'비료',name:'슈퍼복합비료',ingredient:'N21-P17-K17 균형형',amount:'보유중',
       purchaseTime:'보유중',months:'3·4·5·8·9·10·11',
       crops:['사과','살구','매실','헤이즐넛','모과','마르멜로','앵두','머루포도',
               '바이오체리','수박','참외','오이','호박','배추','무','감자',
               '고구마','양파','마늘'],addedDate:''},
    ];
    mySupplies = defaults;
    localStorage.setItem('mySupplies', JSON.stringify(mySupplies));
  }
}

// ── 작물 체크박스 렌더 ──────────────────────────────────────
function renderCropCheckList() {
  const el = document.getElementById('cropCheckList');
  if (!el || typeof allPlants === 'undefined') return;

  // 이랑별 그룹핑
  const groups = {};
  allPlants.forEach(p => {
    const key = p.zone + ' ' + p.irang;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });

  let html = '';
  for (const [gkey, plants] of Object.entries(groups)) {
    html += `<div style="font-size:16px;font-weight:700;color:#546E7A;
      padding:4px 0;border-bottom:1px solid #F0F0F0;margin-bottom:4px">${gkey}</div>`;
    plants.forEach(p => {
      html += `<label style="display:flex;align-items:center;gap:7px;
        padding:4px 0;cursor:pointer;font-size:16px;color:#37474F">
        <input type="checkbox" value="${p.id}" data-name="${p.name}"
          data-cat="${p.cat}" data-zone="${p.zone}"
          onchange="updateSelectedCount()"
          style="width:16px;height:16px;cursor:pointer">
        <span>${p.emoji} ${p.name}</span>
        <span style="font-size:10px;color:#9E9E9E">(${p.irang})</span>
      </label>`;
    });
  }
  el.innerHTML = html;
}

function selectAllCrops() {
  document.querySelectorAll('#cropCheckList input[type=checkbox]')
    .forEach(cb => cb.checked = true);
  updateSelectedCount();
}

function clearCropSelect() {
  document.querySelectorAll('#cropCheckList input[type=checkbox]')
    .forEach(cb => cb.checked = false);
  updateSelectedCount();
}

function selectCropGroup(group) {
  document.querySelectorAll('#cropCheckList input[type=checkbox]')
    .forEach(cb => {
      const cat  = cb.getAttribute('data-cat');
      const zone = cb.getAttribute('data-zone');
      cb.checked = (cat === group || zone === group);
    });
  updateSelectedCount();
}

function updateSelectedCount() {
  const count = document.querySelectorAll('#cropCheckList input:checked').length;
  const el    = document.getElementById('selectedCropCount');
  if (el) el.textContent = count > 0 ? `✅ ${count}개 작물 선택됨` : '';
}

function getSelectedCropNames() {
  return Array.from(document.querySelectorAll('#cropCheckList input:checked'))
    .map(cb => cb.getAttribute('data-name'));
}

// ── 농자재 저장 ────────────────────────────────────────────

function toggleAdvancedForm() {
  const el = document.getElementById('advancedForm');
  const btn = el?.previousElementSibling;
  if (!el) return;
  const opening = el.style.display === 'none';
  el.style.display = opening ? 'block' : 'none';
  if (btn) btn.textContent = opening
    ? '▲ 상세 입력 접기'
    : '▼ 상세 입력 (선택사항 — 비워도 됩니다)';
  if (opening) renderCropCheckList();
}

function toggleSupplyForm() {
  const form = document.getElementById('supplyForm');
  if (!form) return;
  const opening = form.style.display === 'none';
  form.style.display = opening ? 'block' : 'none';
  if (opening) renderCropCheckList();
}

function saveSupply() {
  const type   = document.getElementById('supplyType')?.value || '';
  const name   = document.getElementById('supplyName')?.value.trim() || '';
  const ingr   = document.getElementById('supplyIngredient')?.value.trim() || '';
  const amount = document.getElementById('supplyAmount')?.value.trim() || '';
  const ptime  = document.getElementById('supplyPurchaseTime')?.value || '보유중';
  const months = document.getElementById('supplyMonths')?.value.trim() || '';
  const cropNames = getSelectedCropNames();

  if (!name) { showToast('⚠ 제품명을 입력하세요'); return; }

  const entry = {
    id: Date.now().toString(),
    type, name, ingredient: ingr, amount, purchaseTime: ptime,
    months, crops: cropNames, addedDate: toYMD(REAL_TODAY),
  };
  mySupplies.push(entry);
  localStorage.setItem('mySupplies', JSON.stringify(mySupplies));
  ['supplyName','supplyIngredient','supplyAmount','supplyMonths']
    .forEach(id => { const el=document.getElementById(id); if(el) el.value=''; });
  clearCropSelect();
  document.getElementById('supplyForm').style.display = 'none';

  renderSupplyList();
  renderPurchasePlan();
  showToast(`✅ ${name} 저장 완료 (적용 작물: ${cropNames.length}개)`);
  // 묘목·작물 종류면 이랑현황 추가 제안
  if (['묘목','작물'].includes(type)) {
    onSupplySaved(entry);
  }
}

function editSupply(id) {
  const s = mySupplies.find(x => x.id === id);
  if (!s) return;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
    'background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center';

  overlay.innerHTML = `
    <div style="background:white;border-radius:14px;padding:20px;width:90%;max-width:400px;
      max-height:85vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
      <div style="font-size:15px;font-weight:700;color:#1565C0;margin-bottom:14px">✏️ 농자재 수정</div>
      <div style="font-size:11px;color:#9E9E9E;margin-bottom:6px">품목명</div>
      <input id="_sName" type="text" value="${s.name||''}"
        style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;
        font-size:14px;margin-bottom:10px;box-sizing:border-box">
      <div style="font-size:11px;color:#9E9E9E;margin-bottom:6px">구입일</div>
      <input id="_sDate" type="date" value="${s.date||''}"
        style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;
        font-size:14px;margin-bottom:10px;box-sizing:border-box">
      <div style="font-size:11px;color:#9E9E9E;margin-bottom:6px">금액(원)</div>
      <input id="_sPrice" type="number" value="${s.price||0}"
        style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;
        font-size:14px;margin-bottom:10px;box-sizing:border-box">
      <div style="font-size:11px;color:#9E9E9E;margin-bottom:6px">수량/용량</div>
      <input id="_sQty" type="text" value="${s.qty||''}"
        style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;
        font-size:14px;margin-bottom:10px;box-sizing:border-box">
      <div style="font-size:11px;color:#9E9E9E;margin-bottom:6px">메모</div>
      <input id="_sMemo" type="text" value="${s.memo||''}"
        style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;
        font-size:14px;margin-bottom:16px;box-sizing:border-box">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button onclick="this.closest('div[style*=fixed]').remove()"
          style="padding:11px;background:#F5F5F5;border:none;border-radius:8px;
          font-size:14px;cursor:pointer;font-weight:600">취소</button>
        <button onclick="_saveSupplyEdit('${s.id}')"
          style="padding:11px;background:#1565C0;color:white;border:none;
          border-radius:8px;font-size:14px;cursor:pointer;font-weight:700">저장</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', ev => { if(ev.target===overlay) overlay.remove(); });
}

function _saveSupplyEdit(id) {
  const idx = mySupplies.findIndex(x => x.id === id);
  if (idx < 0) return;
  mySupplies[idx].name  = document.getElementById('_sName').value  || mySupplies[idx].name;
  mySupplies[idx].date  = document.getElementById('_sDate').value  || mySupplies[idx].date;
  mySupplies[idx].price = Number(document.getElementById('_sPrice').value) || 0;
  mySupplies[idx].qty   = document.getElementById('_sQty').value;
  mySupplies[idx].memo  = document.getElementById('_sMemo').value;
  localStorage.setItem('mySupplies', JSON.stringify(mySupplies));
  document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]')?.remove();
  renderSupplyList();
  showToast('✅ 농자재 수정 완료');
}

function deleteSupply(id) {
  const s = mySupplies.find(x=>x.id===id);
  if (!s || !confirm(`"${s.name}" 삭제할까요?`)) return;
  mySupplies = mySupplies.filter(x=>x.id!==id);
  localStorage.setItem('mySupplies', JSON.stringify(mySupplies));  renderSupplyList();
  renderPurchasePlan();
  showToast('🗑️ 삭제 완료');
}

// ── 농자재 목록 렌더 ──────────────────────────────────────
function renderSupplyList() {
  const el = document.getElementById('supplyList');
  if (!el) return;
  if (!mySupplies.length) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:#9E9E9E">+ 버튼으로 농자재를 추가하세요</div>';
    return;
  }

  const typeIcon = {비료:'🌱',농약:'🧪',친환경:'🌿',묘목:'🌳',작물:'🥬',기타:'📦'};
  const typeBg   = {비료:'#E8F5E9',농약:'#FFEBEE',친환경:'#F1F8E9',묘목:'#FFF9C4',작물:'#E3F2FD',기타:'#ECEFF1'};
  const typeTc   = {비료:'#1B5E20',농약:'#C62828',친환경:'#2E7D32',묘목:'#854F0B',작물:'#1565C0',기타:'#546E7A'};
  const ptBg = {'보유중':'#E8F5E9','2월구입':'#E3F2FD','8월구입':'#FFF3E0','필요시':'#F5F5F5'};
  const ptTc = {'보유중':'#1B5E20','2월구입':'#1565C0','8월구입':'#E65100','필요시':'#9E9E9E'};

  // 종류별 그룹
  const typeOrder = ['비료','농약','친환경','기타'];
  const groups = {};
  typeOrder.forEach(t => { groups[t] = mySupplies.filter(s=>s.type===t); });

  let html = '';
  typeOrder.forEach(type => {
    const items = groups[type];
    if (!items.length) return;
    html += `<div style="background:${typeBg[type]||'#F5F5F5'};padding:7px 14px;
      font-size:16px;font-weight:700;color:${typeTc[type]||'#546E7A'}">
      ${typeIcon[type]||'📦'} ${type} ${items.length}종</div>`;
    items.forEach(s => {
      // crops가 문자열로 올 경우 배열로 변환
      const _crops = Array.isArray(s.crops) ? s.crops
        : (typeof s.crops === 'string' && s.crops)
          ? (s.crops.startsWith('[') ? (()=>{ try{return JSON.parse(s.crops);}catch(e){return [];} })()
            : s.crops.split(/[·,]/).map(x=>x.trim()).filter(Boolean))
          : [];
      const cropStr = _crops.length
        ? _crops.slice(0,3).join('·') + (_crops.length>3?` 외 ${_crops.length-3}종`:'')
        : '전체';
      html += `
        <div style="padding:11px 14px;border-bottom:1px solid #F5F5F5">
          <div style="display:flex;align-items:flex-start;gap:8px">
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:4px">
                <span style="font-size:17px;font-weight:700;color:#212121">${s.name}</span>
                <span style="font-size:10px;background:${ptBg[s.purchaseTime]||'#F5F5F5'};
                  color:${ptTc[s.purchaseTime]||'#9E9E9E'};padding:2px 8px;
                  border-radius:10px;font-weight:700">${s.purchaseTime}</span>
                ${s.months?`<span style="font-size:10px;background:#F3E5F5;color:#6A1B9A;
                  padding:2px 8px;border-radius:10px;font-weight:600">${s.months}월</span>`:''}
              </div>
              ${s.ingredient?`<div style="font-size:16px;color:#546E7A;margin-bottom:2px">📊 ${s.ingredient}</div>`:''}
              <div style="font-size:16px;color:#1B5E20">🌱 적용: ${cropStr}</div>
              ${s.amount?`<div style="font-size:16px;color:#37474F;margin-top:2px">📦 ${s.amount}</div>`:''}
            </div>
            <button onclick="deleteSupply('${s.id}')"
              style="background:#FFEBEE;border:none;color:#C62828;border-radius:8px;
              padding:5px 10px;font-size:16px;cursor:pointer;font-family:inherit;
              font-weight:600;flex-shrink:0;white-space:nowrap">삭제</button>
              <button onclick="editSupply('${s.id}')"
                style="background:#E3F2FD;border:none;color:#1565C0;font-size:12px;
                padding:5px 8px;border-radius:6px;cursor:pointer;font-weight:600"
                title="수정">✏️ 수정</button>
          </div>
        </div>`;
    });
  });
  el.innerHTML = html;
}

// ── 전체 묘목·작물 농자재 적용 ────────────────────────────
function applySupplyToAll(mode) {
  const resultEl = document.getElementById('applyResult');
  if (!resultEl) return;

  const month = REAL_TODAY.getMonth() + 1;

  // 필터링
  let supplies = [...mySupplies];
  if (mode === '이달') {
    supplies = supplies.filter(s => {
      if (!s.months) return true;
      const ms = s.months.split(/[·,·\s]+/).map(Number);
      return ms.includes(month);
    });
  } else if (mode === '유실수' || mode === '채소') {
    // 적용 작물이 해당 카테고리를 포함하는 것만
    supplies = supplies.filter(s => {
      if (!s.crops?.length) return true;
      return typeof allPlants !== 'undefined' &&
        allPlants.some(p => p.cat === mode && s.crops.includes(p.name));
    });
  }

  if (!supplies.length) {
    resultEl.style.display = 'block';
    resultEl.innerHTML = `<div style="background:#FFF3E0;border-radius:8px;padding:12px;
      text-align:center;color:#E65100">⚠ 해당 조건의 농자재가 없습니다</div>`;
    return;
  }

  // 작물 × 농자재 매칭
  const plantList = typeof allPlants !== 'undefined' ? allPlants : [];
  let targets = plantList;
  if (mode === '유실수') targets = plantList.filter(p=>p.cat==='유실수');
  if (mode === '채소')   targets = plantList.filter(p=>p.cat==='채소');

  // 매칭 결과 생성
  const matchResult = {};
  targets.forEach(plant => {
    const matched = supplies.filter(s => {
      if (!s.crops?.length) return true; // 지정 없으면 전체 적용
      return s.crops.some(c => plant.name.includes(c) || c.includes(plant.name.split(' ')[0]));
    });
    if (matched.length) matchResult[plant.name] = matched;
  });

  const typeIcon = {비료:'🌱',농약:'🧪',친환경:'🌿',기타:'📦'};

  let html = `
    <div style="background:#E8F5E9;border-radius:8px;padding:10px 12px;margin-bottom:10px">
      <div style="font-size:17px;font-weight:700;color:#1B5E20">
        ✅ 적용 완료 — ${Object.keys(matchResult).length}개 작물 매칭
      </div>
      <div style="font-size:16px;color:#2E7D32;margin-top:3px">
        총 ${supplies.length}종 농자재 · ${mode==='이달'?month+'월 기준':mode} 적용
      </div>
    </div>`;

  // 이랑별 표시
  const zoneOrder = ['1구역','사이구역','2구역','온실'];
  const byZone = {};
  Object.entries(matchResult).forEach(([pname, slist]) => {
    const plant = plantList.find(p=>p.name===pname);
    if (!plant) return;
    const zk = plant.zone;
    if (!byZone[zk]) byZone[zk] = [];
    byZone[zk].push({plant, supplies: slist});
  });

  zoneOrder.forEach(zone => {
    const items = byZone[zone];
    if (!items?.length) return;
    html += `<div style="background:#37474F;color:white;padding:7px 12px;
      font-size:16px;font-weight:700;border-radius:6px 6px 0 0;margin-top:8px">
      ${zone} (${items.length}개 작물)</div>`;
    items.forEach(({plant, supplies: slist}) => {
      const tags = slist.map(s =>
        `<span style="font-size:10px;background:${s.type==='비료'?'#E8F5E9':s.type==='농약'?'#FFEBEE':'#E8F5E9'};
          color:${s.type==='비료'?'#1B5E20':s.type==='농약'?'#C62828':'#2E7D32'};
          padding:2px 7px;border-radius:8px;font-weight:700">
          ${typeIcon[s.type]||'📦'}${s.name}</span>`
      ).join(' ');
      html += `<div style="padding:8px 12px;border-bottom:1px solid #F0F0F0;background:white">
        <div style="font-size:16px;font-weight:700;color:#37474F;margin-bottom:4px">
          ${plant.emoji} ${plant.name}
          <span style="font-size:10px;color:#9E9E9E;font-weight:400">(${plant.irang})</span>
        </div>
        <div style="display:flex;gap:4px;flex-wrap:wrap">${tags}</div>
      </div>`;
    });
  });

  // 적용 결과 저장 (오늘 작업 연계용)
  localStorage.setItem('supplyApplyResult', JSON.stringify({
    date: toYMD(REAL_TODAY), mode, count: Object.keys(matchResult).length,
    supplies: supplies.map(s=>({name:s.name,type:s.type}))
  }));

  resultEl.style.display = 'block';
  resultEl.innerHTML = html;
  resultEl.scrollIntoView({behavior:'smooth', block:'start'});
  showToast(`✅ ${Object.keys(matchResult).length}개 작물에 농자재 적용 완료`);
}

// ── 구입 계획 렌더 ─────────────────────────────────────────
function renderPurchasePlan() {
  const el = document.getElementById('purchasePlanBody');
  if (!el) return;
  const plan2 = mySupplies.filter(s=>s.purchaseTime==='2월구입');
  const plan8 = mySupplies.filter(s=>s.purchaseTime==='8월구입');
  const planN = mySupplies.filter(s=>s.purchaseTime==='필요시');

  let html = '';
  const renderGroup = (title, items, bg, tc) => {
    if (!items.length) return;
    html += `<div style="background:${bg};border-radius:8px;padding:10px 12px;margin-bottom:8px">
      <div style="font-size:17px;font-weight:700;color:${tc};margin-bottom:6px">${title}</div>
      ${items.map(s=>`
        <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;flex-wrap:wrap">
          <span style="font-size:16px;font-weight:700;color:${tc}">• ${s.name}</span>
          ${s.ingredient?`<span style="font-size:16px;color:${tc};opacity:0.75">(${s.ingredient})</span>`:''}
          ${s.crops?.length?`<span style="font-size:10px;color:${tc};opacity:0.7">
            적용:${s.crops.slice(0,2).join('·')}${s.crops.length>2?'..':''}</span>`:''}
        </div>`).join('')}
    </div>`;
  };
  renderGroup('📅 2월 20일 구입 예정', plan2, '#E3F2FD', '#1565C0');
  renderGroup('📅 8월 20일 구입 예정', plan8, '#FFF3E0', '#E65100');
  renderGroup('🛒 필요시 구입', planN, '#F5F5F5', '#546E7A');
  el.innerHTML = html || '<div style="text-align:center;padding:12px;color:#9E9E9E">구입 계획 없음</div>';
}

function getSupplyTasksForMonth(month, day) {
  const tasks = [];
  const id = n => `${month}${String(day).padStart(2,'0')}_sup_${n}`;
  if (month === 2 && day >= 15 && day <= 25) {
    const plan2 = mySupplies.filter(s=>s.purchaseTime==='2월구입');
    if (plan2.length) tasks.push({
      id:id('feb'), name:`🛒 2월 20일 구입 예정 — ${plan2.length}종`,
      detail:plan2.map(s=>s.name).join('·'), loc:'🧪 농자재 탭 확인',
      urgent:day>=18, judge:day>=18?'urgent':'warn',
    });
  }
  if (month === 8 && day >= 15 && day <= 25) {
    const plan8 = mySupplies.filter(s=>s.purchaseTime==='8월구입');
    if (plan8.length) tasks.push({
      id:id('aug'), name:`🛒 8월 20일 구입 예정 — ${plan8.length}종`,
      detail:plan8.map(s=>s.name).join('·'), loc:'🧪 농자재 탭 확인',
      urgent:day>=18, judge:day>=18?'urgent':'warn',
    });
  }
  return tasks;
}

function initSupply() {
  initDefaultSupplies();
  renderSupplyList();
  renderPurchasePlan();
}

// 구글 시트 데이터를 앱 농자재로 가져오기
function importFromSheet(rows, headers) {
  // 컬럼 인덱스 매핑 (한글 헤더)
  const colMap = {};
  const keyMap = {
    '종류':'type','제품명':'name','성분·효능':'ingredient',
    '보유량':'amount','구입시기':'purchaseTime','사용 월':'months',
    '적용 묘목·작물':'cropStr','주의사항':'caution','메모':'memo'
  };
  headers.forEach((h,i) => {
    const key = keyMap[h.trim()];
    if (key) colMap[key] = i;
  });

  let added = 0, skipped = 0;
  rows.forEach(row => {
    const name = row[colMap.name]?.trim();
    if (!name) { skipped++; return; }
    // 중복 제거
    if (mySupplies.some(s => s.name === name)) { skipped++; return; }
    const ptime = row[colMap.purchaseTime]?.trim() || '보유중';
    const validPtimes = ['보유중','2월구입','8월구입','필요시'];
    const entry = {
      id: Date.now().toString() + added,
      type:        row[colMap.type]?.trim() || '기타',
      name,
      ingredient:  row[colMap.ingredient]?.trim() || '',
      amount:      row[colMap.amount]?.trim() || '',
      purchaseTime: validPtimes.includes(ptime) ? ptime : '보유중',
      months:      row[colMap.months]?.trim() || '',
      crops:       row[colMap.cropStr]?.trim()
                     ? row[colMap.cropStr].split(/[·,·,]+/).map(c=>c.trim()).filter(Boolean)
                     : [],
      addedDate:   toYMD(REAL_TODAY),
    };
    mySupplies.push(entry);
    added++;
  });
  localStorage.setItem('mySupplies', JSON.stringify(mySupplies));
  return {added, skipped};
}

// ══════════════════════════════════════════════════════════
// 작업 기록장 + 월별일정 표
// ══════════════════════════════════════════════════════════

// ── 작업 기록 저장소 ──────────────────────────────────────
workLog = JSON.parse(localStorage.getItem('workLog') || '[]');

// 작업 완료 시 기록 저장 (toggleTask 에서 호출)
function recordWork(taskName, taskDetail, taskLoc, taskJudge) {
  const now   = new Date();
  const entry = {
    id:     Date.now(),
    date:   toYMD(now),
    time:   now.getHours() + ':' + String(now.getMinutes()).padStart(2,'0'),
    name:   taskName,
    detail: taskDetail || '',
    loc:    taskLoc || '',
    type:   taskJudge === 'fert' ? '시비'
          : taskJudge === 'pest' ? '병해충'
          : taskJudge === 'urgent' ? '긴급'
          : '일반',
  };
  workLog.unshift(entry);
  if (workLog.length > 500) workLog = workLog.slice(0, 500);
  localStorage.setItem('workLog', JSON.stringify(workLog));
  if (document.getElementById('sec-sheet')?.classList.contains('active')) {
    renderWorkLog();
  }
}

// 기록장 렌더
function renderWorkLog() {
  // 항상 localStorage에서 최신 데이터 로드
  const _saved = localStorage.getItem('workLog');
  if (_saved) {
    try { workLog = JSON.parse(_saved); } catch(e) { workLog = []; }
  }
  const listEl  = document.getElementById('workLogList');
  const totalEl = document.getElementById('logTotalCount');
  const monthEl = document.getElementById('logThisMonth');
  const streakEl= document.getElementById('logStreak');
  const selMonth= document.getElementById('logFilterMonth')?.value || 'all';
  const selType = document.getElementById('logFilterType')?.value  || 'all';
  if (!listEl) return;

  // 월 필터 옵션 생성
  const monthSel = document.getElementById('logFilterMonth');
  if (monthSel && monthSel.options.length <= 1) {
    const months = [...new Set(workLog.map(e => e.date.slice(0,7)))].sort().reverse();
    months.forEach(m => {
      const opt = document.createElement('option');
      opt.value = m;
      opt.textContent = m.replace('-','년 ') + '월';
      monthSel.appendChild(opt);
    });
  }

  // 필터 적용
  const curMonth = REAL_TODAY.toISOString().slice(0,7);
  let filtered = workLog.filter(e => {
    if (selMonth !== 'all' && !e.date.startsWith(selMonth)) return false;
    if (selType  !== 'all' && e.type !== selType)           return false;
    return true;
  });

  // 통계
  const thisMonthCount = workLog.filter(e => e.date.startsWith(curMonth)).length;
  if (totalEl)  totalEl.textContent  = workLog.length;
  if (monthEl)  monthEl.textContent  = thisMonthCount;

  // 연속 작업일 계산
  let streak = 0;
  const today = toYMD(REAL_TODAY);
  const allDates = [...new Set(workLog.map(e => e.date))].sort().reverse();
  let check = today;
  for (const d of allDates) {
    if (d === check) { streak++; const dt=new Date(check+'T00:00:00'); dt.setDate(dt.getDate()-1); check=toYMD(dt); }
    else if (d < check) break;
  }
  if (streakEl) streakEl.textContent = streak;

  if (!filtered.length) {
    listEl.innerHTML = `<div class="card">
      <div class="card-body" style="text-align:center;padding:30px;color:#9E9E9E">
        <div style="font-size:32px">📒</div>
        <div style="font-size:17px;margin-top:10px">작업 완료 시 자동으로 기록됩니다</div>
        <div style="font-size:16px;margin-top:6px">📋 오늘 작업 탭에서 ✅ 체크하면 기록!</div>
      </div>
    </div>`;
    return;
  }

  const typeColors = {
    '일반':   {bg:'#E8F5E9', tc:'#1B5E20', icon:'✅'},
    '시비':   {bg:'#F1F8E9', tc:'#33691E', icon:'🌱'},
    '병해충': {bg:'#FFF8E1', tc:'#E65100', icon:'🐛'},
    '긴급':   {bg:'#FFEBEE', tc:'#C62828', icon:'⚡'},
    '구입':   {bg:'#E3F2FD', tc:'#1565C0', icon:'🛒'},
  };

  // 날짜별 그룹핑
  const grouped = {};
  filtered.forEach(e => {
    if (!grouped[e.date]) grouped[e.date] = [];
    grouped[e.date].push(e);
  });

  let html = '';
  const dayNames = ['일','월','화','수','목','금','토'];

  Object.keys(grouped).sort().reverse().forEach(date => {
    const dt  = new Date(date + 'T00:00:00');
    const dn  = dayNames[dt.getDay()];
    const isT = date === today;
    const entries = grouped[date];

    html += `
      <div class="card" style="margin-bottom:10px">
        <div style="background:${isT?'#1B5E20':'#37474F'};padding:10px 14px;
          border-radius:10px 10px 0 0;display:flex;align-items:center;
          justify-content:space-between">
          <div style="font-size:17px;font-weight:700;color:white">
            ${isT?'📌 오늘 ':''}${date.replace(/-/g,'.')} (${dn})
          </div>
          <div style="font-size:16px;color:rgba(255,255,255,0.75)">${entries.length}건</div>
        </div>
        ${entries.map(e => {
          const tc = typeColors[e.type] || typeColors['일반'];
          return `<div style="padding:10px 14px;border-bottom:1px solid #F5F5F5;
            display:flex;align-items:flex-start;gap:10px">
            <span style="font-size:18px;flex-shrink:0">${tc.icon}</span>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:3px">
                <span style="font-size:17px;font-weight:600;color:#212121">${e.name}</span>
                <span style="font-size:10px;background:${tc.bg};color:${tc.tc};
                  padding:2px 8px;border-radius:10px;font-weight:700">${e.type}</span>
                <span style="font-size:10px;color:#BDBDBD">${e.time}</span>
              </div>
              ${e.detail ? `<div style="font-size:16px;color:#546E7A">${e.detail}</div>` : ''}
              ${e.loc    ? `<div style="font-size:10px;color:#9E9E9E;margin-top:2px">📍 ${e.loc}</div>` : ''}
              ${e.photo ? `<div style="margin-top:8px">
                <div style="position:relative;display:inline-block">
                  <img src="${e.photo}"
                    style="max-width:200px;max-height:150px;border-radius:10px;cursor:pointer;
                    border:2px solid #A5D6A7;display:block;object-fit:cover"
                    onclick="viewLogPhoto('${e.photo}')"
                    title="클릭하면 크게 보기">
                  <button onclick="deleteLogPhoto(${e.id})"
                    style="position:absolute;top:-6px;right:-6px;
                    width:20px;height:20px;border-radius:50%;
                    background:#EF5350;color:white;border:none;
                    font-size:11px;cursor:pointer;line-height:20px;text-align:center;
                    padding:0;font-weight:bold" title="사진 삭제">✕</button>
                </div>
                <div style="display:flex;gap:6px;margin-top:6px;flex-wrap:wrap">
                  <button onclick="downloadLogPhoto(${e.id})"
                    style="padding:5px 12px;background:#E3F2FD;border:1px solid #90CAF9;
                    color:#1565C0;border-radius:8px;font-size:13px;font-weight:700;
                    cursor:pointer;font-family:inherit">⬇️ 다운로드</button>
                  <label style="padding:5px 12px;background:#FFF3E0;border:1px solid #FFCC80;
                    color:#E65100;border-radius:8px;font-size:13px;font-weight:700;
                    cursor:pointer;font-family:inherit;display:inline-flex;align-items:center">
                    🔄 사진 교체
                    <input type="file" accept="image/*"
                      onchange="uploadLogPhoto(event,${e.id})" style="display:none">
                  </label>
                  <button onclick="deleteLogPhoto(${e.id})"
                    style="padding:5px 12px;background:#FFEBEE;border:1px solid #FFCDD2;
                    color:#C62828;border-radius:8px;font-size:13px;font-weight:700;
                    cursor:pointer;font-family:inherit">🗑 사진 삭제</button>
                </div>
              </div>` : ''}
            </div>
            <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
              <button onclick="deleteLogEntry(${e.id})"
                style="background:none;border:none;color:#BDBDBD;font-size:16px;cursor:pointer;padding:0">✕</button>
              <button onclick="editLogEntry(${e.id})"
                style="background:none;border:none;color:#1976D2;font-size:18px;
                cursor:pointer;padding:2px 5px" title="수정">✏️</button>
              <label title="카메라 촬영" style="cursor:pointer;width:32px;height:28px;background:#F5F5F5;
                border:1px dashed #BDBDBD;border-radius:6px;display:flex;
                align-items:center;justify-content:center;font-size:17px">
                📷<input type="file" accept="image/*" capture="environment"
                  onchange="uploadLogPhoto(event,${e.id})" style="display:none">
              </label>
              <label title="앨범에서 선택" style="cursor:pointer;width:32px;height:28px;background:#F5F5F5;
                border:1px dashed #BDBDBD;border-radius:6px;display:flex;
                align-items:center;justify-content:center;font-size:17px;margin-left:4px">
                🖼️<input type="file" accept="image/*"
                  onchange="uploadLogPhoto(event,${e.id})" style="display:none">
              </label>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  });

  listEl.innerHTML = html;
}

function editLogEntry(id) {
  const e = workLog.find(x => String(x.id) === String(id));
  if (!e) return;

  // 수정 모달
  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;' +
    'background:rgba(0,0,0,0.6);z-index:9999;display:flex;align-items:center;justify-content:center';

  const _esc = s => String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  overlay.innerHTML = `
    <div style="background:white;border-radius:14px;padding:20px;width:90%;max-width:400px;
      max-height:85vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3)">
      <div style="font-size:16px;font-weight:700;color:#1B5E20;margin-bottom:14px">✏️ 기록 수정</div>
      <div style="font-size:13px;color:#9E9E9E;margin-bottom:6px">날짜</div>
      <input id="_editDate" type="date" value="${e.date||''}"
        style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;
        font-size:15px;margin-bottom:10px;box-sizing:border-box;font-family:inherit">
      <div style="font-size:13px;color:#9E9E9E;margin-bottom:6px">작업명</div>
      <input id="_editName" type="text" value="${_esc(e.name)}"
        style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;
        font-size:15px;margin-bottom:10px;box-sizing:border-box;font-family:inherit">
      <div style="font-size:13px;color:#9E9E9E;margin-bottom:6px">상세 내용</div>
      <textarea id="_editDetail" rows="3"
        style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;
        font-size:15px;resize:vertical;box-sizing:border-box;font-family:inherit">${_esc(e.detail)}</textarea>
      <div style="font-size:13px;color:#9E9E9E;margin:10px 0 6px">위치·메모</div>
      <input id="_editLoc" type="text" value="${_esc(e.loc)}" placeholder="예: 3이랑, 온실"
        style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;
        font-size:15px;margin-bottom:10px;box-sizing:border-box;font-family:inherit">
      <div style="font-size:13px;color:#9E9E9E;margin:10px 0 6px">작업 구분</div>
      <select id="_editType"
        style="width:100%;padding:9px;border:1.5px solid #E0E0E0;border-radius:8px;
        font-size:15px;margin-bottom:16px;box-sizing:border-box;font-family:inherit;background:white">
        ${['일반','시비','병해충','긴급','구입'].map(t =>
          '<option value="'+t+'"'+(e.type===t?' selected':'')+'>'+t+'</option>'
        ).join('')}
      </select>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button onclick="this.closest('div[style*=fixed]').remove()"
          style="padding:12px;background:#F5F5F5;border:none;border-radius:8px;
          font-size:15px;cursor:pointer;font-weight:600;font-family:inherit">취소</button>
        <button onclick="_saveLogEdit(${e.id})"
          style="padding:12px;background:#1B5E20;color:white;border:none;
          border-radius:8px;font-size:15px;cursor:pointer;font-weight:700;font-family:inherit">저장</button>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  overlay.addEventListener('click', function(ev){ if(ev.target===overlay) overlay.remove(); });
}

function _saveLogEdit(id) {
  const idx = workLog.findIndex(x => String(x.id) === String(id));
  if (idx < 0) return;
  workLog[idx].date   = document.getElementById('_editDate').value || workLog[idx].date;
  workLog[idx].name   = document.getElementById('_editName').value.trim() || workLog[idx].name;
  workLog[idx].detail = document.getElementById('_editDetail').value;
  workLog[idx].loc    = document.getElementById('_editLoc').value;
  workLog[idx].type   = document.getElementById('_editType').value;
  localStorage.setItem('workLog', JSON.stringify(workLog));
  document.querySelector('div[style*="position:fixed"][style*="z-index:9999"]')?.remove();
  renderWorkLog();
  showToast('✅ 기록 수정 완료');
}

function deleteLogEntry(id) {
  workLog = workLog.filter(e => e.id !== id);
  localStorage.setItem('workLog', JSON.stringify(workLog));  renderWorkLog();
}

function clearWorkLog() {
  if (!confirm('기록장을 모두 삭제할까요?')) return;
  workLog = [];
  localStorage.removeItem('workLog');
  renderWorkLog();
  showToast('🗑️ 기록장 삭제 완료');
}

// ── 월별일정 표 렌더 ──────────────────────────────────────

// ── 월별일정 (최적화 버전) ────────────────────────────────
const _mtCache = {};

function renderMonthlyTable(fm) {
  const wrap = document.getElementById('monthlyTableWrap');
  if (!wrap) return;
  const curM = REAL_TODAY.getMonth() + 1;
  if (!fm || fm === 'undefined') fm = String(curM);

  // 탭 버튼 하이라이트
  document.querySelectorAll('[id^="mtab-"]').forEach(b => {
    const on = b.id === 'mtab-' + fm || (fm === 'all' && b.id === 'mtab-all');
    b.style.background  = on ? '#1B5E20' : 'white';
    b.style.color       = on ? 'white'   : '#546E7A';
    b.style.borderColor = on ? '#1B5E20' : '#E0E0E0';
    b.style.fontWeight  = on ? '700'     : '500';
  });

  if (typeof MONTHLY_SCHEDULE === 'undefined' || !MONTHLY_SCHEDULE) {
    wrap.innerHTML = '<div style="padding:20px;text-align:center;color:#9E9E9E">데이터 없음</div>';
    return;
  }

  // ① 캐시 HIT → 즉시 표시
  if (_mtCache[fm]) {
    wrap.innerHTML = _mtCache[fm];
    return;
  }

  // ② 캐시 MISS → 로딩 표시 후 비동기 빌드
  wrap.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;'
    + 'padding:24px;gap:10px;color:#9E9E9E">'
    + '<div style="width:20px;height:20px;border:2px solid #E0E0E0;border-top-color:#1B5E20;'
    + 'border-radius:50%;animation:spin 0.8s linear infinite"></div>'
    + '<span style="font-size:17px">불러오는 중...</span></div>';

  // 스핀 애니메이션 (한 번만 추가)
  if (!document.getElementById('spinStyle')) {
    const s = document.createElement('style');
    s.id = 'spinStyle';
    s.textContent = '@keyframes spin{to{transform:rotate(360deg)}}';
    document.head.appendChild(s);
  }

  // 비동기 렌더 — UI 블로킹 없음
  setTimeout(() => {
    const result = fm === 'all' ? _buildAllView(curM) : _buildMonthView(parseInt(fm), curM);
    _mtCache[fm] = result;        // 캐시 저장
    wrap.innerHTML = result;
    // 백그라운드로 이달±1 프리빌드
    _prebuild(curM);
  }, 10);
}

// 전체 요약 뷰 (카드 형식 — 빠름)
function _buildAllView(curM) {
  let out = '';
  for (let m = 1; m <= 12; m++) {
    const body = _buildSummaryFast(m);
    if (!body) continue;
    const isCur = m === curM;
    out += '<div style="border-left:3px solid ' + (isCur ? '#1B5E20' : '#E0E0E0') + ';'
      + 'padding:8px 12px;margin-bottom:6px;background:' + (isCur ? '#F1F8E9' : '#FAFAFA') + ';'
      + 'border-radius:0 8px 8px 0">'
      + '<div style="font-size:17px;font-weight:700;color:' + (isCur ? '#1B5E20' : '#37474F') + ';'
      + 'margin-bottom:5px;cursor:pointer" onclick="renderMonthlyTable(\'' + m + '\')">'
      + m + '월' + (isCur ? ' ← 이달 (클릭해서 상세보기)' : ' (클릭)') + '</div>'
      + body + '</div>';
  }
  return out || '<div style="padding:20px;text-align:center;color:#9E9E9E">데이터 없음</div>';
}

// 특정 월 상세 표 뷰
function _buildMonthView(m, curM) {
  const crops = Object.keys(MONTHLY_SCHEDULE);
  const treeSet = ['사과','배','감나무','대추','살구','모과','헤이즐','앵두',
    '오디','으름','다래','무화과','블루베리','블랙베리','마르멜로','바이오체리'];
  const isTree = n => treeSet.some(t => n.startsWith(t));

  // 이달에 데이터 있는 작물만
  const active = crops.filter(n => {
    const d = MONTHLY_SCHEDULE[n];
    return d.h.some(c => c.m === m) || d.f.some(c => c.m === m);
  });

  if (!active.length) return '<div style="padding:20px;text-align:center;color:#9E9E9E">'
    + m + '월에 해당하는 일정이 없습니다</div>';

  // 상단 요약
  let out = '<div style="padding:8px 12px 4px">' + (_buildSummaryFast(m) || '') + '</div>';

  // 표
  out += '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch">'
    + '<table style="border-collapse:collapse;font-size:16px;width:100%;min-width:300px">'
    + '<thead><tr style="background:#1B5E20">'
    + '<th style="padding:7px 8px;color:white;text-align:left;width:80px;border:0.5px solid #2E7D32">작물</th>'
    + '<th style="padding:7px 6px;color:white;text-align:center;border:0.5px solid #2E7D32;width:100px">식재·수확</th>'
    + '<th style="padding:7px 6px;color:white;text-align:center;border:0.5px solid #2E7D32;width:100px">시비</th>'
    + '</tr></thead><tbody>';

  let prevG = '';
  active.forEach((name, i) => {
    const d = MONTHLY_SCHEDULE[name];
    const g = isTree(name) ? '🌳 유실수' : '🥬 채소·밭작물';
    if (g !== prevG) {
      out += '<tr><td colspan="3" style="background:#37474F;color:white;'
        + 'padding:5px 8px;font-size:16px;font-weight:700">' + g + '</td></tr>';
      prevG = g;
    }

    const badge = (c) => '<span style="display:inline-block;background:#' + (c.color||'FFFFFF')
      + ';color:#' + (c.tc||'333') + ';padding:2px 8px;border-radius:4px;font-size:16px;'
      + 'font-weight:600;margin:1px;white-space:nowrap">' + (c.icon||'') + (c.t||'') + '</span>';

    const hCell = d.h.filter(c=>c.m===m).map(badge).join('');
    const fCell = d.f.filter(c=>c.m===m && c.cls!=='em' && c.cls!=='skip').map(badge).join('');

    out += '<tr style="background:' + (i%2===0?'white':'#FAFAFA') + '">'
      + '<td style="padding:6px 8px;font-size:16px;font-weight:600;border:0.5px solid #E0E0E0;'
      + 'vertical-align:middle">' + name + '</td>'
      + '<td style="padding:4px 6px;border:0.5px solid #E0E0E0;vertical-align:middle">' + (hCell||'<span style="color:#DDD">—</span>') + '</td>'
      + '<td style="padding:4px 6px;border:0.5px solid #E0E0E0;vertical-align:middle">' + (fCell||'<span style="color:#DDD">—</span>') + '</td>'
      + '</tr>';
  });

  out += '</tbody></table></div>';
  return out;
}

// 월 요약 텍스트 생성 (빠름)
function _buildSummaryFast(m) {
  if (typeof MONTHLY_SCHEDULE === 'undefined' || !MONTHLY_SCHEDULE) return '';
  const plant = [], harvest = [], fert = [];
  Object.entries(MONTHLY_SCHEDULE).forEach(([name, d]) => {
    d.h.filter(c=>c.m===m).forEach(c => {
      if (['plant','seed','trans'].includes(c.cls)) plant.push(name);
      else if (c.cls==='harvest') harvest.push(name);
    });
    d.f.filter(c=>c.m===m && !['em','skip'].includes(c.cls)).forEach(() => {
      if (!fert.includes(name)) fert.push(name);
    });
  });
  if (!plant.length && !harvest.length && !fert.length) return '';
  const row = (icon, label, arr, bg, tc) => !arr.length ? '' :
    '<div style="display:flex;align-items:center;gap:5px;flex-wrap:wrap;margin-bottom:4px">'
    + '<span style="font-size:16px;font-weight:700;color:#'+tc+';background:#'+bg+';'
    + 'padding:2px 8px;border-radius:10px;white-space:nowrap">' + icon + ' ' + label + ' ' + arr.length + '종</span>'
    + arr.slice(0,5).map(n=>'<span style="font-size:16px;color:#546E7A">'+n+'</span>').join('<span style="color:#DDD">·</span>')
    + (arr.length>5?'<span style="font-size:10px;color:#9E9E9E">외 '+(arr.length-5)+'종</span>':'')
    + '</div>';
  return row('🌱','식재·파종',plant,'E1F5EE','085041')
       + row('🍎','수확',harvest,'FAEEDA','633806')
       + row('💧','시비',fert,'E6F1FB','0C447C');
}

// 이달±1 프리빌드 (백그라운드)
function _prebuild(curM) {
  [curM-1, curM+1].forEach(m => {
    const key = String(((m-1+12)%12)+1);
    if (!_mtCache[key]) {
      setTimeout(() => {
        if (!_mtCache[key]) _mtCache[key] = _buildMonthView(parseInt(key), curM);
      }, 300);
    }
  });
}

function buildMonthlySummary(m) { return _buildSummaryFast(m); }
function renderMonthly() { renderMonthlyTable(String(REAL_TODAY.getMonth()+1)); }

function exportSupplyJSON() {
  const data = {
    version: '1.0',
    exportDate: toYMD(REAL_TODAY),
    supplies: mySupplies,
    workLog:  workLog,
  };
  const blob = new Blob([JSON.stringify(data, null, 2)],
    {type: 'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = '과수원_농자재_' + toYMD(REAL_TODAY) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  const st = document.getElementById('shareStatus');
  if (st) st.textContent = '✅ ' + mySupplies.length + '개 농자재 + '
    + workLog.length + '개 기록 저장됨';
  showToast('📤 JSON 내보내기 완료');
}

function importSupplyJSON(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(e) {
    try {
      const data = JSON.parse(e.target.result);
      let addedS = 0, addedL = 0;
      // 농자재 병합
      if (Array.isArray(data.supplies)) {
        data.supplies.forEach(s => {
          if (!mySupplies.some(x => x.name === s.name && x.type === s.type)) {
            mySupplies.push(s); addedS++;
          }
        });
        localStorage.setItem('mySupplies', JSON.stringify(mySupplies));
      }
      // 기록장 병합
      if (Array.isArray(data.workLog)) {
        const existIds = new Set(workLog.map(e => e.id));
        data.workLog.forEach(e => {
          if (!existIds.has(e.id)) { workLog.unshift(e); addedL++; }
        });
        localStorage.setItem('workLog', JSON.stringify(workLog));
      }
      renderSupplyList();
      renderPurchasePlan();
      const st = document.getElementById('shareStatus');
      if (st) st.textContent = `✅ 농자재 ${addedS}개, 기록 ${addedL}개 추가됨`;
      showToast(`✅ 가져오기 완료 (농자재 ${addedS}개, 기록 ${addedL}개)`);
    } catch(err) {
      showToast('❌ 파일 오류: ' + err.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file);
}

// ── 기록장 저장 (localStorage 직접 사용, 서버 불필요) ─────
// workLog는 이미 localStorage에 자동 저장됨
// exportWorkLogCSV: CSV로 내보내기
function exportWorkLogCSV() {
  if (!workLog.length) { showToast('⚠ 기록이 없습니다'); return; }
  const rows = [['날짜','시간','작업명','유형','상세','위치']];
  workLog.forEach(e => rows.push([e.date, e.time||'', e.name, e.type, e.detail||'', e.loc||'']));
  const csv = rows.map(r => r.map(v => '"'+String(v).replace(/"/g,'""')+'"').join(',')).join('\n');
  const bom  = '\uFEFF'; // Excel 한글 인식
  const blob = new Blob([bom+csv], {type:'text/csv;charset=utf-8'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = '작업기록_' + toYMD(REAL_TODAY) + '.csv';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  showToast('📊 CSV 저장됨 (' + workLog.length + '건)');
}

// ── 구글드라이브 CSV 연동 ─────────────────────────────────
let driveCsvFileId = localStorage.getItem('driveCsvFileId') || '';

function saveDriveFileId(id) {
  driveCsvFileId = id.trim();
  localStorage.setItem('driveCsvFileId', driveCsvFileId);
}

async function loadDriveCSV() {
  const btn  = document.getElementById('driveLoadBtn');
  const body = document.getElementById('driveBody');
  const inp  = document.getElementById('driveFileId');
  if (!body) return;

  const fileId = (inp ? inp.value.trim() : '') || driveCsvFileId;
  if (!fileId) {
    body.innerHTML = '<div style="background:#FFF3E0;border-radius:8px;padding:12px;'
      + 'font-size:16px;color:#E65100">⚠ 파일 ID를 입력하세요</div>';
    return;
  }
  saveDriveFileId(fileId);

  if (btn) btn.textContent = '⏳ 불러오는 중...';
  body.innerHTML = '<div style="text-align:center;padding:16px;color:#9E9E9E">'
    + '<div style="font-size:20px">☁️</div>'
    + '<div style="font-size:16px;margin-top:6px">구글드라이브 연결 중...</div></div>';

  try {
    // 방법1: uc download (CORS 허용)
    const url1 = `https://drive.google.com/uc?export=download&id=${fileId}`;
    let csv = null;

    try {
      const r = await fetch(url1, {cache: 'no-cache'});
      if (r.ok) {
        const t = await r.text();
        if (t && !t.includes('<!DOCTYPE') && !t.includes('<html') && t.length > 5) {
          csv = t;
        }
      }
    } catch(e) {}

    // 방법2: gviz (파일이 스프레드시트인 경우)
    if (!csv) {
      const cbName = 'driveCb_' + Date.now();
      csv = await new Promise((resolve) => {
        const timer = setTimeout(() => { delete window[cbName]; resolve(null); }, 6000);
        window[cbName] = (data) => {
          clearTimeout(timer);
          delete window[cbName];
          const oldS = document.getElementById('driveScript');
          if (oldS) oldS.remove();
          if (!data || !data.table) { resolve(null); return; }
          const rows = (data.table.rows || []).map(r =>
            (r.c||[]).map(cell => (cell&&cell.v!=null)?String(cell.v).trim():'')
          );
          const headers = (data.table.cols||[]).map(c=>c.label||c.id||'');
          resolve({headers, rows: rows.filter(r=>r.some(c=>c))});
        };
        const s = document.createElement('script');
        s.id = 'driveScript';
        s.src = `https://docs.google.com/spreadsheets/d/${fileId}/gviz/tq?tqx=out:json;responseHandler:${cbName}`;
        s.onerror = () => { clearTimeout(timer); delete window[cbName]; resolve(null); };
        document.head.appendChild(s);
      });
    }

    if (!csv) throw new Error('파일을 읽을 수 없습니다.\n파일이 공개 설정인지 확인하세요.');

    // CSV 파싱
    let headers, rows;
    if (typeof csv === 'object') {
      // gviz 결과
      headers = csv.headers;
      rows    = csv.rows;
    } else {
      // 텍스트 CSV 파싱
      const parseRow = (line) => {
        const res = []; let cur = '', inQ = false;
        for (let i = 0; i < line.length; i++) {
          if (line[i]==='"') { if(inQ&&line[i+1]==='"'){cur+='"';i++;}else inQ=!inQ; }
          else if (line[i]===','&&!inQ) { res.push(cur.trim()); cur=''; }
          else cur += line[i];
        }
        res.push(cur.trim());
        return res;
      };
      const lines = csv.split('\n').filter(l=>l.trim());
      headers = parseRow(lines[0]);
      rows    = lines.slice(1).map(parseRow).filter(r=>r.some(c=>c));
    }

    if (!rows.length) throw new Error('데이터가 없습니다. CSV 파일에 내용을 추가하세요.');

    // 성공 UI
    body.innerHTML = '<div style="background:#E8F5E9;border-radius:8px;padding:9px 12px;'
      + 'margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">'
      + '<div><div style="font-size:17px;font-weight:700;color:#1B5E20">✅ 연동 성공</div>'
      + '<div style="font-size:16px;color:#2E7D32;margin-top:2px">' + rows.length + '행 · ' + headers.length + '열</div></div>'
      + '<button onclick="loadDriveCSV()" style="background:#1565C0;color:white;border:none;'
      + 'border-radius:6px;padding:5px 12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit">🔄 갱신</button>'
      + '</div>'
      + '<div style="overflow-x:auto;-webkit-overflow-scrolling:touch">'
      + '<table style="border-collapse:collapse;font-size:16px;min-width:100%">'
      + '<tr style="background:#1B5E20">'
      + headers.map(h=>'<th style="padding:7px 9px;color:white;text-align:left;white-space:nowrap;border:1px solid #2E7D32">'+(h||'-')+'</th>').join('')
      + '</tr>'
      + rows.slice(0,30).map((r,i)=>'<tr style="background:'+(i%2===0?'white':'#F9F9F9')+'">'
        + headers.map((_,ci)=>'<td style="padding:6px 9px;border:1px solid #E0E0E0;white-space:nowrap">'+(r[ci]||'-')+'</td>').join('')
        + '</tr>').join('')
      + '</table></div>'
      + (rows.length>30?'<div style="font-size:16px;color:#9E9E9E;text-align:center;margin-top:6px">총 '+rows.length+'행 중 30행 표시</div>':'');

    // 가져오기 버튼
    const importBtn = document.createElement('button');
    importBtn.textContent = '📥 앱으로 가져오기 (' + rows.length + '행)';
    importBtn.style.cssText = 'width:100%;margin-top:10px;padding:13px;background:#1B5E20;'
      + 'color:white;border:none;border-radius:8px;font-size:17px;font-weight:700;'
      + 'cursor:pointer;font-family:inherit';
    importBtn.onclick = () => {
      const result = importFromSheet(rows, headers);
      renderSupplyList(); renderPurchasePlan();
      showToast('✅ ' + result.added + '개 추가, ' + result.skipped + '개 건너뜀');
      importBtn.textContent = '✅ 완료! ' + result.added + '개 추가됨';
      importBtn.style.background = '#388E3C';
      importBtn.disabled = true;
    };
    body.appendChild(importBtn);

  } catch(err) {
    body.innerHTML = '<div style="background:#FFEBEE;border-radius:10px;padding:14px">'
      + '<div style="font-size:17px;font-weight:700;color:#C62828;margin-bottom:8px">⚠ 연결 실패</div>'
      + '<div style="font-size:16px;color:#E53935;line-height:1.9;white-space:pre-line;margin-bottom:10px">'
      + err.message + '</div>'
      + '<div style="font-size:16px;color:#546E7A;background:#F5F5F5;border-radius:6px;padding:10px;line-height:1.9">'
      + '<b>파일 공개 설정 방법:</b><br>'
      + '구글드라이브 → 파일 우클릭 → 공유<br>'
      + '→ "링크 있는 모든 사용자" → <b>뷰어</b> 설정<br>'
      + '→ 링크 복사 → 앱에 파일 ID 입력'
      + '</div>'
      + '<button onclick="loadDriveCSV()" style="margin-top:10px;width:100%;padding:10px;'
      + 'background:#1B5E20;color:white;border:none;border-radius:8px;font-size:17px;'
      + 'font-weight:700;cursor:pointer;font-family:inherit">🔄 다시 시도</button></div>';
  }
  if (btn) btn.textContent = '🔄 불러오기';
}

// ─ 이랑 현황: 작물 이동 저장 ─────────────────────────────
function saveIrangChange(plantId, fromIrang, toIrang, note) {
  const entry = {
    id:       Date.now().toString(),
    plantId,
    fromIrang,
    toIrang,
    note:     note || '',
    date:     toYMD(REAL_TODAY),
  };
  // localStorage 저장
  let irangLog = JSON.parse(localStorage.getItem('irangLog') || '[]');
  irangLog.unshift(entry);
  localStorage.setItem('irangLog', JSON.stringify(irangLog));
  showToast('📍 이랑 이동 기록됨');
}

// ─ 생육일수: 착과·파종 기록 ──────────────────────────────
growRecords = JSON.parse(localStorage.getItem('growRecords') || '[]');

function saveGrowRecord(plantName, eventType, date, note) {
  const entry = {
    id:         Date.now().toString(),
    plantName,
    eventType,  // '파종' | '정식' | '발아' | '개화' | '착과' | '수확'
    date:       date || toYMD(REAL_TODAY),
    note:       note || '',
    daysFrom:   0,
  };
  // 파종/정식 기준으로 경과일 계산
  const base = growRecords.find(r =>
    r.plantName === plantName && ['파종','정식'].includes(r.eventType)
  );
  if (base) {
    const d1 = new Date(base.date + 'T00:00:00');
    const d2 = new Date(entry.date + 'T00:00:00');
    entry.daysFrom = Math.round((d2 - d1) / 86400000);
  }
  growRecords.unshift(entry);
  localStorage.setItem('growRecords', JSON.stringify(growRecords));
  showToast('🌱 ' + plantName + ' ' + eventType + ' 기록됨');
  // growRecords 저장 즉시 plants 동기화 (생육일수 추적 탭도 업데이트)
  migrateGrowRecords();
  savePlantsLocal();
  // 통합 모달 닫기
  var um = document.getElementById('unifiedAddModal'); if (um) um.remove();
  var gm = document.getElementById('growEventModal');  if (gm) gm.remove();
  // grow-panel-days가 보이는 상태면 renderGrow도 호출
  var pd = document.getElementById('grow-panel-days');
  if (pd && pd.style.display !== 'none') renderGrow();
  renderGrowRecords();
}

function deleteGrowRecord(id) {
  growRecords = growRecords.filter(r => r.id !== id);
  localStorage.setItem('growRecords', JSON.stringify(growRecords));
  renderGrowRecords();
}

// 생육기록 렌더
function renderGrowRecords() {
  const el = document.getElementById('growRecordList');
  if (!el) return;
  if (!growRecords.length) {
    el.innerHTML = '<div style="text-align:center;padding:16px;color:#9E9E9E;font-size:17px">'
      + '아직 기록이 없습니다<br>+ 버튼으로 기록을 추가하세요</div>';
    return;
  }
  // 작물별 그룹
  const grouped = {};
  growRecords.forEach(r => {
    if (!grouped[r.plantName]) grouped[r.plantName] = [];
    grouped[r.plantName].push(r);
  });
  const typeIcon = {'파종':'🌾','정식':'🌿','발아':'🌱','개화':'🌸','착과':'🍎','수확':'🎉'};
  const typeColor= {'파종':'#E8F5E9','정식':'#E8F5E9','발아':'#F1F8E9',
                    '개화':'#FCE4EC','착과':'#E3F2FD','수확':'#FFF3E0'};
  let html = '';
  Object.entries(grouped).forEach(([name, recs]) => {
    const sorted = [...recs].sort((a,b) => a.date.localeCompare(b.date));
    const first  = sorted[0];
    const lastD  = new Date(first.date + 'T00:00:00');
    const diffD  = Math.round((REAL_TODAY - lastD) / 86400000);
    html += `<div style="border:1.5px solid #E0E0E0;border-radius:10px;margin-bottom:8px;overflow:hidden">
      <div style="background:#1B5E20;padding:8px 12px;display:flex;align-items:center;justify-content:space-between;gap:8px">
        <span style="font-size:14px;font-weight:700;color:white;flex:1;min-width:0">${name}</span>
        <span style="font-size:10px;color:rgba(255,255,255,0.75);white-space:nowrap">${first.date} · ${diffD}일 경과</span>
      </div>
      <div style="padding:4px 0">
        ${recs.map(r => `
          <div style="display:flex;align-items:center;gap:6px;padding:7px 10px;border-bottom:1px solid #F5F5F5;flex-wrap:nowrap">
            <span style="background:${typeColor[r.eventType]||'#F5F5F5'};padding:2px 7px;border-radius:8px;font-size:11px;font-weight:600;white-space:nowrap;flex-shrink:0">${typeIcon[r.eventType]||'•'} ${r.eventType}</span>
            <span style="font-size:12px;color:#37474F;white-space:nowrap;flex-shrink:0">${r.date}</span>
            ${r.daysFrom ? `<span style="font-size:10px;color:#9E9E9E;flex-shrink:0">+${r.daysFrom}일</span>` : ''}
            <span style="font-size:12px;color:#546E7A;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${r.note||''}</span>
            <button onclick="openGrowRecordEditModal('${r.id}')" style="flex-shrink:0;background:#E3F2FD;border:1px solid #90CAF9;color:#1565C0;border-radius:6px;padding:3px 8px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">✏️</button>
            <button onclick="deleteGrowRecord('${r.id}')" style="flex-shrink:0;background:none;border:none;color:#BDBDBD;font-size:15px;cursor:pointer;padding:0 2px">✕</button>
          </div>`).join('')}
      </div>
    </div>`;
  });
  el.innerHTML = html;
}

// ── 생육 기록 수정 모달 ──────────────────────────────────
function openGrowRecordEditModal(id) {
  var r = growRecords.find(function(x){ return String(x.id) === String(id); });
  if (!r) { showToast('기록을 찾을 수 없습니다'); return; }
  var ex = document.getElementById('growRecEditModal');
  if (ex) ex.remove();
  var types = ['파종','정식','발아','개화','착과','수확','순치기','북주기','배토','기타'];
  var opts = types.map(function(t){ return '<option value="'+t+'"'+(r.eventType===t?' selected':'')+'>'+t+'</option>'; }).join('');
  var modal = document.createElement('div');
  modal.id = 'growRecEditModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:flex-end;justify-content:center;';
  modal.innerHTML = '<div style="background:white;border-radius:16px 16px 0 0;padding:20px;width:100%;max-width:500px;max-height:80vh;overflow-y:auto">'
    + '<div style="font-size:15px;font-weight:700;color:#1B5E20;margin-bottom:14px">✏️ 생육 기록 수정</div>'
    + '<div style="margin-bottom:10px"><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">작물명 *</div>'
    + '<input type="text" id="greqPlant" value="'+r.plantName.replace(/"/g,'&quot;')+'" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
    + '<div><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">이벤트 유형 *</div>'
    + '<select id="greqType" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;background:white">'+opts+'</select></div>'
    + '<div><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">날짜 *</div>'
    + '<input type="date" id="greqDate" value="'+(r.date||'')+'" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div></div>'
    + '<div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">메모</div>'
    + '<input type="text" id="greqNote" value="'+(r.note||'').replace(/"/g,'&quot;')+'" placeholder="예: 12절 착과" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    + '<button onclick="closeGrowRecEdit()" style="padding:12px;background:#F5F5F5;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;color:#546E7A">취소</button>'
    + '<button onclick="saveGrowRecordEdit(\'' + id + '\')" style="padding:12px;background:#1B5E20;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">✅ 저장</button>'
    + '</div></div>';
  document.body.appendChild(modal);
  setTimeout(function(){ var el=document.getElementById('greqPlant'); if(el) el.focus(); }, 100);
}

function closeGrowRecEdit() {
  var m = document.getElementById('growRecEditModal');
  if (m) m.remove();
}

function saveGrowRecordEdit(id) {
  var r = growRecords.find(function(x){ return String(x.id) === String(id); });
  if (!r) return;
  var plantName = (document.getElementById('greqPlant')||{}).value||'';
  var eventType = (document.getElementById('greqType')||{}).value||'';
  var date      = (document.getElementById('greqDate')||{}).value||'';
  var note      = (document.getElementById('greqNote')||{}).value||'';
  plantName = plantName.trim();
  if (!plantName) { showToast('작물명을 입력하세요'); return; }
  if (!date)      { showToast('날짜를 선택하세요'); return; }
  r.plantName = plantName;
  r.eventType = eventType;
  r.date      = date;
  r.note      = note.trim();
  localStorage.setItem('growRecords', JSON.stringify(growRecords));
  var m = document.getElementById('growRecEditModal');
  if (m) m.remove();
  renderGrowRecords();
  showToast('✅ 생육 기록 수정 완료');
}

// 생육기록 입력 폼 토글
function toggleGrowForm() {
  const form = document.getElementById('growRecordForm');
  if (form) form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

function submitGrowRecord() {
  const name  = document.getElementById('grPlant')?.value.trim();
  const type  = document.getElementById('grType')?.value;
  const date  = document.getElementById('grDate')?.value;
  const note  = document.getElementById('grNote')?.value.trim();
  if (!name || !type) { showToast('⚠ 작물명과 이벤트 유형을 입력하세요'); return; }
  saveGrowRecord(name, type, date, note);
  document.getElementById('growRecordForm').style.display = 'none';
  if (document.getElementById('grNote')) document.getElementById('grNote').value = '';
}

// ══════════════════════════════════════════════════════════
// 추가 함수: exportSupplyJSON / 사진업로드 / PDF출력 / 추천DB(작물포함)
// ══════════════════════════════════════════════════════════

function exportSupplyJSON() {
  const data = {version:'1.0', exportDate:toYMD(REAL_TODAY), supplies:mySupplies, workLog:workLog};
  const blob = new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href=url; a.download='과수원_농자재_'+toYMD(REAL_TODAY)+'.json';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  const st=document.getElementById('shareStatus');
  if(st) st.textContent='✅ '+mySupplies.length+'개 농자재 저장됨';
  showToast('📤 JSON 내보내기 완료');
}

// ── 사진 업로드 / 교체 ───────────────────────────────────
function uploadLogPhoto(event, logId) {
  const file = event.target.files[0];
  if (!file) return;
  if (file.size > 10*1024*1024) { showToast('⚠ 10MB 이하 사진만 가능합니다'); return; }
  compressPhoto(file, function(dataUrl) {
    if (!dataUrl) { showToast('⚠ 사진 처리 실패'); return; }
    const idx = workLog.findIndex(x => String(x.id)===String(logId));
    if (idx >= 0) {
      const wasReplace = !!workLog[idx].photo;
      workLog[idx].photo = dataUrl;
      localStorage.setItem('workLog', JSON.stringify(workLog));
      renderWorkLog();
      showToast(wasReplace ? '🔄 사진 교체 완료' : '📷 사진 저장 완료');
    }
  });
  event.target.value = '';
}

function deleteLogPhoto(logId) {
  if (!confirm('이 사진을 삭제할까요?')) return;
  const idx = workLog.findIndex(x => String(x.id) === String(logId));
  if (idx >= 0) {
    delete workLog[idx].photo;
    localStorage.setItem('workLog', JSON.stringify(workLog));
    renderWorkLog();
    showToast('🗑 사진 삭제 완료');
  }
}

// ── 사진 다운로드 ─────────────────────────────────────────
function downloadLogPhoto(logId) {
  const e = workLog.find(x => String(x.id) === String(logId));
  if (!e || !e.photo) { showToast('⚠ 사진이 없습니다'); return; }
  // data URL 에서 확장자 추출
  let ext = 'jpg';
  const m = /^data:image\/(\w+);/.exec(e.photo);
  if (m && m[1]) ext = m[1] === 'jpeg' ? 'jpg' : m[1];
  const safeName = String(e.name||'기록').replace(/[\\/:*?"<>|]/g,'_');
  const a = document.createElement('a');
  a.href = e.photo;
  a.download = (e.date||'') + '_' + safeName + '.' + ext;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  showToast('⬇️ 사진 다운로드');
}

function viewLogPhoto(src) {
  const ov = document.createElement('div');
  ov.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.92);'
    +'z-index:9999;display:flex;flex-direction:column;align-items:center;justify-content:center';
  ov.onclick = (ev) => { if (ev.target === ov) document.body.removeChild(ov); };
  const img = document.createElement('img');
  img.src = src;
  img.style.cssText = 'max-width:95vw;max-height:80vh;border-radius:10px';
  const btn = document.createElement('button');
  btn.textContent = '⬇️ 사진 다운로드';
  btn.style.cssText = 'margin-top:16px;padding:10px 22px;background:#1565C0;color:white;'
    +'border:none;border-radius:10px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit';
  btn.onclick = (ev) => {
    ev.stopPropagation();
    let ext = 'jpg';
    const m = /^data:image\/(\w+);/.exec(src);
    if (m && m[1]) ext = m[1] === 'jpeg' ? 'jpg' : m[1];
    const a = document.createElement('a');
    a.href = src;
    a.download = '기록사진.' + ext;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    showToast('⬇️ 사진 다운로드');
  };
  const hint = document.createElement('div');
  hint.textContent='바깥을 탭하여 닫기';
  hint.style.cssText='margin-top:14px;color:rgba(255,255,255,0.6);font-size:15px';
  ov.appendChild(img); ov.appendChild(btn); ov.appendChild(hint);
  document.body.appendChild(ov);
}

// ── PDF 출력 ──────────────────────────────────────────────
function printWorkLogPDF() {
  if (!workLog.length) { showToast('⚠ 기록이 없습니다'); return; }
  const typeIcon={일반:'✅',시비:'🌱',병해충:'🐛',긴급:'⚡',구입:'🛒'};
  const selMonth=document.getElementById('logFilterMonth')?.value||'all';
  const selType =document.getElementById('logFilterType')?.value ||'all';
  const filtered=workLog.filter(e=>{
    if(selMonth!=='all'&&!e.date.startsWith(selMonth)) return false;
    if(selType !=='all'&&e.type!==selType) return false;
    return true;
  });
  if(!filtered.length){showToast('⚠ 기록이 없습니다');return;}

  const grouped={};
  filtered.forEach(e=>{if(!grouped[e.date])grouped[e.date]=[];grouped[e.date].push(e);});
  const dn=['일','월','화','수','목','금','토'];

  const body=Object.keys(grouped).sort().reverse().map(date=>{
    const dt=new Date(date+'T00:00:00');
    const entries=grouped[date];
    return `<div class="dg">
<div class="dh">${date.replace(/-/g,'.')} (${dn[dt.getDay()]}) — ${entries.length}건</div>
${entries.map(e=>`<div class="en">
<span class="ic">${typeIcon[e.type]||'✅'}</span>
<div class="bd">
<div class="nm">${e.name}<span class="bg">${e.type}</span><span class="tm"> ${e.time||''}</span></div>
${e.detail?`<div class="dt">${e.detail}</div>`:''}
${e.loc?`<div class="lc">📍 ${e.loc}</div>`:''}
${e.photo?`<div class="ph"><img src="${e.photo}"></div>`:''}
</div></div>`).join('')}
</div>`;
  }).join('');

  const content=`<!DOCTYPE html><html><head><meta charset="utf-8">
<title>작업기록장</title>
<style>*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'맑은 고딕',sans-serif;font-size:16px;color:#212121;padding:20px}
h1{font-size:18px;font-weight:700;color:#1B5E20;margin-bottom:4px}
.sub{font-size:16px;color:#9E9E9E;margin-bottom:16px}
.dg{margin-bottom:14px;break-inside:avoid}
.dh{background:#1B5E20;color:white;padding:6px 12px;font-size:17px;font-weight:700;border-radius:6px 6px 0 0}
.en{border:1px solid #E0E0E0;border-top:none;padding:8px 12px;display:flex;gap:10px;background:white}
.en:last-child{border-radius:0 0 6px 6px}
.ic{font-size:16px;flex-shrink:0}.bd{flex:1}
.nm{font-size:16px;font-weight:700}.bg{display:inline-block;background:#E8F5E9;color:#1B5E20;padding:1px 7px;border-radius:8px;font-size:10px;margin-left:4px}
.dt{font-size:16px;color:#546E7A;margin-top:2px}.lc{font-size:10px;color:#9E9E9E;margin-top:1px}
.tm{font-size:10px;color:#BDBDBD}.ph{margin-top:6px}.ph img{max-width:160px;max-height:120px;border-radius:6px;border:1px solid #E0E0E0}
@media print{body{padding:10px}}</style></head><body>
<h1>🌾 화성시 과수원·텃밭 작업기록장</h1>
<div class="sub">출력일: ${new Date().toLocaleDateString('ko-KR')} · 총 ${filtered.length}건</div>
${body}
<`+`script>window.onload=()=>window.print();<\/script>

<!-- ══ 기록장 팝업 ══ -->
<div id="workLogPopup" style="display:none;position:fixed;top:0;left:0;
  width:100%;height:100%;z-index:9999;background:white;
  overflow-y:auto;-webkit-overflow-scrolling:touch">

  <!-- 헤더 -->
  <div style="position:sticky;top:0;z-index:10;background:#1B5E20;
    padding:12px 16px;display:flex;align-items:center;gap:10px">
    <button onclick="closeWorkLogPopup()"
      style="background:rgba(255,255,255,0.2);border:none;color:white;
      border-radius:8px;padding:8px 14px;font-size:16px;font-weight:700;
      cursor:pointer;font-family:inherit;flex-shrink:0">← 닫기</button>
    <span style="font-size:17px;font-weight:700;color:white">📒 작업 기록장</span>
    <button onclick="openWorkLogPopup()"
      style="background:rgba(255,255,255,0.2);border:none;color:white;
      border-radius:8px;padding:8px 12px;font-size:14px;font-weight:700;
      cursor:pointer;font-family:inherit;flex-shrink:0;margin-left:auto">🔄</button>
  </div>

  <!-- 상태 -->
  <div id="popupStatus" style="background:#FFF9C4;padding:8px 16px;
    font-size:14px;color:#546E7A;display:none"></div>

  <!-- 내용 -->
  <div id="popupWorkLogList" style="padding:12px 12px 80px"></div>
</div>
</body></html>`;

  const w=window.open('','_blank','width=800,height=700');
  if(w){w.document.write(content);w.document.close();}
  else showToast('⚠ 팝업 차단됨 — 허용 후 다시 시도하세요');
}

// ── 구입 추천 DB ──────────────────────────────────────────
const RECOMMEND_DB = [
// 비료
{type:'비료',name:'과수용 완효성 복합비료',brand:'조비·성보화학',npk:'N14-P12-K14+Mg',
 effect:'봄 기비 1회로 생육기 전체 지속',season:'2~3월 기비',
 amount:'주당 200~300g',price:'12,000원/5kg',where:'농협·농자재마트',
 tip:'수확 후 시비 금지',crops:['사과','살구','배','감나무','대추','모과','마르멜로','앵두']},
{type:'비료',name:'황산칼륨',brand:'조비·동부팜',npk:'K2O 50%',
 effect:'착색·당도 향상, 염화칼륨 대비 과실품질 우수',season:'과실 성숙기 8~9월',
 amount:'주당 50~100g',price:'8,000원/5kg',where:'농협',
 tip:'수확 2~3주 전 최종',crops:['사과','살구','블랙베리','복분자','블루베리','수박','참외']},
{type:'비료',name:'황산암모늄(유안)',brand:'남해화학',npk:'N21 황산형',
 effect:'블루베리 pH 4.5~5.5 유지 필수',season:'4~6월 분시',
 amount:'주당 30~60g',price:'5,000원/5kg',where:'농협',
 tip:'일반 작물 사용 금지',crops:['블루베리']},
{type:'비료',name:'붕소 엽면시비제',brand:'경농·서울농약',npk:'B 11~20%',
 effect:'착과율 향상, 기형과·낙과 방지',season:'개화 3~5일 전',
 amount:'0.3% 수용액 엽면',price:'6,000원/200g',where:'농자재마트',
 tip:'개화 중 절대 금지',crops:['사과','살구','배','다래','으름']},
{type:'비료',name:'고추·오이 전용비료',brand:'조비·팜한농',npk:'N10-P8-K10+Ca+Mg',
 effect:'Ca·Mg 포함 열과·배꼽썩음 예방',season:'착과 후 2~3회',
 amount:'포기당 20~30g',price:'9,000원/5kg',where:'농협',
 tip:'고온 건조시 금지',crops:['수박','참외','오이','호박']},
// 농약
{type:'농약',name:'리도밀골드수화제',brand:'신젠타',npk:'메탈락실+만코제브',
 effect:'역병·노균병 예방·치료, 장마 전 필수',season:'6~8월',
 amount:'1,000배',price:'15,000원/100g',where:'농자재마트',
 tip:'수확 7일 전 중지',crops:['수박','참외','오이','호박','감자']},
{type:'농약',name:'로브랄수화제',brand:'바이엘',npk:'이프로디온',
 effect:'탄저병·회색곰팡이 방제',season:'6~8월',
 amount:'1,000배',price:'15,000원/100g',where:'농자재마트',
 tip:'동일 계통 연용 금지',crops:['블랙베리','복분자','블루베리','사과','살구']},
{type:'농약',name:'코니도수화제',brand:'바이엘',npk:'이미다클로프리드',
 effect:'진딧물·총채벌레 전문, 침투이행성',season:'4~6·9월',
 amount:'2,000배',price:'12,000원/100g',where:'농협',
 tip:'꿀벌 독성 — 개화기 절대 금지',crops:['사과','살구','매실','수박','참외','오이','배추']},
{type:'농약',name:'밀베녹수화제',brand:'바이엘',npk:'밀베멕틴',
 effect:'응애 전문, 고온건조기 방제',season:'6~8월',
 amount:'1,500배',price:'18,000원/100ml',where:'농자재마트',
 tip:'동일 약제 연용 금지',crops:['사과','살구','오이','수박','참외','호박']},
{type:'농약',name:'트레본유제',brand:'바이엘',npk:'에토펜프록스',
 effect:'노린재·나방류 방제, 저녁 방제 권장',season:'7~9월',
 amount:'1,000배',price:'15,000원/500ml',where:'농자재마트',
 tip:'어류 독성 강함',crops:['콩류','수박','사과','머루포도']},
{type:'농약',name:'모스피란수화제',brand:'스미토모',npk:'아세타미프리드',
 effect:'코니도 저항성 대체제, 진딧물·굴파리',season:'4~6·9월',
 amount:'2,000배',price:'12,000원/100g',where:'농자재마트',
 tip:'꿀벌 독성 주의',crops:['사과','살구','배추','무','마늘','양파']},
// 친환경
{type:'친환경',name:'석회유황합제',brand:'경농',npk:'황화칼슘',
 effect:'발아 전 동계 방제, 응애알·깍지벌레 제거',season:'2~3월·낙엽 후',
 amount:'5~7배 희석',price:'8,000원/1L',where:'농협',
 tip:'개화 직전 절대 금지',crops:['사과','살구','배','감나무','대추','모과','오디','다래','으름','블랙베리','무화과']},
{type:'친환경',name:'기계유유제(클린유)',brand:'경농',npk:'광유',
 effect:'월동 해충 제거, 발아 전 사용',season:'2~3월·낙엽 후',
 amount:'20~25배 희석',price:'10,000원/1L',where:'농협',
 tip:'발아 후 절대 금지 — 약해 심각',crops:['사과','살구','배','감나무','모과','앵두','오디','다래','블랙베리','무화과']},
{type:'친환경',name:'수화유황',brand:'경농',npk:'황(S)',
 effect:'흰가루병 물리적 방제, 친환경 인증 가능',season:'4~5·9~10월',
 amount:'500~800배',price:'8,000원/500g',where:'유기농자재점',
 tip:'고온(32°C↑) 약해 주의',crops:['사과','살구','수박','오이','참외','호박','다래']},
{type:'친환경',name:'탄산수소칼륨(카리그린)',brand:'경농',npk:'탄산수소칼륨',
 effect:'흰가루병 전문, 친환경 인증 가능',season:'발생 초기',
 amount:'500배',price:'10,000원/500g',where:'유기농자재점',
 tip:'고온 건조시 효과 감소',crops:['수박','참외','오이','호박','사과','다래']},
{type:'친환경',name:'님오일',brand:'에코팜',npk:'아자디락틴',
 effect:'식물성 천연 살충제, 수확 직전 사용 가능',season:'발생 초기',
 amount:'500~1,000배',price:'15,000원/500ml',where:'유기농자재점',
 tip:'고온기 약해 주의',crops:['수박','참외','오이','배추','사과','살구']},
{type:'친환경',name:'보르도액',brand:'경농',npk:'황산구리+생석회',
 effect:'세균병·역병·탄저병 예방, 친환경 가능',season:'4~5·10~11월',
 amount:'4-4식(1:1:25)',price:'12,000원/세트',where:'농자재마트',
 tip:'신초 약해 주의',crops:['사과','살구','배','포도','감나무','다래','으름','배추']},
// 묘목
{type:'묘목',name:'사과 M26 접목묘 (아리수)',brand:'충주·경북 과수묘목',npk:'-',
 effect:'조기 착과, 수관 관리 편리, M26 왜성',season:'11~3월 식재',
 amount:'주당 40,000~70,000원',price:'40,000~70,000원/주',where:'충주·영주 묘목 농장',
 tip:'M26은 지주 필수',crops:['사과']},
{type:'묘목',name:'블루베리 듀크(Duke) 조생종',brand:'블루베리 전문 묘목장',npk:'-',
 effect:'조생종, 수확량 많음, 피트모스 필수',season:'3~4·10~11월',
 amount:'주당 15,000~25,000원',price:'15,000~25,000원/주',where:'블루베리 묘목장',
 tip:'피트모스 토양개량 선행',crops:['블루베리']},
{type:'묘목',name:'무화과 봉황 품종',brand:'과수묘목 전문점',npk:'-',
 effect:'2기작, 풍산성, 국내 재배 적합',season:'3~4월',
 amount:'주당 20,000~35,000원',price:'20,000~35,000원/주',where:'무화과 묘목장',
 tip:'온실 온도 5°C 이상 유지',crops:['무화과']},
{type:'묘목',name:'헤이즐넛 제퍼슨(Jefferson)',brand:'견과류 묘목 전문',npk:'-',
 effect:'자가수분 가능, 수확량 많음',season:'11~3월',
 amount:'주당 30,000~50,000원',price:'30,000~50,000원/주',where:'견과류 묘목 전문점',
 tip:'기존 바르셀로나와 교차수분으로 수확량↑',crops:['헤이즐넛']},
// ── 작물 (화성시 남양읍 기후 맞춤, 초보자 추천) ─────────
// 화성시 남양읍: 연평균 기온 12°C, 연강수량 1,150mm, 해풍 영향
// 서해안 특성 — 봄 건조, 여름 집중호우, 겨울 적설
{type:'작물',name:'방울토마토',brand:'가지과 / 초보자 최적',npk:'-',
 effect:'실패율 낮음, 수확량 많음, 온실·노지 모두 가능, 어린이 체험 인기',
 season:'3~4월 정식 (5~10월 수확)',amount:'주당 1,500~2,000원',
 price:'1,500~2,000원/모종',where:'농협·종묘상',
 tip:'지주 세우기 필수, 일조량 충분한 곳',
 crops:['방울토마토']},
{type:'작물',name:'오이(백다다기)',brand:'박과 / 초보자 적합',npk:'-',
 effect:'생육 빠름, 병해충 강함, 60~70일 수확, 화성시 재배 농가 많음',
 season:'4~5월 정식 (6~9월 수확)',amount:'주당 1,500원',
 price:'1,500원/모종',where:'농협·종묘상',
 tip:'기둥 유인 필수, 물 자주 줘야 함',
 crops:['오이']},
{type:'작물',name:'가지',brand:'가지과 / 강건종',npk:'-',
 effect:'더위에 강함, 해풍 피해 적음, 서해안 기후 적합',
 season:'4~5월 정식 (7~10월 수확)',amount:'주당 1,500원',
 price:'1,500원/모종',where:'농협·종묘상',
 tip:'수분 요구량 높음, 연속 수확 가능',
 crops:['가지']},
{type:'작물',name:'들깨',brand:'꿀풀과 / 초보자 최적',npk:'-',
 effect:'병해충 거의 없음, 관리 매우 쉬움, 잎·종자 모두 수확, 화성시 특산',
 season:'5월 정식·직파 (8~10월 수확)',amount:'종자 5,000원/봉',
 price:'5,000원/봉',where:'농협·종묘상',
 tip:'건조에 약함, 배수 좋은 곳',
 crops:['들깨']},
{type:'작물',name:'고구마(호박고구마)',brand:'메꽃과 / 초보자 최적',npk:'-',
 effect:'병해충 강함, 관리 간단, 화성시 모래질 토양 최적, 저장 용이',
 season:'5월 순 심기 (9~10월 수확)',amount:'100순 20,000원',
 price:'20,000원/100순',where:'농협·인터넷',
 tip:'두둑 높이 30cm 이상 필수',
 crops:['고구마']},
{type:'작물',name:'땅콩',brand:'콩과 / 화성시 적합',npk:'-',
 effect:'서해안 모래질 토양 최적, 관리 쉬움, 아이들 수확 체험 인기',
 season:'5월 직파 (9~10월 수확)',amount:'종자 10,000원/kg',
 price:'10,000원/kg',where:'농협',
 tip:'배수 좋은 사질토 필수',
 crops:['땅콩']},
{type:'작물',name:'참깨',brand:'참깨과 / 초보자 적합',npk:'-',
 effect:'건조 강함, 해풍 피해 적음, 화성시 서해안 기후 적합',
 season:'5월 말 직파 (8~9월 수확)',amount:'종자 15,000원/봉',
 price:'15,000원/봉',where:'농협',
 tip:'배수 철저 — 습해에 약함',
 crops:['참깨']},
{type:'작물',name:'상추(적상추·청상추)',brand:'국화과 / 초보자 최적',npk:'-',
 effect:'파종 후 30~40일 수확, 연속 수확 가능, 빠른 성과로 초보자 자신감',
 season:'3~5월·9~10월 파종',amount:'씨앗 2,000원/봉',
 price:'2,000원/봉',where:'농협·종묘상',
 tip:'여름 직파 금지(장마+폭염 약함)',
 crops:['상추']},
{type:'작물',name:'대파',brand:'백합과 / 초보자 적합',npk:'-',
 effect:'월동 가능, 연중 관리, 화성시 주요 채소, 한번 심으면 수년 수확',
 season:'3~4월·8~9월 정식',amount:'모종 1,000원/묶음',
 price:'1,000원/묶음',where:'농협·종묘상',
 tip:'배수 좋은 곳, 재배 기간 길어 인내 필요',
 crops:['대파']},
{type:'작물',name:'감자(수미)',brand:'가지과 / 초보자 적합',npk:'-',
 effect:'화성시 봄 재배 최적, 관리 쉬움, 병해충 비교적 적음',
 season:'3월 중순 파종 (6월 초 수확)',amount:'씨감자 5,000원/2kg',
 price:'5,000원/2kg',where:'농협',
 tip:'역병 예방 필수, 장마 전 수확',
 crops:['감자']},
];

function renderRecommendDB(filterType) {
  const el = document.getElementById('recommendDBBody');
  if (!el) return;
  document.querySelectorAll('[id^="recBtn-"]').forEach(btn => {
    const on = btn.id === 'recBtn-' + filterType;
    btn.style.background  = on ? '#1B5E20' : 'white';
    btn.style.color       = on ? 'white'   : '#546E7A';
    btn.style.borderColor = on ? '#1B5E20' : '#E0E0E0';
    btn.style.fontWeight  = on ? '700'     : '400';
  });
  const myPlantNames = typeof allPlants !== 'undefined'
    ? allPlants.map(p => p.name.split(' ')[0]) : [];
  const items = RECOMMEND_DB
    .filter(i => filterType === '전체' || i.type === filterType)
    .map(i => ({...i, matched: i.crops.some(c => myPlantNames.some(p=>p.includes(c)||c.includes(p)))}))
    .sort((a,b) => (b.matched?1:0)-(a.matched?1:0));
  const bgs = {비료:'E8F5E9',농약:'FFEBEE',친환경:'F1F8E9',묘목:'FFF9C4',작물:'E3F2FD'};
  const tcs = {비료:'1B5E20',농약:'C62828',친환경:'33691E',묘목:'854F0B',작물:'1565C0'};
  const ics = {비료:'🌱',농약:'🧪',친환경:'🌿',묘목:'🌳',작물:'🥬'};
  el.innerHTML = items.map(i => {
    const bg=bgs[i.type]||'F5F5F5', tc=tcs[i.type]||'546E7A', ic=ics[i.type]||'📦';
    return `<div style="padding:12px 14px;border-bottom:1px solid #F0F0F0">
      <div style="display:flex;align-items:flex-start;gap:7px;flex-wrap:wrap;margin-bottom:5px">
        <span style="font-size:17px;font-weight:700;color:#212121">${i.name}</span>
        <span style="font-size:10px;background:#${bg};color:#${tc};padding:2px 8px;border-radius:10px;font-weight:700">${ic} ${i.type}</span>
        ${i.matched?'<span style="font-size:10px;background:#E3F2FD;color:#1565C0;padding:2px 8px;border-radius:10px;font-weight:700">✅ 내 작물</span>':''}
      </div>
      <div style="font-size:16px;color:#546E7A;margin-bottom:3px"><b style="color:#37474F">${i.brand}</b>${i.npk!=='-'?' · '+i.npk:''}</div>
      <div style="font-size:16px;color:#1B5E20;margin-bottom:3px">💡 ${i.effect}</div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;font-size:16px;color:#546E7A;margin-bottom:3px">
        <span>📅 ${i.season}</span><span>📏 ${i.amount}</span><span>💰 ${i.price}</span>
      </div>
      <div style="font-size:16px;color:#546E7A">🏪 ${i.where}${i.tip?' · <span style="color:#E65100">⚠ '+i.tip+'</span>':''}</div>
      <button onclick="addRecommendToSupply('${i.name.replace(/'/g,"\\'")}','${i.type}','${i.crops.join('·')}')"
        style="margin-top:7px;padding:5px 12px;background:#E8F5E9;border:1.5px solid #2E7D32;
        color:#1B5E20;border-radius:8px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit">
        + 구입 목록에 추가</button>
    </div>`;
  }).join('')||'<div style="text-align:center;padding:20px;color:#9E9E9E">해당 항목 없음</div>';
}

function addRecommendToSupply(name, type, cropStr) {
  if (mySupplies.some(s=>s.name===name)){showToast('이미 목록에 있습니다');return;}
  mySupplies.push({
    id:Date.now().toString(), type, name, ingredient:'', amount:'',
    purchaseTime:'필요시', months:'', crops:cropStr.split('·').filter(Boolean),
    addedDate:toYMD(REAL_TODAY),
  });
  localStorage.setItem('mySupplies',JSON.stringify(mySupplies));
  renderSupplyList(); renderPurchasePlan();
  showToast('✅ '+name+' 목록에 추가됨');
}

// 토스트 메시지
// ══════════════════════════════════════════════════════════

// ══════════════════════════════════════════════════════════

// ── 런타임 식물 배열 (allPlants 복사본, CRUD로 변경됨) ───
let plantsDB = [];
function savePlantsDBLocal() {
  try { localStorage.setItem('plantsDB', JSON.stringify(plantsDB)); } catch(e) {}
}
function loadPlantsDBLocal() {
  try {
    const s = localStorage.getItem('plantsDB');
    if (s) {
      const arr = JSON.parse(s);
      if (Array.isArray(arr) && arr.length) return arr.filter(p => p.status !== 'deleted');
    }
  } catch(e) {}
  return null;
}

// ── Google Sheets ↔ plantsDB 동기화 ──────────────────────────
async function initPlantsDB() {
  try {
    // 로컬 저장소에서 먼저 로드
    const localData = localStorage.getItem('plantsDB');
    if (localData) {
      plantsDB = JSON.parse(localData);
    } else {
      // 로컬에 없으면 기본값 사용
      plantsDB = allPlants.map(p => ({...p, qty: p.qty || 1, status: 'active'}));
    }
    showToast('🌱 식물 DB 초기화 완료 (' + plantsDB.length + '개)');
  } catch(e) {
    console.warn('initPlantsDB:', e.message);
    plantsDB = allPlants.map(p => ({...p, qty: p.qty || 1, status: 'active'}));
  }
  // locationChanges → plantsDB 병합 (단일 DB 통합)
  mergeLocationChangesToPlantsDB();
  savePlantsDBLocal();
  // 실시간 리스너 시작
  startPlantsListener();
  renderIrang();
  renderSearchResults(document.getElementById('searchInput')?.value || '', '전체');
}

// locationChanges를 plantsDB에 병합하는 헬퍼
function mergeLocationChangesToPlantsDB() {
  var lc = JSON.parse(localStorage.getItem('locationChanges') || '{}');
  var keys = Object.keys(lc);
  if (!keys.length) return;
  var merged = 0;
  keys.forEach(function(id) {
    var ch = lc[id];
    var p  = plantsDB.find(function(x){ return x.id === id; });
    if (p) {
      // locationChanges의 위치를 plantsDB에 반영 (아직 반영 안 된 것만)
      if (p.zone !== ch.zone || p.irang !== ch.irang || p.spot !== ch.spot) {
        p.zone  = ch.zone;
        p.irang = ch.irang;
        p.spot  = ch.spot;
        merged++;
      }
    }
  });
  if (merged > 0) showToast('🔄 위치 변경 이력 ' + merged + '건을 DB에 동기화했습니다');
}

function startPlantsListener() {
  return;
}

// ── 식물 추가 ─────────────────────────────────────────────
async function addPlant(plant) {
  // plant = {name, zone, irang, spot, cat, emoji, qty, note}
  const newId = 'u' + Date.now();
  const entry = {
    id: newId, ...plant,
    qty: Number(plant.qty) || 1,
    status: 'active',
    addedDate: toYMD(REAL_TODAY),
    updatedAt: new Date().toISOString(),
  };
  plantsDB.push(entry);
  savePlantsDBLocal();
  renderIrang();
  renderSearchResults('', '전체');
  showToast('🌱 ' + entry.name + ' 추가됨');
  var _pI = document.getElementById('pm-panel-irang'); if (_pI && _pI.style.display !== 'none') renderIrangInPanel();
  return entry;
}

// ── 식물 수량/상태 수정 ───────────────────────────────────
async function updatePlant(id, updates) {
  const idx = plantsDB.findIndex(p => p.id === id);
  if (idx < 0) return;
  const old = {...plantsDB[idx]};
  plantsDB[idx] = {...plantsDB[idx], ...updates, updatedAt: new Date().toISOString()};
  savePlantsDBLocal();
  renderIrang();
  renderSearchResults(document.getElementById('searchInput')?.value || '', '전체');
}

// ── 식물 삭제 (소멸) ──────────────────────────────────────
async function deletePlant(id, reason) {
  const plant = plantsDB.find(p => p.id === id);
  if (!plant) return;
  const idx = plantsDB.findIndex(p => p.id === id);
  plantsDB.splice(idx, 1);
  savePlantsDBLocal();
  renderIrang();
  renderSearchResults(document.getElementById('searchInput')?.value || '', '전체');
  showToast('🗑️ ' + plant.name + ' 삭제됨');
  var _pI = document.getElementById('pm-panel-irang'); if (_pI && _pI.style.display !== 'none') renderIrangInPanel();
}

// ══════════════════════════════════════════════════════════
// 이랑현황 — 구역별·이랑별 계층 렌더
// ══════════════════════════════════════════════════════════

// 구역 앵커로 스크롤 이동
function scrollToZone(zoneId) {
  if (zoneId === 'zone-top') {
    const sec = document.getElementById('sec-search');
    if (sec) sec.scrollIntoView({behavior:'smooth', block:'start'});
    return;
  }
  const el = document.getElementById(zoneId);
  if (el) {
    // 내비바 높이(약 50px) + 상단 여백 고려
    const y = el.getBoundingClientRect().top + window.scrollY - 56;
    window.scrollTo({top: y, behavior: 'smooth'});
  }
}

function renderIrang() {
  const listEl  = document.getElementById('irangList');
  if (!listEl) return;

  const plants = (plantsDB.length > 0 ? plantsDB : allPlants)
    .filter(p => p.status !== 'deleted');

  if (!plants.length) {
    listEl.innerHTML = '<div style="padding:30px;text-align:center;color:#9E9E9E">식물 데이터 없음</div>';
    return;
  }

  // ── 구역별 이랑 순서 정의 ────────────────────────────────
  const ZONE_ORDER = [
    { zone:'1구역',   label:'🌿 1구역',  irangs:['1이랑','2이랑','3이랑'],                               color:'#E8F5E9', tc:'#1B5E20', border:'#A5D6A7' },
    { zone:'사이구역', label:'🔀 사이구역', irangs:['A·B이랑','C·D이랑'],                                  color:'#FFF9C4', tc:'#854F0B', border:'#F9A825' },
    { zone:'2구역',   label:'🌳 2구역',  irangs:['1이랑','2이랑','3이랑','4이랑','5이랑','6이랑','7이랑','8이랑','9이랑','10이랑'], color:'#E3F2FD', tc:'#1565C0', border:'#90CAF9' },
    { zone:'온실',    label:'🏠 온실',   irangs:['온실 앞','온실 내부'],                                   color:'#FCE4EC', tc:'#880E4F', border:'#F48FB1' },
  ];

  // 식물 맵핑
  const plantMap = {};
  const extraZones = new Set();
  plants.forEach(p => {
    const z = p.zone  || '기타';
    const ir= p.irang || '미정';
    const k = z + '||' + ir;
    if (!plantMap[k]) plantMap[k] = [];
    plantMap[k].push(p);
    if (!ZONE_ORDER.some(zo => zo.zone === z)) extraZones.add(z);
  });

  const statusLabel = {active:'생육중',harvest:'수확중',prepare:'준비중',wait:'대기중',dead:'고사'};
  const statusStyle = {
    active:  'background:#C8E6C9;color:#1B5E20',
    harvest: 'background:#FFE0B2;color:#E65100',
    prepare: 'background:#BBDEFB;color:#1565C0',
    wait:    'background:#EEEEEE;color:#9E9E9E',
    dead:    'background:#FFCDD2;color:#C62828',
  };
  const catBg = {유실수:'#E8F5E9',채소:'#E3F2FD',기타:'#F5F5F5'};
  const catTc = {유실수:'#1B5E20',채소:'#1565C0',기타:'#546E7A'};

  // 이랑 하나 렌더
  function makeIrangHtml(zone, irang, zoneColor, zoneTc, zoneBorder) {
    const key   = zone + '||' + irang;
    const items = plantMap[key];
    if (!items || !items.length) return '';
    const total = items.reduce((s, p) => s + (Number(p.qty)||1), 0);

    return `
      <div style="border:1.5px solid ${zoneBorder||'#E0E0E0'};border-radius:10px;
        margin-bottom:8px;overflow:hidden">
        <!-- 이랑 헤더 -->
        <div style="background:#546E7A;padding:7px 12px;display:flex;
          align-items:center;justify-content:space-between;gap:6px">
          <span style="font-size:16px;font-weight:700;color:white">${irang}</span>
          <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
            <span style="font-size:10px;color:rgba(255,255,255,0.75)">${items.length}종·${total}그루</span>
            <!-- 상단 이동 버튼 -->
            <button onclick="scrollToZone('zone-top')"
              style="background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);
              color:white;border-radius:5px;padding:3px 7px;font-size:10px;
              cursor:pointer;font-family:inherit;white-space:nowrap">⬆ 맨위</button>
            <!-- 구역이동 버튼들 -->
            <button onclick="scrollToZone('zone-1구역')"
              style="background:#E8F5E9;border:none;color:#1B5E20;border-radius:5px;
              padding:3px 7px;font-size:10px;font-weight:700;cursor:pointer;
              font-family:inherit;white-space:nowrap">1구역</button>
            <button onclick="scrollToZone('zone-사이구역')"
              style="background:#FFF9C4;border:none;color:#854F0B;border-radius:5px;
              padding:3px 7px;font-size:10px;font-weight:700;cursor:pointer;
              font-family:inherit;white-space:nowrap">사이</button>
            <button onclick="scrollToZone('zone-2구역')"
              style="background:#E3F2FD;border:none;color:#1565C0;border-radius:5px;
              padding:3px 7px;font-size:10px;font-weight:700;cursor:pointer;
              font-family:inherit;white-space:nowrap">2구역</button>
            <button onclick="scrollToZone('zone-온실')"
              style="background:#FCE4EC;border:none;color:#880E4F;border-radius:5px;
              padding:3px 7px;font-size:10px;font-weight:700;cursor:pointer;
              font-family:inherit;white-space:nowrap">온실</button>
      + '<button data-irang="'+irang+'" data-zone="'+zone+'" onclick="openAddPlantModal(this.dataset.irang,this.dataset.zone)" style="background:#80CBC4;border:none;color:white;border-radius:5px;padding:3px 8px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit">+ 추가</button>'
              style="background:#80CBC4;border:none;color:white;border-radius:5px;
              padding:3px 8px;font-size:10px;font-weight:700;cursor:pointer;
              font-family:inherit;white-space:nowrap">+ 추가</button>
          </div>
        </div>
        <!-- 식물 목록 -->
        ${items.map(p => {
          const st  = p.status || 'active';
          const qty = Number(p.qty) || 1;
          const cbg = catBg[p.cat]  || '#F5F5F5';
          const ctc = catTc[p.cat]  || '#546E7A';
          return `
          <div style="padding:8px 12px;border-bottom:1px solid #F5F5F5;
            display:flex;align-items:center;gap:8px">
            <span style="font-size:20px;flex-shrink:0">${p.emoji||'🌱'}</span>
            <div style="flex:1;min-width:0">
              <div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">
                <span style="font-size:16px;font-weight:700;color:#212121">${p.name}</span>
                <span style="font-size:10px;background:${cbg};color:${ctc};
                  padding:1px 6px;border-radius:8px;font-weight:600">${p.cat||''}</span>
                <span style="font-size:10px;${statusStyle[st]||statusStyle.active};
                  padding:1px 6px;border-radius:8px;font-weight:600">${statusLabel[st]||st}</span>
              </div>
              <div style="font-size:10px;color:#9E9E9E;margin-top:1px">
                ${p.spot||''}${Number(p.qty)>1 ? ' · '+p.qty+'그루' : ''}${p.note ? ' · '+p.note : ''}
              </div>
            </div>
            <div style="display:flex;gap:4px;flex-shrink:0">
                style="background:#E3F2FD;border:1px solid #90CAF9;color:#1565C0;
                border-radius:5px;padding:4px 8px;font-size:10px;font-weight:700;
                cursor:pointer;font-family:inherit">수정</button>
              <button onclick="confirmDeletePlant('${p.id}','${p.name.replace(/'/g,"\\'")}')"
                style="background:#FFEBEE;border:1px solid #FFCDD2;color:#C62828;
                border-radius:5px;padding:4px 8px;font-size:10px;font-weight:700;
                cursor:pointer;font-family:inherit">삭제</button>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  let html = '';

  // 구역 순서대로 렌더
  ZONE_ORDER.forEach(zo => {
    const allIrangsInZone = [...new Set([
      ...zo.irangs,
      ...Object.keys(plantMap)
        .filter(k => k.startsWith(zo.zone + '||'))
        .map(k => k.split('||')[1])
    ])];
    const hasData = allIrangsInZone.some(ir => plantMap[zo.zone+'||'+ir]?.length > 0);
    if (!hasData) return;

    // 구역 앵커 + 헤더
    html += `
      <div id="zone-${zo.zone}" style="margin-bottom:16px">
        <div style="background:${zo.color};border-left:4px solid ${zo.tc};
          padding:9px 14px;border-radius:0 8px 8px 0;margin-bottom:8px;
          display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:6px">
          <span style="font-size:17px;font-weight:800;color:${zo.tc}">${zo.label}</span>
          <div style="display:flex;gap:6px;align-items:center">
      + '<button data-zone="'+zo.zone+'" onclick="openAddPlantModal(String(),this.dataset.zone)" style="background:'+zo.tc+';color:white;border:none;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">+ 추가</button>'
              style="background:${zo.tc};color:white;border:none;border-radius:8px;
              padding:5px 12px;font-size:16px;font-weight:700;cursor:pointer;font-family:inherit">
              + ${zo.zone} 추가
            </button>
          </div>
        </div>`;

    allIrangsInZone.forEach(ir => {
      html += makeIrangHtml(zo.zone, ir, zo.color, zo.tc, zo.border);
    });

    html += '</div>';
  });

  // 미분류 구역
  extraZones.forEach(zone => {
    const keys = Object.keys(plantMap).filter(k => k.startsWith(zone+'||'));
    if (!keys.length) return;
    html += `
      <div id="zone-${zone}" style="margin-bottom:16px">
        <div style="background:#F5F5F5;border-left:4px solid #9E9E9E;
          padding:9px 14px;border-radius:0 8px 8px 0;margin-bottom:8px">
          <span style="font-size:17px;font-weight:800;color:#546E7A">📍 ${zone}</span>
        </div>`;
    keys.forEach(k => html += makeIrangHtml(zone, k.split('||')[1], '#F5F5F5', '#9E9E9E', '#E0E0E0'));
    html += '</div>';
  });

  listEl.innerHTML = html || '<div style="padding:20px;text-align:center;color:#9E9E9E">식물 데이터 없음</div>';
}

// ══════════════════════════════════════════════════════════
// 식물 추가 모달
// ══════════════════════════════════════════════════════════
function openAddPlantModal(defaultIrang, defaultZone) {
  const existingModal = document.getElementById('addPlantModal');
  if (existingModal) existingModal.remove();

  // 이랑 목록
  const irangs = [...new Set([
    '1이랑','2이랑','3이랑','4이랑','5이랑',
    '6이랑','7이랑','8이랑','9이랑','10이랑',
    'A·B이랑','C·D이랑','온실 앞','온실 내부',
    ...plantsDB.map(p => p.irang)
  ])].filter(Boolean);

  const modal = document.createElement('div');
  modal.id = 'addPlantModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);'
    + 'z-index:1000;display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML = `
    <div style="background:white;border-radius:16px 16px 0 0;padding:20px;width:100%;
      max-width:500px;max-height:85vh;overflow-y:auto">
      <div style="font-size:15px;font-weight:700;color:#1B5E20;margin-bottom:14px">
        🌱 새 식물 추가
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div>
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">이름 *</div>
          <input id="apName" placeholder="예: 수박 블랙망고" type="text"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;box-sizing:border-box">
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">이랑 *</div>
          <select id="apIrang"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;background:white">
            ${irangs.map(ir => `<option value="${ir}" ${ir===defaultIrang?'selected':''}>${ir}</option>`).join('')}
            <option value="신규이랑">신규 이랑</option>
          </select>
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">구역</div>
          <select id="apZone"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;background:white">
            <option value="1구역">1구역</option>
            <option value="사이구역">사이구역</option>
            <option value="2구역">2구역</option>
            <option value="온실">온실</option>
            <option value="기타">기타</option>
          </select>
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">종류</div>
          <select id="apCat"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;background:white">
            <option value="유실수">🌳 유실수</option>
            <option value="채소">🥬 채소</option>
            <option value="기타">📦 기타</option>
          </select>
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">수량(그루)</div>
          <input id="apQty" type="number" value="1" min="1"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;box-sizing:border-box">
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">위치(m)</div>
          <input id="apSpot" placeholder="예: 경계 0m" type="text"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;box-sizing:border-box">
        </div>
      </div>
      <div style="margin-bottom:14px">
        <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">메모</div>
        <input id="apNote" placeholder="예: 2025년 봄 식재" type="text"
          style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
          font-size:17px;font-family:inherit;box-sizing:border-box">
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button onclick="document.getElementById('addPlantModal').remove()"
          style="padding:12px;background:#F5F5F5;border:none;border-radius:8px;
          font-size:17px;font-weight:700;cursor:pointer;font-family:inherit;color:#546E7A">
          취소
        </button>
        <button onclick="confirmAddPlant()"
          style="padding:12px;background:#1B5E20;color:white;border:none;border-radius:8px;
          font-size:17px;font-weight:700;cursor:pointer;font-family:inherit">
          ✅ 추가 저장
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
  document.getElementById('apName')?.focus();
  // defaultZone 설정
  if (defaultZone) {
    const zoneEl = document.getElementById('apZone');
    if (zoneEl) zoneEl.value = defaultZone;
  }
}

async function confirmAddPlant() {
  const name  = document.getElementById('apName')?.value.trim();
  const irang = document.getElementById('apIrang')?.value;
  const zone  = document.getElementById('apZone')?.value;
  const cat   = document.getElementById('apCat')?.value;
  const qty   = Number(document.getElementById('apQty')?.value) || 1;
  const spot  = document.getElementById('apSpot')?.value.trim();
  const note  = document.getElementById('apNote')?.value.trim();
  if (!name) { showToast('⚠ 이름을 입력하세요'); return; }

  const emojiMap = {유실수:'🌳', 채소:'🥬', 기타:'📦'};
  await addPlant({name, irang, zone, cat, qty, spot, note, emoji: emojiMap[cat]||'🌱'});
  document.getElementById('addPlantModal')?.remove();
}

// ══════════════════════════════════════════════════════════
// 식물 수정 모달
// ══════════════════════════════════════════════════════════
function openEditPlantModal(id) {
  let p = plantsDB.find(x => x.id === id);
  if (!p && typeof allPlants !== 'undefined') {
    const ap = allPlants.find(x => x.id === id);
    if (ap) {
      // plantsDB가 비어있으면 allPlants 기반으로 채운 뒤 편집
      if (!plantsDB.length) {
        plantsDB = allPlants.map(x => ({...x, qty: x.qty || 1, status: x.status || 'active'}));
        if (typeof savePlantsDBLocal === 'function') savePlantsDBLocal();
      }
      p = plantsDB.find(x => x.id === id);
    }
  }
  if (!p) return;
  const existingModal = document.getElementById('editPlantModal');
  if (existingModal) existingModal.remove();

  const irangs = [...new Set([
    '1이랑','2이랑','3이랑','4이랑','5이랑',
    '6이랑','7이랑','8이랑','9이랑','10이랑',
    'A·B이랑','C·D이랑','온실 앞','온실 내부',
    ...plantsDB.map(x => x.irang)
  ])].filter(Boolean);

  const modal = document.createElement('div');
  modal.id = 'editPlantModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);'
    + 'z-index:1000;display:flex;align-items:flex-end;justify-content:center';
  modal.innerHTML = `
    <div style="background:white;border-radius:16px 16px 0 0;padding:20px;width:100%;
      max-width:500px;max-height:85vh;overflow-y:auto">
      <div style="font-size:15px;font-weight:700;color:#1565C0;margin-bottom:14px">
        ✏️ ${p.name} 수정
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:10px">
        <div>
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">이름</div>
          <input id="epName" value="${p.name}" type="text"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;box-sizing:border-box">
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">이랑</div>
          <select id="epIrang"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;background:white">
            ${irangs.map(ir => `<option value="${ir}" ${ir===p.irang?'selected':''}>${ir}</option>`).join('')}
          </select>
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">수량</div>
          <input id="epQty" type="number" value="${p.qty||1}" min="0"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;box-sizing:border-box">
        </div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">상태</div>
          <select id="epStatus"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;background:white">
            <option value="active"  ${p.status==='active'  ?'selected':''}>생육중</option>
            <option value="harvest" ${p.status==='harvest' ?'selected':''}>수확중</option>
            <option value="prepare" ${p.status==='prepare' ?'selected':''}>준비중</option>
            <option value="wait"    ${p.status==='wait'    ?'selected':''}>대기중</option>
            <option value="dead"    ${p.status==='dead'    ?'selected':''}>고사</option>
          </select>
        </div>
        <div style="grid-column:1/-1">
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">위치</div>
          <input id="epSpot" value="${p.spot||''}" type="text"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;box-sizing:border-box">
        </div>
        <div style="grid-column:1/-1">
          <div style="font-size:16px;font-weight:700;color:#546E7A;margin-bottom:4px">수정 메모</div>
          <input id="epMemo" placeholder="예: 일부 고사로 3그루로 수정" type="text"
            style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;
            font-size:17px;font-family:inherit;box-sizing:border-box">
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        <button onclick="document.getElementById('editPlantModal').remove()"
          style="padding:12px;background:#F5F5F5;border:none;border-radius:8px;
          font-size:17px;font-weight:700;cursor:pointer;font-family:inherit;color:#546E7A">
          취소
        </button>
        <button onclick="confirmEditPlant('${id}')"
          style="padding:12px;background:#1565C0;color:white;border:none;border-radius:8px;
          font-size:17px;font-weight:700;cursor:pointer;font-family:inherit">
          ✅ 저장
        </button>
      </div>
    </div>`;
  document.body.appendChild(modal);
}

async function confirmEditPlant(id) {
  const updates = {
    name:   document.getElementById('epName')?.value.trim(),
    irang:  document.getElementById('epIrang')?.value,
    qty:    Number(document.getElementById('epQty')?.value) || 1,
    status: document.getElementById('epStatus')?.value,
    spot:   document.getElementById('epSpot')?.value.trim(),
    memo:   document.getElementById('epMemo')?.value.trim(),
  };
  await updatePlant(id, updates);
  document.getElementById('editPlantModal')?.remove();
  showToast('✅ 수정 저장됨');
  var _pI2=document.getElementById('pm-panel-irang'); if(_pI2&&_pI2.style.display!=='none') renderIrangInPanel();
  const q_ep=document.getElementById('searchInput')?.value||''; renderSearchResults(q_ep, searchFilterMode);
}

async function confirmDeletePlant(id, name) {
  const reason = prompt(`"${name}"을(를) 삭제하는 이유를 입력하세요:\n(예: 고사, 이식, 제거)`) || '삭제';
  if (reason === null) return; // 취소
  await deletePlant(id, reason);
}

// ══════════════════════════════════════════════════════════
// 구입내역(supply) → 묘목·작물 입력 시 plantsDB 연동
// ══════════════════════════════════════════════════════════
function onSupplySaved(entry) {
  // 묘목·작물 종류인 경우 식물 추가 여부 확인
  if (!['묘목','작물'].includes(entry.type)) return;
  if (!confirm(`"${entry.name}" 을(를) 이랑현황에도 추가하시겠습니까?`)) return;
  openAddPlantModal(''); // 추가 모달 열기
  // 이름 미리 채워두기
  setTimeout(() => {
    const nameEl = document.getElementById('apName');
    if (nameEl) nameEl.value = entry.name;
    const catEl  = document.getElementById('apCat');
    if (catEl) catEl.value = entry.type === '묘목' ? '유실수' : '채소';
  }, 100);
}

// ══════════════════════════════════════════════════════════
// 검색이동 — plantsDB 기반 렌더 (기존 renderSearchResults 확장)
// ══════════════════════════════════════════════════════════
// renderSearchResults 내부에서 plantsDB 우선 사용하도록 패치
const _origRenderSearch = typeof renderSearchResults === 'function' ? renderSearchResults : null;

function renderSearchResults(query, filter) {
  const box = document.getElementById('searchResults');
  if (!box) return;

  // plantsDB 우선 사용
  const source = plantsDB.length > 0 ? plantsDB : allPlants;
  let list = source.filter(p => p.status !== 'deleted');

  if (filter && filter !== '전체') {
    list = list.filter(p =>
      p.cat === filter || p.irang === filter ||
      p.zone === filter || p.name.includes(filter)
    );
  }
  if (query && query.trim()) {
    const q = query.trim().toLowerCase();
    list = list.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.irang||'').includes(q) ||
      (p.zone||'').includes(q) ||
      (p.cat||'').includes(q)
    );
  }

  if (!list.length) {
    box.innerHTML = '<div style="padding:20px;text-align:center;color:#9E9E9E;font-size:17px">검색 결과 없음</div>';
    return;
  }

  // 이랑별 그룹
  const grouped = {};
  list.forEach(p => { if(!grouped[p.irang]) grouped[p.irang]=[]; grouped[p.irang].push(p); });

  const catBg = {유실수:'#E8F5E9', 채소:'#E3F2FD', 기타:'#F5F5F5'};
  const catTc = {유실수:'#1B5E20', 채소:'#1565C0', 기타:'#546E7A'};
  const stBg  = {active:'#E8F5E9', harvest:'#FFF3E0', prepare:'#E3F2FD', wait:'#F5F5F5', dead:'#FFEBEE'};
  const stTc  = {active:'#1B5E20', harvest:'#E65100', prepare:'#1565C0', wait:'#9E9E9E', dead:'#C62828'};
  const stLbl = {active:'생육중', harvest:'수확중', prepare:'준비중', wait:'대기중', dead:'고사'};

  box.innerHTML = Object.entries(grouped).map(([irang, plants]) => `
    <div style="margin-bottom:10px">
      <div style="font-size:16px;font-weight:700;color:#546E7A;
        padding:5px 12px;background:#ECEFF1;border-radius:6px;margin-bottom:5px">
        📍 ${irang} (${plants.length}종)
      </div>
      ${plants.map(p => {
        const bg  = catBg[p.cat]||'#F5F5F5';
        const tc  = catTc[p.cat]||'#546E7A';
        const st  = p.status||'active';
        const qty = Number(p.qty)||1;
        return `
        <div style="background:white;border:1.5px solid #E0E0E0;border-radius:8px;
          padding:10px 12px;margin-bottom:6px">
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:5px;flex-wrap:wrap">
            <span style="font-size:16px">${p.emoji||'🌱'}</span>
            <span style="font-size:17px;font-weight:700;color:#212121">${p.name}</span>
            <span style="font-size:10px;background:${bg};color:${tc};
              padding:2px 8px;border-radius:8px;font-weight:600">${p.cat}</span>
            <span style="font-size:10px;background:${stBg[st]||'#F5F5F5'};color:${stTc[st]||'#546E7A'};
              padding:2px 8px;border-radius:8px;font-weight:600">${stLbl[st]||st}</span>
            <span style="font-size:16px;color:#9E9E9E">🌾 ${qty}그루</span>
          </div>
          <div style="font-size:16px;color:#9E9E9E;margin-bottom:7px">
            ${p.zone||''} · ${p.spot||''}${p.note?' · '+p.note:''}
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap">
            <button onclick="openEditPlantModal('${p.id}')"
              style="padding:6px 12px;background:#E3F2FD;border:1.5px solid #90CAF9;
              color:#1565C0;border-radius:8px;font-size:16px;font-weight:700;
              cursor:pointer;font-family:inherit">✏️ 위치·수량 수정</button>
            <button onclick="confirmDeletePlant('${p.id}','${p.name.replace(/'/g,String.fromCharCode(39))}')"
              style="padding:6px 12px;background:#FFEBEE;border:1.5px solid #FFCDD2;
              color:#C62828;border-radius:8px;font-size:16px;font-weight:700;
              cursor:pointer;font-family:inherit">🗑️ 삭제</button>
          </div>
        </div>`;
      }).join('')}
    </div>`).join('');
}

// DOMContentLoaded 후 plantsDB 초기화
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => initPlantsDB(), 1500);
  // 영구 저장 요청 (앱 삭제 전까지 데이터 보존 — 저장공간 부족 시 자동삭제 방지)
  requestPersistentStorage();
});

// ── 영구 저장(persistent storage) 요청 ───────────────────
async function requestPersistentStorage() {
  try {
    if (navigator.storage && navigator.storage.persist) {
      let persisted = await navigator.storage.persisted();
      if (!persisted) {
        persisted = await navigator.storage.persist();
      }
      window._storagePersisted = persisted;
      return persisted;
    }
  } catch(e) {}
  window._storagePersisted = null; // 미지원
  return null;
}

// ══ 기록장 팝업 ════════════════════════════════════
function openWorkLogPopup() {
  const popup = document.getElementById('workLogPopup');
  if (!popup) return;
  popup.style.display = 'block';
  document.body.style.overflow = 'hidden';
  renderPopupWorkLog();
}

function closeWorkLogPopup() {
  const popup = document.getElementById('workLogPopup');
  if (popup) popup.style.display = 'none';
  document.body.style.overflow = '';
}

function renderPopupWorkLog() {
  const el = document.getElementById('popupWorkLogList');
  if (!el) return;

  // localStorage에서 직접 읽기
  let logs = [];
  try { logs = JSON.parse(localStorage.getItem('workLog') || '[]'); } catch(e) {}
  logs.sort((a,b) => (b.id||0) - (a.id||0));

  if (!logs.length) {
    el.innerHTML = '<div style="text-align:center;padding:50px 20px;color:#9E9E9E">'
      + '<div style="font-size:40px;margin-bottom:12px">📒</div>'
      + '<div style="font-size:17px">기록된 작업이 없습니다</div>'
      + '<div style="font-size:14px;margin-top:8px">오늘 작업 탭에서 ✅ 체크하면 기록됩니다</div>'
      + '</div>';
    return;
  }

  const typeIcon  = {'일반':'✅','시비':'🌱','병해충':'🐛','긴급':'⚡','구입':'🛒'};
  const typeBg    = {'일반':'#E8F5E9','시비':'#F1F8E9','병해충':'#FFF8E1','긴급':'#FFEBEE','구입':'#E3F2FD'};
  const typeTc    = {'일반':'#1B5E20','시비':'#33691E','병해충':'#E65100','긴급':'#C62828','구입':'#1565C0'};
  const dayNames  = ['일','월','화','수','목','금','토'];

  const grouped = {};
  logs.forEach(e => {
    const d = e.date || '날짜없음';
    if (!grouped[d]) grouped[d] = [];
    grouped[d].push(e);
  });

  const todayStr = toYMD(REAL_TODAY);
  let h = '';
  Object.keys(grouped).sort().reverse().forEach(date => {
    const dt      = new Date(date + 'T00:00:00');
    const dn      = isNaN(dt.getTime()) ? '' : dayNames[dt.getDay()];
    const isToday = date === todayStr;
    const entries = grouped[date];
    h += `<div style="margin-bottom:12px;border-radius:10px;overflow:hidden;
      box-shadow:0 1px 6px rgba(0,0,0,0.12)">
      <div style="background:${isToday?'#1B5E20':'#37474F'};padding:10px 14px;
        display:flex;align-items:center;justify-content:space-between">
        <span style="color:white;font-size:16px;font-weight:700">
          ${isToday?'📌 오늘 — ':''}${date.replace(/-/g,'.')} (${dn})
        </span>
        <span style="color:rgba(255,255,255,0.75);font-size:14px">${entries.length}건</span>
      </div>`;
    entries.forEach(e => {
      const icon = typeIcon[e.type] || '✅';
      const bg   = typeBg[e.type]  || '#E8F5E9';
      const tc   = typeTc[e.type]  || '#1B5E20';
      h += `<div style="background:white;padding:12px 14px;border-bottom:1px solid #F5F5F5;
        display:flex;align-items:flex-start;gap:10px">
        <span style="font-size:22px;flex-shrink:0">${icon}</span>
        <div style="flex:1;min-width:0">
          <div style="font-size:17px;font-weight:700;color:#212121;margin-bottom:3px">${e.name||''}</div>
          ${e.detail?`<div style="font-size:15px;color:#546E7A;margin-bottom:2px">${e.detail}</div>`:''}
          ${e.loc?`<div style="font-size:13px;color:#9E9E9E">📍 ${e.loc}</div>`:''}
          <div style="margin-top:5px">
            <span style="font-size:13px;background:${bg};color:${tc};padding:2px 9px;
              border-radius:8px;font-weight:700">${e.type||'일반'}</span>
            <span style="font-size:13px;color:#BDBDBD;margin-left:6px">${e.time||''}</span>
          </div>
        </div>
        <button onclick="deletePopupLog(${e.id})"
          style="background:none;border:none;color:#BDBDBD;font-size:20px;
          cursor:pointer;padding:2px 4px;flex-shrink:0">✕</button>
      </div>`;
    });
    h += '</div>';
  });
  el.innerHTML = h;
}

function deletePopupLog(id) {
  let logs = [];
  try { logs = JSON.parse(localStorage.getItem('workLog')||'[]'); } catch(e) {}
  logs = logs.filter(e => String(e.id) !== String(id));
  localStorage.setItem('workLog', JSON.stringify(logs));
  workLog = logs;
  renderPopupWorkLog();
}

// ── 사진 압축: 업로드/저장 전에 리사이즈해서 용량을 크게 줄임 ──
// file을 받아 최대 1024px, JPEG 품질 0.7로 압축한 dataURL을 콜백으로 반환
function compressPhoto(file, callback) {
  if (!file) { callback(null); return; }
  var reader = new FileReader();
  reader.onload = function(e) {
    var img = new Image();
    img.onload = function() {
      var MAX = 1024;
      var w = img.width, h = img.height;
      if (w > h) { if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; } }
      else { if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; } }
      var canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      var ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      try {
        callback(canvas.toDataURL('image/jpeg', 0.7));
      } catch(err) {
        // 압축 실패 시 원본 사용
        callback(e.target.result);
      }
    };
    img.onerror = function() { callback(e.target.result); };
    img.src = e.target.result;
  };
  reader.onerror = function() { callback(null); };
  reader.readAsDataURL(file);
}

function showToast(msg) {
  let t = document.getElementById('toastMsg');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toastMsg';
    t.style.cssText = 'position:fixed;bottom:90px;left:50%;transform:translateX(-50%);'
      + 'background:#212121;color:white;padding:10px 20px;border-radius:20px;'
      + 'font-size:17px;font-weight:600;z-index:1000;opacity:0;transition:opacity 0.3s;'
      + 'white-space:nowrap;pointer-events:none;max-width:80vw;text-align:center';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.style.opacity = '1';
  setTimeout(() => { t.style.opacity = '0'; }, 2500);
}

// ── 초기 실행 ────────────────────────────────────────────
// ── 구글 시트 연동 ───────────────────────────────────────

// ── 구글 시트 연결 진단 ───────────────────────────────────

// ── 구글 시트 JSONP 로드 (CORS 완전 우회) ─────────────────
let _sheetCallback = null;

function loadGoogleSheet() {
  const btn  = document.getElementById('sheetLoadBtn');
  const body = document.getElementById('sheetBody');
  if (!body) return;
  if (btn) btn.textContent = '⏳ 불러오는 중...';

  body.innerHTML = `<div style="text-align:center;padding:20px;color:#9E9E9E">
    <div style="font-size:24px">📊</div>
    <div style="font-size:17px;margin-top:8px">구글 시트 연결 중...</div>
    <div style="font-size:16px;margin-top:6px;color:#BDBDBD">
      JSONP 방식으로 CORS 없이 불러옵니다
    </div></div>`;

  // 기존 스크립트 태그 제거
  const oldScript = document.getElementById('gvizScript');
  if (oldScript) oldScript.remove();

  // 타임아웃 (10초)
  const timer = setTimeout(() => {
    if (btn) btn.textContent = '🔄 불러오기';
    body.innerHTML = `
      <div style="background:#FFEBEE;border-radius:10px;padding:14px">
        <div style="font-size:17px;font-weight:700;color:#C62828;margin-bottom:8px">
          ⚠ 시간 초과 (10초)
        </div>
        <div style="font-size:16px;color:#E53935;line-height:1.9;margin-bottom:10px">
          <b>확인 사항:</b><br>
          ① 구글 시트 → 공유 → "링크 있는 모든 사용자" → <b>뷰어 이상</b><br>
          ② iPhone: 설정 → Safari → <b>사이트 간 추적 방지 OFF</b><br>
          ③ 인터넷 연결 상태 확인
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button onclick="loadGoogleSheet()" style="flex:1;min-width:110px;padding:10px;
            background:#1B5E20;color:white;border:none;border-radius:8px;
            font-size:17px;font-weight:700;cursor:pointer;font-family:inherit">
            🔄 다시 시도
          </button>
          <a href="https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit"
            target="_blank" style="flex:1;min-width:110px;text-align:center;
            display:block;padding:10px;background:#E3F2FD;color:#1565C0;
            border-radius:8px;font-size:17px;font-weight:700;text-decoration:none">
            ↗ 시트 직접 열기
          </a>
        </div>
      </div>`;
  }, 10000);

  // JSONP 콜백
  const cbName = 'gvizCb_' + Date.now();
  window[cbName] = function(data) {
    clearTimeout(timer);
    delete window[cbName];
    const oldS = document.getElementById('gvizScript');
    if (oldS) oldS.remove();
    if (btn) btn.textContent = '🔄 불러오기';

    try {
      if (!data || !data.table) throw new Error('데이터 없음 — 시트가 비어있거나 비공개입니다');

      const cols = data.table.cols;
      const rows = data.table.rows;

      if (!rows || rows.length === 0) throw new Error('시트에 데이터가 없습니다. farm1DB_예시.xlsx를 시트에 붙여넣으세요.');

      // 헤더 추출
      const headers = cols.map(c => c.label || c.id || '');

      // 행 데이터 추출
      const parsed = rows.map(r =>
        (r.c || []).map(cell => {
          if (!cell) return '';
          if (cell.v === null || cell.v === undefined) return '';
          return String(cell.v).trim();
        })
      ).filter(r => r.some(c => c));

      // 성공 화면
      body.innerHTML = `
        <div style="background:#E8F5E9;border-radius:8px;padding:9px 12px;margin-bottom:10px;
          display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
          <div>
            <div style="font-size:17px;font-weight:700;color:#1B5E20">✅ 연동 성공!</div>
            <div style="font-size:16px;color:#2E7D32;margin-top:2px">
              ${parsed.length}행 · ${headers.length}열 로드 완료
            </div>
          </div>
          <a href="https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit"
            target="_blank" style="background:#1565C0;color:white;border-radius:6px;
            padding:6px 12px;font-size:16px;font-weight:700;text-decoration:none">
            ↗ 시트 열기
          </a>
        </div>
        <div style="overflow-x:auto;-webkit-overflow-scrolling:touch;margin-bottom:10px">
          <table style="border-collapse:collapse;font-size:16px;min-width:100%">
            <tr style="background:#1B5E20">
              ${headers.map(h => `<th style="padding:7px 10px;color:white;text-align:left;
                white-space:nowrap;font-weight:700;border:1px solid #2E7D32">${h||'-'}</th>`).join('')}
            </tr>
            ${parsed.slice(0, 50).map((row, i) => `
            <tr style="background:${i%2===0?'white':'#F9F9F9'}">
              ${headers.map((_, ci) => `<td style="padding:6px 10px;border:1px solid #E0E0E0;
                white-space:nowrap">${row[ci]||'-'}</td>`).join('')}
            </tr>`).join('')}
          </table>
        </div>
        ${parsed.length > 50 ? `<div style="font-size:16px;color:#9E9E9E;text-align:center">
          총 ${parsed.length}행 중 50행 표시</div>` : ''}`;

      // 가져오기 버튼
      const importBtn = document.createElement('button');
      importBtn.textContent = `📥 앱으로 가져오기 (${parsed.length}행)`;
      importBtn.style.cssText = 'width:100%;margin-top:8px;padding:13px;background:#1B5E20;'
        + 'color:white;border:none;border-radius:8px;font-size:17px;font-weight:700;'
        + 'cursor:pointer;font-family:inherit;display:block';
      importBtn.onclick = () => {
        const result = importFromSheet(parsed, headers);
        renderSupplyList();
        renderPurchasePlan();
        showToast(`✅ ${result.added}개 추가, ${result.skipped}개 건너뜀`);
        importBtn.textContent = `✅ 완료! ${result.added}개 추가됨`;
        importBtn.style.background = '#388E3C';
        importBtn.disabled = true;
      };
      body.appendChild(importBtn);

    } catch(err) {
      body.innerHTML = `
        <div style="background:#FFEBEE;border-radius:8px;padding:14px">
          <div style="font-size:17px;font-weight:700;color:#C62828;margin-bottom:6px">
            ⚠ ${err.message}
          </div>
          <div style="font-size:16px;color:#E53935;line-height:1.8">
            시트 공개 설정: 공유 → "링크 있는 모든 사용자" → 뷰어 이상
          </div>
          <button onclick="loadGoogleSheet()" style="margin-top:10px;width:100%;
            padding:10px;background:#1B5E20;color:white;border:none;border-radius:8px;
            font-size:17px;font-weight:700;cursor:pointer;font-family:inherit">
            🔄 다시 시도
          </button>
        </div>`;
    }
  };

  // JSONP 스크립트 태그 삽입
  const script = document.createElement('script');
  script.id = 'gvizScript';
  script.src = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq`
    + `?gid=${SHEET_GID}&tqx=out:json;responseHandler:${cbName}`;
  script.onerror = () => {
    clearTimeout(timer);
    delete window[cbName];
    if (btn) btn.textContent = '🔄 불러오기';
    body.innerHTML = `
      <div style="background:#FFEBEE;border-radius:10px;padding:14px">
        <div style="font-size:17px;font-weight:700;color:#C62828;margin-bottom:8px">
          ⚠ 스크립트 로드 실패
        </div>
        <div style="font-size:16px;color:#E53935;line-height:1.9;margin-bottom:10px">
          ① 구글 시트 공유 → "링크 있는 모든 사용자" → <b>뷰어 이상</b> 설정<br>
          ② iPhone: 설정 → Safari → <b>사이트 간 추적 방지 OFF</b>
        </div>
        <div style="display:flex;gap:8px">
          <button onclick="loadGoogleSheet()" style="flex:1;padding:10px;
            background:#1B5E20;color:white;border:none;border-radius:8px;
            font-size:17px;font-weight:700;cursor:pointer;font-family:inherit">
            🔄 다시 시도
          </button>
          <a href="https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit"
            target="_blank" style="flex:1;text-align:center;display:block;padding:10px;
            background:#E3F2FD;color:#1565C0;border-radius:8px;
            font-size:17px;font-weight:700;text-decoration:none">
            ↗ 시트 열기
          </a>
        </div>
      </div>`;
  };
  document.head.appendChild(script);
}

// ── 연결 진단 ─────────────────────────────────────────────
function diagSheet() {
  const body = document.getElementById('sheetBody');
  if (!body) return;
  body.innerHTML = `
    <div style="background:#E3F2FD;border-radius:8px;padding:12px;font-size:16px;color:#1565C0">
      <div style="font-weight:700;margin-bottom:6px">🔍 진단 방법</div>
      <div style="line-height:1.9">
        1. <b>시트 직접 열기</b> → 데이터 있는지 확인<br>
        2. 공유 버튼 → "링크 있는 모든 사용자" → <b>뷰어 이상</b><br>
        3. 🔄 불러오기 버튼 다시 시도<br>
        4. iPhone Safari: 설정 → Safari → <b>사이트 간 추적 방지 OFF</b>
      </div>
      <div style="display:flex;gap:8px;margin-top:10px">
        <button onclick="loadGoogleSheet()" style="flex:1;padding:10px;
          background:#1B5E20;color:white;border:none;border-radius:8px;
          font-size:17px;font-weight:700;cursor:pointer;font-family:inherit">
          🔄 불러오기 시도
        </button>
        <a href="https://docs.google.com/spreadsheets/d/${SHEET_ID}/edit"
          target="_blank" style="flex:1;text-align:center;display:block;padding:10px;
          background:#E3F2FD;color:#1565C0;border-radius:8px;
          font-size:17px;font-weight:700;text-decoration:none">
          ↗ 시트 열기
        </a>
      </div>
    </div>`;
}

window.addEventListener('DOMContentLoaded', function() {
  // fCrop 이벤트
  const fCrop = document.getElementById('fCrop');
  if (fCrop) {
    fCrop.addEventListener('change', function() {
      const isCustom = this.value.startsWith('직접입력');
      const row = document.getElementById('customRow');
      if (row) row.style.display = isCustom ? 'block' : 'none';
    });
  }
  // 날씨 모드 초기화
  if (weatherMode === 'normal') {
    const btnD = document.getElementById('btnDrought');
    const btnN = document.getElementById('btnNormal');
    if (btnD) btnD.classList.remove('active');
    if (btnN) btnN.classList.add('active');
  }
  // 보유 농자재 초기화
  initDefaultSupplies();
    // 자동 실행 안 함 - 기본은 내 폰(localStorage) 사용
  // 월 탭 버튼 생성
  (function() {
    const bar = document.querySelector('#sec-monthly [style*="overflow-x:auto"]');
    if (!bar) return;
    const months = [1,2,3,4,5,6,7,8,9,10,11,12];
    const curM = new Date().getMonth() + 1;
    months.forEach(m => {
      const btn = document.createElement('button');
      btn.id = 'mtab-' + m;
      btn.textContent = m + '월';
      btn.style.cssText = `flex:0 0 auto;padding:7px 12px;border-radius:16px;
        border:1.5px solid ${m===curM?'#C62828':'#E0E0E0'};
        background:${m===curM?'#FFEBEE':'white'};
        color:${m===curM?'#C62828':'#546E7A'};
        font-size:16px;font-weight:${m===curM?'800':'500'};
        cursor:pointer;font-family:inherit`;
      btn.onclick = () => {
        document.querySelectorAll('[id^="mtab-"]').forEach(b => {
          b.style.background='white'; b.style.color='#546E7A';
          b.style.borderColor='#E0E0E0'; b.style.fontWeight='500';
        });
        btn.style.background='#1B5E20'; btn.style.color='white';
        btn.style.borderColor='#1B5E20'; btn.style.fontWeight='700';
        renderMonthlyTable(String(m));
      };
      bar.appendChild(btn);
    });
  })();
  // 완료 숨기기 버튼 상태 초기화
  (function() {
    const hideDone = localStorage.getItem('hideDoneTasks') === 'true';
    const btn = document.getElementById('hideDoneBtn');
    if (btn && hideDone) {
      btn.textContent = '👁 완료 보기';
      btn.style.background = '#E8F5E9';
      btn.style.color = '#1B5E20';
      btn.style.borderColor = '#A5D6A7';
    }
  })();
  // 생육기록 날짜 기본값
  const grDate = document.getElementById('grDate');
  if (grDate) grDate.value = toYMD(REAL_TODAY);
  // 생육기록 렌더
  renderGrowRecords();
  try {
    updateGrowStorageBanner();
    migrateGrowRecords();
  } catch(e) {}
  // 기록장 렌더 (탭 전환과 무관하게 미리 채움)
  renderWorkLog();
  // 전체 렌더
  renderAll();
  // 재배 그림 초기화 (DOM 완전 로드 후)
  setTimeout(() => {
    if (typeof showGuide === 'function') showGuide('watermelon');
  }, 100);
});

// ══════════════════════════════════════════════════════
// 통합 메뉴 전환 함수들
// ══════════════════════════════════════════════════════

// ① 작물 관리 내부 탭 (검색·위치변경 / 이랑별 현황)
function switchPlantMgmt(tab) {
  var pSearch = document.getElementById('pm-panel-search');
  var pIrang  = document.getElementById('pm-panel-irang');
  var tSearch = document.getElementById('pmtab-search');
  var tIrang  = document.getElementById('pmtab-irang');
  if (!pSearch || !pIrang) return;
  if (tab === 'irang') {
    pSearch.style.display = 'none';
    pIrang.style.display  = 'block';
    tSearch.style.background = 'white';
    tSearch.style.color      = '#1B5E20';
    tIrang.style.background  = '#1B5E20';
    tIrang.style.color       = 'white';
    // 이랑 현황 렌더링
    renderIrangInPanel();
  } else {
    pSearch.style.display = 'block';
    pIrang.style.display  = 'none';
    tSearch.style.background = '#1B5E20';
    tSearch.style.color      = 'white';
    tIrang.style.background  = 'white';
    tIrang.style.color       = '#1B5E20';
  }
}

// 이랑현황을 통합 패널(irangList2)에 렌더링 — plantsDB 직접 사용
function renderIrangInPanel() {
  var listEl = document.getElementById('irangList2');
  if (!listEl) return;
  // plantsDB 기반 renderIrang 로직을 irangList2에 직접 렌더
  var plants = getActivePlants();
  if (!plants.length) {
    listEl.innerHTML = '<div style="padding:30px;text-align:center;color:#9E9E9E">식물 데이터 없음</div>';
    return;
  }
  var ZONE_ORDER = [
    {zone:'1구역',   label:'🌿 1구역',  irangs:['1이랑','2이랑','3이랑'],                               color:'#E8F5E9', tc:'#1B5E20', border:'#A5D6A7'},
    {zone:'사이구역', label:'🔀 사이구역', irangs:['A·B이랑','C·D이랑'],                                  color:'#FFF9C4', tc:'#854F0B', border:'#F9A825'},
    {zone:'2구역',   label:'🌳 2구역',  irangs:['1이랑','2이랑','3이랑','4이랑','5이랑','6이랑','7이랑','8이랑','9이랑','10이랑'], color:'#E3F2FD', tc:'#1565C0', border:'#90CAF9'},
    {zone:'온실',    label:'🏠 온실',   irangs:['온실 앞','온실 내부'],                                   color:'#FCE4EC', tc:'#880E4F', border:'#F48FB1'},
  ];
  var plantMap = {};
  var extraZones = [];
  plants.forEach(function(p) {
    var loc = getPlantLoc(p);
    var z = loc.zone || '기타', ir = loc.irang || '미정';
    var k = z + '||' + ir;
    if (!plantMap[k]) plantMap[k] = [];
    plantMap[k].push({...p, _zone:z, _irang:ir, _spot:loc.spot});
    if (!ZONE_ORDER.some(function(zo){ return zo.zone===z; }) && !extraZones.includes(z)) extraZones.push(z);
  });
  var statusLabel = {active:'생육중',harvest:'수확중',prepare:'준비중',wait:'대기중',dead:'고사'};
  var statusStyle = {active:'background:#C8E6C9;color:#1B5E20',harvest:'background:#FFE0B2;color:#E65100',prepare:'background:#BBDEFB;color:#1565C0',wait:'background:#EEE;color:#9E9E9E',dead:'background:#FFCDD2;color:#C62828'};
  var catBg = {유실수:'#E8F5E9',채소:'#E3F2FD',기타:'#F5F5F5'};
  var catTc = {유실수:'#1B5E20',채소:'#1565C0',기타:'#546E7A'};

  function makeIrangHtml2(zone, irang, zo) {
    var k = zone + '||' + irang;
    var items = plantMap[k];
    if (!items || !items.length) return '';
    var total = items.reduce(function(s,p){ return s+(Number(p.qty)||1); }, 0);
    var zoneBorder = zo ? zo.border : '#E0E0E0';
    var zoneColor  = zo ? zo.color  : '#F5F5F5';
    var zoneTc     = zo ? zo.tc     : '#546E7A';
    var eid = 'z_' + zone.replace(/[^a-zA-Z가-힣]/g,'') + '_' + irang.replace(/[^a-zA-Z가-힣0-9]/g,'');
    var itemsHtml = items.map(function(p){
      var st = p.status||'active';
      return '<div style="padding:8px 12px;border-bottom:1px solid #F5F5F5;display:flex;align-items:center;gap:8px">'
        + '<span style="font-size:18px;flex-shrink:0">'+(p.emoji||'🌱')+'</span>'
        + '<div style="flex:1;min-width:0">'
        + '<div style="display:flex;align-items:center;gap:4px;flex-wrap:wrap">'
        + '<span style="font-size:13px;font-weight:700;color:#212121">'+p.name+'</span>'
        + '<span style="font-size:10px;background:'+(catBg[p.cat]||'#F5F5F5')+';color:'+(catTc[p.cat]||'#546E7A')+';padding:1px 6px;border-radius:8px;font-weight:600">'+(p.cat||'')+'</span>'
        + '<span style="font-size:10px;'+(statusStyle[st]||statusStyle.active)+';padding:1px 6px;border-radius:8px;font-weight:600">'+(statusLabel[st]||st)+'</span>'
        + '</div>'
        + '<div style="font-size:10px;color:#9E9E9E;margin-top:1px">'+(p._spot||p.spot||'')+(Number(p.qty)>1?' · '+p.qty+'그루':'')+(p.note?' · '+p.note:'')+'</div>'
        + '</div>'
        + '<div style="display:flex;gap:4px;flex-shrink:0">'
        + '<button data-pid="'+p.id+'" onclick="openEditPlantModal(this.dataset.pid)" style="background:#E3F2FD;border:1px solid #90CAF9;color:#1565C0;border-radius:5px;padding:4px 8px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit">수정</button>'
        + '<button data-pid="'+p.id+'" data-pnm="'+encodeURIComponent(p.name)+'" onclick="confirmDeletePlant(this.dataset.pid,decodeURIComponent(this.dataset.pnm))" style="background:#FFEBEE;border:1px solid #FFCDD2;color:#C62828;border-radius:5px;padding:4px 8px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit">삭제</button>'
        + '</div></div>';
    }).join('');
    return '<div style="border:1.5px solid '+zoneBorder+';border-radius:10px;margin-bottom:8px;overflow:hidden">'
      + '<div style="background:#546E7A;padding:7px 12px;display:flex;align-items:center;justify-content:space-between;gap:6px">'
      + '<span style="font-size:14px;font-weight:700;color:white">'+irang+'</span>'
      + '<span style="font-size:10px;color:rgba(255,255,255,0.75)">'+items.length+'종·'+total+'그루</span>'
      + '<button data-irang="'+irang+'" data-zone="'+zone+'" onclick="openAddPlantModal(this.dataset.irang,this.dataset.zone)" style="background:#80CBC4;border:none;color:white;border-radius:5px;padding:3px 8px;font-size:10px;font-weight:700;cursor:pointer;font-family:inherit">+ 추가</button>'
      + '</div>'
      + itemsHtml
      + '</div>';
  }

  var h = '';
  ZONE_ORDER.forEach(function(zo) {
    var allIrangs = zo.irangs.slice();
    Object.keys(plantMap).forEach(function(k){
      if (k.startsWith(zo.zone+'||')) {
        var ir = k.split('||')[1];
        if (!allIrangs.includes(ir)) allIrangs.push(ir);
      }
    });
    var hasData = allIrangs.some(function(ir){ return (plantMap[zo.zone+'||'+ir]||[]).length>0; });
    if (!hasData) return;
    h += '<div id="zone-'+zo.zone+'" style="margin-bottom:14px">'
      + '<div style="background:'+zo.color+';border-left:4px solid '+zo.tc+';padding:9px 14px;border-radius:0 8px 8px 0;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between">'
      + '<span style="font-size:15px;font-weight:800;color:'+zo.tc+'">'+zo.label+'</span>'
      + '<button data-zone="'+zo.zone+'" onclick="openAddPlantModal(String(),this.dataset.zone)" style="background:'+zo.tc+';color:white;border:none;border-radius:8px;padding:5px 12px;font-size:12px;font-weight:700;cursor:pointer;font-family:inherit">+ 추가</button>'
      + '</div>';
    allIrangs.forEach(function(ir){ h += makeIrangHtml2(zo.zone, ir, zo); });
    h += '</div>';
  });
  extraZones.forEach(function(zone){
    var keys = Object.keys(plantMap).filter(function(k){ return k.startsWith(zone+'||'); });
    if (!keys.length) return;
    h += '<div id="zone-'+zone+'" style="margin-bottom:14px">'
      + '<div style="background:#F5F5F5;border-left:4px solid #9E9E9E;padding:9px 14px;border-radius:0 8px 8px 0;margin-bottom:6px">'
      + '<span style="font-size:15px;font-weight:800;color:#546E7A">📍 '+zone+'</span></div>';
    keys.forEach(function(k){ h += makeIrangHtml2(zone, k.split('||')[1], null); });
    h += '</div>';
  });
  listEl.innerHTML = h || '<div style="padding:20px;text-align:center;color:#9E9E9E">식물 데이터 없음</div>';
}

// ② D-day 패널 접이식 토글
function toggleDdayPanel() {
  var panel = document.getElementById('ddayPanel');
  var arrow = document.getElementById('ddayArrow');
  if (!panel) return;
  var isOpen = panel.style.display !== 'none';
  panel.style.display = isOpen ? 'none' : 'block';
  if (arrow) arrow.style.transform = isOpen ? '' : 'rotate(180deg)';
  if (!isOpen) renderDDay(); // 열 때 렌더링
}
function switchGrowTab(tab) {
  var pDays   = document.getElementById('grow-panel-days');
  var pRecord = document.getElementById('grow-panel-record');
  var tDays   = document.getElementById('gtab-days');
  var tRecord = document.getElementById('gtab-record');
  if (!pDays || !pRecord) return;
  if (tab === 'record') {
    pDays.style.display   = 'none';
    pRecord.style.display = 'block';
    if (tDays)   { tDays.style.background='white';   tDays.style.color='#2E7D32'; }
    if (tRecord) { tRecord.style.background='#2E7D32'; tRecord.style.color='white'; }
        try { syncAndRenderGrowUnified(); } catch(e) { renderGrowRecords(); }
  } else {
    pDays.style.display   = 'block';
    pRecord.style.display = 'none';
    if (tDays)   { tDays.style.background='#2E7D32'; tDays.style.color='white'; }
    if (tRecord) { tRecord.style.background='white';  tRecord.style.color='#2E7D32'; }
  }
}
// ══ 생육 저장방식 + 불러오기/올리기 ═════════════════════
function setGrowStorage(mode) {
  growStorageMode = mode;
  localStorage.setItem('growStorageMode', mode);
  updateGrowStorageBanner();
  renderGrow();
  showToast(mode === 'local' ? '📱 로컬 모드' : '☁️ Google Sheets 모드');
}

function updateGrowStorageBanner() {
  var lbl = document.getElementById('growStorageLabel');
  var sub = document.getElementById('growStorageSub');
  var bL  = document.getElementById('storageBtn-local');
    if (!lbl) return;
  
    lbl.textContent = '📱 내 폰에만 저장 (선택됨)';
    sub.textContent = 'Google Sheets 사용 중 · 이 기기에만 저장';
    if (bL) { bL.style.background='#1B5E20'; bL.style.color='white'; bL.style.borderColor='#1B5E20'; bL.style.fontWeight='700'; }
    if (bF) { bF.style.background='white'; bF.style.color='#9E9E9E'; bF.style.borderColor='#E0E0E0'; bF.style.fontWeight='600'; }
  
}

function savePlantsLocal() {
  try { localStorage.setItem('plants', JSON.stringify(plants)); } catch(e) {}
}

function savePlantsAll() {
  savePlantsLocal();
}
async function uploadGrowToFirebase() {
  showToast('⚠️ 이 기능은 Google Sheets 백업으로 대체되었습니다');
}

function migrateGrowRecords() {
  try {
    var gr = JSON.parse(localStorage.getItem('growRecords') || '[]');
    if (!gr.length) return;

    // 불완전한 레코드 필터링 (plantName, date 없는 것 제외)
    gr = gr.filter(function(r) {
      return r && typeof r.plantName === 'string' && r.plantName &&
             typeof r.date === 'string' && r.date;
    });
    if (!gr.length) return;

    // 작물명별로 그룹화
    var byName = {};
    gr.forEach(function(r) {
      if (!byName[r.plantName]) byName[r.plantName] = [];
      byName[r.plantName].push(r);
    });

    var addedPlants = 0, addedEvents = 0;

    Object.keys(byName).forEach(function(name) {
      var recs = byName[name];

      // plants에 해당 작물이 없으면 growRecords 기반으로 자동 생성
      var p = plants.find(function(x){ return x.name === name; });
      if (!p) {
        // 파종/정식 레코드 중 가장 오래된 것을 dateStr 기준으로 사용
        var seedRec = recs
          .filter(function(r){ return r.eventType==='파종' || r.eventType==='정식'; })
          .sort(function(a,b){ return a.date.localeCompare(b.date); })[0];
        var oldest = recs.slice().sort(function(a,b){ return a.date.localeCompare(b.date); })[0];
        var dateStr = seedRec ? seedRec.date : oldest.date;

        // 날짜 유효성 확인
        var testD = new Date(dateStr + 'T00:00:00');
        if (isNaN(testD.getTime())) dateStr = toYMD(REAL_TODAY);

        // 작물명에서 이모지 추정
        var emoji = '🌱';
        var emojiMap = [
          ['수박','🍉'],['참외','🍈'],['오이','🥒'],['호박','🎃'],['애호박','🟢'],
          ['콩','🫘'],['감자','🥔'],['고구마','🍠'],['생강','🌿'],['양파','🧅'],
          ['마늘','🧄'],['배추','🥬'],['무','🥕'],['토마토','🍅'],['옥수수','🌽'],
        ];
        for (var ei=0; ei<emojiMap.length; ei++) {
          if (name.includes(emojiMap[ei][0])) { emoji = emojiMap[ei][1]; break; }
        }

        p = {
          id: 'gr_' + name.replace(/[^가-힣a-zA-Z0-9]/g,'_') + '_' + dateStr.replace(/-/g,''),
          name: name,
          emoji: emoji,
          loc: 'Google Sheets 기록',
          dateStr: dateStr,
          totalDays: 120,
          pinchDay: 0,
          fruitDay: 0,
          note: '',
          events: [],
          updatedAt: new Date().toISOString(),
          fromGrowRecords: true   // growRecords에서 생성된 항목 표시
        };
        plants.push(p);
        addedPlants++;
      }

      // growRecords 이벤트 병합
      if (!Array.isArray(p.events)) p.events = [];
      recs.forEach(function(r) {
        if (!p.events.some(function(e){ return e.id === r.id; })) {
          var daysFrom = 0;
          try {
            var d1 = new Date(p.dateStr+'T00:00:00'), d2 = new Date(r.date+'T00:00:00');
            daysFrom = Math.max(0, Math.round((d2-d1)/86400000));
          } catch(e2){}
          p.events.push({ id:r.id, type:r.eventType, date:r.date, note:r.note||'', daysFrom:daysFrom });
          addedEvents++;
        }
      });
    });

    if (addedPlants > 0 || addedEvents > 0) {
      savePlantsLocal();
    }
  } catch(e) { console.warn('migrateGrowRecords:', e); }
}

async function syncAndRenderGrowUnified() {
  var el = document.getElementById('growUnifiedList');
  if (!el) return;
  el.innerHTML = '<div style="text-align:center;padding:20px;color:#9E9E9E">⏳ Google Sheets에서 불러오는 중...</div>';

  try {
    // Google Sheets에서 growRecords 로드
    var rawGr = await loadFromGoogleSheets(COLLECTIONS.growRecords);
    if (rawGr && rawGr.length > 0) {
      var localIds = new Set(growRecords.map(function(r){ return String(r.id); }));
      rawGr.forEach(function(r){
        if (!localIds.has(String(r.id))) growRecords.unshift(r);
      });
      growRecords.sort(function(a,b){ return (b.id||0) > (a.id||0) ? 1 : -1; });
      localStorage.setItem('growRecords', JSON.stringify(growRecords));
    }
  } catch(e) { console.warn('syncAndRenderGrowUnified:', e.message); }

  // 2. growRecords를 plants[].events에 병합
  var byName = {};
  growRecords.forEach(function(r){
    var nm = r.plantName || r.name || '';
    if (!nm) return;
    if (!byName[nm]) byName[nm] = [];
    byName[nm].push(r);
  });

  var standaloneNames = {};
  Object.keys(byName).forEach(function(nm){
    var found = plants.some(function(p){ return p.name === nm; });
    if (!found) standaloneNames[nm] = byName[nm];
  });

  var html = '';
  Object.entries(byName).forEach(function(entry) {
    var name = entry[0], recs = entry[1];
    recs.sort(function(a,b){ return a.date.localeCompare(b.date); });
    var evHtml = recs.map(function(r){
      return '<div style="display:flex;align-items:center;gap:4px;padding:3px 0;font-size:12px">'
        + '<span style="background:#FFF3E0;color:#E65100;padding:1px 6px;border-radius:5px;font-weight:700;flex-shrink:0">'+(r.eventType||r.type||'기록')+'</span>'
        + '<span style="color:#546E7A;flex-shrink:0">'+r.date+'</span>'
        + (r.daysFrom>0?'<span style="color:#9E9E9E;flex-shrink:0;margin-left:2px">+'+r.daysFrom+'일</span>':'')
        + '<span style="color:#9E9E9E;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-left:2px">'+(r.note||'')+'</span>'
        + '<button data-rid="'+r.id+'" onclick="deleteGrowRecord(this.dataset.rid);syncAndRenderGrowUnified()" style="background:none;border:none;color:#ccc;font-size:13px;cursor:pointer;flex-shrink:0">✕</button>'
        + '</div>';
    }).join('');
    html += '<div style="background:white;border:1.5px solid #FFCC80;border-radius:10px;margin-bottom:8px;overflow:hidden">'
      + '<div style="background:#E65100;padding:8px 12px;display:flex;align-items:center;justify-content:space-between">'
      + '<span style="font-size:14px;font-weight:700;color:white">'+name+'</span>'
      + '<span style="font-size:10px;color:rgba(255,255,255,0.8)">Google Sheets 기록</span>'
      + '</div>'
      + '<div style="padding:8px 12px">'+evHtml+'</div>'
      + '</div>';
  });

  if (!html) {
    html = '<div style="text-align:center;padding:20px;color:#9E9E9E;font-size:13px">등록된 생육 기록이 없습니다<br>탭A의 작물 카드에서 이벤트를 추가하세요</div>';
  }
  el.innerHTML = html;
  showToast('✅ 생육 기록 동기화 완료 (' + (plants.length + Object.keys(standaloneNames).length) + '종)');
}
// ══ 이벤트 추가 모달 ═════════════════════════════════════
function openAddEventModal(plantId) {
  try {
    var p = plants.find(function(x) { return x.id === plantId; });
    if (!p) return;
    var ex = document.getElementById('growEventModal'); if (ex) ex.remove();
    var types = ['파종','정식','발아','개화','착과','수확','순치기','북주기','배토','기타'];
    var opts  = types.map(function(t){ return '<option value="'+t+'">'+t+'</option>'; }).join('');
    var today = toYMD(REAL_TODAY);
    var d = document.createElement('div');
    d.id = 'growEventModal';
    d.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:flex-end;justify-content:center;';
    d.innerHTML = '<div style="background:white;border-radius:16px 16px 0 0;padding:20px;width:100%;max-width:500px;max-height:80vh;overflow-y:auto">'
      +'<div style="font-size:15px;font-weight:700;color:#1B5E20;margin-bottom:14px">📝 이벤트 기록 — '+p.name+'</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
      +'<div><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">이벤트 유형</div>'
      +'<select id="gevType" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;background:white">'+opts+'</select></div>'
      +'<div><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">날짜</div>'
      +'<input type="date" id="gevDate" value="'+today+'" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div>'
      +'</div><div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">메모</div>'
      +'<input type="text" id="gevNote" placeholder="예: 12절 착과" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<button data-mid="growEventModal" onclick="var m=document.getElementById(this.dataset.mid);if(m)m.remove()" style="padding:12px;background:#F5F5F5;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;color:#546E7A">취소</button>'
      +'<button data-pid="'+plantId+'" onclick="saveGrowEvent(this.dataset.pid)" style="padding:12px;background:#1B5E20;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">✅ 저장</button>'
      +'</div></div>';
    document.body.appendChild(d);
  } catch(e) { console.error('openAddEventModal:', e); }
}
function saveGrowEvent(plantId) {
  try {
    var p = plants.find(function(x){ return x.id === plantId; }); if (!p) return;
    var type = (document.getElementById('gevType')||{}).value || '기타';
    var date = (document.getElementById('gevDate')||{}).value || toYMD(REAL_TODAY);
    var note = ((document.getElementById('gevNote')||{}).value||'').trim();
    if (!date) { showToast('날짜를 선택하세요'); return; }
    var baseEv = (p.events||[]).find(function(e){ return e.type==='파종'||e.type==='정식'; });
    var baseDate = baseEv ? baseEv.date : p.dateStr;
    var daysFrom = 0;
    if (baseDate) { var d1=new Date(baseDate+'T00:00:00'),d2=new Date(date+'T00:00:00'); daysFrom=Math.round((d2-d1)/86400000); }
    if (!Array.isArray(p.events)) p.events = [];
    p.events.push({ id: Date.now().toString(), type: type, date: date, note: note, daysFrom: daysFrom });
    p.updatedAt = new Date().toISOString();
    savePlantsAll();
    var m = document.getElementById('growEventModal'); if (m) m.remove();
    renderGrow();
    showToast('✅ '+p.name+' '+type+' 기록됨'+(daysFrom>0?' (+'+daysFrom+'일)':''));
  } catch(e) { console.error('saveGrowEvent:', e); }
}
function deleteGrowEvent(plantId, eventId) {
  try {
    var p = plants.find(function(x){ return x.id===plantId; });
    if (!p||!Array.isArray(p.events)) return;
    if (!confirm('이 기록을 삭제할까요?')) return;
    p.events = p.events.filter(function(e){ return e.id!==eventId; });
    p.updatedAt = new Date().toISOString();
    savePlantsAll(); renderGrow(); showToast('🗑️ 기록 삭제됨');
  } catch(e) {}
}
function editGrowEvent(plantId, eventId) {
  try {
    var p = plants.find(function(x){ return x.id===plantId; });
    var ev = p&&Array.isArray(p.events)?p.events.find(function(e){ return e.id===eventId; }):null;
    if (!ev) return;
    var ex = document.getElementById('growEventEditModal'); if (ex) ex.remove();
    var types = ['파종','정식','발아','개화','착과','수확','순치기','북주기','배토','기타'];
    var opts = types.map(function(t){ return '<option value="'+t+'"'+(ev.type===t?' selected':'')+'>'+t+'</option>'; }).join('');
    var d = document.createElement('div');
    d.id = 'growEventEditModal';
    d.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:flex-end;justify-content:center;';
    d.innerHTML = '<div style="background:white;border-radius:16px 16px 0 0;padding:20px;width:100%;max-width:500px;max-height:80vh;overflow-y:auto">'
      +'<div style="font-size:15px;font-weight:700;color:#1B5E20;margin-bottom:14px">✏️ 이벤트 수정</div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
      +'<div><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">유형</div>'
      +'<select id="gevtType" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;background:white">'+opts+'</select></div>'
      +'<div><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">날짜</div>'
      +'<input type="date" id="gevtDate" value="'+ev.date+'" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div>'
      +'</div><div style="margin-bottom:14px"><div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:4px">메모</div>'
      +'<input type="text" id="gevtNote" value="'+(ev.note||'').replace(/"/g,'&quot;')+'" style="width:100%;padding:10px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:14px;font-family:inherit;box-sizing:border-box"></div>'
      +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
      +'<button data-mid="growEventEditModal" onclick="var m=document.getElementById(this.dataset.mid);if(m)m.remove()" style="padding:12px;background:#F5F5F5;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit;color:#546E7A">취소</button>'
      +'<button data-pid="'+plantId+'" data-eid="'+eventId+'" onclick="updateGrowEvent(this.dataset.pid,this.dataset.eid)" style="padding:12px;background:#1B5E20;color:white;border:none;border-radius:8px;font-size:14px;font-weight:700;cursor:pointer;font-family:inherit">✅ 저장</button>'
      +'</div></div>';
    document.body.appendChild(d);
  } catch(e) {}
}
function updateGrowEvent(plantId, eventId) {
  try {
    var p = plants.find(function(x){ return x.id===plantId; });
    var ev = p&&Array.isArray(p.events)?p.events.find(function(e){ return e.id===eventId; }):null;
    if (!ev) return;
    ev.type = (document.getElementById('gevtType')||{}).value||ev.type;
    ev.date = (document.getElementById('gevtDate')||{}).value||ev.date;
    ev.note = ((document.getElementById('gevtNote')||{}).value||'').trim();
    var baseEv = (p.events||[]).find(function(e){ return (e.type==='파종'||e.type==='정식')&&e.id!==eventId; });
    var baseDate = baseEv ? baseEv.date : p.dateStr;
    if (baseDate) { var d1=new Date(baseDate+'T00:00:00'),d2=new Date(ev.date+'T00:00:00'); ev.daysFrom=Math.round((d2-d1)/86400000); }
    p.updatedAt = new Date().toISOString();
    savePlantsAll();
    var m = document.getElementById('growEventEditModal'); if (m) m.remove();
    renderGrow(); showToast('✅ 이벤트 수정 완료');
  } catch(e) {}
}

// ══ 핀치줌 (전체 앱) ═════════════════════════════════════
(function() {
  var scale = 1, startDist = 0, startScale = 1;
  var originX = 0, originY = 0;
  var translateX = 0, translateY = 0;
  var startTX = 0, startTY = 0;
  var pointers = {};
  var isPinching = false;

  function getPts() { return Object.values(pointers); }
  function dist(a,b){ var dx=a.clientX-b.clientX,dy=a.clientY-b.clientY; return Math.sqrt(dx*dx+dy*dy); }
  function mid(a,b){ return {x:(a.clientX+b.clientX)/2, y:(a.clientY+b.clientY)/2}; }
  function applyTr() {
    var s = Math.max(0.5, Math.min(4.0, scale));
    document.body.style.transformOrigin = originX+'px '+originY+'px';
    document.body.style.transform = 'scale('+s+') translate('+(translateX/s)+'px,'+(translateY/s)+'px)';
  }

  document.addEventListener('pointerdown', function(e) {
    pointers[e.pointerId] = e;
    var pts = getPts();
    if (pts.length === 2) {
      isPinching = true;
      startDist  = dist(pts[0], pts[1]);
      startScale = scale;
      var m      = mid(pts[0], pts[1]);
      originX = m.x; originY = m.y;
      startTX = translateX; startTY = translateY;
      e.preventDefault();
    }
  }, {passive:false});

  document.addEventListener('pointermove', function(e) {
    if (!pointers[e.pointerId]) return;
    pointers[e.pointerId] = e;
    var pts = getPts();
    if (pts.length === 2 && isPinching) {
      scale = Math.max(0.5, Math.min(4.0, startScale * (dist(pts[0],pts[1]) / startDist)));
      var m = mid(pts[0], pts[1]);
      translateX = startTX + (m.x - originX);
      translateY = startTY + (m.y - originY);
      applyTr();
      e.preventDefault();
    }
  }, {passive:false});

  function pUp(e) {
    delete pointers[e.pointerId];
    if (Object.keys(pointers).length < 2) {
      isPinching = false;
      if (Math.abs(scale-1) < 0.05) {
        scale=1; translateX=0; translateY=0;
        document.body.style.transform=''; document.body.style.transformOrigin='';
      }
    }
  }
  document.addEventListener('pointerup', pUp);
  document.addEventListener('pointercancel', pUp);

  // 더블탭으로 원래 크기 복원
  var lastTap = 0;
  document.addEventListener('touchend', function() {
    var now = Date.now();
    if (now - lastTap < 300) {
      scale=1; translateX=0; translateY=0;
      document.body.style.transform=''; document.body.style.transformOrigin='';
      pointers={};
    }
    lastTap = now;
  });
})();

// ══ 통합 추가 모달: 새 작물 추가 + 이벤트 기록 ══════════════
function openUnifiedAddModal(existingPlantId) {
  var ex = document.getElementById('unifiedAddModal'); if (ex) ex.remove();
  var today = toYMD(REAL_TODAY);

  // 기존 plants 목록으로 선택지 생성
  var existingOpts = '<option value="">-- 새 작물 등록 --</option>';
  plants.forEach(function(p) {
    var sel = (existingPlantId && p.id === existingPlantId) ? ' selected' : '';
    existingOpts += '<option value="'+p.id+'"'+sel+'>'+p.emoji+' '+p.name+'</option>';
  });

  var modal = document.createElement('div');
  modal.id = 'unifiedAddModal';
  modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.55);z-index:1000;display:flex;align-items:flex-end;justify-content:center;';

  modal.innerHTML = '<div style="background:white;border-radius:16px 16px 0 0;width:100%;max-width:500px;max-height:90vh;overflow-y:auto">'
    // 헤더
    + '<div style="background:#1B5E20;border-radius:16px 16px 0 0;padding:14px 16px;display:flex;align-items:center;justify-content:space-between">'
    +   '<span style="font-size:15px;font-weight:700;color:white">🌱 작물 추가 · 이벤트 기록</span>'
    +   '<button onclick="document.getElementById(\'unifiedAddModal\').remove()" style="background:none;border:none;color:white;font-size:20px;cursor:pointer;line-height:1">✕</button>'
    + '</div>'
    + '<div style="padding:16px">'

    // ── 섹션 A: 작물 선택 ──
    + '<div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:6px">① 작물 선택</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px">'
    // 기존 작물 선택
    +   '<div>'
    +     '<div style="font-size:10px;color:#9E9E9E;margin-bottom:3px">등록된 작물에서 선택</div>'
    +     '<select id="uExistingPlant" onchange="unifiedSyncExisting()" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;font-size:13px;font-family:inherit;background:white">'+existingOpts+'</select>'
    +   '</div>'
    // 새 작물 목록에서 선택
    +   '<div>'
    +     '<div style="font-size:10px;color:#9E9E9E;margin-bottom:3px">새 작물 목록에서 선택</div>'
    +     '<select id="uNewCrop" onchange="unifiedSyncNew()" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;font-size:13px;font-family:inherit;background:white">'
    +       '<option value="">-- 선택 --</option>'
    +       document.getElementById('fCrop').innerHTML
    +     '</select>'
    +   '</div>'
    + '</div>'
    // 직접입력
    + '<div id="uCustomRow" style="margin-bottom:10px;display:none">'
    +   '<div style="font-size:10px;color:#9E9E9E;margin-bottom:3px">작물명 직접 입력</div>'
    +   '<input type="text" id="uCustomName" placeholder="예: 방울토마토" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:13px;font-family:inherit;box-sizing:border-box">'
    + '</div>'
    // 선택된 작물 표시
    + '<div id="uSelectedInfo" style="background:#F1F8E9;border-radius:8px;padding:8px 12px;margin-bottom:12px;font-size:12px;color:#2E7D32;display:none"></div>'

    // ── 섹션 B: 심은 날짜 (새 작물일 때만) ──
    + '<div id="uDateSection" style="margin-bottom:12px">'
    +   '<div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:6px">② 심은 날짜</div>'
    +   '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">'
    +     '<div>'
    +       '<div style="font-size:10px;color:#9E9E9E;margin-bottom:3px">정식/파종일 *</div>'
    +       '<input type="date" id="uDate" value="'+today+'" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #A5D6A7;font-size:13px;font-family:inherit;box-sizing:border-box">'
    +     '</div>'
    +     '<div>'
    +       '<div style="font-size:10px;color:#9E9E9E;margin-bottom:3px">메모</div>'
    +       '<input type="text" id="uNote" placeholder="예: 접목모종" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;font-size:13px;font-family:inherit;box-sizing:border-box">'
    +     '</div>'
    +   '</div>'
    + '</div>'

    // ── 섹션 C: 이벤트 기록 ──
    + '<div style="font-size:11px;font-weight:700;color:#546E7A;margin-bottom:6px">③ 이벤트 기록 <span style="font-size:10px;font-weight:400;color:#9E9E9E">(선택 — 파종·착과·수확 등)</span></div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px">'
    +   '<div>'
    +     '<div style="font-size:10px;color:#9E9E9E;margin-bottom:3px">이벤트 유형</div>'
    +     '<select id="uEvType" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;font-size:13px;font-family:inherit;background:white">'
    +       '<option value="">-- 기록 안 함 --</option>'
    +       '<option value="파종">🌾 파종</option>'
    +       '<option value="정식">🌿 정식</option>'
    +       '<option value="발아">🌱 발아</option>'
    +       '<option value="개화">🌸 개화</option>'
    +       '<option value="착과">🍎 착과</option>'
    +       '<option value="수확">🎉 수확</option>'
    +       '<option value="순치기">✂️ 순치기</option>'
    +       '<option value="기타">📝 기타</option>'
    +     '</select>'
    +   '</div>'
    +   '<div>'
    +     '<div style="font-size:10px;color:#9E9E9E;margin-bottom:3px">이벤트 날짜</div>'
    +     '<input type="date" id="uEvDate" value="'+today+'" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;font-size:13px;font-family:inherit;box-sizing:border-box">'
    +   '</div>'
    + '</div>'
    + '<div style="margin-bottom:16px">'
    +   '<div style="font-size:10px;color:#9E9E9E;margin-bottom:3px">이벤트 메모</div>'
    +   '<input type="text" id="uEvNote" placeholder="예: 12절 착과, 1번 고랑" style="width:100%;padding:9px;border-radius:8px;border:1.5px solid #E0E0E0;font-size:13px;font-family:inherit;box-sizing:border-box">'
    + '</div>'

    // ── 저장 버튼 ──
    + '<button onclick="saveUnifiedAdd()" style="width:100%;padding:14px;background:#1B5E20;color:white;border:none;border-radius:10px;font-size:15px;font-weight:700;cursor:pointer;font-family:inherit">✅ 저장</button>'
    + '</div></div>';

  document.body.appendChild(modal);

  // 기존 작물 선택된 경우 날짜 섹션 숨김
  if (existingPlantId) {
    unifiedSyncExisting();
  }
}

function unifiedSyncExisting() {
  var sel = document.getElementById('uExistingPlant');
  var newCrop = document.getElementById('uNewCrop');
  var dateSec = document.getElementById('uDateSection');
  var info = document.getElementById('uSelectedInfo');
  if (!sel) return;
  if (sel.value) {
    // 기존 작물 선택 → 새 작물 선택 초기화, 날짜 섹션 숨김
    if (newCrop) newCrop.value = '';
    if (dateSec) dateSec.style.display = 'none';
    var p = plants.find(function(x){ return x.id === sel.value; });
    if (p && info) {
      info.style.display = 'block';
      info.textContent = p.emoji+' '+p.name+' · 심은날 '+p.dateStr+' · '+Math.max(0,Math.round((REAL_TODAY-new Date(p.dateStr+'T00:00:00'))/86400000))+'일째';
    }
  } else {
    if (dateSec) dateSec.style.display = 'block';
    if (info) info.style.display = 'none';
  }
}

function unifiedSyncNew() {
  var sel = document.getElementById('uNewCrop');
  var exSel = document.getElementById('uExistingPlant');
  var customRow = document.getElementById('uCustomRow');
  var dateSec = document.getElementById('uDateSection');
  var info = document.getElementById('uSelectedInfo');
  if (!sel) return;
  if (sel.value) {
    if (exSel) exSel.value = '';  // 기존 작물 선택 초기화
    if (dateSec) dateSec.style.display = 'block';
    if (info) info.style.display = 'none';
    if (sel.value === '직접입력|✏️|직접입력|120|0|60') {
      if (customRow) customRow.style.display = 'block';
    } else {
      if (customRow) customRow.style.display = 'none';
    }
  }
}

function saveUnifiedAdd() {
  var exSel    = document.getElementById('uExistingPlant');
  var newCrop  = document.getElementById('uNewCrop');
  var uDate    = (document.getElementById('uDate')||{}).value || toYMD(REAL_TODAY);
  var uNote    = ((document.getElementById('uNote')||{}).value||'').trim();
  var evType   = (document.getElementById('uEvType')||{}).value || '';
  var evDate   = (document.getElementById('uEvDate')||{}).value || uDate;
  var evNote   = ((document.getElementById('uEvNote')||{}).value||'').trim();

  var targetPlant = null;

  if (exSel && exSel.value) {
    // ── 기존 작물에 이벤트만 추가 ──
    targetPlant = plants.find(function(x){ return x.id === exSel.value; });
    if (!targetPlant) { showToast('⚠ 작물을 찾을 수 없습니다'); return; }
    if (!evType) { showToast('⚠ 이벤트 유형을 선택하세요'); return; }
  } else if (newCrop && newCrop.value) {
    // ── 새 작물 등록 ──
    var parts = newCrop.value.split('|');
    var name, emoji, loc, totalDays, pinchDay, fruitDay;
    if (parts[0] === '직접입력') {
      name = ((document.getElementById('uCustomName')||{}).value||'').trim() || '작물';
      emoji = '🌱'; loc = '직접입력';
      totalDays = 120; pinchDay = 0; fruitDay = 60;
    } else {
      name = parts[0]; emoji = parts[1]; loc = parts[2];
      totalDays = parseInt(parts[3])||120;
      pinchDay  = parseInt(parts[4])||0;
      fruitDay  = parseInt(parts[5])||0;
    }
    if (!uDate) { showToast('⚠ 심은 날짜를 선택하세요'); return; }
    var newId = Date.now().toString();
    targetPlant = { id:newId, name:name, emoji:emoji, loc:loc, dateStr:uDate,
                    totalDays:totalDays, pinchDay:pinchDay, fruitDay:fruitDay,
                    note:uNote, events:[], updatedAt:new Date().toISOString() };
    plants.push(targetPlant);
    savePlantsAll();
    showToast('🌱 '+name+' 추가됨');
  } else {
    showToast('⚠ 작물을 선택하거나 새 작물을 선택하세요'); return;
  }

  // ── 이벤트 기록 (선택) ──
  if (evType && targetPlant) {
    if (!Array.isArray(targetPlant.events)) targetPlant.events = [];
    var daysFrom = 0;
    try {
      var d1=new Date(targetPlant.dateStr+'T00:00:00'), d2=new Date(evDate+'T00:00:00');
      daysFrom = Math.max(0, Math.round((d2-d1)/86400000));
    } catch(e){}
    targetPlant.events.push({ id:Date.now().toString(), type:evType, date:evDate, note:evNote, daysFrom:daysFrom });
    targetPlant.updatedAt = new Date().toISOString();
    savePlantsAll();
    saveGrowRecord(targetPlant.name, evType, evDate, evNote);
    return; // saveGrowRecord 내부에서 renderGrow 호출됨
  }

  var m = document.getElementById('unifiedAddModal'); if (m) m.remove();
  renderGrow();
}

// ══════════════════════════════════════════════════════════
// ══════════════════════════════════════════════════════════

// 백업 대상 전체 데이터 수집
function collectAllData() {
  return {
    version: '2.0',
    exportDate: toYMD(REAL_TODAY),
    exportTime: new Date().toLocaleString('ko-KR'),
    // 생육 관련
    plants:         JSON.parse(localStorage.getItem('plants')         || '[]'),
    growRecords:    JSON.parse(localStorage.getItem('growRecords')    || '[]'),
    // 기록장 · 완료작업
    workLog:        JSON.parse(localStorage.getItem('workLog')        || '[]'),
    checkedTasks:   JSON.parse(localStorage.getItem('checkedTasks')   || '{}'),
    // 농자재
    supplies:       JSON.parse(localStorage.getItem('mySupplies')     || '[]'),
    // 위치 변경
    locationChanges:JSON.parse(localStorage.getItem('locationChanges')|| '{}'),
    // 이랑현황 (plantsDB → localStorage 캐시)
    plantsDB:       JSON.parse(localStorage.getItem('plantsDB_cache') || '[]'),
    // 설정
    growStorageMode:localStorage.getItem('growStorageMode') || 'local',
  };
}

// 📥 전체 백업 저장 (JSON 파일)
function exportFullBackup() {
  var data = collectAllData();
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob(['\uFEFF' + json], { type: 'application/json;charset=utf-8' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href   = url;
  a.download = '과수원앱_전체백업_' + toYMD(REAL_TODAY) + '.json';
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
  var st = document.getElementById('shareStatus');
  if (st) st.textContent = '✅ 전체 백업 저장 완료 — ' + new Date().toLocaleTimeString();
  showToast('📥 전체 백업 저장됨');
}

// 📤 백업 파일 복원
function importFullBackup(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var text = e.target.result;
      if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
      var data = JSON.parse(text);

      if (!data.version && !data.plants && !data.workLog) {
        showToast('⚠ 올바른 백업 파일이 아닙니다');
        return;
      }

      if (!confirm('백업 파일(' + (data.exportDate||'?') + ')을 복원할까요?\n현재 데이터와 병합됩니다.')) return;

      var restored = 0;

      // plants (생육일수 추적)
      if (Array.isArray(data.plants) && data.plants.length) {
        var localIds = new Set(plants.map(function(p){ return p.id; }));
        data.plants.forEach(function(p) {
          if (!Array.isArray(p.events)) p.events = [];
          if (!localIds.has(p.id)) { plants.push(p); restored++; }
          else {
            var li = plants.findIndex(function(x){ return x.id === p.id; });
            if (li >= 0 && (p.updatedAt||'') > (plants[li].updatedAt||'')) { plants.splice(li,1,p); restored++; }
          }
        });
        savePlantsLocal();
      }

      // growRecords (생육기록)
      if (Array.isArray(data.growRecords) && data.growRecords.length) {
        var rids = new Set(growRecords.map(function(r){ return r.id; }));
        data.growRecords.forEach(function(r) {
          if (!rids.has(r.id)) { growRecords.unshift(r); restored++; }
        });
        growRecords.sort(function(a,b){ return b.id > a.id ? 1 : -1; });
        localStorage.setItem('growRecords', JSON.stringify(growRecords));
        try { migrateGrowRecords(); } catch(e2){}
      }

      // workLog (기록장)
      if (Array.isArray(data.workLog) && data.workLog.length) {
        var wids = new Set(workLog.map(function(e){ return String(e.id); }));
        data.workLog.forEach(function(e) {
          if (!wids.has(String(e.id))) { workLog.unshift(e); restored++; }
        });
        workLog.sort(function(a,b){ return (b.id||0)-(a.id||0); });
        localStorage.setItem('workLog', JSON.stringify(workLog));
      }

      // checkedTasks (완료작업)
      if (data.checkedTasks && typeof data.checkedTasks === 'object') {
        Object.assign(checkedTasks, data.checkedTasks);
        localStorage.setItem('checkedTasks', JSON.stringify(checkedTasks));
        restored++;
      }

      // mySupplies (농자재)
      if (Array.isArray(data.supplies) && data.supplies.length) {
        var sids = new Set(mySupplies.map(function(s){ return s.id; }));
        data.supplies.forEach(function(s) {
          if (!sids.has(s.id)) { mySupplies.push(s); restored++; }
        });
        localStorage.setItem('mySupplies', JSON.stringify(mySupplies));
      }

      // locationChanges (위치변경)
      if (data.locationChanges && typeof data.locationChanges === 'object') {
        Object.assign(locationChanges, data.locationChanges);
        localStorage.setItem('locationChanges', JSON.stringify(locationChanges));
        restored++;
      }

      // 설정 복원
      if (data.growStorageMode) {
        growStorageMode = data.growStorageMode;
        localStorage.setItem('growStorageMode', growStorageMode);
      }

      // 화면 갱신
      try { renderGrow(); } catch(e2){}
      try { renderGrowRecords(); } catch(e2){}
      try { renderWorkLog(); } catch(e2){}
      try { renderSupplyList(); } catch(e2){}
      try { renderAll(); } catch(e2){}

      var st = document.getElementById('shareStatus');
      if (st) st.textContent = '✅ 복원 완료 — ' + restored + '건 반영';
      showToast('✅ 백업 복원 완료 — ' + restored + '건 반영됨');
    } catch(err) {
      showToast('❌ 복원 오류: ' + err.message);
    }
    event.target.value = '';
  };
  reader.readAsText(file, 'UTF-8');
}
async function fullFirebaseSync() {
  var st = document.getElementById('shareStatus');
  if (st) st.textContent = '⏳ 동기화 중...';
}
async function fullFirebaseUpload() {
  // Google Sheets 백업으로 전환
  backupToFirebase();
}

function csvCell(v) {
  var s = (v === null || v === undefined) ? '' : String(v);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return '"' + s.replace(/"/g, '""') + '"';
  }
  return s;
}
function csvRow(arr) { return arr.map(csvCell).join(',') + '\r\n'; }
function csvDownload(filename, content) {
  var bom  = '\uFEFF';
  var blob = new Blob([bom + content], { type: 'text/csv;charset=utf-8' });
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = filename;
  document.body.appendChild(a); a.click();
  document.body.removeChild(a); URL.revokeObjectURL(url);
}
function setSt(msg) {
  var el = document.getElementById('shareStatus');
  if (el) el.textContent = msg;
}

// ── CSV 내보내기 디스패처 ────────────────────────────────
function exportCSV(type) {
  var dt = toYMD(REAL_TODAY);
  switch(type) {
    case 'plants':      exportCSVPlants(); break;
    case 'growRecords': exportCSVGrowRecords(); break;
    case 'workLog':     exportCSVWorkLog(); break;
    case 'supplies':    exportCSVSupplies(); break;
    case 'plantsDB':    exportIrangCSV(); break;  // 이미 존재하는 함수 재사용
    case 'all':         exportAllCSVSeparate(); break;
    default: showToast('⚠ 알 수 없는 타입'); break;
  }
}

// ── 생육일수 추적 CSV ────────────────────────────────────
function exportCSVPlants() {
  var header = ['id','작물명','이모지','위치','심은날짜','총재배일수','순치기일','착과일','메모','수정일시'];
  var rows   = header.join(',') + '\r\n';
  plants.forEach(function(p) {
    rows += csvRow([p.id, p.name, p.emoji||'🌱', p.loc||'', p.dateStr||'',
                    p.totalDays||120, p.pinchDay||0, p.fruitDay||0,
                    p.note||'', p.updatedAt||'']);
  });
  csvDownload('생육일수추적_' + toYMD(REAL_TODAY) + '.csv', rows);
  setSt('✅ 생육일수 ' + plants.length + '건 저장됨');
  showToast('🌿 생육일수 CSV 저장');
}

// ── 생육기록 CSV ─────────────────────────────────────────
function exportCSVGrowRecords() {
  var header = ['id','작물명','이벤트유형','날짜','경과일','메모'];
  var rows   = header.join(',') + '\r\n';
  growRecords.forEach(function(r) {
    rows += csvRow([r.id, r.plantName||'', r.eventType||'', r.date||'', r.daysFrom||0, r.note||'']);
  });
  csvDownload('생육기록_' + toYMD(REAL_TODAY) + '.csv', rows);
  setSt('✅ 생육기록 ' + growRecords.length + '건 저장됨');
  showToast('📝 생육기록 CSV 저장');
}

// ── 기록장 CSV ───────────────────────────────────────────
function exportCSVWorkLog() {
  var header = ['id','날짜','시간','작업명','상세','위치','분류'];
  var rows   = header.join(',') + '\r\n';
  workLog.forEach(function(e) {
    rows += csvRow([e.id, e.date||'', e.time||'', e.name||'', e.detail||'', e.loc||'', e.type||'']);
  });
  csvDownload('기록장_' + toYMD(REAL_TODAY) + '.csv', rows);
  setSt('✅ 기록장 ' + workLog.length + '건 저장됨');
  showToast('📋 기록장 CSV 저장');
}

// ── 농자재 CSV ───────────────────────────────────────────
function exportCSVSupplies() {
  var header = ['id','종류','제품명','성분','보유량','구입시기','적용월','적용작물','등록일'];
  var rows   = header.join(',') + '\r\n';
  mySupplies.forEach(function(s) {
    var crops = Array.isArray(s.crops) ? s.crops.join('|') : (s.crops||'');
    rows += csvRow([s.id, s.type||'', s.name||'', s.ingredient||'', s.amount||'',
                    s.purchaseTime||'', s.months||'', crops, s.addedDate||'']);
  });
  csvDownload('농자재_' + toYMD(REAL_TODAY) + '.csv', rows);
  setSt('✅ 농자재 ' + mySupplies.length + '건 저장됨');
  showToast('🧪 농자재 CSV 저장');
}

// ── 전체 개별 CSV 저장 (순차 다운로드) ──────────────────
function exportAllCSVSeparate() {
  var dt = toYMD(REAL_TODAY);
  // 각 파일 순차 다운로드
  setTimeout(function(){ exportCSVPlants(); }, 0);
  setTimeout(function(){ exportCSVGrowRecords(); }, 400);
  setTimeout(function(){ exportCSVWorkLog(); }, 800);
  setTimeout(function(){ exportCSVSupplies(); }, 1200);
  setTimeout(function(){ exportIrangCSV(); }, 1600);
  setTimeout(function(){ setSt('✅ 전체 5개 CSV 파일 저장 완료'); showToast('📦 전체 CSV 5개 저장 완료'); }, 2000);
}

// (구버전) 개별 5파일 저장 — 통합 CSV(exportAllCSV)로 대체됨
function exportAllCSVSeparateLegacy() { exportAllCSVSeparate(); }

// ── CSV 한 줄 파서 ────────────────────────────────────────
function parseCSVLine(line) {
  var result=[], inQ=false, cur='';
  for (var i=0; i<line.length; i++) {
    var ch = line[i];
    if (ch==='"') {
      if (inQ && line[i+1]==='"') { cur+='"'; i++; }
      else inQ=!inQ;
    } else if (ch===',' && !inQ) { result.push(cur); cur=''; }
    else cur+=ch;
  }
  result.push(cur);
  return result;
}
function parseCSV(text) {
  if (text.charCodeAt(0)===0xFEFF) text=text.slice(1);
  var lines = text.split(/\r?\n/).filter(function(l){ return l.trim(); });
  if (lines.length<2) return { header:[], rows:[] };
  var header = parseCSVLine(lines[0]);
  var rows = lines.slice(1).map(function(l){ return parseCSVLine(l); });
  return { header: header, rows: rows };
}
function idx(header, name) { return header.indexOf(name); }

// ── CSV 복원 디스패처 ─────────────────────────────────────
function importIndividualCSVFiles(event) {
  var files = Array.from(event.target.files);
  if (!files.length) return;
  var total = { added:0, updated:0 };
  var done  = 0;
  files.forEach(function(file) {
    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var text = e.target.result;
        var fname = file.name.toLowerCase();
        var result;
        if      (fname.includes('생육일수') || fname.includes('plants'))       result = importCSVPlants(text);
        else if (fname.includes('생육기록') || fname.includes('growrecord'))   result = importCSVGrowRecords(text);
        else if (fname.includes('기록장')   || fname.includes('worklog'))      result = importCSVWorkLog(text);
        else if (fname.includes('농자재')   || fname.includes('suppl'))        result = importCSVSupplies(text);
        else if (fname.includes('이랑')     || fname.includes('plantsdb'))     result = importIrangCSV2(text);
        else { showToast('⚠ 파일명으로 종류를 인식할 수 없습니다: ' + file.name); return; }
        total.added   += (result.added   || 0);
        total.updated += (result.updated || 0);
      } catch(e2) { showToast('❌ ' + file.name + ' 오류: ' + e2.message); }
      done++;
      if (done === files.length) {
        renderGrow(); renderGrowRecords(); renderWorkLog(); renderSupplyList();
        try { renderBackupSummary(); } catch(e3){}
        setSt('✅ ' + done + '개 파일 복원 — 신규 ' + total.added + '건, 업데이트 ' + total.updated + '건');
        showToast('✅ CSV 복원 완료 — ' + total.added + '+' + total.updated + '건');
      }
    };
    reader.readAsText(file, 'UTF-8');
  });
  event.target.value = '';
}

// ── 생육일수 CSV 복원 ────────────────────────────────────
function importCSVPlants(text) {
  var csv = parseCSV(text);
  var h   = csv.header, added=0, updated=0;
  csv.rows.forEach(function(row) {
    var id   = row[idx(h,'id')]||'';
    var name = (row[idx(h,'작물명')]||'').trim();
    if (!name) return;
    if (!id) id = 'csv_' + name.replace(/\s/g,'_') + '_' + Date.now();
    var obj = {
      id:        id,
      name:      name,
      emoji:     row[idx(h,'이모지')] || '🌱',
      loc:       row[idx(h,'위치')]   || '',
      dateStr:   row[idx(h,'심은날짜')]|| toYMD(REAL_TODAY),
      totalDays: parseInt(row[idx(h,'총재배일수')])||120,
      pinchDay:  parseInt(row[idx(h,'순치기일')])||0,
      fruitDay:  parseInt(row[idx(h,'착과일')])||0,
      note:      row[idx(h,'메모')]   || '',
      events:    [],
      updatedAt: row[idx(h,'수정일시')] || new Date().toISOString(),
      fromCSV:   true,
    };
    var li = plants.findIndex(function(p){ return p.id===id || p.name===name; });
    if (li<0) { plants.push(obj); added++; }
    else { obj.events = plants[li].events||[]; plants.splice(li,1,obj); updated++; }
  });
  savePlantsAll();
  return { added:added, updated:updated };
}

// ── 생육기록 CSV 복원 ────────────────────────────────────
function importCSVGrowRecords(text) {
  var csv = parseCSV(text);
  var h   = csv.header, added=0;
  var rids = new Set(growRecords.map(function(r){ return r.id; }));
  csv.rows.forEach(function(row) {
    var id = (row[idx(h,'id')]||'').trim();
    if (!id || rids.has(id)) return;
    var r = {
      id:        id,
      plantName: (row[idx(h,'작물명')]||'').trim(),
      eventType: (row[idx(h,'이벤트유형')]||'기타').trim(),
      date:      (row[idx(h,'날짜')]||toYMD(REAL_TODAY)).trim(),
      daysFrom:  parseInt(row[idx(h,'경과일')])||0,
      note:      (row[idx(h,'메모')]||'').trim(),
    };
    if (!r.plantName) return;
    growRecords.unshift(r);
    rids.add(id);
    added++;
  });
  growRecords.sort(function(a,b){ return b.id>a.id?1:-1; });
  localStorage.setItem('growRecords', JSON.stringify(growRecords));
  try { migrateGrowRecords(); } catch(e){}
  return { added:added, updated:0 };
}

// ── 기록장 CSV 복원 ──────────────────────────────────────
function importCSVWorkLog(text) {
  var csv = parseCSV(text);
  var h   = csv.header, added=0;
  var wids = new Set(workLog.map(function(e){ return String(e.id); }));
  csv.rows.forEach(function(row) {
    var id = (row[idx(h,'id')]||'').trim();
    if (!id || wids.has(id)) return;
    var e = {
      id:     id,
      date:   (row[idx(h,'날짜')]||'').trim(),
      time:   (row[idx(h,'시간')]||'').trim(),
      name:   (row[idx(h,'작업명')]||'').trim(),
      detail: (row[idx(h,'상세')]||'').trim(),
      loc:    (row[idx(h,'위치')]||'').trim(),
      type:   (row[idx(h,'분류')]||'일반').trim(),
    };
    if (!e.name) return;
    workLog.unshift(e);
    wids.add(id);
    added++;
  });
  workLog.sort(function(a,b){ return (b.id||0)-(a.id||0); });
  localStorage.setItem('workLog', JSON.stringify(workLog));
  return { added:added, updated:0 };
}

// ── 농자재 CSV 복원 ──────────────────────────────────────
function importCSVSupplies(text) {
  var csv = parseCSV(text);
  var h   = csv.header, added=0, updated=0;
  csv.rows.forEach(function(row) {
    var id   = (row[idx(h,'id')]||'').trim();
    var name = (row[idx(h,'제품명')]||'').trim();
    if (!name) return;
    if (!id) id = Date.now().toString();
    var crops = (row[idx(h,'적용작물')]||'').trim();
    var cropsArr = crops ? crops.split('|') : [];
    var obj = {
      id:           id,
      type:         (row[idx(h,'종류')]||'기타').trim(),
      name:         name,
      ingredient:   (row[idx(h,'성분')]||'').trim(),
      amount:       (row[idx(h,'보유량')]||'').trim(),
      purchaseTime: (row[idx(h,'구입시기')]||'보유중').trim(),
      months:       (row[idx(h,'적용월')]||'').trim(),
      crops:        cropsArr,
      addedDate:    (row[idx(h,'등록일')]||toYMD(REAL_TODAY)).trim(),
    };
    var li = mySupplies.findIndex(function(s){ return s.id===id || s.name===name; });
    if (li<0) { mySupplies.push(obj); added++; }
    else { mySupplies.splice(li,1,obj); updated++; }
  });
  localStorage.setItem('mySupplies', JSON.stringify(mySupplies));
  return { added:added, updated:updated };
}

// ── 이랑현황 CSV 복원 (importIrangCSV 보완) ──────────────
function importIrangCSV2(text) {
  var result = { added:0, updated:0 };
  try {
    var csv = parseCSV(text);
    var h   = csv.header;
    var src = (typeof plantsDB!=='undefined'&&plantsDB.length>0)?plantsDB:
              (typeof allPlants!=='undefined'?allPlants:[]);
    csv.rows.forEach(function(row) {
      var name = (row[idx(h,'식물명')]||'').trim(); if (!name) return;
      var ex = src.find(function(p){ return p.name===name; });
      var obj = {
        irang:  (row[idx(h,'이랑')]||'').trim(),
        zone:   (row[idx(h,'구역')]||'기타').trim(),
        emoji:  (row[idx(h,'이모지')]||'🌱').trim(),
        cat:    (row[idx(h,'분류')]||'채소').trim(),
        qty:    parseInt(row[idx(h,'수량')])||1,
        spot:   (row[idx(h,'위치')]||'').trim(),
        note:   (row[idx(h,'메모')]||'').trim(),
        status: (row[idx(h,'상태')]||'active').trim(),
      };
      if (ex) { Object.assign(ex, obj); result.updated++; }
      else {
        obj.id = 'csv_'+Date.now()+'_'+Math.random().toString(36).slice(2,6);
        obj.name = name;
        src.push(obj); result.added++;
      }
    });
    if (typeof savePlantsDB==='function') savePlantsDB();
    renderIrang();
  } catch(e2){ console.warn('importIrangCSV2:', e2); }
  return result;
}

// ── 전정가이드 이미지 로드 오류 처리 ─────────────────────
function onPruningImgError(img) {
  img.onerror = null;
  img.src = 'data:image/svg+xml,' + encodeURIComponent(
    '<div id="svg-simple" class="svg-placeholder" style="display:block;width:100%;"></div>'
  );
}

// ── 전정가이드 이미지 지연 로드 ────────────────────────
var _pruningImgsLoaded = false;
function loadPruningImages() {
  if (_pruningImgsLoaded) return;
  var imgs = document.querySelectorAll('#sec-pruning img[data-src]');
  if (!imgs.length) return;
  imgs.forEach(function(img) {
    var src = img.getAttribute('data-src');
    if (!src) return;
    var newImg = new Image();
    newImg.onload = function() { img.src = src; };
    newImg.onerror = function() {
      img.style.background = '#F0F0F0';
      img.style.minHeight = '60px';
    };
    newImg.src = src;
  });
  _pruningImgsLoaded = true;
}

// ══════════════════════════════════════════════════════════
// TTS (Web Speech API 음성 읽기)
// ══════════════════════════════════════════════════════════
var _tts = {
  synth:    window.speechSynthesis || null,
  utterances: [],
  idx:      0,
  rate:     1.0,
  paused:   false,
  playing:  false,
};

// 탭별 읽을 텍스트 수집
function ttsGetTexts() {
  // 현재 활성 섹션 찾기
  var activeSec = document.querySelector('.section.active');
  if (!activeSec) return ['읽을 내용이 없습니다.'];

  var texts = [];
  var secId = activeSec.id;

  // 섹션 제목
  var title = activeSec.querySelector('.section-title, .card-title, h2, h3');
  if (title) texts.push(title.innerText.replace(/[🌿📋🌱🛒📅🌡️🐛✂️📷📒💾🔥]/g,'').trim());

  // 섹션별 맞춤 수집
  if (secId === 'sec-today') {
    // 오늘 작업
    var tasks = activeSec.querySelectorAll('.task-item, .today-task, [class*="task"]');
    tasks.forEach(function(t) {
      var txt = t.innerText.trim();
      if (txt && txt.length > 2) texts.push(txt);
    });
    // 작업 카드들
    var cards = activeSec.querySelectorAll('.card');
    cards.forEach(function(c) {
      var h = c.querySelector('.card-title');
      var b = c.querySelector('.card-body');
      if (h) texts.push(h.innerText.trim());
      if (b) {
        var items = b.querySelectorAll('li, .item, div[class*="item"], div[class*="task"]');
        if (items.length) {
          items.forEach(function(it) {
            var t2 = it.innerText.trim();
            if (t2 && t2.length > 3) texts.push(t2);
          });
        }
      }
    });
  } else if (secId === 'sec-pest') {
    // 병해충·시비
    var pCards = activeSec.querySelectorAll('.card');
    pCards.forEach(function(c) {
      var ht = c.querySelector('.card-title');
      if (ht) texts.push(ht.innerText.trim());
      var rows = c.querySelectorAll('tr, .pest-item, li');
      rows.forEach(function(r) {
        var t3 = r.innerText.trim();
        if (t3 && t3.length > 3) texts.push(t3);
      });
    });
  } else if (secId === 'sec-monthly') {
    // 일정·D-day
    var ddays = activeSec.querySelectorAll('.dday-item, [class*="dday"], [class*="schedule"]');
    if (!ddays.length) {
      // 텍스트 직접 추출
      var allText = activeSec.innerText;
      var lines = allText.split('\n').filter(function(l) {
        return l.trim().length > 4 && !l.includes('---');
      });
      lines.slice(0, 30).forEach(function(l) { texts.push(l.trim()); });
    } else {
      ddays.forEach(function(d) {
        var t4 = d.innerText.trim();
        if (t4) texts.push(t4);
      });
    }
  } else if (secId === 'sec-grow') {
    // 생육 관리
    var growItems = activeSec.querySelectorAll('[style*="border-radius:10px"]');
    growItems.forEach(function(g) {
      var name = g.querySelector('[style*="font-weight:700"][style*="color:white"]');
      var date = g.querySelector('[style*="font-size:22px"]');
      var harvest = g.querySelector('[style*="harvestBadge"], span[style*="color:white"]');
      if (name) {
        var txt = name.innerText.trim();
        if (date) txt += ', ' + date.innerText.trim() + '일째';
        if (harvest) txt += ', ' + harvest.innerText.replace(/[🌾✂️]/g,'').trim();
        texts.push(txt);
      }
    });
    if (!texts.length || texts.length < 2) {
      // 폴백: 전체 텍스트
      var gt = activeSec.innerText;
      var glines = gt.split('\n').filter(function(l){ return l.trim().length > 5; });
      glines.slice(0,20).forEach(function(l){ texts.push(l.trim()); });
    }
  } else if (secId === 'sec-wxlive') {
    // 날씨
    var wxText = activeSec.innerText;
    var wxLines = wxText.split('\n').filter(function(l){
      return l.trim().length > 3 && !l.match(/^\s*[-_]+\s*$/);
    });
    wxLines.slice(0,20).forEach(function(l){ texts.push(l.trim()); });
  } else if (secId === 'sec-pruning') {
    // 전정 가이드
    var pSections = activeSec.querySelectorAll('[class*="guide"], .guide-item, h3, h4, p');
    if (pSections.length) {
      pSections.forEach(function(p) {
        var t5 = p.innerText.trim();
        if (t5 && t5.length > 5 && !t5.match(/^[0-9]+$/)) texts.push(t5);
      });
    } else {
      var pAll = activeSec.innerText.split('\n').filter(function(l){
        return l.trim().length > 5;
      });
      pAll.slice(0,30).forEach(function(l){ texts.push(l.trim()); });
    }
  } else if (secId === 'sec-sheet') {
    // 기록장
    var logItems = activeSec.querySelectorAll('[class*="log-item"], [class*="work-item"]');
    if (logItems.length) {
      logItems.forEach(function(li) {
        texts.push(li.innerText.trim().replace(/\n+/g,' '));
      });
    } else {
      var shAll = activeSec.innerText.split('\n').filter(function(l){
        return l.trim().length > 5;
      });
      shAll.slice(0,25).forEach(function(l){ texts.push(l.trim()); });
    }
  } else {
    // 범용: 카드 제목 + 내용 수집
    var allCards = activeSec.querySelectorAll('.card, [class*="card"]');
    if (allCards.length) {
      allCards.forEach(function(c) {
        var ct = c.querySelector('.card-title, [class*="title"]');
        if (ct) texts.push(ct.innerText.trim());
        var cb = c.querySelector('.card-body, [class*="body"]');
        if (cb) {
          var lines2 = cb.innerText.split('\n').filter(function(l){
            return l.trim().length > 3;
          });
          lines2.slice(0,10).forEach(function(l){ texts.push(l.trim()); });
        }
      });
    }
    if (texts.length < 2) {
      // 최후 폴백: 전체 텍스트
      var fallAll = activeSec.innerText.split('\n').filter(function(l){
        return l.trim().length > 4;
      });
      fallAll.slice(0,30).forEach(function(l){ texts.push(l.trim()); });
    }
  }

  // 중복·빈 항목 제거
  var seen = {};
  return texts.filter(function(t) {
    var k = t.slice(0,30);
    if (seen[k] || !t.trim()) return false;
    seen[k] = 1; return true;
  });
}

function ttsPlay() {
  if (!_tts.synth) {
    showToast('⚠ 이 브라우저는 음성 읽기를 지원하지 않습니다');
    return;
  }
  // 재생 중이면 처음부터
  ttsStop();

  var texts = ttsGetTexts();
  if (!texts.length) { showToast('읽을 내용이 없습니다'); return; }

  _tts.utterances = texts;
  _tts.idx = 0;
  _tts.playing = true;
  _tts.paused = false;
  ttsUpdateUI();
  ttsSpeakNext();
}

function ttsSpeakNext() {
  if (!_tts.playing || _tts.idx >= _tts.utterances.length) {
    if (_tts.idx >= _tts.utterances.length) {
      ttsStop();
      showToast('✅ 읽기 완료');
    }
    return;
  }
  var text = _tts.utterances[_tts.idx];
  var utter = new SpeechSynthesisUtterance(text);
  utter.lang = 'ko-KR';
  utter.rate = _tts.rate;
  utter.pitch = 1.0;
  utter.volume = 1.0;

  // 한국어 목소리 선택
  var voices = _tts.synth.getVoices();
  var koVoice = voices.find(function(v){ return v.lang === 'ko-KR'; })
             || voices.find(function(v){ return v.lang.startsWith('ko'); });
  if (koVoice) utter.voice = koVoice;

  utter.onstart = function() {
    var st = document.getElementById('ttsStatus');
    if (st) st.textContent = (_tts.idx+1) + '/' + _tts.utterances.length + '  ' + text.slice(0,30) + (text.length>30?'…':'');
    var pf = document.getElementById('ttsProgressFill');
    if (pf) pf.style.width = ((_tts.idx+1)/_tts.utterances.length*100) + '%';
  };
  utter.onend = function() {
    if (!_tts.playing) return;
    _tts.idx++;
    ttsSpeakNext();
  };
  utter.onerror = function() {
    _tts.idx++;
    ttsSpeakNext();
  };
  _tts.synth.speak(utter);
}

function ttsPause() {
  if (!_tts.synth) return;
  if (_tts.paused) {
    _tts.synth.resume();
    _tts.paused = false;
    document.getElementById('ttsPauseBtn').textContent = '⏸ 일시정지';
    showToast('▶ 계속 읽습니다');
  } else {
    _tts.synth.pause();
    _tts.paused = true;
    document.getElementById('ttsPauseBtn').textContent = '▶ 계속';
    showToast('⏸ 일시정지');
  }
}

function ttsStop() {
  if (_tts.synth) _tts.synth.cancel();
  _tts.playing = false;
  _tts.paused  = false;
  _tts.idx     = 0;
  ttsUpdateUI();
  var st = document.getElementById('ttsStatus');
  if (st) st.textContent = '현재 탭의 내용을 읽어드립니다';
  var pf = document.getElementById('ttsProgressFill');
  if (pf) pf.style.width = '0%';
}

function ttsChangeSpeed(val) {
  _tts.rate = parseFloat(val);
  if (_tts.playing) {
    // 재생 중이면 현재 위치에서 속도 변경
    var curIdx = _tts.idx;
    ttsStop();
    _tts.idx = Math.max(0, curIdx - 1);
    _tts.playing = true;
    _tts.paused = false;
    ttsUpdateUI();
    ttsSpeakNext();
  }
  var labels = {'0.7':'🐢 느리게','1.0':'🚶 보통','1.3':'🏃 빠르게','1.6':'⚡ 매우빠름'};
  showToast('음성 속도: ' + (labels[val] || val));
}

function ttsUpdateUI() {
  var playBtn  = document.getElementById('ttsPlayBtn');
  var pauseBtn = document.getElementById('ttsPauseBtn');
  var stopBtn  = document.getElementById('ttsStopBtn');
  if (!playBtn) return;
  if (_tts.playing) {
    playBtn.style.display  = 'none';
    pauseBtn.style.display = 'flex';
    stopBtn.style.display  = 'flex';
  } else {
    playBtn.style.display  = 'flex';
    pauseBtn.style.display = 'none';
    stopBtn.style.display  = 'none';
  }
}

// 탭 전환 시 TTS 자동 정지 - showTab 래핑
(function() {
  var _orig = typeof showTab === 'function' ? showTab : null;
  if (_orig) {
    showTab = function(id) {
      // TTS 자동 정지
      try {
        if (typeof _tts !== 'undefined' && _tts.playing) {
          if (typeof ttsStop === 'function') ttsStop();
        }
      } catch(e) {}
      return _orig.call(this, id);
    };
  }
})();

// ══════════════════════════════════════════════════════════
// 🗂️ 통합 백업·복원 시스템 (백업·복원 메뉴 전용)
//   - 내 폰: 수시 저장(자동) + 스냅샷
//   - CSV  : 앱 밖 파일 보관·엑셀 편집
// ══════════════════════════════════════════════════════════

var BACKUP_DATA = [
  { key:'plants',          label:'🌿 생육일수',   menu:'생육 관리' },
  { key:'growRecords',     label:'📝 생육 기록',   menu:'생육 관리' },
  { key:'workLog',         label:'📒 작업 기록장', menu:'기록장' },
  { key:'mySupplies',      label:'🧪 농자재·구입', menu:'구입내역' },
  { key:'plantsDB',        label:'🌱 작물·이랑',   menu:'작물 관리' },
  { key:'locationChanges', label:'📍 위치변경',    menu:'작물 관리' },
  { key:'checkedTasks',    label:'✅ 작업체크',    menu:'오늘 작업' },
];

function _readStore(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch(e) { return null; }
}
function _countOf(v) {
  if (Array.isArray(v)) return v.length;
  if (v && typeof v === 'object') return Object.keys(v).length;
  return 0;
}

function renderBackupSummary() {
  var box = document.getElementById('backupDataSummary');
  if (!box) return;
  box.innerHTML = BACKUP_DATA.map(function(d){
    var n = _countOf(_readStore(d.key));
    return '<div style="display:flex;align-items:center;justify-content:space-between;'
      + 'background:#FAFAFA;border:1px solid #EEE;border-radius:8px;padding:8px 10px">'
      + '<span style="font-size:12px;color:#546E7A">'+d.label+'</span>'
      + '<span style="font-size:13px;font-weight:800;color:'+(n?'#1B5E20':'#BDBDBD')+'">'+n+'</span>'
      + '</div>';
  }).join('');
  
  // 영구 저장 상태
  var pEl = document.getElementById('persistState');
  if (pEl) {
    var ps = window._storagePersisted;
    if (ps === true) {
      pEl.textContent = '🔒 영구 저장 켜짐 — 앱을 지우기 전까지 안전하게 보관됩니다';
      pEl.style.background = '#E8F5E9'; pEl.style.color = '#1B5E20';
    } else if (ps === false) {
      pEl.innerHTML = '🔓 영구 저장이 꺼져 있습니다 — <u style="cursor:pointer" onclick="requestPersistentStorage().then(renderBackupSummary)">다시 요청</u> · 가끔 CSV로도 백업하세요';
      pEl.style.background = '#FFF3E0'; pEl.style.color = '#E65100';
    } else {
      pEl.textContent = '💾 이 기기에 저장됨 — 가끔 CSV·Google Sheets로도 백업하세요';
      pEl.style.background = '#F1F8E9'; pEl.style.color = '#33691E';
    }
  }
  // 저장 용량
  renderStorageUsage();
  renderPerMethodUsage();
}
function _coreDataBytes() {
  // 핵심 입력 데이터(스냅샷 제외)의 추정 용량
  var total = 0;
  try {
    BACKUP_DATA.forEach(function(d){
      var v = localStorage.getItem(d.key) || '';
      total += v.length * 2;
    });
  } catch(e) {}
  return total;
}

function renderPerMethodUsage() {
  var core = _coreDataBytes();
  var all  = _localStorageBytes();
  var coreStr = _fmtBytes(core);

  var p = document.getElementById('usagePhone');
  if (p) p.textContent = '💽 내 폰 사용량 ' + _fmtBytes(all) + ' (입력 데이터 ' + coreStr + ' 포함)';

  var c = document.getElementById('usageCSV');
  if (c) c.textContent = '📦 내보낼 데이터 약 ' + coreStr;

  
}

// 모든 용량 표시를 한 번에 갱신 (수치 불일치 방지)
function refreshAllUsage() {
  try { renderPerMethodUsage(); } catch(e){}
  try { renderStorageUsage(); } catch(e){}
  try { if (typeof renderBackupList === 'function') renderBackupList(); } catch(e){}
}

// ── 저장 용량 표시 ───────────────────────────────────────
function _fmtBytes(b) {
  if (b == null) return '-';
  if (b < 1024) return b + ' B';
  if (b < 1024*1024) return (b/1024).toFixed(1) + ' KB';
  if (b < 1024*1024*1024) return (b/(1024*1024)).toFixed(1) + ' MB';
  return (b/(1024*1024*1024)).toFixed(2) + ' GB';
}

// localStorage 실제 사용량(문자 수 → 바이트 추정, UTF-16 기준 2배 아님: 대략 byte length)
function _localStorageBytes() {
  var total = 0;
  try {
    for (var i = 0; i < localStorage.length; i++) {
      var k = localStorage.key(i);
      var v = localStorage.getItem(k) || '';
      total += (k.length + v.length) * 2; // UTF-16 대략치
    }
  } catch(e) {}
  return total;
}

// 저장 직후 안내용 — 이 앱이 사용 중인 용량 문자열
function _storageInfoStr() {
  try { return '저장 용량 ' + _fmtBytes(_localStorageBytes()); }
  catch(e) { return ''; }
}

async function renderStorageUsage() {
  var txt = document.getElementById('storageUsageText');
  var bar = document.getElementById('storageUsageBar');
  var det = document.getElementById('storageUsageDetail');
  if (!txt || !bar) return;

  // 기준: 이 앱이 실제 사용하는 localStorage 용량 (카드 수치와 동일하게 통일)
  var appBytes = _localStorageBytes();

  // 1) 먼저 동기적으로 사용량을 표시 (await로 인한 stale 방지)
  var assumedLimit = 5 * 1024 * 1024;
  var pct0 = Math.min(100, (appBytes/assumedLimit)*100);
  txt.textContent = _fmtBytes(appBytes);
  bar.style.width = (pct0 < 0.5 ? 0.5 : pct0) + '%';
  bar.style.background = pct0 > 90 ? '#E53935' : (pct0 > 70 ? '#FB8C00' : '#2E7D32');
  if (det) det.textContent = '이 앱이 사용 중인 저장 용량입니다';

  // 2) estimate로 기기 전체 할당량을 받아와 한도와 함께 다시 표시 (있으면)
  if (navigator.storage && navigator.storage.estimate) {
    try {
      var est = await navigator.storage.estimate();
      var quota = est.quota || 0;
      var originUsed = est.usage || 0;
      // 사용량은 항상 방금 계산한 appBytes로 통일 (카드와 일치)
      appBytes = _localStorageBytes();
      if (quota) {
        var pct = Math.min(100, (appBytes/quota)*100);
        txt.textContent = _fmtBytes(appBytes) + ' / ' + _fmtBytes(quota);
        bar.style.width = (pct < 0.5 ? 0.5 : pct) + '%';
        bar.style.background = pct > 90 ? '#E53935' : (pct > 70 ? '#FB8C00' : '#2E7D32');
        if (det) {
          det.textContent = '이 앱 데이터 ' + _fmtBytes(appBytes)
            + ' · 기기 저장 한도 ' + _fmtBytes(quota)
            + (originUsed ? ' (브라우저 전체 사용 ' + _fmtBytes(originUsed) + ')' : '');
        }
      }
    } catch(e) {}
  }
}

// ── ① 내 폰 — 스냅샷 ─────────────────────────────────────
function snapshotToPhone() {
  var snaps = _readStore('phoneSnapshots') || [];
  var data = {};
  BACKUP_DATA.forEach(function(d){ data[d.key] = _readStore(d.key); });
  var snap = {
    id: Date.now(),
    date: toYMD(REAL_TODAY),
    time: new Date().toTimeString().slice(0,5),
    counts: BACKUP_DATA.reduce(function(o,d){ o[d.key]=_countOf(data[d.key]); return o; }, {}),
    data: data,
  };
  snaps.unshift(snap);
  if (snaps.length > 20) snaps = snaps.slice(0, 20);
  try {
    localStorage.setItem('phoneSnapshots', JSON.stringify(snaps));
    var info = _storageInfoStr();
    setSt('💾 스냅샷 저장됨 — ' + snap.date + ' ' + snap.time + ' · ' + info);
    showToast('💾 내 폰에 스냅샷 저장 완료 · ' + info);
  } catch(e) {
    showToast('⚠ 저장 공간이 부족합니다. 오래된 스냅샷을 지워주세요');
  }
  renderPhoneSnapshots();
  try { refreshAllUsage(); } catch(e){}
}

function showPhoneSnapshots() {
  var list = document.getElementById('phoneSnapshotList');
  if (!list) return;
  if (list.dataset.open === '1') { list.dataset.open='0'; list.innerHTML=''; return; }
  list.dataset.open = '1';
  renderPhoneSnapshots();
}

function renderPhoneSnapshots() {
  var list = document.getElementById('phoneSnapshotList');
  if (!list || list.dataset.open !== '1') return;
  var snaps = _readStore('phoneSnapshots') || [];
  if (!snaps.length) {
    list.innerHTML = '<div style="text-align:center;color:#9E9E9E;font-size:12px;padding:14px">저장된 스냅샷이 없습니다</div>';
    return;
  }
  list.innerHTML = snaps.map(function(s){
    var total = Object.values(s.counts||{}).reduce(function(a,b){ return a+b; }, 0);
    return '<div style="display:flex;align-items:center;gap:8px;background:#F1F8E9;'
      + 'border:1px solid #C5E1A5;border-radius:8px;padding:9px 11px;margin-bottom:6px">'
      + '<div style="flex:1;min-width:0">'
      + '<div style="font-size:13px;font-weight:700;color:#33691E">'+s.date+' '+(s.time||'')+'</div>'
      + '<div style="font-size:10px;color:#7CB342">전체 '+total+'건</div>'
      + '</div>'
      + '<button onclick="restorePhoneSnapshot('+s.id+')" style="background:#33691E;color:white;border:none;'
      + 'border-radius:6px;padding:6px 11px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">복원</button>'
      + '<button onclick="deletePhoneSnapshot('+s.id+')" style="background:#FFEBEE;color:#C62828;border:1px solid #FFCDD2;'
      + 'border-radius:6px;padding:6px 9px;font-size:11px;font-weight:700;cursor:pointer;font-family:inherit">삭제</button>'
      + '</div>';
  }).join('');
}

function restorePhoneSnapshot(id) {
  var snaps = _readStore('phoneSnapshots') || [];
  var s = snaps.find(function(x){ return String(x.id)===String(id); });
  if (!s) return;
  if (!confirm(s.date + ' ' + (s.time||'') + ' 스냅샷으로 되돌릴까요?\n현재 데이터는 이 시점으로 덮어쓰입니다.')) return;
  BACKUP_DATA.forEach(function(d){
    if (s.data[d.key] != null) localStorage.setItem(d.key, JSON.stringify(s.data[d.key]));
  });
  reloadAllFromStorage();
  setSt('✅ ' + s.date + ' 스냅샷으로 복원 완료');
  showToast('✅ 스냅샷 복원 완료');
}

function deletePhoneSnapshot(id) {
  var snaps = _readStore('phoneSnapshots') || [];
  snaps = snaps.filter(function(x){ return String(x.id)!==String(id); });
  localStorage.setItem('phoneSnapshots', JSON.stringify(snaps));
  renderPhoneSnapshots();
  renderBackupSummary();
  try { refreshAllUsage(); } catch(e){}
}

function reloadAllFromStorage() {
  try { plants      = _readStore('plants')      || []; } catch(e){}
  try { growRecords = _readStore('growRecords') || []; } catch(e){}
  try { workLog     = _readStore('workLog')     || []; } catch(e){}
  try { mySupplies  = _readStore('mySupplies')  || []; } catch(e){}
  try { plantsDB    = (_readStore('plantsDB')   || []).filter(function(p){return p.status!=='deleted';}); } catch(e){}
  try { locationChanges = _readStore('locationChanges') || {}; } catch(e){}
  try { renderGrow(); } catch(e){}
  try { renderGrowRecords(); } catch(e){}
  try { renderWorkLog(); } catch(e){}
  try { renderSupplyList(); } catch(e){}
  try { renderIrang(); } catch(e){}
  try { renderSearchResults(document.getElementById('searchInput')?.value||'', '전체'); } catch(e){}
  try { renderBackupSummary(); } catch(e){}
}

// ── ② CSV — 통합 1개 파일 ────────────────────────────────
function exportAllCSV() {
  var parts = [];
  function add(title, header, rows) {
    parts.push('### ' + title);
    parts.push(header);
    rows.forEach(function(r){ parts.push(r); });
    parts.push('');
  }
  function esc(v) {
    v = (v==null?'':String(v));
    return /[",\n]/.test(v) ? '"'+v.replace(/"/g,'""')+'"' : v;
  }
  add('생육일수', 'id,작물명,이모지,위치,심은날짜,총재배일수,순치기일,착과일,메모,수정일시',
    (plants||[]).map(function(p){ return [p.id,p.name,p.emoji,p.loc,p.dateStr,p.totalDays,p.pinchDay,p.fruitDay,p.note,p.updatedAt].map(esc).join(','); }));
  add('생육기록', 'id,작물명,날짜,단계,메모,수정일시',
    (growRecords||[]).map(function(r){ return [r.id,r.name,r.date,r.stage,r.note,r.updatedAt].map(esc).join(','); }));
  add('기록장', 'id,날짜,시각,작업명,상세,위치,유형',
    (workLog||[]).map(function(e){ return [e.id,e.date,e.time,e.name,e.detail,e.loc,e.type].map(esc).join(','); }));
  add('농자재', 'id,날짜,유형,이름,수량,단가,금액,메모',
    (mySupplies||[]).map(function(s){ return [s.id,s.date,s.type,s.name,s.qty,s.price,s.amount,s.note].map(esc).join(','); }));
  add('이랑현황', 'id,작물명,이모지,분류,구역,이랑,위치,수량,상태,메모,수정일시',
    (plantsDB||[]).filter(function(p){return p.status!=='deleted';}).map(function(p){ return [p.id,p.name,p.emoji,p.cat,p.zone,p.irang,p.spot,p.qty,p.status,p.note,p.updatedAt].map(esc).join(','); }));

  var content = '\uFEFF' + parts.join('\n');
  var blob = new Blob([content], {type:'text/csv;charset=utf-8'});
  var url  = URL.createObjectURL(blob);
  var a    = document.createElement('a');
  a.href = url; a.download = '과수원_전체백업_' + toYMD(REAL_TODAY) + '.csv';
  document.body.appendChild(a); a.click(); document.body.removeChild(a);
  URL.revokeObjectURL(url);
  setSt('📥 통합 CSV 파일 저장 완료 · ' + _storageInfoStr());
  showToast('📥 CSV 파일로 내보내기 완료');
}

var _origImportCSVFiles = null;
function importCSVFiles(event) {
  var files = Array.from(event.target.files);
  if (!files.length) return;
  var f0 = files[0];
  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    if (text.indexOf('###') >= 0) {
      importUnifiedCSV(text);
    } else if (typeof importIndividualCSVFiles === 'function') {
      importIndividualCSVFiles({ target: { files: files, value:'' } });
    }
  };
  reader.readAsText(f0, 'UTF-8');
  event.target.value = '';
}

function importUnifiedCSV(text) {
  if (text.charCodeAt(0)===0xFEFF) text = text.slice(1);
  var sections = {};
  var cur = null, buf = [];
  text.split(/\r?\n/).forEach(function(line){
    if (line.indexOf('###') === 0) {
      if (cur && buf.length) sections[cur] = buf.slice();
      cur = line.replace(/#/g,'').trim(); buf = [];
    } else if (cur) {
      if (line.trim()) buf.push(line);
    }
  });
  if (cur && buf.length) sections[cur] = buf.slice();

  var added=0, updated=0;
  function sec(name){ return sections[name] ? sections[name].join('\n') : null; }
  var t, r;
  if ((t=sec('생육일수'))   && typeof importCSVPlants==='function')      { r=importCSVPlants(t);      added+=r.added||0; updated+=r.updated||0; }
  if ((t=sec('생육기록'))   && typeof importCSVGrowRecords==='function') { r=importCSVGrowRecords(t); added+=r.added||0; updated+=r.updated||0; }
  if ((t=sec('기록장'))     && typeof importCSVWorkLog==='function')     { r=importCSVWorkLog(t);     added+=r.added||0; updated+=r.updated||0; }
  if ((t=sec('농자재'))     && typeof importCSVSupplies==='function')    { r=importCSVSupplies(t);    added+=r.added||0; updated+=r.updated||0; }
  if ((t=sec('이랑현황'))   && typeof importIrangCSV2==='function')      { r=importIrangCSV2(t);      added+=r.added||0; updated+=r.updated||0; }

  reloadAllFromStorage();
  setSt('✅ 통합 CSV 복원 — 신규 ' + added + '건, 업데이트 ' + updated + '건');
  showToast('✅ CSV 복원 완료 — ' + (added+updated) + '건');
}

// iPhone WKWebView/Safari: gstatic 차단(사설릴레이·차단기) 대비 여러 CDN을 순서대로 시도
function ensureFirebaseSDK() {
  return Promise.resolve(); // Google Sheets 사용으로 SDK 불필요
}

// Google Sheets 버전 - 연결 확인
function ensureFirebaseConnected() {
  
  // Google Sheets 초기화
  return initializeGoogleSheets().then(() => {
    if (typeof renderBackupSummary === 'function') {
      renderBackupSummary();
    }
    return true;
  });
}

function backupToFirebase() {
  if (!confirm('내 폰의 모든 데이터를 Google Sheets에 동기화할까요?')) return;
  setSt('🔄 Google Sheets 동기화 중...');
  
  try {
    // 모든 데이터를 Google Sheets에 저장
    Promise.all([
      (async () => {
        let existingIds = new Set();
        try {
          const existing = await loadFromGoogleSheets(COLLECTIONS.workLog);
          existingIds = new Set((existing||[]).map(r => String(r.id)));
        } catch(e) {}
        for (const entry of workLog) {
          if (existingIds.has(String(entry.id))) continue;
          const normalized = Object.assign({}, entry);
          if (normalized.date && normalized.date.includes('T')) {
            normalized.date = normalized.date.slice(0, 10);
          }
          await saveToGoogleSheets('create', COLLECTIONS.workLog, normalized).catch(() => {});
        }
      })(),
      (async () => {
        let existingPl = new Set();
        try {
          const existing = await loadFromGoogleSheets(COLLECTIONS.growPlants);
          existingPl = new Set((existing||[]).map(r => String(r.id)));
        } catch(e) {}
        for (const entry of plants) {
          if (existingPl.has(String(entry.id))) continue;
          await saveToGoogleSheets('create', COLLECTIONS.growPlants, entry).catch(() => {});
        }
      })(),
      (async () => {
        let existingSup = new Set();
        try {
          const existing = await loadFromGoogleSheets(COLLECTIONS.supplies);
          existingSup = new Set((existing||[]).map(r => String(r.id)));
        } catch(e) {}
        for (const entry of mySupplies) {
          if (existingSup.has(String(entry.id))) continue;
          await saveToGoogleSheets('create', COLLECTIONS.supplies, entry).catch(() => {});
        }
      })(),
      (async () => {
        // 중복 방지: 기존 Sheets 데이터 id 목록 로드
        let existingIds = new Set();
        try {
          const existing = await loadFromGoogleSheets(COLLECTIONS.growRecords);
          existingIds = new Set((existing||[]).map(r => String(r.id)));
        } catch(e) {}
        for (const entry of growRecords) {
          if (existingIds.has(String(entry.id))) continue; // 이미 있으면 스킵
          // 날짜 형식 정규화 (ISO → YYYY-MM-DD)
          const normalized = Object.assign({}, entry);
          if (normalized.date && normalized.date.includes('T')) {
            normalized.date = normalized.date.slice(0, 10);
          }
          await saveToGoogleSheets('create', COLLECTIONS.growRecords, normalized).catch(() => {});
        }
      })(),
      (async () => {
        // irangChanges: localStorage에서 직접 읽기 (전역 변수 미선언 대비)
        const _irangChanges = (typeof irangChanges !== 'undefined' && irangChanges.length > 0)
          ? irangChanges
          : JSON.parse(localStorage.getItem('irangChanges') || '[]');
        let existingIc = new Set();
        try {
          const existing = await loadFromGoogleSheets(COLLECTIONS.irangChanges);
          existingIc = new Set((existing||[]).map(r => String(r.id)));
        } catch(e) {}
        for (const entry of _irangChanges) {
          if (existingIc.has(String(entry.id))) continue;
          await saveToGoogleSheets('create', COLLECTIONS.irangChanges, entry).catch(() => {});
        }
      })(),
      (async () => {
        // irangLog: localStorage에서 직접 읽기
        const _irangLog = (typeof irangLog !== 'undefined' && Array.isArray(irangLog) && irangLog.length > 0)
          ? irangLog
          : JSON.parse(localStorage.getItem('irangLog') || '[]');
        let existingIl = new Set();
        try {
          const existing = await loadFromGoogleSheets(COLLECTIONS.irangLog);
          existingIl = new Set((existing||[]).map(r => String(r.id)));
        } catch(e) {}
        for (const entry of _irangLog) {
          if (existingIl.has(String(entry.id))) continue;
          await saveToGoogleSheets('create', COLLECTIONS.irangLog, entry).catch(() => {});
        }
      })()
    ]).then(() => {
      setSt('✅ Google Sheets 동기화 완료');
      showToast('✅ Google Sheets에 백업 완료');
      renderBackupSummary();
    }).catch(function(e) {
      setSt('❌ 동기화 실패: ' + (e && e.message || ''));
      showToast('❌ ' + (e && e.message || '동기화 실패'));
    });
  } catch (err) {
    setSt('❌ 동기화 중 오류 발생');
    showToast('❌ ' + err.message);
  }
}

function restoreFromFirebase() {
  if (!confirm('Google Sheets에서 모든 데이터를 복원할까요?\nGoogle Sheets의 데이터를 내 폰으로 가져옵니다.')) return;
  setSt('🔄 Google Sheets에서 복원 중...');
  
  initializeGoogleSheets().then(() => {
    reloadAllFromStorage();
    setSt('✅ 복원 완료');
    showToast('✅ Google Sheets에서 복원 완료');
    renderBackupSummary();
  }).catch(function(e) {
    setSt('❌ 복원 실패: ' + (e && e.message || ''));
    showToast('❌ ' + (e && e.message || '복원 실패'));
  });
}

function connectFirebaseManual() {
  setSt('🔄 Google Sheets 재연결 중...');
  showToast('🔄 Google Sheets에 재연결하는 중...');
  
  initializeGoogleSheets().then(() => {
    setSt('✅ Google Sheets 연결됨');
    showToast('✅ Google Sheets 연결됨');
    renderBackupSummary();
  }).catch(function(err) {
    var msg = (err && err.message) || 'Google Sheets 연결 실패';
    setSt('❌ ' + msg);
    showToast('❌ ' + msg);
    renderBackupSummary();
  });
}

window._onEnterBackupTab = function() {
  // 영구 저장 상태 재확인 후 요약 갱신
  if (typeof requestPersistentStorage === 'function') {
    requestPersistentStorage().then(function(){ renderBackupSummary(); });
  }
  renderBackupSummary();
  var list = document.getElementById('phoneSnapshotList');
  if (list && list.dataset.open === '1') renderPhoneSnapshots();
};