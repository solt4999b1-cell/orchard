// 서버에서 온 select 태그를 분해하여 선택된 텍스트만 추출하는 함수
function extractSelectedText(htmlStr) {
    if (!htmlStr) return '-';
    // 태그 제거 및 공백 정리
    return htmlStr.toString().replace(/<[^>]+>/g, '').trim();
}

async function searchData() {
    const keyword = document.getElementById('keywordInput').value.trim();
    const resultDiv = document.getElementById('resultContainer');
    if (!keyword) { alert('검색어를 입력해주세요.'); return; }
    resultDiv.innerHTML = '<div style="text-align:center; color:#666;">데이터를 불러오는 중입니다...</div>';

    const GAS_URL = ''; // ⚙️ 설정에서 입력 (소스에 노출 안 됨) // 본인의 실제 웹앱 주소
    const url = `${GAS_URL}?keyword=${encodeURIComponent(keyword)}`;

    try {
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const data = await response.json(); 

        console.log("전체 데이터:", data);
        
        // data.list.item 구조를 확인하여 변환 및 _rawList 매핑
        if (data.list && data.list.item) {
            // 결과가 1개일 경우 객체로 반환될 수 있으므로 배열로 정규화
            const items = Array.isArray(data.list.item) ? data.list.item : [data.list.item];
            
            // 1. 하단 렌더링 로직이 작동하도록 필수 속성 강제 할당
            data.success = true;
            data._rawList = items;

            // 2. 작물별 사용법(cropUsage) 변환 로직
            if (!data.cropUsage || Object.keys(data.cropUsage).length === 0) {
                var cu = {};
                items.forEach(function(row) {
                    var crop = row.cropName || '기타';
                    if (!cu[crop]) cu[crop] = [];
                    cu[crop].push({
                        target: row.diseaseWeedName || '',
                        method: row.pestiUse || '',
                        amount: row.dilutUnit || '',
                        safety: row.useSuittime || '',
                        times:  row.useNum || ''
                    });
                });
                data.cropUsage = cu; // 변환된 데이터를 data.cropUsage에 담음
            }
        }

        // 이제 data.success와 data._rawList가 존재하므로 아래 조건문을 무사히 통과합니다.
        if (!data.success || !data._rawList || data._rawList.length === 0) {
            resultDiv.innerHTML = `<div style="text-align:center; padding:20px; color:#666;">결과가 없습니다.</div>`;
            return;
        }

        resultDiv.innerHTML = '';
        data._rawList.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item-card';
            
            // 상세 정보 접근 (api 응답 구조에 따라 item._detail이 없을 수 있으므로 data._detail도 확인)
            const detail = item._detail || data._detail || {}; 
            const toxic = extractSelectedText(detail.toxicName || '정보 없음');
            const fish = extractSelectedText(detail.fishToxicGubun || '정보 없음');
        
            itemDiv.innerHTML = `
                <div class="header-row">
                    <div class="brand-name">${item.pestiBrandName || item.brandName || keyword}</div>
                    <div class="comp-name">${item.compName || item.manufacturer || '-'}</div>
                </div>
                <div class="info-row"><strong>🧪 인축독성:</strong> ${toxic}</div>
                <div class="info-row"><strong>🐟 어독성:</strong> ${fish}</div>
                <div class="info-row"><strong>용도:</strong> ${item.useName || '-'}</div>
                <div class="highlight-box">
                    <strong>🌾 적용작물:</strong> ${item.cropName || '-'} <br>
                    <strong>🐛 적용병해충:</strong> ${item.diseaseWeedName || '-'}
                </div>
            `;
            resultDiv.appendChild(itemDiv);
        });
    } catch (error) {
        resultDiv.innerHTML = `<div class="error-msg">호출 실패</div>`;
    }
}


// Firebase 설정 (난독화)
const _FC = 'eyJhcGlLZXkiOiAiQUl6YVN5QUtqUVJSalh3bWJsclpQcXY4RHhOZm8xNUUyQjU4a0tBIiwgInByb2plY3RJZCI6ICJvcmNoYXJkYXBwLWI4MWNhIiwgImF1dGhEb21haW4iOiAib3JjaGFyZGFwcC1iODFjYS5maXJlYmFzZWFwcC5jb20iLCAiYXBwSWQiOiAiMTo4NDg2ODAzNDU0OTY6d2ViOjExZDQ2OGM0NGI0MTJjMDM3Nzk1ZWQifQ==';
const FIREBASE_CONFIG = JSON.parse(atob(_FC));
window.FIREBASE_CONFIG = FIREBASE_CONFIG;

const GAS_OCR_URL = "https://script.google.com/macros/s/AKfycbylDKpNwxsbkj4lZV7tgBnTEAWBOX5FZ65zrtH66nrqH4IRSIBX8vlTtqACbpr_xLAz/exec";  

const CLAUDE_API_KEY = ""; 
//const PSIS_URL = "http://psis.rda.go.kr/openApi/service.do";

