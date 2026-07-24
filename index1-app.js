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

    var localSearchUrl = getEffectiveGasUrl(); // PSIS 검색 GAS URL
    const url = `${localSearchUrl}?keyword=${encodeURIComponent(keyword)}`;

    try {
        const response = await fetch(url, { method: 'GET', redirect: 'follow' });
        const data = await response.json(); 

		// --- 여기를 추가하세요 ---
        console.log("전체 데이터:", data);
        // [수정 전 코드] ... data._rawList && data._rawList.length > 0)
		// [수정 후 코드] 아래 내용을 복사해서 붙여넣으세요.
		
		// data.list.item 구조를 확인하여 변환
		if ((!data.cropUsage || Object.keys(data.cropUsage).length === 0) &&
		    data.list && data.list.item && data.list.item.length > 0) {
		    
		    var cu = {};
		    // 응답받은 list.item 배열을 순회하며 cropUsage 형태(객체)로 변환
		    data.list.item.forEach(function(row) {
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
        if (!data.success || !data._rawList || data._rawList.length === 0) {
            resultDiv.innerHTML = `<div style="text-align:center; padding:20px; color:#666;">결과가 없습니다.</div>`;
            return;
        }

        resultDiv.innerHTML = '';
        data._rawList.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'item-card';
            
            // 상세 정보(toxicName, fishToxicGubun)는 전체 응답의 _detail에서 가져옵니다.
		    // 만약 pestiCode별로 개별 상세 정보가 있다면 item._detail을 써야 하지만, 
		    // 현재 구조에서는 data._detail을 참조하는 것이 맞습니다.
		    // 상세 정보 접근
			const detail = item._detail || {}; // 서버에서 넣어준 상세 데이터
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
	   // 카드 렌더링 후, 화면의 select 박스에 값을 자동으로 맞춰주는 로직
       //     const toxicEl = document.getElementById('dim-toxic');
       //    if (toxicEl) {
       //         const toxicVal = toxic.replace(/[\(\)a-zA-Z0-9]/g, '').trim(); // '맹독성 (1a/1b)' -> '맹독성'
       //         const options = Array.from(toxicEl.options).map(opt => opt.text);
       //         // 가장 비슷한 선택지를 찾아 자동 선택
       //         toxicEl.value = options.find(opt => opt.includes(toxicVal)) || '선택';
       //     }

       //     const fishEl = document.getElementById('dim-fish-toxicity');
       //     if (fishEl) {
       //         const fishVal = fish.replace(/[\(\)a-zA-Z0-9]/g, '').trim(); // 'Ⅰ급 (강독성)' -> 'Ⅰ급'
       //         const options = Array.from(fishEl.options).map(opt => opt.text);
                // 가장 비슷한 선택지를 찾아 자동 선택
        //        fishEl.value = options.find(opt => opt.includes(fishVal)) || '선택';
        //    }
        });
    } catch (error) {
        resultDiv.innerHTML = `<div class="error-msg">호출 실패</div>`;
    }
}

const GAS_OCR_URL = "https://script.google.com/macros/s/AKfycbwXbgptSmUJ8vhr_crTAsnbMhoSPzronQdJNWfLN2z7xaJpb-k3Pr8Ts9aNjfqKDI4b/exec";  

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
function addDays(d,n){
  if(!d||isNaN(d)) return new Date();
  var r=new Date(d);
  if(isNaN(r.getTime())) return new Date();
  r.setDate(r.getDate()+(parseInt(n)||0));
  return r;
}
function daysBetween(a,b){
  if(!a||!b||isNaN(a)||isNaN(b)) return 0;
  return Math.round((b-a)/(1000*60*60*24));
}
function parseDate(s){
  if(!s||s===''||s==='undefined'||s==='null') return null;
  try {
    // YYYY-MM-DD 형태만 허용
    var m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if(!m) return null;
    var d = new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]));
    return isNaN(d.getTime()) ? null : d;
  } catch(e) { return null; }
}
function esc(s){ return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function startApp() { initGAS(); }

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
// ════════════════════════════════════════════════════════
// GAS_URL: https://script.google.com/macros/s/AKfycbwXbgptSmUJ8vhr_crTAsnbMhoSPzronQdJNWfLN2z7xaJpb-k3Pr8Ts9aNjfqKDI4b/exec
// GAS action 목록:
//   plants      : getPlants / addPlant / updatePlant / deletePlant
//   workLogs    : getWorkLogs / addWorkLog / updateWorkLog / deleteWorkLog
//   growRecords : getGrowRecords / addGrowRecord / updateGrowRecord / deleteGrowRecord
//   doneTasks   : getDoneTasks / setDoneTask / deleteDoneTask
//   myPesticides: getMyPesticides / addMyPesticide / updateMyPesticide / deleteMyPesticide
//   userDb      : getUserDb / addUserDb / updateUserDb / deleteUserDb
//   pestCropUsage: getPestCropUsage / setPestCropUsage
//   sprayPlans  : addSprayPlan
//   spraySchedules: addSpraySchedule
//   appSettings : getAppSettings / setAppSettings
// ════════════════════════════════════════════════════════

// ── Google Sheets (공유 OrchardData) 연결 설정 ─────────────
// index.html / index1.html 공유 스프레드시트
const SHARED_SHEET_ID = '12cRWUcZah1z3DaZq5aJcojV8m3J5UU3m2F2ux6GwCec';
// GAS URL (index1 전용 — 공유 스프레드시트에 접근)
let GAS_URL = localStorage.getItem('_runtimeGasUrl') ||
              'https://script.google.com/macros/s/AKfycbwXbgptSmUJ8vhr_crTAsnbMhoSPzronQdJNWfLN2z7xaJpb-k3Pr8Ts9aNjfqKDI4b/exec';

async function _gasPost(params) {
  var p = new URLSearchParams();
  for (var k in params) p.append(k, params[k] == null ? '' : params[k]);
  var res = await fetch(GAS_URL, { method: 'POST', body: p });
  if (!res.ok) throw new Error('GAS HTTP ' + res.status);
  var json = await res.json();
  // wrapResponse 형태 { success, data } 자동 처리
  if (json && typeof json === 'object' && 'success' in json) {
    if (json.data && json.data.id) return json.data;
    return json;
  }
  return json;
}

async function _gasGet(action, extra) {
  var url = GAS_URL + '?action=' + encodeURIComponent(action);
  if (extra) for (var k in extra) url += '&' + k + '=' + encodeURIComponent(extra[k]||'');
  var res = await fetch(url + '&t=' + Date.now());
  if (!res.ok) throw new Error('GAS HTTP ' + res.status);
  var json = await res.json();
  // wrapResponse 형태 { success, data } 자동 처리
  var data = (json && typeof json === 'object' && 'success' in json && 'data' in json)
    ? json.data : json;
  // 배열 데이터 타입 정규화
  if (Array.isArray(data)) {
    // 숫자로 저장해야 할 필드
    var NUM_FIELDS = ['no','totalDays','pinchDays','fruitDays','pollDays',
                      'qty','quantity','amount','price','count'];
    // 날짜 필드 — ISO 문자열을 YYYY-MM-DD로 정규화
    var DATE_FIELDS2 = ['dateStr','plantDate','addedDate','date','pollDate',
                        'lastSprayDate','lastFertDate','createdAt','updatedAt','registeredAt'];
    // 날짜 문자열로 저장해야 할 필드
    var DATE_FIELDS = ['plantDate','pollDate','lastSprayDate','lastFertDate',
                       'registeredAt','updatedAt','createdAt','doneAt'];
    data = data.map(function(row) {
      var out = {};
      for (var k in row) {
        var v = row[k];
        if (v == null) { out[k] = ''; continue; }
        // id류는 항상 문자열
        if (k === 'id' || k === '_key' || k === 'key') {
          out[k] = String(v);
        }
        // 날짜 필드 — ISO 형식 → YYYY-MM-DD
        else if (DATE_FIELDS2.indexOf(k) >= 0) {
          if (!v || v === '') { out[k] = ''; }
          else if (typeof v === 'number' && v > 40000 && v < 60000) {
            // Excel 날짜 시리얼 → YYYY-MM-DD
            var _d = new Date(Math.round((v - 25569) * 86400 * 1000));
            out[k] = isNaN(_d.getTime()) ? '' : _d.toISOString().slice(0, 10);
          } else {
            var _s = String(v);
            // "2026-05-26T23:59:10.140Z" → "2026-05-26"
            if (_s.includes('T')) _s = _s.slice(0, 10);
            // "026-05-26..." 앞자리 누락 보정
            if (/^\d{3}-\d{2}-\d{2}/.test(_s)) _s = '2' + _s;
            out[k] = _s.slice(0, 10);
          }
        }
        // 숫자 필드
        else if (NUM_FIELDS.indexOf(k) >= 0) {
          out[k] = v === '' ? 0 : Number(v) || 0;
        }
        // 날짜 필드 안전 처리
        else if (DATE_FIELDS.indexOf(k) >= 0) {
          try {
            if (!v || v === '') { out[k] = ''; continue; }
            if (typeof v === 'number') {
              // Excel 날짜 시리얼 넘버 → YYYY-MM-DD
              if (v > 40000 && v < 60000) {
                var d = new Date(Math.round((v - 25569) * 86400 * 1000));
                if (!isNaN(d.getTime())) {
                  out[k] = d.toISOString().slice(0, 10);
                } else { out[k] = ''; }
              } else { out[k] = ''; }
            } else {
              var s = String(v);
              // "026-05-11T..." → "2026-05-11T..." (앞자리 누락 보정)
              if (/^\d{3}-\d{2}-\d{2}/.test(s)) s = '2' + s;
              // 날짜 부분만 추출 (YYYY-MM-DD)
              var dateMatch = s.match(/(\d{4}-\d{2}-\d{2})/);
              out[k] = dateMatch ? dateMatch[1] : '';
            }
          } catch(dateErr) { out[k] = ''; }
        }
        // 나머지
        else {
          out[k] = typeof v === 'number' ? v : (v === '' ? '' : String(v));
        }
      }
      return out;
    });
  }
  return data;
}

function initGAS() {
  document.getElementById('loading').classList.remove('hidden');
  setLoadingStep(0, 5, '앱 초기화 중...');
  // index5와 동일: GAS_OCR_URL이 있으면 우선 사용
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

function showSetupError(msg) {
  console.warn('[GAS]', msg);
}
async function seedPlants() {
  var plants = MASTER_DB.plants;
  try {
    for (var i = 0; i < plants.length; i++) {
      await _gasPost({ action: 'addPlant', id: plants[i].id, data: JSON.stringify(plants[i]) });
      if (i === 0) {
        APP.plants = plants.slice(0, 1).map(function(p){ return Object.assign({}, p); });
        renderToday(); renderPlants();
      }
    }
    showToast('식물 DB 초기화 완료 ('+plants.length+'개)');
  } catch(e) { console.warn('seedPlants 오류:', e.message); }
}

function calcTodayTasks() {
  
  var sprayMap = {};   
  var fertMap  = {};   
  var taskList = [];   

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
  // "N주" → N×7일
  if (s.includes('주')) { var mw=s.match(/(\d+)/); return mw ? parseInt(mw[1])*7 : 0; }
  // "N~M일 간격" → 작은 숫자 사용
  var rangeM = s.match(/(\d+)~(\d+)일/);
  if (rangeM) return parseInt(rangeM[1]);
  // "N일 간격" / "N일마다"
  var dayM = s.match(/(\d+)일/);
  if (dayM) return parseInt(dayM[1]);
  // "식재전", "정식전", "파종전" → 시즌 1회 (90일)
  if (s.includes('식재전') || s.includes('정식전') || s.includes('파종전')) return 90;
  // "개화전" → 봄 1회 (90일)
  if (s.includes('개화전') || s.includes('개화기')) return 90;
  // "착색기 N회", "웃거름 N회" 등 — 횟수만 있는 경우 → 30일 간격으로 처리
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
  // "N~M일 간격" 또는 "N일 간격" → 일반 생육기 4~10월
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

// ── 작물 이모지 자동 매핑 ────────────────────────────────────
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
  var tasks    = calcTodayTasks();
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
  // 하단 nav 오늘 버튼 옆 미완료 수 표시
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
  var fruitKw = ['유실수','과수','사과','배','복숭아','포도','블루베리','블랙베리','감','자두','매실','살구','무화과','다래','키위','앵두','마르멜로','으름','헤이즐럿','복분자'];
  function isFruitPlant(p) {
    var cat=(p.category||'').toLowerCase(), nm=(p.name||'').toLowerCase();
    return cat.includes('유실수')||cat.includes('과수')||fruitKw.some(function(k){return nm.includes(k);});
  }
  var plants = APP.plants.filter(function(p){
    if (p.status==='deleted') return false;
    if (APP.plantFilter==='all') return true;
    if (APP.plantFilter==='유실수') return isFruitPlant(p);
    if (APP.plantFilter==='채소') return !isFruitPlant(p);
    return (p.category||'')===(APP.plantFilter);
  });
  // 최종 중복 방어: 같은 이름 제거 (id가 다른 경우 대비)
  // 최종 중복 방어: 같은 이름 중 심은날짜 있는 것 우선 유지
  var _rMap = {};
  var _today0 = new Date().toISOString().slice(0,10);
  (APP.plants||[]).forEach(function(p) {
    if (!p || !p.name) return;
    var k = p.name.trim();
    var d = p.dateStr || '';
    var hasDate = d && d !== _today0 && /^\d{4}-\d{2}-\d{2}$/.test(d);
    if (!_rMap[k]) {
      _rMap[k] = p;
    } else {
      var ex = _rMap[k];
      var exD = ex.dateStr || '';
      var exHas = exD && exD !== _today0 && /^\d{4}-\d{2}-\d{2}$/.test(exD);
      // 새 것에 날짜 있고 기존엔 없으면 교체
      if (hasDate && !exHas) _rMap[k] = p;
      // 둘 다 날짜 있으면 events 많은 것
      else if (hasDate && exHas && (p.events||[]).length > (ex.events||[]).length) _rMap[k] = p;
    }
  });
  APP.plants = Object.values(_rMap);
  var grid = document.getElementById('plant-grid');
  if (!grid) return;
  if (!plants.length) {
    grid.innerHTML = '<div style="text-align:center;padding:40px 20px;color:#aaa;"><div style="font-size:36px;margin-bottom:10px;">🌱️</div><div>등록된 식물이 없습니다.</div></div>';
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

  
  var lsl=APP.logs.find(function(l){ return (l.plantName||l.plant||'').toLowerCase()===(p.name||'').toLowerCase()&&(l.type==='농약살포'||l.eventType==='농약살포'); });
  var dSpray=lsl&&lsl.date?daysBetween(parseDate(lsl.date.slice(0,10)),TODAY):-1;
  var spBadge=''; if(dSpray>=0){ var c1=dSpray>=14?'pi-spray-due':''; var s1=dSpray<14?'background:#E8F5E9;color:#2E7D32;':''; spBadge='<span class="pi-badge '+c1+'" style="'+s1+'">🌿 살포 '+dSpray+'일 전</span>'; }
  var lfl=APP.logs.find(function(l){ return (l.plantName||l.plant||'').toLowerCase()===(p.name||'').toLowerCase()&&(l.type==='시비'||l.eventType==='시비'); });
  var dFert=lfl&&lfl.date?daysBetween(parseDate(lfl.date.slice(0,10)),TODAY):-1;
  var ftBadge=''; if(dFert>=0){ var c2=dFert>=21?'pi-fert-due':''; var s2=dFert<21?'background:#E8EAF6;color:#283593;':''; ftBadge='<span class="pi-badge '+c2+'" style="'+s2+'">🌱 시비 '+dFert+'일 전</span>'; }

  
  var nm=(p.name||'').toLowerCase();
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
        +'<div class="plant-info-row" style="margin-top:4px;">'+hBadge+pollBadge+spBadge+ftBadge+'</div>'
      : '<div style="font-size:11px;color:var(--amber);margin-top:5px;">📅 날짜 미입력</div>')
    +miniLog+'</div>';
}

function getPlantInfo(nm) {
  var n=(nm||'').toLowerCase().trim(); if(!n) return null;
  return APP.plants.find(function(p){ var pn=(p.name||'').toLowerCase(); return pn===n||pn.includes(n)||n.includes(pn.split(' ')[0]); })||null;
}

function plantStatusBadges(p) {
  if(!p||!p.plantDate) return '';
  var planted=parseDate(p.plantDate); if(!planted) return '';
  var dfp=daysBetween(planted,TODAY), total=p.totalDays||0, pct=total>0?Math.min(100,Math.round(dfp/total*100)):0;
  var barCls=pct<40?'bar-early':pct<75?'bar-mid':'bar-late';
  var daysBadge='<span class="pi-badge" style="background:var(--green-light);color:var(--green-dark);font-weight:600;">D+'+dfp+'일</span>';

  var progressBar='';
  if(total>0){
    progressBar='<div style="margin:4px 0 2px;">'
      +'<div style="display:flex;justify-content:space-between;font-size:9px;color:var(--gray-400);margin-bottom:2px;">'
      +'<span>'+esc(p.plantDate)+' 심음</span><span>'+pct+'% · '+dfp+'/'+total+'일</span></div>'
      +'<div class="plant-bar-wrap" style="margin:0;"><div class="plant-bar '+barCls+'" style="width:'+pct+'%;"></div></div></div>';
  }

  var hb='';
  if(p.pollDate&&p.pollDays>0){
    var polled=parseDate(p.pollDate),hd=addDays(polled,p.pollDays),dL=daysBetween(TODAY,hd),sinceP=daysBetween(polled,TODAY);
    hb=dL===0?'<span class="pi-badge pi-harvest-today">🍎 수확 D-day!</span>'
      :dL>0?'<span class="pi-badge pi-harvest-days">🍎 수확 D-'+dL+'일 (착과 '+sinceP+'일째)</span>'
           :'<span class="pi-badge pi-harvest-ok">🍎 수확기 (착과 '+sinceP+'일째)</span>';
  } else if(p.fruitDays>0){
    var dL2=p.fruitDays-dfp;
    hb=dL2===0?'<span class="pi-badge pi-harvest-today">🍎 수확 D-day!</span>'
      :dL2>0&&dL2<=7?'<span class="pi-badge pi-harvest-soon">🍎 수확 D-'+dL2+'일</span>'
      :dL2>0?'<span class="pi-badge pi-harvest-days">🍎 수확 D-'+dL2+'일</span>'
            :'<span class="pi-badge pi-harvest-ok">🍎 수확 +'+Math.abs(dL2)+'일째</span>';
  } else if(total>0){
    var dL3=total-dfp;
    if(dL3<=7&&dL3>0) hb='<span class="pi-badge pi-harvest-soon">⏰ 종료 D-'+dL3+'</span>';
    else if(dL3<=0)   hb='<span class="pi-badge pi-harvest-ok">✅ 재배 완료</span>';
  }

  var pollBadge='';
  if(p.pollDate){ var s2=daysBetween(parseDate(p.pollDate),TODAY); pollBadge='<span class="pi-badge pi-poll">🌸 착과 '+s2+'일째</span>'; }

  var nm=(p.name||'').toLowerCase();
  var lsl=APP.logs.find(function(l){ return (l.plantName||l.plant||'').toLowerCase()===nm&&(l.type==='농약살포'||l.eventType==='농약살포'); });
  var dSp=lsl&&lsl.date?daysBetween(parseDate(lsl.date.slice(0,10)),TODAY):-1;
  var spB=''; if(dSp>=0){ var spCls=dSp>=14?'pi-spray-due':''; var spSty=dSp<14?'background:#E8F5E9;color:#2E7D32;':''; spB='<span class="pi-badge '+spCls+'" style="'+spSty+'">🌿 살포 '+dSp+'일 전</span>'; }

  var lfl=APP.logs.find(function(l){ return (l.plantName||l.plant||'').toLowerCase()===nm&&(l.type==='시비'||l.eventType==='시비'); });
  var dFt=lfl&&lfl.date?daysBetween(parseDate(lfl.date.slice(0,10)),TODAY):-1;
  var ftB=''; if(dFt>=0){ var ftCls=dFt>=21?'pi-fert-due':''; var ftSty=dFt<21?'background:#E8EAF6;color:#283593;':''; ftB='<span class="pi-badge '+ftCls+'" style="'+ftSty+'">🌱 시비 '+dFt+'일 전</span>'; }

  return '<div class="log-plant-detail"><div class="lpd-top">'
    +'<span class="lpd-emoji">'+esc(p.emoji||'🌱')+'</span>'
    +'<div class="lpd-body"><div class="lpd-name">'+esc(p.name)
    +(p.location?'<span class="lpd-loc">📍 '+esc(p.location)+'</span>':'')+'</div>'
    +progressBar
    +'<div class="plant-info-row" style="margin-top:3px;flex-wrap:wrap;">'+daysBadge+hb+pollBadge+spB+ftB+'</div>'
    +'</div></div></div>';
}

function renderLogs() {
  var el=document.getElementById('log-list');
  if(APP.logs.length===0){
    el.innerHTML='<div class="empty-state"><span class="emoji">📖️</span><p>기록 없음.<br>+ 버튼으로 추가하세요.</p></div>';
    return;
  }
  var TICON={'농약살포':'🌿','시비':'🌱','파종':'🌾','수확':'🍎','순치기':'✂️','병해충':'🐛','기타':'📝','정식':'🌱','개화':'🌸','착과':'🌸','천연자재':'🧪'};
  var TCLS={'농약살포':'log-type-spray','시비':'log-type-fert','파종':'log-type-task','정식':'log-type-task','수확':'log-type-task','기타':'log-type-note'};

  var html2='', lastDate='';
  APP.logs.forEach(function(l){
    var dateStr=(l.date||'').slice(0,10), isToday=dateStr===TODAY_STR;
    if(dateStr!==lastDate){
      lastDate=dateStr;
      var ds=isToday?' style="background:var(--green-dark);color:#fff;padding:2px 12px;border-radius:10px;"':'';
      html2+='<div class="log-date-divider"><span'+ds+'>'+(isToday?'📅 오늘 · '+dateStr:dateStr)+'</span></div>';
    }
    var srcCls=l._col==='workLogs'?'log-source-wl':'log-source-gr';
    var srcLbl=l._col==='workLogs'?'작업일지':'재배기록';
    var typeLbl=l.eventType||l.type||'기타';
    var name=l.plantName||l.plant||'', mat=l.material||'', detail=l.detail||l.note||'';
    var canEdit=!!l.id&&!String(l.id||'').startsWith('new_');
    var logId=l.id||'';

    var plant=getPlantInfo(name);
    var plantDetail=(plant&&plant.plantDate)?plantStatusBadges(plant):'';

    html2+='<div class="log-card'+(plantDetail?' log-card-has-plant':'')+'" id="log-'+esc(logId)+'">'
      +'<div class="log-header">'
      +'<div class="log-type-icon '+(TCLS[typeLbl]||'log-type-note')+'">'+(TICON[typeLbl]||'📝')+'</div>'
      +'<div style="flex:1;min-width:0;">'
      +'<div class="log-date">'+esc(dateStr)+(l.time?' '+esc(l.time):'')+'</div>'
      +'<div class="log-name">'+esc(name)+(mat?' · <span style="font-weight:400;color:var(--gray-400);">'+esc(mat)+'</span>':'')+'</div>'
      +'</div>'
      +'<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;flex-shrink:0;">'
      +'<span class="badge badge-log">'+esc(typeLbl)+'</span>'
      +'<span class="badge '+srcCls+'" style="font-size:9px;">'+srcLbl+'</span>'
      +'</div></div>'
      +(detail?'<div class="log-detail">'+esc(detail)+'</div>':'')
      +plantDetail
      +(canEdit
        ?'<div class="log-card-actions">'
          +'<button class="log-edit-btn" data-id="'+esc(logId)+'" onclick="openEditLog(this)">✏️ 수정</button>'
          +'<button class="log-del-btn" data-id="'+esc(logId)+'" onclick="confirmDeleteLog(this)">🗑 삭제</button>'
          +'</div>':'')
      +'</div>';
  });
  el.innerHTML=html2;
}

function openRescanModal() {
  document.getElementById('rescan-bar').style.width = '0%';
  document.getElementById('rescan-status').textContent = '검색 준비 중...';
  document.getElementById('rescan-results').innerHTML = '';
  document.getElementById('rescan-start-btn').disabled = false;
  document.getElementById('rescan-modal').classList.remove('hidden');
}

async function startRescan() {
  var target = document.getElementById('rescan-target').value;
  var btn    = document.getElementById('rescan-start-btn');
  btn.disabled = true;
  btn.textContent = '검색 중...';
  document.getElementById('rescan-results').innerHTML = '';

  
  var items = [];
  if (target==='all'||target==='pest')  items = items.concat(getMergedDb('pest').map(function(x){ return Object.assign({},x,{_tab:'pest'}); }));
  if (target==='all'||target==='fert')  items = items.concat(getMergedDb('fert').map(function(x){ return Object.assign({},x,{_tab:'fert'}); }));
  if (target==='all'||target==='micro') items = items.concat(getMergedDb('micro').map(function(x){ return Object.assign({},x,{_tab:'micro'}); }));

  var results = [];
  for (var i=0; i<items.length; i++) {
    var item = items[i];
    var pct  = Math.round((i+1)/items.length*100);
    document.getElementById('rescan-bar').style.width = pct+'%';
    document.getElementById('rescan-status').textContent =
      '('+(i+1)+'/'+items.length+') 검색 중: '+item.name;

    
    var enriched = await enrichItemWithAI(item);
    if (enriched && enriched.hasUpdate) {
      results.push({ original: item, enriched: enriched });
      renderRescanResult(results, item, enriched);
    }
    
    await new Promise(function(r){ setTimeout(r, 200); });
  }

  document.getElementById('rescan-status').textContent =
    '✅ 검색 완료 — '+results.length+'개 항목 정보 보완됨';
  btn.textContent = '🔍 다시 검색';
  btn.disabled = false;

  if (results.length === 0) {
    document.getElementById('rescan-results').innerHTML =
      '<div style="text-align:center;color:var(--gray-400);padding:20px;font-size:13px;">모든 항목이 최신 상태입니다 ✅</div>';
  }
}

async function enrichItemWithAI(item) {
  try {
    var prompt = '다음 농업 자재에 대해 부족한 정보를 JSON으로 보완해주세요.\n'
      + '현재 정보: '+JSON.stringify({name:item.name, type:item.type||'', ingredient:item.ingredient||'',
          target:item.target||'', method:item.method||'', effect:item.effect||''})+'\n\n'
      + '아래 JSON 형식으로만 응답하세요 (변경이 없으면 hasUpdate:false):\n'
      + '{"hasUpdate":true,"ingredient":"보완된 성분","target":"보완된 방제대상","method":"보완된 사용법",'
      + '"effect":"효과","timing":"적합한 시기","warning":"주의사항","crop_range":"적용 작물","summary":"한줄 요약"}';

        var res = await callClaude(prompt, 400);
    if (!res.ok) return null;
    return parseAiJson(res.text);
  } catch(e) { return null; }
}

function renderRescanResult(results, item, enriched) {
  var container = document.getElementById('rescan-results');
  var diffs = [];
  if (enriched.ingredient && enriched.ingredient !== (item.ingredient||''))
    diffs.push('<b>성분:</b> '+esc(enriched.ingredient));
  if (enriched.target && enriched.target !== (item.target||''))
    diffs.push('<b>방제대상:</b> '+esc(enriched.target));
  if (enriched.method && enriched.method !== (item.method||''))
    diffs.push('<b>사용법:</b> '+esc(enriched.method));
  if (enriched.timing) diffs.push('<b>시기:</b> '+esc(enriched.timing));
  if (enriched.warning && enriched.warning !== (item.warning||''))
    diffs.push('<b>주의:</b> '+esc(enriched.warning));
  if (enriched.crop_range) diffs.push('<b>적용작물:</b> '+esc(enriched.crop_range));

  var card = document.createElement('div');
  card.className = 'rescan-item';
  card.innerHTML = '<div class="rescan-item-header">'
    + '<span class="rescan-item-name">'+(item.emoji||'')+' '+esc(item.name)+'</span>'
    + '<span class="rescan-diff">'+diffs.length+'개 보완</span>'
    + '</div>'
    + '<div class="rescan-field">'+diffs.join(' · ')+'</div>'
    + (enriched.summary ? '<div style="font-size:11px;color:var(--green-dark);margin-top:4px;">💡 '+esc(enriched.summary)+'</div>' : '')
    + '<div style="display:flex;gap:6px;margin-top:8px;">'
    + '<button class="db-edit-btn" style="flex:1;" onclick="applyRescanResult('+results.length+',this)" data-idx="'+(results.length-1)+'">✅ 적용</button>'
    + '<button class="db-del-btn" onclick="this.closest(\'.rescan-item\').remove()">건너뜀</button>'
    + '</div>';
  container.appendChild(card);
}

async function applyRescanResult(idx, btn) {
  btn.textContent = '저장 중...'; btn.disabled = true;
  var myIdx = parseInt(btn.getAttribute('data-idx'));
  var item = getMergedDb(APP.dbTab||'pest')[myIdx];
  if (!item) { btn.textContent='✅ 완료'; return; }
  var enrichedData = { name:item.name, tab:item._tab||APP.dbTab, enrichedAt:new Date().toISOString() };
  await _gasPost(Object.assign({ action:'addUserDb', tab:enrichedData.tab }, enrichedData)).catch(function(e){
    console.warn('applyRescanResult 오류:', e.message);
  });
  btn.textContent = '✅ 저장됨'; btn.disabled = true;
  showToast('💾 '+item.name+' 정보 보완 저장됨');
}

function openBulkDateModal() {
  document.getElementById('bulk-date-input').value = TODAY_STR;
  document.getElementById('bulk-force-overwrite').checked = false;
  document.getElementById('bulk-date-info').textContent = '';
  renderBulkPlantList();
  document.getElementById('bulk-date-modal').classList.remove('hidden');
}

function renderBulkPlantList() {
  var list = document.getElementById('bulk-plant-list');
  var plants = APP.plants.filter(function(p){ return p.status==='active'; });
  list.innerHTML = plants.map(function(p, i){
    var hasDate = !!p.plantDate;
    var sub = hasDate ? '날짜 있음: '+p.plantDate : '날짜 없음';
    return '<label class="bulk-plant-item">'
      + '<input type="checkbox" class="bulk-chk" value="'+esc(p.id)+'"'+(hasDate?'':' checked')+'>'
      + '<div class="bulk-plant-info">'
      + '<div class="bulk-plant-name">'+(p.emoji||'🌱')+' '+esc(p.name)+'</div>'
      + '<div class="bulk-plant-sub">'+(p.category||'')+' · '+esc(sub)+'</div>'
      + '</div></label>';
  }).join('');
  updateBulkDateInfo();
}

function bulkSelectAll(val) {
  document.querySelectorAll('.bulk-chk').forEach(function(c){ c.checked=val; });
  updateBulkDateInfo();
}
function bulkSelectFilter(cat) {
  var plants = APP.plants.filter(function(p){ return p.status==='active'; });
  document.querySelectorAll('.bulk-chk').forEach(function(c, i){
    c.checked = (plants[i]&&plants[i].category===cat);
  });
  updateBulkDateInfo();
}
function bulkSelectNoDate() {
  var plants = APP.plants.filter(function(p){ return p.status==='active'; });
  document.querySelectorAll('.bulk-chk').forEach(function(c, i){
    c.checked = !(plants[i]&&plants[i].plantDate);
  });
  updateBulkDateInfo();
}
function updateBulkDateInfo() {
  var cnt = document.querySelectorAll('.bulk-chk:checked').length;
  document.getElementById('bulk-date-info').textContent = cnt+'개 선택됨';
}
document.addEventListener('change', function(e){ if(e.target&&e.target.classList.contains('bulk-chk')) updateBulkDateInfo(); });

async function applyBulkDate() {
  var dateVal = document.getElementById('bulk-date-input').value;
  var forceOW = document.getElementById('bulk-force-overwrite').checked;
  if (!dateVal) { showToast('날짜를 선택하세요'); return; }
  var checked = Array.from(document.querySelectorAll('.bulk-chk:checked')).map(function(c){ return c.value; });
  if (checked.length === 0) { showToast('식물을 선택하세요'); return; }
  var plants = APP.plants.filter(function(p){ return p.status==='active'; });
  var count = 0;
  for (var i=0; i<checked.length; i++) {
    var pid = checked[i];
    var plant = plants.find(function(p){ return p.id===pid; });
    if (!plant) continue;
    if (plant.plantDate && !forceOW) continue;
    await _gasPost({ action:'updatePlant', id:pid, plantDate:dateVal, updatedAt:new Date().toISOString() });
    plant.plantDate = dateVal;
    var idx = APP.plants.findIndex(function(p){ return p.id===pid; });
    if (idx >= 0) APP.plants[idx].plantDate = dateVal;
    count++;
  }
  closeModal('bulk-date-modal');
  showToast('📅 '+count+'개 식물에 '+dateVal+' 적용 완료');
  renderPlants(); renderToday();
}

var scanStream   = null;
var scanInterval = null;
var scanMode     = 'barcode';   // 'barcode' | 'ocr'
var ocrParsed    = null;        

function setScanMode(mode, btn) {
  scanMode = mode;
  stopScan();
  document.querySelectorAll('.scan-mode-tab').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');

  var showEl = function(id){ var e=document.getElementById(id); if(e) e.style.display=''; };
  var hideEl = function(id){ var e=document.getElementById(id); if(e) e.style.display='none'; };

  
  hideEl('scan-capture-preview');
  hideEl('scan-ocr-text-section');
  document.getElementById('scan-result').innerHTML = '';

  
  var ocrOpts = document.getElementById('ocr-options-row');
  if (ocrOpts) ocrOpts.style.display = (mode==='barcode') ? 'none' : '';

  if (mode === 'barcode') {
    showEl('scan-barcode-btns'); hideEl('scan-ocr-btns'); hideEl('scan-photo-btns');
    
    var _vw = document.getElementById('scan-video-wrap');
    if (_vw) _vw.style.display = 'none';
    stopScan();
    hideEl('scan-ocr-tips');    showEl('scan-code-section');
    document.getElementById('scan-frame-el').style.cssText = 'border-radius:4px;';
    document.getElementById('scan-hint').textContent = 'QR코드를 사각형 안에 맞춰주세요 (iPhone 상단 주황불 = 정상)';
  } else if (mode === 'ocr') {
    hideEl('scan-barcode-btns'); showEl('scan-ocr-btns'); hideEl('scan-photo-btns');
    hideEl('scan-code-section');  showEl('scan-ocr-tips');
    document.getElementById('scan-frame-el').style.cssText = 'border-radius:8px;width:90%;aspect-ratio:3/4;';
    document.getElementById('scan-hint').textContent = '병 라벨 전체를 사각형 안에 맞추고 📸 촬영';
  } else { 
    hideEl('scan-barcode-btns'); hideEl('scan-ocr-btns'); showEl('scan-photo-btns');
    hideEl('scan-code-section'); hideEl('scan-ocr-tips'); hideEl('scan-video-wrap');
  }
}

var torchOn      = false;
var timerOn      = false;
var zoomLevel    = 1;
var blurCheckInterval = null;

async function startScan(mode) {
  if (mode) scanMode = mode;
  stopScan();
  torchOn = false; timerOn = false; zoomLevel = 1;
  var btnTorch = document.getElementById('btn-torch');
  var btnTimer = document.getElementById('btn-timer');
  if (btnTorch) btnTorch.classList.remove('active');
  if (btnTimer) btnTimer.classList.remove('active');
  var zoomSlider = document.getElementById('zoom-slider');
  if (zoomSlider) { zoomSlider.value = 1; }
  var zoomLbl = document.getElementById('zoom-lbl');
  if (zoomLbl) zoomLbl.textContent = '1\xd7';

  var wrap  = document.getElementById('scan-video-wrap');
  var video = document.getElementById('scan-video');
  wrap.style.display = '';
  hide('scan-capture-preview');
  hideFocusMarker();

  try {
    
    
    var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    var constraints = isIOS ? {
      video: { facingMode: { exact: 'environment' } }
    } : {
      video: {
        facingMode: 'environment',
        width:  { ideal: 1920 },
        height: { ideal: 1080 },
        focusMode: { ideal: 'continuous' },
        zoom: { ideal: 1 },
      }
    };
    scanStream = await navigator.mediaDevices.getUserMedia(constraints);
    video.srcObject = scanStream;
    await video.play();

    
    var track = scanStream.getVideoTracks()[0];
    if (track) {
      var caps = track.getCapabilities ? track.getCapabilities() : {};
      
      var advConstraints = {};
      if (caps.focusMode && caps.focusMode.includes('continuous')) {
        advConstraints.focusMode = 'continuous';
      }
      
      if (caps.zoom) {
        advConstraints.zoom = caps.zoom.min || 1;
        zoomLevel = advConstraints.zoom;
        var sl = document.getElementById('zoom-slider');
        if (sl) {
          sl.min  = caps.zoom.min || 1;
          sl.max  = Math.min(caps.zoom.max || 4, 8);
          sl.step = caps.zoom.step || 0.1;
          sl.value = zoomLevel;
        }
      }
      if (Object.keys(advConstraints).length > 0) {
        track.applyConstraints({ advanced: [advConstraints] }).catch(function(){});
      }
    }

    
    if (scanMode === 'ocr') {
      startBlurMonitor();
    }

    if (scanMode === 'barcode') {
      if (typeof jsQR !== 'function') {
        setResult('<div style="color:var(--red-dark);padding:8px;">⚠️ QR 라이브러리 오류.</div>');
        return;
      }

      
      var overlayCvs = document.getElementById('qr-overlay-canvas');
      var overlayCtx = overlayCvs ? overlayCvs.getContext('2d') : null;
      var focusRing  = document.getElementById('qr-focus-ring');

      
      var QR_W = 640, QR_H = 480;
      var qrCvs = document.createElement('canvas');
      qrCvs.width = QR_W; qrCvs.height = QR_H;
      var qrCtx  = qrCvs.getContext('2d', {willReadFrequently: true});

      var vidEl = document.getElementById('scan-video');
      setResult('<div style="font-size:12px;color:var(--green-dark);padding:6px 0;text-align:center;">'
        + '📱 QR코드를 카메라에 비추면 자동으로 인식됩니다</div>');

      
      _setupQrAutoFocus(0.5, 0.5);

      
      window._afTimer = setInterval(function() {
        _setupQrAutoFocus(0.5, 0.5);
      }, 3000);

      var _busy    = false;
      var _lastQr  = null;   
      var _drawCnt = 0;      

      scanInterval = setInterval(function() {
        if (_busy) return;
        if (!vidEl || vidEl.readyState < 3) return;
        var vw = vidEl.videoWidth, vh = vidEl.videoHeight;
        if (!vw || !vh) return;

        
        if (overlayCvs) {
          overlayCvs.width  = vw;
          overlayCvs.height = vh;
        }

        _busy = true;
        try {
          qrCvs.width = QR_W; qrCvs.height = QR_H;
          qrCtx.drawImage(vidEl, 0, 0, QR_W, QR_H);
          var imgData = qrCtx.getImageData(0, 0, QR_W, QR_H);
          var code    = jsQR(imgData.data, QR_W, QR_H, {inversionAttempts: 'attemptBoth'});

          if (code && code.data) {
            var loc = code.location;
            
            if (overlayCtx && loc) {
              
              var sx = vw / QR_W, sy = vh / QR_H;
              overlayCtx.clearRect(0, 0, vw, vh);

              
              var pts = [
                {x: loc.topLeftCorner.x * sx,     y: loc.topLeftCorner.y * sy},
                {x: loc.topRightCorner.x * sx,    y: loc.topRightCorner.y * sy},
                {x: loc.bottomRightCorner.x * sx, y: loc.bottomRightCorner.y * sy},
                {x: loc.bottomLeftCorner.x * sx,  y: loc.bottomLeftCorner.y * sy},
              ];

              
              overlayCtx.fillStyle = 'rgba(0, 230, 118, 0.15)';
              overlayCtx.beginPath();
              overlayCtx.moveTo(pts[0].x, pts[0].y);
              pts.slice(1).forEach(function(p){ overlayCtx.lineTo(p.x, p.y); });
              overlayCtx.closePath();
              overlayCtx.fill();

              
              overlayCtx.strokeStyle = '#00E676';
              overlayCtx.lineWidth   = Math.max(3, vw * 0.004);
              overlayCtx.lineJoin    = 'round';
              overlayCtx.beginPath();
              overlayCtx.moveTo(pts[0].x, pts[0].y);
              pts.slice(1).forEach(function(p){ overlayCtx.lineTo(p.x, p.y); });
              overlayCtx.closePath();
              overlayCtx.stroke();

              
              overlayCtx.fillStyle = '#00E676';
              pts.forEach(function(p) {
                overlayCtx.beginPath();
                overlayCtx.arc(p.x, p.y, 6, 0, Math.PI*2);
                overlayCtx.fill();
              });

              
              var cx = pts.reduce(function(a,p){return a+p.x;},0)/4;
              var cy = pts.reduce(function(a,p){return a+p.y;},0)/4;
              if (focusRing) {
                var rect = overlayCvs.getBoundingClientRect();
                var rx = (cx / vw) * rect.width;
                var ry = (cy / vh) * rect.height;
                focusRing.style.display = '';
                focusRing.style.left    = rx + 'px';
                focusRing.style.top     = ry + 'px';
              }

              
              var fx = loc.topLeftCorner.x / QR_W + (loc.topRightCorner.x - loc.topLeftCorner.x) / QR_W / 2;
              var fy = loc.topLeftCorner.y / QR_H + (loc.bottomLeftCorner.y - loc.topLeftCorner.y) / QR_H / 2;
              _setupQrAutoFocus(
                Math.max(0, Math.min(1, fx)),
                Math.max(0, Math.min(1, fy))
              );

              _drawCnt = 8; 
            }

            
            if (code.data.trim() !== _lastQr) {
              _lastQr = code.data.trim();
              if (navigator.vibrate) navigator.vibrate([50,30,50]);
              showToast('✅ QR 인식 완료');

              
              var _val = code.data.trim();
              setTimeout(function() {
                clearInterval(scanInterval);
                if (window._afTimer) { clearInterval(window._afTimer); window._afTimer=null; }
                scanInterval = null;
                _onQrScanned(_val);
              }, 300);
            }

          } else {
            
            if (_drawCnt > 0) {
              _drawCnt--;
            } else if (overlayCtx) {
              overlayCtx.clearRect(0, 0, vw, vh);
              if (focusRing) focusRing.style.display = 'none';
            }
          }
        } catch(e) {
          
        } finally {
          _busy = false;
        }
      }, 150);
    }
  } catch(e) {
    setResult('<div style="color:var(--red-dark);font-size:12px;">\ud83d\udcf7 카메라 접근 오류: '+esc(e.message)+'<br>설정에서 카메라 권한을 허용해주세요.</div>');
    wrap.style.display = 'none';
  }
}

function tapToFocus(event) {
  var video = document.getElementById('scan-video');
  var wrap  = document.getElementById('scan-video-wrap');
  if (!scanStream || !video) return;

  
  var rect = wrap.getBoundingClientRect();
  var x = (event.clientX - rect.left) / rect.width;
  var y = (event.clientY - rect.top)  / rect.height;

  
  showFocusMarker(event.clientX - rect.left, event.clientY - rect.top);

  
  var track = scanStream ? scanStream.getVideoTracks()[0] : null;
  if (track) {
    var caps = track.getCapabilities ? track.getCapabilities() : {};
    var constr = {};
    if (caps.focusMode && caps.focusMode.includes('manual')) {
      constr.focusMode = 'manual';
    }
    if (caps.pointOfInterest) {
      constr.pointOfInterest = { x: x, y: y };
    }
    if (Object.keys(constr).length > 0) {
      track.applyConstraints({ advanced: [constr] })
        .then(function() {
          
          setTimeout(function() {
            if (track.readyState === 'live') {
              track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] }).catch(function(){});
    
    if (scanMode === 'barcode' && scanInterval) {
      clearInterval(scanInterval);
      scanInterval = null;
      setTimeout(function(){ startScan('barcode'); }, 800);
    }
              lockFocusMarker(false);
            }
          }, 1500);
          lockFocusMarker(true);
        })
        .catch(function() {
          lockFocusMarker(false);
        });
    }
  }
}

function showFocusMarker(px, py) {
  var m = document.getElementById('focus-marker');
  if (!m) return;
  m.style.display = 'block';
  m.style.left = px + 'px';
  m.style.top  = py + 'px';
  m.classList.remove('locked');
  
  clearTimeout(m._hideTimer);
  m._hideTimer = setTimeout(function() { m.style.display='none'; }, 3000);
}
function lockFocusMarker(locked) {
  var m = document.getElementById('focus-marker');
  if (!m) return;
  if (locked) m.classList.add('locked');
  else m.classList.remove('locked');
}
function hideFocusMarker() {
  var m = document.getElementById('focus-marker');
  if (m) m.style.display = 'none';
}

function applyZoom(val) {
  zoomLevel = parseFloat(val);
  var lbl = document.getElementById('zoom-lbl');
  if (lbl) lbl.textContent = (Math.round(zoomLevel*10)/10) + '\xd7';

  if (!scanStream) return;
  var track = scanStream.getVideoTracks()[0];
  if (!track) return;
  var caps = track.getCapabilities ? track.getCapabilities() : {};
  if (caps.zoom) {
    track.applyConstraints({ advanced: [{ zoom: zoomLevel }] }).catch(function(){});
  } else {
    
    var video = document.getElementById('scan-video');
    if (video) video.style.transform = 'scale('+zoomLevel+')';
  }
}

async function toggleTorch() {
  if (!scanStream) return;
  var track = scanStream.getVideoTracks()[0];
  if (!track) return;
  var caps = track.getCapabilities ? track.getCapabilities() : {};
  if (!caps.torch) { showToast('\ud83d\udca1 이 기기는 플래시를 지원하지 않습니다'); return; }
  torchOn = !torchOn;
  await track.applyConstraints({ advanced: [{ torch: torchOn }] }).catch(function(){});
  var btn = document.getElementById('btn-torch');
  if (btn) btn.classList.toggle('active', torchOn);
  showToast(torchOn ? '\ud83d\udca1 플래시 켜짐' : '\ud83d\udca1 플래시 꺼짐');
}

function toggleTimer() {
  timerOn = !timerOn;
  var btn = document.getElementById('btn-timer');
  if (btn) btn.classList.toggle('active', timerOn);
  showToast(timerOn ? '\u23f1 타이머 ON (3초 후 촬영)' : '\u23f1 타이머 OFF');
}

function captureOcrWithTimer() {
  if (timerOn) {
    
    var wrap = document.getElementById('scan-video-wrap');
    var overlay = document.createElement('div');
    overlay.className = 'countdown-overlay';
    overlay.id = 'countdown-overlay';
    wrap.appendChild(overlay);
    var count = 3;
    function tick() {
      overlay.innerHTML = '<div class="countdown-num">'+count+'</div>';
      if (count <= 0) {
        overlay.remove();
        captureOcr();
      } else {
        count--;
        setTimeout(tick, 1000);
      }
    }
    tick();
  } else {
    captureOcr();
  }
}

function startBlurMonitor() {
  var sharpWrap = document.getElementById('sharpness-bar-wrap');
  if (sharpWrap) sharpWrap.style.display = '';
  if (blurCheckInterval) clearInterval(blurCheckInterval);
  blurCheckInterval = setInterval(function() {
    var score = measureSharpness();
    updateSharpnessBar(score);
  }, 800);
}

function stopBlurMonitor() {
  if (blurCheckInterval) { clearInterval(blurCheckInterval); blurCheckInterval=null; }
  var sharpWrap = document.getElementById('sharpness-bar-wrap');
  if (sharpWrap) sharpWrap.style.display = 'none';
}

function measureSharpness() {
  var video = document.getElementById('scan-video');
  if (!video || !video.videoWidth) return 0;
  var c = document.getElementById('scan-canvas');
  var W = Math.min(video.videoWidth,  320);  
  var H = Math.min(video.videoHeight, 180);
  c.width = W; c.height = H;
  var ctx = c.getContext('2d');
  ctx.drawImage(video, 0, 0, W, H);
  var id = ctx.getImageData(0, 0, W, H).data;

  
  var gray = new Float32Array(W*H);
  for (var i=0; i<id.length; i+=4) {
    gray[i/4] = 0.299*id[i] + 0.587*id[i+1] + 0.114*id[i+2];
  }
  var lapSum = 0, cnt = 0;
  for (var y=1; y<H-1; y++) {
    for (var x=1; x<W-1; x++) {
      var lap = -4*gray[y*W+x]
        + gray[(y-1)*W+x] + gray[(y+1)*W+x]
        + gray[y*W+(x-1)] + gray[y*W+(x+1)];
      lapSum += lap*lap; cnt++;
    }
  }
  return cnt > 0 ? Math.sqrt(lapSum/cnt) : 0;
}

function updateSharpnessBar(score) {
  
  var pct   = Math.min(100, Math.round(score / 40 * 100));
  var color = pct >= 60 ? 'var(--green-mid)' : pct >= 30 ? '#FFA726' : 'var(--red-dark)';
  var fill  = document.getElementById('sharpness-fill');
  var val   = document.getElementById('sharpness-val');
  var badge = document.getElementById('blur-badge');
  if (fill) { fill.style.width = pct+'%'; fill.style.background = color; }
  if (val)  val.textContent = (pct >= 60 ? '선명 ✅' : pct >= 30 ? '보통 ⚠️' : '흐림 ❌') + ' ('+pct+'%)';
  if (badge) badge.style.display = pct < 30 ? '' : 'none';
}

function checkBlur() {
  var score = measureSharpness();
  var pct   = Math.min(100, Math.round(score/40*100));
  if (pct >= 60) showToast('\u2705 선명도 양호 ('+pct+'%) — 촬영하세요!');
  else if (pct >= 30) showToast('\u26a0\ufe0f 보통 선명도 ('+pct+'%) — 조금 더 가까이');
  else showToast('\u274c 흐림 ('+pct+'%) — 화면 탭으로 초점 맞추세요');
}

function stopScan() {
  stopBlurMonitor();
  if (scanInterval) { clearInterval(scanInterval); scanInterval=null; }
  if (window._afTimer) { clearInterval(window._afTimer); window._afTimer=null; }
  if (scanStream)   {
    
    var track = scanStream.getVideoTracks()[0];
    if (track && torchOn) {
      track.applyConstraints({ advanced:[{torch:false}] }).catch(function(){});
      torchOn = false;
    }
    scanStream.getTracks().forEach(function(t){ t.stop(); });
    scanStream = null;
  }
  var vw = document.getElementById('scan-video-wrap');
  if (vw) vw.style.display = 'none';
  hideFocusMarker();
  
  var video = document.getElementById('scan-video');
  if (video) video.style.transform = '';
}

function captureOcr() {
  var video  = document.getElementById('scan-video');
  var canvas = document.getElementById('scan-canvas');
  if (!video.srcObject) { showToast('먼저 카메라를 시작하세요'); return; }

  
  var scale = getOpt('opt-scale') ? 2 : 1;
  canvas.width  = video.videoWidth  * scale;
  canvas.height = video.videoHeight * scale;
  var ctx = canvas.getContext('2d');
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  var dataUrl = canvas.toDataURL('image/jpeg', 0.95);
  stopScan();
  showCapturedImage(dataUrl, '촬영 완료 — OCR 처리 중...');
  runOcrOnImage(dataUrl);
}

function handlePhotoUpload(input) {
  if (!input.files || !input.files[0]) return;
  
  var files = Array.from(input.files);
  var idx   = 0;
  function processNext() {
    if (idx >= files.length) return;
    var file = files[idx++];
    var reader = new FileReader();
    reader.onload = function(e) {
      showCapturedImage(e.target.result, '사진 '+idx+'/'+files.length+': '+file.name);
      runOcrOnImage(e.target.result);
    };
    reader.readAsDataURL(file);
  }
  processNext();
  input.value = '';
}

function getOpt(id) {
  var el = document.getElementById(id);
  return el ? el.checked : false;
}

function showCapturedImage(dataUrl, label) {
  var preview = document.getElementById('scan-capture-preview');
  document.getElementById('scan-capture-img').src = dataUrl;
  document.getElementById('scan-capture-label').textContent = label;
  preview.style.display = '';
  
  var existing = preview.querySelector('.scan-retake-btn');
  if (!existing) {
    var btn = document.createElement('button');
    btn.className = 'scan-retake-btn';
    btn.textContent = '🔄 다시 촬영';
    btn.onclick = function(){
      preview.style.display = 'none';
      document.getElementById('scan-result').innerHTML = '';
      document.getElementById('scan-ocr-text-section').style.display = 'none';
      if (scanMode==='ocr') startScan('ocr');
    };
    preview.style.position = 'relative';
    preview.appendChild(btn);
  }
}

async function runOcrOnImage(dataUrl) {
  setResult('<div class="ocr-loading"><div class="ocr-spinner"></div>'
    + '<div style="flex:1;">'
    + '<div style="font-weight:500;margin-bottom:5px;">🔬 농약 포장 OCR 분석 중...</div>'
    + '<div id="ocr-progress-txt" style="font-size:11px;color:rgba(255,255,255,.6);margin-bottom:5px;">준비 중...</div>'
    + '<div class="rescan-progress"><div class="rescan-progress-bar" id="ocr-prog-bar" style="width:0%"></div></div>'
    + '</div></div>');

  function setP(pct, msg) {
    var bar=document.getElementById('ocr-prog-bar');
    var txt=document.getElementById('ocr-progress-txt');
    if(bar) bar.style.width=pct+'%';
    if(txt) txt.textContent=msg||'';
  }

  var rawText = '';
  var confStr = 'medium';
  var ocrEngine = '';

  try {
    
    var gasUrl = getEffectiveGasUrl().trim();
    if (gasUrl) {
      setP(10, 'Google Drive OCR 호출 중... (정확도 높음)');
      var gasResult = await callGasOcr(dataUrl, setP);
      if (gasResult.ok) {
        rawText  = gasResult.text;
        confStr  = gasResult.koreanCharCount >= 10 ? 'high' : gasResult.koreanCharCount >= 3 ? 'medium' : 'low';
        ocrEngine = 'Google Drive OCR';
        setP(80, 'Drive OCR 완료 (한글 ' + gasResult.koreanCharCount + '자)');
      } else {
        
        setP(15, 'Drive OCR 실패 → Tesseract로 전환: ' + gasResult.error);
      }
    }

    
    if (!rawText) {
      var tessResult = await runTesseractOcr(dataUrl, setP);
      rawText  = tessResult.text;
      confStr  = tessResult.confStr;
      ocrEngine = tessResult.engine;
    }

    if (!rawText || !rawText.trim()) {
      var hasGas = !!getEffectiveGasUrl();
      setResult('<div class="ai-error-box">텍스트를 인식하지 못했습니다.<br>'
        +'💡 라벨을 정면으로, 밝은 곳에서, 흔들리지 않게 촬영해 주세요.<br>'
        + (hasGas ? '' :
          '<div style="margin-top:8px;padding:8px 10px;background:#E3F2FD;border-radius:6px;font-size:11px;color:#1565C0;">'
          +'🌐 <b>Tesseract.js만으로는 한글 인식이 어려울 수 있습니다.</b><br>'
          +'Google Drive OCR을 연결하면 정확도가 크게 향상됩니다.'
          +'</div>')
        +'<div style="display:flex;gap:6px;margin-top:8px;">'
        + (hasGas ? '' : '<button class="btn-primary" style="flex:1;" onclick="openGasSettingsModal()">⚙️ Drive OCR 연결하기</button>')
        +'<button class="btn-secondary" style="flex:1;" onclick="showOcrTextInput()">📝 직접 입력</button>'
        +'</div></div>');
      return;
    }

    setP(85, 'OCR 오류 교정 적용 중...');
    var corrected = applyOcrCorrections(rawText);

    document.getElementById('scan-ocr-textarea').value = corrected;
    document.getElementById('scan-ocr-text-section').style.display = '';

    setP(95, '제품 정보 파싱 중...');
    var parsed = parseAgriText(corrected, confStr);
    parsed._ocrSummary = '<div style="font-size:10px;color:var(--gray-400);margin-bottom:8px;background:var(--gray-100);border-radius:4px;padding:6px 8px;">'
      +'🔬 OCR 엔진: ' + esc(ocrEngine) + ' · 한글 ' + ((corrected.match(/[가-힣]/g)||[]).length) + '자 인식</div>';

    ocrParsed = parsed;
    setP(100, '완료!');
    renderOcrResult(parsed);
    
    if (window._scanForPesticide) {
      window._scanForPesticide = false;
      setTimeout(function(){ _linkScanResultToPestReg(parsed); }, 400);
    }
    if (window._scanForFertilizer) {
      window._scanForFertilizer = false;
      setTimeout(function(){ _linkScanResultToFertReg(parsed); }, 400);
    }

    if (parsed.barcode) document.getElementById('scan-code-input').value = parsed.barcode;

  } catch(e) {
    setResult('<div class="ai-error-box">OCR 오류: '+esc(e.message)+'<br>'
      +'<button class="btn-secondary" style="margin-top:8px;width:100%;" onclick="showOcrTextInput()">📝 직접 입력</button></div>');
  }
}

async function callGasOcr(dataUrl, setP) {
  try {
    var gasUrl = getEffectiveGasUrl().trim();
    var resp = await fetch(gasUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },  
      body: JSON.stringify({ action: 'ocr', imageBase64: dataUrl })
    });
    if (!resp.ok) return { ok:false, error: 'HTTP ' + resp.status };
    var data = await resp.json();
    if (!data.success) return { ok:false, error: data.error || '알 수 없는 오류' };
    return { ok:true, text: data.text || '', koreanCharCount: data.koreanCharCount || 0 };
  } catch(e) {
    var msg = e.message || String(e);
    if (msg.includes('Load failed') || msg.includes('Failed to fetch') || msg.includes('NetworkError')) {
      return { ok:false, error: 'CORS 또는 네트워크 오류 (GAS 배포 설정 확인 필요)' };
    }
    return { ok:false, error: msg };
  }
}

async function runTesseractOcr(dataUrl, setP) {
  
  setP(5, '이미지 전처리 중...');
  var MAX_PX = 1100;
  var processedVariants;
  try {
    processedVariants = preprocessForOcr(dataUrl, MAX_PX);
  } catch(prepErr) {
    console.error('[OCR] 전처리 오류:', prepErr);
    return { ok: false, error: '이미지 전처리 실패: ' + prepErr.message };
  }

  setP(15, 'OCR 엔진 초기화...');
  var worker;
  try {
    
    worker = await Tesseract.createWorker('kor', 1, {
      logger: function(m) {
        if (m.status === 'recognizing text')
          setP(20 + Math.round((m.progress||0)*55), '인식 중 ' + Math.round((m.progress||0)*100) + '%');
      },
      langPath: 'https://tessdata.projectnaptha.com/4.0.0_best',
    });
  } catch(e1) {
    try {
      
      worker = await Tesseract.createWorker('kor', 1, {
        logger: function(m) {
          if (m.status === 'recognizing text')
            setP(20 + Math.round((m.progress||0)*55), '인식 중 ' + Math.round((m.progress||0)*100) + '%');
        },
      });
    } catch(e2) {
      return { ok: false, error: 'Tesseract 엔진 로드 실패: ' + e2.message };
    }
  }

  setP(20, '텍스트 인식 중...');
  var bestResult = null;
  var bestConf   = -1;
  var lastError  = null;

  
  for (var vi = 0; vi < processedVariants.length; vi++) {
    try {
      await worker.setParameters({
        tessedit_char_whitelist: '',
        preserve_interword_spaces: '1',
        tessedit_pageseg_mode: vi === 0 ? '6' : '3',
      });
      var r = await worker.recognize(processedVariants[vi]);
      var rawText = (r.data && r.data.text) || '';
      var conf    = (r.data && r.data.confidence) || 0;

      
      var corrected = applyOcrCorrections(rawText);
      if (!corrected || corrected.trim().length < 5) continue;

      
      if (conf > bestConf) {
        bestConf   = conf;
        bestResult = { text: corrected, rawText: rawText, confidence: conf };
      }
    } catch(recErr) {
      lastError = recErr.message;
      console.warn('[OCR] 변형본 ' + vi + ' 인식 실패:', recErr.message);
    }
  }

  
  try { await worker.terminate(); } catch(e) {}

  if (!bestResult) {
    return {
      ok: false,
      error: lastError || 'OCR 인식 결과 없음 — 이미지가 너무 어둡거나 흐릿합니다'
    };
  }

  
  if (bestConf < 40) {
    console.warn('[OCR] 낮은 신뢰도:', bestConf, '% — 수동 확인 권장');
  }

  setP(80, '텍스트 분석 중...');
  return {
    ok:         true,
    text:       bestResult.text,
    rawText:    bestResult.rawText,
    confidence: bestConf,
    confLabel:  bestConf >= 70 ? 'high' : bestConf >= 40 ? 'medium' : 'low',
  };
}

function preprocessForOcr(dataUrl, maxPx) {
  var img = new Image();
  img.src = dataUrl;
  var iw = img.naturalWidth  || 800;
  var ih = img.naturalHeight || 600;
  var scale = Math.min(maxPx/iw, maxPx/ih, 1.0);
  var W = Math.round(iw*scale), H = Math.round(ih*scale);

  var c = document.createElement('canvas');
  c.width=W; c.height=H;
  var ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, W, H);

  
  var regions = [
    { y1: Math.round(H*0.05), y2: Math.round(H*0.65), label: 'full' },
    { y1: Math.round(H*0.10), y2: Math.round(H*0.50), label: 'top' },
  ];

  var variants = [];
  regions.forEach(function(reg) {
    var rH = reg.y2 - reg.y1;
    var rc = document.createElement('canvas');
    rc.width=W; rc.height=rH;
    var rctx = rc.getContext('2d');
    rctx.drawImage(c, 0, reg.y1, W, rH, 0, 0, W, rH);
    var imgData = rctx.getImageData(0,0,W,rH);
    var d = imgData.data;

    
    var gray = new Uint8Array(W*rH);
    var hist = new Int32Array(256);
    for (var i=0;i<d.length;i+=4) {
      var g = Math.round(d[i]*0.299+d[i+1]*0.587+d[i+2]*0.114);
      gray[i/4]=g; hist[g]++;
    }

    
    var total=W*rH, sumT=0, sumB=0, wB=0, maxV=0, thr=128;
    for (var t=0;t<256;t++) sumT+=t*hist[t];
    for (var t2=0;t2<256;t2++) {
      wB+=hist[t2]; if(!wB) continue;
      var wF=total-wB; if(!wF) break;
      sumB+=t2*hist[t2];
      var mB=sumB/wB, mF=(sumT-sumB)/wF;
      var v=wB*wF*(mB-mF)*(mB-mF);
      if(v>maxV){maxV=v;thr=t2;}
    }

    
    for (var j=0;j<d.length;j+=4) {
      var v2 = gray[j/4] > thr ? 255 : 0;
      d[j]=d[j+1]=d[j+2]=v2; d[j+3]=255;
    }
    rctx.putImageData(imgData,0,0);
    variants.push({ dataUrl: rc.toDataURL('image/png'), label: reg.label+'_otsu('+thr+')' });

    
    var rc2 = document.createElement('canvas');
    rc2.width=W; rc2.height=rH;
    var rctx2 = rc2.getContext('2d');
    rctx2.drawImage(c, 0, reg.y1, W, rH, 0, 0, W, rH);
    var imgData2 = rctx2.getImageData(0,0,W,rH);
    var d2=imgData2.data;
    for (var k=0;k<d2.length;k+=4) {
      var g2=Math.round(d2[k]*0.299+d2[k+1]*0.587+d2[k+2]*0.114);
      
      g2 = Math.min(255,Math.max(0,Math.round((g2-128)*1.8+128)));
      d2[k]=d2[k+1]=d2[k+2]=g2;
    }
    rctx2.putImageData(imgData2,0,0);
    variants.push({ dataUrl: rc2.toDataURL('image/png'), label: reg.label+'_contrast' });
  });
  
  var bigRow = findBigTextRow(c, W, H);
  if (bigRow) {
    var br = document.createElement('canvas');
    br.width=W; br.height=bigRow.h+20;
    var brctx=br.getContext('2d');
    brctx.drawImage(c, 0, bigRow.y-10, W, bigRow.h+20, 0, 0, W, bigRow.h+20);
    
    var br3=document.createElement('canvas');
    br3.width=W*3; br3.height=(bigRow.h+20)*3;
    br3.getContext('2d').drawImage(br, 0,0, br3.width, br3.height);
    
    var brid=br3.getContext('2d').getImageData(0,0,br3.width,br3.height);
    var brd=brid.data;
    var brg=new Uint8Array(br3.width*br3.height);
    var brh2=new Int32Array(256);
    for(var i=0;i<brd.length;i+=4){ var g=Math.round(brd[i]*.299+brd[i+1]*.587+brd[i+2]*.114); brg[i/4]=g; brh2[g]++; }
    var brthr=128, brsT=0,brwB=0,brsB=0,brmxV=0,brtot=br3.width*br3.height;
    for(var t=0;t<256;t++) brsT+=t*brh2[t];
    for(var t2=0;t2<256;t2++){
      brwB+=brh2[t2]; if(!brwB) continue;
      var brwF=brtot-brwB; if(!brwF) break;
      brsB+=t2*brh2[t2]; var brmB=brsB/brwB,brmF=(brsT-brsB)/brwF;
      var brv=brwB*brwF*(brmB-brmF)*(brmB-brmF);
      if(brv>brmxV){brmxV=brv;brthr=t2;}
    }
    for(var j=0;j<brd.length;j+=4){ var v3=brg[j/4]>brthr?255:0; brd[j]=brd[j+1]=brd[j+2]=v3; }
    br3.getContext('2d').putImageData(brid,0,0);
    variants.push({dataUrl:br3.toDataURL('image/png'), label:'bigrow_y'+bigRow.y+'_3x'});
  }

  return variants;
}

function findBigTextRow(canvas, W, H) {
  var ctx=canvas.getContext('2d');
  var cropH=Math.round(H*.65);
  var imgData=ctx.getImageData(0,0,W,cropH);
  var d=imgData.data;

  
  var gray=new Uint8Array(W*cropH), hist=new Int32Array(256);
  for(var i=0;i<d.length;i+=4){ var g=Math.round(d[i]*.299+d[i+1]*.587+d[i+2]*.114); gray[i/4]=g; hist[g]++; }
  var total=W*cropH,sumT=0,sumB=0,wB=0,maxV=0,thr=128;
  for(var t=0;t<256;t++) sumT+=t*hist[t];
  for(var t2=0;t2<256;t2++){
    wB+=hist[t2]; if(!wB) continue;
    var wF=total-wB; if(!wF) break;
    sumB+=t2*hist[t2]; var mB=sumB/wB,mF=(sumT-sumB)/wF;
    var v=wB*wF*(mB-mF)*(mB-mF); if(v>maxV){maxV=v;thr=t2;}
  }

  
  var rowDark=new Int32Array(cropH);
  for(var y=0;y<cropH;y++){
    for(var x=0;x<W;x++){ if(gray[y*W+x]<thr) rowDark[y]++; }
  }

  
  var minDark=Math.round(W*.05);
  var bands=[], inBand=false, bStart=0;
  for(var y2=0;y2<cropH;y2++){
    if(rowDark[y2]>=minDark && !inBand){ inBand=true; bStart=y2; }
    else if(rowDark[y2]<minDark && inBand){
      inBand=false;
      var bh=y2-bStart;
      if(bh>=10) bands.push({y:bStart, h:bh});
    }
  }
  if(inBand && cropH-bStart>=10) bands.push({y:bStart, h:cropH-bStart});

  if(!bands.length) return null;
  
  bands.sort(function(a,b){return b.h-a.h;});
  return bands[0];
}

function applyOcrCorrections(text) {
  var fixes = [
    
    [/트리플록시스트로\s*빈/g,              '트리플록시스트로빈'],
    [/에스[떼뗴][둥틱톡]라클로르/g,         '에스메톨라클로르'],
    [/에스피농라클로르/g,                    '에스메톨라클로르'],
    [/에스메[톨놀]라클로르/g,               '에스메톨라클로르'],
    [/플룩사메[티터]마이[트드]\s*유[티위테]세/g, '플룩사메타마이드 유탁제'],
    [/플룩사메타마이[트드]/g,               '플룩사메타마이드'],
    [/플루아지님/g,                          '플루아지남'],
    [/플루아지[나내냐]/g,                   '플루아지남'],
    [/메[탈달]락[실씰][엠옘앰]/g,          '메탈락실엠'],
    [/디[페패]노코[나다][졸족]/g,          '디페노코나졸'],
    [/이미녹[타다][딘딘]/g,                 '이미녹타딘'],
    [/에토프로[포파][스즈]/g,               '에토프로포스'],
    
    [/리도[딜밀][골굴]드/g,                '리도밀골드'],
    [/영[밀믿]\s*리도/g,                   '영일 리도'],
    [/삼진[학환왜왕]/g,                     '삼진왕'],
    [/후[론롬롤]사이[드트]/g,              '후론사이드'],
    [/다트[를를]/g,                         '다트롤'],
    [/듀[알앨]골[드트]/g,                  '듀알골드'],
    
    [/품봄[랑명]/g,                         '품목명'],
    [/품봄/g,                               '품목'],
    [/액상수[헤헤에]/g,                    '액상수화제'],
    [/저[특특독]성/g,                       '저독성'],
    [/살[군균]제/g,                         '살균제'],
    [/살[충종]제/g,                         '살충제'],
    [/농[악아]/g,                           '농약'],
    [/입[재제]/g,                           '입제'],
    [/유[탁탑]제/g,                         '유탁제'],
    
    [/피노[큐쿼]나졸/g,                     '디페노코나졸'],
    [/트리[세테]트/g,                       '트리아세테이트'],
    [/미탁[서]/g,                           '미탁제'],
    [/[무봄봄]목명/g,                       '품목명'],
    [/에스[피]농라클로르/g,                 '에스메톨라클로르'],
    [/에스피[농롱통]라클로르/g,             '에스메톨라클로르'],
    [/에스메[톨]라클[오로]르/g,             '에스메톨라클로르'],
    [/에토프로[파][스]/g,                   '에토프로포스'],
    [/다트[를뢸]/g,                         '다트롤'],
    [/후[론]사이[트]/g,                     '후론사이드'],
    [/리도[딜][골]드/g,                     '리도밀골드'],
    [/삼진[학환]/g,                         '삼진왕'],
  ];
  var result = text;
  fixes.forEach(function(pair) { result = result.replace(pair[0], pair[1]); });
  return result;
}

function toggleOcrTextEdit() {
  var body = document.getElementById('ocr-textedit-body');
  var arrow = document.getElementById('ocr-textedit-arrow');
  if (!body) return;
  var isHidden = body.style.display === 'none';
  body.style.display = isHidden ? '' : 'none';
  if (arrow) arrow.textContent = isHidden ? '▼' : '▶';
}

function toggleRawTextBox(toggleEl) {
  var box = toggleEl.nextElementSibling;
  if (!box) return;
  var isHidden = box.style.display === 'none';
  box.style.display = isHidden ? 'block' : 'none';
  toggleEl.textContent = isHidden
    ? '▼ 원문 텍스트 숨기기'
    : '▶ 원문 텍스트 보기 (클릭하여 제품명에 적용)';
}

function buildClickableRawText(rawText) {
  var lines = rawText.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);
  return lines.map(function(line){
    
    var words = line.split(/\s+/).filter(function(w){ return w.length>=2; });
    var lineHtml = '<div class="ocr-raw-line">'
      + '<span class="ocr-raw-line-full" data-text="'+esc(line)+'" onclick="applyRawTextClick(this)" title="클릭하면 전체 줄이 제품명에 입력됩니다">'
      + esc(line) + '</span>';
    
    if (words.length >= 2) {
      lineHtml += '<span class="ocr-raw-word-list">'
        + words.map(function(w){
            return '<span class="ocr-raw-word" data-text="'+esc(w)+'" onclick="applyRawTextClick(this);event.stopPropagation();">'+esc(w)+'</span>';
          }).join('')
        + '</span>';
    }
    lineHtml += '</div>';
    return lineHtml;
  }).join('');
}

var _activeOcrFieldId = 'ocr-f-name';  
function setActiveOcrField(id) {
  _activeOcrFieldId = id;
  
  document.querySelectorAll('.ocr-field-item input, .ocr-field-item textarea, .ocr-field-item select').forEach(function(el){
    el.classList.remove('ocr-field-active');
  });
  var el = document.getElementById(id);
  if (el) el.classList.add('ocr-field-active');

  
  document.querySelectorAll('.ocr-quickjump-btn').forEach(function(b){
    b.classList.toggle('active', b.getAttribute('data-target') === id);
  });
}

function applyRawTextClick(el) {
  var text = el.getAttribute('data-text') || el.textContent.trim();
  if (!text) return;

  var targetId = _activeOcrFieldId || 'ocr-f-name';
  var target = document.getElementById(targetId);
  
  if (!target) { targetId = 'ocr-f-name'; target = document.getElementById(targetId); }
  if (!target) return;

  target.value = text;
  target.style.transition = 'background-color .15s';
  target.style.backgroundColor = '#FFF9C4';
  setTimeout(function(){ target.style.backgroundColor = ''; }, 500);
  target.focus();

  if (targetId === 'ocr-f-name') {
    var statusEl = document.getElementById('ocr-lookup-status');
    if (statusEl) statusEl.textContent = '';
  }

  var fieldLabel = getOcrFieldLabel(targetId);
  showToast('✅ [' + fieldLabel + ']에 적용: ' + text);
}

function getOcrFieldLabel(id) {
  var labels = {
    'ocr-f-name':'제품명', 'ocr-f-tab':'분류 탭', 'ocr-f-type':'세부분류',
    'ocr-f-regno':'등록번호', 'ocr-f-ingredient':'성분·함량', 'ocr-f-mfr':'제조사',
    'ocr-f-target':'방제대상·효과', 'ocr-f-method':'사용방법',
    'ocr-f-amount':'사용량', 'ocr-f-timing':'사용시기', 'ocr-f-warning':'주의사항',
  };
  return labels[id] || '입력란';
}

function buildQuickJumpBar() {
  var fields = [
    {id:'ocr-f-name',       label:'제품명',     icon:'🏷️'},
    {id:'ocr-f-ingredient', label:'성분',       icon:'🧪'},
    {id:'ocr-f-target',     label:'방제대상',   icon:'🐛'},
    {id:'ocr-f-method',     label:'사용방법',   icon:'💧'},
    {id:'ocr-f-amount',     label:'사용량',     icon:'⚖️'},
    {id:'ocr-f-timing',     label:'사용시기',   icon:'📅'},
    {id:'ocr-f-warning',    label:'주의사항',   icon:'⚠️'},
    {id:'ocr-f-regno',      label:'등록번호',   icon:'#'},
    {id:'ocr-f-mfr',        label:'제조사',     icon:'🏭'},
  ];
  return '<div class="ocr-quickjump-bar">'
    + fields.map(function(f){
        return '<button type="button" class="ocr-quickjump-btn" data-target="'+f.id+'" onclick="jumpToOcrField(this)">'
          + f.icon + ' ' + f.label + '</button>';
      }).join('')
    + '</div>';
}

function jumpToOcrField(btn) {
  var targetId = btn.getAttribute('data-target');
  setActiveOcrField(targetId);

  
  document.querySelectorAll('.ocr-quickjump-btn').forEach(function(b){ b.classList.remove('active'); });
  btn.classList.add('active');

  var target = document.getElementById(targetId);
  if (target) {
    target.scrollIntoView({ behavior:'smooth', block:'center' });
    
    target.style.transition = 'box-shadow .2s';
    target.style.boxShadow = '0 0 0 3px rgba(21,101,192,.35)';
    setTimeout(function(){ target.style.boxShadow=''; }, 700);
  }
  showToast('👉 [' + getOcrFieldLabel(targetId) + '] 선택됨 — 위에서 글자를 누르면 여기 채워집니다');
}

function collapseUpperScanUI() {
  var toHide = ['scan-video-wrap', 'ocr-options-row', 'scan-capture-preview',
                'scan-barcode-btns', 'scan-ocr-btns', 'scan-ocr-tips', 'scan-code-section'];
  toHide.forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.style.display = 'none';
  });
  
  var tabs = document.querySelector('.scan-mode-tabs');
  if (tabs) tabs.style.display = 'none';
}

function restoreUpperScanUI() {
  var tabs = document.querySelector('.scan-mode-tabs');
  if (tabs) tabs.style.display = '';
  var opts = document.getElementById('ocr-options-row');
  if (opts) opts.style.display = '';
  var tips = document.getElementById('scan-ocr-tips');
  if (tips) tips.style.display = '';
  var ocrBtns = document.getElementById('scan-ocr-btns');
  if (ocrBtns) ocrBtns.style.display = 'flex';
}

function renderOcrResult(p) {
  if (!p) return;
  _activeOcrFieldId = 'ocr-f-name';  

  
  collapseUpperScanUI();

  var conf    = p.confidence||'low';
  var confCls = conf==='high'?'background:#C8E6C9;color:#1B5E20;':conf==='medium'?'background:#FFF9C4;color:#E65100;':'background:#FFCDD2;color:#B71C1C;';

  window._scanResult = p;  

  var html2 = '';

  
  if (p.raw_text) {
    html2 += '<div class="ocr-rawtext-panel">'
      + '<div class="ocr-rawtext-title">👆 인식된 글자를 탭하세요</div>'
      + '<div class="ocr-rawtext-sub">먼저 넣을 칸을 아래에서 선택 →  그 다음 글자를 누르면 채워집니다</div>'
      + buildQuickJumpBar()
      + '<div class="ocr-raw-box-big">' + buildClickableRawText(p.raw_text) + '</div>'
      + '</div>';
  }

  
  html2 += '<div class="ocr-result-card">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:10px;">'
    + '<div style="font-size:13px;font-weight:600;color:var(--green-dark);">📝 OCR 인식 결과</div>'
    + '<span class="ocr-confidence" style="'+confCls+'">신뢰도: '+conf+'</span>'
    + '</div>';

  html2 += '<div class="ocr-field-row">'
    + ocrFieldNameWithLookup('제품명 *', 'ocr-f-name', p.name||'', '제품명 입력 또는 위에서 클릭')
    + ocrField('분류 탭',     'ocr-f-tab',        p.tab||'pest',    'select-tab', '')
    + '</div><div class="ocr-field-row">'
    + ocrField('세부분류',    'ocr-f-type',       p.type||'',       'input',  '예: 살충제, 복합비료')
    + ocrField('등록번호',    'ocr-f-regno',      p.regNo||p.barcode||'', 'input', '')
    + '</div><div class="ocr-field-row">'
    + ocrField('성분·함량',   'ocr-f-ingredient', p.ingredient||'', 'input',  '예: 이미다클로프리드 8%')
    + ocrField('제조사',      'ocr-f-mfr',        p.manufacturer||'','input', '')
    + '</div>'
    + '<div class="ocr-field-row">'
    + ocrFieldFull('방제대상·효과', 'ocr-f-target', p.target||'',   '예: 진딧물, 나방류 유충...')
    + '</div><div class="ocr-field-row">'
    + ocrFieldFull('사용방법',      'ocr-f-method', p.method||'',   '예: 2,000배 경엽살포')
    + '</div><div class="ocr-field-row">'
    + ocrField('사용량',      'ocr-f-amount',  p.amount||'',  'input', '예: 20kg/10a')
    + ocrField('사용시기',    'ocr-f-timing',  p.timing||'',  'input', '예: 생육기 전반')
    + '</div>'
    + '<div class="ocr-field-row">'
    + ocrFieldFull('주의사항', 'ocr-f-warning', p.warning||'', '주의사항·안전정보')
    + '</div>';

  html2 += '<div style="display:flex;gap:6px;margin-top:12px;">'
    + '<button class="btn-primary" style="flex:2;" onclick="saveOcrResult()">✅ DB에 등록</button>'
    + '<button class="btn-secondary" style="flex:1;" onclick="retakeOcr()">🔄 재촬영</button>'
    + '</div></div>';

  setResult(html2);

  
  var firstBtn = document.querySelector('.ocr-quickjump-btn[data-target="ocr-f-name"]');
  if (firstBtn) firstBtn.classList.add('active');
}

function ocrFieldNameWithLookup(label, id, val, ph) {
  return '<div class="ocr-field-item" style="flex:100%;min-width:100%;">'
    + '<label>'+label+'</label>'
    + '<div style="display:flex;gap:5px;align-items:stretch;">'
    + '<input id="'+id+'" type="text" value="'+esc(val)+'" placeholder="'+esc(ph)+'" '
    +   'style="flex:1;" onfocus="setActiveOcrField(this.id)" oninput="document.getElementById(\'ocr-lookup-status\').textContent=\'\';">'
    + '<button type="button" class="ocr-lookup-btn" onclick="lookupProductByName()" title="내장 DB에서 조회 (즉시)">🔍 DB조회</button>'
    + '</div>'
    + '<div id="ocr-lookup-status" class="ocr-lookup-status"></div>'
    + '<div class="ocr-extlink-row">'
    +   '<span style="font-size:10px;color:var(--gray-400);">작물별 사용시기·사용량 확인:</span>'
    +   '<button type="button" class="ocr-extlink-btn" onclick="openExternalLookup(\'psis\')">🌐 농약안전정보시스템</button>'
    +   '<button type="button" class="ocr-extlink-btn" onclick="openExternalLookup(\'nongsaro\')">🌱 농사로</button>'
    + '</div>'
    + '</div>';
}

function openExternalLookup(site) {
  var nameInput = document.getElementById('ocr-f-name');
  var name = nameInput ? nameInput.value.trim() : '';
  if (!name) { showToast('제품명을 먼저 입력하세요'); return; }

  var url;
  if (site === 'psis') {
    
    url = 'https://psis.rda.go.kr/psis/index.ps?menuId=PS00069';
  } else {
    
    url = 'https://www.nongsaro.go.kr/portal/ps/psc/pscc/insectAgchApplcLst.ps?menuId=PS00207';
  }
  
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(name).then(function(){
      showToast('📋 "'+name+'" 복사됨 — 새 탭의 검색창에 붙여넣으세요');
    }).catch(function(){});
  } else {
    showToast('새 탭에서 "'+name+'"을(를) 검색창에 입력하세요');
  }
  window.open(url, '_blank');
}

async function lookupProductByName() {
  var nameInput = document.getElementById('ocr-f-name');
  var statusEl  = document.getElementById('ocr-lookup-status');
  var name = nameInput ? nameInput.value.trim() : '';

  if (!name) {
    statusEl.innerHTML = '<span style="color:var(--red-dark);">제품명을 먼저 입력하세요</span>';
    return;
  }

  statusEl.innerHTML = '<span style="color:var(--gray-400);">🔍 DB에서 조회 중...</span>';

  
  var match = matchMasterDb(name);

  if (match) {
    fillOcrFieldsFromMatch(match);
    statusEl.innerHTML = '<span style="color:var(--green-dark);">✅ DB 매칭: <b>'+esc(match.name)+'</b> — 정보가 자동으로 채워졌습니다</span>';
    if (match.name !== name) {
      
      nameInput.value = match.name;
    }
    return;
  }

  
  statusEl.innerHTML = '<span style="color:var(--gray-400);">🌐 추가 정보 검색 중...</span>';
  var enriched = await enrichItemWithAI({ name: name });

  if (enriched && enriched.hasUpdate) {
    fillOcrFieldsFromMatch(enriched);
    statusEl.innerHTML = '<span style="color:var(--blue-dark);">💡 유사 제품 정보로 보완됨'
      + (enriched.summary ? ' — '+esc(enriched.summary) : '') + '</span>';
  } else {
    statusEl.innerHTML = '<span style="color:var(--orange);">⚠️ DB에 일치하는 정보가 없습니다. 직접 입력해 주세요</span>';
  }
}

function fillOcrFieldsFromMatch(src) {
  var map = {
    'ocr-f-type':       src.type,
    'ocr-f-regno':      src.regNo,
    'ocr-f-ingredient': src.ingredient,
    'ocr-f-mfr':        src.manufacturer,
    'ocr-f-target':     src.target,
    'ocr-f-method':     src.method,
    'ocr-f-amount':     src.amount,
    'ocr-f-timing':     src.timing,
    'ocr-f-warning':    src.warning,
  };
  Object.keys(map).forEach(function(id){
    var el = document.getElementById(id);
    if (el && !el.value && map[id]) {
      el.value = map[id];
      el.style.transition = 'background-color .15s';
      el.style.backgroundColor = '#FFF9C4';
      setTimeout(function(){ el.style.backgroundColor=''; }, 600);
    }
  });
  
  var tabSel = document.getElementById('ocr-f-tab');
  if (tabSel && src.tab) tabSel.value = src.tab;
}

function ocrField(label, id, val, type, ph) {
  var inner = type==='select-tab'
    ? '<select id="'+id+'" onfocus="setActiveOcrField(this.id)"><option value="pest"'+(val==='pest'?' selected':'')+'>농약</option><option value="fert"'+(val==='fert'?' selected':'')+'>비료·퇴비·영양제</option><option value="micro"'+(val==='micro'?' selected':'')+'>미생물균</option></select>'
    : '<input id="'+id+'" type="text" value="'+esc(val)+'" placeholder="'+esc(ph)+'" onfocus="setActiveOcrField(this.id)">';
  return '<div class="ocr-field-item"><label>'+label+'</label>'+inner+'</div>';
}
function ocrFieldFull(label, id, val, ph) {
  return '<div class="ocr-field-item" style="flex:100%;min-width:100%;"><label>'+label+'</label>'
    + '<textarea id="'+id+'" placeholder="'+esc(ph)+'" onfocus="setActiveOcrField(this.id)">'+esc(val)+'</textarea></div>';
}

async function saveOcrResult() {
  var btn = document.querySelector('.ocr-save-btn');
  if (btn) { btn.disabled = true; btn.textContent = '저장 중...'; }
  try {
    var name = (document.getElementById('ocr-f-name')||{}).value||'';
    name = name.trim();
    if (!name) { showToast('❌ 제품명을 입력하세요'); return; }
    function getClean(id) {
      var v = (document.getElementById(id)||{}).value||'';
      return v.replace(/[\u0000-\u001F\u007F]/g,'').trim();
    }
    var tab        = getClean('ocr-f-tab') || 'pest';
    var ingredient = getClean('ocr-f-ingredient');
    var target     = getClean('ocr-f-target');
    var regNo      = getClean('ocr-f-regno');
    var type       = getClean('ocr-f-type') || '살균제';
    var method     = getClean('ocr-f-method');
    var amount     = getClean('ocr-f-amount');
    var timing     = getClean('ocr-f-timing');
    var warning    = getClean('ocr-f-warning');
    var mfr        = getClean('ocr-f-mfr');
    var barcode    = ((document.getElementById('scan-code-input')||{}).value||'').trim();
    if (!ingredient && !target) {
      var proceed = confirm('성분 또는 방제대상 정보가 비어있습니다.\n\n🔍 조회 버튼으로 정보를 먼저 가져오시겠습니까?\n(취소 → 빈 정보로 그대로 등록)');
      if (proceed) { lookupProductByName(); return; }
    }
    var saveData = {
      name, tab, type,
      regNo:        regNo        || 'N/A',
      ingredient:   ingredient   || '',
      target:       target       || '',
      method:       method       || '',
      amount:       amount       || '',
      timing:       timing       || '',
      warning:      warning      || '',
      manufacturer: mfr          || '',
      barcode:      barcode      || '',
      ocrScanned:   true,
      savedAt:      new Date().toISOString(),
      _version:     1,
    };
    var result = await _gasPost(Object.assign({ action:'addUserDb', tab:tab }, saveData));
    saveData.id = (result&&result.id) ? result.id : Date.now().toString();
    if (!USER_DB[tab]) USER_DB[tab] = [];
    USER_DB[tab].push(saveData);
    var savedMsg = '✅ ' + name + ' Google Sheets 저장 완료';
    showToast(savedMsg);
    closeModal('scan-modal');
    APP.dbTab = tab;
    var tabBtn = document.getElementById('dbt-' + tab);
    if (tabBtn) {
      document.querySelectorAll('.db-tab').forEach(function(b){ b.classList.remove('on'); });
      tabBtn.classList.add('on');
    }
    if (tab === 'fert' || tab === 'nutr') renderFertPanel(tab);
    else if (tab === 'micro')             renderMicroPanel();
    else                                   renderDb();
    switchTab('db');
    updatePendingBadge();
  } catch(err) {
    console.error('[saveOcrResult] 저장 오류:', err);
    showToast('⚠️ 저장 실패: ' + (err.message || '알 수 없는 오류'));
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = '✅ DB에 등록'; }
  }
}

function getV(id) { var el=document.getElementById(id); return el?(el.value||el.textContent||'').trim():''; }

async function analyzeOcrText() {
  var text = document.getElementById('scan-ocr-textarea').value.trim();
  if (!text) { showToast('텍스트를 입력하세요'); return; }
  setResult('<div class="ocr-loading"><div class="ocr-spinner"></div>텍스트 분석 중...</div>');
  
  setTimeout(function() {
    var parsed = parseAgriText(text, 'medium');
    ocrParsed = parsed;
    renderOcrResult(parsed);
  }, 100);
}

function retakeOcr() {
  restoreUpperScanUI();
  document.getElementById('scan-capture-preview').style.display = 'none';
  document.getElementById('scan-result').innerHTML = '';
  document.getElementById('scan-ocr-text-section').style.display = 'none';
  startScan('ocr');
}

function showOcrTextInput() {
  document.getElementById('scan-ocr-text-section').style.display = '';
  document.getElementById('scan-ocr-textarea').value = '';
  document.getElementById('scan-ocr-textarea').focus();
}

function setResult(html2) { document.getElementById('scan-result').innerHTML = html2; }
function hide(id) { var e=document.getElementById(id); if(e) e.style.display='none'; }
function show2(id) { var e=document.getElementById(id); if(e) e.style.display=''; }

function openScanModal() {
  stopScan();
  restoreUpperScanUI();
  document.getElementById('scan-result').innerHTML = '';
  document.getElementById('scan-code-input').value = '';
  document.getElementById('scan-capture-preview').style.display = 'none';
  document.getElementById('scan-ocr-text-section').style.display = 'none';
  document.getElementById('scan-ocr-textarea').value = '';
  
  setScanMode('barcode', document.getElementById('smt-barcode'));
  document.getElementById('scan-modal').classList.remove('hidden');
  setTimeout(initPsisKeyUI, 150);  
}

async function addScannedItem() {
  try {
    var info = window._scanResult;
    if (!info) { showToast('검색 결과가 없습니다'); return; }
    var tab = info.tab||'pest';
    info.createdAt = new Date().toISOString();
    info.barcode = document.getElementById('scan-code-input').value.trim();
    var r = await _gasPost(Object.assign({ action:'addUserDb', tab:tab }, info)).catch(function(e){
      showToast('저장 오류: '+e.message); return null;
    });
    if (r) {
      info.id = r.id || Date.now().toString();
      if (!USER_DB[tab]) USER_DB[tab] = [];
      USER_DB[tab].push(info);
      window._scanResult = null;
      showToast('✅ '+info.name+' DB에 등록 완료');
      closeModal('scan-modal');
      APP.dbTab = tab; renderDb();
    }
  } catch(e) { showToast('등록 오류: '+e.message); }
}

var USER_DB = { pest:[], fert:[], nutr:[], micro:[] };
var CSV_PENDING = [];
var TBADGE = {'살충제':'badge-ins','살균제':'badge-fun','살균살충제':'badge-fert','비선택성 제초제':'badge-her','선택성 제초제':'badge-her','토양살충제':'badge-soi','생장조정제·기타':'badge-log'};
var FBADGE = {'복합비료':'badge-fert','질소질비료':'badge-fert','인산질비료':'badge-fert','칼리질비료':'badge-fert','퇴비·유기질':'badge-plant','미량요소':'badge-log','석회·토양개량':'badge-soi'};
var TAB_LABELS = {pest:'농약', fert:'비료·퇴비·영양제', micro:'미생물균'};

function getMergedDb(tab) {
  var base=[];
  if(tab==='pest') base=MASTER_DB.pesticides.map(function(x){ return Object.assign({},x,{_src:'base'}); });
  else if(tab==='fert') base=MASTER_DB.fertilizers.map(function(x){ return Object.assign({},x,{_src:'base'}); });
  
  var tabs = tab==='fert' ? ['fert','nutr'] : [tab];
  var user = [];
  tabs.forEach(function(t){ user = user.concat((USER_DB[t]||[]).map(function(x){ return Object.assign({},x,{_src:'user'}); })); });
  return base.concat(user);
}

function renderDb() {
  var tab=APP.dbTab||'pest';
  var q=(document.getElementById('db-search').value||'').toLowerCase();
  var el=document.getElementById('db-list');
  var cnt=document.getElementById('db-count');
  var all=getMergedDb(tab);
  var items=all.filter(function(item){
    if(!q) return true;
    return ['name','ingredient','target','type','effect','form'].some(function(k){ return item[k]&&String(item[k]).toLowerCase().includes(q); });
  });
  var baseCnt=all.filter(function(x){ return x._src==='base'; }).length;
  var userCnt=(USER_DB[tab]||[]).length;
  if(cnt) cnt.textContent=items.length+'개 항목 (기본 '+baseCnt+'종 + 내 등록 '+userCnt+'종)';
  if(items.length===0){ el.innerHTML='<div class="empty-state"><span class="emoji">🔍</span><p>검색 결과 없음</p></div>'; return; }
  el.innerHTML=items.map(function(item){
    var isUser=item._src==='user';
    var badge=getBadgeClass(tab,item);
    var typeStr=item.type||'';
    var detail=buildDbDetail(tab,item);
    var actions=isUser
      ?'<div class="db-item-actions">'
        +'<button class="db-edit-btn" data-id="'+esc(item.id||'')+'" data-tab="'+tab+'" onclick="openDbEdit(this);event.stopPropagation();">✏️ 수정</button>'
        +'<button class="db-del-btn" data-id="'+esc(item.id||'')+'" data-tab="'+tab+'" onclick="deleteDbItemEl(this);event.stopPropagation();">🗑 삭제</button>'
        +'</div>':'';
    return '<div class="db-item db-collapsed'+(isUser?' user-item':'')+'" onclick="toggleDbItem(this)">'
      +'<div class="db-item-header">'
      +'<span class="db-item-name">'+(item.emoji?esc(item.emoji)+' ':'')+esc(item.name)+(isUser?' <span class="db-user-badge">내 등록</span>':'')+'</span>'
      +'<div style="display:flex;gap:4px;align-items:center;flex-shrink:0;">'
      +(typeStr?'<span class="badge '+badge+'">'+esc(typeStr)+'</span>':'')
      +(item.qty?'<span style="font-size:10px;color:var(--gray-400);">'+esc(String(item.qty))+(item.unit?' '+esc(item.unit):'')+'</span>':'')
      +'</div></div>'
      +'<div class="db-item-detail">'+detail+'</div>'
      +actions+'</div>';
  }).join('');
}

function getBadgeClass(tab,item){
  var t=item.type||'';
  if(tab==='pest') return TBADGE[t]||'badge-ins';
  if(tab==='fert') return FBADGE[t]||'badge-fert';
  if(tab==='nutr') return 'badge-fert';
  return 'badge-log';
}

function buildDbDetail(tab,item){
  if(tab==='pest') {
    var moaBadge = item.moa ? buildMoaBadge(item.moa) : '';
    return moaBadge+(moaBadge?'<br>':'')+'<b>성분:</b> '+esc(item.ingredient||'')+'<br><b>방제:</b> '+esc(item.target||'')+'<br><b>방법:</b> '+esc(item.method||'')+'<br><b>꿀벌독성:</b> '+esc(item.bee_toxicity||'')+' · <b>개화기:</b> '+esc(item.bloom_use||'')+(item.warning?'<br><b>주의:</b> '+esc(item.warning):'')+(item.crop_range?'<br><b>적용:</b> '+esc(item.crop_range):'')+(item.note?'<br><b>메모:</b> '+esc(item.note):'');
  }
  var base = '<b>성분:</b> '+esc(item.ingredient||'')+'<br><b>효과:</b> '+esc(item.effect||'')+'<br><b>방법:</b> '+esc(item.method||'')+(item.amount?'<br><b>사용량:</b> '+esc(item.amount):'')+(item.timing?'<br><b>시기:</b> '+esc(item.timing):'')+(item.note?'<br><b>비고:</b> '+esc(item.note):'');
  if (item.cropUsage) {
    var crops = Object.keys(item.cropUsage).slice(0,5).join(', ');
    var total = Object.keys(item.cropUsage).length;
    base += '<br><span style="color:var(--green-dark);font-size:11px;">🌱 작물별 정보: '+esc(crops)+(total>5?' 외 '+(total-5)+'종':'')+'</span>';
  }
  return base;
}

function toggleDbItem(el){ el.classList.toggle('db-collapsed'); }
function setDbTab(tab,el){
  APP.dbTab=tab;
  document.querySelectorAll('.db-tab').forEach(function(b){ b.classList.remove('on'); });
  el.classList.add('on'); document.getElementById('db-search').value='';
  var _srch=document.getElementById('db-search'); if(_srch) _srch.style.display=(tab==='mypest'||tab==='spray')?'none':'';
  if (tab === 'mypest')                    { renderMyPestPanel(); }
  else if (tab === 'harvest')              { renderHarvestPanel(); }
  else if (tab === 'fert' || tab === 'nutr') { renderFertPanel(tab); }
  else if (tab === 'micro')                  { renderMicroPanel(); }
  else if (tab === 'spray')                  { renderSpraySchedulerPanel(); }
  else { renderDb(); }
}

async function loadUserDb(){
  var tabs=['pest','fert','nutr','micro'];
  try {
    for(var i=0;i<tabs.length;i++){
      var raw = await _gasGet('getUserDb', { tab:tabs[i] }).catch(function(){ return []; });
      USER_DB[tabs[i]] = Array.isArray(raw) ? raw : [];
    }
  } catch(e){ console.warn('loadUserDb 오류:', e.message); }
}

function openDbAdd(){
  var tab=APP.dbTab||'pest';
  document.getElementById('dim-title').textContent='📝 '+(TAB_LABELS[tab]||tab)+' 등록';
  document.getElementById('dim-tab').value=tab;
  document.getElementById('dim-emoji').value=tab==='pest'?'🌿':tab==='fert'?'🌱':tab==='nutr'?'💊':'🧫';
  ['dim-name','dim-form','dim-ingredient','dim-target','dim-method','dim-warning','dim-croprange',
   'dim-fert-type','dim-fert-ingredient','dim-effect','dim-fert-method','dim-amount','dim-timing','dim-note','dim-unit'].forEach(function(id){ var e=document.getElementById(id); if(e) e.value=''; });
  document.getElementById('dim-qty').value=0;
  document.getElementById('dim-bee').value='강함';
  document.getElementById('dim-bloom').value='금지';
  document.getElementById('dim-buy-date').value=TODAY_STR;
  document.getElementById('dim-edit-id').value='';
  document.getElementById('dim-edit-tab').value=tab;
  document.getElementById('dim-delete-btn').style.display='none';
  onDimTabChange();
  document.getElementById('db-item-modal').classList.remove('hidden');
}

function openDbEdit(btn){
  var id=btn.getAttribute('data-id'), tab=btn.getAttribute('data-tab');
  var item=(USER_DB[tab]||[]).find(function(x){ return x.id===id; }); if(!item) return;
  document.getElementById('dim-title').textContent='✏️ '+esc(item.name)+' 수정';
  document.getElementById('dim-tab').value=tab;
  document.getElementById('dim-emoji').value=item.emoji||'';
  document.getElementById('dim-name').value=item.name||'';
  document.getElementById('dim-pest-type').value=item.type||'살충제';
  document.getElementById('dim-form').value=item.form||'';
  document.getElementById('dim-ingredient').value=item.ingredient||'';
  document.getElementById('dim-target').value=item.target||'';
  document.getElementById('dim-method').value=item.method||'';
  document.getElementById('dim-bee').value=item.bee_toxicity||'강함';
  document.getElementById('dim-bloom').value=item.bloom_use||'금지';
  var toxEl=document.getElementById('dim-toxicity');      if(toxEl) toxEl.value=item.toxicity||'';
  var fishEl=document.getElementById('dim-fish-toxicity');if(fishEl) fishEl.value=item.fish_tox||'';
  var utEl=document.getElementById('dim-use-time');       if(utEl) utEl.value=item.use_time||'';
  var unEl=document.getElementById('dim-use-num');        if(unEl) unEl.value=item.use_num||'';
  var moaEl=document.getElementById('dim-moa');           if(moaEl) moaEl.value=item.moa||'';
  document.getElementById('dim-warning').value=item.warning||'';
  document.getElementById('dim-croprange').value=item.crop_range||'';
  document.getElementById('dim-fert-type').value=item.type||'';
  document.getElementById('dim-fert-ingredient').value=item.ingredient||'';
  document.getElementById('dim-effect').value=item.effect||'';
  document.getElementById('dim-fert-method').value=item.method||'';
  document.getElementById('dim-amount').value=item.amount||'';
  document.getElementById('dim-timing').value=item.timing||'';
  document.getElementById('dim-qty').value=item.qty||0;
  document.getElementById('dim-unit').value=item.unit||'';
  document.getElementById('dim-buy-date').value=item.buyDate||'';
  document.getElementById('dim-note').value=item.note||'';
  document.getElementById('dim-edit-id').value=id;
  document.getElementById('dim-edit-tab').value=tab;
  document.getElementById('dim-delete-btn').style.display='block';
  onDimTabChange();
  document.getElementById('db-item-modal').classList.remove('hidden');
}

function onDimTabChange(){
  var tab=document.getElementById('dim-tab').value;
  document.getElementById('dim-pest-fields').style.display=(tab==='pest')?'':'none';
  document.getElementById('dim-fert-fields').style.display=(tab!=='pest')?'':'none';
  // 농약 탭에서만 PSIS 조회 버튼 표시
  var psisSection=document.getElementById('dim-psis-section');
  if(psisSection) psisSection.style.display=(tab==='pest')?'block':'none';
}

async function saveDbItem(){
  var tab=document.getElementById('dim-tab').value;
  var editId=document.getElementById('dim-edit-id').value;
  var name=document.getElementById('dim-name').value.trim();
  if(!name){ showToast('제품명을 입력하세요'); return; }
  var data={name:name, emoji:document.getElementById('dim-emoji').value.trim(),
    qty:parseFloat(document.getElementById('dim-qty').value)||0,
    unit:document.getElementById('dim-unit').value.trim(),
    buyDate:document.getElementById('dim-buy-date').value,
    note:document.getElementById('dim-note').value.trim(),
    tab:tab, updatedAt:new Date().toISOString()};
  if(tab==='pest'){
    data.type=document.getElementById('dim-pest-type').value;
    data.form=document.getElementById('dim-form').value.trim();
    data.ingredient=document.getElementById('dim-ingredient').value.trim();
    data.target=document.getElementById('dim-target').value.trim();
    data.method=document.getElementById('dim-method').value.trim();
    data.bee_toxicity=document.getElementById('dim-bee').value;
    data.bloom_use=document.getElementById('dim-bloom').value;
    data.warning=document.getElementById('dim-warning').value.trim();
    data.crop_range=document.getElementById('dim-croprange').value.trim();
    data.toxicity  =(document.getElementById('dim-toxicity')     ||{value:''}).value||'';
    data.fish_tox  =(document.getElementById('dim-fish-toxicity')||{value:''}).value||'';
    data.use_time  =(document.getElementById('dim-use-time')      ||{value:''}).value.trim()||'';
    data.use_num   =(document.getElementById('dim-use-num')       ||{value:''}).value.trim()||'';
    data.moa       =(document.getElementById('dim-moa')           ||{value:''}).value.trim()||'';
  } else {
    data.type=document.getElementById('dim-fert-type').value.trim();
    data.ingredient=document.getElementById('dim-fert-ingredient').value.trim();
    data.effect=document.getElementById('dim-effect').value.trim();
    data.method=document.getElementById('dim-fert-method').value.trim();
    data.amount=document.getElementById('dim-amount').value.trim();
    data.timing=document.getElementById('dim-timing').value.trim();
  }
  if(editId){
    await _gasPost(Object.assign({ action:'updateUserDb', id:editId, tab:tab }, data));
    var idx=USER_DB[tab].findIndex(function(x){ return x.id===editId; });
    if(idx>=0) USER_DB[tab][idx]=Object.assign({},USER_DB[tab][idx],data);
    showToast('✅ 수정 완료');
  } else {
    data.createdAt=new Date().toISOString();
    var r = await _gasPost(Object.assign({ action:'addUserDb', tab:tab }, data));
    if(r&&r.id){ data.id=r.id; USER_DB[tab].push(data); showToast('✅ 등록 완료'); }
  }
  closeModal('db-item-modal'); renderDb();
}

async function deleteDbItem(){
  var id=document.getElementById('dim-edit-id').value;
  var tab=document.getElementById('dim-edit-tab').value; if(!id) return;
  var item=(USER_DB[tab]||[]).find(function(x){ return x.id===id; });
  if(!confirm((item?item.name:'이 항목')+'을(를) 삭제하시겠습니까?')) return;
  await _gasPost({ action:'deleteUserDb', id:id, tab:tab });
  USER_DB[tab]=USER_DB[tab].filter(function(x){ return x.id!==id; });
  closeModal('db-item-modal'); showToast('🗑 삭제 완료'); renderDb();
}

function deleteDbItemEl(btn){
  var id=btn.getAttribute('data-id'), tab=btn.getAttribute('data-tab');
  var item=(USER_DB[tab]||[]).find(function(x){ return x.id===id; });
  if(!confirm((item?item.name:'이 항목')+'을(를) 삭제하시겠습니까?')) return;
  _gasPost({ action:'deleteUserDb', id:id, tab:tab }).then(function(){
    USER_DB[tab]=USER_DB[tab].filter(function(x){ return x.id!==id; });
    showToast('🗑 삭제 완료'); renderDb();
  }).catch(function(e){ showToast('삭제 오류: '+e.message); });
}

function handleCsvUpload(input){
  if(!input.files||!input.files[0]) return;
  var file=input.files[0];
  var reader=new FileReader();
  reader.onload=function(e){ parseCsvPreview(e.target.result); };
  reader.readAsText(file,'UTF-8');
  input.value='';
}

function parseCsvPreview(csvText){
  var lines=csvText.replace(/\r\n/g,'\n').replace(/\r/g,'\n').split('\n').filter(function(l){ return l.trim(); });
  if(lines.length<2){ showToast('CSV 내용이 없습니다'); return; }
  var headers=parseCsvLine(lines[0]).map(function(h){ return h.trim().toLowerCase(); });
  if(!headers.includes('name')&&!headers.includes('제품명')){ showToast('name 또는 제품명 컬럼이 필요합니다'); return; }
  var rows=[], errs=[];
  for(var i=1;i<lines.length;i++){
    var cols=parseCsvLine(lines[i]); if(cols.length<2) continue;
    var obj={}; headers.forEach(function(h,j){ obj[h]=cols[j]?cols[j].trim():''; });
    var item={name:obj.name||obj['제품명']||'', emoji:obj.emoji||obj['이모지']||'',
      type:obj.type||obj['분류']||obj['종류']||'기타',
      tab:(obj.tab||obj['탭']||'pest').toLowerCase(),
      ingredient:obj.ingredient||obj['성분']||'', target:obj.target||obj['방제대상']||'',
      method:obj.method||obj['사용방법']||'', effect:obj.effect||obj['효과']||'',
      amount:obj.amount||obj['사용량']||'', timing:obj.timing||obj['시기']||'',
      bee_toxicity:obj.bee_toxicity||obj['꿀벌독성']||'', bloom_use:obj.bloom_use||obj['개화기']||'',
      warning:obj.warning||obj['주의사항']||'', note:obj.note||obj['비고']||''};
    if(!item.name){ errs.push('행'+(i+1)+':제품명없음'); continue; }
    rows.push(item);
  }
  CSV_PENDING=rows;
  document.getElementById('csv-preview-info').textContent='총 '+rows.length+'개 항목 등록 예정';
  document.getElementById('csv-preview-list').innerHTML='<div style="font-size:11px;font-weight:600;border-bottom:2px solid var(--gray-200);padding:3px 0;">제품명 / 탭 / 분류</div>'
    +rows.map(function(r){ return '<div class="csv-preview-row"><span class="csv-name">'+esc(r.name)+'</span><span class="csv-type">'+(TAB_LABELS[r.tab]||r.tab)+'</span><span>'+esc(r.type)+'</span></div>'; }).join('');
  document.getElementById('csv-preview-warn').textContent=errs.length>0?'⚠️ 건너뛴 행: '+errs.join(', '):'';
  document.getElementById('csv-preview-modal').classList.remove('hidden');
}

function parseCsvLine(line){
  var result=[],cur='',inQ=false;
  for(var i=0;i<line.length;i++){
    var c=line[i];
    if(c==='"'){ inQ=!inQ; }
    else if(c===','&&!inQ){ result.push(cur); cur=''; }
    else{ cur+=c; }
  }
  result.push(cur); return result;
}

async function confirmCsvImport(){
  if(!CSV_PENDING||CSV_PENDING.length===0) return;
  var count=0;
  for(var i=0;i<CSV_PENDING.length;i++){
    var item=CSV_PENDING[i], tab=item.tab||'pest';
    item.createdAt=new Date().toISOString();
    var r = await _gasPost(Object.assign({ action:'addUserDb', tab:tab }, item)).catch(function(){ return null; });
    if(r){ item.id=r.id||Date.now()+i; if(!USER_DB[tab]) USER_DB[tab]=[]; USER_DB[tab].push(item); count++; }
  }
  CSV_PENDING=[];
  closeModal('csv-preview-modal');
  showToast('✅ CSV '+count+'개 등록 완료');
  renderDb();
}

function downloadCsvTemplate(){
  var tab=APP.dbTab||'pest';
  var hdr, sample;
  if(tab==='pest'){ hdr='tab,name,emoji,type,ingredient,target,method,bee_toxicity,bloom_use,warning,note'; sample='pest,새농약이름,🌿,살충제,성분명,방제대상,1000배 경엽살포,강함,금지,주의사항,메모'; }
  else if(tab==='fert'){ hdr='tab,name,emoji,type,ingredient,effect,method,amount,timing,note'; sample='fert,새비료이름,🌱,복합비료,N21-P17-K17,생육촉진,밑거름 시비,20kg,정식전,메모'; }
  else if(tab==='nutr'){ hdr='tab,name,emoji,type,ingredient,effect,method,amount,timing,note'; sample='nutr,새영양제이름,💊,영양제,아미노산 5%,생육촉진,500배 엽면시비,1L,생육기,메모'; }
  else { hdr='tab,name,emoji,type,ingredient,effect,method,amount,timing,note'; sample='micro,고초균,🧫,미생물균,바실루스 서브틸리스,토양개선,500배 관주,1L,정식후,4대균'; }
  var csv=hdr+'\n'+sample+'\n# tab: pest(농약)/fert(비료퇴비)/nutr(영양제)/micro(미생물균)\n';
  var blob=new Blob(['\uFEFF'+csv],{type:'text/csv;charset=utf-8;'});
  var url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download='자재DB_양식_'+tab+'.csv'; a.click();
  URL.revokeObjectURL(url);
  showToast('📂 CSV 양식 다운로드');
}

function setPanel(name,el){
  // 모든 패널 숨기기
  document.querySelectorAll('.panel').forEach(function(p){
    p.classList.remove('active');
    p.style.display='none';
  });
  // 선택한 패널 보이기
  var target=document.getElementById('panel-'+name);
  if(target){ target.classList.add('active'); target.style.display='block'; }
  // nav 활성화
  document.querySelectorAll('.nav-item').forEach(function(n){ n.classList.remove('active'); });
  if(el) el.classList.add('active');
  // 렌더링
  try{
    APP.currentPanel = name;
    if      (name==='today')  renderToday();
    else if (name==='plants') renderPlants();
    else if (name==='log')    renderLogs();
    else if (name==='manage') renderManagePanel();
    else if (name==='db') {
      var tab=APP.dbTab||'pest';
      if(tab==='mypest')                   renderMyPestPanel();
      else if(tab==='fert'||tab==='nutr') renderFertPanel(tab);
      else if(tab==='micro')               renderMicroPanel();
      else if(tab==='spray')               renderSpraySchedulerPanel();
      else                                 renderDb();
    }
  }catch(e){ console.warn('setPanel 렌더 오류:',name,e.message); }
}
function setFilter(f,el){
  APP.filter=f;
  document.querySelectorAll('#panel-today .filter-btn').forEach(function(b){ b.classList.remove('on'); });
  el.classList.add('on'); renderToday();
}
function setPlantFilter(f,el){
  APP.plantFilter=f;
  document.querySelectorAll('#panel-plants .filter-btn').forEach(function(b){ b.classList.remove('on'); });
  el.classList.add('on'); renderPlants();
}
function setDbTab(tab,el){
  APP.dbTab=tab;
  document.querySelectorAll('.db-tab').forEach(function(b){ b.classList.remove('on'); });
  el.classList.add('on'); document.getElementById('db-search').value='';
  var _srch=document.getElementById('db-search'); if(_srch) _srch.style.display=(tab==='mypest'||tab==='spray')?'none':'';
  if (tab === 'mypest')                    { renderMyPestPanel(); }
  else if (tab === 'harvest')              { renderHarvestPanel(); }
  else if (tab === 'fert' || tab === 'nutr') { renderFertPanel(tab); }
  else if (tab === 'micro')                  { renderMicroPanel(); }
  else if (tab === 'spray')                  { renderSpraySchedulerPanel(); }
  else { renderDb(); }
}

function toggleTaskEl(btn) {
  var key    = btn.getAttribute('data-key');
  var plantId= btn.getAttribute('data-pid');
  var pName  = btn.getAttribute('data-name');
  var action = btn.getAttribute('data-action');
  var type   = btn.getAttribute('data-type');
  var mat    = btn.getAttribute('data-mat');
  var isDone = btn.getAttribute('data-done')==='1';

  if(isDone){
    _gasPost({ action:'deleteDoneTask', key:key }).then(function(){
      delete APP.doneTasks[key]; renderToday(); showToast('완료 취소됨');
    });
  } else {
    
    var tasks = calcTodayTasks();
    var task  = tasks.find(function(t){ return t.key===key; });
    var plants = task && task.plants ? task.plants : [];

    APP.pendingTaskMeta = {
      key:key, plantId:plantId, name:pName,
      action:action, type:type, material:mat,
      plants: plants,
    };
    
    var title = plants.length>1
      ? '✅ '+action+' ('+plants.length+'개 작물)'
      : '✅ '+pName+' — '+action;
    document.getElementById('tdm-title').textContent = title;

    
    var preview = '';
    if (plants.length>1) {
      preview = '<div style="font-size:11px;color:var(--green-dark);margin:6px 0;line-height:1.7;">'
        + plants.map(function(p){ return esc(p.emoji)+' '+esc(p.name)+' (D+'+p.dfp+'일)'; }).join(' · ')
        + '</div>';
      var old = document.getElementById('tdm-plant-preview');
      if (old) old.innerHTML = preview;
      else {
        var el = document.createElement('div');
        el.id = 'tdm-plant-preview';
        el.innerHTML = preview;
        var noteField = document.getElementById('tdm-note');
        noteField.parentNode.insertBefore(el, noteField);
      }
    } else {
      var old2 = document.getElementById('tdm-plant-preview');
      if (old2) old2.innerHTML = '';
    }

    document.getElementById('tdm-note').value='';
    document.getElementById('task-done-modal').classList.remove('hidden');
  }
}

async function confirmTaskDone() {
  var meta=APP.pendingTaskMeta; if(!meta) return;
  var note=document.getElementById('tdm-note').value.trim();
  var now=new Date();
  var timeStr=pad(now.getHours())+':'+pad(now.getMinutes());
  var taskData = {
    key:meta.key, date:TODAY_STR,
    plantId:meta.plantId, plantName:meta.name,
    plants: JSON.stringify(meta.plants||[]),
    action:meta.action, type:meta.type, material:meta.material,
    note:note, doneAt:now.toISOString()
  };
  var r = await _gasPost(Object.assign({ action:'setDoneTask' }, taskData));
  APP.doneTasks[meta.key] = {doneAt:now.toISOString(), note:note};
  var plants = meta.plants && meta.plants.length>0
    ? meta.plants : [{id:meta.plantId, name:meta.name}];
  for (var i=0; i<plants.length; i++) {
    var p=plants[i];
    await _gasPost({
      action:'addWorkLog',
      date:TODAY_STR, time:timeStr,
      plantId:p.id||'', plantName:p.name||meta.name,
      type: meta.type==='spray'?'농약살포':meta.type==='fert'?'시비':'기타',
      material:meta.material, detail:note,
      createdAt:now.toISOString(),
    });
  }
  closeModal('task-done-modal');
  showToast('✅ '+plants.length+'개 작물 완료 기록 저장!');
  await loadAllData(); renderToday(); renderLogs();
}

function openAddPlant(){
  document.getElementById('pm-title').textContent='🌱 식물 추가';
  ['pm-name','pm-loc','pm-note'].forEach(function(id){ document.getElementById(id).value=''; });
  document.getElementById('pm-emoji').value='🌱';
  document.getElementById('pm-cat').value='재배중';
  document.getElementById('pm-date').value=TODAY_STR;
  ['pm-pdays','pm-fdays','pm-tdays','pm-poll-days'].forEach(function(id){ document.getElementById(id).value=0; });
  ['pm-poll-date','pm-last-spray','pm-last-spray-name','pm-last-fert','pm-last-fert-name'].forEach(function(id){ document.getElementById(id).value=''; });
  document.getElementById('pm-edit-id').value='';
  document.getElementById('pm-delete-btn').style.display='none';
  resetHarvestLookup();
  document.getElementById('plant-modal').classList.remove('hidden');
}
function openEditPlant(el){
  var id=el.getAttribute('data-id');
  var p=APP.plants.find(function(x){ return x.id===id; }); if(!p) return;
  document.getElementById('pm-title').textContent='✏️ '+p.name+' 수정';
  document.getElementById('pm-name').value=p.name;
  document.getElementById('pm-emoji').value=p.emoji||'🌱';
  document.getElementById('pm-cat').value=p.category||'재배중';
  document.getElementById('pm-loc').value=p.location||'';
  document.getElementById('pm-date').value=p.plantDate||'';
  document.getElementById('pm-pdays').value=p.pinchDays||0;
  document.getElementById('pm-fdays').value=p.fruitDays||0;
  document.getElementById('pm-tdays').value=p.totalDays||0;
  document.getElementById('pm-poll-date').value=p.pollDate||'';
  document.getElementById('pm-poll-days').value=p.pollDays||0;
  document.getElementById('pm-last-spray').value=p.lastSprayDate||'';
  document.getElementById('pm-last-spray-name').value=p.lastSprayName||'';
  document.getElementById('pm-last-fert').value=p.lastFertDate||'';
  document.getElementById('pm-last-fert-name').value=p.lastFertName||'';
  document.getElementById('pm-note').value=p.note||'';
  document.getElementById('pm-edit-id').value=id;
  document.getElementById('pm-delete-btn').style.display='block';
  resetHarvestLookup();
  document.getElementById('plant-modal').classList.remove('hidden');
}

async function savePlant(){
  var editId=document.getElementById('pm-edit-id').value;
  var data={
    name:      document.getElementById('pm-name').value.trim(),
    emoji:     document.getElementById('pm-emoji').value.trim()||'🌱',
    category:  document.getElementById('pm-cat').value,
    location:  document.getElementById('pm-loc').value.trim(),
    plantDate: document.getElementById('pm-date').value,
    pinchDays: parseInt(document.getElementById('pm-pdays').value)||0,
    fruitDays: parseInt(document.getElementById('pm-fdays').value)||0,
    totalDays: parseInt(document.getElementById('pm-tdays').value)||0,
    pollDate:  document.getElementById('pm-poll-date').value,
    pollDays:  parseInt(document.getElementById('pm-poll-days').value)||0,
    lastSprayDate: document.getElementById('pm-last-spray').value,
    lastSprayName: document.getElementById('pm-last-spray-name').value.trim(),
    lastFertDate:  document.getElementById('pm-last-fert').value,
    lastFertName:  document.getElementById('pm-last-fert-name').value.trim(),
    note:      document.getElementById('pm-note').value.trim(),
    status:    'active', updatedAt: new Date().toISOString(),
  };
  if(!data.name){ showToast('식물명을 입력하세요'); return; }
  if(editId){
    await _gasPost(Object.assign({ action:'updatePlant', id:editId }, data));
    var idx=APP.plants.findIndex(function(p){ return p.id===editId; });
    if(idx>=0) APP.plants[idx]=Object.assign({},APP.plants[idx],data);
    showToast('✅ 수정 완료');
  } else {
    data.no=(APP.plants.length>0?Math.max.apply(null,APP.plants.map(function(p){return p.no||0;})):0)+1;
    var result = await _gasPost(Object.assign({ action:'addPlant' }, data));
    var newId = result.id || ('local_'+Date.now());
    APP.plants.push(Object.assign({id:newId},data));
    showToast('✅ 식물 추가 완료');
  }
  closeModal('plant-modal'); renderPlants(); renderToday();
}

async function deletePlant(){
  var id=document.getElementById('pm-edit-id').value; if(!id) return;
  var p=APP.plants.find(function(x){ return x.id===id; });
  if(!confirm((p?p.name:'이 식물')+'을(를) 삭제하시겠습니까?')) return;
  await _gasPost({ action:'deletePlant', id:id });
  APP.plants=APP.plants.filter(function(x){ return x.id!==id; });
  closeModal('plant-modal'); showToast('🗑 삭제 완료'); renderPlants(); renderToday();
}

function renderPlantSelectGrid(){
  var grid=document.getElementById('lm-plant-grid'); if(!grid) return;
  var plants=APP.plants.filter(function(p){ return p.status==='active'; });
  grid.innerHTML=plants.map(function(p){
    var cat=(p.category||'').replace(/"/g,'');
    return '<div class="plant-select-item" data-id="'+esc(p.id)+'" data-cat="'+cat+'" onclick="togglePlantSelect(this)">'
      +'<div class="psi-check"></div>'
      +'<span class="psi-emoji">'+esc(p.emoji||'🌱')+'</span>'
      +'<span class="psi-name">'+esc(p.name)+'</span>'
      +'</div>';
  }).join('');
  updateSelectedLabel();
}
function togglePlantSelect(el){
  el.classList.toggle('selected');
  el.querySelector('.psi-check').textContent=el.classList.contains('selected')?'✓':'';
  updateSelectedLabel();
  if(document.getElementById('lm-type').value==='착과') updatePollHistory();
}
function selectPlantsByFilter(filter){
  document.querySelectorAll('#lm-plant-grid .plant-select-item').forEach(function(el){
    var cat=el.getAttribute('data-cat'), sel=filter==='all'||filter===cat, desel=filter==='none';
    if(desel){ el.classList.remove('selected'); el.querySelector('.psi-check').textContent=''; }
    else if(sel){ el.classList.add('selected'); el.querySelector('.psi-check').textContent='✓'; }
  });
  updateSelectedLabel();
}
function getSelectedPlants(){
  return Array.from(document.querySelectorAll('#lm-plant-grid .plant-select-item.selected')).map(function(el){
    var id=el.getAttribute('data-id'), p=APP.plants.find(function(x){ return x.id===id; });
    return {id:id, name:p?p.name:el.querySelector('.psi-name').textContent};
  });
}
function updateSelectedLabel(){
  var sel=getSelectedPlants(), lbl=document.getElementById('lm-selected-label'); if(!lbl) return;
  lbl.textContent=sel.length===0?'선택된 작물: 없음':'선택됨 '+sel.length+'개: '+sel.map(function(p){ return p.name; }).join(', ');
}
function onLogTypeChange(){
  var type=document.getElementById('lm-type').value;
  var pollSec=document.getElementById('lm-poll-section');
  var matLabel=document.getElementById('lm-material-label');
  var matHint=document.getElementById('lm-material-hint');
  if(type==='착과'){ pollSec.style.display=''; document.getElementById('lm-poll-date').value=TODAY_STR; updatePollHistory(); }
  else pollSec.style.display='none';
  var hints={'농약살포':['사용 농약명','예: 스트레이트, 라이몬, 델란'],'시비':['비료·퇴비명','예: 21-17-17, NK비료, 우분퇴비'],'천연자재':['천연자재명','예: 고초균, 유산균, 광합성균, 효모균, 난황유, 목초액'],'착과':['해당 작물','착과 확인 작물 (위에서 선택)'],'수확':['수확량 (선택)','예: 3kg, 10개']};
  var h=hints[type]||['사용 자재명',''];
  matLabel.textContent=h[0]; matHint.textContent=h[1];
}
function updatePollHistory(){
  var sel=getSelectedPlants(), histDiv=document.getElementById('lm-poll-history'); if(!histDiv) return;
  if(sel.length===0){ histDiv.style.display='none'; return; }
  var plant=APP.plants.find(function(p){ return p.id===sel[0].id; });
  if(!plant||!plant.pollHistory||plant.pollHistory.length===0){ histDiv.style.display='none'; return; }
  histDiv.style.display='';
  var items=plant.pollHistory.slice(0,10).map(function(h,i){
    return '<div class="poll-hist-item">'
      +'<span class="phi-date">🌸 '+(h.pollDate||'')+'</span>'
      +'<span class="phi-harvest">&rarr; 수확 '+(h.harvestDate||'')+'</span>'
      +'<span style="color:var(--gray-400);font-size:10px;">'+(h.pollDays||'')+'일 후</span>'
      +'<button class="phi-del" data-idx="'+i+'" data-pid="'+esc(plant.id)+'" onclick="removePollHistoryEl(this)">✕</button>'
      +'</div>';
  }).join('');
  histDiv.innerHTML='<div style="font-size:11px;font-weight:600;color:var(--orange);margin-bottom:4px;">착과 이력 ('+plant.pollHistory.length+'회)</div>'+items;
}

async function removePollHistoryEl(btn){
  var idx=parseInt(btn.getAttribute('data-idx')), plantId=btn.getAttribute('data-pid');
  var plant=APP.plants.find(function(p){ return p.id===plantId; }); if(!plant||!plant.pollHistory) return;
  plant.pollHistory.splice(idx,1);
  await _gasPost({ action:'updatePlant', id:plantId, pollHistory:JSON.stringify(plant.pollHistory) });
  updatePollHistory(); showToast('착과 이력 삭제됨');
}

function openAddLog(){
  document.getElementById('lm-title').textContent='📝 작업 기록 추가';
  document.getElementById('lm-date').value=TODAY_STR;
  document.getElementById('lm-type').value='농약살포';
  document.getElementById('lm-material').value='';
  document.getElementById('lm-detail').value='';
  document.getElementById('lm-edit-id').value='';
  document.getElementById('lm-edit-col').value='';
  document.getElementById('lm-save-btn').textContent='기록 저장';
  document.getElementById('lm-delete-btn').style.display='none';
  document.getElementById('lm-multi-section').style.display='';
  document.getElementById('lm-single-section').style.display='none';
  document.getElementById('lm-poll-section').style.display='none';
  renderPlantSelectGrid(); onLogTypeChange();
  document.getElementById('log-modal').classList.remove('hidden');
}
function openEditLog(el){
  var id=(typeof el==='string')?el:el.getAttribute('data-id');
  var log=APP.logs.find(function(l){ return l.id===id; }); if(!log) return;
  document.getElementById('lm-title').textContent='✏️ 기록 수정';
  document.getElementById('lm-multi-section').style.display='none';
  document.getElementById('lm-single-section').style.display='';
  document.getElementById('lm-poll-section').style.display='none';
  document.getElementById('lm-date').value=(log.date||'').slice(0,10);
  document.getElementById('lm-plant').value=log.plantName||log.plant||'';
  var typeVal=log.eventType||log.type||'기타';
  var sel=document.getElementById('lm-type');
  sel.value=Array.from(sel.options).some(function(o){ return o.value===typeVal; })?typeVal:'기타';
  document.getElementById('lm-material').value=log.material||'';
  document.getElementById('lm-detail').value=log.detail||log.note||'';
  document.getElementById('lm-edit-id').value=id;
  document.getElementById('lm-edit-col').value=log._col||'workLogs';
  document.getElementById('lm-save-btn').textContent='수정 저장';
  document.getElementById('lm-delete-btn').style.display='block';
  document.getElementById('log-modal').classList.remove('hidden');
}
function confirmDeleteLog(el){
  var id=(typeof el==='string')?el:el.getAttribute('data-id');
  var log=APP.logs.find(function(l){ return l.id===id; }); if(!log) return;
  var name=log.plantName||log.plant||'', date=(log.date||'').slice(0,10);
  if(!confirm(date+' · '+name+' 기록을 삭제하시겠습니까?')) return;
  deleteLogById(id, log._col||'workLogs');
}

async function deleteLogById(id, col){
  await _gasPost({ action: col==='growRecords'?'deleteGrowRecord':'deleteWorkLog', id:id });
  APP.logs=APP.logs.filter(function(l){ return l.id!==id; });
  closeModal('log-modal'); showToast('🗑 기록 삭제 완료'); renderLogs();
}

async function deleteLog(){
  var id=document.getElementById('lm-edit-id').value, col=document.getElementById('lm-edit-col').value||'workLogs';
  if(!id) return;
  var log=APP.logs.find(function(l){ return l.id===id; });
  var name=log?(log.plantName||log.plant||''):'';
  if(!confirm(name+' 기록을 삭제하시겠습니까?')) return;
  await deleteLogById(id, col);
}

async function saveLog(){
  var now=new Date(), editId=document.getElementById('lm-edit-id').value;
  var editCol=document.getElementById('lm-edit-col').value||'workLogs';
  var dateVal=document.getElementById('lm-date').value;
  var type=document.getElementById('lm-type').value;
  var material=document.getElementById('lm-material').value.trim();
  var detail=document.getElementById('lm-detail').value.trim();
  var timeStr=pad(now.getHours())+':'+pad(now.getMinutes());

  if(editId){
    var plant=document.getElementById('lm-plant').value.trim();
    if(!plant){ showToast('식물명을 입력하세요'); return; }
    var upd={date:dateVal,plantName:plant,material:material,detail:detail,updatedAt:now.toISOString()};
    if(editCol==='growRecords'){ upd.eventType=type; upd.note=detail; } else { upd.type=type; }
    var action = editCol==='growRecords'?'updateGrowRecord':'updateWorkLog';
    await _gasPost(Object.assign({ action:action, id:editId }, upd));
    var idx=APP.logs.findIndex(function(l){ return l.id===editId; });
    if(idx>=0) APP.logs[idx]=Object.assign({},APP.logs[idx],upd,{type:type,eventType:type});
    closeModal('log-modal'); showToast('✅ 수정 완료'); renderLogs(); return;
  }

  var selectedPlants=getSelectedPlants();
  if(selectedPlants.length===0){ showToast('작물을 하나 이상 선택하세요'); return; }
  var newLogs=[];

  if(type==='착과'){
    var pollDate=document.getElementById('lm-poll-date').value||dateVal;
    var pollDays=parseInt(document.getElementById('lm-poll-days').value)||35;
    var pd=new Date(pollDate+'T00:00:00'); pd.setDate(pd.getDate()+pollDays);
    var harvestDate=pd.toISOString().slice(0,10);
    for(var i=0;i<selectedPlants.length;i++){
      var sp=selectedPlants[i];
      var plantObj=APP.plants.find(function(p){ return p.id===sp.id; }); if(!plantObj) continue;
      var hist=plantObj.pollHistory?plantObj.pollHistory.slice():[];
      hist.unshift({pollDate:pollDate,harvestDate:harvestDate,pollDays:pollDays,createdAt:now.toISOString()});
      if(hist.length>50) hist=hist.slice(0,50);
      await _gasPost({ action:'updatePlant', id:plantObj.id, pollDate:pollDate, pollDays:pollDays, pollHistory:JSON.stringify(hist) });
      APP.plants=APP.plants.map(function(p){ return p.id===plantObj.id?Object.assign({},p,{pollDate:pollDate,pollDays:pollDays,pollHistory:hist}):p; });
      var rec={date:dateVal,plantName:sp.name,plantId:sp.id,eventType:'착과',type:'착과',material:material,note:'착과일: '+pollDate+', 수확예정: '+harvestDate,createdAt:now.toISOString()};
      var r = await _gasPost(Object.assign({ action:'addGrowRecord' }, rec));
      if(r&&r.id) newLogs.push(Object.assign({id:r.id,_col:'growRecords'},rec));
    }
  } else {
    for(var j=0;j<selectedPlants.length;j++){
      var sp2=selectedPlants[j];
      var rec2={date:dateVal,plantName:sp2.name,plantId:sp2.id,eventType:type,type:type,material:material,note:detail,createdAt:now.toISOString()};
      var r2 = await _gasPost(Object.assign({ action:'addGrowRecord' }, rec2));
      if(r2&&r2.id) newLogs.push(Object.assign({id:r2.id,_col:'growRecords'},rec2));
    }
  }

  newLogs.forEach(function(l){ APP.logs.unshift(l); });
  APP.logs.sort(function(a,b){ var da=(a.date||'').slice(0,10),db_=(b.date||'').slice(0,10); if(da!==db_) return da>db_?-1:1; return (a.time||'')>(b.time||'')?-1:1; });
  closeModal('log-modal'); showToast('📝 '+selectedPlants.length+'개 작물 기록 저장 완료');
  renderLogs(); renderPlants();
}

function closeModal(id){ document.getElementById(id).classList.add('hidden'); }
document.querySelectorAll('.modal-bg').forEach(function(m){
  // 배경 클릭으로 닫히지 않는 모달
  if(m.id==='db-item-modal') return;
  if(m.id==='gas-settings-modal') return;
  m.addEventListener('click',function(e){ if(e.target===m) m.classList.add('hidden'); });
});
function showToast(msg){ var t=document.getElementById('toast'); t.textContent=msg; t.classList.add('show'); setTimeout(function(){ t.classList.remove('show'); },2500); }
function setSyncStatus(online){
  var dot   = document.getElementById('sync-dot');
  var label = document.getElementById('sync-label');
  if (!dot || !label) return;
  if (online) {
    dot.className     = 'sync-dot';
    label.textContent = '동기화됨';
    label.style.color = 'var(--green-dark)';
  } else {
    dot.className     = 'sync-dot offline';
    label.textContent = '오프라인';
    label.style.color = 'var(--gray-400)';
  }
}
async function syncNow(){
  var dot   = document.getElementById('sync-dot');
  var label = document.getElementById('sync-label');
  if(dot)   dot.className     = 'sync-dot';
  if(label) { label.textContent='동기화 중...'; label.style.color='var(--gray-400)'; }
  try {
    var raw = await _gasGet('getPlants');
    var plantsArr = Array.isArray(raw) ? raw
      : Object.keys(raw||{}).map(function(k){ return Object.assign({id:k}, raw[k]); });
    if (plantsArr.length > 0) {
      // 중복 제거: id 우선, 같은 이름은 dateStr/events 많은 것 유지
      var _seen = {};
      var _deduped = [];
      var today = new Date().toISOString().slice(0,10);

      function _hasRealDate(p) {
        // 오늘 날짜이거나 비어있으면 '날짜 없음'으로 취급
        var d = p.dateStr || '';
        return d && d !== today && /^\d{4}-\d{2}-\d{2}$/.test(d);
      }

      function _betterPlant(ex, p) {
        // 우선순위: 1) 심은날짜 있는 것  2) events 많은 것  3) 기존 유지
        var exHasDate = _hasRealDate(ex);
        var pHasDate  = _hasRealDate(p);
        if (!exHasDate && pHasDate) return true;   // 새 것에 날짜 있음 → 교체
        if (exHasDate && !pHasDate) return false;  // 기존에 날짜 있음 → 유지
        // 둘 다 날짜 있거나 둘 다 없으면 events 많은 것 우선
        return (p.events||[]).length > (ex.events||[]).length;
      }

      plantsArr.forEach(function(p) {
        if (!p || !p.name) return;
        var key = 'name:' + p.name.trim();
        if (_seen[key] !== undefined) {
          var idx = _seen[key];
          var ex  = _deduped[idx];
          if (_betterPlant(ex, p)) {
            // 더 좋은 것으로 교체, dateStr과 events는 최선값 합치기
            _deduped[idx] = Object.assign({}, ex, p, {
              dateStr: _hasRealDate(p) ? p.dateStr : (ex.dateStr || p.dateStr),
              events:  (p.events||[]).length >= (ex.events||[]).length ? (p.events||[]) : (ex.events||[]),
              no:      ex.no || p.no,
            });
          } else {
            // 기존 유지하되 dateStr이 없으면 새 것 날짜로 보완
            if (!_hasRealDate(ex) && _hasRealDate(p)) {
              _deduped[idx].dateStr = p.dateStr;
            }
          }
        } else {
          _seen[key] = _deduped.length;
          _deduped.push(Object.assign({}, p));
        }
      });
      // _local(MASTER_DB) 항목은 GAS 데이터와 이름 중복이면 이미 제거됨
      APP.plants = _deduped.filter(function(p) { return p; });
      APP.plants.sort(function(a,b){ return (a.no||0)-(b.no||0); });
    }
    var doneRaw = await _gasGet('getDoneTasks', { date: TODAY_STR });
    APP.doneTasks = {};
    (Array.isArray(doneRaw) ? doneRaw : Object.keys(doneRaw||{}).map(function(k){
      return Object.assign({_key:k}, doneRaw[k]);
    })).forEach(function(d){ APP.doneTasks[d._key||d.key||d.id] = d; });
    var wlRaw = await _gasGet('getWorkLogs', { limit:'80' }).catch(function(){ return []; });
    var grRaw = await _gasGet('getGrowRecords', { limit:'80' }).catch(function(){ return []; });
    APP.logs = (Array.isArray(wlRaw)?wlRaw:[]).map(function(d){ return Object.assign({_col:'workLogs'}, d); })
      .concat((Array.isArray(grRaw)?grRaw:[]).map(function(d){
        return Object.assign({_col:'growRecords',
          date:(d.date||'').slice(0,10), plantName:d.plantName||d.name||'',
          type:d.eventType||d.type||'기타', material:d.material||'',
          detail:d.note||d.detail||'', time:d.time||''}, d);
      })).sort(function(a,b){
        var da=(a.date||'').slice(0,10), db_=(b.date||'').slice(0,10);
        if(da!==db_) return da>db_?-1:1;
        return (a.time||'')>(b.time||'')?-1:1;
      });
    try{renderToday();}catch(e){}
    try{renderPlants();}catch(e){}
    try{renderLogs();}catch(e){}
    if(dot)   dot.className     = 'sync-dot';
    if(label) { label.textContent='동기화됨'; label.style.color='var(--green-dark)'; }
    showToast('✅ 동기화 완료 — 식물 '+APP.plants.length+'개');
  } catch(e) {
    console.warn('[syncNow] 오류:', e.message);
    if(dot)   dot.className     = 'sync-dot offline';
    if(label) { label.textContent='동기화 실패'; label.style.color='#C62828'; }
    showToast('동기화 실패: '+e.message);
  }
}

function setupSync(){ setInterval(syncNow, 5*60*1000); }

async function launchApp(){
  if (_slowTimer){ clearTimeout(_slowTimer); _slowTimer=null; }
  var slwEl = document.getElementById('loading-slow-msg');
  if (slwEl) slwEl.style.display = 'none';
  document.getElementById('app').style.display = 'block';
  // 초기 패널 명시적 표시
  document.querySelectorAll('.panel').forEach(function(p){ p.style.display='none'; });
  var initPanel = document.getElementById('panel-today');
  if(initPanel){ initPanel.style.display='block'; initPanel.classList.add('active'); }
  var days=['일','월','화','수','목','금','토'];
  document.getElementById('topbar-date').textContent =
    TODAY.getFullYear()+'년 '+(TODAY.getMonth()+1)+'월 '+TODAY.getDate()+'일 ('+days[TODAY.getDay()]+')';
  setLoadingStep(1, 25, '데이터 로드 중...');
  try { await loadAllData(); } catch(e){ console.warn('loadAllData 오류:',e.message); hideLoading(); }
  try { await loadGasUrlSetting(); }   catch(e){}
  try { await loadMyPesticideList(); } catch(e){}
  try { await loadUserCropUsage(); }   catch(e){}
  try { await initOfflineSystem(); }   catch(e){}
  try { setupSync(); }                 catch(e){}
}

var HARVEST_DB = {
  
  '수박':    [{days:80,  label:'소형 수박 (씨없는)'},{days:90,  label:'일반 수박'},{days:100, label:'대형 수박'}],
  '참외':    [{days:55,  label:'조생종'},{days:65,  label:'일반'},{days:75,  label:'만생종'}],
  '멜론':    [{days:80,  label:'얼스 멜론'},{days:90,  label:'네트멜론'},{days:100, label:'만생종'}],
  '호박':    [{days:45,  label:'애호박·주키니'},{days:90,  label:'단호박'},{days:120, label:'늙은호박'}],
  '토마토':  [{days:70,  label:'방울토마토'},{days:80,  label:'일반 토마토'},{days:90,  label:'대형 토마토'}],
  '고추':    [{days:75,  label:'풋고추'},{days:90,  label:'홍고추 (건고추 120일)'}],
  '가지':    [{days:65,  label:'가지'}],
  '오이':    [{days:45,  label:'오이'}],
  '파프리카':[{days:80,  label:'파프리카'}],
  
  '콩':      [{days:100, label:'조생종'},{days:120, label:'중생종'},{days:140, label:'만생종'}],
  '팥':      [{days:100, label:'조생종'},{days:120, label:'일반'}],
  '옥수수':  [{days:75,  label:'초당 옥수수'},{days:85,  label:'일반 찰옥수수'}],
  '땅콩':    [{days:120, label:'조생종'},{days:150, label:'일반'}],
  '동부콩':  [{days:70,  label:'동부콩'}],
  '작두콩':  [{days:90,  label:'작두콩'}],
  
  '고구마':  [{days:100, label:'조생종'},{days:120, label:'일반'},{days:140, label:'만생종'}],
  '감자':    [{days:70,  label:'조생종'},{days:90,  label:'일반'},{days:110, label:'만생종'}],
  '생강':    [{days:150, label:'생강'}],
  
  '사과':    [{days:150, label:'조생종 (홍로)'},{days:170, label:'중생종 (후지)'},{days:200, label:'만생종'}],
  '배':      [{days:140, label:'조생종'},{days:160, label:'신고배'},{days:180, label:'만생종'}],
  '포도':    [{days:90,  label:'캠벨 (색택기 30일)'},{days:110, label:'거봉'},{days:130, label:'샤인머스켓'}],
  '복숭아':  [{days:75,  label:'조생종'},{days:100, label:'중생종'},{days:130, label:'만생종'}],
  '자두':    [{days:80,  label:'조생종'},{days:100, label:'중생종'}],
  '블루베리':[{days:70,  label:'하이부시 조생'},{days:90,  label:'하이부시 중생'},{days:110, label:'래빗아이'}],
  '살구':    [{days:80,  label:'살구'}],
  '매실':    [{days:70,  label:'청매실'},{days:90,  label:'황매실'}],
  '감':      [{days:150, label:'단감 조생'},{days:180, label:'단감 일반'},{days:210, label:'홍시·곶감용'}],
  '키위':    [{days:150, label:'키위 (헤이워드)'}],
  '무화과':  [{days:90,  label:'여름 무화과'},{days:180, label:'가을 무화과'}],
  '대추':    [{days:120, label:'대추'}],
  '모과':    [{days:150, label:'모과'}],
  '다래':    [{days:120, label:'다래'}],
  '블랙베리':[{days:60,  label:'블랙베리'}],
  '머루포도':[{days:110, label:'머루포도'}],
  
  '배추':    [{days:60,  label:'봄배추'},{days:70,  label:'가을배추'}],
  '무':      [{days:60,  label:'봄·여름무'},{days:70,  label:'가을무'}],
  '양파':    [{days:150, label:'조생종'},{days:180, label:'중만생종'}],
  '마늘':    [{days:180, label:'한지형 마늘'},{days:210, label:'난지형 마늘'}],
  '대파':    [{days:90,  label:'여름 대파'},{days:120, label:'겨울 대파'}],
};

function onPlantNameInput() {
  var name = (document.getElementById('pm-name').value||'').trim();
  var lookupDiv = document.getElementById('pm-harvest-lookup');
  var hint = document.getElementById('pm-harvest-lookup-hint');
  if (!name) { lookupDiv.style.display='none'; return; }
  
  var localKey = findHarvestKey(name);
  if (localKey) {
    lookupDiv.style.display = '';
    hint.textContent = localKey+' 데이터 있음 — 조회 클릭';
  } else {
    lookupDiv.style.display = '';
    hint.textContent = name+' — 인터넷 조회';
  }
  
  document.getElementById('pm-harvest-presets').style.display = 'none';
}

function findHarvestKey(name) {
  var keys = Object.keys(HARVEST_DB);
  return keys.find(function(k){ return name.includes(k)||k.includes(name); }) || null;
}

async function lookupHarvestDays() {
  var name = (document.getElementById('pm-name').value||'').trim();
  if (!name) { showToast('식물명을 먼저 입력하세요'); return; }

  var btn = document.querySelector('.harvest-lookup-btn');
  btn.textContent = '🔍 조회 중...'; btn.classList.add('loading');

  var presets = [];

  
  var localKey = findHarvestKey(name);
  if (localKey) {
    presets = HARVEST_DB[localKey].map(function(p){ return Object.assign({source:'로컬DB'}, p); });
  }

  
  if (presets.length === 0) {
    try {
      var prompt = '한국 농업에서 "'+name+'"의 파종·정식 후 수확까지 걸리는 일수를 품종별로 알려주세요.\n'
        + '60일 미만은 제외하고, 대표 3~5개 품종·유형을 JSON 배열로만 반환하세요:\n'
        + '[{"days":80,"label":"품종명 또는 유형 설명"},...]';
            var res = await callClaude(prompt, 300);
      if (res.ok) {
        var parsed = parseAiJson(res.text);
        if (Array.isArray(parsed)) {
          presets = parsed.map(function(p){ return Object.assign({source:'AI 검색'}, p); });
        }
      }
      if (Array.isArray(parsed)) {
        presets = parsed.map(function(p){ return Object.assign({source:'AI 검색'}, p); });
      }
    } catch(e) { console.warn('harvest lookup error', e); }
  }

  btn.textContent = '🔍 수확기간 자동 조회'; btn.classList.remove('loading');

  if (presets.length === 0) {
    showToast(name+' 수확기간 정보를 찾지 못했습니다. 직접 입력해 주세요.');
    return;
  }
  renderHarvestPresets(presets);
}

function renderHarvestPresets(presets) {
  var container = document.getElementById('pm-harvest-preset-list');
  var section   = document.getElementById('pm-harvest-presets');
  container.innerHTML = presets.map(function(p, i){
    return '<div class="harvest-preset-chip" data-days="'+p.days+'" data-total="'+(p.totalDays||p.days)+'" onclick="selectHarvestPreset(this)">'
      + '<span class="hpc-days">'+p.days+'일</span>'
      + '<span class="hpc-label">'+esc(p.label)+'</span>'
      + (p.source==='AI 검색' ? '<span style="font-size:9px;color:var(--blue-dark);">AI</span>' : '')
      + '</div>';
  }).join('');
  section.style.display = '';
}

function selectHarvestPreset(chip) {
  document.querySelectorAll('.harvest-preset-chip').forEach(function(c){ c.classList.remove('selected'); });
  chip.classList.add('selected');
  var days  = parseInt(chip.getAttribute('data-days'))||0;
  var total = parseInt(chip.getAttribute('data-total'))||days;
  document.getElementById('pm-fdays').value = days;
  if (!document.getElementById('pm-tdays').value || document.getElementById('pm-tdays').value==='0') {
    document.getElementById('pm-tdays').value = total;
  }
  showToast('✅ 수확까지 '+days+'일 적용');
}

function resetHarvestLookup() {
  var lup = document.getElementById('pm-harvest-lookup');
  var pre = document.getElementById('pm-harvest-presets');
  if (lup) lup.style.display='none';
  if (pre) pre.style.display='none';
}
async function loadAllData() {
  setLoadingStep(1, 30, '로컬 DB 로드 중...');
  if (APP.plants.length === 0) {
    APP.plants = MASTER_DB.plants.map(function(p){ return Object.assign({}, p, {_local:true}); });
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
      // 중복 제거: id 우선, 같은 이름은 dateStr/events 많은 것 유지
      var _seen = {};
      var _deduped = [];
      var today = new Date().toISOString().slice(0,10);

      function _hasRealDate(p) {
        // 오늘 날짜이거나 비어있으면 '날짜 없음'으로 취급
        var d = p.dateStr || '';
        return d && d !== today && /^\d{4}-\d{2}-\d{2}$/.test(d);
      }

      function _betterPlant(ex, p) {
        // 우선순위: 1) 심은날짜 있는 것  2) events 많은 것  3) 기존 유지
        var exHasDate = _hasRealDate(ex);
        var pHasDate  = _hasRealDate(p);
        if (!exHasDate && pHasDate) return true;   // 새 것에 날짜 있음 → 교체
        if (exHasDate && !pHasDate) return false;  // 기존에 날짜 있음 → 유지
        // 둘 다 날짜 있거나 둘 다 없으면 events 많은 것 우선
        return (p.events||[]).length > (ex.events||[]).length;
      }

      plantsArr.forEach(function(p) {
        if (!p || !p.name) return;
        var key = 'name:' + p.name.trim();
        if (_seen[key] !== undefined) {
          var idx = _seen[key];
          var ex  = _deduped[idx];
          if (_betterPlant(ex, p)) {
            // 더 좋은 것으로 교체, dateStr과 events는 최선값 합치기
            _deduped[idx] = Object.assign({}, ex, p, {
              dateStr: _hasRealDate(p) ? p.dateStr : (ex.dateStr || p.dateStr),
              events:  (p.events||[]).length >= (ex.events||[]).length ? (p.events||[]) : (ex.events||[]),
              no:      ex.no || p.no,
            });
          } else {
            // 기존 유지하되 dateStr이 없으면 새 것 날짜로 보완
            if (!_hasRealDate(ex) && _hasRealDate(p)) {
              _deduped[idx].dateStr = p.dateStr;
            }
          }
        } else {
          _seen[key] = _deduped.length;
          _deduped.push(Object.assign({}, p));
        }
      });
      // _local(MASTER_DB) 항목은 GAS 데이터와 이름 중복이면 이미 제거됨
      APP.plants = _deduped.filter(function(p) { return p; });
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
      loadUserDb(),
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
      APP.logs = wlRows.concat(grRows).sort(function(a,b){
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

function startSlowTimers() {
  _slowTimer = setTimeout(function() {
    var el = document.getElementById('loading-slow-msg');
    if (el) el.style.display = '';
  }, 10000);
}

function clearSlowTimers() {
  if (_slowTimer)   { clearTimeout(_slowTimer);   _slowTimer   = null; }

}

function hideLoading() {
  clearSlowTimers();
  var overlay = document.getElementById('loading');
  if (!overlay) return;
  overlay.classList.add('fade-out');
  setTimeout(function() { overlay.classList.add('hidden'); }, 400);
}

function setLoadingMsg(msg) { setLoadingStep(2, 60, msg); }
function hideLoadingMsg()    {  }

function parseAgriText(rawText, confStr) {
  var t = rawText || '';
  var result = {
    name: '', tab: 'pest', type: '', regNo: '', ingredient: '',
    target: '', method: '', amount: '', timing: '', warning: '',
    manufacturer: '', barcode: '', raw_text: t,
    confidence: confStr || 'medium',
  };

  
  
  
  var BRAND_PREFIXES = ['영일','팜한농','동방아그로','경농','농협케미칼','바이엘','신젠타'];
  function removeBrandPrefix(name) {
    for (var bi=0; bi<BRAND_PREFIXES.length; bi++) {
      if (name.indexOf(BRAND_PREFIXES[bi])===0) return name.substring(BRAND_PREFIXES[bi].length).trim();
    }
    return name;
  }

  var lines_t = t.split('\n').map(function(l){ return l.trim(); }).filter(Boolean);

  // '품목명:' 위치 찾기 → 그 이전 줄이 제품명 후보
  var productLineIdx = -1;
  for (var li=0; li<lines_t.length; li++) {
    if (/품목명/.test(lines_t[li])) { productLineIdx=li; break; }
  }

  
  var nameCandidates = [];
  if (productLineIdx > 0) {
    for (var pi2=productLineIdx-1; pi2>=Math.max(0,productLineIdx-3); pi2--) {
      var cline = lines_t[pi2].replace(/[^가-힣a-zA-Z0-9\-\+\s]/g,' ').trim();
      if (cline.length >= 2) nameCandidates.push(removeBrandPrefix(cline));
    }
  }
  
  var firstLine = (lines_t[0]||'').replace(/[^가-힣a-zA-Z0-9\-\+\s]/g,' ').trim();
  if (firstLine.length >= 2) nameCandidates.push(removeBrandPrefix(firstLine));

  
  nameCandidates.sort(function(a,b){
    var ak=(a.match(/[가-힣]/g)||[]).length, bk=(b.match(/[가-힣]/g)||[]).length;
    return bk-ak;
  });
  var cleanName = nameCandidates.length>0 ? nameCandidates[0].substring(0,25) : '';
  result.name = cleanName;

  // '품목명:' 다음 텍스트를 성분명으로 추출
  if (productLineIdx >= 0) {
    var pmLine = lines_t[productLineIdx];
    var pmMatch = pmLine.match(/품목명[:\s]+(.{4,60})/);
    if (pmMatch) result.ingredient = pmMatch[1].trim();
    
    if (!result.ingredient && lines_t[productLineIdx+1]) {
      var nextLine = lines_t[productLineIdx+1].trim();
      if (nextLine.length >= 4 && !/사용/.test(nextLine)) result.ingredient = nextLine;
    }
  }

  
  var tClean = t.replace(/[^가-힣a-zA-Z0-9\s\n]/g,' ');
  if (/살충|살균|제초|살비|농약|수화제|유제|액상|입제|분제/i.test(tClean))  result.tab = 'pest';
  else if (/미생물|고초균|유산균|광합성균|효모균|바실루스|트리코데르마/i.test(tClean)) result.tab = 'micro';
  else result.tab = 'fert';

  
  var typePatterns = [
    [/살균살충/,'살균살충제'], [/살충/,'살충제'], [/살균/,'살균제'],
    [/비선택.*제초|글루포시네이트|글리포세이트|파라쾃/,'비선택성 제초제'],
    [/선택.*제초/,'선택성 제초제'], [/토양.*살충|토양처리/,'토양살충제'],
  ];
  for (var ti=0; ti<typePatterns.length; ti++) {
    if (typePatterns[ti][0].test(t)) { result.type = typePatterns[ti][1]; break; }
  }
  if (!result.type && result.tab==='fert') {
    if (/복합비료|NPK|\d+-\d+-\d+/.test(t))       result.type='복합비료';
    else if (/요소|질소/i.test(t))                result.type='질소질비료';
    else if (/인산|용성인비|과인산/i.test(t))     result.type='인산질비료';
    else if (/칼리|황산칼리|염화칼리/i.test(t))   result.type='칼리질비료';
    else if (/퇴비|부숙|유기/i.test(t))            result.type='퇴비·유기질';
    else if (/미량|붕소|아연|망간/i.test(t))      result.type='미량요소';
    else if (/석회|고토|pH/i.test(t))             result.type='석회·토양개량';
  }
  if (!result.type && result.tab==='micro') result.type='미생물균';

  
  var regM = t.match(/(?:등록번호|등록\s*No\.?|제\s*\d{4}-\d+)[:\s]*([가-힣\d\-]+)/i)
          || t.match(/([제第]\s*\d{4}[-\s]\d{3,6})/);
  if (regM) result.regNo = regM[1].trim();

  
  var ingM = t.match(/(?:주성분|유효성분|성분)[:\s]+([^\n\r]{5,80})/i)
          || t.match(/([가-힣a-zA-Z\s]+\s*\d+\.?\d*\s*%)/);
  if (ingM) result.ingredient = ingM[1].trim().substring(0,80);

  
  var npkM = t.match(/N\s*(\d+)\s*[-\s]*P(?:2O5)?\s*(\d+)\s*[-\s]*K(?:2O)?\s*(\d+)/i)
          || t.match(/(\d+)\s*-\s*(\d+)\s*-\s*(\d+)/);
  if (npkM && result.tab==='fert' && !result.ingredient) {
    result.ingredient = 'N'+npkM[1]+'-P'+npkM[2]+'-K'+npkM[3];
  }

  
  var tgtM = t.match(/(?:방제대상|적용병해충|대상작물|효과|주요\s*효과)[:\s]+([^\n\r]{5,100})/i);
  if (tgtM) result.target = tgtM[1].trim().substring(0,100);
  
  if (!result.target) {
    var bugs = tClean.match(/(진딧물|나방|총채벌레|응애|온실가루이|굼벵이|노균병|역병|탄저병|흰가루병|잿빛곰팡이|흑성병)[,·\s]*/g);
    if (bugs) result.target = bugs.join('').replace(/[,·\s]+$/,'').substring(0,80);
  }

  
  var methM = t.match(/(?:사용방법|희석배수|사용량)[:\s]+([^\n\r]{5,100})/i)
           || t.match(/(\d[\d,]+)\s*배\s*희석/);
  if (methM) result.method = methM[1].trim().substring(0,80);

  
  var amtM = t.match(/(?:10a당|10아르당|ha당|㎡당)[:\s]*([^\n\r]{3,30})/i)
          || t.match(/(\d+\s*(?:kg|L|ml|g|포|병)[\/\s]*(?:10a|ha)?)/i);
  if (amtM) result.amount = amtM[1].trim();

  
  var timM = t.match(/(?:사용시기|적용시기)[:\s]+([^\n\r]{3,60})/i)
          || t.match(/(발생\s*초기|생육기|정식\s*전|파종\s*전|개화기)/);
  if (timM) result.timing = timM[1].trim().substring(0,60);

  
  var warnM = t.match(/(?:주의사항|안전사용기준|안전\s*주의)[:\s]+([^\n\r]{5,120})/i);
  if (warnM) result.warning = warnM[1].trim().substring(0,120);

  
  var mfrM = t.match(/(?:제조사|제조원|수입사|㈜|주식회사)[:\s]*([가-힣a-zA-Z\s]{2,20}(?:㈜|㈔|주식회사)?)/i);
  if (mfrM) result.manufacturer = mfrM[1].trim();

  
  var bcM = t.match(/\b(\d{13})\b/) || t.match(/\b(\d{12})\b/);
  if (bcM) result.barcode = bcM[1];

  
  var masterMatch = matchMasterDb(result.name || rawText.substring(0,20));
  if (masterMatch) {
    if (!result.ingredient && masterMatch.ingredient) result.ingredient = masterMatch.ingredient;
    if (!result.target     && masterMatch.target)     result.target     = masterMatch.target;
    if (!result.method     && masterMatch.method)     result.method     = masterMatch.method;
    if (!result.type       && masterMatch.type)       result.type       = masterMatch.type;
    if (!result.tab        || result.tab==='fert')    result.tab        = masterMatch.tab||result.tab;
    result.confidence = 'high';
  }

  
  
  function cleanField(v) {
    return (v||'').replace(/[\u0000-\u001F\u007F\uFFFD]/g,'')
                  .replace(/\s+/g,' ').trim();
  }
  Object.keys(result).forEach(function(k) {
    if (typeof result[k] === 'string') result[k] = cleanField(result[k]);
  });

  
  if (!result.name) {
    var nm = t.match(/(?:상.표.명|제.품.명)[:\s:：]+([가-힣a-zA-Z0-9\s]{2,20})/);
    if (nm) result.name = cleanField(nm[1]);
  }
  if (!result.regNo) {
    
    var rn = t.match(/등\s*록\s*번\s*호[:\s：]*(\d{2}-[가-힣]+-\d+|\d{6,})/);
    if (rn) result.regNo = cleanField(rn[1]);
  }
  if (!result.ingredient) {
    
    var ig = t.match(/품\s*목\s*명[:\s：]+([가-힣a-zA-Z0-9\s%·]+?)(?:\n|$)/);
    if (ig) result.ingredient = cleanField(ig[1]);
  }
  if (!result.manufacturer) {
    var mf = t.match(/(?:제\s*조|수\s*입)[:\s：]+([가-힣()\s주식회사]{2,20})/);
    if (mf) result.manufacturer = cleanField(mf[1]);
  }

  
  var DEFAULTS = {
    name:'알 수 없음', tab:'pest', type:'살균제', regNo:'N/A',
    ingredient:'', target:'', method:'', amount:'',
    timing:'', warning:'', manufacturer:'', barcode:''
  };
  Object.keys(DEFAULTS).forEach(function(k) {
    if (!result[k]) result[k] = DEFAULTS[k];
  });

  
  var filledCount = ['name','ingredient','target','method','amount'].filter(function(k){ return result[k] && result[k] !== DEFAULTS[k]; }).length;
  if (filledCount >= 4)      result.confidence = 'high';
  else if (filledCount >= 2) result.confidence = 'medium';
  else                       result.confidence = 'low';

  return result;
}

function levenshtein(a, b) {
  var m=a.length, n=b.length, dp=[], i, j;
  for(i=0;i<=m;i++){ dp[i]=[i]; }
  for(j=0;j<=n;j++){ dp[0][j]=j; }
  for(i=1;i<=m;i++) for(j=1;j<=n;j++) {
    dp[i][j] = a[i-1]===b[j-1] ? dp[i-1][j-1]
      : 1+Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
  }
  return dp[m][n];
}

function getAllDbItems() {
  return (MASTER_DB.pesticides||[]).map(function(x){ return Object.assign({},x,{tab:'pest'}); })
    .concat((MASTER_DB.fertilizers||[]).map(function(x){ return Object.assign({},x,{tab:'fert'}); }))
    .concat((USER_DB.pest||[]).map(function(x){ return Object.assign({},x,{tab:'pest'}); }))
    .concat((USER_DB.fert||[]).map(function(x){ return Object.assign({},x,{tab:'fert'}); }))
    .concat((USER_DB.micro||[]).map(function(x){ return Object.assign({},x,{tab:'micro'}); }));
}

function matchMasterDb(nameHint) {
  if (!nameHint) return null;
  var nm    = nameHint.replace(/[^가-힣a-zA-Z0-9]/g,'').toLowerCase();
  var nmKor = nameHint.replace(/[^가-힣]/g,'');
  if (!nm && !nmKor) return null;
  var all = getAllDbItems();

  
  var m1 = all.find(function(x){
    var xn=(x.name||'').replace(/[^가-힣a-zA-Z0-9]/g,'').toLowerCase();
    return xn && (nm.includes(xn)||xn.includes(nm));
  });
  if (m1) return m1;

  
  if (nm.length >= 3) {
    var m2 = all.find(function(x){
      var ing=(x.ingredient||'').replace(/[^가-힣a-zA-Z0-9]/g,'').toLowerCase();
      return ing && ing.includes(nm.substring(0,Math.min(nm.length,6)));
    });
    if (m2) return m2;
  }

  
  if (nmKor.length >= 2) {
    var m3 = all.find(function(x){
      var xk=(x.name||'').replace(/[^가-힣]/g,'');
      
      return xk.length>=3 && nmKor.length>=2 && xk.substring(0,2)===nmKor.substring(0,2);
    });
    if (m3) return m3;
  }

  
  if (nmKor.length >= 2) {
    var scored = all.map(function(x){
      var xk=(x.name||'').replace(/[^가-힣]/g,'');
      if (!xk) return {item:x,score:999};
      var dist=levenshtein(nmKor,xk);
      var maxLen=Math.max(nmKor.length,xk.length);
      var ratio=dist/maxLen;
      
      var threshold = maxLen<=3 ? 0.4 : 0.5;
      return {item:x,score:ratio,dist:dist,threshold:threshold};
    }).filter(function(s){ return s.score<s.threshold; });
    scored.sort(function(a,b){ return a.score-b.score; });
    if (scored.length>0) return scored[0].item;
  }

  
  var m5 = all.find(function(x){
    var xn=(x.name||'').toLowerCase();
    return nm.length>=4 && xn.length>=4 && xn.substring(0,4)===nm.substring(0,4);
  });
  return m5||null;
}

async function enrichItemWithAI(item) {
  
  var match = matchMasterDb(item.name||'');
  if (match) {
    var updated = {};
    var changed = false;
    ['ingredient','target','method','type','warning','crop_range'].forEach(function(k){
      if (!item[k] && match[k]) { updated[k]=match[k]; changed=true; }
    });
    if (changed) return Object.assign({hasUpdate:true, summary:'내장 DB에서 정보 보완됨'}, updated);
  }
  
  var pestM = (MASTER_DB.pesticides||[]).find(function(p){
    return p.ingredient && item.name && item.name.includes(p.name.split(' ')[0]);
  });
  if (pestM) {
    return { hasUpdate:true, ingredient:pestM.ingredient, target:pestM.target,
      method:pestM.method, warning:pestM.warning, crop_range:pestM.crop_range,
      summary:'유사 농약 정보 참조됨' };
  }
  return { hasUpdate: false };
}

var _runtimeGasUrl = '';  

function getEffectiveGasUrl() {
  // index5와 동일: GAS_OCR_URL 우선
  if (typeof GAS_OCR_URL !== 'undefined' && GAS_OCR_URL &&
      GAS_OCR_URL.includes('script.google.com')) {
    return GAS_OCR_URL;
  }
  return GAS_URL || _runtimeGasUrl || localStorage.getItem('_runtimeGasUrl') || '';
}

function openGasSettingsModal() {
  var input = document.getElementById('gas-url-input');
  input.value = getEffectiveGasUrl();
  document.getElementById('gas-test-result').innerHTML = '';
  document.getElementById('gas-settings-modal').classList.remove('hidden');
  
  setTimeout(initClaudeKeyUI, 100);
}

async function testGasConnection() {
  var url = document.getElementById('gas-url-input').value.trim();
  var resultEl = document.getElementById('gas-test-result');
  if (!url) { resultEl.innerHTML = '<span style="color:var(--red-dark);">URL을 입력하세요</span>'; return; }

  resultEl.innerHTML = '<span style="color:var(--gray-400);">🔌 연결 테스트 중...</span>';
  try {
    var resp = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify({ action: 'ping' })
    });
    var data = await resp.json();
    if (data.success) {
      resultEl.innerHTML = '<span style="color:var(--green-dark);">✅ 연결 성공! OCR 엔진 사용 가능</span>';
    } else {
      resultEl.innerHTML = '<span style="color:var(--red-dark);">❌ 응답 오류: ' + esc(data.error||'알수없음') + '</span>';
    }
  } catch(e) {
    resultEl.innerHTML = '<span style="color:var(--red-dark);">❌ 연결 실패: ' + esc(e.message) + '<br>'
      + '<span style="font-size:10px;">웹앱 배포 시 액세스 권한이 "모든 사용자"인지 확인하세요</span></span>';
  }
}

function saveGasUrl() {
  var url = document.getElementById('gas-url-input').value.trim();
  GAS_URL = url || GAS_URL;
  _runtimeGasUrl = url;
  localStorage.setItem('_runtimeGasUrl', url);
  _gasPost({ action:'setAppSettings', key:'gasUrl', value:url }).catch(function(){});
  updateOcrEngineBadge();
  showToast(url ? '✅ GAS URL 저장됨' : '✅ Tesseract.js 모드로 전환됨');
}

async function loadGasUrlSetting() {
  try {
    var raw = await _gasGet('getAppSettings', { key:'gasUrl' });
    if (raw && raw.gasUrl) _runtimeGasUrl = raw.gasUrl;
  } catch(e) {}
  updateOcrEngineBadge();
}

function updateOcrEngineBadge() {
  var badge = document.getElementById('ocr-engine-badge');
  var dot   = document.getElementById('ocr-engine-dot');
  var label = document.getElementById('ocr-engine-label');
  if (!badge) return;
  var connected = !!getEffectiveGasUrl();
  badge.classList.toggle('connected', connected);
  badge.title = connected ? 'OCR 엔진: Google Drive (연결됨) — 클릭하여 변경' : 'OCR 엔진: Tesseract.js (기본) — 클릭하여 Drive OCR 연결';
  if (dot)   dot.style.background = connected ? '#4CAF50' : '#BDBDBD';
  if (label) label.textContent = connected ? '🟢 Drive OCR' : '⚙️ OCR 설정';
}

function renderStraightPanel() {
  var container = document.getElementById('db-list');
  if (!container) return;

  
  var myPlants = window._allPlants || [];
  var myNames = myPlants.map(function(p){ return (p.name||'').replace(/\s/g,''); });

  
  var myMatches = [];
  Object.keys(STRAIGHT_DB).forEach(function(dbCrop){
    var dbKey = dbCrop.replace(/[\s()（）]/g,'');
    for (var i=0; i<myNames.length; i++) {
      var mn = myNames[i];
      if (dbKey.indexOf(mn)!==-1 || mn.indexOf(dbKey.substring(0,Math.min(2,dbKey.length)))!==-1) {
        myMatches.push({crop:dbCrop, myName:myPlants[i].name, entries:STRAIGHT_DB[dbCrop]});
        break;
      }
    }
  });

  var html2 = '<div style="padding:10px 0;">';

  
  html2 += '<div style="display:flex;gap:6px;margin-bottom:12px;">'
    + '<input id="straight-search" type="text" placeholder="🔍 작물명 또는 해충명으로 검색" '
    + 'style="flex:1;padding:8px 12px;border:1px solid var(--gray-200);border-radius:8px;font-size:14px;" '
    + 'oninput="renderStraightSearch(this.value)">'
    + '</div>';

  
  if (myMatches.length > 0) {
    html2 += '<div style="font-size:12px;font-weight:600;color:var(--green-dark);margin-bottom:6px;">📋 내 작물에 적용 가능 (' + myMatches.length + '개 작물)</div>';
    html2 += '<div id="straight-my-crops">';
    myMatches.forEach(function(m){
      html2 += buildStraightCropCard(m.myName + ' (' + m.crop + ')', m.entries, true);
    });
    html2 += '</div>';
    html2 += '<div style="margin:14px 0;border-top:1px solid var(--gray-200);"></div>';
  }

  
  html2 += '<div style="font-size:12px;font-weight:600;color:var(--gray-400);margin-bottom:6px;">📚 전체 적용 작물 (61종)</div>';
  html2 += '<div id="straight-all-crops">';
  Object.keys(STRAIGHT_DB).sort().forEach(function(crop){
    html2 += buildStraightCropCard(crop, STRAIGHT_DB[crop], false);
  });
  html2 += '</div>';
  html2 += '</div>';

  container.innerHTML = html2;
}

function buildStraightCropCard(cropLabel, entries, highlight) {
  var id = 'sc_' + cropLabel.replace(/[^a-zA-Z가-힣]/g,'_');
  var bg = highlight ? 'background:var(--green-light);border:1px solid var(--green-mid);' : 'background:var(--card);border:1px solid var(--gray-200);';
  var html3 = '<div style="' + bg + 'border-radius:8px;margin-bottom:6px;overflow:hidden;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;cursor:pointer;" '
    + 'onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\'">'
    + '<span style="font-size:13px;font-weight:600;color:var(--green-dark);">' + esc(cropLabel) + '</span>'
    + '<span style="font-size:11px;color:var(--gray-400);">' + entries.length + '개 방제항목 ▼</span>'
    + '</div>'
    + '<div style="display:none;padding:0 8px 8px;">'
    + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
    + '<thead><tr style="background:var(--green-dark);">'
    + '<th style="padding:4px 6px;color:#fff;text-align:left;width:28%">방제 대상</th>'
    + '<th style="padding:4px 6px;color:#fff;text-align:left;width:28%">사용적기 및 방법</th>'
    + '<th style="padding:4px 6px;color:#fff;text-align:center;width:12%">물20ℓ당</th>'
    + '<th style="padding:4px 6px;color:#fff;text-align:center;width:20%">안전사용시기</th>'
    + '<th style="padding:4px 6px;color:#fff;text-align:center;width:12%">횟수</th>'
    + '</tr></thead><tbody>';
  entries.forEach(function(e, idx){
    var rbg = idx%2===0?'':'background:var(--gray-50);';
    html3 += '<tr style="' + rbg + 'border-bottom:0.5px solid var(--gray-200);">'
      + '<td style="padding:4px 6px;color:var(--gray-700);">' + esc(e.pest) + '</td>'
      + '<td style="padding:4px 6px;color:var(--gray-600);">' + esc(e.method) + '</td>'
      + '<td style="padding:4px 6px;text-align:center;font-weight:500;">' + esc(e.amount) + '</td>'
      + '<td style="padding:4px 6px;text-align:center;color:var(--red-dark);font-weight:500;">' + esc(e.safety) + '</td>'
      + '<td style="padding:4px 6px;text-align:center;">' + esc(e.times) + '</td>'
      + '</tr>';
  });
  html3 += '</tbody></table></div></div>';
  return html3;
}

function renderStraightSearch(query) {
  query = (query||'').trim();
  var allDiv = document.getElementById('straight-all-crops');
  var myDiv  = document.getElementById('straight-my-crops');
  if (!allDiv) return;

  if (!query) {
    
    allDiv.querySelectorAll('[data-straight-card]').forEach(function(el){ el.style.display=''; });
    if (myDiv) myDiv.querySelectorAll('[data-straight-card]').forEach(function(el){ el.style.display=''; });
    return;
  }

  var q = query.replace(/\s/g,'');
  
  var matched = {};
  Object.keys(STRAIGHT_DB).forEach(function(crop){
    var inCrop = crop.replace(/\s/g,'').indexOf(q) !== -1;
    var inPest = STRAIGHT_DB[crop].some(function(e){ return e.pest.indexOf(query) !== -1; });
    if (inCrop || inPest) matched[crop] = true;
  });

  
  var newHtml = '';
  Object.keys(STRAIGHT_DB).sort().forEach(function(crop){
    if (matched[crop]) newHtml += buildStraightCropCard(crop, STRAIGHT_DB[crop], false);
  });
  allDiv.innerHTML = newHtml || '<div style="padding:20px;text-align:center;color:var(--gray-400);">검색 결과가 없습니다</div>';
}

function renderHaengunPanel() {
  var container = document.getElementById('db-list');
  if (!container) return;

  var myPlants = window._allPlants || [];
  var myNames  = myPlants.map(function(p){ return (p.name||'').replace(/\s/g,''); });

  
  var myMatches = [];
  Object.keys(HAENGUN_DB).forEach(function(dbCrop){
    var dk = dbCrop.replace(/[\s()（）]/g,'');
    for (var i=0;i<myNames.length;i++){
      var mn=myNames[i];
      if (dk.indexOf(mn)!==-1 || mn.indexOf(dk.substring(0,Math.min(2,dk.length)))!==-1){
        myMatches.push({crop:dbCrop, myName:myPlants[i].name, entries:HAENGUN_DB[dbCrop]});
        break;
      }
    }
  });

  var h = '<div style="padding:10px 0;">';
  h += '<div style="background:#FFF0F5;border:1px solid #F8BBD0;border-radius:8px;padding:8px 12px;margin-bottom:10px;font-size:12px;">'
     + '<b style="color:#C2185B;">행운 (아족시스트로빈 액상수화제)</b> · 살균제 · 저독성 · 한일싸이언스<br>'
     + '<span style="color:#880E4F;">등록번호: 52-살균-112 · 물 20L당 보통 10ml · 스트로빌루린계 예방·치료 동시</span>'
     + '</div>';
  h += '<div style="display:flex;gap:6px;margin-bottom:10px;">'
     + '<input id="haengun-search" type="text" placeholder="🔍 작물명 또는 병해명 검색" '
     + 'style="flex:1;padding:8px 12px;border:1px solid var(--gray-200);border-radius:8px;font-size:14px;" '
     + 'oninput="renderHaengunSearch(this.value)">'
     + '</div>';

  if (myMatches.length) {
    h += '<div style="font-size:12px;font-weight:600;color:#C2185B;margin-bottom:6px;">🌸 내 작물에 적용 가능 ('+myMatches.length+'개 작물)</div>';
    h += '<div id="haengun-my">';
    myMatches.forEach(function(m){ h += buildHaengunCard(m.myName+' ('+m.crop+')', m.entries, true); });
    h += '</div><div style="margin:12px 0;border-top:1px solid var(--gray-200);"></div>';
  }

  h += '<div style="font-size:12px;font-weight:600;color:var(--gray-400);margin-bottom:6px;">📚 전체 적용 작물 (116종)</div>';
  h += '<div id="haengun-all">';
  Object.keys(HAENGUN_DB).sort().forEach(function(crop){
    h += buildHaengunCard(crop, HAENGUN_DB[crop], false);
  });
  h += '</div></div>';
  container.innerHTML = h;
}

function buildHaengunCard(label, entries, highlight) {
  var bg = highlight ? 'background:#FFF0F5;border:1px solid #F8BBD0;' : 'background:var(--card);border:1px solid var(--gray-200);';
  var h = '<div style="'+bg+'border-radius:8px;margin-bottom:5px;overflow:hidden;">'
    + '<div style="display:flex;align-items:center;justify-content:space-between;padding:7px 11px;cursor:pointer;" '
    + 'onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\'">'
    + '<span style="font-size:13px;font-weight:600;color:#C2185B;">'+esc(label)+'</span>'
    + '<span style="font-size:11px;color:var(--gray-400);">'+entries.length+'개 ▼</span></div>'
    + '<div style="display:none;padding:0 8px 8px;">'
    + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
    + '<thead><tr style="background:#E91E63;">'
    + ['적용 병해','사용적기 및 방법','물20ℓ당','안전사용시기','횟수'].map(function(hd){
        return '<th style="padding:4px 5px;color:#fff;text-align:left;">'+hd+'</th>';
      }).join('')
    + '</tr></thead><tbody>';
  entries.forEach(function(e,idx){
    h += '<tr style="'+(idx%2?'background:var(--gray-50);':'')+'border-bottom:0.5px solid var(--gray-200);">'
      + '<td style="padding:4px 5px;color:var(--gray-700);font-weight:500;">'+esc(e.dis)+'</td>'
      + '<td style="padding:4px 5px;color:var(--gray-600);">'+esc(e.method)+'</td>'
      + '<td style="padding:4px 5px;text-align:center;font-weight:500;">'+esc(e.amount)+'</td>'
      + '<td style="padding:4px 5px;text-align:center;color:#B71C1C;font-weight:500;">'+esc(e.safety)+'</td>'
      + '<td style="padding:4px 5px;text-align:center;">'+esc(e.times)+'</td></tr>';
  });
  h += '</tbody></table></div></div>';
  return h;
}

function renderHaengunSearch(q) {
  q = (q||'').trim();
  var allDiv = document.getElementById('haengun-all');
  if (!allDiv) return;
  if (!q) { allDiv.innerHTML=''; Object.keys(HAENGUN_DB).sort().forEach(function(crop){ allDiv.innerHTML+=buildHaengunCard(crop,HAENGUN_DB[crop],false); }); return; }
  var matched={};
  Object.keys(HAENGUN_DB).forEach(function(crop){
    if (crop.indexOf(q)!==-1 || HAENGUN_DB[crop].some(function(e){return e.dis.indexOf(q)!==-1;})) matched[crop]=true;
  });
  allDiv.innerHTML='';
  Object.keys(matched).sort().forEach(function(crop){ allDiv.innerHTML+=buildHaengunCard(crop,HAENGUN_DB[crop],false); });
  if (!allDiv.innerHTML) allDiv.innerHTML='<div style="padding:20px;text-align:center;color:var(--gray-400);">검색 결과 없음</div>';
}

function renderMyPestPanel() {
  var container = document.getElementById('db-list');
  if (!container) return;

  var list = window._myPesticideList || [];
  var masterItems = getAllDbItems('pest');
  var h = '<div style="padding:10px 0;">';

  var active = list.filter(function(p){ return p.status!=='empty'&&!p.excluded; });
  var empty  = list.filter(function(p){ return p.status==='empty'; });
  var excl   = list.filter(function(p){ return p.excluded&&p.status!=='empty'; });

  h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">'
     + '<div style="font-size:13px;font-weight:600;color:var(--gray-700);">📦 내 농약장 <span style="font-size:11px;color:var(--gray-400);">보유:'+active.length+' 소진:'+empty.length+'</span></div>'
     + '<div style="display:flex;gap:5px;">'
     + '<button onclick="openAiImportModal()" style="padding:7px 12px;background:var(--blue-dark);color:#fff;border-radius:7px;border:none;font-size:12px;cursor:pointer;">🤖 AI</button>'
     + '<button onclick="openRegisterPestModal()" style="padding:7px 14px;background:var(--green-dark);color:#fff;border-radius:7px;border:none;font-size:12px;font-weight:600;cursor:pointer;">+ 등록</button>'
     + '</div>'
     + '</div>';

  if (active.length) {
    h += '<div class="mypest-section-label" style="color:var(--green-dark);">✅ 보유 중 ('+active.length+')</div>';
    active.forEach(function(p){ h += buildMyPestCardV2(p); });
  }
  if (excl.length) {
    h += '<div class="mypest-section-label" style="color:var(--orange);">⏸ 추천 제외 ('+excl.length+')</div>';
    excl.forEach(function(p){ h += buildMyPestCardV2(p); });
  }
  if (empty.length) {
    h += '<div class="mypest-section-label" style="color:var(--gray-400);">📭 소진 ('+empty.length+')</div>';
    empty.forEach(function(p){ h += buildMyPestCardV2(p); });
  }

  h += '<details style="margin-top:14px;background:var(--gray-50,#F9F8F6);border-radius:10px;padding:10px 12px;">'
     + '<summary style="font-size:12px;font-weight:600;color:var(--gray-600);cursor:pointer;list-style:none;user-select:none;">📋 MASTER DB에서 빠르게 추가 ('+masterItems.length+'개)</summary>'
     + '<div id="master-import-list" style="margin-top:8px;max-height:320px;overflow-y:auto;">'
     + buildMasterImportList(masterItems, list)
     + '</div></details></div>';

  container.innerHTML = h;
}

function buildMasterImportList(masterItems,myList){
  var mn=myList.map(function(p){return(p.name||'').replace(/\s/g,'');});
  var grp={};masterItems.forEach(function(it){var t=it.type||'기타';if(!grp[t])grp[t]=[];grp[t].push(it);});
  var h='<div style="display:flex;gap:6px;align-items:center;padding:6px 4px 8px;border-bottom:1px solid var(--gray-200);margin-bottom:4px;">'
    +'<button onclick="_masterSelectAll(true)" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid var(--gray-200);background:#fff;cursor:pointer;">전체선택</button>'
    +'<button onclick="_masterSelectAll(false)" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid var(--gray-200);background:#fff;cursor:pointer;">선택해제</button>'
    +'<div style="flex:1;"></div>'
    +'<button onclick="_masterBulkAdd()" style="font-size:12px;padding:5px 14px;border-radius:6px;border:none;background:var(--green-dark);color:#fff;font-weight:700;cursor:pointer;">✅ 선택 추가</button>'
    +'</div>';
  Object.keys(grp).forEach(function(type){
    var tc={'살충제':'#1565C0','살균제':'#C2185B','살균살충제':'#6A1B9A','제초제':'#2E7D32','토양살충제':'#795548'}[type]||'#555';
    h+='<div style="font-size:11px;font-weight:700;color:#fff;background:'+tc+';padding:6px 10px;margin-top:6px;border-radius:6px 6px 0 0;">'+esc(type)+'</div>';
    grp[type].forEach(function(it){
      var nm=(it.name||'').replace(/\s/g,''),already=mn.indexOf(nm)!==-1;
      if(already){var _even2 = grp[type].indexOf(it) % 2 === 0;
      h+='<div style="display:flex;align-items:center;gap:8px;padding:8px 8px;border-bottom:1px solid #e8e8e8;opacity:0.45;background:'+(_even2?'#F8FBF8':'#EEF4FF')+';border-radius:0;"><div style="width:20px;"></div><div style="flex:1;"><span style="font-size:12px;font-weight:500;">'+esc(it.name||'')+' </span><div style="font-size:10px;color:var(--gray-400);">'+esc(String(it.ingredient||'').substring(0,35))+'</div></div><span style="font-size:10px;color:var(--green-dark);">✅ 보유중</span></div>';}
      else{var _tc2={'살충제':'#1565C0','살균제':'#AD1457','살균살충제':'#6A1B9A','제초제':'#2E7D32','토양살충제':'#4E342E'}[it.type||'']||'#37474F';
      var _even = grp[type].indexOf(it) % 2 === 0;
      h+='<label style="display:flex;align-items:center;gap:8px;padding:8px 8px;border-bottom:1px solid #e8e8e8;cursor:pointer;background:'+(_even?'#F8FBF8':'#EEF4FF')+';border-radius:0;"><input type="checkbox" class="master-chk" data-name="'+esc(it.name||'')+'" data-type="'+esc(it.type||'')+'" data-ingredient="'+esc(it.ingredient||'')+'" data-emoji="'+esc(it.emoji||'🧪')+'" style="width:20px;height:20px;cursor:pointer;flex-shrink:0;accent-color:'+_tc2+';"><div style="flex:1;"><div style="display:flex;align-items:center;gap:5px;"><span style="font-size:13px;font-weight:700;color:#111;">'+esc(it.name||'')+' </span><span style="font-size:9px;padding:1px 6px;border-radius:8px;background:'+_tc2+';color:#fff;font-weight:600;">'+esc(it.type||'')+' </span></div><div style="font-size:10px;color:var(--gray-500);margin-top:2px;">'+esc(String(it.ingredient||'').substring(0,40))+'</div></div></label>';}
    });
  });
  return h||'<div style="padding:10px;color:var(--gray-400);text-align:center;">항목 없음</div>';
}
async function quickAddFromMaster(n,t,i){await registerMyPesticide({name:n,type:t,ingredient:i,emoji:'🧪',pest_status:'have'});await loadMyPesticideList();renderMyPestPanel();showToast('✅ '+n+' 추가됨');}

function buildMyPestCardV2(p) {
  var isEmpty = p.status==='empty';
  var isExcl  = p.excluded&&!isEmpty;
  var tc = {'살균제':'#C2185B','살충제':'#1565C0','살균살충제':'#6A1B9A','제초제':'#2E7D32','비료·퇴비':'#E65100','영양제':'#F9A825','미생물':'#00838F'}[p.type]||'var(--gray-600)';
  var op = (isEmpty||isExcl)?'opacity:0.6;':'';
  var bd = isEmpty?'border-color:var(--gray-200);':isExcl?'border-color:#FF8F00;':'border-color:'+tc+';';
  var h = '<div style="border:1.5px solid;'+bd+op+'border-radius:10px;padding:10px 12px;margin-bottom:7px;">'
    + '<div style="display:flex;align-items:center;gap:7px;flex-wrap:wrap;margin-bottom:4px;">'
    + '<span style="font-size:15px;">'+(p.icon||'🧪')+'</span>'
    + '<span style="font-size:14px;font-weight:700;">'+esc(p.name||'')+'</span>'
    + '<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:'+tc+'22;color:'+tc+';font-weight:600;">'+esc(p.type||'')+'</span>'
    + (isEmpty?'<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:var(--gray-200);color:var(--gray-500);">소진</span>':'')
    + (isExcl?'<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:#FFF3E0;color:#E65100;">추천제외</span>':'')
    + '</div>';
  if (p.ingredient) h+='<div style="font-size:11px;color:var(--gray-500);margin-bottom:5px;">'+esc(p.ingredient)+'</div>';
  if (p.memo)       h+='<div style="font-size:11px;color:var(--gray-400);margin-bottom:5px;">📝 '+esc(p.memo)+'</div>';
  h += '<div style="display:flex;gap:5px;flex-wrap:wrap;">';
  if (!isEmpty)
    h += '<button onclick="doTogglePest(\''+p._id+'\',\'empty\')" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid var(--gray-300);background:#fff;cursor:pointer;">📭 소진</button>';
  else
    h += '<button onclick="doTogglePest(\''+p._id+'\',\'restore\')" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid var(--green-mid);background:var(--green-light);cursor:pointer;">♻️ 복구</button>';
  if (!isExcl&&!isEmpty)
    h += '<button onclick="doTogglePest(\''+p._id+'\',\'exclude\')" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid #FF8F00;background:#FFF3E0;color:#E65100;cursor:pointer;">⏸ 추천제외</button>';
  else if (isExcl)
    h += '<button onclick="doTogglePest(\''+p._id+'\',\'include\')" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid var(--green-mid);background:var(--green-light);cursor:pointer;">▶ 추천포함</button>';
  h += '<button onclick="deletePesticideFromList(\''+p._id+'\')" style="font-size:11px;padding:4px 10px;border-radius:6px;border:1px solid var(--gray-200);background:#fff;color:var(--red-dark);cursor:pointer;">🗑</button>';
  h += '</div></div>';
  return h;
}

async function deletePesticideFromList(id) {
  if (!confirm('목록에서 삭제하시겠습니까?')) return;
  await _gasPost({ action:'deleteMyPesticide', id:id });
  await loadMyPesticideList();
  renderMyPestPanel();
  showToast('삭제됨');
}

async function doTogglePest(id, action) {
  await togglePesticideStatus(id, action);
  renderMyPestPanel();
  showToast('✅ 상태가 변경되었습니다');
}

function doRecommend() {
  var crop = (document.getElementById('mypest-crop-sel')||{}).value||'';
  var dis  = ((document.getElementById('mypest-dis-inp')||{}).value||'').trim();
  var out  = document.getElementById('recommend-result');
  if (!out) return;
  if (!crop) { out.innerHTML='<span style="font-size:11px;color:var(--red-dark);">작물을 선택하세요</span>'; return; }

  var results = getRecommendedPesticidesV2(crop, dis);
  if (!results.length) {
    out.innerHTML='<div style="font-size:12px;color:var(--gray-400);padding:8px 0;">해당 조건에 맞는 농약 정보가 없습니다.<br>스트레이트(살충) 또는 행운(살균) 포장지 DB를 확인하세요.</div>';
    return;
  }

  var myNames = (window._myPesticideList||[]).filter(function(p){return p.status!=='empty'&&!p.excluded;}).map(function(p){return(p.name||'').replace(/\s/g,'');});
  var h = '';
  var haveList = results.filter(function(r){ return myNames.indexOf((r.name||'').replace(/\s/g,''))!==-1; });
  var otherList = results.filter(function(r){ return myNames.indexOf((r.name||'').replace(/\s/g,''))===-1; });

  if (haveList.length) {
    h += '<div style="font-size:11px;font-weight:600;color:var(--green-dark);margin:4px 0 3px;">✅ 보유 농약 중 적용 가능 ('+haveList.length+'개)</div>';
    haveList.forEach(function(r){ h += buildRecommendCard(r, true); });
  }
  if (otherList.length) {
    h += '<div style="font-size:11px;font-weight:600;color:var(--gray-400);margin:6px 0 3px;">💡 기타 적용 가능 농약 ('+otherList.length+'개)</div>';
    otherList.forEach(function(r){ h += buildRecommendCard(r, false); });
  }
  out.innerHTML = h || '<div style="font-size:12px;color:var(--gray-400);padding:6px 0;">해당 결과 없음</div>';
}

function buildRecommendCard(r, highlight) {
  var bg = highlight ? 'background:var(--green-light);border-color:var(--green-mid);' : 'background:#fff;border-color:var(--gray-200);';
  var h = '<div style="border:1px solid;'+bg+'border-radius:7px;padding:8px 10px;margin-bottom:5px;">'
    + '<div style="font-size:13px;font-weight:700;margin-bottom:3px;">'+(highlight?'✅ ':'')+''+esc(r.name)+'</div>';
  r.entries.slice(0,3).forEach(function(e){
    var target=e.target||e.dis||e.pest||'';
    h += '<div style="font-size:11px;color:var(--gray-600);line-height:1.6;">'
       + (target?'• '+esc(target)+' ':'')+esc(e.method||'')+' / '+esc(e.amount||'')+' / <span style="color:var(--red-dark);">'+esc(e.safety||'')+'</span>'
       + (e.times?' ('+esc(e.times)+')':'')+'</div>';
  });
  if (r.entries.length>3) h+='<div style="font-size:10px;color:var(--gray-400);margin-top:2px;">... 외 '+(r.entries.length-3)+'개</div>';
  h += '</div>';
  return h;
}

function openRegisterPestModal() {
  var existing = document.getElementById('register-pest-modal');
  if (existing) { existing.classList.remove('hidden'); _switchRegTab('scan'); return; }

  var modal = document.createElement('div');
  modal.className = 'modal-bg'; modal.id = 'register-pest-modal';
  modal.innerHTML =
    '<div class="modal" style="max-height:90vh;overflow-y:auto;">'
    
    + '<div class="modal-title" style="font-size:14px;">🧪 새 농약 등록</div>'

    
    + '<div style="display:flex;gap:0;border-bottom:2px solid var(--gray-200);margin-bottom:14px;">'
    +   '<button class="reg-tab-btn on" id="rtab-scan"  onclick="_switchRegTab(\'scan\')" >📷 포장지 스캔</button>'
    +   '<button class="reg-tab-btn"    id="rtab-csv"   onclick="_switchRegTab(\'csv\')"  >📄 CSV 파일</button>'
    +   '<button class="reg-tab-btn"    id="rtab-manual" onclick="_switchRegTab(\'manual\')">✏️ 직접입력</button>'
    + '</div>'

    
    + '<div id="rpanel-scan" class="reg-tab-panel">'
    + '<div style="font-size:12px;color:var(--gray-500);margin-bottom:10px;">포장지를 촬영해서 작물별 사용량을 자동으로 불러옵니다.</div>'
    + '<div style="background:var(--green-light);border:1px solid var(--green-mid);border-radius:8px;padding:12px;text-align:center;">'
    + '<div style="font-size:30px;margin-bottom:6px;">📷</div>'
    + '<div style="font-size:13px;font-weight:500;color:var(--green-dark);margin-bottom:8px;">포장지 뒷면 스캔</div>'
    + '<div style="font-size:11px;color:var(--gray-500);margin-bottom:10px;">"적용병해충 및 사용량" 표가 있는 면을 촬영하세요</div>'
    + '<button onclick="_startPesticideLabelScan()" style="padding:10px 24px;background:var(--green-dark);color:#fff;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;">📷 카메라 열기</button>'
    + '</div>'
    + '<div id="scan-parse-result" style="margin-top:12px;"></div>'
    + '</div>'

    
    + '<div id="rpanel-csv" class="reg-tab-panel" style="display:none;">'
    + '<div style="font-size:12px;color:var(--gray-500);margin-bottom:8px;">CSV 파일을 업로드하면 여러 농약을 한 번에 등록합니다.</div>'

    
    + '<details style="margin-bottom:10px;background:var(--gray-50,#F9F8F6);border-radius:8px;padding:8px 10px;">'
    + '<summary style="font-size:12px;font-weight:600;color:var(--gray-600);cursor:pointer;list-style:none;">📋 CSV 포맷 보기 / 템플릿 다운로드</summary>'
    + '<div style="margin-top:8px;font-size:11px;color:var(--gray-600);line-height:1.8;">'
    + '<b>필수 컬럼:</b> 제품명, 분류, 작물명, 적용병해충, 사용방법, 안전사용시기, 횟수<br>'
    + '<b>선택 컬럼:</b> 성분명, 제조사, 등록번호, 독성, 물20L당사용량, 메모<br>'
    + '<b>규칙:</b> 같은 제품명 여러 행 = 작물별 구분 (자동 그룹화)<br>'
    + '</div>'
    + '<button onclick="downloadCsvTemplate()" style="margin-top:6px;padding:5px 12px;border-radius:6px;border:1px solid var(--blue-dark);background:var(--blue-light);color:var(--blue-dark);font-size:11px;cursor:pointer;">⬇️ 빈 템플릿 다운로드</button>'
    + '</details>'

    
    + '<div style="border:2px dashed var(--gray-200);border-radius:10px;padding:20px;text-align:center;margin-bottom:10px;" id="csv-drop-zone">'
    + '<div style="font-size:28px;margin-bottom:6px;">📄</div>'
    + '<div style="font-size:13px;color:var(--gray-500);margin-bottom:8px;">CSV 파일을 여기에 드래그하거나</div>'
    + '<input type="file" id="csv-file-input" accept=".csv,.txt" style="display:none;" onchange="handleCsvFile(this.files[0])">'
    + '<button onclick="document.getElementById(\'csv-file-input\').click()" style="padding:8px 20px;background:var(--blue-dark);color:#fff;border-radius:7px;border:none;font-size:13px;cursor:pointer;">파일 선택</button>'
    + '</div>'

    
    + '<div id="csv-preview" style=""></div>'
    + '</div>'

    
    + '<div id="rpanel-manual" class="reg-tab-panel" style="display:none;">'
    + '<div style="font-size:12px;color:var(--gray-500);margin-bottom:10px;">제품 정보를 직접 입력합니다. 작물별 사용량은 등록 후 추가할 수 있습니다.</div>'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
    + _rInp('제품명 *','rp-name','text','예: 테부코나졸')
    + _rSel('분류 *','rp-type')
    + _rInp('성분명','rp-ingredient','text','예: 테부코나졸 25%')
    + _rInp('제조사','rp-mfr','text','예: 경농')
    + _rInp('등록번호','rp-regno','text','')
    + _rInp('아이콘','rp-icon','text','🧪')
    + '</div>'
    + '<div style="margin-bottom:10px;"><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:3px;">메모</label>'
    + '<textarea id="rp-memo" style="width:100%;padding:7px;border:1px solid var(--gray-200);border-radius:6px;font-size:13px;height:55px;" placeholder="보관 위치, 구매일 등"></textarea></div>'

    
    + '<div style="font-size:12px;font-weight:600;color:var(--gray-600);margin-bottom:6px;">작물별 사용량 (선택)</div>'
    + '<div id="manual-crop-rows"></div>'
    + '<button onclick="_addManualCropRow()" style="width:100%;padding:7px;border:1px dashed var(--gray-300);background:#fff;border-radius:6px;font-size:12px;color:var(--gray-500);cursor:pointer;margin-bottom:10px;">+ 작물 행 추가</button>'
    + '<div class="modal-btns">'
    + '<button class="btn-secondary" onclick="closeModal(\'register-pest-modal\')">취소</button>'
    + '<button class="btn-primary" onclick="submitRegisterPest()">등록</button>'
    + '</div></div>'  
    + '</div>';  

  document.body.appendChild(modal);
  
  var sel = modal.querySelector('#rp-type');
  if (sel) ['살균제','살충제','살균살충제','제초제','선택성 제초제','비선택성 제초제','토양살충제','비료·퇴비','영양제','미생물','기타'].forEach(function(t){
    var o=document.createElement('option'); o.value=t; o.textContent=t; sel.appendChild(o);
  });
  
  var zone = modal.querySelector('#csv-drop-zone');
  if (zone) {
    zone.addEventListener('dragover', function(e){e.preventDefault();zone.style.borderColor='var(--blue-dark)';});
    zone.addEventListener('dragleave', function(){zone.style.borderColor='var(--gray-200)';});
    zone.addEventListener('drop', function(e){e.preventDefault();zone.style.borderColor='var(--gray-200)';if(e.dataTransfer.files[0]) handleCsvFile(e.dataTransfer.files[0]);});
  }
}

function _switchRegTab(name) {
  ['scan','csv','manual'].forEach(function(n){
    var btn=document.getElementById('rtab-'+n); var pnl=document.getElementById('rpanel-'+n);
    if(btn){ btn.classList.toggle('on', n===name); }
    if(pnl){ pnl.style.display = n===name?'':'none'; }
  });
}

function _rInp(label,id,type,ph){
  return '<div><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:2px;">'+label+'</label>'
    +'<input id="'+id+'" type="'+type+'" placeholder="'+ph+'" style="width:100%;padding:7px;border:1px solid var(--gray-200);border-radius:6px;font-size:13px;box-sizing:border-box;"></div>';
}
function _rSel(label,id){
  return '<div><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:2px;">'+label+'</label>'
    +'<select id="'+id+'" style="width:100%;padding:7px;border:1px solid var(--gray-200);border-radius:6px;font-size:13px;"></select></div>';
}

function _addManualCropRow() {
  var container = document.getElementById('manual-crop-rows');
  if (!container) return;
  var idx = container.children.length;
  var row = document.createElement('div');
  row.style.cssText = 'display:grid;grid-template-columns:1.5fr 2fr 1fr 1.5fr 1fr auto;gap:5px;margin-bottom:5px;align-items:end;';
  row.innerHTML =
    _rGv('작물명','mc-crop-'+idx,'예: 블루베리') +
    _rGv('적용병해충','mc-pest-'+idx,'예: 탄저병') +
    _rGv('사용량','mc-amount-'+idx,'10ml') +
    _rGv('안전사용시기','mc-safety-'+idx,'수확 7일전') +
    _rGv('횟수','mc-times-'+idx,'2회') +
    '<div><button onclick="this.parentElement.parentElement.remove()" style="padding:7px;border:1px solid var(--gray-200);background:#fff;border-radius:6px;color:var(--red-dark);cursor:pointer;font-size:13px;">🗑</button></div>';
  container.appendChild(row);
}
function _rGv(label,id,ph){
  return '<div><label style="font-size:10px;color:var(--gray-400);display:block;margin-bottom:2px;">'+label+'</label>'
    +'<input id="'+id+'" type="text" placeholder="'+ph+'" style="width:100%;padding:6px;border:1px solid var(--gray-200);border-radius:5px;font-size:12px;box-sizing:border-box;"></div>';
}

function _startPesticideLabelScan() {
  closeModal('register-pest-modal');
  
  openScanModal();
  setScanMode('ocr', document.getElementById('smt-ocr'));
  
  window._scanForPesticide = true;
  showToast('📷 촬영 후 분석하면 자동으로 농약 등록 화면으로 연결됩니다');
}

function handleCsvFile(file) {
  if (!file) return;
  var preview = document.getElementById('csv-preview');
  if (preview) preview.innerHTML = '<div style="padding:10px;color:var(--gray-400);">읽는 중...</div>';

  var reader = new FileReader();
  reader.onload = function(e) {
    var text = e.target.result;
    
    if (text.charCodeAt(0) === 0xFEFF) text = text.slice(1);
    var parsed = parsePesticideCsv(text);
    renderCsvPreview(parsed);
  };
  reader.readAsText(file, 'UTF-8');
}

function parsePesticideCsv(text) {
  var lines = text.split(/\r?\n/).filter(function(l){return l.trim();});
  if (!lines.length) return {headers:[], rows:[], grouped:{}};

  
  var headers = lines[0].split(',').map(function(h){return h.trim();});
  var COL = {};
  headers.forEach(function(h,i){ COL[h]=i; });

  var rows = [];
  for (var i=1; i<lines.length; i++) {
    
    var cols = _csvSplitLine(lines[i]);
    if (cols.length < 2) continue;
    var row = {};
    headers.forEach(function(h,j){ row[h] = (cols[j]||'').trim(); });
    if (row['제품명']) rows.push(row);
  }

  
  var grouped = {};
  rows.forEach(function(row){
    var nm = row['제품명'];
    if (!grouped[nm]) {
      grouped[nm] = {
        name: nm,
        type: row['분류']||'',
        ingredient: row['성분명']||'',
        manufacturer: row['제조사']||'',
        regNo: row['등록번호']||'',
        toxicity: row['독성']||'',
        defaultAmount: row['물20L당사용량']||'',
        memo: row['메모']||'',
        icon: '🧪',
        cropUsage: {}
      };
    }
    
    var crop = row['작물명'];
    if (crop) {
      if (!grouped[nm].cropUsage[crop]) grouped[nm].cropUsage[crop] = [];
      grouped[nm].cropUsage[crop].push({
        target:  row['적용병해충']||'',
        method:  row['사용방법']||'',
        amount:  row['물20L당사용량']||row['물20ℓ당사용량']||'',
        safety:  row['안전사용시기']||'',
        times:   row['횟수']||''
      });
    }
  });

  return {headers:headers, rows:rows, grouped:grouped};
}

function _csvSplitLine(line) {
  var result=[]; var cur=''; var inQ=false;
  for(var i=0;i<line.length;i++){
    var c=line[i];
    if(c==='"'){inQ=!inQ;}
    else if(c===','&&!inQ){result.push(cur);cur='';}
    else{cur+=c;}
  }
  result.push(cur);
  return result;
}

function renderCsvPreview(parsed) {
  var preview = document.getElementById('csv-preview');
  if (!preview) return;
  var grouped = parsed.grouped;
  var keys = Object.keys(grouped);
  if (!keys.length) {
    preview.innerHTML='<div style="padding:10px;color:var(--red-dark);">유효한 데이터가 없습니다. CSV 포맷을 확인하세요.</div>';
    return;
  }

  var myNames = (window._myPesticideList||[]).map(function(p){return(p.name||'').replace(/\s/g,'');});
  var h = '<div style="font-size:12px;font-weight:600;color:var(--gray-700);margin-bottom:8px;">'
    +'미리보기 — '+keys.length+'개 제품 / '+parsed.rows.length+'개 행</div>';

  keys.forEach(function(nm){
    var p = grouped[nm];
    var already = myNames.indexOf(nm.replace(/\s/g,''))!==-1;
    var cropCount = Object.keys(p.cropUsage).length;
    h += '<div style="border:1px solid '+(already?'var(--green-mid)':'var(--gray-200)')+';border-radius:8px;padding:8px 10px;margin-bottom:6px;">'
       + '<div style="display:flex;align-items:center;gap:7px;margin-bottom:4px;">'
       + '<span style="font-size:13px;font-weight:700;">'+esc(nm)+'</span>'
       + '<span style="font-size:11px;background:var(--gray-100);padding:1px 7px;border-radius:8px;">'+esc(p.type)+'</span>'
       + (already?'<span style="font-size:10px;color:var(--blue-dark);padding:1px 7px;border-radius:8px;background:var(--blue-light);">기존+업데이트</span>':'<span style="font-size:10px;color:var(--green-dark);padding:1px 7px;border-radius:8px;background:var(--green-light);">신규등록</span>')
       + '</div>'
       + '<div style="font-size:11px;color:var(--gray-500);margin-bottom:4px;">'+esc(p.ingredient||'')+(p.manufacturer?' · '+esc(p.manufacturer):'')+'</div>'
       + '<div style="font-size:11px;color:var(--blue-dark);">작물 '+cropCount+'종 · '
       + Object.keys(p.cropUsage).slice(0,5).map(function(c){return esc(c);}).join(', ')
       + (cropCount>5?' 외 '+(cropCount-5)+'종':'')+'</div>'
       + '</div>';
  });

  h += '<div style="margin-top:10px;display:flex;gap:8px;">'
     + '<button class="btn-secondary" onclick="document.getElementById(\'csv-preview\').innerHTML=\'\'" style="flex:1;">다시 선택</button>'
     + '<button class="btn-primary" onclick="importCsvData()" style="flex:2;">✅ 가져오기 ('+keys.length+'개 제품)</button>'
     + '</div>';

  preview.innerHTML = h;
  preview._csvParsed = parsed;
}

async function importCsvData() {
  var preview = document.getElementById('csv-preview');
  if (!preview || !preview._csvParsed) { showToast('데이터를 먼저 선택하세요'); return; }

  var grouped = preview._csvParsed.grouped;
  var keys = Object.keys(grouped);
  var btn = preview.querySelector('.btn-primary');
  if (btn) { btn.disabled=true; btn.textContent='저장 중...'; }

  var newCount=0; var updateCount=0;
  var myNames = (window._myPesticideList||[]).map(function(p){return(p.name||'').replace(/\s/g,'');});

  for (var i=0; i<keys.length; i++) {
    var nm = keys[i];
    var p = grouped[nm];
    var already = myNames.indexOf(nm.replace(/\s/g,''))!==-1;

    
    if (!already) {
      await registerMyPesticide({name:nm, type:p.type, ingredient:p.ingredient, manufacturer:p.manufacturer, regNo:p.regNo, icon:'🧪', memo:p.memo});
      newCount++;
    }
    
    if (Object.keys(p.cropUsage).length > 0) {
      await updateCropUsageFromScan(nm, p.cropUsage);
      updateCount++;
    }
  }

  await loadMyPesticideList();
  await loadUserCropUsage();
  await initOfflineSystem();
  closeModal('register-pest-modal');
  setDbTab('mypest', document.getElementById('dbt-mypest'));
  showToast('✅ 신규 '+newCount+'개 등록 / '+updateCount+'개 작물정보 업데이트');
}

function downloadCsvTemplate() {
  var header = '제품명,분류,성분명,제조사,등록번호,독성,물20L당사용량,작물명,적용병해충,사용방법,안전사용시기,횟수,메모';
  var ex1 = '신농약이름,살균제,성분명 25%,제조사명,,저독성,10ml,블루베리,탄저병,발생초기 경엽처리,수확 7일전,2회 이내,';
  var ex2 = '신농약이름,살균제,성분명 25%,제조사명,,저독성,10ml,무화과,역병,발병초 10일간격 경엽처리,수확 14일전,3회 이내,';
  var bom = '\uFEFF';
  var csv = bom + [header, ex1, ex2].join('\n');
  var blob = new Blob([csv], {type:'text/csv;charset=utf-8'});
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href=url; a.download='농약등록_템플릿.csv';
  a.click(); URL.revokeObjectURL(url);
  showToast('📄 템플릿 다운로드됨');
}

async function submitRegisterPest() {
  var name = (document.getElementById('rp-name')||{}).value||'';
  if (!name.trim()) { showToast('제품명을 입력하세요'); return; }
  var data = {
    name: name.trim(),
    type: (document.getElementById('rp-type')||{}).value||'살균제',
    ingredient: (document.getElementById('rp-ingredient')||{}).value||'',
    manufacturer: (document.getElementById('rp-mfr')||{}).value||'',
    regNo: (document.getElementById('rp-regno')||{}).value||'',
    icon: (document.getElementById('rp-icon')||{}).value||'🧪',
    memo: (document.getElementById('rp-memo')||{}).value||'',
  };
  
  var cropUsage = {};
  document.querySelectorAll('#manual-crop-rows > div').forEach(function(row,idx){
    var crop   = (row.querySelector('[id^="mc-crop-"]')||{}).value||'';
    var pest   = (row.querySelector('[id^="mc-pest-"]')||{}).value||'';
    var amount = (row.querySelector('[id^="mc-amount-"]')||{}).value||'';
    var safety = (row.querySelector('[id^="mc-safety-"]')||{}).value||'';
    var times  = (row.querySelector('[id^="mc-times-"]')||{}).value||'';
    if (crop) {
      if (!cropUsage[crop]) cropUsage[crop] = [];
      cropUsage[crop].push({target:pest, method:'', amount:amount, safety:safety, times:times});
    }
  });
  await registerMyPesticideWithUsage(data, cropUsage);
  closeModal('register-pest-modal');
  setDbTab('mypest', document.getElementById('dbt-mypest'));
  showToast('✅ '+data.name+' 등록 완료');
}

function _linkScanResultToPestReg(parsed) {
  
  var name = (document.getElementById('ocr-f-name')||{}).value||parsed.name||'';
  if (!name) { showToast('제품명을 확인해 주세요'); return; }

  
  
  
  var rawText = (document.getElementById('scan-ocr-textarea')||{}).value||'';
  var autoUsage = _parseRawLabelText(rawText, name);

  
  closeModal('scan-modal');
  openRegisterPestModal();
  _switchRegTab('manual');

  
  setTimeout(function(){
    var nm = document.getElementById('rp-name'); if(nm) nm.value = name;
    var tp = document.getElementById('rp-type'); if(tp) tp.value = parsed.tab==='pest'?'살충제':'살균제';
    var ig = document.getElementById('rp-ingredient'); if(ig) ig.value = parsed.ingredient||'';
    var mf = document.getElementById('rp-mfr'); if(mf) mf.value = parsed.manufacturer||'';
    var rn = document.getElementById('rp-regno'); if(rn) rn.value = parsed.regNo||'';

    
    if (autoUsage && Object.keys(autoUsage).length>0) {
      Object.keys(autoUsage).forEach(function(crop){
        autoUsage[crop].forEach(function(e){
          _addManualCropRow();
          var idx = document.querySelectorAll('#manual-crop-rows > div').length - 1;
          var cr=document.getElementById('mc-crop-'+idx); if(cr) cr.value=crop;
          var ps=document.getElementById('mc-pest-'+idx); if(ps) ps.value=e.target||'';
          var am=document.getElementById('mc-amount-'+idx); if(am) am.value=e.amount||'10ml';
          var sf=document.getElementById('mc-safety-'+idx); if(sf) sf.value=e.safety||'';
          var tm=document.getElementById('mc-times-'+idx); if(tm) tm.value=e.times||'';
        });
      });
      showToast('📋 OCR에서 '+Object.keys(autoUsage).length+'개 작물 정보 자동 채움');
    } else {
      showToast('📷 제품 정보를 확인하고 작물별 사용량을 추가해 주세요');
    }
  }, 200);
}

function _parseRawLabelText(text, pesticideName) {
  if (!text) return {};
  var usage = {};
  
  text.split('\n').forEach(function(line){
    line = line.trim();
    if (!line || line.length < 4) return;
    
    var m = line.match(/^([가-힣()\s]{2,10})\s+([가-힣/\s]{2,20})\s+(발[가-힣\s]*처리[가-힣\s]*|월동[가-힣\s]*)/);
    if (m) {
      var crop = m[1].trim();
      if (!usage[crop]) usage[crop]=[];
      usage[crop].push({target:m[2].trim(), method:m[3].trim(), amount:'10ml', safety:'', times:''});
    }
  });
  return usage;
}

function renderFertPanel(tab) {
  var container = document.getElementById('db-list');
  if (!container) return;

  var allItems = getMergedDb(tab);    
  var myPlants = window._allPlants || [];
  var myNames  = myPlants.map(function(p){ return (p.name||'').replace(/\s/g,''); });

  
  var withUsage = allItems.filter(function(it){ return it.cropUsage && Object.keys(it.cropUsage).length>0; });
  
  var myMatches = [];
  withUsage.forEach(function(it){
    var crops = Object.keys(it.cropUsage);
    var matched = crops.filter(function(c){
      var ck = c.replace(/[\s,··]/g,'');
      return myNames.some(function(mn){ return ck.indexOf(mn)!==-1 || mn.indexOf(ck.substring(0,Math.min(2,ck.length)))!==-1; });
    });
    if (matched.length) myMatches.push({item:it, matchedCrops:matched});
  });

  var h = '<div style="padding:10px 0;">';
  var label = tab==='nutr'?'💊 영양제':'🌱 비료·퇴비·영양제';
  var searchQ = (document.getElementById('db-search')||{}).value||'';

  
  h += '<details open style="background:var(--green-light);border:1px solid var(--green-mid);border-radius:10px;padding:10px 12px;margin-bottom:12px;">'
     + '<summary style="font-size:13px;font-weight:600;color:var(--green-dark);cursor:pointer;list-style:none;user-select:none;">🎯 내 작물에 적용 가능한 비료·영양제</summary>';

  if (myMatches.length === 0) {
    h += '<div style="font-size:12px;color:var(--gray-500);padding:8px 0;">작물별 적용 정보가 있는 비료가 없거나 내 작물이 등록되지 않았습니다.</div>';
  } else {
    h += '<div style="margin-top:8px;">';
    myMatches.forEach(function(m){
      var it = m.item;
      h += buildFertUsageCard(it, m.matchedCrops, true);
    });
    h += '</div>';
  }
  h += '</details>';

  
  var searchQ2 = (document.getElementById('db-search')||{}).value||'';
  var filtered = allItems.filter(function(it){
    if (!searchQ2) return true;
    var q = searchQ2.toLowerCase();
    return ['name','ingredient','effect','type','note'].some(function(k){ return it[k]&&String(it[k]).toLowerCase().indexOf(q)!==-1; });
  });

  
  var groups = {};
  filtered.forEach(function(it){
    var t = it.type||'기타'; if(!groups[t]) groups[t]=[];
    groups[t].push(it);
  });

  var typeOrder = ['미량요소','복합비료','질소질비료','칼리질비료','인산질비료','석회·토양개량','퇴비·유기질','기타'];
  h += '<div>';
  (typeOrder.concat(Object.keys(groups).filter(function(t){ return typeOrder.indexOf(t)===-1; }))).forEach(function(type){
    var items = groups[type]; if (!items || !items.length) return;
    h += '<div style="font-size:11px;font-weight:600;color:var(--gray-500);padding:8px 4px 4px;border-top:1px solid var(--gray-200);">'+esc(type)+' ('+items.length+')</div>';
    items.forEach(function(it){
      var isUser = it._src==='user';
      h += buildFertItemCard(it, isUser);
    });
  });
  h += '</div>';

  
  h += '<div style="margin-top:12px;display:flex;gap:6px;">'
     + '<button onclick="openAiImportModal()" style="flex:1;padding:10px;background:var(--blue-dark);color:#fff;border-radius:8px;border:none;font-size:13px;cursor:pointer;">🤖 AI 분석 등록</button>'
     + '<button onclick="openFertRegisterModal()" style="flex:2;padding:10px;background:var(--green-dark);color:#fff;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;">+ 직접 등록</button>'
     + '</div>';

  h += '</div>';
  container.innerHTML = h;
}

function buildFertUsageCard(item, matchedCrops, highlight) {
  var h = '<div style="border:1px solid '+(highlight?'var(--green-mid)':'var(--gray-200)')+';background:'+(highlight?'#fff':'var(--card)')+';border-radius:8px;margin-bottom:6px;overflow:hidden;">'
    + '<div style="display:flex;align-items:center;gap:8px;padding:8px 10px;cursor:pointer;" onclick="this.nextElementSibling.style.display=this.nextElementSibling.style.display===\'none\'?\'block\':\'none\'">'
    + '<span style="font-size:13px;font-weight:600;color:var(--green-dark);">🌱 '+esc(item.name||'')+'</span>'
    + '<span style="font-size:11px;background:var(--green-light);color:var(--green-dark);padding:1px 7px;border-radius:8px;">'+esc(item.type||'')+'</span>'
    + '<span style="font-size:11px;color:var(--gray-400);margin-left:auto;">'+matchedCrops.length+'종 ▼</span>'
    + '</div>'
    + '<div style="display:none;padding:0 8px 8px;">';

  matchedCrops.forEach(function(crop){
    var entries = item.cropUsage[crop];
    h += '<div style="font-size:12px;font-weight:500;color:var(--gray-700);padding:4px 4px 2px;">🌿 '+esc(crop)+'</div>';
    h += '<table style="width:100%;border-collapse:collapse;font-size:11px;margin-bottom:6px;">'
       + '<thead><tr style="background:var(--green-dark);">'
       + '<th style="padding:3px 5px;color:#fff;text-align:left;">효과/대상</th>'
       + '<th style="padding:3px 5px;color:#fff;text-align:left;">사용방법</th>'
       + '<th style="padding:3px 5px;color:#fff;text-align:center;">사용량</th>'
       + '<th style="padding:3px 5px;color:#fff;text-align:center;">시기</th>'
       + '</tr></thead><tbody>';
    (entries||[]).forEach(function(e,i){
      h += '<tr style="'+(i%2?'background:var(--gray-50);':'')+'border-bottom:0.5px solid var(--gray-100);">'
         + '<td style="padding:3px 5px;">'+esc(e.target||e.dis||'')+'</td>'
         + '<td style="padding:3px 5px;">'+esc(e.method||'')+'</td>'
         + '<td style="padding:3px 5px;text-align:center;font-weight:500;">'+esc(e.amount||'')+'</td>'
         + '<td style="padding:3px 5px;text-align:center;color:var(--orange);">'+esc(e.safety||e.times||'')+'</td>'
         + '</tr>';
    });
    h += '</tbody></table>';
  });

  h += '</div></div>';
  return h;
}

function buildFertItemCard(item, isUser) {
  var hasCropData = item.cropUsage && Object.keys(item.cropUsage).length>0;
  var h = '<div style="border:0.5px solid var(--gray-200);border-radius:8px;padding:8px 10px;margin-bottom:5px;'+(isUser?'border-color:var(--green-mid);background:var(--green-light);':'background:var(--card);')+'">'
    + '<div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;">'
    + '<span style="font-size:13px;font-weight:600;">'+esc(item.name||'')+'</span>'
    + (hasCropData?'<span style="font-size:10px;padding:1px 6px;border-radius:8px;background:#E8F5E9;color:var(--green-dark);">작물별정보✓</span>':'')
    + (isUser?'<span style="font-size:10px;padding:1px 6px;border-radius:8px;background:var(--green-light);color:var(--green-dark);">내 등록</span>':'')
    + '</div>'
    + '<div style="font-size:11px;color:var(--gray-500);line-height:1.7;">'
    + (item.ingredient?'<b>성분:</b> '+esc(item.ingredient)+'<br>':'')
    + (item.effect?'<b>효과:</b> '+esc(item.effect)+'<br>':'')
    + (item.method?'<b>방법:</b> '+esc(item.method):'')
    + (item.timing?'<br><b>시기:</b> '+esc(item.timing):'')
    + (item.amount?'<br><b>사용량:</b> '+esc(item.amount):'')
    + (item.note?'<br><b>비고:</b> '+esc(item.note):'')
    + '</div>';

  if (hasCropData) {
    var crops = Object.keys(item.cropUsage);
    h += '<div style="margin-top:5px;"><details style="font-size:11px;">'
       + '<summary style="cursor:pointer;color:var(--green-dark);list-style:none;">🌱 작물별 사용법 ('+crops.length+'종) ▼</summary>'
       + '<div style="margin-top:6px;">';
    crops.forEach(function(crop){
      h += '<div style="font-size:11px;font-weight:500;color:var(--gray-700);margin-top:4px;">· '+esc(crop)+'</div>';
      (item.cropUsage[crop]||[]).forEach(function(e){
        h += '<div style="font-size:11px;color:var(--gray-500);padding-left:10px;line-height:1.6;">'
           + esc(e.target||'')+(e.method?' | '+esc(e.method):'')+(e.amount?' | <b>'+esc(e.amount)+'</b>':'')+(e.safety?' | <span style="color:var(--orange);">'+esc(e.safety)+'</span>':'')+(e.times?' ('+esc(e.times)+')':'')
           + '</div>';
      });
    });
    h += '</div></details></div>';
  }

  if (isUser) {
    h += '<div style="display:flex;gap:5px;margin-top:5px;">'
       + '<button onclick="openDbEdit(this)" data-id="'+esc(item.id||'')+'" data-tab="fert" style="font-size:11px;padding:3px 9px;border-radius:5px;border:1px solid var(--green-mid);background:#fff;cursor:pointer;">✏️ 수정</button>'
       + '<button onclick="deleteDbItemEl(this)" data-id="'+esc(item.id||'')+'" data-tab="fert" style="font-size:11px;padding:3px 9px;border-radius:5px;border:1px solid var(--gray-200);background:#fff;color:var(--red-dark);cursor:pointer;">🗑</button>'
       + '</div>';
  }
  h += '</div>';
  return h;
}

function openFertRegisterModal() {
  var existing = document.getElementById('fert-register-modal');
  if (existing) { existing.classList.remove('hidden'); return; }

  var modal = document.createElement('div');
  modal.className = 'modal-bg'; modal.id = 'fert-register-modal';
  modal.innerHTML =
    '<div class="modal" style="max-height:90vh;overflow-y:auto;">'
    + '<div class="modal-title" style="font-size:14px;">🌱 비료·영양제 등록</div>'
    + '<div style="display:flex;gap:0;border-bottom:2px solid var(--gray-200);margin-bottom:14px;">'
    + '<button class="reg-tab-btn on" id="ftab-scan"   onclick="_switchFertTab(\'scan\')"  >📷 사진 스캔</button>'
    + '<button class="reg-tab-btn"    id="ftab-csv"    onclick="_switchFertTab(\'csv\')"   >📄 CSV 파일</button>'
    + '<button class="reg-tab-btn"    id="ftab-manual" onclick="_switchFertTab(\'manual\')">✏️ 직접입력</button>'
    + '</div>'

    
    + '<div id="fpanel-scan" class="reg-tab-panel">'
    + '<div style="font-size:12px;color:var(--gray-500);margin-bottom:10px;">포장지를 촬영해서 사용법을 자동으로 불러옵니다.</div>'
    + '<div style="background:var(--green-light);border:1px solid var(--green-mid);border-radius:8px;padding:14px;text-align:center;">'
    + '<div style="font-size:30px;margin-bottom:6px;">📷</div>'
    + '<div style="font-size:13px;font-weight:500;color:var(--green-dark);margin-bottom:6px;">포장지 스캔</div>'
    + '<button onclick="_startFertLabelScan()" style="padding:10px 24px;background:var(--green-dark);color:#fff;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;">📷 카메라 열기</button>'
    + '</div>'
    + '<div id="fert-scan-result" style="margin-top:10px;"></div>'
    + '</div>'

    
    + '<div id="fpanel-csv" class="reg-tab-panel" style="display:none;">'
    + '<div style="font-size:12px;color:var(--gray-500);margin-bottom:8px;">CSV 파일로 여러 비료를 한 번에 등록합니다. 농약 등록과 동일한 CSV 포맷을 사용합니다.</div>'
    + '<details style="margin-bottom:10px;background:var(--gray-50,#F9F8F6);border-radius:8px;padding:8px 10px;">'
    + '<summary style="font-size:12px;font-weight:600;color:var(--gray-600);cursor:pointer;list-style:none;">📋 CSV 포맷 / 템플릿 다운로드</summary>'
    + '<div style="margin-top:6px;font-size:11px;color:var(--gray-600);line-height:1.8;">'
    + '<b>필수:</b> 제품명, 분류, 작물명, 효과/대상, 사용방법, 사용시기, 사용량<br>'
    + '<b>선택:</b> 성분명, 제조사, 브랜드, 메모<br>'
    + '</div>'
    + '<button onclick="downloadFertCsvTemplate()" style="margin-top:6px;padding:5px 12px;border-radius:6px;border:1px solid var(--blue-dark);background:var(--blue-light);color:var(--blue-dark);font-size:11px;cursor:pointer;">⬇️ 비료 템플릿 다운로드</button>'
    + '</details>'
    + '<div style="border:2px dashed var(--gray-200);border-radius:10px;padding:20px;text-align:center;margin-bottom:10px;" id="fert-csv-drop">'
    + '<div style="font-size:28px;margin-bottom:6px;">📄</div>'
    + '<input type="file" id="fert-csv-input" accept=".csv,.txt" style="display:none;" onchange="handleFertCsvFile(this.files[0])">'
    + '<button onclick="document.getElementById(\'fert-csv-input\').click()" style="padding:8px 20px;background:var(--blue-dark);color:#fff;border-radius:7px;border:none;font-size:13px;cursor:pointer;">파일 선택</button>'
    + '</div>'
    + '<div id="fert-csv-preview"></div>'
    + '</div>'

    
    + '<div id="fpanel-manual" class="reg-tab-panel" style="display:none;">'
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
    + _rInp('제품명 *','fp-name','text','예: 튼튼한 칼슘제')
    + _fSel('분류 *','fp-type')
    + _rInp('성분명','fp-ingredient','text','예: 유기칼슘 100%')
    + _rInp('제조사/브랜드','fp-mfr','text','예: 청년농부의')
    + _rInp('사용량/희석배수','fp-amount','text','예: 1,000배 희석')
    + _rInp('아이콘','fp-icon','text','🌱')
    + '</div>'
    + '<div style="margin-bottom:8px;"><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:3px;">효과</label>'
    + '<textarea id="fp-effect" style="width:100%;padding:7px;border:1px solid var(--gray-200);border-radius:6px;font-size:13px;height:50px;" placeholder="예: 칼슘 결핍 예방, 당도·저장성 향상"></textarea></div>'
    + '<div style="margin-bottom:10px;"><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:3px;">메모</label>'
    + '<textarea id="fp-memo" style="width:100%;padding:7px;border:1px solid var(--gray-200);border-radius:6px;font-size:13px;height:45px;"></textarea></div>'
    + '<div style="font-size:12px;font-weight:600;color:var(--gray-600);margin-bottom:6px;">작물별 사용법 (선택)</div>'
    + '<div id="fert-crop-rows"></div>'
    + '<button onclick="_addFertCropRow()" style="width:100%;padding:7px;border:1px dashed var(--gray-300);background:#fff;border-radius:6px;font-size:12px;color:var(--gray-500);cursor:pointer;margin-bottom:10px;">+ 작물 행 추가</button>'
    + '<div class="modal-btns">'
    + '<button class="btn-secondary" onclick="closeModal(\'fert-register-modal\')">취소</button>'
    + '<button class="btn-primary" onclick="submitFertRegister()">등록</button>'
    + '</div></div>'
    + '</div>';

  document.body.appendChild(modal);
  var sel = modal.querySelector('#fp-type');
  if (sel) ['미량요소','복합비료','질소질비료','칼리질비료','인산질비료','석회·토양개량','퇴비·유기질','영양제·생장조정제','기타'].forEach(function(t){
    var o=document.createElement('option'); o.value=t; o.textContent=t; sel.appendChild(o);
  });
  
  var zone = modal.querySelector('#fert-csv-drop');
  if (zone) {
    zone.addEventListener('dragover',function(e){e.preventDefault();zone.style.borderColor='var(--blue-dark)';});
    zone.addEventListener('dragleave',function(){zone.style.borderColor='var(--gray-200)';});
    zone.addEventListener('drop',function(e){e.preventDefault();zone.style.borderColor='var(--gray-200)';if(e.dataTransfer.files[0])handleFertCsvFile(e.dataTransfer.files[0]);});
  }
}

function _fSel(label,id){
  return '<div><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:2px;">'+label+'</label>'
    +'<select id="'+id+'" style="width:100%;padding:7px;border:1px solid var(--gray-200);border-radius:6px;font-size:13px;"></select></div>';
}

function _switchFertTab(name){
  ['scan','csv','manual'].forEach(function(n){
    var btn=document.getElementById('ftab-'+n); var pnl=document.getElementById('fpanel-'+n);
    if(btn) btn.classList.toggle('on', n===name);
    if(pnl) pnl.style.display = n===name?'':'none';
  });
}

function _addFertCropRow(){
  var container = document.getElementById('fert-crop-rows');
  if (!container) return;
  var idx = container.children.length;
  var row = document.createElement('div');
  row.style.cssText='display:grid;grid-template-columns:1.5fr 2fr 1.5fr 1.5fr auto;gap:5px;margin-bottom:5px;align-items:end;';
  row.innerHTML=
    _rGv('작물명','fc-crop-'+idx,'예: 블루베리')+
    _rGv('효과/대상','fc-target-'+idx,'예: 칼슘 결핍 예방')+
    _rGv('사용량','fc-amount-'+idx,'1,000배')+
    _rGv('사용시기','fc-safety-'+idx,'수확 전')+
    '<div><button onclick="this.parentElement.parentElement.remove()" style="padding:7px;border:1px solid var(--gray-200);background:#fff;border-radius:6px;color:var(--red-dark);cursor:pointer;font-size:13px;">🗑</button></div>';
  container.appendChild(row);
}

function _startFertLabelScan(){
  closeModal('fert-register-modal');
  openScanModal();
  setScanMode('ocr', document.getElementById('smt-ocr'));
  window._scanForFertilizer = true;
  showToast('📷 촬영 후 분석하면 비료 등록 화면으로 연결됩니다');
}

function handleFertCsvFile(file) {
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e){
    var text = e.target.result;
    if (text.charCodeAt(0)===0xFEFF) text=text.slice(1);
    var parsed = parsePesticideCsv(text);  
    renderFertCsvPreview(parsed);
  };
  reader.readAsText(file,'UTF-8');
}

function renderFertCsvPreview(parsed) {
  var preview = document.getElementById('fert-csv-preview');
  if (!preview) return;
  var keys = Object.keys(parsed.grouped||{});
  if (!keys.length){ preview.innerHTML='<div style="color:var(--red-dark);padding:8px;">유효한 데이터가 없습니다.</div>'; return; }
  var h = '<div style="font-size:12px;font-weight:600;margin-bottom:6px;">미리보기 — '+keys.length+'개 제품</div>';
  keys.forEach(function(nm){
    var p=parsed.grouped[nm]; var cc=Object.keys(p.cropUsage).length;
    h+='<div style="border:1px solid var(--gray-200);border-radius:7px;padding:7px 10px;margin-bottom:5px;">'
      +'<b style="font-size:13px;">'+esc(nm)+'</b>'
      +(p.type?'<span style="font-size:10px;margin-left:6px;padding:1px 6px;border-radius:8px;background:var(--gray-100);">'+esc(p.type)+'</span>':'')
      +'<div style="font-size:11px;color:var(--gray-500);margin-top:3px;">'+(p.ingredient||'')+'</div>'
      +(cc?'<div style="font-size:11px;color:var(--green-dark);">작물 '+cc+'종</div>':'')
      +'</div>';
  });
  h += '<div style="display:flex;gap:8px;margin-top:8px;">'
     +'<button class="btn-secondary" onclick="document.getElementById(\'fert-csv-preview\').innerHTML=\'\'" style="flex:1;">다시 선택</button>'
     +'<button class="btn-primary" onclick="importFertCsvData()" style="flex:2;">✅ 가져오기 ('+keys.length+'개)</button>'
     +'</div>';
  preview.innerHTML = h;
  preview._csvParsed = parsed;
}

async function importFertCsvData() {
  var preview = document.getElementById('fert-csv-preview');
  if (!preview||!preview._csvParsed) return;
  var grouped = preview._csvParsed.grouped;
  var keys = Object.keys(grouped);
  for (var i=0;i<keys.length;i++){
    var nm=keys[i]; var p=grouped[nm];
    var data={name:nm, type:p.type||'미량요소', ingredient:p.ingredient||'', manufacturer:p.manufacturer||'', note:p.memo||'', icon:'🌱', tab:'fert'};
    if (Object.keys(p.cropUsage).length>0) data.cropUsage=p.cropUsage;
    await saveToUserDb('fert', data);
  }
  closeModal('fert-register-modal');
  setDbTab('fert', document.getElementById('dbt-fert'));
  showToast('✅ '+keys.length+'개 비료 등록 완료');
}

function downloadFertCsvTemplate(){
  var header='제품명,분류,성분명,제조사,브랜드,사용량,작물명,효과/대상,사용방법,사용시기,횟수,메모';
  var ex='튼튼한칼슘제,미량요소,유기칼슘 100%,농대나온남자,청년농부의,1000배,블루베리,칼슘 결핍 예방,엽면시비,10~14일 간격,결핍시,쿠팡구매';
  var bom='\uFEFF';
  var blob=new Blob([bom+[header,ex].join('\n')],{type:'text/csv;charset=utf-8'});
  var url=URL.createObjectURL(blob); var a=document.createElement('a');
  a.href=url; a.download='비료_영양제_템플릿.csv'; a.click(); URL.revokeObjectURL(url);
  showToast('📄 비료 템플릿 다운로드됨');
}

async function submitFertRegister(){
  var name=(document.getElementById('fp-name')||{}).value||'';
  if(!name.trim()){showToast('제품명을 입력하세요');return;}
  var data={
    name:name.trim(), type:(document.getElementById('fp-type')||{}).value||'미량요소',
    ingredient:(document.getElementById('fp-ingredient')||{}).value||'',
    manufacturer:(document.getElementById('fp-mfr')||{}).value||'',
    effect:(document.getElementById('fp-effect')||{}).value||'',
    amount:(document.getElementById('fp-amount')||{}).value||'',
    note:(document.getElementById('fp-memo')||{}).value||'',
    icon:(document.getElementById('fp-icon')||{}).value||'🌱',
    tab:'fert'
  };
  var cropUsage={};
  document.querySelectorAll('#fert-crop-rows > div').forEach(function(row,idx){
    var crop=(row.querySelector('[id^="fc-crop-"]')||{}).value||'';
    if(crop){
      if(!cropUsage[crop]) cropUsage[crop]=[];
      cropUsage[crop].push({
        target:(row.querySelector('[id^="fc-target-"]')||{}).value||'',
        method:'', amount:(row.querySelector('[id^="fc-amount-"]')||{}).value||'',
        safety:(row.querySelector('[id^="fc-safety-"]')||{}).value||'', times:''
      });
    }
  });
  if(Object.keys(cropUsage).length>0) data.cropUsage=cropUsage;
  await saveToUserDb('fert', data);
  closeModal('fert-register-modal');
  setDbTab('fert', document.getElementById('dbt-fert'));
  showToast('✅ '+data.name+' 등록 완료');
}

async function saveToUserDb(tab, data){
  data.createdAt=new Date().toISOString();
  var r = await _gasPost(Object.assign({ action:'addUserDb', tab:tab }, data));
  if(r&&r.id) data.id = r.id;
  await loadUserDb();
}

if (window._scanForFertilizer) {
  window._scanForFertilizer = false;
}

function _linkScanResultToFertReg(parsed) {
  closeModal('scan-modal');
  openFertRegisterModal();
  _switchFertTab('manual');
  setTimeout(function(){
    var nm=document.getElementById('fp-name'); if(nm) nm.value=parsed.name||'';
    var ig=document.getElementById('fp-ingredient'); if(ig) ig.value=parsed.ingredient||'';
    var ef=document.getElementById('fp-effect'); if(ef) ef.value=parsed.target||'';
    showToast('📷 제품 정보를 확인하고 작물별 사용법을 추가해 주세요');
  }, 200);
}

function onDbSearch() {
  var tab = APP.dbTab || 'pest';
  if (tab === 'mypest')                     renderMyPestPanel();
  else if (tab === 'fert' || tab === 'nutr') renderFertPanel(tab);
  else if (tab === 'micro')                  renderMicroPanel();
  else                                        renderDb();
}

function renderMicroPanel() {
  var container = document.getElementById('db-list');
  if (!container) return;

  var microbes = (MASTER_DB.microbes || []);
  var q = ((document.getElementById('db-search')||{}).value||'').toLowerCase();

  var items = q ? microbes.filter(function(m){
    return (m.name+m.type+(m.effect||[]).join('')+(m.aka||'')).toLowerCase().includes(q);
  }) : microbes;

  var cnt = document.getElementById('db-count');
  if (cnt) cnt.textContent = items.length + '개 항목 (센터무료 4종 + 상업구매 3종)';

  if (!items.length) {
    container.innerHTML = '<div class="empty-state"><span class="emoji">🔍</span><p>검색 결과 없음</p></div>';
    return;
  }

  var _fb=(APP&&APP.plants)?APP.plants.filter(function(p){return !p._local&&p.status!=='deleted';}):(window._allPlants||[]);
  var _seen2={};var _fbUniq=_fb.filter(function(p){var n=(p.name||'').trim();if(!n||_seen2[n])return false;_seen2[n]=true;return true;});

  var h = '<div style="padding-bottom:60px;">';

    // ═══════════════════════════════════════════════════════

  // ══ 기존 방제계획 ══

  
  h += '<div style="background:linear-gradient(135deg,#E8F5E9,#F1F8E9);border:1.5px solid #A5D6A7;'
     + 'border-radius:12px;padding:12px 14px;margin-bottom:14px;">'
     + '<div style="font-size:13px;font-weight:700;color:#2E7D32;margin-bottom:6px;">🏛 안산 농업기술센터 유용미생물 안내</div>'
     + '<div style="font-size:11px;color:#555;line-height:1.9;">'
     + '📍 화성시 농업기술센터 — 고초균·광합성균·유산균·효모균 <b>무료 배부</b><br>'
     + '📋 신청: 농업인 자격 확인 후 수령 (주 1회 방문 수령)<br>'
     + '🧊 수령 후 <b>5℃ 냉장 보관</b>, 직사광선 차단, 가급적 빠른 사용<br>'
     + '💧 사용 기준: 200~500배 희석 / 2주 간격 살포 (과수 기준)'
     + '</div></div>';

  
  var freeMicrobes = items.filter(function(m){ return m.source && m.source.includes('무료'); });
  var buyMicrobes  = items.filter(function(m){ return m.source && m.source.includes('상업'); });

  function renderGroup(title, color, bgColor, borderColor, list) {
    if (!list.length) return '';
    var gh = '<div style="margin-bottom:16px;">'
           + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
           + '<div style="width:4px;height:18px;background:'+color+';border-radius:2px;"></div>'
           + '<span style="font-size:13px;font-weight:700;color:'+color+';">'+title+'</span>'
           + '<span style="font-size:11px;color:#888;">('+list.length+'종)</span>'
           + '</div>';

    list.forEach(function(m) {
      
      var safeBadges = (m.safeMixWith||[]).map(function(s){
        return '<span style="font-size:10px;background:#E8F5E9;color:#2E7D32;border:1px solid #A5D6A7;'
             + 'border-radius:5px;padding:1px 6px;margin-right:3px;">'+esc(s)+'</span>';
      }).join('');

      
      var incBadges = (m.incompatibleWith||[]).map(function(s){
        return '<span style="font-size:10px;background:#FFEBEE;color:#C62828;border:1px solid #EF9A9A;'
             + 'border-radius:5px;padding:1px 6px;margin-right:3px;">'+esc(s)+'</span>';
      }).join('');

      
      var effectList = Array.isArray(m.effect) ? m.effect : [m.effect||''];

      
      var commList = (m.commercial||[]).map(function(c){ return '<span style="font-size:10px;color:#1565C0;">'+esc(c)+'</span>'; }).join(' · ');

      gh += '<div style="background:#fff;border:1.5px solid '+borderColor+';border-radius:12px;padding:14px;margin-bottom:10px;">'

         
         + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">'
         + '<span style="font-size:24px;">'+m.emoji+'</span>'
         + '<div style="flex:1;">'
         + '<div style="font-size:13px;font-weight:700;color:var(--gray-800);">'+esc(m.name)+'</div>'
         + '<div style="font-size:10px;color:#888;">'+esc(m.aka||'')+'</div>'
         + '</div>'
         + '<div style="text-align:right;">'
         + '<span style="font-size:10px;padding:2px 8px;border-radius:8px;background:'+bgColor+';color:'+color+';font-weight:600;">'+esc(m.type)+'</span>'
         + '</div></div>'

         
         + '<div style="background:#F9F9F9;border-radius:8px;padding:8px 10px;margin-bottom:8px;">'
         + '<div style="font-size:11px;font-weight:600;color:var(--gray-600);margin-bottom:5px;">✅ 주요 효과</div>'
         + '<ul style="margin:0;padding-left:16px;">'
         + effectList.map(function(e){ return '<li style="font-size:11px;color:#444;line-height:1.8;">'+esc(e)+'</li>'; }).join('')
         + '</ul></div>'

         
         + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:8px;">'
         + '<div style="background:var(--blue-light);border-radius:7px;padding:7px 9px;">'
         + '<div style="font-size:10px;font-weight:600;color:var(--blue-dark);margin-bottom:2px;">💧 희석배수</div>'
         + '<div style="font-size:11px;color:#333;">'+esc(m.dilution||'')+'</div>'
         + '</div>'
         + '<div style="background:var(--blue-light);border-radius:7px;padding:7px 9px;">'
         + '<div style="font-size:10px;font-weight:600;color:var(--blue-dark);margin-bottom:2px;">🗓 간격·시기</div>'
         + '<div style="font-size:11px;color:#333;">'+esc(m.interval||'')+' / '+esc(m.timing||'')+'</div>'
         + '</div></div>'

         
         + '<div style="background:#FFF8E1;border:1px solid #FFE082;border-radius:7px;padding:7px 10px;margin-bottom:8px;">'
         + '<div style="font-size:10px;font-weight:700;color:#F57F17;margin-bottom:2px;">⏱ 화학농약 살포 후 대기</div>'
         + '<div style="font-size:12px;font-weight:700;color:#E65100;">'+m.waitAfterChem+'일 이상</div>'
         + '<div style="font-size:10px;color:#888;margin-top:1px;">'+esc(m.waitNote||'')+'</div>'
         + '</div>'

         
         + (safeBadges ? '<div style="margin-bottom:6px;"><div style="font-size:10px;font-weight:600;color:#2E7D32;margin-bottom:3px;">🤝 함께 써도 되는 미생물·농약</div>'+safeBadges+'</div>' : '')

         
         + '<div style="margin-bottom:6px;">'
         + '<div style="font-size:10px;font-weight:600;color:#C62828;margin-bottom:3px;">⛔ 혼용 금지 농약</div>'
         + incBadges
         + '</div>'

         
         + '<div style="font-size:10px;color:#888;margin-bottom:6px;">🧊 '+esc(m.storage||'')+'</div>'

         
         + (m.tip ? '<div style="background:#E8F5E9;border-radius:6px;padding:6px 8px;margin-bottom:6px;font-size:11px;color:#1B5E20;">💡 '+esc(m.tip)+'</div>' : '')

         
         + (m.commercial && m.commercial.length ? '<div style="font-size:10px;color:#888;">🏪 시중 제품: '+commList+'</div>' : '')

         + '</div>';
    });

    return gh + '</div>';
  }

  
  h += renderGroup('🏛 농업기술센터 무료 배부 (4종)', '#1B5E20', '#E8F5E9', '#A5D6A7', freeMicrobes);

  
  h += renderGroup('🏪 상업 구매 미생물 (3종)', '#1565C0', '#E3F2FD', '#90CAF9', buyMicrobes);

  
  h += '<div style="background:#FFEBEE;border:1.5px solid #EF9A9A;border-radius:12px;padding:14px;margin-bottom:14px;">'
     + '<div style="font-size:13px;font-weight:700;color:#C62828;margin-bottom:10px;">⛔ 미생물과 절대 혼용 금지 농약 통합표</div>'
     + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
     + '<thead><tr style="background:#C62828;color:#fff;">'
     + '<th style="padding:5px 7px;text-align:left;">미생물</th>'
     + '<th style="padding:5px 7px;text-align:left;">혼용 금지 농약</th>'
     + '<th style="padding:5px 7px;text-align:center;">대기</th>'
     + '</tr></thead><tbody>';

  items.forEach(function(m, i) {
    h += '<tr style="'+(i%2?'background:#FFF5F5;':'')+'">'
       + '<td style="padding:5px 7px;font-weight:600;white-space:nowrap;">'+m.emoji+' '+esc(m.name.split(' ')[0])+'</td>'
       + '<td style="padding:5px 7px;font-size:10px;color:#C62828;">'+esc((m.incompatibleWith||[]).join(', '))+'</td>'
       + '<td style="padding:5px 7px;text-align:center;font-weight:700;color:#E65100;">'+m.waitAfterChem+'일</td>'
       + '</tr>';
  });
  h += '</tbody></table></div>';

  
  h += '<div style="background:#E8F5E9;border:1.5px solid #A5D6A7;border-radius:12px;padding:14px;">'
     + '<div style="font-size:13px;font-weight:700;color:#2E7D32;margin-bottom:10px;">✅ 권장 사용 순서 (과수원 기준)</div>'
     + '<div style="position:relative;padding-left:20px;">';

  var steps = [
    {icon:'🌱', title:'정식 전', desc:'트리코더마 → 토양 혼화 처리 (화학살균제와 완전 분리)'},
    {icon:'🌿', title:'생육 초기 (2~3월)', desc:'광합성균 + 고초균 혼합 → 200배 희석 관주 (2주 간격)'},
    {icon:'💊', title:'화학농약 살포 (필요 시)', desc:'행운·스트레이트 등 경엽 처리'},
    {icon:'⏱', title:'3~7일 대기', desc:'화학농약 분해 후 미생물 살포'},
    {icon:'🥛', title:'미생물 재살포', desc:'유산균+효모균 혼합 → 토양 관주 (땅심 회복)'},
    {icon:'☀️', title:'개화·착과기', desc:'광합성균 단독 → 엽면 살포 (당도·착색 향상)'},
    {icon:'🪱', title:'해충 발생 초기', desc:'곤충병원성선충 → 저녁에 토양 관주 (토양살충제 14일 후)'},
  ];

  steps.forEach(function(s, i) {
    h += '<div style="display:flex;gap:10px;margin-bottom:8px;">'
       + '<div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;">'
       + '<div style="width:28px;height:28px;border-radius:50%;background:var(--green-dark);color:#fff;font-size:14px;display:flex;align-items:center;justify-content:center;">'+s.icon+'</div>'
       + (i<steps.length-1?'<div style="width:2px;flex:1;background:#A5D6A7;margin:2px 0;min-height:12px;"></div>':'')
       + '</div>'
       + '<div style="padding-top:4px;">'
       + '<div style="font-size:11px;font-weight:700;color:var(--green-dark);">'+esc(s.title)+'</div>'
       + '<div style="font-size:11px;color:#555;line-height:1.6;">'+esc(s.desc)+'</div>'
       + '</div></div>';
  });

  h += '</div></div>';
  h += '</div>';
  container.innerHTML = h;
}

function buildMicroCard(item, highlight) {
  var isUser = item._src === 'user';
  var border = highlight ? 'border-color:var(--green-mid);background:var(--green-light);' : 'border-color:var(--gray-200);background:var(--card);';
  var h = '<div style="border:1px solid;'+border+'border-radius:8px;padding:9px 11px;margin-bottom:5px;">'
    + '<div style="display:flex;align-items:center;gap:7px;margin-bottom:3px;">'
    + '<span style="font-size:15px;">'+(item.emoji||'🧫')+'</span>'
    + '<span style="font-size:13px;font-weight:600;">'+esc(item.name||'')+'</span>'
    + (item.type ? '<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:#E0F2F1;color:#00695C;">'+esc(item.type)+'</span>' : '')
    + (isUser ? '<span style="font-size:10px;padding:1px 7px;border-radius:8px;background:var(--green-light);color:var(--green-dark);">내 등록</span>' : '')
    + '</div>'
    + '<div style="font-size:11px;color:var(--gray-500);line-height:1.75;">'
    + (item.ingredient ? '<b>성분:</b> '+esc(item.ingredient)+'<br>' : '')
    + (item.effect ? '<b>효과:</b> '+esc(item.effect)+'<br>' : '')
    + (item.target ? '<b>대상:</b> '+esc(item.target)+'<br>' : '')
    + (item.method ? '<b>방법:</b> '+esc(item.method) : '')
    + (item.amount ? '<br><b>사용량:</b> '+esc(item.amount) : '')
    + (item.timing ? '<br><b>시기:</b> '+esc(item.timing) : '')
    + (item.note   ? '<br><b>비고:</b> '+esc(item.note) : '')
    + '</div>';
  if (isUser) {
    h += '<div style="display:flex;gap:5px;margin-top:5px;">'
       + '<button onclick="openDbEdit(this)" data-id="'+esc(item.id||'')+'" data-tab="micro" style="font-size:11px;padding:3px 9px;border-radius:5px;border:1px solid var(--green-mid);background:#fff;cursor:pointer;">✏️ 수정</button>'
       + '<button onclick="deleteDbItemEl(this)" data-id="'+esc(item.id||'')+'" data-tab="micro" style="font-size:11px;padding:3px 9px;border-radius:5px;border:1px solid var(--gray-200);background:#fff;color:var(--red-dark);cursor:pointer;">🗑</button>'
       + '</div>';
  }
  h += '</div>';
  return h;
}

function openAiImportModal() {
  var existing = document.getElementById('ai-import-modal');
  if (existing) { existing.classList.remove('hidden'); return; }

  var modal = document.createElement('div');
  modal.className = 'modal-bg'; modal.id = 'ai-import-modal';
  modal.innerHTML =
    '<div class="modal" style="max-height:92vh;overflow-y:auto;">'
    + '<div class="modal-title" style="font-size:14px;">🤖 AI 농약 정보 분석 · 자동 등록</div>'

    
    + '<div style="display:flex;gap:0;border-bottom:2px solid var(--gray-200);margin-bottom:14px;">'
    + '<button class="reg-tab-btn on" id="aitab-text" onclick="_switchAiTab(\'text\')">📋 텍스트 붙여넣기</button>'
    + '<button class="reg-tab-btn"    id="aitab-psis" onclick="_switchAiTab(\'psis\')">🔗 PSIS 연동</button>'
    + '</div>'

    
    + '<div id="aipanel-text">'
    + '<div style="font-size:12px;color:var(--gray-500);margin-bottom:8px;">'
    + '농약 포장지 뒷면, 제품 사이트의 적용 표를 <b>복사해서 붙여넣기</b>하면 AI가 자동으로 분석해 등록합니다.'
    + '</div>'

    
    + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
    + '<div><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:2px;">제품명 *</label>'
    + '<input id="ai-pname" type="text" placeholder="예: 벨리스" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:6px;font-size:13px;box-sizing:border-box;"></div>'
    + '<div><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:2px;">분류</label>'
    + '<select id="ai-ptype" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:6px;font-size:13px;">'
    + '<option value="살균제">살균제</option><option value="살충제">살충제</option>'
    + '<option value="살균살충제">살균살충제</option><option value="제초제">제초제</option>'
    + '<option value="미량요소">미량요소(비료)</option><option value="영양제">영양제</option>'
    + '</select></div></div>'

    
    + '<div style="margin-bottom:8px;">'
    + '<label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:3px;">적용 정보 텍스트 붙여넣기</label>'
    + '<textarea id="ai-rawtext" style="width:100%;height:160px;padding:8px;border:1px solid var(--gray-200);border-radius:6px;font-size:12px;font-family:monospace;line-height:1.6;box-sizing:border-box;" '
    + 'placeholder="사이트에서 적용 대상 표를 복사(Ctrl+A → Ctrl+C)해서 여기에 붙여넣으세요.\n\n예시:\n작물명 | 적용대상 | 사용방법 | 희석배수 | 안전사용기준\n딸기 | 잿빛곰팡이병 | 발병초기 경엽처리 | 2,000배 | 수확 1일전 3회\n고추 | 탄저병 | 발병초기 경엽처리 | 2,000배 | 수확 2일전 3회\n..."></textarea>'
    + '</div>'

    
    + '<button onclick="runAiParse()" id="ai-parse-btn" style="width:100%;padding:10px;background:var(--green-dark);color:#fff;border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;margin-bottom:10px;">'
    + '🤖 AI 분석 시작</button>'

    
    + '<div id="ai-parse-result"></div>'
    + '</div>'

    
    + '<div id="aipanel-psis" style="display:none;">'
    + '<div style="font-size:12px;color:var(--gray-500);margin-bottom:10px;">'
    + '농촌진흥청 농약안전정보시스템(PSIS)에서 공식 등록 데이터를 조회합니다.<br>'
    + 'API 키가 없어도 <b>외부 링크로 연결</b>해서 정보를 확인할 수 있습니다.'
    + '</div>'
    + '<div style="display:grid;grid-template-columns:1fr auto;gap:6px;margin-bottom:10px;">'
    + '<input id="psis-name" type="text" placeholder="농약 상표명 입력 (예: 벨리스)" style="padding:9px 12px;border:1px solid var(--gray-200);border-radius:7px;font-size:13px;">'
    + '<button onclick="openPsisSearch()" style="padding:9px 16px;background:var(--blue-dark);color:#fff;border-radius:7px;border:none;font-size:13px;cursor:pointer;">🔍 검색</button>'
    + '</div>'
    + '<div style="background:var(--blue-light);border-radius:8px;padding:12px;font-size:12px;line-height:1.8;color:var(--blue-dark);">'
    + '<b>PSIS 활용 방법</b><br>'
    + '① 위 검색 버튼 클릭 → 외부 PSIS 사이트가 새 탭으로 열림<br>'
    + '② 적용 대상 표를 전체 선택(Ctrl+A) 후 복사(Ctrl+C)<br>'
    + '③ "텍스트 붙여넣기" 탭에서 붙여넣기 → AI 분석<br><br>'
    + '<b>또는 PSIS API 키가 있으면:</b><br>'
    + '<input id="psis-apikey" type="text" placeholder="PSIS API 키 입력 (선택사항)" style="width:100%;margin-top:4px;padding:7px;border:1px solid var(--gray-200);border-radius:6px;font-size:12px;box-sizing:border-box;">'
    + '<button onclick="queryPsisApi()" style="margin-top:6px;width:100%;padding:7px;background:var(--green-dark);color:#fff;border-radius:6px;border:none;font-size:12px;cursor:pointer;">API로 직접 조회</button>'
    + '</div>'
    + '<div id="psis-api-result" style="margin-top:10px;"></div>'
    + '</div>'

    + '<div class="modal-btns" style="margin-top:10px;">'
    + '<button class="btn-secondary" onclick="closeModal(\'ai-import-modal\')">닫기</button>'
    + '</div>'
    + '</div>';

  document.body.appendChild(modal);
}

function _switchAiTab(name) {
  ['text','psis'].forEach(function(n){
    var btn=document.getElementById('aitab-'+n); var pnl=document.getElementById('aipanel-'+n);
    if(btn) btn.classList.toggle('on', n===name);
    if(pnl) pnl.style.display = n===name?'':'none';
  });
}

function openPsisSearch() {
  var name = (document.getElementById('psis-name')||{}).value||'';
  if (!name) { showToast('농약 이름을 입력하세요'); return; }
  var enc = encodeURIComponent(name);
  window.open('https://psis.rda.go.kr/psis/agc/res/agchmRegistStusLst.ps?menuId=PS00263&brandName='+enc, '_blank');
  showToast('🔗 PSIS 사이트에서 적용 표를 복사 후 텍스트 탭에 붙여넣으세요');
  _switchAiTab('text');
}

async function queryPsisApi() {
  var name   = (document.getElementById('psis-name')||{}).value||'';
  var apiKey = (document.getElementById('psis-apikey')||{}).value||'';
  var out    = document.getElementById('psis-api-result');
  if (!name)   { showToast('농약 이름을 입력하세요'); return; }
  if (!apiKey) { showToast('API 키를 입력하세요. PSIS 사이트에서 신청 가능합니다.'); return; }
  if (out) out.innerHTML = '<div style="padding:8px;color:var(--gray-400);">조회 중...</div>';
  try {
    var url = 'https://psis.rda.go.kr/psis/api/pestiInfo/selectPesticideUseInfo.do'
            + '?apiKey='+encodeURIComponent(apiKey)+'&pestiBrandName='+encodeURIComponent(name)+'&returnType=json';
    var res = await fetch(url);
    var data = await res.json();
    if (data && data.length) {
      
      var cropUsage = {};
      data.forEach(function(row){
        var crop = row.cropName||row.crpName||row.작물명||'';
        if (!crop) return;
        if (!cropUsage[crop]) cropUsage[crop]=[];
        cropUsage[crop].push({
          target: row.pestName||row.병해충명||row.useDis||'',
          method: row.useMethod||row.사용방법||'',
          amount: row.dilutionRate||row.희석배수||'',
          safety: row.safetyPrd||row.안전사용시기||'',
          times:  row.safetyTimes||row.횟수||''
        });
      });
      
      window._psisDirectData = {name:name, cropUsage:cropUsage};
      if (out) out.innerHTML = '<div style="padding:8px;color:var(--green-dark);">✅ '+Object.keys(cropUsage).length+'개 작물 조회 완료</div>';
      _renderAiConfirm(name, null, cropUsage);
      _switchAiTab('text');
    } else {
      if (out) out.innerHTML = '<div style="padding:8px;color:var(--red-dark);">조회 결과가 없습니다. 상표명을 확인하세요.</div>';
    }
  } catch(e) {
    if (out) out.innerHTML = '<div style="padding:8px;color:var(--red-dark);">API 오류: '+esc(e.message)+'</div>';
  }
}

async function runAiParse() {
  var name    = (document.getElementById('ai-pname')||{}).value||'';
  var type    = (document.getElementById('ai-ptype')||{}).value||'살균제';
  var rawText = (document.getElementById('ai-rawtext')||{}).value||'';
  var btn     = document.getElementById('ai-parse-btn');
  var out     = document.getElementById('ai-parse-result');

  if (!name.trim()) { showToast('제품명을 입력하세요'); return; }
  if (!rawText.trim()) { showToast('분석할 텍스트를 붙여넣으세요'); return; }

  if (btn) { btn.disabled=true; btn.textContent='🤖 AI 분석 중...'; }
  if (out) out.innerHTML = '<div style="padding:12px;text-align:center;color:var(--gray-400);">AI가 분석 중입니다...</div>';

  try {
    var parsed = await runAiParseFromText(name, type, rawText);
    if (parsed) {
      _renderAiConfirm(parsed.name||name, parsed, parsed.cropUsage||{});
    } else {
      if (out) out.innerHTML = '<div style="padding:10px;color:var(--red-dark);">⚠️ 분석 실패. Claude API 키가 설정되어 있는지 확인하세요.<br><small>설정 → Claude API Key</small></div>';
    }
  } catch(e) {
    if (out) out.innerHTML = '<div style="padding:10px;color:var(--red-dark);">⚠️ 오류: '+esc(e.message)+'</div>';
  } finally {
    if (btn) { btn.disabled=false; btn.textContent='🤖 AI 분석 시작'; }
  }
}

function _renderAiConfirm(name, parsed, cropUsage) {
  var out = document.getElementById('ai-parse-result');
  if (!out) return;

  var crops       = Object.keys(cropUsage||{});
  var totalEntries= crops.reduce(function(a,c){return a+(cropUsage[c]||[]).length;},0);
  var moaCode     = parsed && parsed.moa ? parsed.moa : getPesticideMoa(name);
  var moaBadge    = moaCode ? buildMoaBadge(moaCode) : '';
  var statusColor = (parsed && parsed.status==='등록취소') ? '#C62828' : 'var(--green-dark)';
  var statusBg    = (parsed && parsed.status==='등록취소') ? '#FFEBEE' : 'var(--green-light)';
  var statusBorder= (parsed && parsed.status==='등록취소') ? '#EF9A9A' : 'var(--green-mid)';

  var h = '<div style="background:'+statusBg+';border:1.5px solid '+statusBorder+';border-radius:12px;padding:14px;margin-top:10px;">';

  
  h += '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">'
     + '<div>'
     + '<div style="font-size:15px;font-weight:800;color:'+statusColor+';margin-bottom:3px;">'
     + (parsed&&parsed.status==='등록취소'?'⛔ ':'✅ ') + esc(name) + '</div>'
     + '<div style="font-size:11px;color:var(--gray-500);">'
     + esc((parsed&&parsed.type)||'') + (parsed&&parsed.form?' · '+esc(parsed.form):'')
     + '</div></div>'
     + '<div style="text-align:right;">' + moaBadge
     + (parsed&&parsed.source?'<div style="font-size:10px;color:var(--gray-400);margin-top:3px;">'+esc(parsed.source)+'</div>':'')
     + '</div></div>';

  
  if (parsed && parsed.status==='등록취소') {
    h += '<div style="background:#FFEBEE;border:1px solid #EF9A9A;border-radius:8px;padding:8px 10px;margin-bottom:10px;">'
       + '<div style="font-size:12px;font-weight:700;color:#C62828;">⛔ 등록취소 농약</div>'
       + '<div style="font-size:11px;color:#555;margin-top:2px;">취소일: '
       + esc((parsed&&parsed.cancelDate)||'미상')
       + ' — 판매·사용이 금지된 제품입니다</div></div>';
  }

  
  var infoFields = [
    {label:'성분·품목명', val: parsed&&parsed.ingredient},
    {label:'제조사',      val: parsed&&parsed.manufacturer},
    {label:'등록번호',    val: parsed&&parsed.regNo},
    {label:'사용 방법',   val: parsed&&parsed.method},
    {label:'주의사항',    val: parsed&&parsed.warning},
  ].filter(function(f){ return f.val; });

  if (infoFields.length) {
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:10px;">';
    infoFields.forEach(function(f) {
      h += '<div style="background:rgba(255,255,255,0.7);border-radius:7px;padding:6px 8px;">'
         + '<div style="font-size:10px;color:var(--gray-500);margin-bottom:1px;">'+esc(f.label)+'</div>'
         + '<div style="font-size:11px;font-weight:600;color:var(--gray-800);">'+esc(f.val)+'</div>'
         + '</div>';
    });
    h += '</div>';
  }

  
  if (crops.length) {
    h += '<div style="font-size:12px;font-weight:700;color:var(--green-dark);margin-bottom:7px;">'
       + '🌱 적용 작물 ' + crops.length + '종 · 방제 항목 ' + totalEntries + '개'
       + '</div>';

    h += '<div style="max-height:320px;overflow-y:auto;border-radius:8px;border:1px solid var(--gray-200);">'
       + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
       + '<thead style="position:sticky;top:0;z-index:1;">'
       + '<tr style="background:var(--green-dark);color:#fff;">'
       + '<th style="padding:5px 7px;text-align:left;min-width:60px;">작물</th>'
       + '<th style="padding:5px 7px;text-align:left;">방제 대상</th>'
       + '<th style="padding:5px 7px;text-align:center;min-width:55px;">물 20L당</th>'
       + '<th style="padding:5px 7px;text-align:left;">방법</th>'
       + '<th style="padding:5px 7px;text-align:center;min-width:60px;color:#FFD54F;">안전사용</th>'
       + '<th style="padding:5px 7px;text-align:center;">횟수</th>'
       + '</tr></thead><tbody>';

    var rowIdx = 0;
    crops.forEach(function(crop) {
      var entries = cropUsage[crop] || [];
      entries.forEach(function(e, ei) {
        var isFirst  = ei === 0;
        var rowStyle = rowIdx%2===0 ? '' : 'background:var(--gray-50);';
        
        var myPlants = (window._allPlants||[]).map(function(p){return p.name||'';});
        var isMyCrop = myPlants.some(function(n){ return n.includes(crop)||crop.includes(n); });

        h += '<tr style="'+rowStyle+'border-bottom:0.5px solid var(--gray-100);">'
           + '<td style="padding:5px 7px;font-weight:'+(isFirst?'700':'400')+';'
           + (isMyCrop&&isFirst?'color:var(--green-dark);':'color:var(--gray-700);')+';">'
           + (isMyCrop&&isFirst?'⭐ ':isFirst?'':'　')
           + esc(isFirst?crop:'')
           + '</td>'
           + '<td style="padding:5px 7px;color:var(--gray-700);">'+esc(e.target||'')+'</td>'
           + '<td style="padding:5px 7px;text-align:center;font-weight:700;color:var(--blue-dark);">'+esc(e.amount||'')+'</td>'
           + '<td style="padding:5px 7px;color:var(--gray-600);font-size:10px;">'+esc(e.method||'')+'</td>'
           + '<td style="padding:5px 7px;text-align:center;color:#E65100;font-size:10px;">'+esc(e.safety||'')+'</td>'
           + '<td style="padding:5px 7px;text-align:center;color:var(--gray-600);">'+esc(e.times||'')+'</td>'
           + '</tr>';
        rowIdx++;
      });
    });

    h += '</tbody></table></div>';

    
    var myPlantNames = (window._allPlants||[]).map(function(p){return p.name||'';});
    var myMatched    = crops.filter(function(c){
      return myPlantNames.some(function(n){ return n.includes(c)||c.includes(n); });
    });
    if (myMatched.length) {
      h += '<div style="margin-top:6px;padding:6px 8px;background:var(--green-light);border-radius:6px;font-size:11px;color:var(--green-dark);">'
         + '⭐ 내 작물 해당: <b>'+esc(myMatched.join(' · '))+'</b></div>';
    }
  } else {
    h += '<div style="padding:10px;text-align:center;color:var(--gray-400);font-size:12px;">'
       + '작물별 방제 정보가 없습니다.<br>텍스트를 더 추가하거나 PSIS에서 조회하세요.</div>';
  }

  
  h += '<div style="display:flex;gap:6px;margin-top:12px;">'
     + '<button onclick="confirmAiRegister()" id="ai-confirm-btn"'
     + ' style="flex:2;padding:11px;background:var(--green-dark);color:#fff;'
     + 'border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;">'
     + (parsed&&parsed.status==='등록취소'
         ? '⚠️ 취소농약으로 기록 저장'
         : '✅ Google Sheets에 저장')
     + '</button>'
     + '<button onclick="document.getElementById(\'ai-parse-result\').innerHTML=\'\'"'
     + ' style="flex:1;padding:11px;background:#fff;border:1px solid var(--gray-200);'
     + 'border-radius:8px;font-size:12px;cursor:pointer;">🔄 다시</button>'
     + '</div>';

  h += '</div>';
  out.innerHTML = h;

  
  window._aiParsedResult = {name:name, parsed:parsed, cropUsage:cropUsage};
}

async function confirmAiRegister() {
  var res = window._aiParsedResult;
  if (!res) { showToast('분석 결과가 없습니다'); return; }

  var name      = res.name;
  var parsed    = res.parsed || {};
  var cropUsage = res.cropUsage || {};
  var type      = (document.getElementById('ai-ptype')||{}).value || parsed.type || '살균제';

  
  var tab = ['미량요소','영양제','비료'].indexOf(type) !== -1 ? 'fert' : 'pest';

  var data = {
    name:         name,
    type:         type,
    tab:          tab,
    ingredient:   parsed.ingredient   || '',
    manufacturer: parsed.manufacturer || '',
    regNo:        parsed.regNo        || '',
    icon:         tab === 'fert' ? '🌱' : '🌿',
    ocrScanned:   false,
    aiParsed:     true,
  };

  if (tab === 'pest') {
    await registerMyPesticide(data);
    if (Object.keys(cropUsage).length > 0) {
      await updateCropUsageFromScan(name, cropUsage);
    }
  } else {
    if (Object.keys(cropUsage).length > 0) data.cropUsage = cropUsage;
    await saveToUserDb(tab, data);
  }

  closeModal('ai-import-modal');
  
  APP.dbTab = tab;
  var tabBtn = document.getElementById('dbt-'+tab);
  if (tabBtn) {
    document.querySelectorAll('.db-tab').forEach(function(b){ b.classList.remove('on'); });
    tabBtn.classList.add('on');
  }
  if (tab === 'fert') renderFertPanel(tab);
  else renderDb();
  switchTab('db');
  showToast('✅ '+name+' 등록 완료 ('+Object.keys(cropUsage).length+'개 작물 데이터 포함)');
  window._aiParsedResult = null;
}

function handleQrResult(value) {
  var codeInput = document.getElementById('scan-code-input');
  if (codeInput) codeInput.value = value;

  var resultEl = document.getElementById('scan-result');
  if (!resultEl) return;

  
  
  if (value.startsWith('http://') || value.startsWith('https://')) {
    
    resultEl.innerHTML = buildQrProgressUI('init', value);
    
    setTimeout(function(){ processQrUrlAuto(value); }, 100);
    return;
  
  } else if (/^\d{10,15}$/.test(value.replace(/-/g,''))) {
    resultEl.innerHTML =
      '<div style="background:var(--green-light);border:1px solid var(--green-mid);border-radius:8px;padding:10px;margin-top:8px;">'
      + '<div style="font-size:12px;font-weight:600;color:var(--green-dark);">✅ 코드 인식: '+esc(value)+'</div>'
      + '<div style="display:flex;gap:6px;margin-top:8px;">'
      + '<button onclick="lookupScanCode()" style="flex:1;padding:8px;background:var(--green-dark);color:#fff;border-radius:6px;border:none;font-size:12px;cursor:pointer;">🔍 농약 정보 조회</button>'
      + '</div>'
      + '</div>';

  
  } else {
    resultEl.innerHTML =
      '<div style="background:var(--gray-50);border:1px solid var(--gray-200);border-radius:8px;padding:10px;margin-top:8px;">'
      + '<div style="font-size:12px;font-weight:600;margin-bottom:6px;">📋 QR코드 내용</div>'
      + '<div style="font-size:12px;color:var(--gray-700);word-break:break-all;margin-bottom:8px;">'+esc(value)+'</div>'
      + '<div style="display:flex;gap:6px;">'
      + '<button onclick="useQrTextAsProductName(\''+value.replace(/'/g,"\\'")+'\')" '
      + 'style="flex:1;padding:8px;background:var(--green-dark);color:#fff;border-radius:6px;border:none;font-size:12px;cursor:pointer;">📝 제품명으로 사용</button>'
      + '<button onclick="openAiImportFromQrText(\''+value.replace(/'/g,"\\'")+'\')" '
      + 'style="flex:1;padding:8px;background:var(--blue-dark);color:#fff;border-radius:6px;border:none;font-size:12px;cursor:pointer;">🤖 AI 분석</button>'
      + '</div>'
      + '</div>';
  }
}

function openAiImportFromQrUrl(url) {
  closeModal('scan-modal');
  openAiImportModal();
  setTimeout(function(){
    document.getElementById('ai-rawtext').value =
      '[QR코드로 스캔한 URL]\n'+url+'\n\n'
      +'위 URL의 사이트에서 적용 대상 및 사용량 표를 복사하여 아래에 붙여넣으세요.';
    document.getElementById('ai-rawtext').focus();
    showToast('🔗 사이트를 열어 표를 복사한 후 여기에 붙여넣으세요');
  }, 200);
}

function openAiImportFromQrText(text) {
  closeModal('scan-modal');
  openAiImportModal();
  setTimeout(function(){
    document.getElementById('ai-rawtext').value = text;
    document.getElementById('ai-rawtext').focus();
  }, 200);
}

function useQrTextAsProductName(text) {
  closeModal('scan-modal');
  openRegisterPestModal();
  setTimeout(function(){
    var nm = document.getElementById('rp-name');
    if (nm) { nm.value = text.slice(0, 50); nm.focus(); }
  }, 200);
}

function _updateScanFrameStyle() {
  var frame = document.getElementById('scan-frame-el');
  if (!frame) return;
  if (scanMode === 'barcode') {
    
    frame.style.cssText = (frame.style.cssText || '') + ';border-color:var(--green-dark);';
    var hint = document.getElementById('scan-hint');
    if (hint) hint.textContent = 'QR코드를 사각형 안에 맞춰주세요';
  }
}

const IDB_NAME    = 'SaesolFarmDB';
const IDB_VERSION = 1;
const IDB_STORES  = {
  pendingSync: 'pendingSync',   
  pesticideCache: 'pesticideCache', 
};

var _idb = null;

async function openIDB() {
  if (_idb) return _idb;
  return new Promise(function(resolve, reject) {
    var req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = function(e) {
      var db = e.target.result;
      if (!db.objectStoreNames.contains('pendingSync')) {
        var store = db.createObjectStore('pendingSync', {keyPath:'localId', autoIncrement:true});
        store.createIndex('collection', 'collection', {unique:false});
        store.createIndex('createdAt',  'createdAt',  {unique:false});
      }
      if (!db.objectStoreNames.contains('pesticideCache')) {
        db.createObjectStore('pesticideCache', {keyPath:'url'});
      }
    };
    req.onsuccess  = function(e) { _idb = e.target.result; resolve(_idb); };
    req.onerror    = function(e) { reject(e.target.error); };
  });
}

async function idbPut(storeName, data) {
  var db = await openIDB();
  return new Promise(function(resolve, reject) {
    var tx  = db.transaction(storeName, 'readwrite');
    var req = tx.objectStore(storeName).put(data);
    req.onsuccess = function() { resolve(req.result); };
    req.onerror   = function() { reject(req.error); };
  });
}
async function idbGetAll(storeName) {
  var db = await openIDB();
  return new Promise(function(resolve, reject) {
    var tx  = db.transaction(storeName, 'readonly');
    var req = tx.objectStore(storeName).getAll();
    req.onsuccess = function() { resolve(req.result||[]); };
    req.onerror   = function() { reject(req.error); };
  });
}
async function idbDelete(storeName, key) {
  var db = await openIDB();
  return new Promise(function(resolve, reject) {
    var tx  = db.transaction(storeName, 'readwrite');
    var req = tx.objectStore(storeName).delete(key);
    req.onsuccess = function() { resolve(); };
    req.onerror   = function() { reject(req.error); };
  });
}

var _isOnline = navigator.onLine;
var _syncInProgress = false;

function initNetworkMonitor() {
  window.addEventListener('online', function() {
    _isOnline = true;
    updateNetworkUI(true);
    showToast('🌐 인터넷 연결됨 — 오프라인 데이터 동기화 시작');
    syncPendingToFirebase();
  });
  window.addEventListener('offline', function() {
    _isOnline = false;
    updateNetworkUI(false);
    showToast('📵 오프라인 모드 — 데이터는 기기에 임시 저장됩니다');
  });
  updateNetworkUI(_isOnline);
}

function updateNetworkUI(online) {
  var dot = document.getElementById('sync-dot');
  var lbl = document.getElementById('sync-label');
  if (dot) dot.className = 'sync-dot' + (online ? '' : ' offline');
  if (lbl) lbl.textContent = online ? '온라인' : '오프라인';
}

async function smartSave(collection, data) {
  data._localSavedAt = new Date().toISOString();
  try {
    var r = await _gasPost(Object.assign({ action:'addUserDb', tab: collection.replace('userDb_','') }, data));
    data._gsId = r && r.id;
    await idbPut('pesticideCache', Object.assign({url: data._srcUrl||data.name||Date.now()+''}, data));
    return {source:'gas', id: r&&r.id};
  } catch(e) {
    console.warn('GAS 저장 실패, 로컬 대기열로:', e.message);
    data._pendingSync = true;
    var localId = await idbPut('pendingSync', {
      collection: collection, data: data,
      createdAt: data._localSavedAt, retryCount: 0
    });
    updatePendingBadge();
    return {source:'local', localId: localId};
  }
}

async function syncPendingToFirebase() {
  if (_syncInProgress || !_isOnline) return;
  _syncInProgress = true;
  var pending = await idbGetAll('pendingSync');
  if (!pending.length) { _syncInProgress=false; return; }
  showToast('🔄 오프라인 데이터 '+pending.length+'건 동기화 중...');
  var success=0; var fail=0;
  for (var i=0; i<pending.length; i++) {
    var item = pending[i];
    try {
      var dataToSave = Object.assign({}, item.data);
      delete dataToSave._pendingSync;
      var r = await _gasPost(Object.assign({ action:'addUserDb', tab:item.collection.replace('userDb_','') }, dataToSave));
      await idbDelete('pendingSync', item.localId);
      success++;
    } catch(e) {
      item.retryCount = (item.retryCount||0) + 1;
      if (item.retryCount >= 5) { await idbDelete('pendingSync', item.localId); fail++; }
      else { await idbPut('pendingSync', item); }
    }
  }
  _syncInProgress = false;
  updatePendingBadge();
  if (success > 0) {
    showToast('✅ '+success+'건 Google Sheets 동기화 완료'+(fail>0?' (실패:'+fail+'건)':''));
    await loadUserDb(); renderDb();
  }
}

async function updatePendingBadge() {
  var pending = await idbGetAll('pendingSync');
  var badge   = document.getElementById('offline-pending-badge');
  if (!badge) return;
  badge.style.display = pending.length ? '' : 'none';
  badge.textContent   = pending.length + '건 미동기';
}

async function processQrUrlAuto(qrUrl) {
  var modal = document.getElementById('scan-modal');
  var resultEl = document.getElementById('scan-result');

  
  
  function _setQrUI(html2) {
    if (resultEl) resultEl.innerHTML = html2;
    var qrOut = document.getElementById('qr-decode-result');
    if (qrOut) qrOut.innerHTML = html2;
  }

  _setQrUI(buildQrProgressUI('init', qrUrl));
  stopScan();
  _setQrUI(buildQrProgressUI('fetching', qrUrl));

  
  var siteText = await tryFetchSiteText(qrUrl);

  _setQrUI(buildQrProgressUI('analyzing', qrUrl));

  
  var parsed = await runAiParseFromUrl(qrUrl, siteText);

  if (!parsed || !parsed.name) {
    
    _setQrUI(buildQrManualFallback(qrUrl));
    return;
  }

  
  _setQrUI(buildQrConfirmUI(parsed, qrUrl));
  window._qrParsedData = {parsed, qrUrl};
}

async function tryFetchSiteText(url) {
  
  
  try {
    var ctrl = new AbortController();
    var timer = setTimeout(function(){ ctrl.abort(); }, 4000);
    var res = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      redirect: 'follow',    
      signal: ctrl.signal
    });
    clearTimeout(timer);
    if (res.ok) {
      var text = await res.text();
      return text.replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').slice(0, 8000);
    }
  } catch(e) {
    
  }
  
  return '[QR URL] ' + url;
}

async function runAiParseFromUrl(url, siteText) {
  var prompt =
    '다음 정보를 보고 농약/비료 제품 정보를 JSON으로만 응답하세요. 다른 설명 없이 JSON만 출력하세요.\n\n'
    + 'URL: ' + url + '\n'
    + '텍스트: ' + (siteText||'').slice(0, 5000) + '\n\n'
    + '아래 구조로 출력하세요:\n'
    + '{"name":"제품명","type":"살균제|살충제|살균살충제|제초제|비료 중 하나",'
    + '"ingredient":"유효성분","manufacturer":"제조사","regNo":"등록번호",'
    + '"form":"제형","feature":"특징 요약","warning":"주의사항",'
    + '"cropUsage":{"작물명":[{"target":"방제대상","method":"방법","amount":"사용량","safety":"안전사용시기","times":"횟수"}]}}\n\n'
    + 'URL에서 제품명을 유추하고, 텍스트가 부족해도 최대한 채워주세요.';

  var result = await callClaude(prompt, 3000);
  if (!result.ok) {
    console.warn('AI 파싱 실패:', result.error);
    return null;
  }
  try {
    var t = result.text;
    var s = t.indexOf('{'); var e = t.lastIndexOf('}');
    if (s !== -1 && e !== -1) return JSON.parse(t.slice(s, e+1));
  } catch(err) {
    console.warn('JSON 파싱 실패:', err.message);
  }
  return null;
}

async function runAiParseFromText(productName, productType, rawText) {
  var prompt =
    '농약 "'+productName+'"('+productType+')의 적용 정보입니다.\n'
    + '아래 JSON 구조로만 응답하세요. 다른 말 없이 JSON만 출력하세요.\n\n'
    + '{"name":"'+productName+'","type":"'+productType+'",'
    + '"ingredient":"성분","manufacturer":"제조사","regNo":"등록번호","form":"제형",'
    + '"cropUsage":{"작물명":[{"target":"방제대상","method":"방법","amount":"사용량","safety":"안전사용시기","times":"횟수"}]}}\n\n'
    + '텍스트:\n' + rawText.slice(0, 6000);

  var result = await callClaude(prompt, 4000);
  if (!result.ok) return null;
  try {
    var t = result.text;
    var s = t.indexOf('{'); var e = t.lastIndexOf('}');
    if (s !== -1 && e !== -1) return JSON.parse(t.slice(s, e+1));
  } catch(err) {}
  return null;
}

function buildQrProgressUI(step, url) {
  var steps = {
    init:      {icon:'📱', msg:'QR코드 인식 완료', sub:'사이트 접속 중...', color:'var(--blue-light)'},
    fetching:  {icon:'🌐', msg:'사이트 정보 수집 중', sub:url.slice(0,50)+'...', color:'var(--blue-light)'},
    analyzing: {icon:'🤖', msg:'AI 분석 중', sub:'적용 작물·병해충 정보 추출 중...', color:'var(--green-light)'},
  };
  var s = steps[step] || steps.init;
  return '<div style="background:'+s.color+';border-radius:10px;padding:16px;text-align:center;">'
    + '<div style="font-size:32px;margin-bottom:8px;">'+s.icon+'</div>'
    + '<div style="font-size:14px;font-weight:600;color:var(--gray-700);margin-bottom:4px;">'+s.msg+'</div>'
    + '<div style="font-size:11px;color:var(--gray-500);word-break:break-all;">'+esc(s.sub)+'</div>'
    + '<div style="margin-top:12px;" class="ocr-progress-bar"><div class="ocr-progress-fill" style="width:100%;animation:progress-anim 2s infinite;"></div></div>'
    + '</div>';
}

function buildQrConfirmUI(parsed, qrUrl) {
  var crops = Object.keys(parsed.cropUsage||{});
  var totalEntries = crops.reduce(function(a,c){return a+(parsed.cropUsage[c]||[]).length;},0);

  var h = '<div style="background:var(--green-light);border:1.5px solid var(--green-mid);border-radius:10px;padding:12px;">'
    + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">'
    + '<span style="font-size:22px;">✅</span>'
    + '<div><div style="font-size:14px;font-weight:700;color:var(--green-dark);">'+esc(parsed.name||'')+'</div>'
    + '<div style="font-size:11px;color:var(--gray-500);">'+esc(parsed.type||'')+' · '+esc(parsed.manufacturer||'')+' · '+esc(parsed.ingredient||'').slice(0,40)+'</div></div>'
    + '</div>';

  
  if (crops.length) {
    h += '<div style="font-size:12px;color:var(--blue-dark);margin-bottom:8px;">🌱 '+crops.length+'종 작물 · '+totalEntries+'개 방제항목 추출</div>';
    h += '<div style="max-height:160px;overflow-y:auto;margin-bottom:8px;">'
       + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
       + '<thead><tr style="background:var(--green-dark);">'
       + '<th style="padding:3px 5px;color:#fff;text-align:left;">작물</th>'
       + '<th style="padding:3px 5px;color:#fff;text-align:left;">방제 대상</th>'
       + '<th style="padding:3px 5px;color:#fff;text-align:center;">사용량</th>'
       + '<th style="padding:3px 5px;color:#fff;text-align:center;">안전사용</th>'
       + '</tr></thead><tbody>';
    crops.slice(0,6).forEach(function(crop){
      (parsed.cropUsage[crop]||[]).slice(0,2).forEach(function(e,i){
        h += '<tr style="'+(i%2?'background:var(--gray-50);':'')+'border-bottom:0.5px solid var(--gray-100);">'
           + '<td style="padding:3px 5px;font-weight:500;">'+esc(crop)+'</td>'
           + '<td style="padding:3px 5px;">'+esc(e.target||'')+'</td>'
           + '<td style="padding:3px 5px;text-align:center;">'+esc(e.amount||'')+'</td>'
           + '<td style="padding:3px 5px;text-align:center;color:var(--orange);">'+esc(e.safety||'')+'</td>'
           + '</tr>';
      });
    });
    if (crops.length>6) h += '<tr><td colspan="4" style="padding:3px 5px;color:var(--gray-400);">외 '+(crops.length-6)+'작물...</td></tr>';
    h += '</tbody></table></div>';
  }

  
  var isOffline = !_isOnline;
  h += '<div style="display:flex;gap:6px;">'
     + '<button onclick="saveQrParsedData()" style="flex:2;padding:10px;background:var(--green-dark);color:#fff;border-radius:7px;border:none;font-size:13px;font-weight:600;cursor:pointer;">'
     + (isOffline ? '💾 기기에 저장 (온라인 시 자동 동기화)' : '✅ Google Sheets에 저장')
     + '</button>'
     + '<button onclick="openAiImportModal()" style="flex:1;padding:10px;background:var(--blue-dark);color:#fff;border-radius:7px;border:none;font-size:12px;cursor:pointer;">✏️ 수정 후 저장</button>'
     + '</div>';
  if (isOffline) {
    h += '<div style="font-size:11px;color:var(--orange);margin-top:6px;text-align:center;">📵 오프라인 상태 — 인터넷 연결 시 자동으로 Google Sheets에 저장됩니다</div>';
  }
  h += '</div>';
  return h;
}

function buildQrManualFallback(qrUrl) {
  return '<div style="background:var(--amber-light);border:1px solid #FFCC02;border-radius:10px;padding:12px;">'
    + '<div style="font-size:13px;font-weight:600;margin-bottom:8px;">⚠️ AI 자동 분석 불가</div>'
    + '<div style="font-size:11px;color:var(--gray-600);margin-bottom:10px;">사이트가 동적 로딩 방식이라 자동 분석이 어렵습니다.<br>아래 방법 중 선택하세요.</div>'
    + '<div style="display:flex;flex-direction:column;gap:6px;">'
    + '<button onclick="window.open(\''+qrUrl+'\')" style="padding:8px;background:var(--blue-dark);color:#fff;border-radius:6px;border:none;font-size:12px;cursor:pointer;">🔗 사이트 열기 → 표 복사 → AI 분석</button>'
    + '<button onclick="openAiImportModal()" style="padding:8px;background:var(--green-dark);color:#fff;border-radius:6px;border:none;font-size:12px;cursor:pointer;">✏️ 직접 입력으로 등록</button>'
    + '</div>'
    + '<div style="font-size:10px;color:var(--gray-400);margin-top:6px;">QR URL: '+esc(qrUrl.slice(0,60))+'...</div>'
    + '</div>';
}

async function saveQrParsedData() {
  var res = window._qrParsedData;
  if (!res) { showToast('저장할 데이터가 없습니다'); return; }

  var {parsed, qrUrl} = res;
  var tab = ['미량요소','영양제','비료'].indexOf(parsed.type||'') !== -1 ? 'fert' : 'pest';

  var saveData = {
    name:         parsed.name||'',
    type:         parsed.type||'살균제',
    tab:          tab,
    ingredient:   parsed.ingredient||'',
    manufacturer: parsed.manufacturer||'',
    regNo:        parsed.regNo||'',
    form:         parsed.form||'',
    toxicity:     parsed.toxicity||'',
    feature:      parsed.feature||'',
    warning:      parsed.warning||'',
    icon:         tab==='fert'?'🌱':'🌿',
    qrParsed:     true,
    _srcUrl:      qrUrl,
  };

  
  var cropUsage = parsed.cropUsage||{};
  var result;

  try {
    if (tab === 'pest') {
      result = await smartSave('myPesticides', saveData);
      if (Object.keys(cropUsage).length > 0) {
        await smartSave('pestCropUsage', {
          _name: parsed.name, ...cropUsage, _srcUrl: qrUrl
        });
        if (_isOnline) window._userCropUsage = window._userCropUsage||{};
        if (_isOnline) window._userCropUsage[parsed.name] = cropUsage;
      }
    } else {
      saveData.cropUsage = cropUsage;
      result = await smartSave('userDb_'+tab, saveData);
    }

    window._qrParsedData = null;

    var savedMsg = result.source==='local'
      ? '💾 기기에 임시 저장됨 (미동기: '+((await idbGetAll('pendingSync')).length)+'건)'
      : '✅ Google Sheets 저장 완료';
    showToast(savedMsg);
    closeModal('scan-modal');

    
    await loadMyPesticideList();
    await loadUserDb();
    APP.dbTab = tab;
    var btn = document.getElementById('dbt-'+tab);
    if (btn) { document.querySelectorAll('.db-tab').forEach(function(b){b.classList.remove('on');}); btn.classList.add('on'); }
    if (tab==='fert') renderFertPanel(tab); else renderDb();
    switchTab('db');
    updatePendingBadge();

  } catch(e) {
    showToast('⚠️ 저장 오류: '+e.message);
  }
}

async function initOfflineSystem() {
  await openIDB();
  initNetworkMonitor();
  await updatePendingBadge();
  
  if (_isOnline) {
    setTimeout(syncPendingToFirebase, 2000);
  }
}

async function showPendingPanel() {
  var pending = await idbGetAll('pendingSync');
  if (!pending.length) {
    showToast('동기화 대기 중인 데이터가 없습니다');
    return;
  }
  var h = '<div class="modal-bg" id="pending-panel" onclick="if(event.target.id===\'pending-panel\')closeModal(\'pending-panel\')">'
    + '<div class="modal" style="max-height:80vh;overflow-y:auto;">'
    + '<div class="modal-title">📵 오프라인 저장 대기 ('+pending.length+'건)</div>'
    + '<div style="margin-bottom:10px;">';
  pending.forEach(function(item){
    h += '<div style="border:1px solid var(--gray-200);border-radius:8px;padding:8px 10px;margin-bottom:5px;">'
       + '<div style="font-size:12px;font-weight:600;">'+esc(item.data.name||'이름없음')+'</div>'
       + '<div style="font-size:10px;color:var(--gray-400);">컬렉션: '+esc(item.collection)+' · 저장: '+esc(item.createdAt.slice(0,16))+'</div>'
       + '</div>';
  });
  h += '</div>'
     + '<div style="display:flex;gap:6px;">'
     + '<button class="btn-secondary" onclick="closeModal(\'pending-panel\')" style="flex:1;">닫기</button>'
     + (_isOnline
       ? '<button class="btn-primary" onclick="syncPendingToFirebase();closeModal(\'pending-panel\')" style="flex:2;">🔄 지금 동기화</button>'
       : '<div style="flex:2;padding:8px;text-align:center;font-size:11px;color:var(--orange);">오프라인 중 — 연결 시 자동 동기화</div>')
     + '</div>'
     + '</div></div>';
  document.body.insertAdjacentHTML('beforeend', h);
}

function _setQrResult(html2, showReset) {
  var out = document.getElementById('qr-decode-result');
  if (out) out.innerHTML = html2;
  
  var sr = document.getElementById('scan-result');
  if (sr) sr.innerHTML = html2;
  var resetRow = document.getElementById('qr-reset-row');
  if (resetRow) resetRow.style.display = showReset ? '' : 'none';
}

function resetQrPanel() {
  _setQrResult('', false);
  var inp = document.getElementById('qr-url-input');
  if (inp) inp.value = '';
  var ci = document.getElementById('scan-code-input');
  if (ci) ci.value = '';
  
  ['qr-photo-input','qr-gallery-input'].forEach(function(id){
    var el = document.getElementById(id);
    if (el) el.value = '';
  });
}

function decodeQrFromPhoto(input) {
  var file = input && input.files && input.files[0];
  if (!file) return;

  _setQrResult('<div style="padding:16px;text-align:center;color:var(--gray-400);">🔍 QR 인식 중...</div>', false);

  var reader = new FileReader();
  reader.onload = function(ev) {
    var img = new Image();
    img.onload = function() {
      _decodeQrImage(img);
    };
    img.onerror = function() {
      _setQrResult('<div style="padding:10px;color:var(--red-dark);">⚠️ 이미지를 불러올 수 없습니다.</div>', true);
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  input.value = ''; 
}

function _decodeQrImage(img) {
  if (typeof jsQR !== 'function') {
    _setQrResult('<div style="padding:10px;color:var(--red-dark);">⚠️ QR 라이브러리가 초기화되지 않았습니다. 페이지를 새로고침하세요.</div>', true);
    return;
  }

  
  var MAX = 1200;
  var scale = Math.min(1, MAX / Math.max(img.naturalWidth || img.width, img.naturalHeight || img.height));
  var w = Math.floor((img.naturalWidth  || img.width)  * scale);
  var h = Math.floor((img.naturalHeight || img.height) * scale);

  var cvs = document.createElement('canvas');
  cvs.width = w; cvs.height = h;
  var ctx = cvs.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);

  
  var code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, {inversionAttempts:'attemptBoth'});
  if (code && code.data) { _onQrSuccess(code.data); return; }

  
  var angles = [90, 180, 270];
  for (var i = 0; i < angles.length; i++) {
    var cvs2 = document.createElement('canvas');
    var isLR = angles[i] === 90 || angles[i] === 270;
    cvs2.width = isLR ? h : w;
    cvs2.height = isLR ? w : h;
    var ctx2 = cvs2.getContext('2d');
    ctx2.translate(cvs2.width/2, cvs2.height/2);
    ctx2.rotate(angles[i] * Math.PI / 180);
    ctx2.drawImage(cvs, -w/2, -h/2);
    var code2 = jsQR(ctx2.getImageData(0, 0, cvs2.width, cvs2.height).data, cvs2.width, cvs2.height, {inversionAttempts:'attemptBoth'});
    if (code2 && code2.data) { _onQrSuccess(code2.data); return; }
  }

  
  _setQrResult(
    '<div style="background:#FFF3E0;border:1px solid #FFB74D;border-radius:10px;padding:14px;">'
    + '<div style="font-size:13px;font-weight:600;color:#E65100;margin-bottom:8px;">⚠️ QR코드 인식 실패</div>'
    + '<div style="font-size:12px;color:#666;line-height:1.8;">'
    + '• QR코드가 선명한지 확인하고 다시 찍어주세요<br>'
    + '• 또는 방법 ②에서 URL을 직접 붙여넣으세요'
    + '</div></div>', true
  );
}

function analyzeQrUrl() {
  var inp = document.getElementById('qr-url-input');
  var val = inp ? inp.value.trim() : '';
  if (!val) { showToast('URL이나 텍스트를 먼저 입력하세요'); return; }
  if (val.startsWith('http://') || val.startsWith('https://')) {
    _onQrSuccess(val);
  } else {
    
    _onQrSuccess(val);
  }
}

async function pasteQrUrl() {
  var inp = document.getElementById('qr-url-input');
  if (!inp) return;
  try {
    var text = await navigator.clipboard.readText();
    if (text && text.trim()) {
      inp.value = text.trim();
      showToast('📋 붙여넣기 완료');
    } else {
      showToast('클립보드가 비어있습니다');
    }
  } catch(e) {
    inp.focus();
    showToast('입력란을 길게 눌러 직접 붙여넣기 하세요');
  }
}

function _onQrSuccess(value) {
  value = (value||'').trim();
  if (!value) return;
  if (navigator.vibrate) navigator.vibrate([50, 30, 50]);

  var ci = document.getElementById('scan-code-input');
  if (ci) ci.value = value;

  var isUrl  = value.startsWith('http://') || value.startsWith('https://');
  var isCode = /^[\d\-]{8,16}$/.test(value.replace(/\s/g,''));

  
  var btnHtml;
  if (isUrl) {
    btnHtml = '<button id="qr-action-btn" style="width:100%;padding:12px;background:var(--green-dark);color:#fff;border-radius:8px;border:none;font-size:14px;font-weight:700;cursor:pointer;">🤖 AI로 농약 정보 분석 → 저장</button>';
  } else if (isCode) {
    btnHtml = '<button id="qr-action-btn" style="width:100%;padding:12px;background:var(--blue-dark);color:#fff;border-radius:8px;border:none;font-size:14px;font-weight:700;cursor:pointer;">🔍 등록번호로 조회</button>';
  } else {
    btnHtml = '<button id="qr-action-btn" style="width:100%;padding:12px;background:var(--blue-dark);color:#fff;border-radius:8px;border:none;font-size:14px;font-weight:700;cursor:pointer;">🤖 AI로 정보 분석</button>';
  }

  _setQrResult(
    '<div style="background:var(--green-light);border:1.5px solid var(--green-dark);border-radius:10px;padding:12px;">'
    + '<div style="font-size:13px;font-weight:700;color:var(--green-dark);margin-bottom:6px;">✅ 인식 성공!</div>'
    + '<div id="qr-val-display" style="font-size:11px;color:var(--gray-600);word-break:break-all;margin-bottom:10px;background:#fff;border-radius:6px;padding:7px;line-height:1.5;"></div>'
    + btnHtml
    + '</div>', true
  );

  
  var disp = document.getElementById('qr-val-display');
  if (disp) disp.textContent = value.slice(0,150) + (value.length>150?'…':'');

  
  var btn = document.getElementById('qr-action-btn');
  if (btn) {
    var _capturedVal = value;
    btn.addEventListener('click', function() {
      if (isCode) {
        lookupScanCode();
      } else {
        _processQrValue(_capturedVal);
      }
    });
  }
}

function _processQrValue(value) {
  _setQrResult(
    '<div style="padding:16px;text-align:center;">'
    + '<div style="font-size:28px;margin-bottom:8px;">🤖</div>'
    + '<div style="font-size:13px;color:var(--gray-600);">AI 분석 중...</div>'
    + '<div style="height:4px;background:var(--gray-200);border-radius:2px;margin-top:12px;overflow:hidden;">'
    + '<div style="height:100%;background:var(--green-dark);border-radius:2px;animation:qrProgress 2s ease-in-out infinite;"></div></div>'
    + '</div>', false
  );
  processQrUrlAuto(value);
}

function _hideVideoForQrMode() {
  var wrap = document.getElementById('scan-video-wrap');
  if (wrap) wrap.style.display = 'none';
  stopScan();
}

function parseUrlForPesticide(url) {
  var result = {name:'', manufacturer:'', regNo:'', type:'살균제'};
  if (!url) return result;

  
  if (url.includes('knco.co.kr')) {
    result.manufacturer = '경농';
    var idx = url.match(/skskIdx=(\d+)/);
    if (idx) result.regNo = idx[1];
    var s = url.match(/skskSearch4=([^&]+)/);
    if (s) result.name = decodeURIComponent(s[1]);
  }
  
  else if (url.includes('farmmorning.com')) {
    var seg = url.split('/').pop().split('?')[0];
    result.name = decodeURIComponent(seg).replace(/-/g,' ');
  }
  
  else if (url.includes('psis.rda.go.kr')) {
    var bn = url.match(/brandName=([^&]+)/);
    if (bn) result.name = decodeURIComponent(bn[1]);
  }
  
  else {
    var path = url.split('/').filter(Boolean).pop() || '';
    path = decodeURIComponent(path).split('?')[0].replace(/[-_]/g,' ');
    if (path.length > 1 && path.length < 30) result.name = path;
  }
  return result;
}

async function queryGasForPesticide(urlOrText) {
  var gasUrl = (typeof getEffectiveGasUrl === 'function') ? getEffectiveGasUrl() : '';
  if (!gasUrl) return null;

  try {
    var ctrl = new AbortController();
    setTimeout(function(){ ctrl.abort(); }, 15000);
    var res = await fetch(gasUrl, {
      method: 'POST',
      headers: {'Content-Type':'text/plain'},
      body: JSON.stringify({
        action: 'analyzePesticide',
        input: urlOrText.slice(0, 3000)
      }),
      signal: ctrl.signal
    });
    if (!res.ok) return null;
    var data = await res.json();
    if (!data.success || !data.result) return null;
    return data.result; 
  } catch(e) { return null; }
}

function parseLocalPesticideText(text) {
  if (!text) return null;
  var t = text.replace(/\r/g,'').replace(/\t/g,' ');

  function ext(patterns) {
    for (var i=0;i<patterns.length;i++){
      var m=t.match(patterns[i]);
      if(m && m[1]) return m[1].trim().slice(0,60);
    }
    return '';
  }

  var name = ext([
    /상\s*표\s*명\s*[:\uff1a]\s*([^\n]+)/,
    /제\s*품\s*명\s*[:\uff1a]\s*([^\n]+)/,
    /^([가-힣a-zA-Z]{2,15}(?:에스|플러스|골드|왕)?)\s/m
  ]);
  var ingredient = ext([
    /품\s*목\s*명\s*[:\uff1a]\s*([^\n]+)/,
    /주\s*성\s*분\s*[:\uff1a]\s*([^\n]+)/,
    /유\s*효\s*성\s*분\s*[:\uff1a]\s*([^\n]+)/
  ]);
  var regNo = ext([
    /등\s*록\s*번\s*호\s*[:\uff1a]\s*([\d\-가-힣]+)/
  ]);
  var mfr = ext([
    /제\s*조\s*사\s*[:\uff1a]\s*([^\n]+)/,
    /수\s*입\s*사\s*[:\uff1a]\s*([^\n]+)/
  ]);
  var typeRaw = ext([/분\s*류\s*[:\uff1a]\s*([^\n]+)/]);
  var type = typeRaw ||
    (t.includes('살균') ? '살균제' :
     t.includes('살충') ? '살충제' :
     t.includes('제초') ? '제초제' : '살균제');

  
  
  var cropUsage = {};
  var tableRows = t.match(/([가-힣()·,\s]{2,12})\s+([가-힣/·\s]{2,20})\s+(발[가-힣\s]+처리[가-힣\s]*)\s+([\d,\.]+(?:ml|ℓ|배)?)\s+(수확\s*\d+일\s*전|발생초기|파종[가-힣]*)\s*(\d회)?/g);
  if (tableRows) {
    tableRows.forEach(function(row) {
      var parts = row.trim().split(/\s{2,}/);
      if (parts.length >= 3) {
        var crop = parts[0].trim();
        if (crop.length >= 2 && crop.length <= 12) {
          if (!cropUsage[crop]) cropUsage[crop] = [];
          cropUsage[crop].push({
            target: parts[1]||'',
            method: parts[2]||'',
            amount: parts[3]||'',
            safety: parts[4]||'',
            times:  parts[5]||''
          });
        }
      }
    });
  }

  if (!name && !ingredient) return null;

  return {
    name:         name || '알 수 없음',
    type:         type,
    ingredient:   ingredient || '',
    manufacturer: mfr || '',
    regNo:        regNo || '',
    cropUsage:    cropUsage,
    source:       'LOCAL'
  };
}

async function processQrUrlAuto(input) {
  var isUrl = input && (input.startsWith('http://') || input.startsWith('https://'));
  var qrOut = document.getElementById('qr-decode-result');
  var srOut = document.getElementById('scan-result');

  function setUI(html2) {
    if (qrOut) qrOut.innerHTML = html2;
    if (srOut) srOut.innerHTML = html2;
  }

  setUI(_buildProgressUI('🔍', '정보 조회 중...', '잠시만 기다려주세요'));

  var parsed = null;

  
  var urlInfo = isUrl ? parseUrlForPesticide(input) : {};

  
  var gasUrl = (typeof getEffectiveGasUrl === 'function') ? getEffectiveGasUrl() : '';
  if (gasUrl) {
    setUI(_buildProgressUI('🤖', 'GAS를 통해 AI 분석 중...', '최대 15초 소요'));
    parsed = await queryGasForPesticide(input);
    if (parsed) parsed.source = 'GAS/Claude';
  }

  
  if (!parsed && urlInfo.name) {
    setUI(_buildProgressUI('🏛', 'PSIS 농약 DB 조회 중...', '농촌진흥청 공식 데이터'));
    parsed = await queryPsisForPesticide(urlInfo.name);
  }

  
  if (!parsed && !isUrl) {
    parsed = parseLocalPesticideText(input);
  }

  
  if (!parsed && (urlInfo.name || urlInfo.manufacturer)) {
    parsed = {
      name:         urlInfo.name || '',
      manufacturer: urlInfo.manufacturer || '',
      regNo:        urlInfo.regNo || '',
      type:         '살균제',
      ingredient:   '',
      cropUsage:    {},
      source:       'URL'
    };
  }

  
  if (parsed && parsed.name) {
    setUI(_buildQrConfirmUI(parsed, input));
    window._qrParsedData = {parsed: parsed, qrUrl: input};
  } else {
    
    setUI(_buildManualInputUI(input, urlInfo));
  }
}

function _buildProgressUI(icon, title, sub) {
  return '<div style="text-align:center;padding:20px;background:var(--green-light);border-radius:10px;">'
    + '<div style="font-size:30px;margin-bottom:8px;">'+icon+'</div>'
    + '<div style="font-size:14px;font-weight:600;color:var(--green-dark);">'+esc(title)+'</div>'
    + '<div style="font-size:11px;color:var(--gray-500);margin-top:4px;">'+esc(sub)+'</div>'
    + '<div style="height:3px;background:var(--gray-200);border-radius:2px;margin-top:12px;overflow:hidden;">'
    + '<div style="height:100%;background:var(--green-dark);border-radius:2px;width:60%;animation:qrProgress 1.5s ease-in-out infinite;"></div>'
    + '</div></div>';
}

function _buildQrConfirmUI(parsed, srcUrl) {
  if (!parsed) return '';

  var crops       = Object.keys(parsed.cropUsage||{});
  var entries     = crops.reduce(function(a,c){return a+(parsed.cropUsage[c]||[]).length;},0);
  var moaCode     = parsed.moa || getPesticideMoa(parsed.name||'');
  var moaBadge    = moaCode ? buildMoaBadge(moaCode) : '';
  var isCancelled = parsed.status === '등록취소';
  var srcBadge    = {
    'PSIS_등록':'🏛 PSIS 등록농약', 'PSIS_취소':'⛔ PSIS 등록취소',
    'PSIS':'🏛 PSIS', 'GAS/Claude':'🤖 AI 분석',
    'LOCAL':'📋 텍스트 파싱', 'URL':'🔗 URL 추출',
  }[parsed.source] || parsed.source || '';

  var cancelBadge = (typeof _getCancelledBadge==='function') ? _getCancelledBadge(parsed) : '';
  var borderColor = isCancelled ? '#EF9A9A' : 'var(--green-dark)';
  var bgColor     = isCancelled ? '#FFF5F5' : 'var(--green-light)';

  var h = cancelBadge;
  h += '<div style="background:'+bgColor+';border:1.5px solid '+borderColor+';border-radius:12px;padding:14px;">';

  
  h += '<div style="display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:10px;">'
     + '<div>'
     + '<div style="font-size:15px;font-weight:800;color:'+(isCancelled?'#C62828':'var(--green-dark)')+';">'
     + (isCancelled?'⛔ ':'✅ ')+esc(parsed.name||'')+'</div>'
     + '<div style="font-size:11px;color:var(--gray-500);margin-top:2px;">'
     + esc(parsed.type||'')+(parsed.form?' · '+esc(parsed.form):'')+'</div>'
     + '</div>'
     + '<div style="text-align:right;">'
     + (srcBadge?'<span style="font-size:10px;padding:2px 8px;border-radius:8px;background:var(--green-dark);color:#fff;">'+esc(srcBadge)+'</span><br>':'')
     + moaBadge
     + '</div></div>';

  
  var infoFields = [
    {label:'성분', val:parsed.ingredient},
    {label:'제조사', val:parsed.manufacturer},
    {label:'등록번호', val:parsed.regNo},
    {label:'취소일', val:parsed.cancelDate},
  ].filter(function(f){return f.val;});
  if (infoFields.length) {
    h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:10px;">';
    infoFields.forEach(function(f){
      h += '<div style="background:rgba(255,255,255,0.7);border-radius:6px;padding:5px 8px;">'
         + '<div style="font-size:10px;color:var(--gray-500);">'+esc(f.label)+'</div>'
         + '<div style="font-size:11px;font-weight:600;">'+esc(f.val)+'</div></div>';
    });
    h += '</div>';
  }

  
  if (crops.length) {
    h += '<div style="font-size:12px;font-weight:700;color:var(--green-dark);margin-bottom:6px;">'
       + '🌱 '+crops.length+'종 작물 · '+entries+'개 방제항목</div>';

    h += '<div style="max-height:280px;overflow-y:auto;border-radius:8px;border:1px solid var(--gray-200);margin-bottom:10px;">'
       + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
       + '<thead style="position:sticky;top:0;"><tr style="background:var(--green-dark);color:#fff;">'
       + '<th style="padding:4px 6px;text-align:left;">작물</th>'
       + '<th style="padding:4px 6px;text-align:left;">방제대상</th>'
       + '<th style="padding:4px 6px;text-align:center;">20L당</th>'
       + '<th style="padding:4px 6px;text-align:center;color:#FFD54F;">안전사용</th>'
       + '<th style="padding:4px 6px;text-align:center;">횟수</th>'
       + '</tr></thead><tbody>';

    var ri = 0;
    var myNames = (window._allPlants||[]).map(function(p){return p.name||'';});
    crops.forEach(function(crop){
      var isMy = myNames.some(function(n){return n.includes(crop)||crop.includes(n);});
      (parsed.cropUsage[crop]||[]).forEach(function(entry, ei){
        h += '<tr style="'+(ri%2?'background:var(--gray-50);':'')+'">'
           + '<td style="padding:4px 6px;font-weight:'+(ei===0?'700':'400')+';">'
           + (isMy&&ei===0?'⭐ ':'')+(ei===0?esc(crop):'')+'</td>'
           + '<td style="padding:4px 6px;">'+esc(entry.target||'')+'</td>'
           + '<td style="padding:4px 6px;text-align:center;font-weight:700;color:var(--blue-dark);">'+esc(entry.amount||'')+'</td>'
           + '<td style="padding:4px 6px;text-align:center;color:#E65100;font-size:10px;">'+esc(entry.safety||'')+'</td>'
           + '<td style="padding:4px 6px;text-align:center;">'+esc(entry.times||'')+'</td>'
           + '</tr>';
        ri++;
      });
    });
    h += '</tbody></table></div>';

    
    var matched = crops.filter(function(c){return myNames.some(function(n){return n.includes(c)||c.includes(n);});});
    if (matched.length) {
      h += '<div style="padding:6px 8px;background:var(--green-light);border-radius:6px;font-size:11px;color:var(--green-dark);margin-bottom:8px;">'
         + '⭐ 내 작물 해당: <b>'+esc(matched.join(' · '))+'</b></div>';
    }
  } else if (!isCancelled) {
    h += '<div style="padding:8px;text-align:center;color:var(--gray-400);font-size:12px;">작물별 방제 정보 없음</div>';
  }

  
  h += '<div style="display:flex;gap:6px;flex-wrap:wrap;">'
     + '<button onclick="saveQrParsedData()" style="flex:2;min-width:100px;padding:10px;background:'
     + (isCancelled?'#C62828':'var(--green-dark)')
     + ';color:#fff;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;">'
     + (isCancelled?'⚠️ 취소농약 기록 저장':(_isOnline?'✅ Google Sheets에 저장':'💾 기기에 저장'))+'</button>'
     + '<button onclick="window.open(\''+esc(srcUrl)+'\')" '
     + 'style="flex:1;padding:10px;background:#fff;border:1px solid var(--blue-mid);color:var(--blue-dark);border-radius:8px;font-size:12px;cursor:pointer;">🔗 사이트</button>'
     + '<button onclick="resetQrPanel()" style="padding:10px;background:#fff;border:1px solid var(--gray-200);border-radius:8px;font-size:12px;cursor:pointer;">🔄</button>'
     + '</div>';

  if (!_isOnline) {
    h += '<div style="font-size:11px;color:#E65100;margin-top:5px;text-align:center;">📵 오프라인 — 연결 시 자동 동기화</div>';
  }
  h += '</div>';
  return h;
}

function _buildManualInputUI(input, urlInfo) {
  var isUrl = input && input.startsWith('http');
  return '<div style="background:#FFF3E0;border:1px solid #FFB74D;border-radius:10px;padding:14px;">'
    + '<div style="font-size:13px;font-weight:700;color:#E65100;margin-bottom:10px;">⚠️ 자동 분석 불가</div>'
    + '<div style="font-size:12px;color:#555;line-height:1.8;margin-bottom:12px;">'
    + (isUrl
        ? '해당 사이트는 자동 접근이 차단되어 있습니다.<br>아래 방법으로 직접 정보를 가져와 주세요.'
        : 'PSIS API 키가 없거나 파싱할 수 있는 형식이 아닙니다.')
    + '</div>'
    + '<div style="display:flex;flex-direction:column;gap:8px;">'
    
    + (isUrl
        ? '<button onclick="openSiteForCopy(\''+input.replace(/'/g,"\\'")+'\')" style="padding:10px;background:var(--blue-dark);color:#fff;border-radius:8px;border:none;font-size:12px;cursor:pointer;">🔗 사이트 열기 → 표 복사 → 붙여넣기</button>'
        : '')
    
    + '<button onclick="showPsisKeySetup()" style="padding:10px;background:#fff;border:1px solid var(--blue-dark);color:var(--blue-dark);border-radius:8px;font-size:12px;cursor:pointer;">🔑 PSIS API 키 설정 (무료, 1회)</button>'
    
    + '<button onclick="openRegisterPestModal()" style="padding:10px;background:#fff;border:1px solid var(--gray-300);border-radius:8px;font-size:12px;cursor:pointer;">✏️ 직접 입력으로 등록</button>'
    + '</div>'
    + (urlInfo && urlInfo.name
        ? '<div style="margin-top:8px;font-size:11px;color:#888;">감지된 제품명: '+esc(urlInfo.name)+'</div>'
        : '')
    + '</div>';
}

function openSiteForCopy(url) {
  window.open(url, '_blank');
  var qrOut = document.getElementById('qr-decode-result');
  if (qrOut) {
    qrOut.innerHTML += '<div style="margin-top:10px;background:var(--blue-light);border-radius:8px;padding:10px;font-size:12px;color:var(--blue-dark);line-height:1.8;">'
      + '<b>다음 단계:</b><br>'
      + '① 열린 사이트에서 적용 대상 표를 전체 선택<br>'
      + '② 복사 (Ctrl+C 또는 길게 눌러 복사)<br>'
      + '③ 아래 텍스트 붙여넣기 영역에 붙여넣기<br>'
      + '④ AI 분석 시작 버튼 클릭'
      + '</div>';
  }
}

function showPsisKeySetup() {
  openScanModal();
  setTimeout(function(){
    var el = document.getElementById('psis-setup-section');
    if (el) el.scrollIntoView({behavior:'smooth', block:'start'});
  }, 300);
}

function buildQrProgressUI(step, url) { return _buildProgressUI('🔍','분석 중...', url.slice(0,40)); }
function buildQrConfirmUI(p,u)        { return _buildQrConfirmUI(p,u); }
function buildQrManualFallback(u)     { return _buildManualInputUI(u, parseUrlForPesticide(u)); }

function initPsisKeyUI() {
  var key   = localStorage.getItem('psis_api_key') || '';
  var badge = document.getElementById('psis-status-badge');
  var inp   = document.getElementById('psis-key-input');

  if (badge) {
    if (key) {
      badge.textContent  = '✅ 설정됨';
      badge.style.background = '#E8F5E9';
      badge.style.color      = '#2E7D32';
    } else {
      badge.textContent  = '⚠️ 미설정';
      badge.style.background = '#FFF3E0';
      badge.style.color      = '#E65100';
    }
  }
  
  if (inp && key) inp.placeholder = '●●●●' + key.slice(-4) + ' (저장됨)';
}

function savePsisKey() {
  var inp = document.getElementById('psis-key-input');
  var key = inp ? inp.value.trim() : '';
  if (!key) {
    
    if (confirm('PSIS API 키를 삭제하시겠습니까?')) {
      localStorage.removeItem('psis_api_key');
      if (inp) { inp.value = ''; inp.placeholder = 'PSIS API 키 입력'; }
      showToast('🗑 PSIS API 키 삭제됨');
      initPsisKeyUI();
    }
    return;
  }
  localStorage.setItem('psis_api_key', key);
  if (inp) { inp.value = ''; }
  showToast('✅ PSIS API 키 저장 완료! QR 분석을 다시 시도하세요.');
  initPsisKeyUI();
}

async function testPsisKey() {
  var key    = localStorage.getItem('psis_api_key') || '';
  var gasUrl = (typeof getEffectiveGasUrl === 'function') ? getEffectiveGasUrl().trim() : '';
  var testOut = document.getElementById('psis-test-result');

  
  if (!key && !gasUrl) {
    if (testOut) testOut.innerHTML =
      '<div style="font-size:12px;color:#E65100;line-height:1.8;">'
      + '⚠️ 설정이 필요합니다.<br>'
      + '<b>① PSIS API 키</b>: 위 입력란에 입력 후 저장<br>'
      + '<b>② GAS URL</b>: ⚙️ 설정 → GAS URL 등록 (CORS 우회용)<br>'
      + '<br><b>※ GAS URL이 있으면 PSIS 키 없이도 작동합니다</b>'
      + '</div>';
    return;
  }

  if (testOut) testOut.innerHTML =
    '<div style="color:var(--gray-400);padding:8px;text-align:center;">'
    + '🔍 API 연결 테스트 중...<br>'
    + '<small>'+(gasUrl?'GAS 프록시 경유 (CORS 없음)':'직접 호출 (CORS 필요)')+'</small>'
    + '</div>';

  var results = [];
  var via = gasUrl ? 'GAS 프록시 경유' : '직접 호출 (CORS 필요)';

  
  
  var regTestNames = ['다코닐', '코니도', '만코지', '스트레이트', '디펜', '농약'];
  var regOk = false;
  var regMsg = '';
  for (var ri=0; ri<regTestNames.length && !regOk; ri++) {
    try {
      var reg = await queryPsisRegistered(regTestNames[ri]);
      if (reg && reg.cropUsage && Object.keys(reg.cropUsage).length > 0) {
        regOk  = true;
        regMsg = '✅ 등록농약 API 정상 — "'+regTestNames[ri]+'" '
               + Object.keys(reg.cropUsage).length+'개 작물 조회';
      } else if (reg && reg.source === 'PSIS_등록') {
        
        regMsg = '⚠️ 연결은 됐지만 조회 결과 없음 ("'+regTestNames[ri]+'") — 다음 제품 시도 중...';
      }
    } catch(e2) {
      regMsg = '❌ 오류: ' + e2.message;
      break;
    }
  }

  if (!regOk && !regMsg.includes('❌')) {
    
    regMsg = gasUrl
      ? '⚠️ 등록농약 API — GAS 연결됐지만 PSIS 키 확인 필요'
      : '❌ 등록농약 API — CORS 차단. GAS URL을 설정하면 해결됩니다';
  }

  results.push('<div style="margin-bottom:6px;">'
    + '<b>① 농약등록정보 API</b> (selectPesticideUseInfo)<br>'
    + '<span style="font-size:11px;">'
    + (regOk
        ? '<span style="color:#2E7D32;">'+esc(regMsg)+'</span>'
        : '<span style="color:'+(regMsg.includes('❌')?'#C62828':'#FF8F00')+';">'+esc(regMsg)+'</span>')
    + '</span></div>');

  
  
  var canTestNames = ['스미치온', '파라티온', '디디티', 'BHC', '유기인제'];
  var canOk = false;
  var canMsg = '';
  for (var ci=0; ci<canTestNames.length && !canOk; ci++) {
    try {
      var can = await queryPsisCancelled(canTestNames[ci]);
      if (can && can.name && can.status === '등록취소') {
        canOk  = true;
        canMsg = '✅ 등록취소농약 API 정상 — "'+can.name+'" 취소일: '+(can.cancelDate||'미상');
      }
    } catch(e3) {
      canMsg = '❌ 오류: ' + e3.message;
      break;
    }
  }

  if (!canOk && !canMsg.includes('❌')) {
    canMsg = gasUrl
      ? '⚠️ 등록취소농약 API — GAS 연결됐지만 조회 결과 없음'
      : '❌ 등록취소농약 API — CORS 차단. GAS URL을 설정하면 해결됩니다';
  }

  results.push('<div style="margin-bottom:6px;">'
    + '<b>② 등록취소농약 API</b> (selectCancelPestInfo)<br>'
    + '<span style="font-size:11px;">'
    + (canOk
        ? '<span style="color:#2E7D32;">'+esc(canMsg)+'</span>'
        : '<span style="color:'+(canMsg.includes('❌')?'#C62828':'#FF8F00')+';">'+esc(canMsg)+'</span>')
    + '</span></div>');

  
  
  results.push(
    '<div style="margin-top:8px;padding-top:8px;border-top:1px solid var(--gray-200);">'
    + '<div style="font-size:11px;color:var(--gray-500);margin-bottom:4px;">③ 제품명 직접 조회 테스트</div>'
    + '<div style="display:flex;gap:5px;">'
    + '<input type="text" id="psis-test-name" placeholder="농약 상표명 입력 (예: 다코닐)" '
    + 'style="flex:1;padding:6px 8px;border:1px solid var(--gray-200);border-radius:6px;font-size:12px;">'
    + '<button onclick="testPsisManual()" '
    + 'style="padding:6px 12px;background:var(--green-dark);color:#fff;border-radius:6px;border:none;font-size:11px;cursor:pointer;">조회</button>'
    + '</div>'
    + '<div id="psis-manual-result" style="margin-top:5px;font-size:11px;"></div>'
    + '</div>'
  );

  
  if (testOut) {
    testOut.innerHTML =
      '<div style="background:var(--gray-50);border-radius:8px;padding:10px;margin-bottom:6px;">'
      + '<div style="font-size:11px;color:#888;margin-bottom:8px;">📡 연결 방식: <b>'+esc(via)+'</b></div>'
      + results.join('')
      + '</div>';

    
    if (!gasUrl && (!regOk || !canOk)) {
      testOut.innerHTML +=
        '<div style="background:#FFF3E0;border:1px solid #FFB74D;border-radius:8px;padding:10px;font-size:11px;line-height:1.8;">'
        + '💡 <b>CORS 문제 해결 방법</b><br>'
        + '1. GAS_Code.gs를 Google Apps Script에 배포<br>'
        + '2. 배포 URL을 ⚙️ GAS 설정에 등록<br>'
        + '3. GAS 스크립트 속성에 PSIS_API_KEY 저장<br>'
        + '→ GAS 경유 시 CORS 없이 두 API 모두 정상 작동'
        + '</div>';
    }
  }
}

async function testPsisManual() {
  var name = (document.getElementById('psis-test-name')||{}).value||'';
  var out  = document.getElementById('psis-manual-result');
  if (!name.trim()) { if(out) out.innerHTML='<span style="color:#888;">제품명을 입력하세요</span>'; return; }
  if (out) out.innerHTML = '<span style="color:var(--gray-400);">조회 중...</span>';

  try {
    
    var reg = await queryPsisRegistered(name.trim());
    if (reg && reg.cropUsage && Object.keys(reg.cropUsage).length) {
      if (out) out.innerHTML =
        '<span style="color:#2E7D32;">✅ 등록농약 — '
        + Object.keys(reg.cropUsage).length+'개 작물 / '
        + Object.values(reg.cropUsage).reduce(function(a,v){return a+v.length;},0)+'개 방제항목<br>'
        + '상표명: '+esc(reg.name||name)+' / 성분: '+esc(reg.ingredient||'')+'</span>';
      return;
    }
    
    var can = await queryPsisCancelled(name.trim());
    if (can && can.name) {
      if (out) out.innerHTML =
        '<span style="color:#C62828;">⛔ 등록취소농약 — '+esc(can.name)+' (취소일: '+esc(can.cancelDate||'미상')+')</span>';
      return;
    }
    if (out) out.innerHTML =
      '<span style="color:#FF8F00;">조회 결과 없음 — 상표명이 정확한지 확인하세요 (예: 벨리스에스 → 벨리스)</span>';
  } catch(e) {
    if (out) out.innerHTML = '<span style="color:#C62828;">오류: '+esc(e.message)+'</span>';
  }
}

var _origSetScanMode = (typeof setScanMode === 'function') ? setScanMode : null;
if (_origSetScanMode) {
  setScanMode = function(mode, el) {
    _origSetScanMode(mode, el);
    if (mode === 'barcode') {
      setTimeout(initPsisKeyUI, 100);
    }
  };
}

async function _psisRequest(endpoint, params) {
  var key    = localStorage.getItem('psis_api_key') || '';
  var gasUrl = (typeof getEffectiveGasUrl === 'function') ? getEffectiveGasUrl().trim() : '';

  // 1. GAS 프록시가 설정되어 있지 않으면 더 이상 진행하지 않음 (CORS 방지)
  if (!gasUrl) {
    console.warn("[PSIS] GAS 프록시 URL이 설정되지 않았습니다. 설정에서 등록하세요.");
    return null;
  }
  
  // 2. GAS를 통한 통신 시도
  try {
    var action = endpoint.includes('Cancel') ? 'psis_cancel' : 'psis_reg';
    var ctrl1  = new AbortController();
    setTimeout(function(){ ctrl1.abort(); }, 10000);
    
    var res1 = await fetch(gasUrl, {
      method:  'POST',
      headers: {'Content-Type': 'text/plain'},
      body:    JSON.stringify({
        action:      action,
        productName: params.pestiBrandName || params.pestiKorName || '',
        psisKey:     key   
      }),
      signal: ctrl1.signal
    });
    
    var data1 = await res1.json();
    if (data1.success) {
      return _normalizeGasResponse(data1);
    }
    console.warn('[PSIS] GAS 응답 오류:', data1.error);
  } catch(e1) {
    console.warn('[PSIS] GAS 경유 실패:', e1.message);
  }

  // 3. GAS 경유 실패 시, 직접 fetch는 CORS 차단되므로 여기서 바로 종료
  console.warn('[PSIS] GAS를 통한 조회에 실패했습니다. 직접 조회는 브라우저 정책상 차단됩니다.');
  return null;
}
function _normalizeGasResponse(gasData) {
  
  
  if (gasData.cropUsage !== undefined) {
    
    var arr = [];
    Object.keys(gasData.cropUsage || {}).forEach(function(crop) {
      (gasData.cropUsage[crop]||[]).forEach(function(u) {
        arr.push({
          cropName:       crop,
          pestName:       u.target || '',
          useMethod:      u.method || '',
          dilutionRate:   u.amount || '',
          safetyPrd:      u.safety || '',
          safetyTimes:    u.times  || '',
          pestiBrandName: gasData.name         || '',
          pestiType:      gasData.type         || '',
          pestiMtrName:   gasData.ingredient   || '',
          companName:     gasData.manufacturer || '',
          pestiRegNo:     gasData.regNo        || '',
          cancelDate:     gasData.cancelDate   || '',
          _status:        gasData.status       || '등록',
          _source:        gasData.source       || 'PSIS'
        });
      });
    });
    return arr.length ? arr : (gasData.status === '등록취소' ? [gasData] : null);
  }
  return null;
}

function _parseXmlResponse(xml) {
  try {
    var parser = new DOMParser();
    var doc    = parser.parseFromString(xml, 'text/xml');
    var items  = doc.querySelectorAll('item');
    var result = [];
    items.forEach(function(item) {
      var obj = {};
      item.childNodes.forEach(function(n) {
        if (n.nodeType === 1) obj[n.nodeName] = n.textContent.trim();
      });
      result.push(obj);
    });
    return result;
  } catch(e) { return null; }
}

async function queryPsisRegistered(productName) {
  var gasUrl  = (typeof getEffectiveGasUrl==='function') ? getEffectiveGasUrl().trim() : '';
  var resultEl= document.getElementById('dim-psis-result');

  function showDebug(msg) {
    if (resultEl) resultEl.innerHTML =
      '<div style="padding:8px;background:#E3F2FD;border-radius:7px;font-size:11px;color:#1565C0;">'
      + msg + '</div>';
  }

  // ── GAS GET 방식 (index3.html과 동일) ─────────────────────
  if (gasUrl) {
    try {
      showDebug('🔍 GAS 경유 조회 중...');
      var getUrl = gasUrl + '?keyword=' + encodeURIComponent(productName);
      var ctrl   = new AbortController();
      setTimeout(function(){ ctrl.abort(); }, 20000);
      var res  = await fetch(getUrl, {method:'GET', signal:ctrl.signal});
      var data = await res.json();
      console.log('[PSIS GAS 응답]', JSON.stringify(data).slice(0,300));

      if (data && data.success && data._rawList && data._rawList.length > 0) {
        // _rawList → cropUsage 변환
        var cropUsage = {};
        data._rawList.forEach(function(row) {
          var crop = row.cropName || row.crpName || '';
          if (!crop) return;
          if (!cropUsage[crop]) cropUsage[crop] = [];
          cropUsage[crop].push({
            target: row.diseaseWeedName || row.pestName     || '',
            method: row.pestiUse        || row.useMethod    || '',
            amount: row.dilutUnit       || row.dilutionRate || '',
            safety: row.useSuittime     || row.safetyPrd    || '',
            times:  row.useNum          || row.safetyTimes  || ''
          });
        });
        // cropUsage가 비어있으면 강제로 채우기
        if (Object.keys(cropUsage).length === 0 && data._rawList.length > 0) {
          data._rawList.forEach(function(row) {
            var crop = row.cropName || row.crpName || Object.values(row)[0] || '기타';
            if (!cropUsage[crop]) cropUsage[crop] = [];
            cropUsage[crop].push({
              target: row.diseaseWeedName || '',
              method: row.pestiUse        || '',
              amount: row.dilutUnit       || '',
              safety: row.useSuittime     || '',
              times:  row.useNum          || ''
            });
          });
        }
        var first = data._rawList[0];
        var result = {
          success:      true,
          name:         first.pestiBrandName || productName,
          type:         first.useName        || first.pestiType    || '',
          ingredient:   first.pestiKorName   || first.pestiMtrName || '',
          manufacturer: first.compName       || first.companName   || '',
          toxicity:     first.indictSymbl    || '',
          regNo:        first.pestiRegNo     || '',
          status:       '등록',
          cropUsage:    cropUsage,
          rawCount:     data._rawList.length,
          _rawList:     data._rawList,
          source:       'PSIS_GAS_GET'
        };
        showDebug('✅ ' + Object.keys(cropUsage).length + '개 작물 정보 로드됨');
        return result;
      } else if (data && data._rawList && data._rawList.length === 0) {
        showDebug('📭 검색 결과 없음: ' + productName);
      } else if (data && data.error) {
        showDebug('❌ GAS 오류: ' + data.error);
      }
    } catch(e) {
      showDebug('❌ GAS 연결 실패: ' + e.message);
      console.warn('[PSIS] GAS GET 실패:', e.message);
    }
  } else {
    showDebug('⚠️ GAS URL 미설정 — ⚙️ 설정에서 GAS URL을 등록하세요');
  }
  return null;
}
// XML <item> 파싱
function _parseXmlItems(xmlText) {
  var results = [];
  var itemRe  = /<item[^>]*>([\s\S]*?)<\/item>/gi;
  var tagRe   = /<(\w+)[^>]*>([^<]*)<\/\1>/g;
  var m, tm;
  while ((m = itemRe.exec(xmlText)) !== null) {
    var obj = {};
    tagRe.lastIndex = 0;
    while ((tm = tagRe.exec(m[1])) !== null) {
      obj[tm[1]] = tm[2].trim();
    }
    if (Object.keys(obj).length > 0) results.push(obj);
  }
  return results;
}

// PSIS 결과 → 앱 포맷 변환
function _buildPsisResult(items, productName) {
  var cropUsage = {};
  items.forEach(function(row) {
    // 실제 XML 태그: cropName, diseaseWeedName, useName, compName 등
    var crop = row.cropName || row.crpName || row['작물명'] || '';
    if (!crop) return;
    if (!cropUsage[crop]) cropUsage[crop] = [];
    cropUsage[crop].push({
      target: row.diseaseWeedName || row.pestName   || '',
      method: row.useMethod       || row.dilutMethod || '',
      amount: row.dilutionRate    || row.dilutVal    || '',
      safety: row.safetyPrd       || '',
      times:  row.safetyTimes     || ''
    });
  });
  var first = items[0];
  return {
    success:      true,
    name:         first.pestiBrandName || productName,
    type:         first.useName        || first.pestiType || '',
    ingredient:   first.pestiKorName   || first.pestiMtrName || '',
    manufacturer: first.compName       || first.companName   || '',
    toxicity:     first.indictSymbl    || '',
    regNo:        first.pestiRegNo     || '',
    status:       '등록',
    cropUsage:    cropUsage,
    rawCount:     items.length,
    _rawList:     items,
    source:       'PSIS_openApi'
  };
}

async function queryPsisCancelled(productName) {
  var data = await _psisRequest('selectCancelPestInfo', {
    pestiBrandName: productName
  });
  if (!data || !data.length) return null;

  var first = data[0];
  return {
    name:         first.pestiBrandName  || first['상표명']    || productName,
    type:         first.pestiType       || first['품목명']    || '알 수 없음',
    ingredient:   first.pestiMtrName    || first['일반명']    || '',
    manufacturer: first.companName      || first['등록회사']  || '',
    regNo:        first.pestiRegNo      || first['등록번호']  || '',
    cancelDate:   first.cancelDate      || first['등록취소일자'] || '',
    status:       '등록취소',
    cropUsage:    {},  
    source:       'PSIS_취소',
    rawCount:     data.length
  };
}

async function queryPsisForPesticide(productName) {
  if (!productName) return null;
  var key = localStorage.getItem('psis_api_key') || '';
  if (!key) return null;

  
  var reg = await queryPsisRegistered(productName);
  if (reg) return reg;

  
  var can = await queryPsisCancelled(productName);
  if (can) return can;

  return null;
}

function _getCancelledBadge(parsed) {
  if (!parsed || parsed.status !== '등록취소') return '';
  return '<div style="background:#FFEBEE;border:1.5px solid #EF9A9A;border-radius:8px;padding:10px 12px;margin-bottom:10px;">'
    + '<div style="font-size:12px;font-weight:700;color:#C62828;margin-bottom:4px;">⛔ 등록취소 농약</div>'
    + '<div style="font-size:11px;color:#555;line-height:1.7;">'
    + '이 농약은 등록이 취소된 제품입니다.<br>'
    + '취소일: <b>' + esc(parsed.cancelDate || '미상') + '</b><br>'
    + '등록취소 농약은 사용·유통이 금지되어 있습니다.'
    + '</div></div>';
}

var IDB_PENDING_URLS = 'pendingUrls';  

async function savePendingUrl(url, memo) {
  try {
    var db2 = await openIDB();
    
    
    var record = {
      collection: 'pendingUrls',
      data: {
        url:       url,
        memo:      memo || '',
        savedAt:   new Date().toISOString(),
        status:    'pending',   
        _type:     'pendingUrl'
      },
      createdAt: new Date().toISOString(),
      retryCount: 0
    };
    await idbPut('pendingSync', record);
    await updatePendingBadge();
    return true;
  } catch(e) {
    console.error('[PendingUrl] 저장 오류:', e);
    return false;
  }
}

async function getPendingUrls() {
  try {
    var all = await idbGetAll('pendingSync');
    return all.filter(function(r){ return r.data && r.data._type === 'pendingUrl'; });
  } catch(e) { return []; }
}

async function deletePendingUrl(localId) {
  await idbDelete('pendingSync', localId);
  await updatePendingBadge();
}

async function updatePendingUrlStatus(localId, status) {
  try {
    var db2  = await openIDB();
    var all  = await idbGetAll('pendingSync');
    var item = all.find(function(r){ return r.localId === localId; });
    if (item) {
      item.data.status    = status;
      item.data.updatedAt = new Date().toISOString();
      await idbPut('pendingSync', item);
    }
  } catch(e) {}
}

async function showPendingUrlPanel() {
  var list = await getPendingUrls();
  var existing = document.getElementById('pending-url-modal');
  if (existing) existing.remove();

  var modal = document.createElement('div');
  modal.className = 'modal-bg';
  modal.id = 'pending-url-modal';

  var h = '<div class="modal" style="max-height:85vh;overflow-y:auto;">'
    + '<div class="modal-title">📋 임시 저장된 URL 목록</div>'
    + '<div style="font-size:12px;color:var(--gray-500);margin-bottom:12px;">'
    + 'PSIS API 키가 없거나 분석이 불가했던 농약 URL을 저장해 둔 목록입니다.<br>'
    + 'API 키 설정 후 "다시 분석" 버튼으로 재시도할 수 있습니다.'
    + '</div>';

  if (!list.length) {
    h += '<div style="padding:24px;text-align:center;color:var(--gray-400);">'
      + '임시 저장된 URL이 없습니다.</div>';
  } else {
    list.forEach(function(item) {
      var d = item.data;
      var statusColor = {pending:'#FF8F00', resolved:'#2E7D32', failed:'#C62828'}[d.status] || '#888';
      var statusLabel = {pending:'⏳ 대기 중', resolved:'✅ 완료', failed:'❌ 실패'}[d.status] || d.status;

      h += '<div style="border:1px solid var(--gray-200);border-radius:10px;padding:12px;margin-bottom:8px;">'
        + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">'
        + '<span style="font-size:10px;padding:2px 8px;border-radius:8px;color:#fff;background:'+statusColor+';">'+statusLabel+'</span>'
        + '<span style="font-size:10px;color:var(--gray-400);">'+esc(d.savedAt.slice(0,16).replace('T',' '))+'</span>'
        + '</div>'
        + '<div style="font-size:11px;word-break:break-all;color:var(--gray-700);margin-bottom:6px;'
        + 'background:var(--gray-50,#F9F8F6);border-radius:6px;padding:6px 8px;">'
        + esc(d.url || '')
        + '</div>'
        + (d.memo ? '<div style="font-size:11px;color:var(--gray-500);margin-bottom:6px;">📝 '+esc(d.memo)+'</div>' : '')
        + '<div style="display:flex;gap:5px;flex-wrap:wrap;">'
        + '<button onclick="retryPendingUrl('+item.localId+')" '
        + 'style="font-size:11px;padding:5px 12px;border-radius:6px;border:none;background:var(--green-dark);color:#fff;cursor:pointer;">🔄 다시 분석</button>'
        + '<button onclick="window.open(\''+esc(d.url)+'\')" '
        + 'style="font-size:11px;padding:5px 12px;border-radius:6px;border:1px solid var(--blue-mid);color:var(--blue-dark);background:#fff;cursor:pointer;">🔗 사이트 열기</button>'
        + '<button onclick="deletePendingUrl('+item.localId+').then(showPendingUrlPanel)" '
        + 'style="font-size:11px;padding:5px 10px;border-radius:6px;border:1px solid var(--gray-200);color:var(--red-dark);background:#fff;cursor:pointer;">🗑</button>'
        + '</div></div>';
    });
  }

  h += '<div class="modal-btns" style="margin-top:12px;">'
    + '<button class="btn-secondary" onclick="closeModal(\'pending-url-modal\')" style="flex:1;">닫기</button>'
    + '</div></div>';

  modal.innerHTML = h;
  document.body.appendChild(modal);
}

async function retryPendingUrl(localId) {
  var list = await getPendingUrls();
  var item = list.find(function(r){ return r.localId === localId; });
  if (!item) return;

  var url = item.data.url;
  await updatePendingUrlStatus(localId, 'pending');
  closeModal('pending-url-modal');

  
  openScanModal();
  setTimeout(function() {
    var inp = document.getElementById('qr-url-input');
    if (inp) {
      inp.value = url;
      analyzeQrUrl();
      
      var _origSave = window.saveQrParsedData;
      window.saveQrParsedData = async function() {
        await _origSave.call(this);
        await updatePendingUrlStatus(localId, 'resolved');
        window.saveQrParsedData = _origSave;
      };
    }
  }, 300);
}

var _origManualUI = window._buildManualInputUI || null;

var _origProcessQrUrl = processQrUrlAuto;
processQrUrlAuto = async function(input) {
  await _origProcessQrUrl(input);
  
  setTimeout(async function() {
    var qrOut = document.getElementById('qr-decode-result');
    if (qrOut && qrOut.innerHTML.includes('자동 분석 불가') && input.startsWith('http')) {
      var alreadySaved = await getPendingUrls();
      var dup = alreadySaved.find(function(r){ return r.data.url === input; });
      if (!dup) {
        await savePendingUrl(input, '자동 저장');
        var badge = document.getElementById('pending-url-count');
        if (badge) badge.textContent = (parseInt(badge.textContent)||0)+1;
        showToast('📋 분석 불가 URL이 임시 저장됐습니다. PSIS API 키 설정 후 재시도하세요.');
      }
    }
  }, 2000);
};

function _setupQrAutoFocus(fx, fy) {
  if (!scanStream) return;
  var track = scanStream.getVideoTracks ? scanStream.getVideoTracks()[0] : null;
  if (!track) return;
  try {
    var caps = track.getCapabilities ? track.getCapabilities() : {};
    var adv  = {};
    if (caps.pointOfInterest) {
      
      adv.pointOfInterest = { x: fx, y: fy };
      adv.focusMode = 'auto';
    } else if (caps.focusMode && caps.focusMode.includes('continuous')) {
      adv.focusMode = 'continuous';
    }
    if (Object.keys(adv).length) {
      track.applyConstraints({ advanced: [adv] }).catch(function(){});
    }
  } catch(e) {}
}

function _onQrScanned(value) {
  value = (value||'').trim();
  if (!value) return;

  var isUrl  = value.startsWith('http://') || value.startsWith('https://');
  var qrOut  = document.getElementById('qr-decode-result');
  var srOut  = document.getElementById('scan-result');
  var ci     = document.getElementById('scan-code-input');
  if (ci) ci.value = value;

  
  var overlayCvs = document.getElementById('qr-overlay-canvas');
  if (overlayCvs) {
    var ctx = overlayCvs.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, overlayCvs.width, overlayCvs.height);
  }

  
  var html2 = '<div style="background:var(--green-light);border:2px solid var(--green-dark);border-radius:12px;padding:14px;margin-top:8px;">'
    + '<div style="font-size:14px;font-weight:700;color:var(--green-dark);margin-bottom:8px;">✅ QR 인식 완료!</div>'
    + '<div style="font-size:11px;word-break:break-all;background:#fff;border-radius:8px;padding:8px;margin-bottom:12px;color:var(--gray-700);line-height:1.6;">'
    + esc(value.slice(0, 200)) + (value.length > 200 ? '…' : '')
    + '</div>';

  if (isUrl) {
    html2 +=
      
      '<button id="qr-btn-analyze" style="width:100%;padding:12px;background:var(--green-dark);color:#fff;'
      + 'border-radius:9px;border:none;font-size:14px;font-weight:700;cursor:pointer;margin-bottom:8px;">'
      + '🤖 농약 정보 AI 분석 → 저장</button>'
      
      + '<div style="display:flex;gap:6px;margin-bottom:8px;">'
      + '<button id="qr-btn-chrome" style="flex:1;padding:10px;background:#1A73E8;color:#fff;'
      + 'border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;">'
      + '🌐 Chrome에서 열기</button>'
      + '<button id="qr-btn-safari" style="flex:1;padding:10px;background:#006CFF;color:#fff;'
      + 'border-radius:8px;border:none;font-size:13px;font-weight:600;cursor:pointer;">'
      + '🧭 Safari에서 열기</button>'
      + '</div>'
      
      + '<button onclick="resetQrPanel()" style="width:100%;padding:8px;background:#fff;'
      + 'border:1px solid var(--gray-200);border-radius:8px;font-size:12px;color:var(--gray-500);cursor:pointer;">'
      + '🔄 다시 스캔</button>';
  } else {
    html2 +=
      '<div style="display:flex;gap:6px;">'
      + '<button id="qr-btn-analyze" style="flex:2;padding:11px;background:var(--blue-dark);color:#fff;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;">🤖 AI 분석</button>'
      + '<button onclick="resetQrPanel()" style="flex:1;padding:11px;background:#fff;border:1px solid var(--gray-200);border-radius:8px;font-size:12px;cursor:pointer;">🔄 다시</button>'
      + '</div>';
  }
  html2 += '</div>';

  if (qrOut) qrOut.innerHTML = html2;
  if (srOut) srOut.innerHTML = html2;

  var resetRow = document.getElementById('qr-reset-row');
  if (resetRow) resetRow.style.display = '';

  
  var btnAnalyze = document.getElementById('qr-btn-analyze');
  if (btnAnalyze) {
    btnAnalyze.addEventListener('click', function() {
      processQrUrlAuto(value);
    });
  }

  var btnChrome = document.getElementById('qr-btn-chrome');
  if (btnChrome) {
    btnChrome.addEventListener('click', function() {
      _openInChrome(value);
    });
  }

  var btnSafari = document.getElementById('qr-btn-safari');
  if (btnSafari) {
    btnSafari.addEventListener('click', function() {
      window.open(value, '_blank');
    });
  }
}

function _openInChrome(url) {
  var isIOS     = /iPad|iPhone|iPod/.test(navigator.userAgent);
  var isAndroid = /Android/.test(navigator.userAgent);

  if (isIOS) {
    
    
    
    var chromeUrl = url
      .replace(/^http:\/\//, 'googlechrome://')
      .replace(/^https:\/\//, 'googlechromes://');

    
    var iframe = document.createElement('iframe');
    iframe.style.display = 'none';
    document.body.appendChild(iframe);
    iframe.src = chromeUrl;

    
    setTimeout(function() {
      document.body.removeChild(iframe);
      
    }, 500);

    
    setTimeout(function() {
      window.open(url, '_blank');
    }, 100);

    showToast('🌐 Chrome 앱이 있으면 Chrome으로, 없으면 Safari로 열립니다');

  } else if (isAndroid) {
    
    var intentUrl = 'intent://' + url.replace(/^https?:\/\//, '')
      + '#Intent;scheme=' + (url.startsWith('https') ? 'https' : 'http')
      + ';package=com.android.chrome;end';
    window.location.href = intentUrl;

  } else {
    
    window.open(url, '_blank');
  }
}

function handleQrResult(value) {
  value = (value||'').trim();
  if (!value) return;
  var ci = document.getElementById('scan-code-input');
  if (ci) ci.value = value;

  
  if (_isShortUrl(value)) {
    _resolveShortUrl(value);
  } else {
    _onQrScanned(value);
  }
}

function _isShortUrl(url) {
  if (!url.startsWith('http')) return false;
  var shortDomains = [
    'm.naver.com', 'naver.me', 'bit.ly', 'goo.gl', 'tinyurl.com',
    't.co', 'ow.ly', 'han.gl', 'url.kr', 'me2.kr', 'vo.la',
    'short.naver.com', 'smartstore.naver.com/l/'
  ];
  try {
    var host = new URL(url).hostname;
    
    var path = new URL(url).pathname;
    var isShortPath = path.length > 0 && path.length <= 8;
    return shortDomains.some(function(d){ return host.includes(d); }) || isShortPath;
  } catch(e) { return false; }
}

async function _resolveShortUrl(shortUrl) {
  var qrOut = document.getElementById('qr-decode-result');
  var srOut = document.getElementById('scan-result');
  function setUI(h) {
    if (qrOut) qrOut.innerHTML = h;
    if (srOut) srOut.innerHTML = h;
  }

  setUI('<div style="padding:14px;text-align:center;background:var(--blue-light);border-radius:10px;">'
    + '<div style="font-size:24px;margin-bottom:6px;">🔗</div>'
    + '<div style="font-size:13px;font-weight:600;color:var(--blue-dark);">단축 URL 해제 중...</div>'
    + '<div style="font-size:11px;color:var(--gray-500);margin-top:4px;">'+esc(shortUrl)+'</div>'
    + '</div>');

  var resolvedUrl = null;

  
  try {
    var ctrl1 = new AbortController();
    setTimeout(function(){ ctrl1.abort(); }, 5000);
    var res1 = await fetch(shortUrl, {
      method: 'HEAD',
      mode: 'no-cors',
      redirect: 'follow',
      signal: ctrl1.signal
    });
    
    
    if (res1.url && res1.url !== shortUrl && res1.url !== '') {
      resolvedUrl = res1.url;
    }
  } catch(e) {}

  
  if (!resolvedUrl) {
    try {
      var ctrl2 = new AbortController();
      setTimeout(function(){ ctrl2.abort(); }, 5000);
      var res2 = await fetch(shortUrl, {
        method: 'GET',
        mode: 'cors',
        redirect: 'follow',
        signal: ctrl2.signal
      });
      if (res2.url && res2.url !== shortUrl) {
        resolvedUrl = res2.url;
      }
    } catch(e) {}
  }

  
  if (!resolvedUrl || resolvedUrl === shortUrl) {
    
    _onQrScannedWithNote(shortUrl,
      '⚠️ 단축 URL 자동 해제 불가 — Chrome에서 열어 주소를 확인하세요');
    return;
  }

  
  var ci = document.getElementById('scan-code-input');
  if (ci) ci.value = resolvedUrl;
  showToast('🔗 실제 URL: ' + resolvedUrl.slice(0, 60));
  _onQrScanned(resolvedUrl);
}

function _onQrScannedWithNote(url, note) {
  _onQrScanned(url);
  
  setTimeout(function() {
    var qrOut = document.getElementById('qr-decode-result');
    if (qrOut) {
      qrOut.innerHTML =
        '<div style="background:#FFF3E0;border:1px solid #FFB74D;border-radius:8px;padding:8px 10px;margin-bottom:6px;font-size:11px;color:#E65100;">'
        + note + '</div>'
        + qrOut.innerHTML;
    }
  }, 100);
}

const PESTICIDE_MOA = {"p23": "F-D", "p24": "F-D", "p28": "F-D", "p35": "F-D", "p37": "F-D", "p25": "F-F", "p29": "F-F", "p33": "F-F", "p31": "F-F", "p26": "F-C", "p32": "F-C", "p62": "F-C", "p27": "F-B", "p64": "F-B", "p36": "F-A+F-B", "p66": "F-A+F-B", "p63": "F-A", "p65": "F-A", "p30": "F-E", "p01": "I-D", "p02": "I-F", "p03": "I-A", "p04": "I-A", "p05": "I-E", "p06": "I-B", "p07": "I-C", "p08": "I-H", "p10": "I-H", "p11": "I-A", "p12": "I-G", "p13": "I-H", "p14": "I-F", "p16": "I-C", "p17": "I-B", "p18": "I-G", "p19": "I-A", "p20": "I-A", "p21": "I-C", "p22": "I-A+I-C", "p38": "I-A+F-F", "p39": "I-G+F-D", "p40": "I-A+F-A", "p41": "I-C+F-C", "p42": "I-B+F-C"};
const MOA_NAMES     = {"F-A": "SDHI계", "F-B": "스트로빌루린", "F-C": "DMI(트리아졸)", "F-D": "보호살균", "F-E": "페닐아미드", "F-F": "기타살균", "I-A": "네오니코티노이드", "I-B": "다이아미드", "I-C": "피레스로이드", "I-D": "아버멕틴/아버멕틴계", "I-E": "스피노신", "I-F": "성장억제", "I-G": "유기인계", "I-H": "기타살충"};
const MOA_COLORS    = {"F-A": "#E91E63", "F-B": "#9C27B0", "F-C": "#3F51B5", "F-D": "#607D8B", "F-E": "#FF5722", "F-F": "#795548", "I-A": "#F44336", "I-B": "#2196F3", "I-C": "#FF9800", "I-D": "#4CAF50", "I-E": "#00BCD4", "I-F": "#9E9E9E", "I-G": "#8D6E63", "I-H": "#78909C"};

const HAENGUN_MOA = {moa:'F-B', moaName:'스트로빌루린(QoI)', moaColor:'#9C27B0'};

function getPesticideMoa(nameOrId) {
  
  if (PESTICIDE_MOA[nameOrId]) return PESTICIDE_MOA[nameOrId];
  
  var items = getAllDbItems('pest');
  var found = items.find(function(p){
    return p.id === nameOrId || (p.name||'').replace(/\s/g,'') === (nameOrId||'').replace(/\s/g,'');
  });
  if (found && found.moa) return found.moa;
  
  if ((nameOrId||'').includes('행운') || (nameOrId||'').includes('오티바')) return 'F-B';
  if ((nameOrId||'').includes('스트레이트')) return 'I-D';
  return null;
}

function getMoaInfo(moaCode) {
  if (!moaCode) return null;
  var codes = moaCode.split('+');
  return {
    code:  moaCode,
    name:  codes.map(function(c){ return MOA_NAMES[c]||c; }).join(' + '),
    color: MOA_COLORS[codes[0]] || '#888',
    isMixed: codes.length > 1
  };
}

function buildMoaBadge(moaCode) {
  var info = getMoaInfo(moaCode);
  if (!info) return '';
  return '<span style="font-size:9px;padding:1px 6px;border-radius:6px;background:'+info.color+'22;color:'+info.color+';border:1px solid '+info.color+'44;font-weight:600;white-space:nowrap;">'
    + info.name + '</span>';
}

function buildSprayPlan(selectedCrops, targetDisease, totalRounds) {
  
  
  

  if (!selectedCrops || !selectedCrops.length) return null;

  
  var cropPestMap = {};
  selectedCrops.forEach(function(crop) {
    var pests = _getPesticidesForCrop(crop, targetDisease);
    cropPestMap[crop] = pests;
  });

  
  var commonPests = _intersectPesticides(cropPestMap);
  
  var partialPests = _unionPesticides(cropPestMap).filter(function(p) {
    return !commonPests.find(function(c){ return c.name===p.name; });
  });

  
  var myActive = (window._myPesticideList||[])
    .filter(function(p){ return p.status!=='empty'&&!p.excluded; })
    .map(function(p){ return (p.name||'').replace(/\s/g,''); });

  function sortByStock(list) {
    return list.slice().sort(function(a,b){
      var aHave = myActive.indexOf((a.name||'').replace(/\s/g,''))!==-1;
      var bHave = myActive.indexOf((b.name||'').replace(/\s/g,''))!==-1;
      return (bHave?1:0)-(aHave?1:0);
    });
  }
  commonPests  = sortByStock(commonPests);
  partialPests = sortByStock(partialPests);

  
  var rounds = _buildRotationPlan(commonPests, partialPests, totalRounds||3);

  
  var spray20L = _calc20LPlan(selectedCrops, rounds);

  return {
    crops:        selectedCrops,
    disease:      targetDisease,
    totalRounds:  totalRounds||3,
    commonPests:  commonPests,
    partialPests: partialPests,
    rounds:       rounds,
    spray20L:     spray20L,
  };
}

function _getPesticidesForCrop(cropName, disease) {
  var results = [];
  var allPests = getAllDbItems('pest');

  allPests.forEach(function(p) {
    var usage = getPestCropUsage(p.name, cropName);
    if (!usage || !usage.length) return;
    if (disease) {
      usage = usage.filter(function(u){ return (u.target||u.dis||'').includes(disease); });
      if (!usage.length) return;
    }
    results.push({
      name:    p.name,
      id:      p.id,
      type:    p.type,
      moa:     p.moa || getPesticideMoa(p.id||p.name),
      usage:   usage,
      amount:  usage[0].amount || '10ml',
      safety:  usage[0].safety || '',
      times:   usage[0].times  || '',
    });
  });

  
  ['행운','스트레이트'].forEach(function(pname) {
    var usage = getPestCropUsage(pname, cropName);
    if (!usage || !usage.length) return;
    if (disease) {
      usage = usage.filter(function(u){ return (u.target||u.dis||'').includes(disease); });
      if (!usage.length) return;
    }
    if (!results.find(function(r){ return r.name===pname; })) {
      results.push({
        name:   pname,
        id:     pname==='행운'?'haengun':'straight',
        type:   pname==='행운'?'살균제':'살충제',
        moa:    getPesticideMoa(pname),
        usage:  usage,
        amount: usage[0].amount||'10ml',
        safety: usage[0].safety||'',
        times:  usage[0].times||'',
      });
    }
  });
  return results;
}

function _intersectPesticides(cropPestMap) {
  var crops = Object.keys(cropPestMap);
  if (!crops.length) return [];
  var base  = cropPestMap[crops[0]].slice();
  for (var i=1;i<crops.length;i++) {
    var other = cropPestMap[crops[i]].map(function(p){return p.name;});
    base = base.filter(function(p){ return other.indexOf(p.name)!==-1; });
  }
  return base;
}

function _unionPesticides(cropPestMap) {
  var seen = {}; var all = [];
  Object.values(cropPestMap).forEach(function(pests) {
    pests.forEach(function(p) {
      if (!seen[p.name]) { seen[p.name]=true; all.push(p); }
    });
  });
  return all;
}

function _buildRotationPlan(commonPests, partialPests, totalRounds) {
  var rounds = [];
  var usedMoas = [];  

  var allCandidates = commonPests.concat(partialPests);

  for (var r=0; r<totalRounds; r++) {
    
    var roundPests = [];
    var roundMoas  = [];

    
    var fung = allCandidates.filter(function(p){ return p.type==='살균제'&&p.moa&&p.moa.startsWith('F-'); });
    var fSelected = _selectNonRepeating(fung, usedMoas, roundMoas);
    if (fSelected) { roundPests.push(fSelected); roundMoas.push(fSelected.moa); }

    
    var insec = allCandidates.filter(function(p){ return p.type==='살충제'&&p.moa&&p.moa.startsWith('I-'); });
    var iSelected = _selectNonRepeating(insec, usedMoas, roundMoas);
    if (iSelected) { roundPests.push(iSelected); roundMoas.push(iSelected.moa); }

    
    var mixed = allCandidates.filter(function(p){ return p.type==='살균살충제'&&p.moa; });
    if (!fSelected && !iSelected && mixed.length) {
      var mSelected = _selectNonRepeating(mixed, usedMoas, roundMoas);
      if (mSelected) roundPests.push(mSelected);
    }

    usedMoas = usedMoas.concat(roundMoas);

    rounds.push({
      round:     r+1,
      pests:     roundPests,
      moas:      roundMoas,
      interval:  r===0 ? '1회차' : (r*7)+'~'+(r*10)+'일 후',
    });
  }
  return rounds;
}

function _selectNonRepeating(candidates, usedMoas, roundMoas) {
  if (!candidates.length) return null;
  
  var fresh = candidates.filter(function(p){
    return usedMoas.indexOf(p.moa)===-1 && roundMoas.indexOf(p.moa)===-1;
  });
  if (fresh.length) return fresh[0];
  
  var notThisRound = candidates.filter(function(p){ return roundMoas.indexOf(p.moa)===-1; });
  if (notThisRound.length) return notThisRound[0];
  return null;
}

function _calc20LPlan(crops, rounds) {
  return rounds.map(function(r) {
    return {
      round: r.round,
      pests: r.pests.map(function(p) {
        
        var amtStr = p.amount || '10ml';
        var amt    = parseFloat(amtStr) || 10;
        var unit   = amtStr.replace(/[\d.]/g,'').trim() || 'ml';
        return {
          name:   p.name,
          per20L: amt + unit,
          safety: p.safety,
          times:  p.times,
          moa:    p.moa,
        };
      }),
    };
  });
}

function renderSprayPlanPanel() {
  var container = document.getElementById('db-list');
  if (!container) return;
  var crops = (window._allPlants||[]).map(function(p){ return p.name||p.species||''; }).filter(Boolean);

  var h = '<div style="padding:8px 0;">';

  
  h += '<div style="background:var(--green-light);border-radius:12px;padding:14px;margin-bottom:12px;">'
     + '<div style="font-size:14px;font-weight:700;color:var(--green-dark);margin-bottom:12px;">🗓 20L 통합 방제 계획</div>'

     + '<div style="font-size:12px;font-weight:600;color:var(--gray-700);margin-bottom:6px;">방제할 작물 선택</div>'
     + '<div id="spray-crop-checks" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">';
  crops.forEach(function(crop) {
    h += '<label style="display:flex;align-items:center;gap:4px;padding:5px 10px;border-radius:8px;background:#fff;border:1px solid var(--green-mid);font-size:12px;cursor:pointer;">'
       + '<input type="checkbox" value="'+esc(crop)+'" checked style="accent-color:var(--green-dark);">'+esc(crop)+'</label>';
  });
  h += '</div>'

     + '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">'
     + '<div><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:3px;">방제 대상 병해충</label>'
     + '<input id="spray-disease" type="text" placeholder="예: 탄저병 (빈칸=전체)" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:7px;font-size:13px;box-sizing:border-box;"></div>'
     + '<div><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:3px;">방제 횟수</label>'
     + '<select id="spray-rounds" style="width:100%;padding:8px;border:1px solid var(--gray-200);border-radius:7px;font-size:13px;">'
     + '<option value="2">2회</option><option value="3" selected>3회</option><option value="4">4회</option>'
     + '</select></div>'
     + '</div>'

     
     + '<div style="font-size:11px;font-weight:600;color:var(--gray-600);margin-bottom:6px;">포함할 항목</div>'
     + '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;">'
     + '<label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;">'
     + '<input type="checkbox" id="spray-opt-soil" checked style="accent-color:var(--green-dark);">🌱 토양처리제</label>'
     + '<label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;">'
     + '<input type="checkbox" id="spray-opt-micro" style="accent-color:var(--green-dark);">🦠 미생물균</label>'
     + '<label style="display:flex;align-items:center;gap:4px;font-size:12px;cursor:pointer;">'
     + '<input type="checkbox" id="spray-opt-compat" checked style="accent-color:var(--green-dark);">🔬 혼용 분석</label>'
     + '</div>'

     + '<button onclick="generateSprayPlanFull()" style="width:100%;padding:12px;background:var(--green-dark);color:#fff;border-radius:9px;border:none;font-size:14px;font-weight:700;cursor:pointer;">'
     + '🗓 최적 방제 계획 생성</button>'
     + '</div>';

  h += '<div id="spray-plan-result"></div></div>';
  container.innerHTML = h;
}

function generateSprayPlanFull() {
  var checks  = document.querySelectorAll('#spray-crop-checks input:checked');
  var crops   = Array.from(checks).map(function(c){ return c.value; });
  var disease = (document.getElementById('spray-disease')||{}).value||'';
  var rounds  = parseInt((document.getElementById('spray-rounds')||{}).value||3);
  var soil    = !!(document.getElementById('spray-opt-soil')||{}).checked;
  var micro   = !!(document.getElementById('spray-opt-micro')||{}).checked;
  var compat  = !!(document.getElementById('spray-opt-compat')||{}).checked;
  var out     = document.getElementById('spray-plan-result');
  if (!crops.length||!out) { showToast('작물을 선택하세요'); return; }
  out.innerHTML='<div style="padding:16px;text-align:center;color:var(--gray-400);">분석 중...</div>';
  var plan = buildSprayPlanFull(crops, disease, rounds, {soil:soil,microbe:micro,compat:compat});
  if (!plan) { out.innerHTML='<div style="color:var(--red-dark);padding:10px;">계획 생성 실패</div>'; return; }
  out.innerHTML = renderSprayPlanFull(plan);
}

function renderSprayPlanFull(plan) {
  var h = '';

  
  h += renderSprayPlanResult(plan);

  
  if (plan.soilPests && plan.soilPests.length) {
    h += '<div style="border:2px solid #795548;border-radius:12px;padding:12px;margin-bottom:10px;">'
       + '<div style="font-size:13px;font-weight:700;color:#795548;margin-bottom:8px;">🌱 토양 처리 (정식 전 1회 — 경엽 방제와 별도)</div>'
       + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
       + '<thead><tr style="background:#795548;color:#fff;">'
       + '<th style="padding:5px 7px;text-align:left;">농약</th>'
       + '<th style="padding:5px 7px;text-align:center;">최대사용</th>'
       + '<th style="padding:5px 7px;text-align:left;">작용기작</th>'
       + '<th style="padding:5px 7px;text-align:left;">주의사항</th>'
       + '</tr></thead><tbody>';
    plan.soilPests.forEach(function(p,i) {
      var moaInfo = getMoaInfo(p.moa);
      h += '<tr style="'+(i%2?'background:#FFF8F6;':'')+'">'
         + '<td style="padding:5px 7px;font-weight:600;">'+esc(p.name)+'</td>'
         + '<td style="padding:5px 7px;text-align:center;">'+(p.maxTimes||1)+'회</td>'
         + '<td style="padding:5px 7px;">'+(moaInfo?'<span style="font-size:10px;padding:1px 5px;border-radius:4px;background:'+moaInfo.color+'22;color:'+moaInfo.color+';">'+esc(moaInfo.name)+'</span>':'')+'</td>'
         + '<td style="padding:5px 7px;font-size:11px;color:var(--gray-600);">'+esc(p.note||'')+'</td>'
         + '</tr>';
    });
    h += '</tbody></table></div>';
  }

  
  if (plan.microbes && plan.microbes.length) {
    h += '<div style="border:2px solid #00897B;border-radius:12px;padding:12px;margin-bottom:10px;">'
       + '<div style="font-size:13px;font-weight:700;color:#00695C;margin-bottom:4px;">🦠 미생물균 추천 (화학 방제와 분리 사용)</div>'
       + '<div style="font-size:11px;color:#888;margin-bottom:10px;">화학농약 살포 → 대기 → 미생물 살포 순서 준수</div>';

    
    var freeMic = plan.microbes.filter(function(m){ return m.source&&m.source.includes('무료'); });
    var buyMic  = plan.microbes.filter(function(m){ return m.source&&m.source.includes('상업'); });

    function renderMicGroup(label, color, list) {
      if (!list.length) return '';
      var gh = '<div style="font-size:11px;font-weight:600;color:'+color+';margin-bottom:5px;">'+label+'</div>';
      list.forEach(function(m) {
        var effectStr = Array.isArray(m.effect) ? m.effect.slice(0,2).join(' / ') : (m.effect||'');
        gh += '<div style="background:#E0F2F1;border-radius:8px;padding:9px 10px;margin-bottom:6px;">'
           + '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:5px;">'
           + '<div style="display:flex;align-items:center;gap:6px;">'
           + '<span style="font-size:18px;">'+m.emoji+'</span>'
           + '<span style="font-size:12px;font-weight:700;color:#00695C;">'+esc(m.name.split('(')[0].trim())+'</span>'
           + '</div>'
           + '<span style="font-size:10px;background:#FF5722;color:#fff;padding:2px 7px;border-radius:7px;font-weight:700;">'+m.waitAfterChem+'일 대기</span>'
           + '</div>'
           + '<div style="font-size:11px;color:#555;margin-bottom:5px;">'+esc(effectStr)+'</div>'
           + '<div style="font-size:10px;color:#888;margin-bottom:4px;">💧 '+esc(m.dilution||'')+' / '+esc(m.interval||'')+'</div>'
           + '<div style="font-size:10px;color:#C62828;">⛔ '+esc((m.incompatibleWith||[]).slice(0,4).join(' · '))+(m.incompatibleWith&&m.incompatibleWith.length>4?' 외':'')+'</div>'
           + '</div>';
      });
      return gh;
    }

    h += renderMicGroup('🏛 센터 무료 배부', '#1B5E20', freeMic);
    h += renderMicGroup('🏪 상업 구매', '#1565C0', buyMic);
    h += '</div>';
  }

  
  if (plan.byMaxTimes) {
    var bt = plan.byMaxTimes;
    h += '<div style="border:1px solid var(--gray-200);border-radius:12px;padding:12px;margin-bottom:10px;">'
       + '<div style="font-size:13px;font-weight:700;color:var(--gray-700);margin-bottom:10px;">📊 농약 사용 횟수별 분류</div>';

    var groups = [
      {times:1, label:'1회 전용', color:'#C62828', bg:'#FFEBEE', items:bt[1]},
      {times:2, label:'최대 2회', color:'#E65100', bg:'#FFF3E0', items:bt[2]},
      {times:3, label:'최대 3회', color:'#1565C0', bg:'#E3F2FD', items:bt[3]},
      {times:4, label:'최대 4회+', color:'#1B5E20', bg:'#E8F5E9', items:bt[4]},
    ];

    groups.forEach(function(g) {
      if (!g.items || !g.items.length) return;
      h += '<div style="margin-bottom:8px;padding:8px 10px;background:'+g.bg+';border-left:4px solid '+g.color+';border-radius:0 8px 8px 0;">'
         + '<div style="font-size:11px;font-weight:700;color:'+g.color+';margin-bottom:5px;">'+g.label+'</div>'
         + '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
      g.items.forEach(function(p) {
        var moaInfo = getMoaInfo(p.moa);
        h += '<div style="background:#fff;border-radius:6px;padding:4px 8px;font-size:11px;font-weight:500;">'
           + esc(p.name)
           + (moaInfo?' <span style="font-size:9px;color:'+moaInfo.color+';">'+esc(moaInfo.name)+'</span>':'')
           + '</div>';
      });
      h += '</div></div>';
    });
    h += '</div>';
  }

  
  if (plan.compatMatrix && plan.compatMatrix.length) {
    h += '<div style="border:1.5px solid #FF8F00;border-radius:12px;padding:12px;margin-bottom:10px;">'
       + '<div style="font-size:13px;font-weight:700;color:#E65100;margin-bottom:8px;">⚠️ 혼용 주의 / 금지 목록</div>';
    plan.compatMatrix.forEach(function(item) {
      var levelStyle = {
        danger: 'background:#FFEBEE;border-left:4px solid #C62828;',
        warn:   'background:#FFF3E0;border-left:4px solid #FF8F00;',
        info:   'background:#E3F2FD;border-left:4px solid #1565C0;',
      }[item.result.level] || '';
      h += '<div style="'+levelStyle+'padding:6px 10px;border-radius:0 6px 6px 0;margin-bottom:5px;font-size:12px;">'
         + '<b>'+esc(item.a)+'</b> + <b>'+esc(item.b)+'</b><br>'
         + '<span style="font-size:11px;color:var(--gray-600);">'+esc(item.result.reason)+'</span>'
         + '</div>';
    });
    h += '</div>';
  }

  
  h += '<div style="display:flex;gap:6px;margin-top:4px;">'
     + '<button onclick="saveSprayPlan(window._lastSprayPlan)" style="flex:2;padding:11px;background:var(--green-dark);color:#fff;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;">💾 계획 저장</button>'
     + '<button onclick="renderSprayPlanPanel()" style="flex:1;padding:11px;background:#fff;border:1px solid var(--gray-200);border-radius:8px;font-size:12px;cursor:pointer;">🔄 다시</button>'
     + '</div>';

  window._lastSprayPlan = plan;
  return h;
}

function generateSprayPlan(){ generateSprayPlanFull(); }

function renderSprayPlanResult(plan) {
  var h = '';

  
  h += '<div style="background:#fff;border:1px solid var(--gray-200);border-radius:10px;padding:12px;margin-bottom:12px;">'
     + '<div style="font-size:13px;font-weight:700;color:var(--green-dark);margin-bottom:8px;">'
     + '✅ '+esc(plan.crops.join(' · '))+' 공통 적용 가능 ('+plan.commonPests.length+'개)'
     + (plan.disease?' — '+esc(plan.disease):'') + '</div>';

  if (plan.commonPests.length) {
    h += '<div style="display:flex;flex-wrap:wrap;gap:5px;">';
    plan.commonPests.slice(0,8).forEach(function(p) {
      var myActive = (window._myPesticideList||[]).filter(function(m){return m.status!=='empty'&&!m.excluded;}).map(function(m){return(m.name||'').replace(/\s/g,'');});
      var have     = myActive.indexOf((p.name||'').replace(/\s/g,''))!==-1;
      var moaBadge = buildMoaBadge(p.moa);
      h += '<div style="background:'+(have?'var(--green-light)':'var(--gray-50)')+';border:1px solid '+(have?'var(--green-mid)':'var(--gray-200)')+';border-radius:7px;padding:5px 9px;">'
         + '<div style="font-size:12px;font-weight:600;">'+(have?'✅ ':'')+esc(p.name)+'</div>'
         + moaBadge
         + '</div>';
    });
    h += '</div>';
  } else {
    h += '<div style="font-size:12px;color:var(--orange);">선택한 작물에 공통으로 적용 가능한 농약이 없습니다.</div>';
  }
  h += '</div>';

  
  h += '<div style="font-size:13px;font-weight:700;color:var(--gray-700);margin-bottom:8px;">📋 회차별 방제 계획 (MOA 로테이션)</div>';

  plan.rounds.forEach(function(r) {
    var roundColors = ['#E8F5E9','#E3F2FD','#FFF3E0','#F3E5F5'];
    var borderColors= ['#4CAF50','#2196F3','#FF9800','#9C27B0'];
    var bc = borderColors[(r.round-1)%4];

    h += '<div style="border:2px solid '+bc+';border-radius:12px;padding:12px;margin-bottom:10px;">'
       + '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">'
       + '<span style="font-size:16px;font-weight:800;color:'+bc+';">'+r.round+'회차</span>'
       + '<span style="font-size:11px;color:var(--gray-400);">'+esc(r.interval)+'</span>'
       + '</div>';

    if (!r.pests.length) {
      h += '<div style="font-size:12px;color:var(--gray-400);">해당 회차 적용 농약 없음</div>';
    } else {
      
      h += '<div style="background:#fff;border-radius:8px;padding:10px;margin-bottom:8px;">'
         + '<div style="font-size:12px;font-weight:600;color:var(--gray-600);margin-bottom:6px;">💧 20L 배합 (이번 회차)</div>'
         + '<table style="width:100%;border-collapse:collapse;font-size:12px;">'
         + '<thead><tr style="background:'+bc+';color:#fff;">'
         + '<th style="padding:5px 8px;text-align:left;border-radius:4px 0 0 4px;">농약</th>'
         + '<th style="padding:5px 8px;text-align:center;">분류</th>'
         + '<th style="padding:5px 8px;text-align:center;">물 20L당</th>'
         + '<th style="padding:5px 8px;text-align:left;">작용기작</th>'
         + '<th style="padding:5px 8px;text-align:center;border-radius:0 4px 4px 0;">안전사용</th>'
         + '</tr></thead><tbody>';

      r.pests.forEach(function(p, i) {
        var moaInfo = getMoaInfo(p.moa);
        var have    = (window._myPesticideList||[]).filter(function(m){return m.status!=='empty'&&!m.excluded;}).some(function(m){return(m.name||'').replace(/\s/g,'')===(p.name||'').replace(/\s/g,'');});
        h += '<tr style="'+(i%2?'background:#F9F9F9;':'')+'">'
           + '<td style="padding:6px 8px;font-weight:700;">'+(have?'✅ ':'')+esc(p.name)+'</td>'
           + '<td style="padding:6px 8px;text-align:center;font-size:11px;">'+esc(p.type||'')+'</td>'
           + '<td style="padding:6px 8px;text-align:center;font-size:13px;font-weight:700;color:'+bc+';">'+esc(p.per20L)+'</td>'
           + '<td style="padding:6px 8px;">'+(moaInfo?'<span style="font-size:10px;padding:1px 5px;border-radius:5px;background:'+moaInfo.color+'22;color:'+moaInfo.color+';border:1px solid '+moaInfo.color+'44;">'+esc(moaInfo.name)+'</span>':'')+'</td>'
           + '<td style="padding:6px 8px;text-align:center;font-size:11px;color:#E65100;">'+esc(p.safety)+'</td>'
           + '</tr>';
      });
      h += '</tbody></table></div>';

      
      var moaList = r.pests.map(function(p){ var i=getMoaInfo(p.moa); return i?i.name:''; }).filter(Boolean);
      if (moaList.length) {
        h += '<div style="font-size:11px;color:var(--gray-500);background:var(--gray-50,#F9F8F6);border-radius:6px;padding:5px 8px;">'
           + '🔬 이 회차 작용기작: '+esc(moaList.join(' + '))+'</div>';
      }
    }
    h += '</div>';
  });

  
  h += '<div style="background:#FFF3E0;border:1px solid #FFB74D;border-radius:10px;padding:12px;margin-top:10px;">'
     + '<div style="font-size:12px;font-weight:700;color:#E65100;margin-bottom:6px;">⚠️ 저항성 관리 핵심 원칙</div>'
     + '<div style="font-size:11px;color:#555;line-height:1.9;">'
     + '• 같은 계통(MOA) 농약을 연속 2회 이상 사용하지 마세요<br>'
     + '• 스트로빌루린(F-B)·SDHI(F-A)는 내성 발현이 빠릅니다<br>'
     + '• 보호살균제(F-D: 만코지·다코닐)는 로테이션 빈칸에 유용합니다<br>'
     + '• 위 계획은 보유 농약 기준으로 자동 생성되었습니다'
     + '</div></div>';

  
  h += '<div style="margin-top:12px;display:flex;gap:6px;">'
     + '<button onclick="saveSprayPlan(window._lastSprayPlan)" style="flex:2;padding:11px;background:var(--green-dark);color:#fff;border-radius:8px;border:none;font-size:13px;font-weight:700;cursor:pointer;">💾 Google Sheets에 계획 저장</button>'
     + '<button onclick="renderSprayPlanPanel()" style="flex:1;padding:11px;background:#fff;border:1px solid var(--gray-200);border-radius:8px;font-size:12px;cursor:pointer;">🔄 다시</button>'
     + '</div>';

  window._lastSprayPlan = plan;
  return h;
}

async function saveSprayPlan(plan) {
  if (!plan) { showToast('저장할 계획이 없습니다'); return; }
  try {
    var saveData = {
      crops:     JSON.stringify(plan.crops),
      disease:   plan.disease,
      rounds:    plan.totalRounds,
      plan:      JSON.stringify(plan.rounds.map(function(r){
        return {round:r.round, pests: r.pests.map(function(p){return {name:p.name,per20L:p.per20L,moa:p.moa};})};
      })),
      createdAt: new Date().toISOString(),
    };
    await _gasPost(Object.assign({ action:'addSprayPlan' }, saveData));
    showToast('✅ 방제 계획 저장 완료');
  } catch(e) { showToast('저장 오류: '+e.message); }
}

function checkMixCompatibility(pestA, pestB) {
  
  var GLOBAL_INCOMPAT = {
    '동제':       ['강산성 농약','황제','오일제','기계유','유기인계'],
    '석회유황합제': ['동제','유기인계','유황합제','오일제'],
    '오일제':     ['동제','황제','유황합제','캡탄','만코제브'],
  };

  var aName  = pestA.name||'';
  var bName  = pestB.name||'';
  var aInc   = pestA.incompatible||[];
  var bInc   = pestB.incompatible||[];
  var aMoa   = (pestA.moa||'').split('+')[0];
  var bMoa   = (pestB.moa||'').split('+')[0];

  
  var aBlocksB = aInc.some(function(i){ return bName.includes(i) || i.includes(bName); });
  var bBlocksA = bInc.some(function(i){ return aName.includes(i) || i.includes(aName); });

  if (aBlocksB || bBlocksA) {
    return {ok:false, reason:'⛔ 혼용 금지 조합', level:'danger'};
  }

  
  if (aMoa && bMoa && aMoa === bMoa && aMoa !== '') {
    return {ok:'warn', reason:'⚠️ 같은 작용기작('+MOA_NAMES[aMoa]+') — 저항성 위험', level:'warn'};
  }

  
  if (pestA._isMicrobe || pestB._isMicrobe) {
    var microbe = pestA._isMicrobe ? pestA : pestB;
    var chem    = pestA._isMicrobe ? pestB : pestA;
    var inc     = microbe.incompatibleWith||[];
    var blocked = inc.some(function(i){ return (chem.name||'').includes(i) || (chem.ingredient||'').includes(i); });
    if (blocked) return {ok:false, reason:'⛔ 미생물균 사멸 우려 — 혼용 불가', level:'danger'};
    var safe = (microbe.safePesticides||[]).some(function(s){ return (chem.name||'').includes(s); });
    if (safe) return {ok:true, reason:'✅ 미생물균과 혼용 안전', level:'safe'};
    return {ok:'warn', reason:'⚠️ 미생물균 혼용 — 사전 소량 테스트 권장', level:'warn'};
  }

  
  if (pestA.soilUse && !pestB.soilUse) {
    return {ok:'info', reason:'ℹ️ 토양처리제 + 경엽제 — 사용 시기가 달라 통상 분리 사용', level:'info'};
  }

  return {ok:true, reason:'✅ 혼용 가능 (혼용 전 소량 테스트 권장)', level:'safe'};
}

function buildSprayPlanFull(selectedCrops, targetDisease, totalRounds, includeOptions) {
  
  var plan = buildSprayPlan(selectedCrops, targetDisease, totalRounds);
  if (!plan) return null;

  
  if (includeOptions && includeOptions.soil) {
    var soilPests = getAllDbItems('pest').filter(function(p){ return p.soilUse && p.type==='토양살충제'; });
    plan.soilPests = soilPests.map(function(p){
      return {name:p.name, id:p.id, type:p.type, moa:p.moa,
              maxTimes:p.maxTimes||1, amount:p.amount||'기준량',
              note:p.note||'', incompatible:p.incompatible||[]};
    });
  }

  
  if (includeOptions && includeOptions.microbe) {
    var microbes = MASTER_DB.microbes || [];
    plan.microbes = microbes.map(function(m){
      return Object.assign({_isMicrobe:true}, m);
    });
  }

  
  plan.compatMatrix = _buildCompatMatrix(plan);

  
  plan.byMaxTimes = _classifyByMaxTimes(plan);

  return plan;
}

function _buildCompatMatrix(plan) {
  var allItems = [];
  
  (plan.rounds||[]).forEach(function(r){
    (r.pests||[]).forEach(function(p){ if(!allItems.find(function(x){return x.name===p.name;})) allItems.push(p); });
  });
  
  (plan.soilPests||[]).forEach(function(p){ if(!allItems.find(function(x){return x.name===p.name;})) allItems.push(p); });
  
  (plan.microbes||[]).forEach(function(m){ if(!allItems.find(function(x){return x.name===m.name;})) allItems.push(Object.assign({_isMicrobe:true},m)); });

  var matrix = [];
  for (var i=0;i<allItems.length;i++) {
    for (var j=i+1;j<allItems.length;j++) {
      var result = checkMixCompatibility(allItems[i], allItems[j]);
      if (result.level !== 'safe') {
        matrix.push({a:allItems[i].name, b:allItems[j].name, result:result});
      }
    }
  }
  return matrix;
}

function _classifyByMaxTimes(plan) {
  var all = [];
  (plan.rounds||[]).forEach(function(r){
    (r.pests||[]).forEach(function(p){
      var found = getAllDbItems('pest').find(function(x){return x.name===p.name;});
      if (found && !all.find(function(x){return x.name===p.name;})) {
        all.push({name:p.name, maxTimes:found.maxTimes||'-', type:found.type||'',
                  moa:p.moa, incompatible:found.incompatible||[]});
      }
    });
  });
  var groups = {1:[],2:[],3:[],4:[],multi:[]};
  all.forEach(function(p){
    var t = p.maxTimes;
    if (t===1) groups[1].push(p);
    else if (t===2) groups[2].push(p);
    else if (t===3) groups[3].push(p);
    else if (t>=4) groups[4].push(p);
    else groups.multi.push(p);
  });
  return groups;
}

var SPRAY_INTERVAL = {
  '블루베리': {preventive:14, outbreak:7,  maxRounds:4},
  '무화과':   {preventive:14, outbreak:7,  maxRounds:3},
  '감나무':   {preventive:14, outbreak:10, maxRounds:4},
  '사과':     {preventive:10, outbreak:7,  maxRounds:5},
  '배':       {preventive:10, outbreak:7,  maxRounds:4},
  '복숭아':   {preventive:10, outbreak:7,  maxRounds:4},
  '포도':     {preventive:10, outbreak:7,  maxRounds:4},
  '매실':     {preventive:14, outbreak:10, maxRounds:4},
  '살구':     {preventive:14, outbreak:10, maxRounds:3},
  '다래':     {preventive:14, outbreak:10, maxRounds:3},
  '고추':     {preventive:7,  outbreak:5,  maxRounds:5},
  '토마토':   {preventive:7,  outbreak:5,  maxRounds:5},
  '오이':     {preventive:7,  outbreak:5,  maxRounds:4},
  '수박':     {preventive:10, outbreak:7,  maxRounds:3},
  '참외':     {preventive:10, outbreak:7,  maxRounds:3},
  '딸기':     {preventive:7,  outbreak:5,  maxRounds:4},
  'default':  {preventive:10, outbreak:7,  maxRounds:3},
};

var PRE_HARVEST_DAYS = {
  '블루베리':3, '무화과':7, '감나무':30, '사과':30,
  '배':14, '복숭아':7, '포도':30, '매실':7, '살구':14,
  '고추':5, '토마토':3, '오이':2, '수박':7, '참외':5,
  '딸기':3, 'default':14,
};

function getNextWeekend(date, prefer) {
  
  var d   = new Date(date);
  var dow = d.getDay(); 
  var targets = prefer==='sat' ? [6] : prefer==='sun' ? [0] : [6,0];
  var minDiff = 99;
  var result  = new Date(d);
  targets.forEach(function(t) {
    var diff = (t - dow + 7) % 7;
    if (diff === 0) diff = 7; 
    if (diff < minDiff) { minDiff=diff; result=new Date(d); result.setDate(d.getDate()+diff); }
  });
  return result;
}

function getPrevWeekend(date, prefer) {
  var d   = new Date(date);
  var dow = d.getDay();
  var targets = prefer==='sat' ? [6] : prefer==='sun' ? [0] : [6,0];
  var minDiff = 99;
  var result  = new Date(d);
  targets.forEach(function(t) {
    var diff = (dow - t + 7) % 7;
    if (diff === 0) diff = 7;
    if (diff < minDiff) { minDiff=diff; result=new Date(d); result.setDate(d.getDate()-diff); }
  });
  return result;
}

function getNearestWeekend(targetDate, marginDays) {
  
  var d   = new Date(targetDate);
  var dow = d.getDay();
  
  var toSat = (6 - dow + 7) % 7;
  var toSun = (0 - dow + 7) % 7 || 7;
  var frSat = dow===0 ? 7 : (dow-6+7)%7;
  var frSun = dow===0 ? 0 : (dow-0+7)%7;
  var candidates = [
    {diff: toSat,  date: new Date(d.getTime() + toSat*86400000),  dir:'후'},
    {diff: toSun,  date: new Date(d.getTime() + toSun*86400000),  dir:'후'},
    {diff: -frSat, date: new Date(d.getTime() - frSat*86400000),  dir:'전'},
    {diff: -frSun, date: new Date(d.getTime() - frSun*86400000),  dir:'전'},
  ].filter(function(c){ return Math.abs(c.diff) <= (marginDays||7); });
  if (!candidates.length) candidates = [{diff:toSat, date: new Date(d.getTime()+toSat*86400000), dir:'후'}];
  candidates.sort(function(a,b){ return Math.abs(a.diff)-Math.abs(b.diff); });
  return candidates[0];
}

function fmtDate(d) {
  if (!d) return '';
  var dt = new Date(d);
  var y  = dt.getFullYear();
  var m  = String(dt.getMonth()+1).padStart(2,'0');
  var day= String(dt.getDate()).padStart(2,'0');
  var dows = ['일','월','화','수','목','금','토'];
  return y+'년 '+m+'월 '+day+'일 ('+dows[dt.getDay()]+')';
}

function fmtShort(d) {
  if (!d) return '';
  var dt  = new Date(d);
  var m   = dt.getMonth()+1;
  var day = dt.getDate();
  var dows= ['일','월','화','수','목','금','토'];
  return m+'/'+day+'('+dows[dt.getDay()]+')';
}
function isWeekend(d) {
  var dt = new Date(d);
  return dt.getDay()===0 || dt.getDay()===6;
}

function buildSpraySchedule(opts) {
  
  
  
  
  
  
  
  

  var crops      = opts.crops || [];
  var mode       = opts.mode  || 'preventive';
  var startDate  = new Date(opts.startDate || new Date());
  var rounds     = parseInt(opts.rounds) || 3;
  var wpref      = opts.weekendPref || 'nearest';
  var disease    = opts.disease || '';

  
  var interval = 99;
  crops.forEach(function(crop) {
    var baseKey = Object.keys(SPRAY_INTERVAL).find(function(k){ return crop.includes(k); }) || 'default';
    var cfg     = SPRAY_INTERVAL[baseKey];
    var days    = mode==='outbreak' ? cfg.outbreak : cfg.preventive;
    if (days < interval) interval = days;
  });

  
  var preHarvest = 0;
  crops.forEach(function(crop) {
    var baseKey = Object.keys(PRE_HARVEST_DAYS).find(function(k){ return crop.includes(k); }) || 'default';
    var days    = PRE_HARVEST_DAYS[baseKey];
    if (days > preHarvest) preHarvest = days;
  });

  
  var firstDate;
  if (isWeekend(startDate)) {
    firstDate = startDate;
  } else {
    var nearest = getNearestWeekend(startDate, 7);
    firstDate   = nearest.date;
  }

  
  var plan = buildSprayPlan(crops, disease, rounds);
  var schedule = [];

  for (var r=0; r<rounds; r++) {
    var rawDate    = addDays(firstDate, r * interval);
    var weekend    = getNearestWeekend(rawDate, 5);
    var sprayDate  = weekend.date;
    var roundPlan  = (plan && plan.rounds && plan.rounds[r]) || null;

    schedule.push({
      round:      r+1,
      rawDate:    rawDate,
      sprayDate:  sprayDate,
      diffDays:   weekend.diff,
      diffDir:    weekend.dir,
      interval:   interval,
      pesticides: roundPlan ? roundPlan.pests : [],
      moas:       roundPlan ? roundPlan.moas  : [],
    });
  }

  return {
    crops:      crops,
    mode:       mode,
    disease:    disease,
    interval:   interval,
    preHarvest: preHarvest,
    rounds:     rounds,
    firstDate:  firstDate,
    schedule:   schedule,
    plan:       plan,
  };
}

function buildHarvestSchedule(plantInfo, weekendPref) {
  
  var name       = plantInfo.name || '';
  var plantDate  = plantInfo.plantDate ? new Date(plantInfo.plantDate) : null;
  var fruitDays  = parseInt(plantInfo.fruitDays) || 0;
  var totalDays  = parseInt(plantInfo.totalDays) || 0;
  var wpref      = weekendPref || 'nearest';

  if (!plantDate || !fruitDays) return null;

  var harvestDate = addDays(plantDate, fruitDays);
  var endDate     = totalDays ? addDays(plantDate, totalDays) : addDays(harvestDate, 30);

  var baseKey   = Object.keys(PRE_HARVEST_DAYS).find(function(k){ return name.includes(k); }) || 'default';
  var safeStop  = PRE_HARVEST_DAYS[baseKey];
  var lastSpray = addDays(harvestDate, -safeStop);

  
  var milestones = [];

  
  if (safeStop <= 14) {
    milestones.push({
      label:   '마지막 살균제 가능일',
      date:    addDays(harvestDate, -14),
      type:    'spray',
      note:    '수확 14일 전 — SDHI·스트로빌루린 계열 마지막 사용 기회',
      color:   '#FF8F00',
    });
  }

  
  milestones.push({
    label:  '마지막 농약 가능일 (수확 '+safeStop+'일 전)',
    date:   lastSpray,
    type:   'spray',
    note:   '이후 수확까지 농약 살포 금지',
    color:  '#C62828',
  });

  
  milestones.push({
    label:  '🍇 수확 예정일',
    date:   harvestDate,
    type:   'harvest',
    note:   name+' 수확 시기',
    color:  '#2E7D32',
  });

  
  milestones.push({
    label:  '수확 후 미생물균 투여',
    date:   addDays(harvestDate, 14),
    type:   'microbe',
    note:   '고초균·광합성균 관주 — 토양 회복',
    color:  '#00695C',
  });

  
  milestones.push({
    label:  '수확 후 칼슘·인산 엽면시비',
    date:   addDays(harvestDate, 21),
    type:   'fertilizer',
    note:   '튼튼한 칼슘제 + 트라포스 모빌 500배',
    color:  '#1565C0',
  });

  
  var fertSchedule = [];
  var weeks = [2, 4, 6, 8, 12, 16, 20];
  weeks.forEach(function(w) {
    var d = addDays(plantDate, w*7);
    if (d < harvestDate) {
      fertSchedule.push({
        week: w,
        date: d,
        label: '심은 후 '+w+'주째',
        note: w<=4 ? '질소 위주 관주 비료 (초기 생장)' :
              w<=8 ? '인산·칼륨 추가 (꽃·과실 분화)' :
                     '칼슘·미량요소 엽면 (과실 비대)',
        type: 'fertilizer',
      });
    }
  });

  
  milestones = milestones.map(function(m) {
    var nearest = getNearestWeekend(m.date, 7);
    return Object.assign({}, m, {
      weekendDate: nearest.date,
      weekendDiff: nearest.diff,
      weekendDir:  nearest.dir,
    });
  });
  fertSchedule = fertSchedule.map(function(f) {
    var nearest = getNearestWeekend(f.date, 7);
    return Object.assign({}, f, {
      weekendDate: nearest.date,
      weekendDiff: nearest.diff,
      weekendDir:  nearest.dir,
    });
  });

  return {
    name:         name,
    plantDate:    plantDate,
    harvestDate:  harvestDate,
    lastSpray:    lastSpray,
    safeStop:     safeStop,
    milestones:   milestones,
    fertSchedule: fertSchedule,
  };
}

/* ▼ 기존 검색·방제 패널 (index3 iframe 임베드로 대체됨 — 코드 보존용) ▼ */
function renderSpraySchedulerPanel_legacy() {
  var container = document.getElementById('db-list');
  if (!container) return;

  
  var allPlants = (APP && APP.plants && APP.plants.length)
    ? APP.plants
    : (window._allPlants && window._allPlants.length)
      ? window._allPlants
      : (MASTER_DB && MASTER_DB.plants ? MASTER_DB.plants : []);

  
  // 이름 중복 제거
  var _seenN={}; allPlants=allPlants.filter(function(p){var n=(p.name||'').trim();if(!n||_seenN[n])return false;_seenN[n]=true;return true;});

  // renderPlants와 동일한 분류 기준
  var _fruitKw = ['유실수','과수','사과','배','복숭아','포도','블루베리','블랙베리','감','자두','매실','살구','무화과','다래','키위','앵두','마르멜로','으름','헤이즐럿','복분자'];
  function _isFruit(p) {
    var cat=(p.category||'').toLowerCase(), nm=(p.name||'').toLowerCase();
    return cat.includes('유실수')||cat.includes('과수')||_fruitKw.some(function(k){return nm.includes(k);});
  }
  var fruitTrees = allPlants.filter(function(p){ return _isFruit(p); });
  var veggies    = allPlants.filter(function(p){ return !_isFruit(p); });

  var h = '<div style="padding-bottom:60px;">';

  // ══ PSIS 농약 검색 섹션 ══════════════════════════════════
  h += '<div style="background:var(--green-light);border:1.5px solid var(--green-mid);border-radius:14px;padding:16px;margin-bottom:12px;">'
     + '<div style="font-size:16px;font-weight:800;color:var(--green-dark);margin-bottom:4px;">🌱 STEP 1 — 작물 선택</div>'
     + '<div style="font-size:11px;color:var(--gray-500);margin-bottom:14px;">방제할 작물을 1개 이상 선택하세요</div>';

  
  if (fruitTrees.length) {
    h += '<div style="font-size:12px;font-weight:700;color:var(--green-dark);margin-bottom:7px;">🌳 유실수</div>'
       + '<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">';
    fruitTrees.forEach(function(p) {
      var short = (p.name||'').replace(/(블루베리|무화과|감나무|감|사과|배나무|복숭아|자두|매실|포도|살구|다래|앵두).*/,'$1').slice(0,8);
      h += '<label style="display:flex;align-items:center;gap:4px;padding:7px 11px;background:#fff;border:1.5px solid var(--green-mid);border-radius:9px;font-size:12px;cursor:pointer;user-select:none;" onclick="toggleCropCard(this)">'
         + '<input type="checkbox" class="crop-select" value="'+esc(p.name||'')+'" data-short="'+esc(short)+'" style="display:none;" onchange="_syncCropToDropdown(this)">'
         + (p.emoji||'🌿')+' <span>'+esc(short)+'</span>'
         + '</label>';
    });
    h += '</div>';
  }

  
  if (veggies.length) {
    h += '<details style="margin-bottom:12px;"><summary style="font-size:12px;font-weight:700;color:var(--blue-dark);cursor:pointer;margin-bottom:7px;">🥬 채소·작물 ('+veggies.length+'종)</summary>'
       + '<div style="display:flex;flex-wrap:wrap;gap:5px;margin-top:7px;">';
    veggies.forEach(function(p) {
      var short = (p.name||'').slice(0,8);
      h += '<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;background:#fff;border:1.5px solid var(--blue-mid);border-radius:8px;font-size:11px;cursor:pointer;" onclick="toggleCropCard(this)">'
         + '<input type="checkbox" class="crop-select" value="'+esc(p.name||'')+'" data-short="'+esc(short)+'" style="display:none;" onchange="_syncCropToDropdown(this)">'
         + (p.emoji||'🌿')+' <span>'+esc(short)+'</span>'
         + '</label>';
    });
    h += '</div></details>';
  }

  
  h += '<div id="selected-crops-display" style="min-height:32px;padding:6px 8px;background:rgba(255,255,255,0.6);border-radius:8px;font-size:12px;color:var(--gray-500);">작물을 선택하면 여기에 표시됩니다</div>'
     + '</div>';

  
  h += '<div style="background:var(--blue-light);border:1.5px solid var(--blue-mid);border-radius:12px;padding:12px;margin-bottom:14px;">';
  h += '<div style="font-size:14px;font-weight:700;color:var(--blue-dark);margin-bottom:10px;">🔍 PSIS 농약 검색 · 교차방제 추천</div>';
  h += '<div style="margin-bottom:8px;"><div style="font-size:10px;font-weight:600;color:var(--gray-500);margin-bottom:4px;">용도</div>';
  h += '<div style="display:flex;flex-wrap:wrap;gap:4px;" id="psis-use-btns">';
  ['전체','살균','살충','균충','충초','제초','생조','기타'].forEach(function(u){var on=u==='전체';h+='<button onclick="_psisToggleUse(this,\''+u+'\')" data-use="'+u+'" style="padding:5px 10px;border-radius:16px;font-size:11px;cursor:pointer;border:1.5px solid '+(on?'var(--blue-dark);background:var(--blue-dark);color:#fff;font-weight:700':'var(--gray-200);background:#fff;color:#555')+'">'+u+'</button>';});
  h += '</div></div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:8px;">';
  h += '<div><div style="font-size:10px;font-weight:600;color:var(--gray-500);margin-bottom:4px;">🌿 작물명 (최대 4개)</div>';
  h += '<div style="font-size:9px;color:var(--blue-dark);margin-bottom:4px;">※ STEP1 자동입력 또는 직접 수정 가능</div>';
  for(var _ci=1;_ci<=4;_ci++){h+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;"><input type="text" id="psis-crop-'+_ci+'" placeholder="작물'+(_ci>1?' '+_ci:'')+' 입력" style="flex:1;padding:6px 8px;border:1px solid var(--gray-200);border-radius:6px;font-size:12px;background:#fff;" oninput="_onCropInputChange(this,'+_ci+')"></div>';}
  h += '</div>';
  h += '<div><div style="font-size:10px;font-weight:600;color:var(--gray-500);margin-bottom:4px;">🦠 병해충명 (최대 4개)</div>';
  h += '<div style="font-size:9px;color:var(--gray-400);margin-bottom:4px;">직접 입력하세요</div>';
  for(var _di=1;_di<=4;_di++){h+='<div style="display:flex;align-items:center;gap:4px;margin-bottom:4px;"><input type="text" id="psis-dis-'+_di+'" placeholder="병해충'+(_di>1?' '+_di:'')+'" style="flex:1;padding:6px 8px;border:1px solid var(--gray-200);border-radius:6px;font-size:12px;"></div>';}
  h += '</div></div>';
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:10px;">';
  h += '<div><div style="font-size:10px;font-weight:600;color:var(--gray-500);margin-bottom:3px;">상표명</div><input type="text" id="psis-brand" placeholder="예: 코니도" style="width:100%;padding:6px 8px;border:1px solid var(--gray-200);border-radius:6px;font-size:12px;box-sizing:border-box;"></div>';
  h += '<div><div style="font-size:10px;font-weight:600;color:var(--gray-500);margin-bottom:3px;">품목명(성분)</div><input type="text" id="psis-ingredient" placeholder="예: 이미다클로프리드" style="width:100%;padding:6px 8px;border:1px solid var(--gray-200);border-radius:6px;font-size:12px;box-sizing:border-box;"></div>';
  h += '<div><div style="font-size:10px;font-weight:600;color:var(--gray-500);margin-bottom:3px;">작용기작(MOA)</div><input type="text" id="psis-moa" placeholder="예: 4A, 1B" style="width:100%;padding:6px 8px;border:1px solid var(--gray-200);border-radius:6px;font-size:12px;box-sizing:border-box;"></div>';
  h += '<div><div style="font-size:10px;font-weight:600;color:var(--gray-500);margin-bottom:3px;">법인명</div><input type="text" id="psis-company" placeholder="예: 팜한농" style="width:100%;padding:6px 8px;border:1px solid var(--gray-200);border-radius:6px;font-size:12px;box-sizing:border-box;"></div>';
  h += '</div>';
  h += '<div style="display:flex;gap:6px;">';
  h += '<button onclick="_psisSearchReset()" style="flex:1;padding:9px;border-radius:8px;border:1px solid var(--gray-200);background:#fff;font-size:13px;cursor:pointer;">초기화</button>';
  h += '<button onclick="doRecommend()" style="flex:2;padding:9px;border-radius:8px;background:var(--blue-dark);color:#fff;border:none;font-size:13px;font-weight:700;cursor:pointer;">🔍 검색 · 교차방제 추천</button>';
  h += '</div>';
  h += '<div style="margin-top:8px;padding:8px 10px;background:#FFF8E1;border-radius:8px;font-size:11px;color:#E65100;line-height:1.7;">';
  h += '💡 <b>방제 스케줄 생성 순서</b><br>';
  h += '① 위에서 작물·병해충 검색 → 추천 농약 확인<br>';
  h += '② STEP 2에서 <b>방제 목적</b> 선택 (예방: 긴 간격 / 발생후: 짧은 간격)<br>';
  h += '③ [📅 방제 스케줄 생성] 클릭';
  h += '</div>';
  h += '<div id="recommend-result" style="margin-top:10px;"></div>';
  h += '</div>';
  // ═══════════════════════════════════════════════════════

  h += '<div style="background:#fff;border:1.5px solid var(--gray-200);border-radius:14px;padding:16px;margin-bottom:12px;">'
     + '<div style="font-size:16px;font-weight:800;color:var(--gray-700);margin-bottom:14px;">⚙️ STEP 2 — 방제 조건 설정</div>';

  
  h += '<div style="margin-bottom:12px;">'
     + '<div style="font-size:12px;font-weight:600;color:var(--gray-600);margin-bottom:4px;">방제 목적 <span style="font-size:10px;font-weight:400;color:#aaa;">(간격이 달라짐)</span></div>'

     + '<div style="display:flex;gap:8px;">'
     + '<label onclick="toggleModeBtn(this,\'preventive\')" id="mode-preventive" style="flex:1;display:flex;flex-direction:column;align-items:center;padding:10px;background:var(--green-dark);color:#fff;border-radius:10px;border:2px solid var(--green-dark);cursor:pointer;">'
     + '<input type="radio" name="spray-mode" value="preventive" checked style="display:none;">'
     + '<span style="font-size:18px;margin-bottom:3px;">🛡</span>'
     + '<span style="font-size:12px;font-weight:700;">예방 살포</span>'
     + '<span style="font-size:10px;opacity:0.85;">병충해 발생 전</span>'
     + '</label>'
     + '<label onclick="toggleModeBtn(this,\'outbreak\')" id="mode-outbreak" style="flex:1;display:flex;flex-direction:column;align-items:center;padding:10px;background:#fff;color:var(--red-dark);border-radius:10px;border:2px solid #EF9A9A;cursor:pointer;">'
     + '<input type="radio" name="spray-mode" value="outbreak" style="display:none;">'
     + '<span style="font-size:18px;margin-bottom:3px;">🚨</span>'
     + '<span style="font-size:12px;font-weight:700;">발생 후 방제</span>'
     + '<span style="font-size:10px;opacity:0.7;">병충해 이미 발생</span>'
     + '</label></div></div>';

  
  var today = new Date();
  var todayStr = today.toISOString().slice(0,10);
  h += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-bottom:12px;">'
     + '<div><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:3px;">1차 방제 예정일</label>'
     + '<input type="date" id="spray-start-date" value="'+todayStr+'" style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;box-sizing:border-box;"></div>'
     + '<div><label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:3px;">방제 횟수</label>'
     + '<select id="spray-rounds-new" style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;">'
     + '<option value="2">2회</option><option value="3" selected>3회</option><option value="4">4회</option>'
     + '</select></div></div>';

  
  h += '<div style="margin-bottom:12px;">'
     + '<label style="font-size:11px;color:var(--gray-500);display:block;margin-bottom:3px;">방제 대상 병해충 (선택)</label>'
     + '<input type="text" id="spray-disease-new" placeholder="예: 탄저병, 진딧물 (빈칸이면 전체)" style="width:100%;padding:8px;border:1.5px solid var(--gray-200);border-radius:8px;font-size:13px;box-sizing:border-box;"></div>';

  
  h += '<div style="margin-bottom:14px;">'
     + '<div style="font-size:11px;color:var(--gray-500);margin-bottom:6px;">선호 방제 요일</div>'
     + '<div style="display:flex;gap:6px;">'
     + ['nearest:가장 가까운 주말','sat:토요일 기준','sun:일요일 기준'].map(function(s){
         var v = s.split(':')[0]; var l = s.split(':')[1];
         return '<label style="flex:1;text-align:center;padding:7px;background:'+(v==='nearest'?'var(--blue-dark)':'#fff')+';color:'+(v==='nearest'?'#fff':'var(--gray-600)')+';border:1.5px solid '+(v==='nearest'?'var(--blue-dark)':'var(--gray-200)')+';border-radius:8px;font-size:11px;cursor:pointer;" id="wpref-'+v+'" onclick="toggleWeekPref(\''+v+'\')">'
               + '<input type="radio" name="weekend-pref" value="'+v+'" '+(v==='nearest'?'checked':'')+' style="display:none;">'+l+'</label>';
       }).join('')
     + '</div></div>';

  h += '<button onclick="generateSchedule()" style="width:100%;padding:13px;background:var(--green-dark);color:#fff;border-radius:10px;border:none;font-size:14px;font-weight:800;cursor:pointer;letter-spacing:0.3px;">'
     + '📅 방제 스케줄 생성</button>'
     + '</div>';

  
  h += '<div id="schedule-result"></div>';

  

  container.innerHTML = h;
}

function toggleCropCard(label) {
  var cb = label.querySelector('input[type=checkbox]');
  if (!cb) return;
  cb.checked = !cb.checked;
  if (cb.checked) {
    label.style.background = 'var(--green-dark)';
    label.style.color      = '#fff';
    label.style.borderColor= 'var(--green-dark)';
  } else {
    label.style.background  = '#fff';
    label.style.color       = '';
    label.style.borderColor = 'var(--green-mid)';
  }
  
  var checked = Array.from(document.querySelectorAll('.crop-select:checked')).map(function(c){ return c.dataset.short||c.value; });
  var disp    = document.getElementById('selected-crops-display');
  if (disp) {
    if (checked.length) {
      disp.innerHTML = '<span style="color:var(--green-dark);font-weight:600;">선택: </span>'
        + checked.map(function(n){ return '<span style="background:var(--green-dark);color:#fff;padding:2px 8px;border-radius:6px;font-size:11px;margin-right:4px;">'+esc(n)+'</span>'; }).join('');
    } else {
      disp.textContent = '작물을 선택하면 여기에 표시됩니다';
      disp.style.color = 'var(--gray-500)';
    }
  }
}

function toggleModeBtn(label, mode) {
  document.querySelectorAll('[id^="mode-"]').forEach(function(el){
    el.style.background  = '#fff';
    el.style.color       = '';
    el.style.borderColor = '#EF9A9A';
  });
  label.style.background  = mode==='preventive' ? 'var(--green-dark)' : '#C62828';
  label.style.color       = '#fff';
  label.style.borderColor = mode==='preventive' ? 'var(--green-dark)' : '#C62828';
  var rb = label.querySelector('input[type=radio]');
  if (rb) rb.checked = true;
}

function toggleWeekPref(pref) {
  ['nearest','sat','sun'].forEach(function(v){
    var el = document.getElementById('wpref-'+v);
    if (!el) return;
    el.style.background  = v===pref ? 'var(--blue-dark)' : '#fff';
    el.style.color       = v===pref ? '#fff' : 'var(--gray-600)';
    el.style.borderColor = v===pref ? 'var(--blue-dark)' : 'var(--gray-200)';
  });
  var rb = document.querySelector('input[name="weekend-pref"][value="'+pref+'"]');
  if (rb) rb.checked = true;
}

function generateSchedule() {
  var crops    = Array.from(document.querySelectorAll('.crop-select:checked')).map(function(c){ return c.value; });

  var modeEl   = document.querySelector('input[name="spray-mode"]:checked');
  var mode     = modeEl ? modeEl.value : 'preventive';
  var startStr = (document.getElementById('spray-start-date')||{}).value || new Date().toISOString().slice(0,10);
  var rounds   = parseInt((document.getElementById('spray-rounds-new')||{}).value||3);
  var disease  = (document.getElementById('spray-disease-new')||{}).value||'';
  var wprefEl  = document.querySelector('input[name="weekend-pref"]:checked');
  var wpref    = wprefEl ? wprefEl.value : 'nearest';
  var out      = document.getElementById('schedule-result');

  if (!crops.length) { showToast('작물을 1개 이상 선택하세요'); return; }

  // PSIS 검색 결과가 있으면 해당 농약으로 스케줄 생성
  var psisRounds = window._lastPsisResult && window._lastPsisResult.rounds;
  var sched;
  if (psisRounds && psisRounds.length) {
    sched = buildSprayScheduleFromPsis({
      psisRounds:  psisRounds,
      crops:       crops,
      mode:        mode,
      startDate:   new Date(startStr),
      rounds:      Math.max(rounds, psisRounds.length),
      disease:     disease,
      weekendPref: wpref,
    });
  } else {
    sched = buildSpraySchedule({
      crops:       crops,
      mode:        mode,
      startDate:   new Date(startStr),
      rounds:      rounds,
      disease:     disease,
      weekendPref: wpref,
    });
  }

  out.innerHTML = renderScheduleResult(sched);
  out.scrollIntoView({behavior:'smooth', block:'start'});
}

function renderScheduleResult(sched) {
  var roundColors = ['#1B5E20','#1565C0','#E65100','#6A1B9A'];

  var h = '<div style="margin-top:4px;">';

  
  h += '<div style="background:var(--green-dark);color:#fff;border-radius:12px 12px 0 0;padding:14px 16px;">'
     + '<div style="font-size:15px;font-weight:800;margin-bottom:4px;">'
     + (sched.mode==='preventive'?'🛡 예방 방제 스케줄':'🚨 병충해 발생 후 방제 스케줄')+'</div>'
     + '<div style="font-size:12px;opacity:0.9;">작물: '+esc(sched.crops.join(' · '))+' | 방제간격: '+sched.interval+'일 | 총 '+sched.rounds+'회</div>'
     + (sched.disease?'<div style="font-size:11px;opacity:0.8;margin-top:2px;">대상: '+esc(sched.disease)+'</div>':'')
     + '</div>';

  
  h += '<div style="background:#fff;border:1.5px solid var(--green-mid);border-radius:0 0 12px 12px;padding:14px;margin-bottom:14px;">';

  sched.schedule.forEach(function(r) {
    var bc = roundColors[(r.round-1)%4];
    var isExact = r.diffDays===0;
    var diffNote = isExact ? '(기준일이 주말)' :
                   '(기준일 '+Math.abs(r.weekendDiff||r.diffDays)+'일 '+( (r.weekendDir||r.diffDir)==='후'?'뒤 주말':'앞 주말')+')';

    h += '<div style="display:flex;gap:12px;margin-bottom:16px;">'
       
       + '<div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;">'
       + '<div style="width:36px;height:36px;border-radius:50%;background:'+bc+';color:#fff;font-size:16px;font-weight:900;display:flex;align-items:center;justify-content:center;">'+r.round+'</div>'
       + (r.round<sched.rounds?'<div style="width:2px;flex:1;background:#E0E0E0;margin:4px 0;min-height:20px;"></div>':'')
       + '</div>'
       
       + '<div style="flex:1;padding-top:4px;">'
       + '<div style="display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;margin-bottom:6px;">'
       + '<span style="font-size:15px;font-weight:800;color:'+bc+';">'+fmtDate(r.sprayDate)+'</span>'
       + (!isExact?'<span style="font-size:10px;color:var(--gray-400);">'+esc(diffNote)+'</span>':'')
       + '</div>';

    
    if (r.pesticides && r.pesticides.length) {
      h += '<div style="background:'+bc+'11;border:1px solid '+bc+'33;border-radius:8px;padding:10px;margin-bottom:6px;">'
         + '<div style="font-size:11px;font-weight:700;color:'+bc+';margin-bottom:7px;">💊 이 날 사용할 농약 (물 20L 기준)</div>'
         + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
         + '<thead><tr style="background:'+bc+';color:#fff;">'
         + '<th style="padding:4px 7px;text-align:left;">농약</th>'
         + '<th style="padding:4px 7px;text-align:center;">계통(MOA)</th>'
         + '<th style="padding:4px 7px;text-align:center;">20L당</th>'
         + '<th style="padding:4px 7px;text-align:center;">안전사용</th>'
         + '</tr></thead><tbody>';
      r.pesticides.forEach(function(p,i) {
        var moaInfo = getMoaInfo(p.moa);
        var myHave  = (window._myPesticideList||[]).some(function(m){
          return m.status!=='empty' && (m.name||'').replace(/\s/g,'')===(p.name||'').replace(/\s/g,'');
        });
        h += '<tr style="'+(i%2?'background:rgba(255,255,255,0.5);':'')+'">'
           + '<td style="padding:4px 7px;font-weight:600;">'+(myHave?'✅ ':'')+esc(p.name)+'</td>'
           + '<td style="padding:4px 7px;text-align:center;">'
           + (moaInfo?'<span style="font-size:9px;padding:1px 5px;border-radius:4px;background:'+moaInfo.color+'22;color:'+moaInfo.color+';">'+esc(moaInfo.name)+'</span>':'')
           + '</td>'
           + '<td style="padding:4px 7px;text-align:center;font-weight:700;color:'+bc+';">'+esc(p.per20L||p.amount||'-')+'</td>'
           + '<td style="padding:4px 7px;text-align:center;color:#E65100;font-size:10px;">'+esc(p.safety||p.useSuittime||_getPsisSafety(p.name)||p.safetyPrd||'')+'</td>'
           + '</tr>';
      });
      h += '</tbody></table></div>';
    } else {
      h += '<div style="padding:8px;background:var(--gray-50);border-radius:7px;font-size:11px;color:var(--gray-500);">해당 작물 공통 적용 농약을 내 농약장에서 확인하세요</div>';
    }

    
    h += '</div></div>';
  });

  
  h += '<div style="background:#FFF3E0;border:1px solid #FFB74D;border-radius:8px;padding:10px;margin-top:4px;">'
     + '<div style="font-size:12px;font-weight:700;color:#E65100;margin-bottom:5px;">⚠️ 수확 전 안전사용 기준</div>'
     + '<div style="font-size:11px;color:#555;line-height:1.8;">';
  sched.crops.forEach(function(crop) {
    var baseKey = Object.keys(PRE_HARVEST_DAYS).find(function(k){ return crop.includes(k); }) || 'default';
    var days    = PRE_HARVEST_DAYS[baseKey];
    h += '• '+esc(crop)+': 수확 <b>'+days+'일 전</b> 이후 농약 살포 금지<br>';
  });
  h += '</div></div>';

  
  h += '<div style="display:flex;gap:6px;margin-top:12px;">'
     + '<button onclick="saveScheduleToGAS(window._lastSchedule)" style="flex:2;padding:11px;background:var(--green-dark);color:#fff;border-radius:9px;border:none;font-size:13px;font-weight:700;cursor:pointer;">💾 Google Sheets에 저장</button>'
     + '<button onclick="generateSchedule()" style="flex:1;padding:11px;background:#fff;border:1px solid var(--gray-200);border-radius:9px;font-size:12px;cursor:pointer;">🔄 재생성</button>'
     + '</div>';

  h += '</div></div>';
  window._lastSchedule = sched;
  return h;
}

function showHarvestSchedule(plantId) {
  var plant = (window._allPlants||[]).find(function(p){ return p.id===plantId; });
  if (!plant) return;
  var hs  = buildHarvestSchedule(plant, 'nearest');
  if (!hs) { showToast('심은 날짜 또는 수확 예정일 정보가 없습니다'); return; }
  var out = document.getElementById('harvest-detail-result');
  if (out) { out.innerHTML = renderHarvestSchedule(hs); out.scrollIntoView({behavior:'smooth',block:'start'}); }
}

function renderHarvestSchedule(hs) {
  var h = '<div style="background:#fff;border:1.5px solid #A5D6A7;border-radius:12px;padding:14px;margin-top:10px;">';
  h += '<div style="font-size:14px;font-weight:800;color:#1B5E20;margin-bottom:12px;">📅 '+esc(hs.name)+' 재배 달력</div>';

  
  var now = new Date();
  var total = hs.harvestDate - hs.plantDate;
  var elapsed = Math.max(0, now - hs.plantDate);
  var pct = Math.min(100, Math.round(elapsed/total*100));

  h += '<div style="margin-bottom:14px;">'
     + '<div style="display:flex;justify-content:space-between;font-size:10px;color:var(--gray-500);margin-bottom:4px;">'
     + '<span>심은 날: '+fmtShort(hs.plantDate)+'</span>'
     + '<span>수확 예정: '+fmtShort(hs.harvestDate)+'</span>'
     + '</div>'
     + '<div style="height:8px;background:var(--gray-200);border-radius:4px;overflow:hidden;">'
     + '<div style="height:100%;width:'+pct+'%;background:linear-gradient(90deg,var(--green-dark),#8BC34A);border-radius:4px;"></div>'
     + '</div>'
     + '<div style="font-size:10px;color:var(--gray-500);margin-top:3px;text-align:right;">진행률 '+pct+'%</div>'
     + '</div>';

  
  h += '<div style="font-size:12px;font-weight:700;color:var(--gray-700);margin-bottom:8px;">🗓 주요 일정</div>';
  hs.milestones.forEach(function(m) {
    var isPast = new Date(m.date) < now;
    h += '<div style="display:flex;gap:10px;margin-bottom:10px;opacity:'+(isPast?'0.5':'1')+'">'
       + '<div style="flex:0 0 auto;width:28px;height:28px;border-radius:50%;background:'+m.color+';display:flex;align-items:center;justify-content:center;font-size:13px;">'
       + (m.type==='harvest'?'🍇':m.type==='spray'?'💊':m.type==='microbe'?'🦠':'🌱')
       + '</div>'
       + '<div style="flex:1;">'
       + '<div style="font-size:12px;font-weight:700;color:'+m.color+';">'+esc(m.label)+'</div>'
       + '<div style="font-size:13px;font-weight:600;color:var(--gray-800);">'+fmtDate(m.weekendDate)+'</div>'
       + (Math.abs(m.weekendDiff)>0?'<div style="font-size:10px;color:var(--gray-400);">기준일 '+Math.abs(m.weekendDiff)+'일 '+m.weekendDir+' 주말</div>':'')
       + '<div style="font-size:11px;color:var(--gray-500);margin-top:2px;">'+esc(m.note)+'</div>'
       + '</div></div>';
  });

  
  if (hs.fertSchedule.length) {
    h += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--gray-200);">'
       + '<div style="font-size:12px;font-weight:700;color:var(--blue-dark);margin-bottom:8px;">🌱 비료·영양제 추천 스케줄</div>'
       + '<table style="width:100%;border-collapse:collapse;font-size:11px;">'
       + '<thead><tr style="background:var(--blue-dark);color:#fff;">'
       + '<th style="padding:4px 7px;text-align:left;">주차</th>'
       + '<th style="padding:4px 7px;text-align:left;">추천 주말</th>'
       + '<th style="padding:4px 7px;text-align:left;">추천 내용</th>'
       + '</tr></thead><tbody>';
    hs.fertSchedule.forEach(function(f,i) {
      var isPast = new Date(f.date) < now;
      h += '<tr style="'+(isPast?'opacity:0.4;':'')+(i%2?'background:var(--gray-50);':'')+'">'
         + '<td style="padding:5px 7px;font-weight:600;">'+f.week+'주차</td>'
         + '<td style="padding:5px 7px;color:var(--blue-dark);font-weight:600;">'+fmtShort(f.weekendDate)+'</td>'
         + '<td style="padding:5px 7px;color:var(--gray-600);">'+esc(f.note)+'</td>'
         + '</tr>';
    });
    h += '</tbody></table></div>';
  }

  h += '</div>';
  return h;
}

async function saveScheduleToGAS(sched) {
  if (!sched) { showToast('저장할 스케줄이 없습니다'); return; }
  try {
    await _gasPost(Object.assign({ action:'addSpraySchedule' },{
      crops:     sched.crops,
      mode:      sched.mode,
      disease:   sched.disease,
      rounds:    sched.rounds,
      firstDate: sched.firstDate.toISOString(),
      schedule:  sched.schedule.map(function(r){
        return {round:r.round, date:r.sprayDate.toISOString(), pests:r.pesticides.map(function(p){return p.name;})};
      }),
      createdAt: new Date().toISOString(),
    }));
    showToast('✅ 방제 스케줄이 저장됐습니다');
  } catch(e) { showToast('저장 실패: '+e.message); }
}

var _logViewMode = 'date'; // 'date' | 'plant'

function setLogView(mode) {
  _logViewMode = mode;
  
  var datBtn = document.getElementById('log-view-date');
  var pltBtn = document.getElementById('log-view-plant');
  if (datBtn) {
    datBtn.style.background   = mode==='date' ? 'var(--green-dark)' : '#fff';
    datBtn.style.color        = mode==='date' ? '#fff' : 'var(--gray-600)';
    datBtn.style.border       = mode==='date' ? 'none' : '1px solid var(--gray-200)';
  }
  if (pltBtn) {
    pltBtn.style.background   = mode==='plant' ? 'var(--green-dark)' : '#fff';
    pltBtn.style.color        = mode==='plant' ? '#fff' : 'var(--gray-600)';
    pltBtn.style.border       = mode==='plant' ? 'none' : '1px solid var(--gray-200)';
  }
  renderLogs();
}

function renderLogsByPlant() {
  var el = document.getElementById('log-list');
  if (!el) return;

  var logs = APP.logs || [];
  if (!logs.length) {
    el.innerHTML = '<div class="empty-state"><span class="emoji">📖️</span><p>기록이 없습니다.</p></div>';
    return;
  }

  
  var groups = {}; 
  logs.forEach(function(log) {
    var name = (log.plantName || log.plant || '기타').trim();
    if (!groups[name]) {
      groups[name] = {
        name:       name,
        logs:       [],
        latestDate: '',
        plant:      getPlantInfo(name) || null,
      };
    }
    groups[name].logs.push(log);
    var d = (log.date||'').slice(0,10);
    if (d > groups[name].latestDate) groups[name].latestDate = d;
  });

  
  var sorted = Object.values(groups).sort(function(a,b) {
    return a.latestDate > b.latestDate ? -1 : 1;
  });

  var TICON = {
    '농약살포':'🌿','시비':'🌱','파종':'🌾','수확':'🍎','순치기':'✂️',
    '병해충':'🐛','기타':'📝','정식':'🌱','개화':'🌸','착과':'🍊',
    '천연자재':'🧪','제초':'🌿','물주기':'💧','비닐걷음':'🎉',
    '1차시비':'🌱','2차시비':'🌱','3차시비':'🌱','땅콩수확':'🥜',
  };

  var h = '';
  sorted.forEach(function(group) {
    var p          = group.plant;
    var emoji      = (p && p.emoji) || '🌿';
    var hasPlant   = !!p;
    var plantDate  = p && p.plantDate  ? p.plantDate.slice(0,10)  : '';
    var harvestDate= p && p.harvestDate? p.harvestDate.slice(0,10) : '';
    var logCount   = group.logs.length;
    var latest     = group.latestDate;
    var isToday    = latest === TODAY_STR;

    
    h += '<div style="margin-bottom:16px;">'
       + '<div style="display:flex;align-items:center;gap:8px;padding:10px 12px;'
       + 'background:linear-gradient(135deg,var(--green-light),#F1F8E9);'
       + 'border:1.5px solid var(--green-mid);border-radius:12px 12px 0 0;'
       + 'cursor:pointer;" onclick="togglePlantLogGroup(this)">'
       + '<span style="font-size:22px;">'+emoji+'</span>'
       + '<div style="flex:1;">'
       + '<div style="font-size:14px;font-weight:800;color:var(--green-dark);">'+esc(group.name)+'</div>'
       + '<div style="font-size:10px;color:var(--gray-500);margin-top:1px;">'
       + (plantDate ? '심은 날: '+plantDate+' · ' : '')
       + logCount+'건 기록 · 최근: '
       + '<span style="'+(isToday?'color:var(--green-dark);font-weight:700;':'')+'">'
       + (isToday ? '오늘' : latest)
       + '</span></div>'
       + '</div>'
       
       + '<span class="plant-group-toggle" style="font-size:16px;color:var(--gray-400);">▼</span>'
       + '</div>';

    
    if (hasPlant && (plantDate || harvestDate || (p.note))) {
      h += '<div class="plant-log-info" style="background:var(--gray-50);border:1px solid var(--green-mid);'
         + 'border-top:none;padding:8px 12px;font-size:11px;color:var(--gray-600);line-height:1.9;">'
         + (plantDate  ? '🌱 심은 날: <b>'+plantDate+'</b>　' : '')
         + (harvestDate? '🍎 수확예정: <b>'+harvestDate+'</b>　' : '')
         + (p.location ? '📍 위치: '+esc(p.location)+'　' : '')
         + (p.note     ? '📝 '+esc(p.note) : '')
         + '</div>';
    }

    
    
    var sortedLogs = group.logs.slice().sort(function(a,b) {
      var da = (a.date||'').slice(0,10);
      var db_ = (b.date||'').slice(0,10);
      return da > db_ ? -1 : da < db_ ? 1 : 0;
    });

    h += '<div class="plant-log-body" style="border:1.5px solid var(--green-mid);border-top:none;border-radius:0 0 12px 12px;overflow:hidden;">';

    var lastDateInGroup = '';
    sortedLogs.forEach(function(log, li) {
      var dateStr = (log.date||'').slice(0,10);
      var isTodayLog = dateStr === TODAY_STR;

      
      if (dateStr !== lastDateInGroup) {
        lastDateInGroup = dateStr;
        h += '<div style="padding:6px 12px;background:'+(isTodayLog?'var(--green-dark)':'var(--gray-100)')+';'
           + 'font-size:11px;font-weight:700;color:'+(isTodayLog?'#fff':'var(--gray-600)')+';'
           + 'border-top:'+(li>0?'1px solid var(--gray-200)':'none')+';">'
           + (isTodayLog ? '📅 오늘 · ' : '') + dateStr
           + '</div>';
      }

      var typeLbl = log.eventType || log.type || '기타';
      var icon    = TICON[typeLbl] || '📝';
      var detail  = log.detail || log.note || '';
      var material= log.material || '';
      var canEdit = !!log.id && !log.id.startsWith('new_');

      h += '<div style="display:flex;gap:10px;padding:9px 12px;border-top:0.5px solid var(--gray-100);'
         + 'background:'+(li%2===0?'#fff':'var(--gray-50)')+'">'
         
         + '<div style="flex:0 0 auto;display:flex;flex-direction:column;align-items:center;padding-top:2px;">'
         + '<div style="width:24px;height:24px;border-radius:50%;background:var(--green-dark);'
         + 'color:#fff;font-size:12px;display:flex;align-items:center;justify-content:center;">'+icon+'</div>'
         + (li<sortedLogs.length-1?'<div style="width:1.5px;flex:1;background:var(--green-mid);margin:3px 0;min-height:8px;"></div>':'')
         + '</div>'
         
         + '<div style="flex:1;padding-top:2px;">'
         + '<div style="display:flex;align-items:center;gap:6px;margin-bottom:2px;">'
         + '<span style="font-size:12px;font-weight:700;color:var(--green-dark);">'+esc(typeLbl)+'</span>'
         + (log.time?'<span style="font-size:10px;color:var(--gray-400);">'+esc(log.time)+'</span>':'')
         + (log._col==='workLogs'?'<span style="font-size:9px;padding:1px 5px;background:var(--blue-light);color:var(--blue-dark);border-radius:4px;">작업일지</span>':'')
         + '</div>'
         + (material?'<div style="font-size:11px;color:var(--blue-dark);margin-bottom:2px;">📦 '+esc(material)+'</div>':'')
         + (detail?'<div style="font-size:12px;color:var(--gray-700);line-height:1.6;">'+esc(detail)+'</div>':'')
         + '</div>'
         
         + (canEdit?'<button onclick="openEditLog(\''+esc(log.id)+'\',\''+esc(log._col||'growRecords')+'\')" '
           +'style="flex:0 0 auto;padding:4px 8px;background:#fff;border:1px solid var(--gray-200);'
           +'border-radius:6px;font-size:10px;color:var(--gray-500);cursor:pointer;align-self:flex-start;">수정</button>':'')
         + '</div>';
    });

    h += '</div></div>'; 
  });

  el.innerHTML = h;
}

function togglePlantLogGroup(header) {
  var parent = header.parentElement;
  var body   = parent.querySelector('.plant-log-body');
  var info   = parent.querySelector('.plant-log-info');
  var icon   = header.querySelector('.plant-group-toggle');
  if (!body) return;
  var hidden = body.style.display === 'none';
  body.style.display = hidden ? '' : 'none';
  if (info) info.style.display = hidden ? '' : 'none';
  if (icon) icon.textContent   = hidden ? '▼' : '▶';
}

var _origRenderLogs = renderLogs;
renderLogs = function() {
  if (_logViewMode === 'plant') {
    renderLogsByPlant();
  } else {
    _origRenderLogs();
  }
};

var _logSearchQuery = '';
function filterLogs(q) {
  _logSearchQuery = (q||'').toLowerCase().trim();
  renderLogs();
}

var _origRenderLogsByPlant = renderLogsByPlant;
renderLogsByPlant = function() {
  if (!_logSearchQuery) { _origRenderLogsByPlant(); return; }
  
  var origLogs = APP.logs;
  var q = _logSearchQuery;
  APP.logs = origLogs.filter(function(l) {
    return [(l.plantName||''),(l.plant||''),(l.detail||''),(l.note||''),
            (l.material||''),(l.eventType||''),(l.type||'')].some(function(v){
      return v.toLowerCase().includes(q);
    });
  });
  _origRenderLogsByPlant();
  APP.logs = origLogs;
};

var _origRenderLogs2 = _origRenderLogs;
_origRenderLogs = function() {
  if (!_logSearchQuery) { _origRenderLogs2(); return; }
  var origLogs = APP.logs;
  var q = _logSearchQuery;
  APP.logs = origLogs.filter(function(l) {
    return [(l.plantName||''),(l.plant||''),(l.detail||''),(l.note||''),
            (l.material||''),(l.eventType||''),(l.type||'')].some(function(v){
      return v.toLowerCase().includes(q);
    });
  });
  _origRenderLogs2();
  APP.logs = origLogs;
};

function initClaudeKeyUI() {
  var key    = localStorage.getItem('claude_api_key') || '';
  var inp    = document.getElementById('claude-key-input');
  var status = document.getElementById('claude-key-status');
  if (!inp) return;

  if (key) {
    inp.placeholder = '●●●●●●●●' + key.slice(-6) + ' (저장됨)';
    inp.value = '';
    if (status) {
      status.innerHTML = '<span style="color:var(--green-dark);">✅ API 키 설정됨 — AI 기능 활성화</span>';
    }
  } else {
    inp.placeholder = 'sk-ant-api03-...';
    if (status) {
      status.innerHTML = '<span style="color:var(--gray-400);">미설정 — AI 기능 비활성화</span>';
    }
  }
}

function saveClaudeKey() {
  var inp    = document.getElementById('claude-key-input');
  var status = document.getElementById('claude-key-status');
  var key    = inp ? inp.value.trim() : '';

  if (!key) {
    if (status) status.innerHTML = '<span style="color:#E65100;">키를 입력하세요 (sk-ant-api03-...)</span>';
    return;
  }
  if (!key.startsWith('sk-ant-')) {
    if (status) status.innerHTML = '<span style="color:#C62828;">❌ 올바른 키 형식이 아닙니다 (sk-ant-로 시작해야 합니다)</span>';
    return;
  }

  localStorage.setItem('claude_api_key', key);
  if (inp) { inp.value = ''; inp.placeholder = '●●●●●●●●' + key.slice(-6) + ' (저장됨)'; }
  if (status) status.innerHTML = '<span style="color:var(--green-dark);">✅ 저장 완료! AI 기능이 활성화됩니다.</span>';
  showToast('✅ Claude API 키가 저장됐습니다');
}

function clearClaudeKey() {
  if (!confirm('Claude API 키를 삭제하시겠습니까? AI 기능이 비활성화됩니다.')) return;
  localStorage.removeItem('claude_api_key');
  var inp    = document.getElementById('claude-key-input');
  var status = document.getElementById('claude-key-status');
  if (inp) { inp.value = ''; inp.placeholder = 'sk-ant-api03-...'; }
  if (status) status.innerHTML = '<span style="color:var(--gray-400);">삭제됨 — AI 기능 비활성화</span>';
  showToast('🗑 Claude API 키가 삭제됐습니다');
}

function toggleClaudeKeyVisible() {
  var inp = document.getElementById('claude-key-input');
  if (!inp) return;
  inp.type = inp.type === 'password' ? 'text' : 'password';
}

async function testClaudeKey() {
  var inp    = document.getElementById('claude-key-input');
  var status = document.getElementById('claude-key-status');
  
  var key = (inp && inp.value.trim()) || localStorage.getItem('claude_api_key') || '';

  if (!key) {
    if (status) status.innerHTML = '<span style="color:#E65100;">⚠️ 키를 입력하거나 저장 후 테스트하세요</span>';
    return;
  }
  if (status) status.innerHTML = '<span style="color:var(--gray-400);">🔍 테스트 중...</span>';

  
  var gasUrl = (typeof getEffectiveGasUrl === 'function') ? getEffectiveGasUrl().trim() : '';

  // GAS URL 있으면 GAS 경유 테스트 (CORS 우회)
  if (gasUrl) {
    try {
      var ctrl = new AbortController();
      setTimeout(function(){ ctrl.abort(); }, 10000);
      var res = await fetch(gasUrl, {
        method: 'POST',
        headers: {'Content-Type':'text/plain'},
        body: JSON.stringify({action:'claude_relay', apiKey:key, prompt:'테스트. "OK"만 응답하세요.', maxTokens:30}),
        signal: ctrl.signal
      });
      var data = await res.json();
      if (data.ok || data.success) {
        if (status) status.innerHTML = '<span style="color:var(--green-dark);">✅ GAS 경유 AI 정상 작동!</span>';
        _saveClaudeKey(key, inp);
        return;
      }
    } catch(e) {}
  }

  // GAS URL 없거나 실패 시 → 직접 호출 (HTTPS 환경에서만 가능)
  try {
    var ctrl2 = new AbortController();
    setTimeout(function(){ ctrl2.abort(); }, 8000);
    var res2 = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 30,
        messages: [{role:'user', content:'테스트. "OK"만 응답하세요.'}]
      }),
      signal: ctrl2.signal
    });
    var data2 = await res2.json();
    if (data2.content && data2.content[0]) {
      if (status) status.innerHTML = '<span style="color:var(--green-dark);">✅ API 키 정상 확인!</span>';
      _saveClaudeKey(key, inp);
    } else if (data2.error) {
      if (status) status.innerHTML = '<span style="color:#C62828;">❌ ' + esc(data2.error.message||data2.error.type) + '</span>';
    }
  } catch(e) {
    if (e.name === 'AbortError' || e.message.includes('Load failed') || e.message.includes('fetch')) {
      // CORS 차단 → GAS URL로만 가능
      if (gasUrl) {
        if (status) status.innerHTML = '<span style="color:#E65100;">⚠️ 직접 호출 차단됨. GAS URL로 재시도 중...</span>';
      } else {
        if (status) status.innerHTML = '<span style="color:#E65100;">⚠️ 브라우저 CORS 차단 — ⚙️ 설정에서 GAS URL을 입력하면 해결됩니다.</span>';
      }
    } else {
      if (status) status.innerHTML = '<span style="color:#E65100;">⚠️ ' + esc(e.message) + '</span>';
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function(){ initGAS(); });
} else {
  initGAS();
}

const STRAIGHT_DB = {
  "가지": [
    {pest:"아메리카잎굴파리",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
  ],
  "감자": [
    {pest:"큰28점박이무당벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
  ],
  "갓": [
    {pest:"벼룩잎벌레, 북쪽비단노린재",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "강낭콩": [
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "거베라": [
    {pest:"꽃노랑총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"발생초기",times:"-"},
  ],
  "검역장소": [
    {pest:"개미류",method:"다발생기 전면살포",amount:"10ml",safety:"검역 시",times:"1회"},
  ],
  "경수채(교나)": [
    {pest:"무잎벌, 배추순나방, 벼룩잎벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "고구마": [
    {pest:"고구마뿔나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "고추(단고추류포함)": [
    {pest:"파리허리노린재",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"꽃노랑총채벌레, 대만총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"담배가루이, 뿔나방류",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"담배나방",method:"발생초기 10일 간격 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"차먼지응애",method:"신초피해 발생초기 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"큰28점박이무당벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
  ],
  "국화": [
    {pest:"꽃노랑총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"발생초기",times:"-"},
  ],
  "귀리": [
    {pest:"시골가시허리노린재",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "근대": [
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "글라디올러스": [
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"발생초기",times:"-"},
  ],
  "꽃양배추(브로콜리,콜리플라워포함)": [
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "냉이": [
    {pest:"벼룩잎벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "녹두": [
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "녹색꽃양배추(브로콜리)": [
    {pest:"배추좀나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "다채(비타민)": [
    {pest:"파밤나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "당근": [
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"파밤나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "동부": [
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "들깨(잎)": [
    {pest:"북쪽비단노린재",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"차먼지응애",method:"발생초부터 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "딸기": [
    {pest:"대만총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
    {pest:"작은뿌리파리",method:"발생초기 10일 간격 근부관주처리",amount:"10ml(100ml/주)",safety:"수확 3일 전",times:"2회"},
    {pest:"점박이응애",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
    {pest:"파밤나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
  ],
  "로케트(루꼴라)": [
    {pest:"벼룩잎벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"-"},
    {pest:"파밤나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"-"},
  ],
  "마늘": [
    {pest:"고자리파리",method:"월동 후 토양관주처리",amount:"10ml(1ℓ/㎡)",safety:"월동 직후",times:"1회"},
    {pest:"뿌리응애",method:"파종 전 침지처리",amount:"40ml",safety:"파종기",times:"1회"},
  ],
  "멜론": [
    {pest:"꽃노랑총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"담배가루이",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"차먼지응애",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"점박이응애",method:"발생초부터 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"파밤나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "무": [
    {pest:"꽃노랑총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"무잎벌",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"배추좀나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"벼룩잎벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"북쪽비단노린재",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"좋은가슴잎벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"파밤나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"벼룩잎벌레(무인헬기)",method:"발생초기 경엽처리",amount:"1.25ℓ",safety:"수확 14일 전",times:"2회"},
    {pest:"벼룩잎벌레(멀티콥터)",method:"발생초기 경엽처리",amount:"625ml",safety:"수확 14일 전",times:"2회"},
  ],
  "미나리": [
    {pest:"담배거세미나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "배청재": [
    {pest:"배추좀나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "배추": [
    {pest:"꽃노랑총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"무잎벌",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"배추순나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"배추좀나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"벼룩잎벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"파밤나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "배추(무인항공기)": [
    {pest:"벼룩잎벌레(무인헬기)",method:"발생초기 경엽처리",amount:"1.25ℓ",safety:"수확 14일 전",times:"2회"},
    {pest:"벼룩잎벌레(멀티콥터)",method:"발생초기 경엽처리",amount:"625ml",safety:"수확 14일 전",times:"2회"},
    {pest:"파밤나방(무인헬기)",method:"발생초기 경엽처리",amount:"1.25ℓ",safety:"수확 14일 전",times:"2회"},
    {pest:"파밤나방(멀티콥터)",method:"발생초기 경엽처리",amount:"625ml",safety:"수확 14일 전",times:"2회"},
  ],
  "백합": [
    {pest:"대만총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"발생초기",times:"-"},
  ],
  "보리": [
    {pest:"알락수염노린재",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"-"},
  ],
  "부추": [
    {pest:"고자리파리",method:"발생초기 토양관주처리",amount:"10ml(2ℓ/㎡)",safety:"수확 7일 전",times:"2회"},
    {pest:"꽃노랑총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"뿌리응애",method:"발생초기 토양관주처리",amount:"10ml(2ℓ/㎡)",safety:"수확 7일 전",times:"2회"},
    {pest:"작은뿌리파리",method:"발생초기 10일 간격 관주처리",amount:"10ml(2ℓ/㎡)",safety:"수확 7일 전",times:"2회"},
    {pest:"파밤나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"파총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "산딸기": [
    {pest:"담배거세미나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "산마늘(명이나물)": [
    {pest:"파총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "상추": [
    {pest:"꽃노랑총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"담배거세미나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"파밤나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "생강": [
    {pest:"파밤나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "수박(복수박포함)": [
    {pest:"꽃노랑총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"파밤나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "순무": [
    {pest:"담배거세미나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"무잎벌",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"벼룩잎벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "시금치": [
    {pest:"겨울배추진정응애",method:"엽당 3~5마리 발생 시 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"꽃노랑총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"파밤나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "심비디움": [
    {pest:"대만총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"발생초기",times:"-"},
  ],
  "쑥갓": [
    {pest:"꽃노랑총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"담배거세미나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"파밤나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "아스파라거스": [
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "양배추": [
    {pest:"꽃노랑총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"배추좀나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"파밤나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "양상추": [
    {pest:"꽃노랑총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"파밤나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "양파": [
    {pest:"고자리파리",method:"월동 후 관주처리",amount:"10ml(1ℓ/㎡)",safety:"월동 직후",times:"1회"},
    {pest:"파좀나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"파총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "여주": [
    {pest:"꽃노랑총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "영산홍": [
    {pest:"극동등에잎벌",method:"발생초기 경엽처리",amount:"10ml",safety:"발생초기",times:"-"},
  ],
  "오이": [
    {pest:"담배가루이",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"목화바둑명나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"오이긴털가루응애",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"아메리카잎굴파리",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"오이총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"점박이응애",method:"발생초부터 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
  ],
  "옥수수": [
    {pest:"열대거세미나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"왕담배나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "완두": [
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"완두굴파리",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "장미": [
    {pest:"꽃노랑총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"발생초기",times:"-"},
    {pest:"파밤나방",method:"발생초기 경엽처리",amount:"10ml",safety:"발생초기",times:"-"},
  ],
  "참외": [
    {pest:"꽃노랑총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
    {pest:"담배가루이",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
    {pest:"점박이응애",method:"발생초부터 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
  ],
  "카네이션": [
    {pest:"파밤나방",method:"발생초기 경엽처리",amount:"10ml",safety:"발생초기",times:"-"},
  ],
  "케일": [
    {pest:"담배거세미나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
    {pest:"벼룩잎벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일 전",times:"2회"},
  ],
  "콩": [
    {pest:"톱다리개미허리노린재(무인헬기)",method:"발생초기 경엽처리",amount:"1.25ℓ",safety:"수확 14일 전",times:"2회"},
    {pest:"톱다리개미허리노린재(멀티콥터)",method:"발생초기 경엽처리",amount:"625ml",safety:"수확 14일 전",times:"2회"},
    {pest:"담배거세미나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "토마토(방울토마토포함)": [
    {pest:"꽃노랑총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"담배가루이",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"뿔나방류",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"아메리카잎굴파리",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"왕담배나방",method:"발생초기 10일 간격 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
    {pest:"토마토녹응애",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 2일 전",times:"2회"},
  ],
  "파(쪽파포함)": [
    {pest:"뿌리응애",method:"발생초기 관주처리",amount:"1ℓ",safety:"수확 60일 전",times:"1회"},
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"파굴파리",method:"유충발생초기 10일 간격 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"파총채벌레",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
    {pest:"파밤나방",method:"발생초기 10일 간격 경엽처리",amount:"10ml",safety:"수확 14일 전",times:"2회"},
  ],
  "팥": [
    {pest:"담배거세미나방",method:"다발생기 경엽처리",amount:"10ml",safety:"수확 21일 전",times:"2회"},
  ],
  "포도": [
    {pest:"점박이응애",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 21일 전",times:"2회"},
  ],
  "호박(단호박포함)": [
    {pest:"꽃노랑총채벌레",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
    {pest:"담배가루이",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
    {pest:"목화바둑명나방",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
    {pest:"점박이응애",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
    {pest:"아메리카잎굴파리",method:"발생초기 7일 간격 경엽처리",amount:"10ml",safety:"수확 3일 전",times:"2회"},
  ],
};

function getStraightUsage(cropName) {
  if (!cropName) return null;
  var cn = cropName.replace(/\s/g,'');
  
  if (STRAIGHT_DB[cropName]) return {crop:cropName, entries:STRAIGHT_DB[cropName]};
  
  var keys = Object.keys(STRAIGHT_DB);
  for (var i=0; i<keys.length; i++) {
    var k = keys[i];
    var kn = k.replace(/[\s()（）]/g,'');
    if (kn.indexOf(cn)!==-1 || cn.indexOf(kn.substring(0,Math.min(2,kn.length)))!==-1) {
      return {crop:k, entries:STRAIGHT_DB[k]};
    }
  }
  return null;
}

function getStraightByPest(pestName) {
  var results=[];
  Object.keys(STRAIGHT_DB).forEach(function(crop){
    STRAIGHT_DB[crop].forEach(function(e){
      if (e.pest.indexOf(pestName)!==-1)
        results.push({crop:crop, method:e.method, amount:e.amount, safety:e.safety, times:e.times});
    });
  });
  return results;
}

const HAENGUN_INFO = {
  name:"행운", ingredient:"아족시스트로빈 액상수화제",
  type:"살균제", regNo:"52-살균-112", toxicity:"저독성(어독성Ⅱ급)",
  manufacturer:"한일싸이언스", amount:"10ml(물20L당·작물별상이)",
  feature:"스트로빌루린계·침투이행성·예방치료동시"
};
const HAENGUN_DB = {
  "가지":[
    {dis:"균핵병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 3일전",times:"3회 이내"},
    {dis:"흰가루병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 3일전",times:"3회 이내"},
    {dis:"갈색동근무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "감자":[
    {dis:"겹동근무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
    {dis:"뿌리혹병",method:"파종 후 토양전면 분무처리",amount:"20ml",safety:"파종직후",times:"1회 이내"},
  ],
  "갓":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "갯기름나물(식방풍)":[
    {dis:"녹병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "겨자무":[
    {dis:"노균병/탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "겨자채":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "고구마":[
    {dis:"덩굴쪼김병",method:"정식직후 관주처리",amount:"1ℓ/㎡",safety:"정식기",times:"1회 이내"},
  ],
  "고들빼기":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"8ml",safety:"수확 7일전",times:"2회 이내"},
    {dis:"노균병",method:"발병초 7일간격 경엽처리",amount:"8ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "고려엉겅퀴(곤드레나물)":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
    {dis:"잎마름병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "고사리":[
    {dis:"잎마름병",method:"고사리순 수확이후 경엽처리",amount:"10ml",safety:"수확 3일전",times:"3회 이내"},
  ],
  "곤달비":[
    {dis:"점무늬병/흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "공심채":[
    {dis:"점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "구기자":[
    {dis:"탄저병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "근대":[
    {dis:"노균병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
  ],
  "기장":[
    {dis:"깜부기병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "냉이":[
    {dis:"노균병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
    {dis:"잎반점병/점무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
  ],
  "녹두":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "눈개승마":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "다채(비타민)":[
    {dis:"노균병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "달래":[
    {dis:"잎마름병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "당귀(잎,뿌리)":[
    {dis:"줄기썩음병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "당근":[
    {dis:"검은무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "대추":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "더덕":[
    {dis:"점무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
    {dis:"탄저병/흰가루병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "돌나물":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "들깨(씨)":[
    {dis:"노균병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
  ],
  "들깨(잎)":[
    {dis:"녹병/점무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 5일전",times:"2회 이내"},
    {dis:"노균병",method:"발생초기 7일간격 경엽처리",amount:"10ml",safety:"수확 5일전",times:"2회 이내"},
  ],
  "땅콩":[
    {dis:"잎마름병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "로즈마리":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "로케트(루꼴라)":[
    {dis:"노균병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "망고":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "머위":[
    {dis:"갈색점무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
    {dis:"흰가루병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "메밀":[
    {dis:"점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "멜론":[
    {dis:"덩굴마름병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
    {dis:"균핵병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
  ],
  "모과":[
    {dis:"붉은별무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
    {dis:"탄저병",method:"발병초 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "무":[
    {dis:"검은무늬병/잎마름병",method:"발병초 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
    {dis:"탄저병",method:"발병초기 7일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "무화과":[
    {dis:"역병",method:"발병초 10일간격 경엽처리",amount:"20ml",safety:"수확 14일전",times:"3회 이내"},
    {dis:"탄저병",method:"발병초 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "미나리":[
    {dis:"녹병",method:"발생초기 경엽처리",amount:"8ml",safety:"수확 14일전",times:"1회 이내"},
  ],
  "민들레":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "박":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
    {dis:"노균병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "배암차즈기(곰보배추)":[
    {dis:"노균병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "배초향(방아)":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "배추":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
    {dis:"노균병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "백수오(큰조롱)":[
    {dis:"점무늬낙엽병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
    {dis:"탄저병/점무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "보리":[
    {dis:"녹병/흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "복분자":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 2일전",times:"3회 이내"},
    {dis:"점무늬병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 2일전",times:"3회 이내"},
  ],
  "부추":[
    {dis:"잎마름병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
    {dis:"흑색썩음균핵병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "블루베리":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "비름":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "비트":[
    {dis:"점무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "뽕나무(오디)":[
    {dis:"오디균핵병",method:"개화 5일전 및 개화 5일후 경엽처리",amount:"20ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "사탕무":[
    {dis:"노균병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "산딸기":[
    {dis:"녹병/탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
    {dis:"점무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 30일전",times:"3회 이내"},
  ],
  "산조":[
    {dis:"녹병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
  ],
  "살구":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "삽주":[
    {dis:"탄저병",method:"발병초 10일간격 경엽처리",amount:"8ml",safety:"수확 30일전",times:"3회 이내"},
    {dis:"흰가루병",method:"발병초 10일간격 경엽처리",amount:"8ml",safety:"수확 30일전",times:"3회 이내"},
  ],
  "상추(양상추)":[
    {dis:"갈색점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
    {dis:"노균병",method:"발병초기 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "생강":[
    {dis:"잎집무늬마름병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 45일전",times:"1회 이내"},
  ],
  "석류":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "수국":[
    {dis:"점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"발병초기",times:"-"},
  ],
  "수박":[
    {dis:"덩굴마름병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 3일전",times:"4회 이내"},
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"8ml",safety:"수확 3일전",times:"4회 이내"},
  ],
  "수수":[
    {dis:"잎집무늬마름병",method:"발생초기 경엽처리",amount:"40ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "순무":[
    {dis:"노균병",method:"발병초기 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "순무유채":[
    {dis:"노균병",method:"발병초기 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "시금치":[
    {dis:"노균병/점무늬병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
  ],
  "쑥":[
    {dis:"점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "쑥갓":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
    {dis:"잎마름병/노균병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "쑥부쟁이":[
    {dis:"점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "씀바귀":[
    {dis:"점무늬병/흰비단병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "아로니아":[
    {dis:"갈색점무늬병/점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
    {dis:"점무늬낙엽병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "아스파라거스":[
    {dis:"검은무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 3일전",times:"3회 이내"},
  ],
  "아욱":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "양미나리(셀러리)":[
    {dis:"검은무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "양배추":[
    {dis:"노균병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "어수리":[
    {dis:"점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "엉겅퀴":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "에케베리아(모닝듀)":[
    {dis:"검은점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "여주":[
    {dis:"점무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 3일전",times:"3회 이내"},
  ],
  "열무":[
    {dis:"노균병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 3일전",times:"3회 이내"},
  ],
  "오미자":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "오이":[
    {dis:"노균병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"4회 이내"},
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 3일전",times:"4회 이내"},
  ],
  "왕고들빼기":[
    {dis:"흰가루병",method:"발병초 10일간격 경엽처리",amount:"20ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "우엉":[
    {dis:"흰가루병",method:"발병초 10일간격 경엽처리",amount:"8ml",safety:"수확 14일전",times:"2회 이내"},
  ],
  "유자":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "유채(씨)":[
    {dis:"노균병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 21일전",times:"2회 이내"},
  ],
  "유채(잎)":[
    {dis:"노균병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "윤무":[
    {dis:"깜부기병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
    {dis:"잎마름병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "인삼":[
    {dis:"점무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"4회 이내"},
    {dis:"탄저병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"4회 이내"},
  ],
  "잇꽃(홍화)":[
    {dis:"점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"발병초기",times:"2회 이내"},
  ],
  "자두":[
    {dis:"잿빛무늬병",method:"발병초 7일간격 경엽처리",amount:"20ml",safety:"수확 7일전",times:"3회 이내"},
    {dis:"흰가루병",method:"발병초 7일간격 경엽처리",amount:"20ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "작약":[
    {dis:"줄기썩음병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"2회 이내"},
    {dis:"탄저병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"2회 이내"},
  ],
  "장미":[
    {dis:"노균병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"발생초기",times:"-"},
    {dis:"흰가루병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"발생초기",times:"-"},
  ],
  "조":[
    {dis:"도열병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "차":[
    {dis:"겹동근무늬병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"4회 이내"},
  ],
  "착색단고추류":[
    {dis:"붉은썩음병",method:"희석한 후 포기당 관주처리",amount:"5ml",safety:"수확 3일전",times:"3회 이내"},
  ],
  "참깨":[
    {dis:"잎마름병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"5회 이내"},
    {dis:"흰가루병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"5회 이내"},
  ],
  "참나물(파드득나물)":[
    {dis:"점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "참다래(키위)":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "참외":[
    {dis:"노균병",method:"발병초 10일간격 경엽처리",amount:"8ml",safety:"수확 3일전",times:"5회 이내"},
    {dis:"흰가루병",method:"발병초 10일간격 경엽처리",amount:"8ml",safety:"수확 3일전",times:"5회 이내"},
  ],
  "청경채":[
    {dis:"잿빛곰팡이병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
    {dis:"갈색무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "취나물":[
    {dis:"점무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
    {dis:"흰가루병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"3회 이내"},
  ],
  "치커리":[
    {dis:"노균병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
    {dis:"균핵병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "카네이션":[
    {dis:"검은무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"발병초기",times:"-"},
  ],
  "칼랑코에":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"발병초기",times:"-"},
  ],
  "케일":[
    {dis:"노균병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "콩":[
    {dis:"점무늬병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
    {dis:"자주무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 21일전",times:"3회 이내"},
  ],
  "파":[
    {dis:"검은무늬병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"5회 이내"},
  ],
  "파(쪽파)":[
    {dis:"노균병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"5회 이내"},
  ],
  "파세리(향미나리)":[
    {dis:"흰가루병",method:"발병초 7일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"5회 이내"},
  ],
  "팥":[
    {dis:"탄저병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
    {dis:"흰가루병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "패션프루트":[
    {dis:"잿빛곰팡이병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "해바라기":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
  "호두":[
    {dis:"탄저병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 120일전",times:"1회 이내"},
  ],
  "호박(단호박)":[
    {dis:"덩굴마름병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
    {dis:"흰가루병",method:"발병초 10일간격 경엽처리",amount:"10ml",safety:"수확 7일전",times:"2회 이내"},
  ],
  "홉프":[
    {dis:"노균병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 21일전",times:"2회 이내"},
  ],
  "황기":[
    {dis:"흰가루병",method:"발생초기 경엽처리",amount:"10ml",safety:"수확 14일전",times:"3회 이내"},
  ],
};

function getRecommendedPesticides(cropName, diseaseOrPest) {
  var results = [];
  if (!window._myPesticideList) return results;
  var active = window._myPesticideList.filter(function(p){ return p.status !== 'empty' && !p.excluded; });

  active.forEach(function(p){
    
    if (window.STRAIGHT_DB) {
      var su = getStraightUsage(cropName);
      if (su && p.name === '스트레이트') {
        var match = su.entries.filter(function(e){
          return !diseaseOrPest || e.pest.indexOf(diseaseOrPest) !== -1;
        });
        if (match.length) results.push({pesticide:p, entries:match, db:'STRAIGHT_DB'});
      }
    }
    
    if (window.HAENGUN_DB) {
      var hEntries = getHaengunUsage(cropName);
      if (hEntries && p.name === '행운') {
        var hMatch = hEntries.filter(function(e){
          return !diseaseOrPest || e.dis.indexOf(diseaseOrPest) !== -1;
        });
        if (hMatch.length) results.push({pesticide:p, entries:hMatch, db:'HAENGUN_DB'});
      }
    }
    
    var masterMatch = matchMasterDbForCrop(p.name, cropName, diseaseOrPest);
    if (masterMatch) results.push({pesticide:p, entries:[masterMatch], db:'MASTER_DB'});
  });
  return results;
}

function getHaengunUsage(cropName) {
  if (!window.HAENGUN_DB) return null;
  var cn = cropName.replace(/\s/g,'');
  if (HAENGUN_DB[cropName]) return HAENGUN_DB[cropName];
  var keys = Object.keys(HAENGUN_DB);
  for (var i=0;i<keys.length;i++){
    var kn = keys[i].replace(/[\s()（）]/g,'');
    if (kn.indexOf(cn)!==-1 || cn.indexOf(kn.substring(0,Math.min(2,kn.length)))!==-1)
      return HAENGUN_DB[keys[i]];
  }
  return null;
}

function matchMasterDbForCrop(pesticideName, cropName, diseasePest) {
  var items = getAllDbItems('pest');
  for (var i=0;i<items.length;i++){
    if ((items[i].name||'').indexOf(pesticideName)!==-1){
      var t = (items[i].target||'');
      if (!diseasePest || t.indexOf(diseasePest)!==-1)
        return {dis: t, method: items[i].method||'', amount: items[i].amount||'', safety: items[i].timing||''};
    }
  }
  return null;
}

async function loadMyPesticideList() {
  try {
    var raw = await _gasGet('getMyPesticides');
    window._myPesticideList = [];
    var seen = {};
    var arr = Array.isArray(raw) ? raw
      : Object.keys(raw||{}).map(function(k){ return Object.assign({id:k,_id:k}, raw[k]); });
    arr.forEach(function(d){
      d._id = d._id || d.id;
      var nm = (d.name||'').trim().replace(/\s/g,'');
      if (nm && seen[nm]) return;
      if (nm) seen[nm] = true;
      if (!d.pest_status) d.pest_status = d.status || 'active';
      window._myPesticideList.push(d);
    });
    // USER_DB도 동기화
    USER_DB['pest'] = window._myPesticideList.map(function(p){
      return Object.assign({}, p, {_src:'user'});
    });
  } catch(e){ console.warn('loadMyPesticideList 오류:', e.message); }
}

async function registerMyPesticide(data) {
  var nm = (data.name||'').trim().replace(/\s/g,'');
  var dup = (window._myPesticideList||[]).find(function(p){
    return (p.name||'').replace(/\s/g,'') === nm;
  });
  if (dup) { showToast('이미 등록된 농약입니다: '+data.name); return; }
  data.registeredAt = new Date().toISOString();
  data.status = 'active';
  data.excluded = false;
  var r = await _gasPost(Object.assign({ action:'addMyPesticide' }, data));
  await loadMyPesticideList();
  await loadUserCropUsage();
  return r && r.id;
}

async function togglePesticideStatus(id, action) {
  var update = {};
  if (action === 'empty')   update = {status:'empty', emptiedAt: new Date().toISOString()};
  else if (action === 'restore') update = {status:'active', emptiedAt:''};
  else if (action === 'exclude') update = {excluded:'true'};
  else if (action === 'include') update = {excluded:'false'};
  await _gasPost(Object.assign({ action:'updateMyPesticide', id:id }, update));
  await loadMyPesticideList();
}

function getPestCropUsage(pesticideName, cropName) {
  
  if (isPesticideMatch(pesticideName, '스트레이트')) {
    var r = getStraightUsage(cropName);
    return r ? r.entries.map(function(e){ return {target:e.pest, method:e.method, amount:e.amount, safety:e.safety, times:e.times}; }) : null;
  }
  
  if (isPesticideMatch(pesticideName, '행운') || isPesticideMatch(pesticideName, '오티바')) {
    var e2 = getHaengunUsage(cropName);
    return e2 ? e2.map(function(e){ return {target:e.dis, method:e.method, amount:e.amount, safety:e.safety, times:e.times}; }) : null;
  }
  
  if (window._userCropUsage && window._userCropUsage[pesticideName]) {
    var cu = window._userCropUsage[pesticideName][cropName];
    return cu || null;
  }
  
  var item = getAllDbItems('pest').find(function(p){ return isPesticideMatch(p.name||'', pesticideName); });
  if (item) return [{target: item.target||'', method: item.method||'', amount: item.amount||'', safety: item.timing||'', times:''}];
  return null;
}

function isPesticideMatch(a, b) {
  a = (a||'').replace(/\s/g,''); b = (b||'').replace(/\s/g,'');
  return a.indexOf(b)!==-1 || b.indexOf(a)!==-1;
}

function getRecommendedPesticidesV2(cropName, diseaseOrPest) {
  var results = [];
  var list = window._myPesticideList || [];
  var active = list.filter(function(p){ return p.status !== 'empty' && !p.excluded; });

  
  var candidates = active.length ? active.map(function(p){ return p.name; }) : getAllDbItems('pest').map(function(p){ return p.name; });

  candidates.forEach(function(name){
    var usage = getPestCropUsage(name, cropName);
    if (!usage) return;
    var matched = diseaseOrPest
      ? usage.filter(function(u){ return (u.target||'').indexOf(diseaseOrPest) !== -1; })
      : usage;
    if (matched.length > 0) results.push({name:name, entries:matched, hasStock: active.some(function(p){ return isPesticideMatch(p.name,name); })});
  });
  return results;
}

async function updateCropUsageFromScan(pesticideName, cropUsageData) {
  if (!window._userCropUsage) window._userCropUsage = {};
  window._userCropUsage[pesticideName] = window._userCropUsage[pesticideName] || {};
  Object.assign(window._userCropUsage[pesticideName], cropUsageData);
  await _gasPost({
    action: 'setPestCropUsage',
    name: pesticideName,
    data: JSON.stringify(window._userCropUsage[pesticideName])
  });
  showToast('✅ '+pesticideName+' 작물별 데이터 저장됨');
}

async function loadUserCropUsage() {
  window._userCropUsage = {};
  try {
    var raw = await _gasGet('getPestCropUsage');
    if (raw && typeof raw === 'object') {
      Object.keys(raw).forEach(function(k){
        window._userCropUsage[k.replace(/_/g,' ')] = raw[k];
      });
    }
  } catch(e){}
}

async function registerMyPesticideWithUsage(data, cropUsage) {
  data.registeredAt = new Date().toISOString();
  data.status = 'active';
  data.excluded = false;
  var r = await _gasPost(Object.assign({ action:'addMyPesticide' }, data));
  if (cropUsage && Object.keys(cropUsage).length > 0) {
    await updateCropUsageFromScan(data.name, cropUsage);
  }
  await loadMyPesticideList();
  return r && r.id;
}

// ══ PSIS 농약등록정보 자동조회 → 모달 자동 채우기 ══════════════
async function lookupPsisByName() {
  var nameEl   = document.getElementById('dim-name');
  var resultEl = document.getElementById('dim-psis-result');
  var btn      = document.querySelector('[onclick="lookupPsisByName()"]');
  var name     = (nameEl ? nameEl.value : '').trim();
  if (!name) {
    if(resultEl) resultEl.innerHTML='<span style="color:#E65100;">⚠️ 제품명을 먼저 입력하세요</span>';
    return;
  }
  if(resultEl) resultEl.innerHTML='<span style="color:var(--gray-400);">🔍 PSIS 조회 중...</span>';
  if(btn){ btn.disabled=true; btn.textContent='조회 중...'; }
  try {
    // ── 검색 변형 이름 생성 (부분명 매칭 보완) ─────────────────
    var searchNames = _buildSearchVariants(name);
    if(resultEl) resultEl.innerHTML='<span style="color:var(--gray-400);">🔍 '+searchNames.length+'가지 이름으로 조회 중...</span>';

    var reg = null;
    for(var si=0; si<searchNames.length; si++) {
      reg = await queryPsisRegistered(searchNames[si]);
      // cropUsage 또는 _rawList 중 하나라도 있으면 성공
      if(reg && (
        (reg.cropUsage && Object.keys(reg.cropUsage).length > 0) ||
        (reg._rawList  && reg._rawList.length > 0)
      )) break;
      reg = null;
    }

    if(reg) {
      // _rawList가 있는데 cropUsage가 비면 여기서 직접 변환
      if(reg._rawList && reg._rawList.length > 0 &&
         (!reg.cropUsage || Object.keys(reg.cropUsage).length === 0)) {
        var cu = {};
        reg._rawList.forEach(function(row) {
          var crop = row.cropName || row.crpName || '기타';
          if(!cu[crop]) cu[crop]=[];
          cu[crop].push({
            target: row.diseaseWeedName || '',
            method: row.pestiUse        || '',
            amount: row.dilutUnit       || '',
            safety: row.useSuittime     || '',
            times:  row.useNum          || ''
          });
        });
        reg.cropUsage = cu;
      }
      if(reg._rawList && reg._rawList.length > 1) {
        _showPsisMultiResult(reg._rawList, '등록농약');
      } else {
        _fillModalFromPsis(reg, '등록농약');
      }
      return;
    }

    // ── 등록취소농약 조회 ─────────────────────────────────────
    var can = null;
    for(var ci=0; ci<searchNames.length; ci++) {
      can = await queryPsisCancelled(searchNames[ci]);
      if(can && can.name) break;
      can = null;
    }
    if(can && can.name){ _fillModalFromPsis(can,'등록취소'); return; }

    // ── GAS 경유 웹파싱 시도 (부분 검색) ────────────────────────
    var gasUrl2 = (typeof getEffectiveGasUrl === 'function') ? getEffectiveGasUrl().trim() : '';
    if (gasUrl2) {
      if(resultEl) resultEl.innerHTML='<span style="color:var(--gray-400);">🌐 PSIS 웹 직접 검색 중 (부분 검색)...</span>';
      try {
        var webRes = await fetch(gasUrl2, {
          method: 'POST',
          headers: {'Content-Type':'text/plain'},
          body: JSON.stringify({action:'psis_web', productName: name})
        });
        var webData = await webRes.json();
        if (webData.success && webData.cropUsage && Object.keys(webData.cropUsage).length > 0) {
          if (webData._rawList && webData._rawList.length > 1) {
            _showPsisMultiResult(webData._rawList, 'PSIS 웹검색');
          } else {
            _fillModalFromPsis(webData, 'PSIS 웹검색');
          }
          return;
        }
      } catch(eWeb) {
        console.warn('[PSIS] 웹파싱 실패:', eWeb.message);
      }
    }

    // ── 없음 ─────────────────────────────────────────────────
    // PSIS 웹 검색 URL (웹은 부분 검색 지원)
    var psisWebUrl = 'https://psis.rda.go.kr/psis/agc/res/agchmRegistStusLst.ps'
      + '?menuId=PS00263&sAgBrandNm=' + encodeURIComponent(name);
    if(resultEl) resultEl.innerHTML=
      '<div style="padding:10px;background:#FFF3E0;border:1px solid #FFB74D;border-radius:8px;font-size:12px;">'
      +'<div style="font-weight:700;color:#E65100;margin-bottom:6px;">⚠️ API에서 <b>'+esc(name)+'</b> 결과 없음</div>'
      +'<div style="color:#555;line-height:1.8;margin-bottom:8px;">'
      +'<b>API vs 웹 검색의 차이</b><br>'
      +'• PSIS 웹사이트: <b>부분 포함 검색</b> (싸이메트 → 싸이메트수화제 포함)<br>'
      +'• PSIS API: <b>완전 일치 검색</b> (정확한 상표명 필요)<br>'
      +'<br>'
      +'<b>해결 방법</b><br>'
      +'① 아래 버튼으로 PSIS 웹에서 정확한 상표명 확인 후<br>'
      +'② 정확한 이름(예: 싸이메트수화제)으로 다시 조회</div>'
      +'<a href="'+psisWebUrl+'" target="_blank" '
      +'style="display:block;width:100%;padding:8px;background:#1565C0;color:#fff;border-radius:7px;font-size:12px;cursor:pointer;text-align:center;text-decoration:none;margin-bottom:5px;box-sizing:border-box;">'
      +'🔗 PSIS 웹에서 &quot;'+esc(name)+'&quot; 검색 결과 보기</a>'
      +'<div style="font-size:10px;color:#888;">시도한 검색어: '+searchNames.map(esc).join(', ')+'</div>'
      +'</div>';
  } catch(e) {
    if(resultEl) resultEl.innerHTML='<div style="color:#C62828;font-size:12px;">❌ 조회 오류: '+esc(e.message)+'<br><small>PSIS API 키 또는 GAS URL 확인 필요 (⚙️ 설정)</small></div>';
  } finally {
    if(btn){ btn.disabled=false; btn.textContent='🔍 PSIS 농약등록정보 자동조회'; }
  }
}

// 여러 회사 결과 목록 표시 → 선택하면 해당 데이터로 채우기
function _showPsisMultiResult(rawList, srcLabel) {
  var resultEl = document.getElementById('dim-psis-result');
  if(!resultEl) return;

  // 회사별 그룹핑
  var companies = {};
  rawList.forEach(function(row) {
    var mfr = row.compName || row.companName || row['등록회사'] || '알 수 없음';
    if(!companies[mfr]) companies[mfr] = [];
    companies[mfr].push(row);
  });

  var mfrList = Object.keys(companies);

  var h = '<div style="background:#E3F2FD;border:1px solid #90CAF9;border-radius:8px;padding:10px;">'
    +'<div style="font-size:12px;font-weight:700;color:#1565C0;margin-bottom:8px;">'
    +'⚠️ 같은 이름의 제품이 '+mfrList.length+'개 회사에서 등록되어 있습니다. 해당 제품을 선택하세요.</div>';

  mfrList.forEach(function(mfr, idx) {
    var rows    = companies[mfr];
    var first   = rows[0];
    var ingr    = first.pestiKorName || first.pestiMtrName || first['품목명'] || '';
    var regNo   = first.pestiRegNo   || first['등록번호'] || '';
    var crops   = {};
    rows.forEach(function(r){
      var c = r.cropName||r.crpName||r['작물명']||'';
      if(c){ if(!crops[c]) crops[c]=[]; crops[c].push(r); }
    });
    var cropCount = Object.keys(crops).length;

    h += '<div onclick="_selectPsisCompany(\''+idx+'\')"'
      +' style="background:#fff;border:1.5px solid #BBDEFB;border-radius:8px;padding:10px;'
      +'margin-bottom:7px;cursor:pointer;" '
      +'onmouseover="this.style.borderColor=\'#1565C0\'" '
      +'onmouseout="this.style.borderColor=\'#BBDEFB\'">'
      +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">'
      +'<div style="font-size:13px;font-weight:700;color:#1565C0;">🏭 '+esc(mfr)+'</div>'
      +'<div style="font-size:10px;background:#1565C0;color:#fff;padding:2px 8px;border-radius:6px;">선택</div>'
      +'</div>'
      +'<div style="font-size:11px;color:#555;">'
      +'성분: '+esc(ingr||'-')
      +(regNo?' · 등록번호: '+esc(regNo):'')
      +' · '+cropCount+'개 작물 적용'
      +'</div></div>';

    // 회사별 데이터 임시 저장
    if(!window._psisMultiData) window._psisMultiData={};
    window._psisMultiData[idx] = {companies:companies, mfr:mfr, rows:rows, crops:crops};
  });

  // 전체 데이터 저장
  window._psisMultiAll = {companies:companies, mfrList:mfrList, srcLabel:srcLabel};
  h += '</div>';
  resultEl.innerHTML = h;
}

// 회사 선택 시 해당 데이터로 채우기
function _selectPsisCompany(idx) {
  var all = window._psisMultiAll;
  if(!all) return;
  var mfr  = all.mfrList[idx];
  var rows = all.companies[mfr];
  var first= rows[0];

  // cropUsage 구성 (새 API 필드 우선)
  var cropUsage={};
  rows.forEach(function(r){
    var c=r.cropName||r.crpName||r['작물명']||'';
    if(!c) return;
    if(!cropUsage[c]) cropUsage[c]=[];
    cropUsage[c].push({
      target:r.diseaseWeedName||r.pestName||r['적용병해충']||'',
      method:r.pestiUse||r.useMethod||r['사용방법']||'',
      amount:r.dilutUnit||r.dilutionRate||r['희석배수']||'',
      safety:r.useSuittime||r.safetyPrd||r['안전사용시기']||'',
      times: r.useNum||r.safetyTimes||r['사용횟수']||''
    });
  });

  var data = {
    name:         first.pestiBrandName||first['상표명']||'',
    type:         first.useName||first.pestiType||first['농약구분']||'살충제',
    ingredient:   first.pestiKorName||first.pestiMtrName||first['품목명']||'',
    manufacturer: mfr,
    _rawList:     rows,
    regNo:        first.pestiRegNo||first['등록번호']||'',
    status:       '등록',
    cropUsage:    cropUsage,
    source:       'PSIS_등록'
  };

  _fillModalFromPsis(data, '등록농약 · '+esc(mfr));
}

// 검색 변형 이름 생성 (부분명으로 PSIS 매칭 보완)
function _buildSearchVariants(name) {
  var variants = [name]; // 원본 항상 첫 번째

  // 숫자 제거 버전 (싸이메트500 → 싸이메트)
  var noNum = name.replace(/\d+/g,'').trim();
  if(noNum && noNum !== name) variants.push(noNum);

  // WP/SC/WG 등 제형 코드 제거 (싸이메트WP → 싸이메트)
  var noForm = name.replace(/\s*(WP|WG|SC|EC|SL|GR|WDG|DF|ME|MG|SP|DP|UL|EW|SE|OF|OD|DC|CS|ES|GB|TB|SG)\s*$/i,'').trim();
  if(noForm && noForm !== name && noForm !== noNum) variants.push(noForm);

  // "수화제|액상수화제|유제|입제|분제" 제거
  var noSuffix = name.replace(/(수화제|액상수화제|유제|입제|분제|액제|과립수화제|훈연제|미탁제|캡슐현탁제)$/,'').trim();
  if(noSuffix && noSuffix !== name) variants.push(noSuffix);

  // 중복 제거
  return variants.filter(function(v,i,a){ return v.length>=1 && a.indexOf(v)===i; });
}
function _fillModalFromPsis(data, srcLabel) {
  var resultEl   = document.getElementById('dim-psis-result');
  var isCancelled= data.status==='등록취소';
  function sv(id,v){ var e=document.getElementById(id); if(e&&v) e.value=v; }

  // ── 기본 정보 ────────────────────────────────────────────
  sv('dim-name',       data.name||'');
  sv('dim-ingredient', data.ingredient||'');
  sv('dim-form',       data.type||'');

  // ── 원본 _rawList에서 추가 정보 추출 ─────────────────────
  var first = (data._rawList && data._rawList[0]) || {};

  // ── 개화기 사용 (wafindex: 1=가능, 2=주의, 3=금지, 4=절대금지) ──
  var bloomEl = document.getElementById('dim-bloom');
  if (bloomEl && first.wafindex) {
    var wafMap = {'1':'가능','2':'주의','3':'금지','4':'절대금지'};
    var wafVal = wafMap[String(first.wafindex)];
    if (wafVal) bloomEl.value = wafVal;
  }

  // ── 꿀벌 독성 — wafindex 기반 추론 (API에 꿀벌독성 전용 필드 없음) ──
  // wafindex=3/4 이면 꿀벌에 위험, 1이면 비교적 안전
  var beeEl = document.getElementById('dim-bee');
  if (beeEl && first.wafindex) {
    var waf = String(first.wafindex);
    if (waf==='4')      beeEl.value='매우강함';
    else if (waf==='3') beeEl.value='강함';
    else if (waf==='2') beeEl.value='중간';
    else if (waf==='1') beeEl.value='낮음';
  }

  // ── 인축독성 (상세조회: toxicName) ──────────────────────────
  // 인축독성: toxicName (상세조회) 또는 toxicGubun 코드로 설정
  var toxEl = document.getElementById('dim-toxicity');
  if (toxEl) {
    var toxSrc = data.toxicName || data.toxicGubun || '';
    // select option value와 정확히 맞춰야 함: 맹독성/고독성/보통독성/저독성/무독
    var toxOpts = ['맹독성','고독성','보통독성','저독성','무독'];
    var toxMatched = toxOpts.find(function(o){ return toxSrc.includes(o.replace('독성','')||o); });
    if (toxMatched) toxEl.value = toxMatched;
    else if (toxSrc) {
      // toxicGubun 코드: 1=맹독, 2=고독, 3=보통, 4=저독, 5=무독
      var codeMap = {'1':'맹독성','2':'고독성','3':'보통독성','4':'저독성','5':'무독'};
      if (codeMap[toxSrc.trim()]) toxEl.value = codeMap[toxSrc.trim()];
    }
  }

  // ── 어독성 (상세조회: fishToxicGubun) ────────────────────────
var fishEl = document.getElementById('dim-fish-toxicity');
if (fishEl) {
    // 1. HTML 태그가 포함되어 있다면 제거하고 텍스트만 추출
    var rawText = (data.fishToxicGubun || '').toString();
    var fishSrc = rawText.replace(/<[^>]+>/g, '').trim(); 
    
    if (fishSrc) {
        // 2. 범용적인 단어 포함 여부로 판단
        if (fishSrc.includes('Ⅰ') || fishSrc.includes('1'))
            fishEl.value = 'Ⅰ급 (강독성)';
        else if (fishSrc.includes('Ⅱ') || fishSrc.includes('2'))
            fishEl.value = 'Ⅱ급 (중독성)';
        else if (fishSrc.includes('Ⅲ') || fishSrc.includes('3'))
            fishEl.value = 'Ⅲ급 (약독성)';
        else if (fishSrc.includes('없'))
            fishEl.value = '없음';
        else
            fishEl.value = '선택';
            
        console.log('[어독성] 추출된 값:', fishSrc, '→ 선택된 값:', fishEl.value);
    }
}

  // ── 작용기작 MOA (목록조회: indictSymbl = IRAC/FRAC 코드) ────
  // 작용기작: indictSymbl (IRAC/FRAC 코드) → 코드+설명
  var moaEl = document.getElementById('dim-moa');
  if (moaEl) {
    var moaSrc = (data.moa || first.indictSymbl || '').toString().trim().toUpperCase();
    if (moaSrc) {
      var iracMap = {
        '1A':'1A (유기인계)', '1B':'1B (유기인계)',
        '2A':'2A (카바메이트)', '2B':'2B (카바메이트)',
        '3A':'3A (피레스로이드)', '3B':'3B',
        '4A':'4A (네오니코티노이드)', '4C':'4C', '4D':'4D',
        '5':'5 (스피노신)', '6':'6 (아버멕틴/밀베마이신)',
        '7C':'7C', '9B':'9B', '11A':'11A (Bt)',
        '13':'13 (클로르페나피르)', '22A':'22A',
        '23':'23 (테트로닉산)', '28':'28 (다이아미드)',
        '30':'30', '31':'31',
        // FRAC (살균제)
        'A':'A (카르복신계)', 'B':'B (벤즈이미다졸)',
        'C':'C (카복삼이드)', 'D':'D (페닐아미드)',
        'E':'E (다이카복시미드)', 'F':'F',
        'G':'G (스테롤합성저해)', 'H':'H',
        'I':'I', 'J':'J', 'K':'K', 'L':'L',
        'M':'M (다부위작용)', 'N':'N', 'O':'O', 'P':'P',
        'U':'U (작용기작미분류)'
      };
      var moaKey = moaSrc.toUpperCase().trim();
      moaEl.value = iracMap[moaKey] || moaSrc;
    }
  }

  // 주의사항은 사용자 직접 입력

  // 적용작물 범위
  var crops=Object.keys(data.cropUsage||{});
  sv('dim-croprange', crops.slice(0,5).join(', '));

  // ── 농약 종류 자동 선택 ───────────────────────────────────
  var typeEl=document.getElementById('dim-pest-type');
  if(typeEl&&data.type){
    ['살충제','살균제','살균살충제','제초제','토양살충제','생장조정제'].forEach(function(t){
      if((data.type||'').includes(t)) typeEl.value=t;
    });
  }

  // ── 방제대상·방법·희석배수 채우기 ────────────────────────
  var targets=[],methods=[],amounts=[];
  crops.slice(0,3).forEach(function(c){
    (data.cropUsage[c]||[]).slice(0,2).forEach(function(u){
      if(u.target&&!targets.includes(u.target)) targets.push(u.target);
      if(u.method&&!methods.includes(u.method)) methods.push(u.method);
      if(u.amount&&!amounts.includes(u.amount)) amounts.push(u.amount);
    });
  });
  if(targets.length) sv('dim-target', targets.slice(0,3).join(', '));
  if(methods.length) sv('dim-method', methods[0]+(amounts[0]?' '+amounts[0]:''));
  // ── 사용시기·사용횟수 자동입력 ─────────────────────────────
  // cropUsage에서 대표값 추출
  var safeties=[], times=[];
  crops.slice(0,3).forEach(function(c){
    (data.cropUsage[c]||[]).slice(0,1).forEach(function(u){
      if(u.safety&&!safeties.includes(u.safety)) safeties.push(u.safety);
      if(u.times&&!times.includes(u.times))       times.push(u.times);
    });
  });
  var utEl=document.getElementById('dim-use-time');
  if(utEl && safeties.length) utEl.value=safeties[0];
  var unEl=document.getElementById('dim-use-num');
  if(unEl && times.length) unEl.value=times[0];

  // ── 인축독성 자동입력 ────────────────────────────────────────
  var toxEl=document.getElementById('dim-toxicity');
  if(toxEl && first.indictSymbl){
    var sym2=(first.indictSymbl||'   ').toUpperCase();
    var toxVal='';
    if(sym2==='1A'||sym2==='1B') toxVal='맹독성';
    else if(sym2==='II'||sym2==='2')  toxVal='고독성';
    else if(sym2==='III'||sym2==='3') toxVal='보통독성';
    else if(sym2==='IV'||sym2==='4')  toxVal='저독성';
    else if(sym2==='U')               toxVal='무독';
    if(toxVal) toxEl.value=toxVal;
  }

  // ── 작용기작(MOA) 성분명으로 추측 ───────────────────────────
  var moaEl=document.getElementById('dim-moa');
  if(moaEl && !moaEl.value && data.ingredient){
    var ing=(data.ingredient||'  ').toLowerCase();
    var moaG='';
    if(ing.includes('포레이트')||ing.includes('클로르피리포스')||ing.includes('다이아지논')) moaG='I-D (유기인계)';
    else if(ing.includes('이미다클로')||ing.includes('아세타미프리드')||ing.includes('티아메톡삼')) moaG='I-A (네오니코티노이드)';
    else if(ing.includes('클로란트라닐')||ing.includes('사이안트라닐')) moaG='I-B (다이아미드)';
    else if(ing.includes('에마멕틴')||ing.includes('아버멕틴')) moaG='I-F (아버멕틴)';
    else if(ing.includes('사이퍼메트린')||ing.includes('델타메트린')||ing.includes('람다사이할로')) moaG='I-C (피레스로이드)';
    else if(ing.includes('아족시스트로빈')||ing.includes('크레속심')||ing.includes('피라클로스트로빈')) moaG='F-B (스트로빌루린)';
    else if(ing.includes('보스칼리드')||ing.includes('플룩사피록사드')||ing.includes('이소피라잠')) moaG='F-A (SDHI)';
    else if(ing.includes('테부코나졸')||ing.includes('디페노코나졸')||ing.includes('프로피코나졸')) moaG='F-C (DMI)';
    else if(ing.includes('만코제브')||ing.includes('클로로탈로닐')||ing.includes('캡탄')) moaG='F-D (보호살균)';
    if(moaG) moaEl.value=moaG;
  }
  // 임시 저장
  window._dimCropUsage = data.cropUsage||{};
  window._dimPsisData  = data;
  // 결과 표시
  var bg   = isCancelled?'#FFEBEE':'#E8F5E9';
  var bdr  = isCancelled?'#EF9A9A':'#A5D6A7';
  var col  = isCancelled?'#C62828':'#2E7D32';
  var myPl = (window._allPlants||APP.plants||[]);
  var h    = '<div style="background:'+bg+';border:1px solid '+bdr+';border-radius:8px;padding:10px;">'
    +'<div style="font-size:12px;font-weight:700;color:'+col+';margin-bottom:6px;">'
    +(isCancelled?'⛔ 등록취소농약':'✅ 등록농약')+' — '+esc(data.name||'')
    +(data.manufacturer&&data.manufacturer!=='알 수 없음'?' · '+esc(data.manufacturer):'')
    +'</div>';
  if(isCancelled){
    h+='<div style="font-size:11px;color:#C62828;">취소일: '+esc(data.cancelDate||'미상')+'</div>';
  } else {
    h+='<div style="font-size:11px;color:var(--gray-600);margin-bottom:5px;">'
      +'성분: '+esc(data.ingredient||'-')+' | '+crops.length+'개 작물</div>';
    if(crops.length){
      h+='<div style="display:flex;flex-wrap:wrap;gap:4px;">';
      crops.slice(0,8).forEach(function(crop){
        var isMy=myPl.some(function(p){return (p.name||'').includes(crop)||crop.includes(p.name||'');});
        h+='<span style="font-size:10px;padding:2px 7px;border-radius:6px;background:'
          +(isMy?'var(--green-dark)':'#eee')+';color:'+(isMy?'#fff':'#555')+'">'
          +(isMy?'⭐':'')+esc(crop)+'</span>';
      });
      if(crops.length>8) h+='<span style="font-size:10px;color:#888;">+'+( crops.length-8)+'개</span>';
      h+='</div>';
    }
  }
  h+='<div style="font-size:11px;color:var(--gray-500);margin-top:5px;">👆 필드가 자동으로 채워졌습니다. 확인 후 저장하세요.</div>';
  h+='</div>';
  if(resultEl) resultEl.innerHTML=h;
}

function clearPsisResult(){
  var e=document.getElementById('dim-psis-result');
  if(e) e.innerHTML='';
  window._dimCropUsage=null;
  window._dimPsisData=null;
}

// PSIS 원본 응답을 팝업으로 표시
async function showPsisRawResponse(name) {
  var resultEl = document.getElementById('dim-psis-result');
  var gasUrl = (typeof getEffectiveGasUrl === 'function') ? getEffectiveGasUrl().trim() : '';

  name = name ? name.trim() : '';
  if (!name || !gasUrl) {
    if (resultEl) resultEl.innerHTML = '⚠️ 이름이나 GAS URL 설정 확인 필요';
    return;
  }

  // 로딩 표시
  if (resultEl) {
    resultEl.innerHTML = '<div style="padding:15px; text-align:center;"><span class="spinner" style="width:18px;height:18px;display:inline-block;vertical-align:middle;"></span> 데이터를 가공하는 중...</div>';
  }

  try {
    var getUrl = gasUrl + '?keyword=' + encodeURIComponent(name);
    var res = await fetch(getUrl);
    var raw = await res.json();

    // [1단계] 안전하게 데이터와 성공 여부 확보
    var data = (raw && raw.data) ? raw.data : {}; 
    var hasData = (raw && raw.ok === true) || (data && data.totalCount > 0);

    // [2단계] list.item 구조를 cropUsage 객체로 확실하게 변환
    var cu = {};
    if (data && data.list && data.list.item) {
        var items = Array.isArray(data.list.item) ? data.list.item : [data.list.item];
        items.forEach(function(row) {
            var crop = row.cropName || '기타';
            if (!cu[crop]) cu[crop] = [];
            cu[crop].push({
                target: row.diseaseWeedName || '알수없음',
                method: row.pestiUse || '-'
            });
        });
    }

    // [3단계] 최종 성공 여부 판단 (데이터가 있고 가공된 작물이 1개 이상일 때)
    var finalSuccess = hasData && (Object.keys(cu).length > 0);
    
    // ▼ 이 3줄을 새로 추가하여 다른 함수들의 지뢰를 제거합니다.
    data.cropUsage = cu;
    data.success = finalSuccess;
    var isSuccess = finalSuccess; // 이 함수를 호출한 컨텍스트나 클로저 방어용

    // [4단계] 배경색과 아이콘 설정
    var bg = finalSuccess ? '#E8F5E9' : '#FFF3E0';
    var icon = finalSuccess ? '✅' : '📭';

    // [5단계] 화면에 표시할 HTML 생성 (기존 변수 의존성 전면 제거)
    var html = '<div style="padding:14px; background:' + bg + '; border-radius:8px; margin-bottom:10px; font-size:14px; line-height:1.5;">';
    html += '  <div style="font-weight:bold; font-size:15px; margin-bottom:6px;">' + icon + ' GAS 응답 — "' + name + '"</div>';
    html += '  <div style="margin-bottom:4px;"><b>상태:</b> ' + (finalSuccess ? '조회 성공' : '조회 결과 없음 또는 오류') + '</div>';
    
    if (finalSuccess) {
        html += '  <div style="margin-bottom:8px;"><b>적용 작물:</b> ' + Object.keys(cu).join(', ') + '</div>';
        html += '  <pre style="background:#fff; padding:10px; border:1px solid #ccc; border-radius:6px; font-size:12px; max-height:250px; overflow:auto; white-space:pre-wrap; word-break:break-all; margin:0;">' + JSON.stringify(cu, null, 2) + '</pre>';
    } else {
        html += '  <div style="color:#C24A3A; font-weight:bold;">⚠️ cropUsage 없음</div>';
        html += '  <p style="font-size:12px; color:#666; margin:6px 0 0;">GAS 응답은 성공했으나 매칭되는 농약 데이터가 없거나 형식이 다릅니다.</p>';
    }
    html += '</div>';

    if (resultEl) resultEl.innerHTML = html;

  } catch(e) {
    if (resultEl) {
        resultEl.innerHTML = '<div style="padding:14px; background:#F7E2DE; color:#7a2f22; border-radius:8px;">' +
                             '❌ 오류 발생: ' + e.message + '</div>';
    }
  }
}

function applyWarningSample() {
  var sel = document.getElementById('dim-warning-sel');
  var inp = document.getElementById('dim-warning');
  if (!sel || !inp) return;
  var val = sel.value;
  if (!val) return;
  // 기존 내용이 있으면 '. ' 로 이어붙이기
  if (inp.value && inp.value.trim()) {
    inp.value = inp.value.trim() + '. ' + val;
  } else {
    inp.value = val;
  }
  sel.value = ''; // 선택 초기화
}

// ── 작물명 정규화 매칭 ───────────────────────────────────────
function _normCropName(n){n=(n||'').trim();n=n.replace(/나무$/,'').replace(/나물$/,'');n=n.replace(/\s*\([^)]*\)/g,'').trim();return n;}
function _cropMatch(api,sel){var a=_normCropName(api),s=_normCropName(sel);if(!a||!s)return false;if(a===s)return true;if(Math.abs(a.length-s.length)>2)return false;var sh=a.length<=s.length?a:s,lo=a.length<=s.length?s:a;if(!lo.startsWith(sh))return false;var suf=lo.slice(sh.length);if(!suf)return true;return['나무','나물','류','과','순','잎','대'].some(function(x){return suf===x||suf.indexOf(x)===0;});}

// ── PSIS 헬퍼 ────────────────────────────────────────────────
function _psisToggleUse(btn,val){document.querySelectorAll('#psis-use-btns button').forEach(function(b){b.style.background='#fff';b.style.color='#555';b.style.borderColor='var(--gray-200)';b.style.fontWeight='400';});btn.style.background='var(--blue-dark)';btn.style.color='#fff';btn.style.borderColor='var(--blue-dark)';btn.style.fontWeight='700';}
function _psisSearchReset(){for(var i=1;i<=4;i++){var ce=document.getElementById('psis-crop-'+i);if(ce){ce.value='';ce.style.color='';ce.style.fontWeight='';}var de=document.getElementById('psis-dis-'+i);if(de)de.value='';}['psis-brand','psis-ingredient','psis-moa','psis-company'].forEach(function(id){var e=document.getElementById(id);if(e)e.value='';});var ab=document.querySelector('#psis-use-btns button[data-use="전체"]');if(ab)_psisToggleUse(ab,'전체');var out=document.getElementById('recommend-result');if(out)out.innerHTML='';document.querySelectorAll('.crop-select').forEach(function(cb){cb.checked=false;});}
function _getPsisSearchParams(){var p={};var ub=document.querySelector('#psis-use-btns button[style*="background:var(--blue-dark)"]');p.use=ub?ub.getAttribute('data-use'):'전체';p.crops=[];p.cropExact=[];for(var i=1;i<=4;i++){var sel=document.getElementById('psis-crop-'+i);var v=(sel&&sel.value)||'';if(v){p.crops.push(v);p.cropExact.push(false);}}p.diseases=[];for(var j=1;j<=4;j++){var d=(document.getElementById('psis-dis-'+j)||{}).value||'';if(d)p.diseases.push(d);}p.brand=(document.getElementById('psis-brand')||{}).value||'';p.ingredient=(document.getElementById('psis-ingredient')||{}).value||'';p.moa=(document.getElementById('psis-moa')||{}).value||'';p.company=(document.getElementById('psis-company')||{}).value||'';return p;}
function _syncCropToDropdown(cb){
  if(!cb) return;
  var cn=(cb.value||'').trim(); if(!cn) return;
  if(cb.checked){
    for(var i=1;i<=4;i++){
      var inp=document.getElementById('psis-crop-'+i);
      if(!inp||(inp.value||'').trim()) continue;
      inp.value=cn; inp.style.color='#1565C0'; inp.style.fontWeight='600';
      break;
    }
  } else {
    for(var i=1;i<=4;i++){
      var inp=document.getElementById('psis-crop-'+i);
      if(inp&&inp.value===cn){ inp.value=''; inp.style.color=''; inp.style.fontWeight=''; break; }
    }
  }
  // selected-crops-display 업데이트
  var vals=[];
  for(var j=1;j<=4;j++){var el=document.getElementById('psis-crop-'+j);if(el&&(el.value||'').trim())vals.push(el.value.trim());}
  var dp=document.getElementById('selected-crops-display');
  if(dp) dp.innerHTML=vals.length?'<span style="color:var(--green-dark);font-weight:600;">선택: </span>'+vals.map(function(n){return'<span style="background:var(--green-dark);color:#fff;padding:2px 8px;border-radius:6px;font-size:11px;margin-right:4px;">'+esc(n)+'</span>';}).join(''):'<span style="font-size:11px;color:var(--gray-400);">작물을 선택하세요</span>';
}

// ── 20L 환산 ─────────────────────────────────────────────────
function calc20L(d){var s=(d||'').trim();var m1=s.match(/(\d+(?:\.\d+)?)\s*(ml|g|cc)\/20L/i);if(m1)return m1[1]+m1[2]+'/20L';var m2=s.match(/(\d[\d,]+)\s*배/);if(m2){var r=parseInt(m2[1].replace(/,/g,''));var ml=Math.round(20000/r*10)/10;if(ml>=10)ml=Math.round(ml);return ml+'ml/20L\u00a0('+r+'배)';}return s||'-';}

// ── doRecommend + 1·2·3차 방제 ──────────────────────────────
async function doRecommend(){var out=document.getElementById('recommend-result');if(!out)return;var p=_getPsisSearchParams();var crops=p.crops||[],diseases=p.diseases||[],brand=p.brand||'',ingr=p.ingredient||'',moa=p.moa||'',company=p.company||'',useType=p.use!=='전체'?p.use:'';if(!crops.length&&!diseases.length&&!brand&&!ingr&&!moa&&!company){out.innerHTML='<span style="font-size:11px;color:var(--red-dark);">작물명 또는 검색어를 하나 이상 입력하세요</span>';return;}out.innerHTML='<div style="text-align:center;padding:16px;color:var(--gray-400);"><div style="font-size:20px;">🔍</div><div style="font-size:12px;">PSIS 조회 중...<br><small>'+esc(brand||(crops[0]||'')+(diseases[0]?' '+diseases[0]:''))+'</small></div></div>';try{var gasUrl=(typeof getEffectiveGasUrl==='function')?getEffectiveGasUrl():'';var psisResults=[];if(gasUrl){try{var url,res,data=null;if(brand||ingr){url=gasUrl+'?keyword='+encodeURIComponent(brand||ingr);res=await fetch(url,{mode:'cors',redirect:'follow'});data=await res.json();}else{var qs='';if(crops.length)qs+='&crops='+encodeURIComponent(crops.join(','));if(diseases.length)qs+='&diseases='+encodeURIComponent(diseases.join(','));if(useType)qs+='&use='+encodeURIComponent(useType);if(moa)qs+='&moa='+encodeURIComponent(moa);if(company)qs+='&company='+encodeURIComponent(company);if(qs){url=gasUrl+'?'+qs.slice(1);res=await fetch(url,{mode:'cors',redirect:'follow'});data=await res.json();}}if(!data){out.innerHTML='<div style="font-size:12px;color:#E65100;">⚠️ GAS 서버 응답 없음<br><small>⚙️ 설정에서 GAS URL을 확인하세요</small></div>';return;}if(data&&data._rawList&&data._rawList.length){psisResults=data._rawList.filter(function(r){var bOk=!brand||(r.pestiBrandName||'').includes(brand);var iOk=!ingr||(r.pestiKorName||'').includes(ingr);var uOk=!useType||(r.useName||'').includes(useType);var mOk=!moa||(r.indictSymbl||'').toUpperCase().includes(moa.toUpperCase());var cOk=!company||(r.compName||'').includes(company);var cropOk=!crops.length||crops.some(function(cn){return _cropMatch(r.cropName||'',cn);});return bOk&&iOk&&uOk&&mOk&&cOk&&cropOk;});}}catch(e){psisResults=[];}}var mp=USER_DB['pest']||[];
  var hn=mp.filter(function(p){return p.pest_status==='have';}).map(function(p){return(p.name||'').replace(/\s/g,'');});
  var nn=mp.filter(function(p){return p.pest_status==='need';}).map(function(p){return(p.name||'').replace(/\s/g,'');});

  // PSIS 결과에서 성분(pestiKorName) 목록 추출
  var psisIngredients = psisResults.map(function(r){ return (r.pestiKorName||'').split(' ')[0]; }).filter(Boolean);

  // 내 농약장에서 PSIS 성분과 일치하는 농약 찾기
  function _matchesPsisIngredient(myPest) {
    var myIngr = (myPest.ingredient||'').toLowerCase();
    return psisIngredients.some(function(pi){
      return pi.length > 2 && myIngr.includes(pi.toLowerCase());
    });
  }

  // 우선순위 함수: 이름 직접일치 > 성분일치(have) > 성분일치(need) > have > need > none
  function gs(psisName, psisIngredient) {
    var nm = (psisName||'').replace(/\s/g,'');
    // 1순위: 이름이 정확히 일치하는 것 (have)
    if (hn.indexOf(nm)!==-1) return 'have';
    // 2순위: 이름 일치 (need)
    if (nn.indexOf(nm)!==-1) return 'need';
    // 3순위: 성분이 일치하는 내 농약장 농약 (have)
    var psisIngr = (psisIngredient||'').toLowerCase().split(' ')[0];
    if (psisIngr.length > 2) {
      var ingredMatch = mp.find(function(p){
        return p.pest_status==='have' && (p.ingredient||'').toLowerCase().includes(psisIngr);
      });
      if (ingredMatch) return 'have_ingr';
    }
    // 4순위: 성분 일치 (need)
    if (psisIngr.length > 2) {
      var ingredMatchN = mp.find(function(p){
        return p.pest_status==='need' && (p.ingredient||'').toLowerCase().includes(psisIngr);
      });
      if (ingredMatchN) return 'need_ingr';
    }
    return 'none';
  }

  // gs 래퍼 (기존 _buildRounds 호환)
  function gsSimple(name) {
    var r = gs(name, (psisResults.find(function(r){ return r.pestiBrandName===name; })||{}).pestiKorName||'');
    if (r==='have'||r==='have_ingr') return 'have';
    if (r==='need'||r==='need_ingr') return 'need';
    return 'none';
  }var rounds=_buildRounds(psisResults,gsSimple);if(!rounds.length&&!psisResults.length){out.innerHTML='<div style="font-size:12px;color:var(--gray-400);padding:10px 0;text-align:center;">PSIS에 해당 조건의 등록 농약이 없습니다.</div>';return;}var rh=_renderRounds(rounds,crops.join('·'),diseases.join('·'),psisResults.length);if(rounds.length){var pn=rounds.map(function(r){return r.item.pestiBrandName||'';}).filter(Boolean);window._lastPsisResult={pestNames:pn,diseases:diseases,rawList:psisResults,rounds:rounds};rh+='<div style="margin-top:10px;padding:10px;background:#E8F5E9;border-radius:8px;"><div style="font-size:11px;font-weight:600;color:#1B5E20;margin-bottom:6px;">🗓 방제계획에 적용</div><button onclick="_applyPsisToSchedule()" style="width:100%;padding:8px;background:var(--green-dark);color:#fff;border-radius:8px;border:none;font-size:12px;font-weight:600;cursor:pointer;">📅 방제계획 생성</button></div>';}out.innerHTML=rh;}catch(e){var errMsg=e.message||'알 수 없는 오류';if(errMsg==='undefined'||!errMsg){errMsg='GAS 서버 응답 없음 — GAS URL을 확인하세요 (⚙️ 설정)';}out.innerHTML='<div style="font-size:12px;color:var(--red-dark);">❌ '+esc(errMsg)+'</div>';}}
function _buildRounds(items,gs){if(!items.length)return[];var so={have:0,need:1,none:2};
  var sorted=items.slice().sort(function(a,b){
    var sa=so[gs(a.pestiBrandName||'')]||2, sb=so[gs(b.pestiBrandName||'')]||2;
    if(sa!==sb) return sa-sb;
    // 같은 순위면 MOA 교차 우선
    return (a.indictSymbl||'').localeCompare(b.indictSymbl||'');
  });function pm(pool,maxN,um){var p=[],un=[];pool.forEach(function(item){if(p.length>=maxN)return;var nm=item.pestiBrandName||'',moa=(item.indictSymbl||'').toUpperCase()||('_'+nm);if(un.indexOf(nm)!==-1||um.indexOf(moa)!==-1)return;p.push(item);un.push(nm);um.push(moa);});return p;}var um=[],rounds=[];pm(sorted.filter(function(r){return gs(r.pestiBrandName||'')==='have';}),3,um).forEach(function(i){rounds.push({item:i,stock:'have'});});if(rounds.length<3)pm(sorted.filter(function(r){return gs(r.pestiBrandName||'')==='need';}),3-rounds.length,um).forEach(function(i){rounds.push({item:i,stock:'need'});});if(rounds.length<3)pm(sorted.filter(function(r){return gs(r.pestiBrandName||'')==='none';}),3-rounds.length,um).forEach(function(i){rounds.push({item:i,stock:'none'});});if(rounds.length<Math.min(3,items.length)){var un2=rounds.map(function(r){return r.item.pestiBrandName||'';});sorted.forEach(function(item){if(rounds.length>=3)return;var nm=item.pestiBrandName||'';if(un2.indexOf(nm)!==-1)return;rounds.push({item:item,stock:gs(nm)});un2.push(nm);});}rounds.forEach(function(r,i){r.round=i+1;});return rounds;}
function _renderRounds(rounds,crop,dis,total){var sl={have:{icon:'✅',label:'보유중',bg:'#E8F5E9',color:'#2E7D32',border:'#A5D6A7'},need:{icon:'🛒',label:'구입필요',bg:'#FFF3E0',color:'#E65100',border:'#FFCC80'},none:{icon:'➕',label:'미등록',bg:'#F5F5F5',color:'#757575',border:'#E0E0E0'}};var rl=['1차 방제','2차 방제','3차 방제'],rc=['#1565C0','#6A1B9A','#1B5E20'];var hr=rounds.filter(function(r){return r.stock==='have';});var or2=rounds.filter(function(r){return r.stock!=='have';});var h='<div style="font-size:11px;color:var(--gray-500);margin-bottom:8px;">📋 PSIS 등록 '+total+'종 중 교차방제 추천'+(hr.length?' | ✅ 보유 '+hr.length+'종':'')+(or2.length?' | 🛒 구입필요 '+or2.length+'종':'')+'</div>';rounds.forEach(function(r){var p=r.item,st=sl[r.stock]||sl['none'],col=rc[r.round-1]||'#333',amt=p.dilutUnit?calc20L(p.dilutUnit):'';h+='<div style="border:1.5px solid '+st.border+';border-radius:10px;padding:10px 12px;margin-bottom:8px;background:'+st.bg+';">';h+='<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px;"><span style="font-size:11px;font-weight:700;color:#fff;background:'+col+';padding:2px 9px;border-radius:10px;">'+rl[r.round-1]+'</span><span style="font-size:11px;font-weight:700;color:'+st.color+';background:#fff;padding:2px 8px;border-radius:10px;border:1px solid '+st.border+';">'+st.icon+' '+st.label+'</span></div>';// 내 농약장에서 성분 일치하는 농약 찾기
    var psisIngr = (p.pestiKorName||'').split(' ')[0];
    var myMatch = psisIngr.length>2 ? (USER_DB['pest']||[]).find(function(m){
      return m.pest_status==='have' && (m.ingredient||'').toLowerCase().includes(psisIngr.toLowerCase());
    }) : null;
    var myMatchN = !myMatch && psisIngr.length>2 ? (USER_DB['pest']||[]).find(function(m){
      return m.pest_status==='need' && (m.ingredient||'').toLowerCase().includes(psisIngr.toLowerCase());
    }) : null;
    h+='<div style="font-size:14px;font-weight:800;color:#222;margin-bottom:3px;">'+esc(p.pestiBrandName||'')+(r.stock!=='have'?' <span style="font-size:11px;font-weight:600;color:#E65100;">(구입필요)</span>':'')+'</div>';
    if(myMatch){h+='<div style="font-size:11px;background:#E8F5E9;border-radius:5px;padding:3px 8px;margin-bottom:4px;color:#2E7D32;">✅ 내 농약장: <b>'+esc(myMatch.name)+'</b> (동일 성분 보유중)</div>';}
    else if(myMatchN){h+='<div style="font-size:11px;background:#FFF3E0;border-radius:5px;padding:3px 8px;margin-bottom:4px;color:#E65100;">🛒 내 농약장: <b>'+esc(myMatchN.name)+'</b> (동일 성분 구입예정)</div>';}h+='<div style="font-size:11px;color:#555;line-height:1.7;">• 성분: '+esc(p.pestiKorName||'-')+'<br>• 방제: '+esc(p.diseaseWeedName||'-')+'<br>• 사용법: '+esc(p.pestiUse||'-')+(amt?' | '+amt:'')+' | '+esc(p.useSuittime||'-')+' | '+esc(p.useNum||'-')+(p.indictSymbl?'<br>• 작용기작: '+esc(p.indictSymbl):'')+'</div></div>';});if(total>rounds.length)h+='<div style="font-size:10px;color:var(--gray-400);text-align:center;margin-top:4px;">'+total+'종 중 상위 '+rounds.length+'종 추천</div>';return h;}
function _applyPsisToSchedule(){var _r=window._lastPsisResult||{},pn=_r.pestNames||[],dis=_r.diseases||[];var de=document.getElementById('spray-disease-new');if(de&&dis.length)de.value=dis.join(', ');var crops=Array.from(document.querySelectorAll('.crop-select:checked')).map(function(c){return c.value;});if(!crops.length){showToast('STEP1에서 작물을 먼저 선택하세요');return;}generateSchedule();}

// ── 관리 패널 ────────────────────────────────────────────────
function renderManagePanel(){renderManagePestList();renderManagePlantList();}
function renderManagePestList(){var el=document.getElementById('manage-pest-list');if(!el)return;var items=USER_DB['pest']||[];if(!items.length){el.innerHTML='<div style="text-align:center;color:#aaa;padding:20px;">등록된 농약이 없습니다.</div>';return;}var cfg={have:{l:'✅ 보유중',bg:'#E8F5E9',c:'#2E7D32'},need:{l:'🛒 구입필요',bg:'#FFF3E0',c:'#E65100'},empty:{l:'📭 소진',bg:'#F5F5F5',c:'#9E9E9E'},'':{l:'미설정',bg:'#F5F5F5',c:'#bbb'}};var so={need:0,have:1,empty:2,'':3};var h='';items.slice().sort(function(a,b){return(so[a.pest_status||'']||3)-(so[b.pest_status||'']||3);}).forEach(function(p){var st=p.pest_status||'',cf=cfg[st]||cfg[''];h+='<div style="display:flex;align-items:center;gap:8px;padding:9px 4px;border-bottom:1px solid #f0f0f0;"><span style="font-size:18px;">'+(p.emoji||'🧪')+'</span><div style="flex:1;min-width:0;"><div style="font-size:13px;font-weight:600;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">'+esc(p.name||'')+'</div><div style="font-size:10px;color:#aaa;">'+esc((p.type||'')+(p.ingredient?' · '+String(p.ingredient||'').substring(0,18):''))+'</div></div><div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;"><span style="font-size:9px;padding:2px 7px;border-radius:8px;background:'+cf.bg+';color:'+cf.c+';font-weight:600;">'+cf.l+'</span><div style="display:flex;gap:3px;">'+(st!=='have'?'<button onclick="quickSetPestStatus(\''+p.id+'\',\'have\')" style="font-size:10px;padding:3px 6px;border-radius:5px;border:1px solid #A5D6A7;background:#E8F5E9;color:#2E7D32;cursor:pointer;">✅</button>':'')+(st!=='empty'?'<button onclick="quickSetPestStatus(\''+p.id+'\',\'empty\')" style="font-size:10px;padding:3px 6px;border-radius:5px;border:1px solid #ddd;background:#f5f5f5;color:#888;cursor:pointer;">📭</button>':'')+'<button onclick="openEditItem(\'pest\',\''+p.id+'\')" style="font-size:10px;padding:3px 6px;border-radius:5px;border:1px solid #ddd;background:#fff;color:#555;cursor:pointer;">✏️</button></div></div></div>';});el.innerHTML=h;}
async function quickSetPestStatus(id,ns){var p=(USER_DB['pest']||[]).find(function(x){return x.id===id;});if(!p)return;p.pest_status=ns;try{await _gasPost({ action:'updateMyPesticide', id:id, pest_status:ns, status:ns });showToast(ns==='have'?'✅ 보유중':'📭 소진');renderManagePestList();if(typeof renderMyPestPanel==='function')renderMyPestPanel();}catch(e){showToast('오류:'+e.message);}}
function renderManagePlantList(){var el=document.getElementById('manage-plant-list');if(!el)return;var plants=(APP.plants||[]).filter(function(p){return p.status!=='deleted';});if(!plants.length){el.innerHTML='<div style="text-align:center;color:#aaa;padding:16px;">등록된 작물이 없습니다.</div>';return;}var seen={},h='';plants.forEach(function(p){var nm=(p.name||'').trim();if(!nm||seen[nm])return;seen[nm]=true;var isA=p.status==='active';h+='<div style="display:flex;align-items:center;gap:8px;padding:8px 4px;border-bottom:1px solid #f0f0f0;"><span style="font-size:20px;">'+_plantEmoji(p)+'</span><div style="flex:1;"><div style="font-size:13px;font-weight:600;">'+esc(p.name||'')+'</div><div style="font-size:10px;color:#aaa;">'+esc((p.species||p.variety||'')+(p.plantDate?' · '+p.plantDate:''))+'</div></div><div style="display:flex;gap:4px;">'+(isA?'<button onclick="togglePlantStatus(\''+p.id+'\',\'dormant\')" style="font-size:10px;padding:4px 8px;border-radius:6px;border:1px solid #FFCC80;background:#FFF8E1;color:#E65100;cursor:pointer;">휴면</button>':'<button onclick="togglePlantStatus(\''+p.id+'\',\'active\')" style="font-size:10px;padding:4px 8px;border-radius:6px;border:1px solid #A5D6A7;background:#E8F5E9;color:#2E7D32;cursor:pointer;">복구</button>')+'<button onclick="confirmDeletePlant(\''+p.id+'\')" style="font-size:10px;padding:4px 8px;border-radius:6px;border:1px solid #FFCDD2;background:#fff;color:#C62828;cursor:pointer;">🗑</button></div></div>';});el.innerHTML=h;}
async function togglePlantStatus(id,ns){var p=APP.plants.find(function(x){return x.id===id;});if(!p)return;p.status=ns;try{await _gasPost({ action:'updatePlant', id:id, status:ns, updatedAt:new Date().toISOString() });showToast(ns==='active'?'✅ 활성화':'⏸ 휴면');renderManagePlantList();renderPlants();}catch(e){showToast('오류:'+e.message);}}
function confirmDeletePlant(id){var p=APP.plants.find(function(x){return x.id===id;});if(!p)return;if(!confirm((p.name||'이 작물')+'을(를) 삭제?'))return;_gasPost({ action:'deletePlant', id:id }).then(function(){APP.plants=APP.plants.filter(function(x){return x.id!==id;});showToast('🗑 삭제됨');renderManagePlantList();renderPlants();}).catch(function(e){showToast('오류:'+e.message);});}
async function removeDuplicatePlants(){var seen={},del=[];(APP.plants||[]).forEach(function(p){var nm=(p.name||'').trim();if(!nm)return;if(seen[nm])del.push(p);else seen[nm]=p;});if(!del.length){showToast('✅ 중복 없음');return;}if(!confirm('중복 '+del.length+'개 삭제?'))return;for(var i=0;i<del.length;i++){try{await _gasPost({ action:'deletePlant', id:del[i].id });}catch(e){}}APP.plants=APP.plants.filter(function(p){return!del.find(function(d){return d.id===p.id;});});showToast('🧹 중복 '+del.length+'개 정리');renderManagePlantList();renderPlants();renderToday();}

// ── 수확달력 ─────────────────────────────────────────────────
function renderHarvestPanel(){
  var container=document.getElementById('db-list');
  if(!container)return;
  // _local 조건 제거 — GAS 데이터도 _local 없음
  var all=(APP&&APP.plants)
    ? APP.plants.filter(function(p){ return p.status!=='deleted'; })
    : (window._allPlants||[]);
  console.log('[renderHarvestPanel] 전체 식물:', all.length,
    '/ plantDate 있는 것:', all.filter(function(p){return p.plantDate;}).length,
    '/ fruitDays>0:', all.filter(function(p){return parseInt(p.fruitDays)>0;}).length);
  // fruitDays OR totalDays 가 있으면 달력 표시
  var planted=all.filter(function(p){
    return p.plantDate && (parseInt(p.fruitDays)>0 || parseInt(p.totalDays)>0);
  });var h='<div style="padding:10px 0;"><div style="font-size:14px;font-weight:700;color:#1B5E20;margin-bottom:8px;">🍎 수확 달력 (심은 날짜 기준)</div>';if(planted.length){planted.forEach(function(p){h+='<div style="background:#fff;border-radius:8px;padding:8px 10px;margin-bottom:6px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 1px 3px rgba(0,0,0,.06);"><div style="font-size:12px;font-weight:600;">'+_plantEmoji(p)+' '+esc(p.name||'')+'</div><button onclick="toggleHarvestDetail(this,\''+p.id+'\')" style="padding:5px 12px;background:#1B5E20;color:#fff;border-radius:7px;border:none;font-size:11px;cursor:pointer;">📅 달력보기</button></div><div id="harvest-detail-'+p.id+'" style="display:none;padding:0 12px 8px;"></div>';});}else{h+='<div style="padding:20px;text-align:center;color:var(--gray-400);font-size:13px;">심은 날짜가 등록된 작물이 없습니다.</div>';}h+='</div>';container.innerHTML=h;}
function toggleHarvestDetail(btn,pid){var el=document.getElementById('harvest-detail-'+pid);if(!el)return;if(el.style.display!=='none'){el.style.display='none';btn.textContent='📅 달력보기';btn.style.background='#1B5E20';return;}var plant=(APP.plants||[]).find(function(p){return p.id===pid;});if(!plant){el.innerHTML='<div style="color:#aaa;font-size:12px;">정보 없음</div>';el.style.display='block';return;}var hs=typeof buildHarvestSchedule==='function'?buildHarvestSchedule(plant,'nearest'):null;el.innerHTML=hs&&typeof renderHarvestSchedule==='function'?renderHarvestSchedule(hs):'<div style="color:#aaa;font-size:12px;">수확 예정일 계산 불가</div>';el.style.display='block';btn.textContent='🔼 접기';btn.style.background='#388E3C';}

// ── 내 농약장 다중선택 ────────────────────────────────────────
function _masterSelectAll(v){document.querySelectorAll('#master-import-list .master-chk').forEach(function(c){c.checked=v;});}
async function _masterBulkAdd(){var ch=Array.from(document.querySelectorAll('#master-import-list .master-chk:checked'));if(!ch.length){showToast('선택된 항목이 없습니다');return;}var ok=0;for(var i=0;i<ch.length;i++){var c=ch[i];try{await registerMyPesticide({name:c.getAttribute('data-name'),type:c.getAttribute('data-type'),ingredient:c.getAttribute('data-ingredient'),emoji:c.getAttribute('data-emoji')||'🧪',pest_status:'have'});ok++;}catch(e){}}await loadMyPesticideList();renderMyPestPanel();showToast('✅ '+ok+'개 추가 완료');}

// ── GAS Claude 중계 ──────────────────────────────────────────
async function callClaudeViaGas(key, prompt, maxTokens) {
  var gasUrl = (typeof getEffectiveGasUrl==='function') ? getEffectiveGasUrl() : '';
  if (!gasUrl) return {ok:false, error:'GAS URL 없음'};
  var res = await fetch(gasUrl, {
    method:'POST', headers:{'Content-Type':'text/plain'},
    body: JSON.stringify({action:'claude_relay', apiKey:key, prompt:prompt, maxTokens:maxTokens||1000})
  });
  return await res.json();
}

// ── emoji 수정 ───────────────────────────────────────────────
async function fixAllEmojis(){var plants=APP.plants||[],fixed=0;for(var i=0;i<plants.length;i++){var p=plants[i];if(!p.id||p._local)continue;var ce=_plantEmoji(Object.assign({},p,{emoji:''}));var cur=(p.emoji||'').trim();var need=!cur||cur.includes('?')||!cur.codePointAt||cur.codePointAt(0)<0x2000;if(need&&ce){try{await _gasPost({ action:'updatePlant', id:p.id, emoji:ce });p.emoji=ce;fixed++;}catch(e){}}}showToast('✅ '+fixed+'개 이모지 수정');renderToday();renderPlants();}
async function autoFixEmojis(){ /* GAS 준비 후 활성화 */ }

// autoFixEmojis 시작 시 호출
// setTimeout(function(){ try{autoFixEmojis();}catch(e){}}, 2000); // GAS 준비 후 활성화
// setTimeout(function(){ try{_fixPlantNames().then(function(){ renderPlants(); renderToday(); });}catch(e){}}, 3000); // GAS 준비 후 활성화

async function fixPlantCategories() {
  
  var fruitKw = ['유실수','과수','사과','배','복숭아','포도','블루베리','블랙베리','감','자두','매실','살구','무화과','다래','키위','앵두','마르멜로','으름','헤이즐럿','복분자'];
  function isFruit(p) {
    var cat=(p.category||'').toLowerCase(), nm=(p.name||'').toLowerCase();
    return cat.includes('유실수')||cat.includes('과수')||fruitKw.some(function(k){return nm.includes(k);});
  }
  var fixed=0, plants=APP.plants||[];
  for (var i=0;i<plants.length;i++) {
    var p=plants[i];
    if (!p.id||p._local) continue;
    var shouldBeFruit = isFruit(p);
    var currentCat = (p.category||'');
    var isCatFruit = currentCat==='유실수'||currentCat==='과수';
    // 유실수여야 하는데 category가 다른 경우
    if (shouldBeFruit && !isCatFruit) {
      try {
        await _gasPost({ action:'updatePlant', id:p.id, category:'유실수' });
        p.category='유실수';
        fixed++;
        console.log('유실수로 변경:', p.name);
      } catch(e) {}
    }
    // 채소여야 하는데 유실수로 잘못 분류된 경우는 건드리지 않음 (수동 관리)
  }
  showToast('✅ '+fixed+'개 category 수정 완료');
  renderPlants();
  renderSpraySchedulerPanel();
}

// ── 식물 category 변경 (카드에서 직접) ──────────────────────
async function _changePlantCategory(plantId) {
  var p = APP.plants.find(function(x){ return x.id===plantId; });
  if (!p) return;
  var cur = p.category||'';
  // 순환: 유실수 → 채소 → 유실수
  var next = cur==='유실수' ? '채소' : '유실수'; // 미분류도 유실수로 전환 가능
  var label = next==='유실수' ? '🌳 유실수' : '🥬 채소작물';
  if (!confirm('"'+esc(p.name)+'"을 '+label+'로 변경하시겠습니까?')) return;
  p.category = next;
  try {
    if (p.id && !p._local) { await _gasPost({ action:'updatePlant', id:p.id, category:next }); }
    showToast('✅ '+esc(p.name)+' → '+label);
    renderPlants();
  } catch(e) {
    showToast('❌ 오류: '+e.message);
  }
}

// PSIS rawList에서 농약명으로 안전사용기준 찾기
function _getPsisSafety(pestName) {
  var list = (window._lastPsisResult && window._lastPsisResult.rawList) || [];
  var nm = (pestName||'').replace(/\s/g,'');
  var item = list.find(function(r){ return (r.pestiBrandName||'').replace(/\s/g,'')===nm; });
  return item ? (item.useSuittime||'') : '';
}

// ── PSIS 추천 농약으로 방제 스케줄 생성 ─────────────────────
function buildSprayScheduleFromPsis(opts) {
  var psisRounds  = opts.psisRounds || [];
  var crops       = opts.crops || [];
  var mode        = opts.mode || 'preventive';
  var startDate   = new Date(opts.startDate || new Date());
  var totalRounds = parseInt(opts.rounds) || psisRounds.length;
  var wpref       = opts.weekendPref || 'nearest';
  var disease     = opts.disease || '';

  // 방제 간격
  var interval = 99;
  crops.forEach(function(crop) {
    var baseKey = Object.keys(SPRAY_INTERVAL).find(function(k){ return crop.includes(k); }) || 'default';
    var cfg = SPRAY_INTERVAL[baseKey];
    var days = mode==='outbreak' ? cfg.outbreak : cfg.preventive;
    if (days < interval) interval = days;
  });

  // 첫 날짜
  var firstDate = isWeekend(startDate) ? startDate : getNearestWeekend(startDate, 7).date;

  var schedule = [];
  for (var r=0; r<totalRounds; r++) {
    var rawDate   = addDays(firstDate, r * interval);
    var weekend   = getNearestWeekend(rawDate, 5);
    var sprayDate = weekend.date;
    var pr        = psisRounds[r] || null;

    // PSIS 추천 농약을 pesticides 형태로 변환
    var pesticides = [];
    if (pr) {
      var item = pr.item;
      var amt  = item.dilutUnit ? calc20L(item.dilutUnit) : '';
      pesticides.push({
        name:        item.pestiBrandName || '',
        type:        item.useName || '',
        moa:         item.indictSymbl || '',
        per20L:      amt,
        safety:      item.useSuittime || '',
        times:       item.useNum || '',
        ingredient:  item.pestiKorName || '',
        stock:       pr.stock,
      });
    }

    schedule.push({
      round:      r+1,
      rawDate:    rawDate,
      sprayDate:  sprayDate,
      diffDays:   weekend.diff,
      diffDir:    weekend.dir,
      interval:   interval,
      pesticides: pesticides,
      moas:       pesticides.map(function(p){ return p.moa; }),
    });
  }

  return {
    crops:     crops,
    disease:   disease,
    mode:      mode,
    interval:  interval,
    rounds:    totalRounds,
    schedule:  schedule,
    source:    'psis',
  };
}

// ── 내 농약장 중복 제거 ──────────────────────────────────────
async function removeDuplicatePesticides() {
  
  var items = USER_DB['pest'] || [];
  var seen = {}, dups = [];
  items.forEach(function(p) {
    var nm = (p.name||'').trim().replace(/\s/g,'');
    if (!nm) return;
    if (seen[nm]) dups.push(p);
    else seen[nm] = p;
  });
  if (!dups.length) { showToast('✅ 중복 없음'); return; }
  if (!confirm('중복 농약 '+dups.length+'개를 삭제하시겠습니까?')) return;
  for (var i=0; i<dups.length; i++) {
    try {
      var p = dups[i];
      var colId = p._col || 'userDb_pest';
      await _gasPost({ action:'deleteUserDb', tab:colId.replace('userDb_',''), id:p.id });
    } catch(e) {}
  }
  await loadMyPesticideList();
  renderMyPestPanel();
  if (typeof renderManagePestList === 'function') renderManagePestList();
  showToast('🧹 중복 '+dups.length+'개 제거 완료');
}

function _saveClaudeKey(key, inp) {
  localStorage.setItem('claude_api_key', key);
  if (inp && inp.value.trim()) {
    inp.value = '';
    inp.placeholder = '●●●●●●●●' + key.slice(-6) + ' (저장됨)';
  }
  showToast('✅ API 키 저장 완료');
}

// 작물명 직접 입력 시 처리
function _onCropInputChange(inp, slotIdx) {
  var val = (inp.value||'').trim();
  inp.style.color = val ? '#1565C0' : '';
  inp.style.fontWeight = val ? '600' : '';
  // 선택된 작물 표시 업데이트
  var chk = Array.from(document.querySelectorAll('.crop-select:checked')).map(function(c){return c.dataset.short||c.value;});
  var allInputVals = [];
  for(var i=1;i<=4;i++){var el=document.getElementById('psis-crop-'+i);if(el&&(el.value||'').trim())allInputVals.push((el.value||'').trim());}
  var dp = document.getElementById('selected-crops-display');
  if(dp){
    var display = allInputVals.length ? allInputVals : chk;
    dp.innerHTML = display.length
      ? '<span style="color:var(--green-dark);font-weight:600;">선택: </span>' + display.map(function(n){return '<span style="background:var(--green-dark);color:#fff;padding:2px 8px;border-radius:6px;font-size:11px;margin-right:4px;">'+esc(n)+'</span>';}).join('')
      : '<span style="font-size:11px;color:var(--gray-400);">작물을 선택하세요</span>';
  }
}