const MASTER_DB = {"pesticides":[{"id":"p01","no":1,"name":"스트레이트","type":"살충제","form":"아바멕틴계·입상수화제","ingredient":"에마멕틴벤조에이트 2.15%","target":"진딧물, 나방류 유충, 총채벌레, 굴파리류","method":"2,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소 광범위","warning":"동일 계통 연용 자제","moa":"I-D","moaName":"아버멕틴/아버멕틴계","moaColor":"#4CAF50","soilUse":false,"maxTimes":2,"microbeSafe":true,"incompatible":["알칼리성 농약"],"note":"스트레이트. 아버멕틴계. 미생물균과 혼용 주의"},{"id":"p02","no":2,"name":"라이몬","type":"살충제","form":"IGR계·액상수화제","ingredient":"노발루론 10%","target":"나방류, 총채벌레, 온실가루이, 노린재","method":"1,000~2,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"57개 작물 등록","warning":"6월 이후 나방류 효과. 알·유충·번데기 방제","moa":"I-F","moaName":"성장억제","moaColor":"#9E9E9E","soilUse":false,"maxTimes":2,"microbeSafe":true,"incompatible":["강알칼리 농약"],"note":"성장억제제. 미생물균과 혼용 가능"},{"id":"p03","no":3,"name":"코니도","type":"살충제","form":"네오니코티노이드·수화제","ingredient":"이미다클로프리드 8%","target":"진딧물, 총채벌레, 온실가루이, 매미충","method":"2,000배 경엽살포·토양관주","bee_toxicity":"매우강함","bloom_use":"절대금지","crop_range":"흡즙해충 전용","warning":"침투이행성. 연용 자제","moa":"I-A","moaName":"네오니코티노이드","moaColor":"#F44336","soilUse":true,"maxTimes":2,"microbeSafe":true,"incompatible":[],"note":"경엽·토양 겸용. 네오니코티노이드"},{"id":"p04","no":4,"name":"모스피란","type":"살충제","form":"네오니코티노이드·수용제","ingredient":"아세타미프리드 20%","target":"진딧물, 가루이, 깍지벌레, 잎벌레","method":"2,000~3,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"연용 시 저항성 주의","moa":"I-A","moaName":"네오니코티노이드","moaColor":"#F44336"},{"id":"p05","no":5,"name":"에이팜","type":"살충제","form":"스피노신계·액상수화제","ingredient":"스피노사드 25%","target":"나방류, 총채벌레, 굴파리","method":"1,000~2,000배 경엽살포","bee_toxicity":"중간","bloom_use":"주의","crop_range":"유기농 적합 작물","warning":"천연유래 성분. 저독성","moa":"I-E","moaName":"스피노신","moaColor":"#00BCD4","soilUse":false,"maxTimes":2,"microbeSafe":true,"incompatible":["강알칼리성 농약"],"note":"스피노신계. 미생물 유래 성분"},{"id":"p06","no":6,"name":"렘페이지","type":"살충제","form":"다이아마이드계·액상수화제","ingredient":"클로란트라닐리프롤 20%","target":"나방류 유충","method":"2,000~4,000배 경엽살포","bee_toxicity":"중간","bloom_use":"주의","crop_range":"과수·채소","warning":"나방류 전용 고효과. 연용 자제","moa":"I-B","moaName":"다이아미드","moaColor":"#2196F3","soilUse":false,"maxTimes":3,"microbeSafe":true,"incompatible":[],"note":"다이아미드계. 미생물균 혼용 가능"},{"id":"p07","no":7,"name":"데시스","type":"살충제","form":"피레스로이드계·유제","ingredient":"델타메트린 2.5%","target":"나방류, 진딧물, 노린재","method":"1,000~2,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"어독성 강함. 수계 오염 주의","moa":"I-C","moaName":"피레스로이드","moaColor":"#FF9800"},{"id":"p08","no":8,"name":"세베로","type":"살충제","form":"카바메이트계·수화제","ingredient":"카보설판 25%","target":"진딧물, 굼벵이, 나방류","method":"1,000배 경엽·토양처리","bee_toxicity":"강함","bloom_use":"금지","crop_range":"채소·과수","warning":"어독성 주의","moa":"I-H","moaName":"기타살충","moaColor":"#78909C"},{"id":"p09","no":9,"name":"살비왕","type":"살충제·살비제","form":"아카리사이드·수화제","ingredient":"사이에노피라펜 20%","target":"응애류(점박이응애, 이리응애)","method":"2,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"과수·채소 응애 방제","warning":"응애 전용. 천적 보호"},{"id":"p10","no":10,"name":"오베론","type":"살충제","form":"케토엔올계·액상수화제","ingredient":"스피로메시펜 24%","target":"온실가루이, 응애류","method":"2,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"주의","crop_range":"시설 채소·과수","warning":"가루이·응애 동시 방제","moa":"I-H","moaName":"기타살충","moaColor":"#78909C"},{"id":"p11","no":11,"name":"아타라","type":"살충제","form":"네오니코티노이드·입제","ingredient":"티아메톡삼 1%","target":"진딧물, 굴파리, 잎벌레","method":"토양혼화 처리","bee_toxicity":"강함","bloom_use":"금지","crop_range":"채소 정식시","warning":"침투이행성 입제. 정식시 토양처리","moa":"I-A","moaName":"네오니코티노이드","moaColor":"#F44336"},{"id":"p12","no":12,"name":"스미치온","type":"살충제","form":"유기인계·유제","ingredient":"펜티온 50%","target":"나방류, 진딧물, 응애","method":"1,000~1,500배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"고온기 약해 주의","moa":"I-G","moaName":"유기인계","moaColor":"#8D6E63"},{"id":"p13","no":13,"name":"파단","type":"살충제","form":"네레이스독소계·수화제","ingredient":"카르타프 50%","target":"나방류, 이화명나방, 잎벌레","method":"1,000배 경엽살포","bee_toxicity":"중간","bloom_use":"금지","crop_range":"벼·채소·과수","warning":"누에에 독성 강함","moa":"I-H","moaName":"기타살충","moaColor":"#78909C"},{"id":"p14","no":14,"name":"청줄어람","type":"살충제","form":"IGR계·유제","ingredient":"루페뉴론 5%","target":"나방류 유충, 총채벌레","method":"1,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"6월~나방류 방제. 라이몬 교차 사용 권장","moa":"I-F","moaName":"성장억제","moaColor":"#9E9E9E"},{"id":"p15","no":15,"name":"노블레스","type":"살충제·살비제","form":"아카리사이드·액상수화제","ingredient":"아바멕틴 1.8%","target":"응애, 굴파리, 잎응애","method":"2,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"응애·굴파리 동시 방제"},{"id":"p16","no":16,"name":"히트론","type":"살충제","form":"피레스로이드계·유제","ingredient":"사이퍼메트린 5%","target":"나방류, 노린재, 진딧물","method":"1,000~2,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"잔효성 좋음","moa":"I-C","moaName":"피레스로이드","moaColor":"#FF9800"},{"id":"p17","no":17,"name":"팡파레","type":"살충제","form":"다이아마이드·액상수화제","ingredient":"시안트라닐리프롤 10%","target":"나방류, 굴파리","method":"2,000~3,000배 경엽살포","bee_toxicity":"중간","bloom_use":"주의","crop_range":"채소·과수","warning":"나방·굴파리 전문. 잔효기간 김","moa":"I-B","moaName":"다이아미드","moaColor":"#2196F3","soilUse":false,"maxTimes":2,"microbeSafe":true,"incompatible":[],"note":"다이아미드계"},{"id":"p18","no":18,"name":"코르도반","type":"살충제","form":"오가노포스페이트·수화제","ingredient":"클로르피리포스 40.8%","target":"응애, 진딧물, 깍지벌레","method":"1,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수 전용","warning":"어독성·조류독성 주의","moa":"I-G","moaName":"유기인계","moaColor":"#8D6E63"},{"id":"p19","no":19,"name":"트란스폼","type":"살충제","form":"설폭시민계·액상수화제","ingredient":"설폭사플로르 22%","target":"진딧물, 가루이, 깍지벌레","method":"2,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"네오니코 내성 해충 방제","moa":"I-A","moaName":"네오니코티노이드","moaColor":"#F44336"},{"id":"p20","no":20,"name":"이샷","type":"살충제","form":"네오니코티노이드·액상수화제","ingredient":"디노테퓨란 20%","target":"진딧물, 가루이, 매미충","method":"2,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"침투이행성. 연용 자제","moa":"I-A","moaName":"네오니코티노이드","moaColor":"#F44336"},{"id":"p21","no":21,"name":"알파스린","type":"살충제","form":"피레스로이드계·유제","ingredient":"알파-사이퍼메트린 5%","target":"나방류, 진딧물, 노린재","method":"1,000~2,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"잔효성 좋음. 고온기 약해 주의","moa":"I-C","moaName":"피레스로이드","moaColor":"#FF9800"},{"id":"p22","no":22,"name":"터세로","type":"살충제","form":"네오니코·피레스로이드 혼합","ingredient":"티아메톡삼+람다사이할로트린","target":"나방류, 진딧물, 노린재","method":"1,500~2,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"이중 작용. 잔효 길음","moa":"I-A+I-C","moaName":"네오니코티노이드 + 피레스로이드","moaColor":"#F44336"},{"id":"p23","no":23,"name":"델란","type":"살균제","form":"무기황계·수화제","ingredient":"디티아논 75%","target":"흑성병, 탄저병, 겹무늬썩음병, 갈색무늬병","method":"600~1,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"주의","crop_range":"과수·채소 광범위","warning":"예방 위주. 석회유황합제 혼용 금지","moa":"F-D","moaName":"보호살균","moaColor":"#607D8B","soilUse":false,"maxTimes":3,"microbeSafe":false,"incompatible":["석회유황합제","동제","강알칼리"],"note":"보호살균. 다부위 작용"},{"id":"p24","no":24,"name":"다코닐","type":"살균제","form":"클로로탈로닐계·수화제","ingredient":"클로로탈로닐 75%","target":"탄저병, 역병, 노균병, 잿빛곰팡이","method":"500~800배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"채소·과수 광범위","warning":"예방 보호살균제. 연용 자제","moa":"F-D","moaName":"보호살균","moaColor":"#607D8B","soilUse":false,"maxTimes":3,"microbeSafe":false,"incompatible":["석회유황합제","오일제","캡탄"],"note":"다코닐. 보호살균"},{"id":"p25","no":25,"name":"포리옥신","type":"살균제","form":"항생물질계·수용제","ingredient":"폴리옥신B 10%","target":"흰가루병, 잿빛곰팡이, 탄저병","method":"1,000~2,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"채소·과수","warning":"생물유래 살균제. 저독성","moa":"F-F","moaName":"기타살균","moaColor":"#795548","soilUse":false,"maxTimes":3,"microbeSafe":true,"incompatible":[],"note":"항생물질계. 미생물균 혼용 주의"},{"id":"p26","no":26,"name":"스코어","type":"살균제","form":"트리아졸계·유제","ingredient":"디페노코나졸 25%","target":"탄저병, 흑성병, 흰가루병, 녹병","method":"2,000~3,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"과수·채소","warning":"침투치료형. 발병 초기 사용","moa":"F-C","moaName":"DMI(트리아졸)","moaColor":"#3F51B5","soilUse":false,"maxTimes":3,"microbeSafe":true,"incompatible":["동제"],"note":"DMI(트리아졸)계"},{"id":"p27","no":27,"name":"오티바","type":"살균제","form":"스트로빌루린계·액상수화제","ingredient":"아족시스트로빈 25%","target":"노균병, 탄저병, 역병, 흰가루병","method":"1,000~2,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"채소·과수 광범위","warning":"광범위 침투살균. 내성 주의","moa":"F-B","moaName":"스트로빌루린","moaColor":"#9C27B0","soilUse":false,"maxTimes":4,"microbeSafe":false,"incompatible":["동제","석회유황합제"],"note":"오티바(아족시스트로빈). 스트로빌루린"},{"id":"p28","no":28,"name":"앤트라콜","type":"살균제","form":"유기유황계·수화제","ingredient":"프로피네브 70%","target":"역병, 노균병, 탄저병","method":"500~700배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"채소·과수","warning":"예방 보호살균. 연속 강우 시 효과 저하","moa":"F-D","moaName":"보호살균","moaColor":"#607D8B","soilUse":false,"maxTimes":3,"microbeSafe":false,"incompatible":["동제","강알칼리"],"note":"앤트라콜. 보호살균"},{"id":"p29","no":29,"name":"로브랄","type":"살균제","form":"디카복시미드계·수화제","ingredient":"이프로디온 50%","target":"잿빛곰팡이, 균핵병, 흑색무름병","method":"1,000~1,500배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"채소·과수·딸기","warning":"잿빛곰팡이 전문. 저온기 효과 우수","moa":"F-F","moaName":"기타살균","moaColor":"#795548"},{"id":"p30","no":30,"name":"리도밀골드","type":"살균제","form":"아실알라닌계·수화제","ingredient":"메탈락실엠","target":"역병, 노균병","method":"600~800배 경엽·토양처리","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"토마토·감자·오이","warning":"역병 전문 치료+예방. 연용 자제","moa":"F-E","moaName":"페닐아미드","moaColor":"#FF5722","soilUse":true,"maxTimes":2,"microbeSafe":false,"incompatible":["동제","알칼리성 농약"],"note":"토양 관주 또는 경엽. 역병·노균병 전문"},{"id":"p31","no":31,"name":"베노밀","type":"살균제","form":"벤지미다졸계·수화제","ingredient":"베노밀 50%","target":"흰가루병, 탄저병, 균핵병, 흑성병","method":"1,500~2,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"과수·채소","warning":"광범위 살균. 내성균 발생 주의","moa":"F-F","moaName":"기타살균","moaColor":"#795548"},{"id":"p32","no":32,"name":"실바코","type":"살균제","form":"트리아졸계·수화제","ingredient":"테부코나졸 25%","target":"흰가루병, 녹병, 탄저병","method":"2,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"과수·채소","warning":"침투치료형. 흰가루병 특효","moa":"F-C","moaName":"DMI(트리아졸)","moaColor":"#3F51B5","soilUse":false,"maxTimes":3,"microbeSafe":true,"incompatible":["동제"],"note":"테부코나졸(DMI)"},{"id":"p33","no":33,"name":"영일바리신","type":"살균제","form":"항생물질계·수화제","ingredient":"발리다마이신 3%","target":"잘록병, 흰비단병, 모잘록병","method":"500~1,000배 토양관주","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"채소 육묘","warning":"토양살균. 육묘기 사용","moa":"F-F","moaName":"기타살균","moaColor":"#795548","soilUse":true,"maxTimes":3,"microbeSafe":true,"incompatible":[],"note":"항생물질계. 미생물균과 혼용 가능"},{"id":"p64","no":64,"name":"프린트","type":"살균제","form":"액상수화제","ingredient":"트리플록시스트로빈","target":"흰가루병·탄저병·검은별무늬병","method":"2,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"주의","crop_range":"과수·채소 광범위","warning":"등록번호 4-살균-216, 저독성(어독성 Ⅰ급)","manufacturer":"바이엘","moa":"F-B","moaName":"스트로빌루린","moaColor":"#9C27B0"},{"id":"p35","no":35,"name":"만코지","type":"살균제","form":"유기유황계·수화제","ingredient":"만코제브 80%","target":"역병, 노균병, 탄저병","method":"500~700배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"채소·과수 광범위","warning":"예방 보호살균. 잔류 주의","moa":"F-D","moaName":"보호살균","moaColor":"#607D8B","soilUse":false,"maxTimes":3,"microbeSafe":false,"incompatible":["동제","오일제","강알칼리"],"note":"만코제브. 보호살균"},{"id":"p36","no":36,"name":"팜플루","type":"살균제","form":"카복사미드계·액상수화제","ingredient":"보스칼리드 26.7%+크레속심메틸","target":"흰가루병, 탄저병, 잿빛곰팡이","method":"1,500~2,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"과수·채소","warning":"이중 작용 복합살균. 연용 자제","moa":"F-A+F-B","moaName":"SDHI계 + 스트로빌루린","moaColor":"#E91E63","soilUse":false,"maxTimes":3,"microbeSafe":false,"incompatible":["동제","석회유황합제"],"note":"팜플루. SDHI+스트로빌루린 혼합"},{"id":"p37","no":37,"name":"월동나무","type":"살균제","form":"코퍼계·수화제","ingredient":"수산화동 77%","target":"세균성 병해, 흑성병, 궤양병","method":"600~1,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"주의","crop_range":"과수 세균병","warning":"세균병 전문. 개화기 약해 주의","moa":"F-D","moaName":"보호살균","moaColor":"#607D8B","soilUse":false,"maxTimes":2,"microbeSafe":false,"incompatible":["강산성 농약","황제","기계유","오일제"],"note":"동제. 알칼리성. 대부분 농약과 혼용 주의"},{"id":"p38","no":38,"name":"코리도","type":"살균살충제","form":"복합계·수화제","ingredient":"이미다클로프리드+티오파네이트메틸","target":"진딧물+흰가루병","method":"2,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"채소·과수","warning":"살균·살충 동시 방제","moa":"I-A+F-F","moaName":"네오니코티노이드 + 기타살균","moaColor":"#F44336"},{"id":"p39","no":39,"name":"캡틴","type":"살균살충제","form":"복합계·수화제","ingredient":"클로르피리포스+캡탄","target":"나방+탄저병","method":"1,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"사과·배·복숭아","warning":"과수 병해충 동시 방제","moa":"I-G+F-D","moaName":"유기인계 + 보호살균","moaColor":"#8D6E63"},{"id":"p40","no":40,"name":"코사이드","type":"살균살충제","form":"복합계·수화제","ingredient":"이미다클로프리드+보스칼리드","target":"흡즙해충+흰가루병","method":"2,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"복합 방제. 연용 자제","moa":"I-A+F-A","moaName":"네오니코티노이드 + SDHI계","moaColor":"#F44336"},{"id":"p41","no":41,"name":"파워샷","type":"살균살충제","form":"복합계·유제","ingredient":"람다사이할로트린+테부코나졸","target":"나방류+흰가루병·녹병","method":"1,500배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","crop_range":"과수·채소","warning":"이중 작용. 연용 자제","moa":"I-C+F-C","moaName":"피레스로이드 + DMI(트리아졸)","moaColor":"#FF9800"},{"id":"p42","no":42,"name":"에이스원","type":"살균살충제","form":"복합계·액상수화제","ingredient":"사이안트라닐리프롤+디페노코나졸","target":"나방+탄저병·흑성병","method":"2,000배 경엽살포","bee_toxicity":"중간","bloom_use":"주의","crop_range":"과수·채소","warning":"고효과 복합. 비용 효율 높음","moa":"I-B+F-C","moaName":"다이아미드 + DMI(트리아졸)","moaColor":"#2196F3"},{"id":"p43","no":43,"name":"마구퍼져","type":"비선택성 제초제","form":"포스포노아미노산계·액제","ingredient":"글루포시네이트암모늄 18%","target":"화본과·광엽 잡초 공통","method":"30~50배 희석 잡초 경엽살포","bee_toxicity":"낮음","bloom_use":"비접촉 가능","crop_range":"과원·밭둑 잡초 방제","warning":"작물 접촉 시 고사. 무풍 건조한 날"},{"id":"p44","no":44,"name":"근사미(바스타)","type":"비선택성 제초제","form":"글리포세이트계·액제","ingredient":"글리포세이트 41%","target":"다년생·화본과 잡초 공통","method":"50배 희석 경엽살포","bee_toxicity":"낮음","bloom_use":"비접촉 가능","crop_range":"다년생 잡초 제거","warning":"잔류 주의. 토양 흡착"},{"id":"p45","no":45,"name":"그람목손(터보)","type":"비선택성 제초제","form":"비피리딜리움계·액제","ingredient":"파라쾃 24%","target":"1년생 잡초 신속 고사","method":"50배 희석 경엽살포","bee_toxicity":"낮음","bloom_use":"비접촉 가능","crop_range":"비상시 신속 제초","warning":"인체 맹독성. 안전장비 필수"},{"id":"p46","no":46,"name":"라쏘","type":"비선택성 제초제","form":"클로로아세트아마이드계·유제","ingredient":"알라클로르 48%","target":"화본과 잡초","method":"파종 전 토양처리","bee_toxicity":"낮음","bloom_use":"토양처리","crop_range":"밭 파종 전 처리","warning":"파종 전 토양 잔류성"},{"id":"p47","no":47,"name":"그라목손 프리미엄","type":"선택성 제초제","form":"포스포노아미노산계·액제","ingredient":"글루포시네이트암모늄+기타","target":"화본과 잡초 선택","method":"25~30배 경엽살포","bee_toxicity":"낮음","bloom_use":"비접촉 가능","crop_range":"과원 화본과 방제","warning":"광엽잡초 적용 범위 제한"},{"id":"p48","no":48,"name":"나브","type":"선택성 제초제","form":"아릴옥시페녹시프로피온산계·유제","ingredient":"펜옥사프롭-에틸 6.9%","target":"화본과 잡초","method":"50~100배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"대두밭·채소밭","warning":"광엽작물에 안전. 화본과 전용"},{"id":"p49","no":49,"name":"세렉스","type":"선택성 제초제","form":"트리아진계·수화제","ingredient":"메트리부진 70%","target":"1년생 광엽잡초","method":"200~250배 토양처리","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"콩·감자밭","warning":"콩밭 선택성 제초"},{"id":"p50","no":50,"name":"론스타","type":"선택성 제초제","form":"술포닐우레아계·수화제","ingredient":"이마자픽 70%","target":"1년생 잡초","method":"포장지 기준 토양처리","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"콩밭 전용","warning":"콩 전용 선택성"},{"id":"p51","no":51,"name":"한방","type":"선택성 제초제","form":"아릴옥시페녹시·수화제","ingredient":"할록시포프-R 10.8%","target":"화본과 잡초","method":"50~75배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"두류·채소밭","warning":"광엽작물 안전. 화본과 전용"},{"id":"p52","no":52,"name":"그린탑","type":"선택성 제초제","form":"카바메이트계·수화제","ingredient":"아슐람 34.5%","target":"화본과 잡초","method":"50배 경엽살포","bee_toxicity":"낮음","bloom_use":"가능","crop_range":"과원·밭","warning":"특히 쇠뜨기류 효과"},{"id":"p53","no":53,"name":"말뚝","type":"토양살충제","form":"유기인계·입제","ingredient":"터부포스 5%","target":"굼벵이, 방아벌레, 거세미나방, 뿌리혹선충","method":"정식·파종 전 토양혼화","bee_toxicity":"강함","bloom_use":"금지","crop_range":"밭작물(과수 제외)","warning":"1회만 사용. 장갑·마스크 필수","soilUse":true,"maxTimes":1,"moa":"I-G","microbeSafe":false,"incompatible":["동제","석회유황합제"],"note":"토양 혼화 처리. 고독성. 정식 전 1회"},{"id":"p54","no":54,"name":"데푸콘","type":"토양살충제","form":"카바메이트계·입제","ingredient":"카보퓨란 3%","target":"굼벵이, 선충, 고자리파리","method":"정식시 토양혼화","bee_toxicity":"강함","bloom_use":"금지","crop_range":"채소·밭작물","warning":"어독성 강함. 수계 유출 주의","soilUse":true,"maxTimes":1,"moa":"I-H","microbeSafe":false,"incompatible":["동제"],"note":"토양 혼화/관주. 정식 전 또는 파종 전 1회"},{"id":"p55","no":55,"name":"모캡","type":"토양살충제","form":"유기인계·입제","ingredient":"에토프로포스","target":"굼벵이, 방아벌레, 선충류","method":"파종전 토양혼화","bee_toxicity":"강함","bloom_use":"금지","crop_range":"감자·채소","warning":"조류 독성 주의","soilUse":true,"maxTimes":1,"moa":"I-G","microbeSafe":false,"incompatible":["알칼리성 농약","석회유황합제"],"note":"토양 혼화. 독성 주의"},{"id":"p56","no":56,"name":"주토","type":"토양살충제","form":"네오니코티노이드계·입제","ingredient":"포클로르부람 0.3%","target":"굼벵이, 고자리파리","method":"정식시 토양혼화","bee_toxicity":"중간","bloom_use":"금지","crop_range":"채소·밭작물","warning":"비교적 안전한 토양살충제","soilUse":true,"maxTimes":1,"moa":"I-H","microbeSafe":false,"incompatible":[],"note":"토양 처리 전용"},{"id":"p57","no":57,"name":"토갑","type":"토양살충제","form":"카바메이트계·입제","ingredient":"포레이트 10%","target":"굼벵이, 선충, 방아벌레","method":"파종전 토양혼화","bee_toxicity":"강함","bloom_use":"금지","crop_range":"밭작물","warning":"독성 강함. 철저한 보호장비","soilUse":true,"maxTimes":1,"moa":"I-G","microbeSafe":false,"incompatible":["알칼리성 농약"],"note":"토양 혼화. 고독성. 취급 주의"},{"id":"p58","no":58,"name":"심마니","type":"토양살충제","form":"복합계·입제","ingredient":"카보퓨란+에토프로포스","target":"굼벵이, 선충, 고자리파리 복합","method":"파종·정식전 토양혼화","bee_toxicity":"강함","bloom_use":"금지","crop_range":"채소·밭작물","warning":"복합효과. 처리 후 복토 필수","soilUse":true,"maxTimes":1,"moa":"I-G+I-H","microbeSafe":false,"incompatible":["동제","알칼리성 농약"],"note":"토양 혼화 혼합제"},{"id":"p59","no":59,"name":"비타민B군","type":"생장조정제·기타","form":"식물영양제","ingredient":"아미노산+비타민복합","target":"생육 촉진, 스트레스 완화","method":"500~1,000배 엽면시비","bee_toxicity":"없음","bloom_use":"가능","crop_range":"모든 작물","warning":"약해 없음. 생육기 수시 사용 가능"},{"id":"p60","no":60,"name":"아그리마이신","type":"생장조정제·기타","form":"항생물질계·수용제","ingredient":"옥시테트라사이클린 17%","target":"화상병, 세균성 궤양병","method":"1,000배 경엽살포","bee_toxicity":"낮음","bloom_use":"주의","crop_range":"사과·배 화상병","warning":"화상병 방제 전문. 내성 주의"},{"id":"p61","no":61,"name":"맥시마","type":"생장조정제·기타","form":"미생물제","ingredient":"바실루스 서브틸리스","target":"잿빛곰팡이, 흰가루병 예방","method":"500~1,000배 경엽살포","bee_toxicity":"없음","bloom_use":"가능","crop_range":"유기농·친환경 재배","warning":"친환경 미생물 살균. 저독성"},{"id":"p62","no":62,"name":"삼진왕","type":"살균살충제","form":"미탁제","ingredient":"디페노코나졸 이미녹타딘트리아세테이트","target":"흰가루병·탄저병·진딧물·응애","method":"1,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","warning":"등록번호 1-살균-261, 보통독성(어독성 Ⅱ급)","crop_range":"채소·과수 광범위","manufacturer":"경농","moa":"F-C","moaName":"DMI(트리아졸)","moaColor":"#3F51B5"},{"id":"p63","no":63,"name":"다트롤","type":"살충제","form":"유탁제","ingredient":"플룩사메타마이드 유탁제","target":"나방류(배추좀나방·파밤나방·담배나방)","method":"1,000배 경엽살포","bee_toxicity":"강함","bloom_use":"금지","warning":"등록번호 8-살충-39, 저독성(어독성 Ⅱ급)","crop_range":"채소·과수","manufacturer":"농협케미칼","moa":"F-A","moaName":"SDHI계","moaColor":"#E91E63","soilUse":false,"maxTimes":3,"microbeSafe":false,"incompatible":["동제"],"note":"다트롤. SDHI계"},{"id":"p65","no":65,"name":"후론사이드","type":"살균제","form":"입제","ingredient":"플루아지남","target":"역병·뿌리흑병·뿌리마름병·더뎅이병·뿌리썩음병·흰날개무늬병","method":"토양혼화처리 (정식전·파종전)","bee_toxicity":"낮음","bloom_use":"가능","warning":"등록번호 46-살균-312, 저독성(어독성 Ⅲ급)","crop_range":"고추·배추·오이·참외·감자·참깨·양배추·브로콜리·갓·무·순무·딸기·사과","manufacturer":"팜한농","moa":"F-A","moaName":"SDHI계","moaColor":"#E91E63","soilUse":false,"maxTimes":3,"microbeSafe":false,"incompatible":["동제","알칼리성"],"note":"후론사이드. SDHI계"},{"id":"p66","no":66,"name":"듀알골드","type":"선택성 제초제","form":"입제","ingredient":"에스메톨라클로르","target":"일년생 잡초 (화본과·광엽잡초)","method":"파종·정식기 토양처리 (파종 복토 후 3일 이내)","bee_toxicity":"없음","bloom_use":"가능","warning":"등록번호 제2-제초-274, 저독성(어독성 Ⅲ급)","crop_range":"감자·고구마·고추·동부·무·시금치·옥수수·콩·파","manufacturer":"신젠타코리아㈜","moa":"F-A+F-B","moaName":"SDHI계 + 스트로빌루린","moaColor":"#E91E63","soilUse":false,"maxTimes":4,"microbeSafe":false,"incompatible":["동제","석회유황합제"],"note":"벨리스에스. SDHI+스트로빌루린"},{"id":"p66","no":66,"name":"벨리스에스","type":"살균제","ingredient":"보스칼리드(13.6%) + 피라클로스트로빈(8%)","manufacturer":"(주)경농","form":"액상수화제","feature":"SDHI계+스트로빌루린계 혼합, 예방·치료 동시, 내성 발현 적음, 광범위 살균 스펙트럼","target":"탄저병·잿빛곰팡이병·흰가루병·균핵병·점무늬낙엽병 등 광범위","method":"경엽처리(2,000배) / 토양처리·관주(1,000배) / 무인항공(16배)","bee_toxicity":"저독성","bloom_use":"개화기 주의","warning":"동제와 혼용 금지. 약해 주의(혼용가부표 확인)","regNo":"확인필요 (QR→경농 사이트)","qrSource":"http://www.knco.co.kr/knco/productSap2025View.php?skskIdx=000000000000500783","cropUsage":{"감(단감포함)":[{"target":"둥근무늬낙엽병","method":"6월 상순부터 10일간격 경엽처리","amount":"2,000배","safety":"수확30일전","times":"4회"},{"target":"탄저병","method":"6월 상순부터 10일간격 경엽처리","amount":"2,000배","safety":"수확30일전","times":"4회"}],"고추":[{"target":"갈색점무늬병","method":"발생초기 10일간격 경엽처리","amount":"2,000배","safety":"수확5일전","times":"2회"}],"고추(단고추류포함)":[{"target":"탄저병","method":"발병초 10일간격 경엽처리","amount":"2,000배","safety":"수확5일전","times":"2회"},{"target":"탄저병(무인항공기)","method":"발병초 10일간격 경엽처리(무인항공)","amount":"16배","safety":"수확3일전","times":"3회"}],"단고추류":[{"target":"갈색점무늬병","method":"발생초기 10일간격 경엽처리","amount":"2,000배","safety":"수확5일전","times":"2회"}],"당근":[{"target":"검은잎마름병","method":"발생초기 20일간격 경엽처리","amount":"2,000배","safety":"수확7일전","times":"3회"}],"딸기":[{"target":"흰가루병","method":"발병초 10일간격 경엽처리","amount":"2,000배","safety":"수확3일전","times":"3회"},{"target":"탄저병(육묘상)","method":"발병초 7일간격 경엽처리(육묘상)","amount":"2,000배","safety":"수확3일전","times":"3회"}],"마늘":[{"target":"흑색썩음균핵병","method":"월동후 관주처리","amount":"1,000배","safety":"월동직후","times":"1회"},{"target":"흑색썩음균핵병","method":"파종전 토양처리","amount":"1,000배","safety":"파종기","times":"1회"},{"target":"잎마름병(무인항공기)","method":"발병초 10일간격 경엽처리(무인항공)","amount":"16배","safety":"수확7일전","times":"1회"}],"매실":[{"target":"탄저병","method":"발병초 10일간격 경엽처리","amount":"2,000배","safety":"수확7일전","times":"4회"},{"target":"검은별무늬병","method":"4월중순부터 10일간격 경엽처리","amount":"2,000배","safety":"수확7일전","times":"4회"},{"target":"녹병","method":"발생초기 10일간격 경엽처리","amount":"2,000배","safety":"수확7일전","times":"4회"}],"배":[{"target":"검은별무늬병","method":"발병초 10일간격 경엽처리","amount":"2,000배","safety":"수확14일전","times":"3회"}],"복숭아":[{"target":"잿빛무늬병","method":"발병초 7일간격 경엽처리","amount":"2,000배","safety":"수확7일전","times":"3회"},{"target":"탄저병","method":"발생초기 경엽처리","amount":"2,000배","safety":"수확7일전","times":"3회"}],"사과":[{"target":"탄저병","method":"6월상순부터 10일간격 경엽처리","amount":"2,000배","safety":"수확30일전","times":"5회"},{"target":"점무늬낙엽병","method":"발병초 10일간격 경엽처리","amount":"2,000배","safety":"수확30일전","times":"5회"},{"target":"갈색무늬병","method":"발병초 10일간격 경엽처리","amount":"2,000배","safety":"수확30일전","times":"5회"},{"target":"겹무늬썩음병","method":"6월중순부터 10일간격 경엽처리","amount":"2,000배","safety":"수확30일전","times":"5회"}],"상추":[{"target":"균핵병","method":"발병초 경엽처리","amount":"2,000배","safety":"수확7일전","times":"3회"}],"수박(복수박포함)":[{"target":"덩굴마름병","method":"발병초 7일간격 경엽처리","amount":"2,000배","safety":"수확7일전","times":"3회"}],"양상추":[{"target":"균핵병","method":"발병초 경엽처리","amount":"2,000배","safety":"수확7일전","times":"3회"}],"양앵두(체리)":[{"target":"탄저병","method":"발병초기 10일간격 경엽처리","amount":"2,000배","safety":"수확21일전","times":"3회"}],"양파":[{"target":"잎마름병","method":"발생초기 10일간격 경엽처리","amount":"2,000배","safety":"수확7일전","times":"3회"},{"target":"잎마름병(무인항공기)","method":"발병초 10일간격 경엽처리(무인항공)","amount":"16배","safety":"수확7일전","times":"3회"},{"target":"검은무늬병","method":"발생초기 7일간격 경엽처리","amount":"2,000배","safety":"수확7일전","times":"3회"},{"target":"노균병","method":"발생초기 7일간격 경엽처리","amount":"2,000배","safety":"수확7일전","times":"3회"},{"target":"흑색썩음균핵병","method":"정식전 토양처리","amount":"1,000배","safety":"정식기","times":"1회"}],"오이":[{"target":"흰가루병","method":"발병초 10일간격 경엽처리","amount":"2,000배","safety":"수확2일전","times":"3회"}],"자두":[{"target":"잿빛무늬병","method":"발생초기 7일간격 경엽처리","amount":"2,000배","safety":"수확3일전","times":"3회"},{"target":"주머니병","method":"개화전 및 낙화후 경엽처리","amount":"2,000배","safety":"수확3일전","times":"3회"}],"쪽파":[{"target":"녹병","method":"발생초기 경엽처리","amount":"2,000배","safety":"수확7일전","times":"3회"}],"콩":[{"target":"탄저병(무인항공기)","method":"발병초 10일간격 경엽처리(무인항공)","amount":"16배","safety":"수확21일전","times":"3회"},{"target":"자주무늬병","method":"발병초부터 경엽처리(무인항공)","amount":"32배","safety":"수확21일전","times":"2회"}],"파":[{"target":"녹병","method":"발생초기 경엽처리","amount":"2,000배","safety":"수확7일전","times":"3회"}],"포도":[{"target":"잿빛곰팡이병","method":"발생초기 경엽처리","amount":"2,000배","safety":"수확30일전","times":"3회"},{"target":"갈색무늬병","method":"발병초 10일간격 경엽처리","amount":"2,000배","safety":"수확30일전","times":"3회"},{"target":"탄저병","method":"발병초 10일간격 경엽처리","amount":"2,000배","safety":"수확30일전","times":"3회"},{"target":"새눈무늬병","method":"발병초 7일간격 경엽처리","amount":"2,000배","safety":"수확30일전","times":"3회"}]},"moa":"F-A+F-B","moaName":"SDHI계 + 스트로빌루린","moaColor":"#E91E63","soilUse":false,"maxTimes":4,"microbeSafe":false,"incompatible":["동제","석회유황합제"],"note":"벨리스에스. SDHI+스트로빌루린"}],"fertilizers":[{"id":"f01","no":1,"name":"21-17-17 복합비료","type":"복합비료","ingredient":"N21-P17-K17","effect":"생육 균형 영양 공급","method":"밑거름 또는 웃거름 토양시비","amount":"20~30kg","timing":"정식2주전 밑거름, 생육기 웃거름","note":"범용 복합비료"},{"id":"f02","no":2,"name":"NK비료 12-0-22","type":"복합비료","ingredient":"N12-K22","effect":"착색·당도 향상, 칼리 보강","method":"웃거름 토양시비","amount":"10~15kg","timing":"과실 비대기~착색기 (7~8월)","note":"착색·당도 전용"},{"id":"f03","no":3,"name":"유안복합 15-15-15","type":"복합비료","ingredient":"N15-P15-K15","effect":"균형 생육 촉진","method":"밑거름 또는 웃거름","amount":"20~25kg","timing":"전 생육기","note":"범용 균형비료"},{"id":"f04","no":4,"name":"수용성 복합비료 20-20-20","type":"복합비료","ingredient":"N20-P20-K20","effect":"관비용 균형 비료","method":"물 500배 희석 관수시비","amount":"2~3kg","timing":"생육기 주 1~2회","note":"관비·엽면 겸용"},{"id":"f05","no":5,"name":"하이포넥스 6-10-5","type":"복합비료","ingredient":"N6-P10-K5","effect":"개화·결실 촉진","method":"물 1,000배 엽면시비","amount":"0.5kg","timing":"개화 전·결실기","note":"개화기 특화"},{"id":"f06","no":6,"name":"수퍼비 10-5-8","type":"복합비료","ingredient":"N10-P5-K8","effect":"과실 품질 향상","method":"물 500배 엽면시비","amount":"1kg","timing":"착과기~수확전","note":"과실 전용"},{"id":"f07","no":7,"name":"요소 (Urea)","type":"질소질비료","ingredient":"N 46%","effect":"잎·줄기 생육 촉진, 엽색 개선","method":"0.3~0.5% 엽면시비 또는 토양시비","amount":"2~3kg (엽면)","timing":"생육초~중기 (4~7월)","note":"엽면시비 가장 빠른 효과"},{"id":"f08","no":8,"name":"황산암모늄 (유안)","type":"질소질비료","ingredient":"N21%, S24%","effect":"질소+유황 공급, 토양 산성화","method":"밑거름 또는 웃거름","amount":"30~40kg","timing":"봄·가을 밑거름","note":"블루베리 산성 선호 작물에 적합"},{"id":"f09","no":9,"name":"질산암모늄칼슘","type":"질소질비료","ingredient":"N27%, Ca8%","effect":"질소+칼슘 동시 공급","method":"밑거름 또는 웃거름","amount":"20~30kg","timing":"생육기 전반","note":"칼슘 결핍 예방 효과"},{"id":"f10","no":10,"name":"석회질소","type":"질소질비료","ingredient":"N21%, CaO55%","effect":"지효성 질소+토양 살균","method":"밑거름 토양혼화 (독성—피부보호 필수)","amount":"40~60kg","timing":"정식 3주 전","note":"토양 살균 효과 겸용"},{"id":"f11","no":11,"name":"용성인비","type":"인산질비료","ingredient":"P2O5 20%, MgO·SiO2 포함","effect":"뿌리 발달, 개화·결실 촉진","method":"밑거름 토양혼화","amount":"40~60kg","timing":"정식·파종 2~4주 전","note":"완효성. 미리 시비 필수"},{"id":"f12","no":12,"name":"과인산석회","type":"인산질비료","ingredient":"P2O5 17~20%","effect":"개화·결실 촉진, 뿌리 발달","method":"밑거름 토양시비","amount":"30~50kg","timing":"정식·파종 2주 전 밑거름","note":"속효성 인산"},{"id":"f13","no":13,"name":"중과인산석회","type":"인산질비료","ingredient":"P2O5 45%","effect":"고농도 인산 집중 공급","method":"밑거름 소량 토양혼화","amount":"15~25kg","timing":"정식 전 밑거름","note":"소량 고농도. 과용 금지"},{"id":"f14","no":14,"name":"황산칼리","type":"칼리질비료","ingredient":"K2O 50%, S18%","effect":"착색·품질 향상, 염소 민감 작물","method":"밑거름 또는 웃거름","amount":"10~15kg","timing":"밑거름 또는 비대기 (7~8월)","note":"블루베리·딸기 등 추천"},{"id":"f15","no":15,"name":"염화칼리","type":"칼리질비료","ingredient":"K2O 60%","effect":"과실 비대·착색, 병해 저항성","method":"밑거름 또는 웃거름","amount":"10~15kg","timing":"밑거름 또는 착색기","note":"범용. 염소 민감 작물 황산칼리로 대체"},{"id":"f16","no":16,"name":"탄산칼리","type":"칼리질비료","ingredient":"K2O 56%","effect":"알칼리성. 토양 pH 상승","method":"밑거름 토양시비","amount":"8~12kg","timing":"밑거름","note":"산성 토양 교정 겸용"},{"id":"f17","no":17,"name":"우분 퇴비","type":"퇴비·유기질","ingredient":"유기물40%↑, N1~2%, P1%, K1%","effect":"토양 물리성 개선, 지효성 양분","method":"밑거름 토양 전면혼화","amount":"2,000~3,000kg","timing":"정식 3~4주 전 (완숙 필수)","note":"완숙 여부 반드시 확인"},{"id":"f18","no":18,"name":"돈분 퇴비","type":"퇴비·유기질","ingredient":"유기물45%↑, N2~3%, P2%, K1%","effect":"빠른 양분 공급, 토양 개선","method":"밑거름 토양 전면혼화","amount":"1,500~2,000kg","timing":"정식 4주 전","note":"질소 고농도—사용량 조절"},{"id":"f19","no":19,"name":"계분 퇴비","type":"퇴비·유기질","ingredient":"유기물50%↑, N3~5%, P3%, K2%","effect":"빠른 질소·인산 공급","method":"소량 밑거름 혼화","amount":"500~800kg","timing":"정식 4~6주 전","note":"고농도 소량 원칙"},{"id":"f20","no":20,"name":"부엽토","type":"퇴비·유기질","ingredient":"유기물60%↑","effect":"보수력·통기성, 미생물 활성","method":"멀칭 또는 토양혼화","amount":"500~1,000kg","timing":"연중 (특히 가을~이른봄)","note":"블루베리 멀칭 효과 탁월"},{"id":"f21","no":21,"name":"유박 (깻묵)","type":"퇴비·유기질","ingredient":"N5~7%, P2%, K1%","effect":"완효성 질소, 토양미생물 증가","method":"밑거름 토양혼화","amount":"100~150kg","timing":"정식 2~3주 전","note":"지효성. 냄새 강함"},{"id":"f22","no":22,"name":"아주까리 유박","type":"퇴비·유기질","ingredient":"N5%, P2%, K1%","effect":"지효성 질소, 선충 억제","method":"밑거름 토양혼화","amount":"80~120kg","timing":"정식 2주 전","note":"선충 억제 효과"},{"id":"f23","no":23,"name":"어분","type":"퇴비·유기질","ingredient":"N8~10%, P6%","effect":"속효성 질소·인산","method":"밑거름 또는 웃거름","amount":"50~80kg","timing":"정식전 또는 생육초기","note":"속효성 유기질비료"},{"id":"f24","no":24,"name":"골분","type":"퇴비·유기질","ingredient":"N3%, P20%","effect":"인산 공급, 뿌리 발달","method":"밑거름 토양혼화","amount":"50~100kg","timing":"정식 2주 전","note":"인산 유기질"},{"id":"f25","no":25,"name":"혈분","type":"퇴비·유기질","ingredient":"N12~14%","effect":"속효성 고농도 질소","method":"소량 밑거름","amount":"30~50kg","timing":"정식전 또는 생육초기","note":"고농도—소량 사용 원칙"},{"id":"f26","no":26,"name":"아미노산 비료","type":"퇴비·유기질","ingredient":"아미노산 복합, N3~5%","effect":"생육 촉진, 품질 향상, 스트레스 경감","method":"500~1,000배 엽면시비 또는 관수","amount":"1~2kg (엽면)","timing":"전 생육기 수시","note":"약해 없음. 빈번한 시비 가능"},{"id":"f27","no":27,"name":"해조류 추출물","type":"퇴비·유기질","ingredient":"사이토카이닌·오옥신·알긴산","effect":"뿌리 발달, 개화 촉진, 과실 비대","method":"500~1,000배 엽면시비","amount":"0.5~1kg","timing":"정식후~개화기, 비대기","note":"천연 생장 조절 물질"},{"id":"f28","no":28,"name":"붕사 (붕소)","type":"미량요소","ingredient":"B 11%","effect":"화분 발아, 결실 향상, 열과 방지","method":"0.1~0.2% 엽면시비","amount":"0.1~0.2kg","timing":"개화 전·개화기","note":"과량 시 약해. 소량 정밀","cropUsage":{"블루베리":[{"target":"결실 향상·화분 발아","method":"0.1% 엽면시비","amount":"0.1% (1,000배)","safety":"수확 전","times":"개화 전·개화기"}],"무화과":[{"target":"착과율 향상","method":"0.1% 엽면시비","amount":"0.1%","safety":"수확 전","times":"개화기"}],"감나무":[{"target":"낙과 방지","method":"0.1% 엽면시비","amount":"0.1%","safety":"수확 전","times":"개화기~착과기"}],"사과":[{"target":"열과·낙과 방지","method":"0.1~0.2% 엽면시비","amount":"0.1~0.2%","safety":"수확 전","times":"개화 전"}]}},{"id":"f29","no":29,"name":"황산아연","type":"미량요소","ingredient":"Zn 35%","effect":"새잎 황화 방지, 효소 활성화","method":"0.2~0.3% 엽면시비 또는 토양시비","amount":"0.2kg (엽면)","timing":"생육기 결핍 증상 발현 시","note":"아연결핍(새잎황화) 방지"},{"id":"f30","no":30,"name":"황산망간","type":"미량요소","ingredient":"Mn 32%","effect":"광합성 효소 보조, 엽록소 합성","method":"0.2~0.3% 엽면시비","amount":"0.2kg (엽면)","timing":"생육기 결핍 시","note":"결핍시 엽맥사이 황화"},{"id":"f31","no":31,"name":"황산철","type":"미량요소","ingredient":"Fe 20%","effect":"엽록소 합성, 철 결핍 황화 교정","method":"0.1~0.2% 엽면시비","amount":"0.1kg (엽면)","timing":"새잎 황화 발생 시","note":"중성·알칼리 토양 결핍 多"},{"id":"f32","no":32,"name":"몰리브덴","type":"미량요소","ingredient":"Mo 39%","effect":"질소 동화 효소, 콩류 뿌리혹 형성","method":"0.05~0.1% 엽면시비","amount":"극소량","timing":"파종기 또는 생육초기","note":"두류 고정 필수 원소"},{"id":"f33","no":33,"name":"구리 (황산동)","type":"미량요소","ingredient":"Cu 25%","effect":"살균 효과, 효소 활성화","method":"0.1~0.2% 엽면시비","amount":"0.1kg (엽면)","timing":"생육기 결핍 시","note":"살균 겸용. 과량 축적 주의"},{"id":"f34","no":34,"name":"칼슘 엽면제","type":"미량요소","ingredient":"Ca 15% (질산칼슘형)","effect":"세포벽 강화, 배꼽썩음병 예방","method":"0.3~0.5% 엽면시비","amount":"0.5~1kg","timing":"과실 비대기~착색기","note":"토마토·고추 배꼽썩음병 예방","cropUsage":{"토마토":[{"target":"배꼽썩음병 예방","method":"0.3~0.5% 엽면시비","amount":"500배 희석","safety":"수확 전 3일","times":"과실 비대기"}],"고추":[{"target":"배꼽썩음병 예방","method":"0.3~0.5% 엽면시비","amount":"500배 희석","safety":"수확 전 2일","times":"착과 후"}],"딸기":[{"target":"칼슘 결핍 예방","method":"엽면시비","amount":"700배 희석","safety":"수확 전","times":"주 1회"}],"사과":[{"target":"고두현상 예방","method":"엽면시비","amount":"500배 희석","safety":"수확 전","times":"과실 비대기~착색기"}],"배":[{"target":"코르크스팟 예방","method":"엽면시비","amount":"500배 희석","safety":"수확 전","times":"과실 비대기"}],"블루베리":[{"target":"과실 품질 향상","method":"엽면시비","amount":"700배 희석","safety":"수확 전","times":"착과 후"}]}},{"id":"f35","no":35,"name":"고토석회","type":"석회·토양개량","ingredient":"CaO 50%↑, MgO 15%↑","effect":"토양 pH 교정, 칼슘·마그네슘 보충","method":"밑거름 전 토양살포 후 경운","amount":"100~200kg","timing":"정식·파종 2~4주 전 우선시비","note":"비료와 동시 시비 금지"},{"id":"f36","no":36,"name":"소석회","type":"석회·토양개량","ingredient":"CaO 70%↑","effect":"토양 pH 강력 교정, 살균","method":"극소량. 비료 시비 최소 2주 후","amount":"50~100kg","timing":"가을 토양 소독 후","note":"강한 알칼리. 소량 사용"},{"id":"f37","no":37,"name":"황토 석회황","type":"석회·토양개량","ingredient":"S+Ca 복합","effect":"토양 살균, 응애·깍지벌레 방제","method":"500~800배 수피 도포 또는 경엽살포","amount":"희석 사용","timing":"낙엽후~발아전 (11~3월)","note":"생육기 사용 금지"},{"id":"f38","no":38,"name":"피트모스","type":"석회·토양개량","ingredient":"유기물90%↑, pH 3.5~4.5","effect":"토양 산성화, 보수력 향상","method":"식재 전 토양혼화","amount":"10~20L/주","timing":"식재 전 (블루베리 필수)","note":"블루베리 pH 4.5~5.5 필수"},{"id":"f39","no":39,"name":"펄라이트","type":"석회·토양개량","ingredient":"무기질 경량골재","effect":"배수성·통기성 향상","method":"토양 혼화 (20~30%)","amount":"10~20%","timing":"식재 전 토양 개량","note":"점질 토양 개량 효과"},{"id":"f40","no":40,"name":"훈탄 (왕겨숯)","type":"석회·토양개량","ingredient":"규산·탄소","effect":"토양 통기성, 미생물 활성","method":"토양혼화 또는 멀칭","amount":"100~200kg","timing":"정식 전 또는 멀칭 용","note":"규산 공급. 미생물 서식 촉진"},{"id":"f41","no":41,"name":"게르마늄토","type":"석회·토양개량","ingredient":"게르마늄·미네랄 복합","effect":"항산화·품질 향상, 토양 미생물 활성화","method":"밑거름 토양혼화","amount":"10~20kg","timing":"정식 전","note":"기능성 농산물 생산용"},{"id":"f42","no":42,"name":"규산질비료","type":"석회·토양개량","ingredient":"SiO2 30%↑","effect":"줄기·잎 강화, 도복 방지, 병해 저항","method":"밑거름 토양시비","amount":"60~100kg","timing":"정식·파종 전","note":"벼·과채류 병해 저항성 향상"},{"id":"f43","no":43,"name":"버미큘라이트","type":"석회·토양개량","ingredient":"무기질 경량골재","effect":"보수성·통기성 균형 향상","method":"토양혼화 (10~20%)","amount":"5~10%","timing":"육묘·식재 전 토양개량","note":"육묘상에도 효과"},{"id":"f44","no":44,"name":"미생물 토양활성제","type":"석회·토양개량","ingredient":"바실루스·트리코데르마 복합","effect":"토양 유익균 증식, 뿌리 생육 향상","method":"정식시 토양관주 또는 관수","amount":"500~1,000배","timing":"정식후 주 1회 초기 3회","note":"화학비료 감량 가능"},{"id":"f45","no":45,"name":"세라믹볼 (제오라이트)","type":"석회·토양개량","ingredient":"제오라이트 미네랄","effect":"비료 흡착·완충, 토양 양이온 교환","method":"토양혼화","amount":"100~200kg","timing":"정식 전","note":"비료 흡착으로 비료 절감"},{"id":"f46","no":46,"name":"코이어 더스트","type":"석회·토양개량","ingredient":"코코넛 껍질 섬유","effect":"보수력·통기성 향상, pH 6.0 중성","method":"토양혼화 또는 멀칭","amount":"100~200kg","timing":"식재 전 또는 멀칭용","note":"피트모스 대체재. pH 중성"},{"id":"f47","no":47,"name":"황 (S)","type":"석회·토양개량","ingredient":"S 90%","effect":"토양 산성화, 살균 효과","method":"밑거름 토양혼화","amount":"10~30kg","timing":"식재 전","note":"블루베리 pH 낮추기용"},{"id":"f48","no":48,"name":"단한번비료","type":"복합비료","ingredient":"N22-P9-K9 완효성","effect":"완효성 균형 생육 촉진","method":"밑거름 토양시비","amount":"20~30kg","timing":"3·4·8·9·10월 밑거름","note":"완효성. 한 번 시비로 지속 효과"},{"id":"f49","no":49,"name":"엔케이플러스","type":"복합비료","ingredient":"N17-K17 착과추비","effect":"착과·비대기 질소+칼리 보강","method":"웃거름 토양시비","amount":"10~15kg","timing":"5~9월 착과 후 추비","note":"착과추비 전용. 인산 미포함"},{"id":"f50","no":50,"name":"원예맞춤고추비료","type":"복합비료","ingredient":"N12-P6-K12+Ca·Mg","effect":"고추 전용 균형 비료+칼슘·마그네슘","method":"밑거름+웃거름 토양시비","amount":"20~25kg","timing":"5~8월 생육기 전반","note":"고추 전용. 칼슘·마그네슘 결핍 예방"},{"id":"f51","no":51,"name":"일회만비료","type":"복합비료","ingredient":"N21-P9-K9 완효성","effect":"완효성 균형 생육","method":"밑거름 1회 시비","amount":"20~30kg","timing":"3·4·8~11월 밑거름","note":"완효성 1회 시비"},{"id":"f52","no":52,"name":"슈퍼복합비료","type":"복합비료","ingredient":"N21-P17-K17 균형형","effect":"생육 균형 영양 공급","method":"밑거름 또는 웃거름","amount":"20~30kg","timing":"3~5·8~10월 밑거름+웃거름","note":"범용 균형 복합비료. 수퍼비 강화형"},{"id":"f53","no":53,"name":"가축분퇴비(부숙완료)","type":"퇴비·유기질","ingredient":"유기물40%↑, N1~2%","effect":"토양 물리성 개선, 지효성 양분","method":"밑거름 토양 전면혼화","amount":"2,000~3,000kg","timing":"정식·파종 15~20일 전 밑거름","note":"부숙 완료 확인 필수. 전작물 적용"},{"id":"f54","no":54,"name":"튼튼한 칼슘제","brand":"청년농부의","type":"미량요소","ingredient":"유기칼슘 100%, 붕소+미네랄+다당류","effect":"무릎현상·고두현상 예방, 당도·색깔·저장성 향상, 칼슘 결핍 빠른 회복","method":"엽면시비 또는 관주","amount":"1,000배~500배 희석","timing":"칼슘 결핍 우려시, 10~14일 간격","note":"과수류·과채류·엽채류·근채류 광범위 적용. 500ml/병. 쿠팡(농대나온남자) 구매","cropUsage":{"과수류,과채류,엽채류,근채류":[{"target":"칼슘 결핍·무릎현상·고두현상","method":"엽면 또는 관주","amount":"1,000배~500배","safety":"수확 전 사용 가능 (비농약)","times":"10~14일 간격"}],"블루베리":[{"target":"칼슘 결핍·과실 품질 향상","method":"엽면시비","amount":"1,000배 희석","safety":"수확 전 사용 가능","times":"10~14일 간격"}],"무화과":[{"target":"칼슘 결핍·저장성 향상","method":"엽면시비","amount":"800배~500배 희석","safety":"수확 전 사용 가능","times":"10~14일 간격"}],"감나무":[{"target":"고두현상 예방·당도 향상","method":"엽면시비","amount":"1,000배 희석","safety":"수확 전 사용 가능","times":"착과 후 10~14일 간격"}]}},{"id":"f55","no":55,"name":"트라포스 모빌","brand":"Rovensa Next (로벤자 넥스트)","type":"미량요소","category":"바이오영양제","ingredient":"수용성 인산(P2O5) 28.5%, 수용성 칼륨(K2O) 29.2%, 수용성 붕소(B2O3) 1.4%, 수용성 몰리브덴(Mo) 0.7%","effect":"개화·착과 향상, 내병성·당도 증진, 봄철 생장 촉진, 붕소 확보로 착과율 향상","feature":"100% 수용성, 침투이행성(잎·뿌리 흡수), 몰리브덴 질소고정 촉진, 모든 작물 적용 가능","method":"엽면시비 또는 점적관수(드립)","amount":"제조사 권장 희석비율 준수 (엽면·관주 겸용)","timing":"봄철 생장기, 개화 전~착과기, 내병성 향상 필요시","note":"공급: Rovensa Next Korea. 문의: info.korea@rovensanext.com","url":"https://www.rovensanext.kr/바이오영양제/트라포스-모빌","cropUsage":{"과수류 전반":[{"target":"개화·착과 향상, 당도 증진","method":"엽면시비 또는 점적관수","amount":"권장희석비","safety":"수확 전 사용 가능","times":"개화 전~착과기"}],"블루베리":[{"target":"개화·착과율 향상, 봄철 생장 촉진","method":"엽면시비","amount":"권장희석비","safety":"수확 전","times":"봄철 신초 발생기~개화 전"}],"무화과":[{"target":"당도·품질 향상, 내병성 증진","method":"엽면시비 또는 관주","amount":"권장희석비","safety":"수확 전","times":"착과기~비대기"}],"감나무":[{"target":"착과율 향상, 낙과 방지, 당도 증진","method":"엽면시비","amount":"권장희석비","safety":"수확 전","times":"개화 전~착과기"}]}}],"plants":[{"id":"plant_001","no":1,"name":"다래 일세","emoji":"🍇","location":"1이랑 1구역","category":"유실수","plantDate":"","note":"경계 0m"},{"id":"plant_002","no":2,"name":"다래 레몬프레시","emoji":"🍇","location":"1이랑 1구역","category":"유실수","plantDate":"","note":"경계 2m"},{"id":"plant_003","no":3,"name":"다래 참다래(키위)","emoji":"🍇","location":"1이랑 1구역","category":"유실수","plantDate":"","note":"경계 4m"},{"id":"plant_004","no":4,"name":"다래 용성2호","emoji":"🍇","location":"1이랑 1구역","category":"유실수","plantDate":"","note":"경계 6m"},{"id":"plant_005","no":5,"name":"으름 토종","emoji":"🌿","location":"1이랑 1구역","category":"유실수","plantDate":"","note":"경계 8m"},{"id":"plant_006","no":6,"name":"으름 슈퍼대실","emoji":"🌿","location":"1이랑 1구역","category":"유실수","plantDate":"","note":"경계 10m"},{"id":"plant_007","no":7,"name":"으름 백화대실","emoji":"🌿","location":"1이랑 1구역","category":"유실수","plantDate":"","note":"경계 12m"},{"id":"plant_008","no":8,"name":"으름 홍화대실","emoji":"🌿","location":"1이랑 1구역","category":"유실수","plantDate":"","note":"경계 14m"},{"id":"plant_009","no":9,"name":"보우짱 단호박①","emoji":"🎃","location":"1이랑 1구역","category":"채소","plantDate":"","note":"고랑①"},{"id":"plant_010","no":10,"name":"블랙망고수박","emoji":"🍉","location":"1이랑 1구역","category":"채소","plantDate":"","note":"고랑②"},{"id":"plant_011","no":11,"name":"애플수박","emoji":"🍉","location":"1이랑 1구역","category":"채소","plantDate":"","note":"고랑③"},{"id":"plant_012","no":12,"name":"자몽애플수박","emoji":"🍉","location":"1이랑 1구역","category":"채소","plantDate":"","note":"고랑④"},{"id":"plant_013","no":13,"name":"흑피애플미니꼬꼬마수박①","emoji":"🍉","location":"1이랑 1구역","category":"채소","plantDate":"","note":"고랑⑤"},{"id":"plant_014","no":14,"name":"흑피애플미니꼬꼬마수박②","emoji":"🍉","location":"1이랑 1구역","category":"채소","plantDate":"","note":"고랑⑥"},{"id":"plant_015","no":15,"name":"애플미니꼬꼬마수박①","emoji":"🍉","location":"1이랑 1구역","category":"채소","plantDate":"","note":"고랑⑦"},{"id":"plant_016","no":16,"name":"애플미니꼬꼬마수박②","emoji":"🍉","location":"1이랑 1구역","category":"채소","plantDate":"","note":"고랑⑧"},{"id":"plant_017","no":17,"name":"보우짱 단호박②","emoji":"🎃","location":"1이랑 1구역","category":"채소","plantDate":"","note":"고랑⑨"},{"id":"plant_018","no":18,"name":"접목수박","emoji":"🍉","location":"1이랑 1구역","category":"채소","plantDate":"","note":"고랑⑪→⑩유인"},{"id":"plant_019","no":19,"name":"블랙베리(슈퍼복분자)","emoji":"🫐","location":"2이랑 1구역","category":"유실수","plantDate":"","note":"기둥 전체"},{"id":"plant_020","no":20,"name":"복분자","emoji":"🫐","location":"2이랑 1구역","category":"유실수","plantDate":"","note":"19·21m"},{"id":"plant_021","no":21,"name":"애호박①","emoji":"🟢","location":"2이랑 1구역","category":"채소","plantDate":"","note":"고랑①"},{"id":"plant_022","no":22,"name":"백다다기오이","emoji":"🥒","location":"2이랑 1구역","category":"채소","plantDate":"","note":"고랑②"},{"id":"plant_023","no":23,"name":"쿠카멜론①","emoji":"🥒","location":"2이랑 1구역","category":"채소","plantDate":"","note":"고랑③"},{"id":"plant_024","no":24,"name":"쿠카멜론②","emoji":"🥒","location":"2이랑 1구역","category":"채소","plantDate":"","note":"고랑④"},{"id":"plant_025","no":25,"name":"망고참외","emoji":"🍈","location":"2이랑 1구역","category":"채소","plantDate":"","note":"고랑⑤"},{"id":"plant_026","no":26,"name":"꿀참외","emoji":"🍈","location":"2이랑 1구역","category":"채소","plantDate":"","note":"고랑⑥"},{"id":"plant_027","no":27,"name":"맷돌호박①","emoji":"🎃","location":"2이랑 1구역","category":"채소","plantDate":"","note":"고랑⑦"},{"id":"plant_028","no":28,"name":"맷돌호박②","emoji":"🎃","location":"2이랑 1구역","category":"채소","plantDate":"","note":"고랑⑧"},{"id":"plant_029","no":29,"name":"애호박②","emoji":"🟢","location":"2이랑 1구역","category":"채소","plantDate":"","note":"고랑⑨"},{"id":"plant_030","no":30,"name":"바이오체리","emoji":"🍒","location":"3이랑 1구역","category":"유실수","plantDate":"","note":"0~2m"},{"id":"plant_031","no":31,"name":"머루포도(MBA)","emoji":"🍇","location":"3이랑 1구역","category":"유실수","plantDate":"","note":"2~4m"},{"id":"plant_032","no":32,"name":"양파","emoji":"🧅","location":"3이랑 1구역","category":"채소","plantDate":"","note":"4~13m"},{"id":"plant_033","no":33,"name":"마늘(3이랑)","emoji":"🧄","location":"3이랑 1구역","category":"채소","plantDate":"","note":"13~22m"},{"id":"plant_034","no":34,"name":"동부(마늘 후작)","emoji":"🫘","location":"3이랑 1구역","category":"채소","plantDate":"","note":"4~22m(후작)"},{"id":"plant_035","no":35,"name":"고구마","emoji":"🍠","location":"A·B이랑 사이구역","category":"채소","plantDate":"","note":"전체 2열 140주"},{"id":"plant_036","no":36,"name":"감자(봄재배)","emoji":"🥔","location":"C·D이랑 사이구역","category":"채소","plantDate":"","note":"전체"},{"id":"plant_037","no":37,"name":"배추(가을)","emoji":"🥬","location":"C·D이랑 사이구역","category":"채소","plantDate":"","note":"전체(후작)"},{"id":"plant_038","no":38,"name":"선비잡이콩","emoji":"🫘","location":"1이랑 2구역","category":"채소","plantDate":"","note":"전체 15m"},{"id":"plant_039","no":39,"name":"개구리참외","emoji":"🍈","location":"2이랑 2구역","category":"채소","plantDate":"","note":"0~2m"},{"id":"plant_040","no":40,"name":"베타카로틴참외","emoji":"🍈","location":"2이랑 2구역","category":"채소","plantDate":"","note":"2~4m"},{"id":"plant_041","no":41,"name":"사과참외","emoji":"🍈","location":"2이랑 2구역","category":"채소","plantDate":"","note":"4~6m"},{"id":"plant_042","no":42,"name":"망고수박①","emoji":"🍉","location":"2이랑 2구역","category":"채소","plantDate":"","note":"6~8.6m"},{"id":"plant_043","no":43,"name":"망고수박②","emoji":"🍉","location":"2이랑 2구역","category":"채소","plantDate":"","note":"8.6~11.2m"},{"id":"plant_044","no":44,"name":"망고수박③","emoji":"🍉","location":"2이랑 2구역","category":"채소","plantDate":"","note":"11.2~13m"},{"id":"plant_045","no":45,"name":"접목애플수박①","emoji":"🍉","location":"2이랑 2구역","category":"채소","plantDate":"","note":"13~14.6m"},{"id":"plant_046","no":46,"name":"마늘(2이랑 후작)","emoji":"🧄","location":"2이랑 2구역","category":"채소","plantDate":"","note":"전체(후작)"},{"id":"plant_047","no":47,"name":"머루콩","emoji":"🫘","location":"3이랑 2구역","category":"채소","plantDate":"","note":"전체 13.4m"},{"id":"plant_048","no":48,"name":"헤이즐넛 바르셀로나","emoji":"🌰","location":"3이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_049","no":49,"name":"헤이즐넛 초거대향","emoji":"🌰","location":"3이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_050","no":50,"name":"황근대","emoji":"🌿","location":"4이랑 2구역","category":"채소","plantDate":"","note":"0~5.5m"},{"id":"plant_051","no":51,"name":"청근대","emoji":"🌿","location":"4이랑 2구역","category":"채소","plantDate":"","note":"0~5.5m"},{"id":"plant_052","no":52,"name":"복수박①","emoji":"🍉","location":"4이랑 2구역","category":"채소","plantDate":"","note":"5.5~7.5m"},{"id":"plant_053","no":53,"name":"복수박②","emoji":"🍉","location":"4이랑 2구역","category":"채소","plantDate":"","note":"7.5~9.5m"},{"id":"plant_054","no":54,"name":"접목애플수박②","emoji":"🍉","location":"4이랑 2구역","category":"채소","plantDate":"","note":"9.5~11m"},{"id":"plant_055","no":55,"name":"김장무","emoji":"🥕","location":"4이랑 2구역","category":"채소","plantDate":"","note":"전체(8/20)"},{"id":"plant_056","no":56,"name":"남고 매실","emoji":"🌸","location":"5이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_057","no":57,"name":"노천 매실","emoji":"🌸","location":"5이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_058","no":58,"name":"마르멜로(서양모과)","emoji":"🍋","location":"5이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_059","no":59,"name":"모과(대실모과)","emoji":"🍋","location":"5이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_060","no":60,"name":"어수리(5이랑)","emoji":"🌿","location":"5이랑 2구역","category":"채소","plantDate":"","note":"6포기"},{"id":"plant_061","no":61,"name":"양파(6이랑)","emoji":"🧅","location":"6이랑 2구역","category":"채소","plantDate":"","note":"전체(9월정식)"},{"id":"plant_062","no":62,"name":"앵두(대홍앵)","emoji":"🍒","location":"7이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_063","no":63,"name":"백살구","emoji":"🍑","location":"7이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_064","no":64,"name":"B360살구","emoji":"🍑","location":"7이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_065","no":65,"name":"토종생강","emoji":"🌿","location":"7이랑 2구역","category":"채소","plantDate":"","note":"0~1.5m"},{"id":"plant_066","no":66,"name":"개량생강","emoji":"🌿","location":"7이랑 2구역","category":"채소","plantDate":"","note":"4~9.6m"},{"id":"plant_067","no":67,"name":"어수리(7이랑)","emoji":"🌿","location":"7이랑 2구역","category":"채소","plantDate":"","note":"3포기"},{"id":"plant_068","no":68,"name":"곤드레(7이랑)","emoji":"🌿","location":"7이랑 2구역","category":"채소","plantDate":"","note":"3포기"},{"id":"plant_069","no":69,"name":"황근대(7이랑)","emoji":"🌿","location":"7이랑 2구역","category":"채소","plantDate":"","note":"5포기"},{"id":"plant_070","no":70,"name":"청근대(7이랑)","emoji":"🌿","location":"7이랑 2구역","category":"채소","plantDate":"","note":"4포기"},{"id":"plant_071","no":71,"name":"바질","emoji":"🌿","location":"7이랑 2구역","category":"채소","plantDate":"","note":"5포기"},{"id":"plant_072","no":72,"name":"대천황살구(킹코트)","emoji":"🍑","location":"8이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_073","no":73,"name":"어수리(8이랑)","emoji":"🌿","location":"8이랑 2구역","category":"채소","plantDate":"","note":"3포기"},{"id":"plant_074","no":74,"name":"곤드레(8이랑)","emoji":"🌿","location":"8이랑 2구역","category":"채소","plantDate":"","note":"4포기"},{"id":"plant_075","no":75,"name":"킹코트살구(하코트)","emoji":"🍑","location":"9이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_076","no":76,"name":"하코드살구","emoji":"🍑","location":"9이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_077","no":77,"name":"어수리(9이랑)","emoji":"🌿","location":"9이랑 2구역","category":"채소","plantDate":"","note":"4포기"},{"id":"plant_078","no":78,"name":"곤드레(9이랑)","emoji":"🌿","location":"9이랑 2구역","category":"채소","plantDate":"","note":"3포기"},{"id":"plant_079","no":79,"name":"나가노신구 사과","emoji":"🍎","location":"10이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_080","no":80,"name":"돌고 사과","emoji":"🍎","location":"10이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_081","no":81,"name":"아리수 사과","emoji":"🍎","location":"10이랑 2구역","category":"유실수","plantDate":"","note":"묘목"},{"id":"plant_082","no":82,"name":"어수리(10이랑)","emoji":"🌿","location":"10이랑 2구역","category":"채소","plantDate":"","note":"3포기"},{"id":"plant_083","no":83,"name":"무화과 시카고하디","emoji":"🍈","location":"온실 내부 온실","category":"유실수","plantDate":"","note":"화분"},{"id":"plant_084","no":84,"name":"무화과 롱다우트","emoji":"🍈","location":"온실 내부 온실","category":"유실수","plantDate":"","note":"화분"},{"id":"plant_085","no":85,"name":"무화과 바나네","emoji":"🍈","location":"온실 내부 온실","category":"유실수","plantDate":"","note":"화분"},{"id":"plant_086","no":86,"name":"무화과 피코튬","emoji":"🍈","location":"온실 내부 온실","category":"유실수","plantDate":"","note":"화분"},{"id":"plant_087","no":87,"name":"블루베리 패트리오트","emoji":"🫐","location":"온실 앞 온실","category":"유실수","plantDate":"","note":"10주"},{"id":"plant_088","no":88,"name":"땅콩","emoji":"🌱","location":"직접입력","category":"재배중","plantDate":"2026-05-12","fruitDays":60,"totalDays":120,"note":""},{"id":"plant_089","no":89,"name":"머루콩","emoji":"🌱","location":"직접입력","category":"재배중","plantDate":"2026-05-01","fruitDays":60,"totalDays":120,"note":""},{"id":"plant_090","no":90,"name":"선비잡이콩","emoji":"🌱","location":"직접입력","category":"재배중","plantDate":"2026-05-01","fruitDays":60,"totalDays":120,"note":""},{"id":"plant_091","no":91,"name":"토종생강","emoji":"🌿","location":"2구역 7이랑","category":"재배중","plantDate":"2026-05-01","totalDays":155,"note":""},{"id":"plant_092","no":92,"name":"개량생강","emoji":"🌿","location":"2구역 7이랑","category":"재배중","plantDate":"2026-05-01","totalDays":155,"note":""},{"id":"plant_093","no":93,"name":"아주까리","emoji":"🌱","location":"직접입력","category":"재배중","plantDate":"2026-05-04","fruitDays":60,"totalDays":120,"note":""},{"id":"plant_094","no":94,"name":"토마토","emoji":"🌱","location":"직접입력","category":"재배중","plantDate":"2026-05-09","fruitDays":60,"totalDays":120,"note":""},{"id":"plant_095","no":95,"name":"블랙망고수박","emoji":"🍉","location":"1구역 1이랑 고랑②","category":"재배중","plantDate":"2026-05-09","fruitDays":45,"pinchDays":15,"totalDays":75,"note":""},{"id":"plant_096","no":96,"name":"애플수박","emoji":"🍉","location":"1구역 1이랑 고랑③","category":"재배중","plantDate":"2026-05-09","fruitDays":45,"pinchDays":15,"totalDays":75,"note":""},{"id":"plant_097","no":97,"name":"접목수박","emoji":"🍉","location":"1구역 1이랑 고랑⑪","category":"재배중","plantDate":"2026-05-09","fruitDays":55,"pinchDays":18,"totalDays":90,"note":""},{"id":"plant_098","no":98,"name":"망고수박①","emoji":"🍉","location":"2구역 2이랑","category":"재배중","plantDate":"2026-05-09","fruitDays":50,"pinchDays":15,"totalDays":80,"note":""},{"id":"plant_099","no":99,"name":"망고참외","emoji":"🍈","location":"1구역 2이랑 고랑⑤","category":"재배중","plantDate":"2026-05-09","fruitDays":45,"pinchDays":12,"totalDays":75,"note":""},{"id":"plant_100","no":100,"name":"개구리참외","emoji":"🍈","location":"2구역 2이랑","category":"재배중","plantDate":"2026-05-09","fruitDays":50,"pinchDays":12,"totalDays":80,"note":""},{"id":"plant_101","no":101,"name":"백다다기오이","emoji":"🥒","location":"1구역 2이랑 고랑②","category":"재배중","plantDate":"2026-05-09","fruitDays":28,"pinchDays":7,"totalDays":50,"note":""},{"id":"plant_102","no":102,"name":"쿠카멜론①","emoji":"🥒","location":"1구역 2이랑 고랑③","category":"재배중","plantDate":"2026-05-09","fruitDays":35,"pinchDays":7,"totalDays":55,"note":""},{"id":"plant_103","no":103,"name":"미니단호박보우짱①","emoji":"🎃","location":"1구역 1이랑 고랑①","category":"재배중","plantDate":"2026-05-09","fruitDays":55,"pinchDays":18,"totalDays":95,"note":""},{"id":"plant_104","no":104,"name":"애호박①","emoji":"🟢","location":"1구역 2이랑 고랑①","category":"재배중","plantDate":"2026-05-09","fruitDays":28,"pinchDays":7,"totalDays":45,"note":""},{"id":"plant_105","no":105,"name":"맷돌호박①","emoji":"🎃","location":"1구역 2이랑 고랑⑦","category":"재배중","plantDate":"2026-05-09","fruitDays":65,"pinchDays":18,"totalDays":110,"note":""},{"id":"plant_106","no":106,"name":"맷돌호박②","emoji":"🎃","location":"1구역 2이랑 고랑⑧","category":"재배중","plantDate":"2026-05-09","fruitDays":65,"pinchDays":18,"totalDays":110,"note":""},{"id":"plant_107","no":107,"name":"고구마","emoji":"🍠","location":"사이구역 A·B이랑","category":"재배중","plantDate":"2026-05-14","pinchDays":20,"totalDays":125,"note":""},{"id":"plant_108","no":108,"name":"작두콩","emoji":"🌱","location":"직접입력","category":"재배중","plantDate":"2026-05-15","fruitDays":60,"totalDays":120,"note":""},{"id":"plant_109","no":109,"name":"고구마(2차)","emoji":"🌱","location":"직접입력","category":"재배중","plantDate":"2026-05-24","fruitDays":60,"totalDays":120,"note":""},{"id":"plant_110","no":110,"name":"열무","emoji":"🌱","location":"직접입력","category":"재배중","plantDate":"2026-06-14","fruitDays":60,"totalDays":120,"note":""},{"id":"plant_111","no":111,"name":"시금치","emoji":"🌱","location":"직접입력","category":"재배중","plantDate":"2026-06-14","fruitDays":60,"totalDays":120,"note":""},{"id":"plant_112","no":112,"name":"동부콩","emoji":"🌱","location":"직접입력","category":"재배중","plantDate":"2026-06-16","fruitDays":60,"totalDays":120,"note":""},{"id":"plant_113","no":113,"name":"옥수수","emoji":"🌱","location":"직접입력","category":"재배중","plantDate":"2026-06-12","fruitDays":60,"totalDays":120,"note":"하우스 안 모종"},{"id":"plant_114","no":114,"name":"아주까리콩 파종","emoji":"🫘","location":"Firebase 기록","category":"재배중","plantDate":"2026-05-05","totalDays":120,"note":""}],"spraySchedule":[{"crop":"사과","pesticide":"스트레이트","pestType":"살충제","interval":"7~10일 간격","preharvest":"수확 14일 전","target":"진딧물·나방류"},{"crop":"사과","pesticide":"라이몬","pestType":"살충제","interval":"10~14일 간격","preharvest":"수확 14일 전","target":"나방류·총채벌레"},{"crop":"사과","pesticide":"델란","pestType":"살균제","interval":"7~14일 간격","preharvest":"수확 21일 전","target":"흑성병·탄저병"},{"crop":"사과","pesticide":"다코닐","pestType":"살균제","interval":"7~10일 간격","preharvest":"수확 21일 전","target":"탄저·겹무늬썩음병"},{"crop":"사과","pesticide":"마구퍼져","pestType":"비선택성 제초제","interval":"연 2~3회","preharvest":"직접 살포 금지","target":"잡초 방제"},{"crop":"배","pesticide":"스트레이트","pestType":"살충제","interval":"7~10일 간격","preharvest":"수확 14일 전","target":"진딧물·나방류"},{"crop":"배","pesticide":"델란","pestType":"살균제","interval":"7~14일 간격","preharvest":"수확 21일 전","target":"흑성병·갈색무늬병"},{"crop":"복숭아","pesticide":"스트레이트","pestType":"살충제","interval":"7~10일 간격","preharvest":"수확 14일 전","target":"복숭아순나방·진딧물"},{"crop":"복숭아","pesticide":"델란","pestType":"살균제","interval":"10일 간격","preharvest":"수확 21일 전","target":"탄저병·갈색무늬병"},{"crop":"포도","pesticide":"라이몬","pestType":"살충제","interval":"10일 간격","preharvest":"수확 21일 전","target":"유리나방"},{"crop":"포도","pesticide":"오티바","pestType":"살균제","interval":"10~14일 간격","preharvest":"수확 21일 전","target":"노균병·탄저병"},{"crop":"블루베리","pesticide":"스트레이트","pestType":"살충제","interval":"7~10일 간격","preharvest":"수확 14일 전","target":"진딧물·총채벌레"},{"crop":"블루베리","pesticide":"라이몬","pestType":"살충제","interval":"7~10일 간격","preharvest":"수확 7일 전","target":"총채벌레·혹파리"},{"crop":"블루베리","pesticide":"델란","pestType":"살균제","interval":"10~14일 간격","preharvest":"수확 14일 전","target":"탄저병·잿빛곰팡이"},{"crop":"딸기","pesticide":"로브랄","pestType":"살균제","interval":"7~10일 간격","preharvest":"수확 3일 전","target":"잿빛곰팡이·균핵병"},{"crop":"감","pesticide":"스트레이트","pestType":"살충제","interval":"7~10일 간격","preharvest":"수확 14일 전","target":"나방류·진딧물"},{"crop":"매실","pesticide":"라이몬","pestType":"살충제","interval":"10일 간격","preharvest":"수확 14일 전","target":"복숭아순나방"},{"crop":"토마토","pesticide":"말뚝","pestType":"토양살충제","interval":"1회(정식전)","preharvest":"수확 45일 전","target":"굼벵이·거세미"},{"crop":"토마토","pesticide":"스트레이트","pestType":"살충제","interval":"7일 간격","preharvest":"수확 3일 전","target":"온실가루이·총채벌레"},{"crop":"토마토","pesticide":"라이몬","pestType":"살충제","interval":"7일 간격","preharvest":"수확 3일 전","target":"온실가루이·나방"},{"crop":"토마토","pesticide":"리도밀골드","pestType":"살균제","interval":"7~10일 간격","preharvest":"수확 3일 전","target":"역병 전문 방제"},{"crop":"고추","pesticide":"말뚝","pestType":"토양살충제","interval":"1회(정식전)","preharvest":"수확 45일 전","target":"굼벵이·거세미"},{"crop":"고추","pesticide":"스트레이트","pestType":"살충제","interval":"7일 간격","preharvest":"수확 3일 전","target":"담배가루이·총채벌레"},{"crop":"고추","pesticide":"다코닐","pestType":"살균제","interval":"7~10일 간격","preharvest":"수확 7일 전","target":"탄저병·역병 예방"},{"crop":"오이","pesticide":"말뚝","pestType":"토양살충제","interval":"1회(정식전)","preharvest":"수확 30일 전","target":"굼벵이"},{"crop":"오이","pesticide":"오티바","pestType":"살균제","interval":"7~10일 간격","preharvest":"수확 3일 전","target":"노균병·역병"},{"crop":"수박","pesticide":"스트레이트","pestType":"살충제","interval":"7~10일 간격","preharvest":"수확 7일 전","target":"진딧물·온실가루이"},{"crop":"수박","pesticide":"다코닐","pestType":"살균제","interval":"7~10일 간격","preharvest":"수확 7일 전","target":"탄저병·덩굴마름병"},{"crop":"고구마","pesticide":"말뚝","pestType":"토양살충제","interval":"1회(정식전)","preharvest":"수확 45일 전","target":"굼벵이·거세미"},{"crop":"고구마","pesticide":"라이몬","pestType":"살충제","interval":"10일 간격","preharvest":"수확 14일 전","target":"뿔나방"},{"crop":"콩","pesticide":"말뚝","pestType":"토양살충제","interval":"1회(파종전)","preharvest":"수확 45일 전","target":"굼벵이·거세미"},{"crop":"콩","pesticide":"라이몬","pestType":"살충제","interval":"7일 간격","preharvest":"수확 14일 전","target":"거세미나방"},{"crop":"옥수수","pesticide":"말뚝","pestType":"토양살충제","interval":"1회(파종전)","preharvest":"수확 30일 전","target":"굼벵이·거세미"},{"crop":"옥수수","pesticide":"스트레이트","pestType":"살충제","interval":"7~10일 간격","preharvest":"수확 14일 전","target":"조명나방"},{"crop":"감자","pesticide":"말뚝","pestType":"토양살충제","interval":"1회(파종전)","preharvest":"수확 30일 전","target":"굼벵이"},{"crop":"감자","pesticide":"리도밀골드","pestType":"살균제","interval":"7~10일 간격","preharvest":"수확 14일 전","target":"역병 전문"}],"fertSchedule":[{"crop":"사과·배","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"연 1회","amount":"2,000~3,000kg","desc":"수확후 또는 이른봄. 완숙 필수"},{"crop":"사과·배","fertilizer":"고토석회","fertType":"석회·토양개량","interval":"2~3년 1회","amount":"100~200kg","desc":"비료 시비 2주 전 우선 시비"},{"crop":"사과·배","fertilizer":"21-17-17","fertType":"복합비료","interval":"2회 웃거름","amount":"20~30kg/회","desc":"밑거름+낙화후+비대기 웃거름"},{"crop":"사과·배","fertilizer":"NK비료","fertType":"복합비료","interval":"착색기 2회","amount":"10~15kg/회","desc":"착색 시작 시 2회. 당도 향상"},{"crop":"사과·배","fertilizer":"요소","fertType":"질소질비료","interval":"30일 간격","amount":"2~3kg 0.3%","desc":"잎 황화 시 엽면시비"},{"crop":"블루베리","fertilizer":"피트모스","fertType":"석회·토양개량","interval":"식재전 1회","amount":"10~20L/주","desc":"식재전 필수. pH4.5~5.5 유지"},{"crop":"블루베리","fertilizer":"황 (S)","fertType":"석회·토양개량","interval":"연 1회","amount":"10~20kg","desc":"pH 낮추기. 피트모스와 병행"},{"crop":"블루베리","fertilizer":"황산암모늄","fertType":"질소질비료","interval":"2~3회","amount":"10~15kg/회","desc":"산성 질소. 요소보다 황산암모늄 권장"},{"crop":"블루베리","fertilizer":"황산칼리","fertType":"칼리질비료","interval":"착색기 2회","amount":"8~10kg/회","desc":"염소 민감. 염화칼리 자제"},{"crop":"블루베리","fertilizer":"붕사","fertType":"미량요소","interval":"개화전 1회","amount":"0.1~0.2kg 0.1%엽면","desc":"결실율 향상"},{"crop":"복숭아·자두","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"연 1회","amount":"2,000kg","desc":"수확후 밑거름"},{"crop":"복숭아·자두","fertilizer":"21-17-17","fertType":"복합비료","interval":"2회 웃거름","amount":"20kg/회","desc":"밑거름+낙화후+비대기"},{"crop":"포도","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"연 1회","amount":"2,000kg","desc":"수확후 또는 이른봄"},{"crop":"포도","fertilizer":"21-17-17","fertType":"복합비료","interval":"2회 웃거름","amount":"20kg/회","desc":"발아기+비대기"},{"crop":"감·매실·무화과","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"연 1회","amount":"1,500~2,000kg","desc":"가을 밑거름"},{"crop":"감·매실·무화과","fertilizer":"21-17-17","fertType":"복합비료","interval":"1~2회","amount":"20kg/회","desc":"밑거름+비대기"},{"crop":"토마토","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"정식전 1회","amount":"2,000kg","desc":"정식3주전 완숙퇴비"},{"crop":"토마토","fertilizer":"21-17-17","fertType":"복합비료","interval":"3주 간격","amount":"20kg/회","desc":"밑거름+3주 간격 웃거름"},{"crop":"토마토","fertilizer":"칼슘엽면제","fertType":"미량요소","interval":"2주 간격","amount":"0.5kg 0.3%엽면","desc":"착과후 배꼽썩음병 예방"},{"crop":"고추","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"정식전 1회","amount":"2,000kg","desc":"완숙퇴비 필수"},{"crop":"고추","fertilizer":"21-17-17","fertType":"복합비료","interval":"3주 간격","amount":"20kg/회","desc":"착과후 칼리 추가"},{"crop":"오이","fertilizer":"21-17-17","fertType":"복합비료","interval":"2주 간격","amount":"15~20kg/회","desc":"단기작. 잦은 웃거름"},{"crop":"수박","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"정식전 1회","amount":"2,000~3,000kg","desc":"밑거름 위주 재배"},{"crop":"수박","fertilizer":"21-17-17","fertType":"복합비료","interval":"1~2회","amount":"20kg/회","desc":"착과 확인 후 최소 웃거름"},{"crop":"수박","fertilizer":"NK비료","fertType":"복합비료","interval":"비대기 1회","amount":"10kg/회","desc":"착과후 칼리 보강"},{"crop":"참외·호박","fertilizer":"21-17-17","fertType":"복합비료","interval":"3주 간격","amount":"20kg/회","desc":""},{"crop":"콩·팥","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"파종전 1회","amount":"1,000~1,500kg","desc":"질소 소량. 인산·칼리 위주"},{"crop":"콩·팥","fertilizer":"용성인비","fertType":"인산질비료","interval":"파종전 1회","amount":"40kg","desc":"뿌리혹 형성 촉진"},{"crop":"옥수수","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"파종전 1회","amount":"2,000kg","desc":""},{"crop":"옥수수","fertilizer":"21-17-17","fertType":"복합비료","interval":"2회 웃거름","amount":"25kg/회","desc":"줄기신장기+이삭기 웃거름"},{"crop":"옥수수","fertilizer":"요소","fertType":"질소질비료","interval":"2회 토양시비","amount":"5kg/회","desc":"질소 요구량 높음"},{"crop":"감자","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"파종전 1회","amount":"1,500~2,000kg","desc":""},{"crop":"감자","fertilizer":"21-17-17","fertType":"복합비료","interval":"1~2회","amount":"25kg/회","desc":"밑거름 위주. 웃거름 최소화"},{"crop":"고구마","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"정식전 1회","amount":"1,000~1,500kg","desc":"질소 과다 시 덩굴웃자람"},{"crop":"고구마","fertilizer":"용성인비","fertType":"인산질비료","interval":"정식전 1회","amount":"40kg","desc":"뿌리 발달 촉진"},{"crop":"배추","fertilizer":"우분퇴비","fertType":"퇴비·유기질","interval":"정식전 1회","amount":"1,500~2,000kg","desc":""},{"crop":"배추","fertilizer":"21-17-17","fertType":"복합비료","interval":"2주 간격","amount":"15~20kg/회","desc":"결구기 질소 집중"},{"crop":"양파·마늘","fertilizer":"21-17-17","fertType":"복합비료","interval":"1개월 간격","amount":"20kg/회","desc":"구 비대기 칼리 추가"},{"crop":"대파·상추","fertilizer":"21-17-17","fertType":"복합비료","interval":"2주 간격","amount":"15kg/회","desc":"잦은 수확에 맞춰 웃거름"}],"microbes":[{"id":"m01","name":"고초균 (Bacillus subtilis)","emoji":"🌾","type":"세균 (호기성)","source":"농업기술센터 무료배부","aka":"바실러스, 고초균(枯草菌)","effect":["탄저병·시들음병·흰가루병 병원균 항생물질로 억제","유해균 생육 억제 — 이투린(Iturin) 등 항균물질 생성","난분해성 유기물 분해 · 퇴비 부숙 촉진","토양 입단화 촉진 — 땅심 향상","키티나제(효소) 분비 — 파리·응애 유충 억제","잎 색이 선명해지고 엽육 두꺼워짐"],"method":"엽면살포 또는 토양 관주","dilution":"200~500배 희석 (물 1,000L당 미생물 2~5L)","interval":"7~14일 간격","timing":"병 발생 전 예방 위주. 봄~가을 생육기 전반","storage":"5℃ 냉장 보관. 직사광선 차단. 수령 후 가급적 빠른 사용","applicableCrops":["블루베리","무화과","감나무","과수류 전반","채소류"],"incompatibleWith":["동제(수산화동·황산구리)","클로로탈로닐(다코닐)","만코제브(만코지·앤트라콜)","이프로디온(로브랄)","벤레이트(베노밀)","석회유황합제","캡탄","강산성·강알칼리성 농약"],"safeMixWith":["유산균","광합성균","효모균","트리코더마","스피노사드","에마멕틴"],"waitAfterChem":3,"waitNote":"살균제 살포 후 3일 이상 경과 후 사용. 동제·석회유황 후 7일 이상","tip":"딸기·블루베리 흰가루병에 20배 희석 엽면 살포 시 효과 확인(논산시농기센터)","commercial":["세레나(바이엘)","싹쓰리(경농)","바실러스WP"]},{"id":"m02","name":"광합성균 (Rhodopseudomonas)","emoji":"☀️","type":"세균 (혐기성·호기암 조건)","source":"농업기술센터 무료배부","aka":"광합성세균, PSB","effect":["공기 중 질소 고정 — 작물 생육에 이용 가능한 양분으로 전환","비타민·아미노산·생장촉진물질(옥신·사이토키닌) 생성","시설재배지 염류 장해·연작 장해 해소","가스 장해(유해가스) 제거","착색·당도 향상, 저장성 향상","악취 유발물질 제거 (축산 환경 개선)"],"method":"엽면살포 또는 토양 관주 (과수: 광합성균+혼합균 10L/600평/2주)","dilution":"200~500배 희석","interval":"2주 간격","timing":"생육 전반. 연작지나 시설재배지 특히 효과적","storage":"5℃ 냉장 보관. 암소 보관 중요(빛에 약함)","applicableCrops":["블루베리","무화과","감나무","과수류 전반","시설재배 전체"],"incompatibleWith":["동제","강산성 농약 (pH 4 이하)","강알칼리성 농약"],"safeMixWith":["고초균","유산균","효모균"],"waitAfterChem":3,"waitNote":"화학살균제 살포 후 3일 이상 경과 후 사용","tip":"과수 배부기준: 광합성균 + 혼합균 10L/600평/2주 (영천 농업기술센터 기준)","commercial":["EM 제제","광합성균 원액"]},{"id":"m03","name":"유산균 (Lactobacillus)","emoji":"🥛","type":"세균 (젖산균)","source":"농업기술센터 무료배부","aka":"젖산균, LAB","effect":["인산 가용화 — 토양 내 불용성 인산을 식물 흡수 가능 형태로 전환","유기물 발효·분해 촉진 — 퇴비 발효 시 특히 유용","유해 병원균 억제 (젖산 생성으로 산성 환경 조성)","효모균과 혼용 시 효과 증진 (상호 보완)","토양 유기물 분해 촉진 — 땅심 향상"],"method":"토양 관주 또는 엽면살포","dilution":"200~500배 희석","interval":"7~14일 간격","timing":"생육 전반. 퇴비 발효 시 원액 첨가","storage":"5℃ 냉장 보관","applicableCrops":["블루베리","무화과","감나무","과수류 전반","채소류 전반"],"incompatibleWith":["동제","석회유황합제","강알칼리성 농약"],"safeMixWith":["고초균","효모균","광합성균"],"waitAfterChem":3,"waitNote":"살균제 살포 후 3일 이상 경과 후 사용","tip":"효모균과 혼합 사용 시 시너지 효과. 퇴비 발효 시 원액 첨가 가능","commercial":["락토바실러스 제제","EM배양액"]},{"id":"m04","name":"효모균 (Saccharomyces)","emoji":"🍞","type":"진균 (곰팡이류)","source":"농업기술센터 무료배부","aka":"사카로미세스, 이스트균","effect":["난분해성 유기물 가용화 — 땅심 증진","생리 활성물질 분비 — 뿌리 생장 촉진","유산균과 혼용 시 효과 증진 (상호 보완 관계)","산소 유무와 관계없이 성장 가능 (혐기·호기 모두 적응)","pH 범위가 넓어 다양한 토양 조건에서 활동 가능"],"method":"토양 관주 또는 엽면살포","dilution":"200~500배 희석","interval":"7~14일 간격","timing":"생육 전반. 유산균과 함께 사용 시 효과 상승","storage":"5℃ 냉장 보관. 열에 약함(55℃ 이상 사멸)","applicableCrops":["블루베리","무화과","감나무","과수류 전반","채소류 전반"],"incompatibleWith":["동제","강살균성 농약","고온(55℃ 이상) 처리 병행 불가"],"safeMixWith":["유산균","광합성균","고초균"],"waitAfterChem":3,"waitNote":"화학살균제 살포 후 3일 이상 경과 후 사용","tip":"유산균+효모균 혼합은 가장 기본적인 복합 미생물 조합","commercial":["효모균 제제","EM 복합균"]},{"id":"m05","name":"트리코더마 (Trichoderma spp.)","emoji":"🍄","type":"진균 (사상균·길항균)","source":"상업 구매","aka":"트리코더마균, 길항균","effect":["토양병원균 직접 기생·용해 — 역병·잘록병·흰비단병균 사멸","항생물질 분비로 병원균 억제","뿌리 활성화 — 식물 면역력(SAR) 유도","키틴 분해효소 생성 — 선충·해충 억제","유기물 분해 촉진 — 인산 가용화"],"method":"토양 혼화 또는 관주처리","dilution":"1,000배 희석 또는 제품 표시량","interval":"정식 전 1회 또는 생육기 2~3회","timing":"정식 전 토양 처리 또는 병 발생 초기","storage":"상온 보관 가능 (균사체 분제). 습기 차단","applicableCrops":["블루베리","무화과","감나무","딸기","고추","토마토"],"incompatibleWith":["동제","클로로탈로닐(다코닐)","이프로디온(로브랄)","만코제브","벤레이트","석회유황합제","캡탄","티람"],"safeMixWith":["고초균","유산균","곤충병원성선충"],"waitAfterChem":7,"waitNote":"살균제 살포 후 최소 7일 이상 경과 후 처리","tip":"블루베리 화분 정식 시 뿌리 주변 토양 혼화로 뿌리썩음병 예방 효과","commercial":["트리코더마WG(그린바이오)","트리코맥스","에코호프"]},{"id":"m06","name":"곤충병원성선충 (Steinernema/Heterorhabditis)","emoji":"🪱","type":"선충 (생물살충)","source":"상업 구매","aka":"엔토모병원성선충, 생물적 방제제","effect":["뿌리파리 유충·굼벵이·나방류 유충 방제","선충이 해충 체내에 침입 → 공생세균이 해충 사멸","잔류 없음 — 친환경 인증 가능"],"method":"토양 관주 (뿌리 주변). 저녁 시간 관주 권장","dilution":"1억 마리/㎡ (제품 표시량)","interval":"해충 발생 초기 1~2회","timing":"해충 발생 초기. 저녁 또는 흐린 날 처리","storage":"냉장 보관(5~10℃). 직사광선 금지. 즉시 사용","applicableCrops":["블루베리","무화과","감나무","화분 재배 전체"],"incompatibleWith":["카보퓨란(데푸콘)","에토프로포스(모캡)","클로르피리포스(코르도반)","포레이트(토갑)","카보설판(세베로)","강산성 농약"],"safeMixWith":["고초균","트리코더마"],"waitAfterChem":14,"waitNote":"토양살충제 처리 후 14일 이상 경과 후 사용","tip":"관주 후 즉시 물을 추가 공급하여 선충이 토양 깊이 침투하도록 유도","commercial":["네마킬(세스코)","스타이너마","바이오컨트롤"]},{"id":"m07","name":"EM(유용미생물군) 복합균","emoji":"🌿","type":"복합미생물 (광합성균+유산균 등)","source":"상업 구매 또는 농업기술센터","aka":"Effective Microorganisms, EM균","effect":["광합성균·유산균 등 유익균 복합 조합","토양 유기물 분해·양분 공급 종합 효과","악취 제거, 토양 환경 개선","작물 면역력·생육 촉진 전반"],"method":"토양 관주 또는 엽면살포","dilution":"500~1,000배 희석 (제품별 상이)","interval":"7~14일 간격","timing":"생육 전반. 정식 전~수확 전","storage":"5℃ 냉장 보관","applicableCrops":["블루베리","무화과","감나무","과수류 전반","채소류 전반"],"incompatibleWith":["동제","석회유황합제","강산성·강알칼리성 농약","클로로탈로닐"],"safeMixWith":["단독 또는 고초균과 혼합 가능"],"waitAfterChem":3,"waitNote":"화학살균제 살포 후 3일 이상 경과 후 사용","tip":"농업기술센터 공급 혼합균과 동일 개념. 자가 배양 시 쌀뜨물+당밀로 증식 가능","commercial":["EM원액(EM코리아)","유용미생물복합제","파워EM"]}]};

async function callClaude(messages, maxTokens, imageBase64, imageMediaType) {
  
  var key = localStorage.getItem('claude_api_key') || '';
  if (!key && typeof CLAUDE_API_KEY !== 'undefined' && CLAUDE_API_KEY && !CLAUDE_API_KEY.includes('여기에') && CLAUDE_API_KEY !== '') {
    key = CLAUDE_API_KEY;
  }
  if (!key) {
    return { ok: false, error: 'API_KEY_MISSING' };
  }

  
  var msgContent = [];
  if (imageBase64 && imageMediaType) {
    msgContent.push({
      type: 'image',
      source: { type: 'base64', media_type: imageMediaType, data: imageBase64 }
    });
  }
  if (typeof messages === 'string') {
    msgContent.push({ type: 'text', text: messages });
  } else {
    msgContent = msgContent.concat(messages);
  }

  // GAS 중계 (CORS 우회)
  var _gasUrl2 = (typeof getEffectiveGasUrl==='function') ? getEffectiveGasUrl() : '';
  if (_gasUrl2) {
    try {
      var _p2 = (typeof msgContent==='string') ? msgContent : msgContent.map(function(c){return c.text||'';}).join('');
      var _r2 = await fetch(_gasUrl2, {method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({action:'claude_relay',apiKey:key,prompt:_p2,maxTokens:maxTokens||1000})});
      var _d2 = await _r2.json();
      if (_d2&&_d2.ok) return {ok:true,text:_d2.text||''};
      if (_d2&&_d2.error&&!_d2.error.includes('CORS')) return {ok:false,error:_d2.error};
    } catch(e2) {}
  }

  try {
    var resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':            'application/json',
        'x-api-key':               key,
        'anthropic-version':       '2023-06-01',
        'anthropic-dangerous-request-bypass-prompt-injection': '1',
      },
      body: JSON.stringify({
        model:      'claude-sonnet-4-6',
        max_tokens: maxTokens || 1000,
        messages:   [{ role: 'user', content: msgContent }],
      })
    });

    if (!resp.ok) {
      var errJson = await resp.json().catch(function(){ return {}; });
      var errMsg  = (errJson.error && errJson.error.message) || ('HTTP ' + resp.status);
      return { ok: false, error: errMsg };
    }

    var data = await resp.json();
    var text = (data.content || []).map(function(b){ return b.text || ''; }).join('');
    return { ok: true, text: text };

  } catch(e) {
    
    var msg = e.message || String(e);
    if (msg.includes('Load failed') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return { ok: false, error: 'CORS_OR_NETWORK' };
    }
    return { ok: false, error: msg };
  }
}

function aiErrorMsg(error) {
  if (error === 'API_KEY_MISSING') {
    return '<div class="ai-error-box">'
      + '<b>🔑 Claude API Key 미설정</b><br>'
      + 'AI 기능을 사용하려면 HTML 파일 상단의 <code>CLAUDE_API_KEY</code>에<br>'
      + '<a href="https://console.anthropic.com" target="_blank">console.anthropic.com</a>에서 발급한 API Key를 입력하세요.<br>'
      + '<span style="font-size:10px;color:var(--gray-400);">예: sk-ant-api03-...</span>'
      + '</div>';
  }
  if (error === 'CORS_OR_NETWORK') {
    return '<div class="ai-error-box">'
      + '<b>🌐 네트워크 오류 (CORS)</b><br>'
      + '브라우저 보안 정책으로 API 직접 호출이 차단됐습니다.<br>'
      + '<b>해결 방법:</b><br>'
      + '① Chrome 확장: <a href="https://chrome.google.com/webstore/detail/allow-cors/lifkjlojflekabbmlddfccdkphlelmim" target="_blank">Allow CORS</a> 설치 후 활성화<br>'
      + '② 또는 VS Code <a href="https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer" target="_blank">Live Server</a>로 파일 열기<br>'
      + '③ 또는 터미널: <code>npx serve .</code> 후 localhost로 접속'
      + '</div>';
  }
  return '<div class="ai-error-box">AI 오류: ' + esc(error) + '</div>';
}

function parseAiJson(text) {
  try {
    return JSON.parse(text.replace(/```json|```/g,'').trim());
  } catch(e) {
    var m = text.match(/\{[\s\S]*\}/);
    if (m) {
      try { return JSON.parse(m[0]); } catch(e2) {}
    }
    return null;
  }
}

// ── Firebase를 안 쓰므로 에러 방지용 가짜(Mock) db 객체 생성 ─────────────
var db = {
  collection: function(colName) {
    return {
      doc: function(docId) {
        return {
          set: async function(data) { console.log('🔥 [Firebase 미사용] set 생략:', colName, docId); return {}; },
          update: async function(data) { console.log('🔥 [Firebase 미사용] update 생략:', colName, docId); return {}; },
          delete: async function() { console.log('🔥 [Firebase 미사용] delete 생략:', colName, docId); return {}; },
          get: async function() { return { exists: false, data: function() { return {}; } }; }
        };
      },
      add: async function(data) { 
        console.log('🔥 [Firebase 미사용] add 생략:', colName); 
        return { id: 'mock_' + Date.now() }; 
      },
      get: async function() { return { docs: [] }; }
    };
  },
  batch: function() {
    return { set: function(){}, update: function(){}, delete: function(){}, commit: async function(){} };
  }
};

var APP = {
  plants: [],
  doneTasks: {},
  logs: [],
  filter: 'all',
  plantFilter: 'all',
  dbTab: 'pest',
  pendingTaskMeta: null,
};

var TODAY = new Date();
TODAY.setHours(0,0,0,0);
function fmt(d){ return d.getFullYear()+'-'+pad(d.getMonth()+1)+'-'+pad(d.getDate()); }
var TODAY_STR = fmt(TODAY);
function pad(n){ return n<10?'0'+n:''+n; }
function toYMD(d){ if(!d) return ''; var dt=new Date(d); if(isNaN(dt.getTime())) return ''; return dt.getFullYear()+'-'+pad(dt.getMonth()+1)+'-'+pad(dt.getDate()); }
function addDays(d,n){
  if(!d) return new Date();
  var r = (d instanceof Date) ? new Date(d) : new Date(d);
  if(isNaN(r.getTime())) return new Date();
  r.setDate(r.getDate()+(parseInt(n)||0));
  return r;
}
function daysBetween(a,b){
  if(!a||!b) return 0;
  var ta = (a instanceof Date)?a.getTime():new Date(a).getTime();
  var tb = (b instanceof Date)?b.getTime():new Date(b).getTime();
  if(isNaN(ta)||isNaN(tb)) return 0;
  return Math.round((tb-ta)/(1000*60*60*24));
}
function parseDate(s){
  if(!s||s===''||s==='undefined'||s==='null') return null;
  try {
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(!m) return null;
    var d = new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]));
    return isNaN(d.getTime()) ? null : d;
  } catch(e) { return null; }
}
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

// ── Google Sheets (공유 OrchardData) 연결 설정 ─────────────
// index.html / index1.html 공유 스프레드시트
const SHARED_SHEET_ID = '12cRWUcZah1z3DaZq5aJcojV8m3J5UU3m2F2ux6GwCec';
// GAS URL (index1 전용 — 공유 스프레드시트에 접근)
let GAS_URL = localStorage.getItem('_runtimeGasUrl') ||
              'https://script.google.com/macros/s/AKfycbwXbgptSmUJ8vhr_crTAsnbMhoSPzronQdJNWfLN2z7xaJpb-k3Pr8Ts9aNjfqKDI4b/exec';

async function _gasPost(params) {
  try {
    var p = new URLSearchParams();
    for (var k in params) p.append(k, params[k] == null ? '' : params[k]);
    var res = await fetch(GAS_URL, { method: 'POST', body: p });
    if (!res.ok) throw new Error('GAS HTTP ' + res.status);
    var json = await res.json();
    if (json && typeof json === 'object' && 'success' in json) {
      if (!json.success) {
        console.warn('[_gasPost] GAS 오류:', json.message || '알 수 없는 오류', params.action||'');
        return json;
      }
      if (json.data && json.data.id) return json.data;
      return json;
    }
    return json;
  } catch(e) {
    console.warn('[_gasPost] 네트워크 오류:', e.message, params && params.action ? params.action : '');
    return { success: false, error: e.message };
  }
}

async function _gasGet(action, extra) {
  var url = GAS_URL + '?action=' + encodeURIComponent(action);
  if (extra) for (var k in extra) url += '&' + k + '=' + encodeURIComponent(extra[k]||'');
  var res = await fetch(url + '&t=' + Date.now());
  if (!res.ok) throw new Error('GAS HTTP ' + res.status);
  var json;
  try { json = await res.json(); }
  catch(e) { console.warn('[_gasGet] JSON 파싱 실패:', e.message); return []; }
  var data = (json && typeof json === 'object' && 'success' in json && 'data' in json)
    ? json.data : json;
  if (Array.isArray(data)) {
    var NUM_FIELDS = ['no','totalDays','pinchDays','fruitDays','pollDays',
                      'qty','quantity','amount','price','count'];
    var DATE_FIELDS2 = ['dateStr','plantDate','addedDate','date','pollDate',
                        'lastSprayDate','lastFertDate','createdAt','updatedAt','registeredAt'];
    var DATE_FIELDS = ['plantDate','pollDate','lastSprayDate','lastFertDate',
                       'registeredAt','updatedAt','createdAt','doneAt'];
    data = data.map(function(row) {
      var out = {};
      for (var k in row) {
        var v = row[k];
        if (v == null) { out[k] = ''; continue; }
        if (k === 'id' || k === '_key' || k === 'key') {
          out[k] = String(v);
        }
        else if (k === 'time') {
          var sv = String(v||'');
          if (sv.includes('1899') || (sv.includes('T') && sv.length > 10)) {
            var tm = sv.match(/T(\d{2}:\d{2})/);
            out[k] = tm ? tm[1] : '';
          } else if (typeof v === 'number' && v > 0 && v < 1) {
            var totalMin = Math.round(v * 24 * 60);
            var hh = Math.floor(totalMin / 60), mm = totalMin % 60;
            out[k] = (hh < 10 ? '0' : '') + hh + ':' + (mm < 10 ? '0' : '') + mm;
          } else {
            out[k] = sv.slice(0, 5);
          }
        }
        else if (DATE_FIELDS2.indexOf(k) >= 0) {
          if (!v || v === '') { out[k] = ''; }
          else if (typeof v === 'number' && v > 40000 && v < 60000) {
            var _d = new Date(Math.round((v - 25569) * 86400 * 1000));
            out[k] = isNaN(_d.getTime()) ? '' : _d.toISOString().slice(0, 10);
          } else {
            var _s = String(v);
            if (_s.includes('T')) _s = _s.slice(0, 10);
            if (/^\d{3}-\d{2}-\d{2}/.test(_s)) _s = '2' + _s;
            out[k] = _s.slice(0, 10);
          }
        }
        else if (NUM_FIELDS.indexOf(k) >= 0) {
          out[k] = v === '' ? 0 : Number(v) || 0;
        }
        else if (DATE_FIELDS.indexOf(k) >= 0) {
          try {
            if (!v || v === '') { out[k] = ''; continue; }
            if (typeof v === 'number') {
              if (v > 40000 && v < 60000) {
                var d = new Date(Math.round((v - 25569) * 86400 * 1000));
                if (!isNaN(d.getTime())) {
                  out[k] = d.toISOString().slice(0, 10);
                } else { out[k] = ''; }
              } else { out[k] = ''; }
            } else {
              var s = String(v);
              if (/^\d{3}-\d{2}-\d{2}/.test(s)) s = '2' + s;
              var dateMatch = s.match(/(\d{4}-\d{2}-\d{2})/);
              out[k] = dateMatch ? dateMatch[1] : '';
            }
          } catch(dateErr) { out[k] = ''; }
        }
        else {
          out[k] = typeof v === 'number' ? v : (v === '' ? '' : String(v));
        }
      }
      return out;
    });
  }
  return data;
}

// ── 화면 디버그 패널 (임시) ───────────────────────────────────────
(function() {
  var panel = document.createElement('div');
  panel.id = 'dbg-panel';
  panel.style.cssText = 'position:fixed;bottom:0;left:0;right:0;max-height:200px;overflow-y:auto;' +
    'background:rgba(0,0,0,0.85);color:#0f0;font-size:10px;font-family:monospace;' +
    'padding:4px;z-index:99999;display:none';
  document.body.appendChild(panel);
  var btn = document.createElement('button');
  btn.textContent = '🔍 디버그';
  btn.style.cssText = 'position:fixed;bottom:4px;right:4px;z-index:100000;' +
    'padding:4px 8px;background:#333;color:#fff;border:none;border-radius:4px;font-size:11px;cursor:pointer';
  btn.onclick = function(){ panel.style.display = panel.style.display==='none'?'block':'none'; };
  document.body.appendChild(btn);
  var _origLog = console.log.bind(console);
  var _origWarn = console.warn.bind(console);
  function addLine(type, args) {
    var line = document.createElement('div');
    line.style.color = type==='warn'?'#ff0':'#0f0';
    line.textContent = (type==='warn'?'⚠️ ':'') +
      Array.from(args).map(function(a){
        try{ return typeof a==='object'?JSON.stringify(a).slice(0,120):String(a); }catch(e){return String(a);}
      }).join(' ');
    panel.appendChild(line);
    panel.scrollTop = panel.scrollHeight;
    if (panel.children.length > 100) panel.removeChild(panel.firstChild);
  }
  console.log = function() { _origLog.apply(console, arguments); addLine('log', arguments); };
  console.warn = function() { _origWarn.apply(console, arguments); addLine('warn', arguments); };
})();

function initGAS() {
  console.log('🔖 index1-app.js 버전: 2026-07-25-v4 (mock db 적용본)');
  var dbgEl = document.getElementById('early-debug');
  function dbgLog(msg, color) {
    console.log('[initGAS] ' + msg);
    if (dbgEl) {
      var line = document.createElement('div');
      line.style.color = color || '#0ff';
      line.textContent = '[initGAS] ' + msg;
      dbgEl.appendChild(line);
    }
  }
  dbgLog('④ initGAS() 실행됨');
  document.getElementById('loading').classList.remove('hidden');
  setLoadingStep(0, 5, '앱 초기화 중...');
  if (typeof GAS_OCR_URL !== 'undefined' && GAS_OCR_URL &&
      GAS_OCR_URL.includes('script.google.com')) {
    localStorage.setItem('_runtimeGasUrl', GAS_OCR_URL);
    GAS_URL = GAS_OCR_URL;
    _runtimeGasUrl = GAS_OCR_URL;
  } else {
    var saved = localStorage.getItem('_runtimeGasUrl');
    if (saved) GAS_URL = saved;
    _runtimeGasUrl = GAS_URL;
  }
  setLoadingStep(0, 15, 'Google Sheets 연결 중...');
  launchApp();
}

function startApp() { 
    // Firebase를 안 쓰기로 했으므로 바로 initGAS만 실행합니다.
    initGAS(); 
}

// Firestore 내부 연결 오류 메시지 억제
(function() {
  var _origWarn  = console.warn;
  var _origError = console.error;
  var _FB_NOISE = ['WebChannelConnection','transport errored',
                   'Could not reach Cloud Firestore',
                   'operate in offline mode','Connection failed'];
  function _isFbNoise(args) {
    var msg = Array.from(args).join(' ');
    return _FB_NOISE.some(function(k){ return msg.includes(k); });
  }
  console.warn  = function() { if (!_isFbNoise(arguments)) _origWarn.apply(console, arguments); };
  console.error = function() { if (!_isFbNoise(arguments)) _origError.apply(console, arguments); };
})();

function initFirebase(cfg){ initGAS(); }

function showSetupError(msg) {
  console.warn('[Firebase/Setup]', msg);
}

async function seedPlants() {
  var plants = MASTER_DB.plants;
  var chunkSize = 20;  
  for (var i=0; i<plants.length; i+=chunkSize) {
    var chunk = plants.slice(i, i+chunkSize);
    var batch = db.batch();
    chunk.forEach(function(p){
      batch.set(db.collection('plants').doc(p.id), p, {merge:true});
    });
    await batch.commit().catch(function(e){ console.warn('seed chunk',e); });
    
    if (i === 0) {
      APP.plants = chunk.map(function(p){ return Object.assign({},p); });
      renderToday(); renderPlants();
    }
  }
  showToast('식물 DB 초기화 완료 ('+plants.length+'개)');
}

function calcTodayTasks() {
  var sprayMap = {};   
  var fertMap  = {};   
  var taskList = [];   

  var _activeCount = APP.plants.filter(function(p){ return p.status==='active'; }).length;
  var _dateCount   = APP.plants.filter(function(p){ return !!p.plantDate; }).length;
  console.log('[calcTodayTasks] 전체식물:', APP.plants.length,
    '/ status=active:', _activeCount,
    '/ plantDate있음:', _dateCount);
    
  if (APP.plants.length > 0) {
    var _s = APP.plants[0];
    console.log('[calcTodayTasks] 첫식물 샘플 status:', _s.status,
      'plantDate:', _s.plantDate, 'dateStr:', _s.dateStr, 'category:', _s.category);
  }
  APP.plants.forEach(function(plant){
    if (!plant.plantDate || plant.status!=='active') return;
    var planted = parseDate(plant.plantDate);
    if (!planted) return;
    var dfp = daysBetween(planted, TODAY);
    var nm  = plant.name;

    MASTER_DB.spraySchedule.forEach(function(spray){
      var crops = spray.crop.split('·');
      var match = crops.some(function(c){
        return nm.includes(c)||c.includes(nm)||nm.replace(/[①②③④⑤⑥]/g,'').trim().includes(c);
      });
      if (!match) return;
      var intDays = parseInterval(spray.interval);
      if (intDays<=0 || !isInSeason(spray.interval,TODAY)) return;

      var lastLog = APP.logs.find(function(l){
        return (l.plantId===plant.id||((l.plantName||l.plant||'')===nm))
          && l.material===spray.pesticide
          && (l.type==='농약살포'||l.eventType==='농약살포');
      });
      var lastDate    = lastLog ? parseDate((lastLog.date||'').slice(0,10)) : null;
      var daysSince   = lastDate ? daysBetween(lastDate,TODAY) : dfp;
      if (daysSince < intDays) return;

      if (!sprayMap[spray.pesticide]) {
        sprayMap[spray.pesticide] = {
          pesticide: spray.pesticide, pestType: spray.pestType,
          target: spray.target, interval: spray.interval, preharvest: spray.preharvest,
          plants: []
        };
      }
      sprayMap[spray.pesticide].plants.push({
        id:plant.id, name:nm, emoji:plant.emoji||'🌱',
        location:plant.location||'', dfp:dfp, daysSince:daysSince,
        urgent: daysSince>=intDays*1.5
      });
    });

    MASTER_DB.fertSchedule.forEach(function(fert){
      var crops = fert.crop.split('·');
      var match = crops.some(function(c){
        return nm.includes(c)||c.includes(nm)||nm.replace(/[①②③④⑤⑥]/g,'').trim().includes(c);
      });
      if (!match) return;
      var intDays = parseInterval(fert.interval);
      if (intDays<=0 || !isInSeason(fert.interval,TODAY)) return;

      var lastLog = APP.logs.find(function(l){
        return (l.plantId===plant.id||((l.plantName||l.plant||'')===nm))
          && l.material===fert.fertilizer
          && (l.type==='시비'||l.eventType==='시비');
      });
      var lastDate  = lastLog ? parseDate((lastLog.date||'').slice(0,10)) : null;
      var daysSince = lastDate ? daysBetween(lastDate,TODAY) : dfp;
      if (daysSince < intDays) return;

      if (!fertMap[fert.fertilizer]) {
        fertMap[fert.fertilizer] = {
          fertilizer: fert.fertilizer, desc: fert.desc,
          interval: fert.interval, amount: fert.amount,
          plants: []
        };
      }
      fertMap[fert.fertilizer].plants.push({
        id:plant.id, name:nm, emoji:plant.emoji||'🌱',
        location:plant.location||'', dfp:dfp, daysSince:daysSince,
        urgent: false
      });
    });

    if (plant.pollDate && plant.pollDays>0) {
      var polled = parseDate(plant.pollDate);
      var hd     = addDays(polled, plant.pollDays);
      var dLeft  = daysBetween(TODAY, hd);
      if (dLeft<=3 && dLeft>=0) {
        var tk='poll_harvest_'+plant.id+'_'+TODAY_STR;
        taskList.push({
          key:tk, type:'task', groupType:'harvest',
          plantId:plant.id, plantName:nm, emoji:plant.emoji||'🌱', location:plant.location||'',
          action: dLeft===0?'수확 D-day! (착과)':'수확 D-'+dLeft+'일 (착과)',
          subAction:'착과 후 '+daysBetween(polled,TODAY)+'일째',
          urgent:dLeft<=1, dfp:dfp, done:!!APP.doneTasks[tk],
        });
      }
    }

    if (plant.fruitDays>0) {
      var dL2 = plant.fruitDays - dfp;
      if (dL2<=7 && dL2>=0) {
        var tk2='fruit_'+plant.id+'_'+TODAY_STR;
        taskList.push({
          key:tk2, type:'task', groupType:'harvest',
          plantId:plant.id, plantName:nm, emoji:plant.emoji||'🌱', location:plant.location||'',
          action: dL2===0?'수확 D-day!':'수확 D-'+dL2+'일',
          subAction:'심은 후 '+(plant.fruitDays-dL2)+'/'+plant.fruitDays+'일',
          urgent:dL2<=2, dfp:dfp, done:!!APP.doneTasks[tk2],
        });
      }
    }

    if (plant.pinchDays>0 && dfp===plant.pinchDays) {
      var tk3='pinch_'+plant.id+'_'+TODAY_STR;
      taskList.push({
        key:tk3, type:'task', groupType:'pinch',
        plantId:plant.id, plantName:nm, emoji:plant.emoji||'🌱', location:plant.location||'',
        action:'순치기 (적심) 시기', subAction:'심은 후 '+plant.pinchDays+'일',
        urgent:true, dfp:dfp, done:!!APP.doneTasks[tk3],
      });
    }

    if (plant.totalDays>0) {
      var dL3 = plant.totalDays-dfp;
      if (dL3<=7 && dL3>0) {
        var tk4='harvest_warning_'+plant.id+'_'+TODAY_STR;
        taskList.push({
          key:tk4, type:'task', groupType:'harvest',
          plantId:plant.id, plantName:nm, emoji:plant.emoji||'🌱', location:plant.location||'',
          action:'수확 D-'+dL3+'일 (재배기간)', subAction:'재배기간 종료 임박',
          urgent:dL3<=3, dfp:dfp, done:!!APP.doneTasks[tk4],
        });
      }
    }
  });

  var tasks = [];

  Object.keys(sprayMap).forEach(function(pestName){
    var g = sprayMap[pestName];
    var taskKey = 'spray_group_'+pestName.replace(/\s/g,'')+'_'+TODAY_STR;
    var anyUrgent = g.plants.some(function(p){ return p.urgent; });
    var done = !!APP.doneTasks[taskKey];
    tasks.push({
      key: taskKey, type: 'spray', groupType: 'spray',
      action: pestName+' 살포',
      subAction: g.target,
      pestType: g.pestType,
      interval: g.interval,
      preharvest: g.preharvest,
      plants: g.plants,           
      plantName: g.plants.map(function(p){ return p.name; }).join(', '),
      emoji: g.plants.length===1 ? g.plants[0].emoji : '🌿',
      location: '',
      urgent: anyUrgent,
      done: done,
    });
  });

  Object.keys(fertMap).forEach(function(fertName){
    var g = fertMap[fertName];
    var taskKey = 'fert_group_'+fertName.replace(/\s/g,'')+'_'+TODAY_STR;
    var done = !!APP.doneTasks[taskKey];
    tasks.push({
      key: taskKey, type: 'fert', groupType: 'fert',
      action: fertName+' 시비',
      subAction: g.desc,
      interval: g.interval,
      amount: g.amount,
      plants: g.plants,
      plantName: g.plants.map(function(p){ return p.name; }).join(', '),
      emoji: g.plants.length===1 ? g.plants[0].emoji : '🌱',
      location: '',
      urgent: false,
      done: done,
    });
  });

  tasks = tasks.concat(taskList);

  tasks.sort(function(a,b){
    if(a.done!==b.done) return a.done?1:-1;
    if(a.urgent!==b.urgent) return a.urgent?-1:1;
    if(a.type!==b.type){
      var order={harvest:0,pinch:1,spray:2,fert:3,task:4};
      return (order[a.groupType||a.type]||5)-(order[b.groupType||b.type]||5);
    }
    return (a.action||'').localeCompare(b.action||'');
  });
  return tasks;
}

function parseInterval(s) {
  if (!s) return 0;
  if (s.includes('연') || s.includes('년')) return 365;
  if (s.includes('주')) { var mw=s.match(/(\d+)/); return mw ? parseInt(mw[1])*7 : 0; }
  var rangeM = s.match(/(\d+)~(\d+)일/);
  if (rangeM) return parseInt(rangeM[1]);
  var dayM = s.match(/(\d+)일/);
  if (dayM) return parseInt(dayM[1]);
  if (s.includes('식재전') || s.includes('정식전') || s.includes('파종전')) return 90;
  if (s.includes('개화전') || s.includes('개화기')) return 90;
  if (s.includes('회') && !s.match(/\d+일/)) return 30;
  
  var nm = s.match(/(\d+)/);
  if (nm) {
    var val = parseInt(nm[1]);
    return val < 3 ? 30 : val;  
  }
  return 0;
}

function isInSeason(iv, date) {
  var m = date.getMonth() + 1;  
  if (iv.includes('연') || iv.includes('년')) return m>=3 && m<=5;
  if (iv.includes('착색')) return m>=7 && m<=9;
  if (iv.includes('개화')) return m>=3 && m<=5;
  if (iv.includes('식재전') || iv.includes('파종전') || iv.includes('정식전')) return m>=4 && m<=6;
  if (iv.includes('밑거름')) return m>=3 && m<=5;
  if (iv.includes('웃거름')) return m>=5 && m<=9;
  if (iv.match(/\d+[~-]?\d*일/)) return m>=4 && m<=10;
  return m>=4 && m<=10;
}

function calcWeekTasks() {
  var tasks=[];
  for (var i=1;i<=6;i++) {
    var d=addDays(TODAY,i);
    APP.plants.forEach(function(p){
      if(!p.plantDate||p.status!=='active') return;
      var planted=parseDate(p.plantDate); if(!planted) return;
      var dfp=daysBetween(planted,d);
      if (p.pinchDays>0&&dfp===p.pinchDays) tasks.push({date:fmt(d),plantName:p.name,emoji:p.emoji,action:'순치기 (D+'+i+'일)',type:'task'});
      if (p.fruitDays>0&&dfp===p.fruitDays) tasks.push({date:fmt(d),plantName:p.name,emoji:p.emoji,action:'수확 예정 (D+'+i+'일)',type:'harvest'});
    });
  }
  return tasks;
}

function renderAll(){ renderToday(); renderPlants(); renderLogs(); renderDb(); }

function _plantEmoji(p) {
  if (p.emoji) {
    var e = (p.emoji||'').trim();
    var code = e.codePointAt ? e.codePointAt(0) : 0;
    if (code && code > 0x2000 && !e.includes('?') && e.length <= 4) return e;
  }
  var name = (p.name||'').toLowerCase();
  var cat  = (p.category||'').toLowerCase();
  var map = {
    '사과':'🍎️','배':'🍐️','복숭아':'🍑️','포도':'🍇️','블루베리':'🫐️',
    '감':'🟠️','자두':'🟣️','매실':'🟢️','살구':'🟡️','무화과':'🟤️',
    '키위':'🥝️','다래':'🥝️','앵두':'🍒️','마르멜로':'🍋️','으름':'🌿️',
    '블랙베리':'🫐️','복분자':'🍇️','헤이즐럿':'🌰️',
    '딸기':'🍓️','수박':'🍉️','참외':'🍈️','멜론':'🍈️','토마토':'🍅️',
    '고추':'🌶️','오이':'🥒️','가지':'🍆️','호박':'🎃️','옥수수':'🌽️',
    '상추':'🥬️','배추':'🥦️','시금치':'🌿️','파':'🧅️','양파':'🧅️',
    '감자':'🥔️','고구마':'🍠️','무':'🌿️','당근':'🥕️',
    '콩':'🌱️','팥':'🌱️','땅콩':'🥜️','아주까리':'🌿️',
  };
  for (var k in map) { if (name.includes(k)) return map[k]; }
  if (cat.includes('유실수')||cat.includes('과수')) return '🌳️';
  if (cat.includes('채소')) return '🥬️';
  return '🌱️';
}
function esc_plantEmoji(p) { return esc(_plantEmoji(p)); }

function renderToday() {
  var tasks = calcTodayTasks();
  console.log('[renderToday] 오늘 할일 수:', tasks.length);
  if (tasks.length === 0) {
    console.log('[renderToday] 할일 없음 — APP.plants:', APP.plants.length,
      '/ active+plantDate:', APP.plants.filter(function(p){
        return p.status==='active' && p.plantDate;
      }).length);
  } else {
    console.log('[renderToday] 할일 목록:',
      tasks.slice(0,3).map(function(t){ return t.plant+'·'+t.action+'('+t.type+')'; }).join(', '));
  }
  var filtered = tasks.filter(function(t){
    if(APP.filter==='spray')   return t.type==='spray';
    if(APP.filter==='fert')    return t.type==='fert';
    if(APP.filter==='task')    return t.type==='task';
    if(APP.filter==='pending') return !t.done;
    return true;
  });
  var pending = tasks.filter(function(t){ return !t.done; }).length;
  var countEl = document.getElementById('today-count');
  if (countEl) countEl.textContent = '총 '+tasks.length+'건 (미완료 '+pending+'건)';
  var pendingBadge = document.getElementById('today-pending-count');
  if (pendingBadge) {
    if (pending > 0) {
      pendingBadge.textContent = pending;
      pendingBadge.style.display = '';
    } else {
      pendingBadge.style.display = 'none';
    }
  }

  var el = document.getElementById('today-list');
  if (filtered.length===0) {
    el.innerHTML = '<div class="empty-state"><span class="emoji">🎉</span><p>오늘 할 일 없음!</p></div>';
  } else {
    el.innerHTML = filtered.map(taskCardHTML).join('');
  }

  var week = calcWeekTasks();
  var wel  = document.getElementById('week-list');
  wel.innerHTML = week.length===0
    ? '<div class="empty-state" style="padding:1rem 0;"><p style="font-size:12px;">이번 주 예정 없음</p></div>'
    : week.map(function(t){
        return '<div class="task-card" style="border-left-color:var(--amber);opacity:.8;">'
          +'<div class="task-top"><div>'
          +'<div class="task-plant"><span class="emoji">'+esc_plantEmoji({emoji:t.emoji,name:t.plantName,category:''})+'</span>'+esc(t.plantName)+'</div>'
          +'<div class="task-action">'+esc(t.action)+'</div>'
          +'<div class="task-meta"><span>📅 '+esc(t.date)+'</span></div>'
          +'</div><span class="badge badge-soon">예정</span></div></div>';
      }).join('');
}

function taskCardHTML(t) {
  var typeBadge = t.type==='spray'
    ? '<span class="badge badge-ins">🌿 '+(t.pestType||'농약살포')+'</span>'
    : t.type==='fert'
    ? '<span class="badge badge-fert">🌱 시비</span>'
    : '<span class="badge badge-log">✅ 작업</span>';
  var urgBadge  = (t.urgent&&!t.done) ? '<span class="badge badge-today">긴급</span>' : '';
  var doneBadge = t.done ? '<span class="badge badge-done">완료</span>' : '';
  var cardCls   = 'task-card'+(t.done?' done':'')+(t.urgent&&!t.done?' urgent':'')+(t.type==='fert'?' fert':'');

  var plantsHtml = '';
  if (t.plants && t.plants.length > 0) {
    var shown = t.plants.slice(0, 8);
    var more  = t.plants.length > 8 ? ' <span style="color:var(--gray-400);">외 '+(t.plants.length-8)+'종</span>' : '';
    plantsHtml = '<div class="task-plant-tags">'
      + shown.map(function(p){
          return '<span class="task-plant-tag'+(p.urgent?' tag-urgent':'')+'">'
            +esc_plantEmoji(p)+' '+esc(p.name)
            +'<span class="tag-days">D+'+p.dfp+'</span>'
            +'</span>';
        }).join('')
      + more + '</div>';
  }

  var actionLine = t.plants && t.plants.length>1
    ? '<div class="task-action">'+esc(t.action)+' <span style="color:var(--gray-400);font-size:11px;">('+t.plants.length+'개 작물)</span></div>'
    : '<div class="task-action">'+esc(t.action)+'</div>';

  return '<div class="'+cardCls+'" id="tc-'+esc(t.key)+'">'
    +'<div class="task-top">'
    +'<div style="flex:1;">'
    +'<div class="task-plant">'
    +(t.plants && t.plants.length<=1 ? '<span class="emoji">'+esc(t.emoji||'🌱')+'</span>'+esc(t.plantName)+' ' : '')
    +typeBadge+urgBadge+doneBadge+'</div>'
    +actionLine
    +plantsHtml
    +'<div class="task-meta">'
    +(t.subAction  ? '<span>🎯 '+esc(t.subAction.substring(0,50))+'</span>' : '')
    +(t.interval   ? '<span>🔄 '+esc(t.interval)+'</span>' : '')
    +(t.preharvest ? '<span>⛔ '+esc(t.preharvest)+'</span>' : '')
    +(t.amount     ? '<span>📦 '+esc(t.amount)+'</span>' : '')
    +(t.location   ? '<span>📍 '+esc(t.location)+'</span>' : '')
    +'</div></div>'
    +'<button class="check-btn'+(t.done?' checked':'')+'"'
    +' data-key="'+esc(t.key)+'"'
    +' data-pid="'+esc(t.plantId||'')+'"'
    +' data-name="'+esc(t.plantName)+'"'
    +' data-action="'+esc(t.action)+'"'
    +' data-type="'+esc(t.type)+'"'
    +' data-mat="'+esc(t.action.split(' ')[0])+'"'
    +' data-done="'+(t.done?'1':'0')+'"'
    +' onclick="toggleTaskEl(this)">'
    +(t.done?'✓':'')+'</button>'
    +'</div></div>';
}

function renderPlants() {
  var fruitKw = ['사과','배','복숭아','포도','블루베리','블랙베리','감나무','자두','매실','살구',
                 '무화과','다래','키위','앵두','마르멜로','으름','헤이즐럿','헤이즐넛','오디','바이오체리',
                 '피코튬','대추','모과','마르멜로','복분자','백살구'];
  var vegKw   = ['감자','토마토','고추','오이','호박','상추','배추','무','파','양파','마늘','시금치',
                 '깻잎','열무','봄동','당근','브로콜리','콩','팥','옥수수','땅콩','부추','쑥갓'];

  function isFruitPlant(p) {
    var cat = (p.category || '').trim();
    var nm  = (p.name || '').toLowerCase();
    if (cat === '유실수' || cat === '과수') return true;
    if (cat === '채소' || cat === '채소작물' || cat === '농작물') return false;
    if (cat && cat !== '') return false;
    var _mP = (MASTER_DB&&MASTER_DB.plants||[]).find(function(m){ return m.name===p.name||m.id===p.id; });
    if (_mP && _mP.category) return _mP.category==='유실수'||_mP.category==='과수';
    if (vegKw.some(function(k){ return nm.includes(k.toLowerCase()); })) return false;
    return fruitKw.some(function(k){ return nm.includes(k.toLowerCase()); });
  }

  var _today0 = new Date().toISOString().slice(0,10);
  var _rMap   = {};
  (APP.plants||[]).forEach(function(p) {
    if (!p || !p.name) return;
    var k   = p.name.trim();
    var d   = p.dateStr || '';
    var hasDate = d && d !== _today0 && d.length === 10;
    if (!_rMap[k]) {
      _rMap[k] = p;
    } else {
      var ex    = _rMap[k];
      var exD   = ex.dateStr || '';
      var exHas = exD && exD !== _today0 && exD.length === 10;
      if (hasDate && !exHas) _rMap[k] = p;
      else if (hasDate && exHas && (p.events||[]).length > (ex.events||[]).length) _rMap[k] = p;
    }
  });
  var dedupedPlants = Object.values(_rMap);

  var plants = dedupedPlants.filter(function(p) {
    if (p.status === 'deleted') return false;
    if (!APP.plantFilter || APP.plantFilter === 'all') return true;
    if (APP.plantFilter === '유실수') return isFruitPlant(p);
    if (APP.plantFilter === '채소')   return !isFruitPlant(p);
    return (p.category || '') === APP.plantFilter;
  });

  var grid = document.getElementById('plant-grid');
  if (!grid) return;
  if (!plants.length) {
    grid.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#aaa;">' +
      '<div style="font-size:36px;margin-bottom:8px">🌱</div>' +
      '<div>' + (APP.plantFilter && APP.plantFilter !== 'all' ? APP.plantFilter + ' ' : '') +
      '등록된 작물이 없습니다.</div></div>';
  } else {
    grid.innerHTML = plants.map(plantCardHTML).join('');
  }
}

function plantCardHTML(p) {
  var planted      = parseDate(p.plantDate);
  var dfp          = planted ? daysBetween(planted,TODAY) : -1;
  var total        = p.totalDays||0;
  var pct          = (total>0&&dfp>=0) ? Math.min(100,Math.round(dfp/total*100)) : 0;
  var barCls       = pct<40?'bar-early':pct<75?'bar-mid':'bar-late';

  var hBadge='';
  if (p.pollDate&&p.pollDays>0) {
    var polled=parseDate(p.pollDate), hd=addDays(polled,p.pollDays), dL=daysBetween(TODAY,hd), sinceP=daysBetween(polled,TODAY);
    hBadge = dL===0 ? '<span class="pi-badge pi-harvest-today">🍎 수확 D-day!</span>'
           : dL>0  ? '<span class="pi-badge pi-harvest-days">🍎 수확 D-'+dL+'일 (착과 '+sinceP+'일째)</span>'
                   : '<span class="pi-badge pi-harvest-ok">🍎 수확기 (착과 '+sinceP+'일째)</span>';
  } else if (p.fruitDays>0&&dfp>=0) {
    var dL2=p.fruitDays-dfp;
    hBadge = dL2===0 ? '<span class="pi-badge pi-harvest-today">🍎 수확 D-day!</span>'
           : dL2>0&&dL2<=7 ? '<span class="pi-badge pi-harvest-soon">🍎 수확 D-'+dL2+'일</span>'
           : dL2>0 ? '<span class="pi-badge pi-harvest-days">🍎 수확 D-'+dL2+'일</span>'
                   : '<span class="pi-badge pi-harvest-ok">🍎 수확 +'+Math.abs(dL2)+'일째</span>';
  } else if (total>0&&dfp>=0) {
    var dL3=total-dfp;
    if (dL3<=7&&dL3>0) hBadge='<span class="pi-badge pi-harvest-soon">⏰ 종료 D-'+dL3+'</span>';
    else if (dL3<=0)   hBadge='<span class="pi-badge pi-harvest-ok">✅ 재배 완료</span>';
  }

  var pollBadge='';
  if (p.pollDate) { var sinceP2=daysBetween(parseDate(p.pollDate),TODAY); pollBadge='<span class="pi-badge pi-poll">🌸 착과 '+sinceP2+'일째</span>'; }

  var nm=p.name.toLowerCase();
  var pLogs=APP.logs.filter(function(l){ return (l.plantName||l.plant||'').toLowerCase()===nm; }).slice(0,3);
  var ICON={'농약살포':'🌿','시비':'🌱','파종':'🌾','수확':'🍎','순치기':'✂️','병해충':'🐛','개화':'🌸','정식':'🌱','착과':'🌸','기타':'📝'};
  var miniLog=pLogs.length>0?'<div class="plant-mini-log">'+pLogs.map(function(l){
    var t=l.eventType||l.type||'기타', mat=l.material||l.detail||'';
    return '<div class="plant-mini-log-item"><span class="ml-date">'+(l.date||'').slice(5,10)+'</span>'
      +'<span class="ml-type">'+(ICON[t]||'📝')+t+'</span>'+(mat?'<span class="ml-mat">'+esc(mat.slice(0,18))+'</span>':'')+'</div>';
  }).join('')+'</div>':'';

  var progressBar=total>0?'<div class="plant-bar-wrap" style="margin-top:5px;"><div class="plant-bar '+barCls+'" style="width:'+pct+'%;"></div></div>'
    +'<div class="plant-progress-label"><span>'+pct+'% 진행</span><span>'+dfp+'/'+total+'일</span></div>':'';

  var catLabel = p.category==='유실수'?'🌳 유실수':'🥬 채소작물';
  var catColor = p.category==='유실수'?'#2E7D32':'#1565C0';
  return '<div class="plant-card" data-id="'+esc(p.id)+'">'
    +'<div style="display:flex;align-items:flex-start;justify-content:space-between;">'  
    +'<span class="plant-emoji" onclick="openEditPlant(this.closest(\'.\'plant-card\'\'))" style="cursor:pointer;">'+esc_plantEmoji(p)+'</span>'
    +'<button onclick="event.stopPropagation();_changePlantCategory(\'' +esc(p.id)+'\')" style="font-size:10px;padding:2px 8px;border-radius:10px;border:1.5px solid '+catColor+';color:'+catColor+';background:#fff;cursor:pointer;font-weight:600;">'+catLabel+'</button></div>'
    +'<div class="plant-name" onclick="openEditPlant(this.closest(\'.plant-card\'))" style="cursor:pointer;">'+esc(p.name)+'</div>'
    +(p.location?'<div class="plant-loc">📍 '+esc(p.location)+'</div>':'')
    +(dfp>=0
      ? '<div class="plant-info-row"><span style="color:var(--green-dark);font-weight:500;">D+'+dfp+'일</span><span style="color:var(--gray-400);">'+esc(p.plantDate)+'</span></div>'
        +progressBar
        +'<div class="plant-info-row" style="margin-top:4px;">'+hBadge+pollBadge+'</div>'
      : '<div style="font-size:11px;color:var(--amber);margin-top:5px;">📅 날짜 미입력</div>')
    +miniLog+'</div>';
}

function getPlantInfo(nm) {
  var n=(nm||'').toLowerCase().trim(); if(!n) return null;
  return APP.plants.find(function(p){ var pn=p.name.toLowerCase(); return pn===n||pn.includes(n)||n.includes(pn.split(' ')[0]); })||null;
}

// ... 기타 나머지 UI 및 유틸 함수들 ...

async function loadAllData() {
  setLoadingStep(1, 30, '로컬 DB 로드 중...');
  if (APP.plants.length === 0) {
    // 식물 데이터가 로드될 때 기본 상태를 'active'로 강제 부여 (할 일 목록에 노출되도록)
    APP.plants = MASTER_DB.plants.map(function(p){ 
        return Object.assign({ status: 'active' }, p, { _local: true }); 
    });
    try { renderToday(); renderPlants(); } catch(e){}
  }
  setLoadingStep(1, 45, 'Google Sheets에서 데이터 로드 중...');
  try {
    var raw = await _gasGet('getPlants');
    var plantsArr = Array.isArray(raw) ? raw
      : Object.keys(raw||{}).map(function(k){ return Object.assign({id:k}, raw[k]); });
    if (plantsArr.length === 0) {
      setLoadingStep(2, 55, '식물 DB 초기화 중...');
      await seedPlants();
      raw = await _gasGet('getPlants');
      plantsArr = Array.isArray(raw) ? raw
        : Object.keys(raw||{}).map(function(k){ return Object.assign({id:k}, raw[k]); });
    }
    if (plantsArr.length > 0) {
      var _seen = {};
      var _deduped = [];
      var today = new Date().toISOString().slice(0,10);

      function _hasRealDate(p) {
        var d = p.dateStr || '';
        return d && d !== today && /^\d{4}-\d{2}-\d{2}$/.test(d);
      }

      function _betterPlant(ex, p) {
        var exHasDate = _hasRealDate(ex);
        var pHasDate  = _hasRealDate(p);
        if (!exHasDate && pHasDate) return true;  
        if (exHasDate && !pHasDate) return false; 
        return (p.events||[]).length > (ex.events||[]).length;
      }

      plantsArr.forEach(function(p) {
        if (!p || !p.name) return;
        var key = 'name:' + p.name.trim();
        if (_seen[key] !== undefined) {
          var idx = _seen[key];
          var ex  = _deduped[idx];
          if (_betterPlant(ex, p)) {
            _deduped[idx] = Object.assign({}, ex, p, {
              dateStr: _hasRealDate(p) ? p.dateStr : (ex.dateStr || p.dateStr),
              events:  (p.events||[]).length >= (ex.events||[]).length ? (p.events||[]) : (ex.events||[]),
              no:      ex.no || p.no,
            });
          } else {
            if (!_hasRealDate(ex) && _hasRealDate(p)) {
              _deduped[idx].dateStr = p.dateStr;
            }
          }
        } else {
          _seen[key] = _deduped.length;
          _deduped.push(Object.assign({}, p));
        }
      });
      APP.plants = _deduped.filter(function(p) { return p; }).map(function(p) {
        if (!p.dateStr && p.plantDate) p.dateStr = String(p.plantDate).slice(0,10);
        if (!p.dateStr && p.addedDate) p.dateStr = String(p.addedDate).slice(0,10);
        if (p.dateStr && p.dateStr.includes('T')) p.dateStr = p.dateStr.slice(0,10);
        if (p.dateStr && !p.plantDate) p.plantDate = p.dateStr;
        p.fruitDays = parseInt(p.fruitDays || p.fruitDay) || 0;
        p.totalDays = parseInt(p.totalDays) || 0;
        p.pinchDays = parseInt(p.pinchDays || p.pinchDay) || 0;
        p.pollDays  = parseInt(p.pollDays  || p.pollDay)  || 0;
        if (!p.fruitDays && p.totalDays) p.fruitDays = p.totalDays;
        if (p.loc && !p.zone) p.zone = String(p.loc);
        if (typeof p.events === 'string') {
          if (p.events.startsWith('[')) {
            try { p.events = JSON.parse(p.events); } catch(e) { p.events = []; }
          } else if (p.events === '' || p.events.includes('[object')) {
            p.events = [];
          }
        }
        if (!Array.isArray(p.events)) p.events = [];
        if (!p.status) p.status = 'active'; // 기본 상태 부여 보장
        if (!p.category) {
          var _mp = (MASTER_DB&&MASTER_DB.plants||[]).find(function(m){
            return m.id===p.id || m.name===p.name;
          });
          if (_mp && _mp.category) p.category = _mp.category;
        }
        if (!p.location && p.loc) p.location = p.loc;
        if (!p.loc && p.location) p.loc = p.location;
        return p;
      });
      APP.plants.sort(function(a,b){ return (a.no||0)-(b.no||0); });
    }
    var doneRaw = await _gasGet('getDoneTasks', { date: TODAY_STR });
    APP.doneTasks = {};
    (Array.isArray(doneRaw) ? doneRaw : Object.keys(doneRaw||{}).map(function(k){
      return Object.assign({_key:k}, doneRaw[k]);
    })).forEach(function(d){ APP.doneTasks[d._key||d.key||d.id] = d; });
    setLoadingStep(2, 70, 'Google Sheets 동기화 완료!');
    try { renderToday(); renderPlants(); } catch(e){}
    setSyncStatus(true);
    setTimeout(function(){ hideLoading(); }, 300);
    Promise.all([
      _gasGet('getWorkLogs',    { limit: '80' }).catch(function(){ return []; }),
      _gasGet('getGrowRecords', { limit: '80' }).catch(function(){ return []; }),
    ]).then(function(results2) {
      var wlRows = (Array.isArray(results2[0]) ? results2[0] : []).map(function(d){
        return Object.assign({_col:'workLogs'}, d);
      });
      var grRows = (Array.isArray(results2[1]) ? results2[1] : []).map(function(d){
        return Object.assign({_col:'growRecords',
          date: typeof d.date==='string'?d.date.slice(0,10):d.date||'',
          plantName: d.plantName||d.name||'', type: d.eventType||d.type||'기타',
          material: d.material||'', detail: d.note||d.detail||'', time: d.time||'',
        }, d);
      });
      var _allLogs = wlRows.concat(grRows);
      var _logSeen = {};
      APP.logs = _allLogs.filter(function(l) {
        var _detail = (l.detail||l.note||'').slice(0,30);
        var _cont = (l.date||'').slice(0,10)+'|'+(l.plantName||'')+'|'+(l.type||l.eventType||'')+'|'+_detail;
        var k = _cont; 
        if (_logSeen[k]) return false;
        _logSeen[k] = true;
        return true;
      }).sort(function(a,b){
        var da=(a.date||'').slice(0,10), db_=(b.date||'').slice(0,10);
        if(da!==db_) return da>db_?-1:1;
        return (a.time||'')>(b.time||'')?-1:1;
      });
      setLoadingStep(3, 100, '완료!');
      try { renderToday(); renderPlants(); renderLogs(); renderDb(); } catch(e){}
    }).catch(function(e){ console.warn('로그 로드 오류:', e.message); });
  } catch(e) {
    console.warn('[loadAllData] 오류:', e.message);
    setLoadingStep(2, 100, '로컬 모드');
    try { renderToday(); renderPlants(); renderLogs(); renderDb(); } catch(e2){}
    setTimeout(function(){ hideLoading(); }, 300);
  }
}

var _slowTimer = null;

function setLoadingStep(step, pct, msg) {
  var msgEl  = document.getElementById('loading-step-msg');
  var barEl  = document.getElementById('loading-progress-bar');
  if (msgEl) msgEl.textContent = msg || '';
  if (barEl) barEl.style.width = (pct||0) + '%';
  
  for (var i = 0; i <= 3; i++) {
    var el = document.getElementById('ls-' + i);
    if (!el) continue;
    el.className = 'ls-item' + (i < step ? ' done' : i === step ? ' active' : '');
  }
}

function hideLoading() {
  if (_slowTimer) { clearTimeout(_slowTimer); _slowTimer = null; }
  var overlay = document.getElementById('loading');
  if (!overlay) return;
  overlay.classList.add('fade-out');
  setTimeout(function() { overlay.classList.add('hidden'); }, 400);
}

// 나머지 추가 연동/수정용 기능들은 필요 시 이어서 구현하시면 됩니다.
