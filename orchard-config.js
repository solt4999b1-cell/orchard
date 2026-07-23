// ════════════════════════════════════════════════════════════════
// 🎯 Google Sheets 통합 설정 (Firebase 제거)
// ════════════════════════════════════════════════════════════════

// Google Sheets 설정
let SHEET_ID = '12cRWUcZah1z3DaZq5aJcojV8m3J5UU3m2F2ux6GwCec';
const GAS_URL = 'https://script.google.com/macros/s/AKfycbwFkOeNwDjDCRqHUM93NTSTxeQTaoRlbh8yVPR41LURA8d31hgWXxgRxe8Xi5lkV0j1/exec';

// 컬렉션 매핑
const COLLECTIONS = {
  workLog: 'workLog',
  growPlants: 'growPlants',
  supplies: 'supplies',
  checkedTasks: 'checkedTasks',
  growRecords: 'growRecords',
  irangChanges: 'irangChanges',
  irangLog: 'irangLog'
};

// Google Sheets에서 데이터 로드 (POST 방식)
async function loadFromGoogleSheets(collectionName) {
  try {
    console.log(`📊 Google Sheets에서 ${collectionName} 로드 중...`);
    
    const params = new URLSearchParams();
    params.append('action', 'readCollection');
    params.append('collectionName', collectionName);
    
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: params
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '로드 실패');
    }
    
    console.log(`✅ ${collectionName} 로드 완료: ${(result.data || []).length}개 항목`);
    return result.data || [];
  } catch (err) {
    console.error(`❌ ${collectionName} 로드 실패:`, err);
    return [];
  }
}

// Google Sheets에 데이터 저장/생성 (POST 방식)
async function saveToGoogleSheets(action, sheetName, data) {
  try {
    console.log(`💾 Google Sheets에 ${action} 중:`, sheetName);
    
    const params = new URLSearchParams();
    params.append('action', action);
    params.append('sheetName', sheetName);
    
    // 데이터 필드들 추가
    for (const key in data) {
      params.append(key, data[key] || '');
    }
    
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: params
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.message || '저장 실패');
    }
    
    console.log(`✅ ${action} 완료:`, result.message);
    return result;
  } catch (err) {
    console.error(`❌ ${action} 실패:`, err);
    throw err;
  }
}

// ════════════════════════════════════════════════════════════════
// 📥 컬렉션별 로드 함수들
// ════════════════════════════════════════════════════════════════

let workLog = [];
let plants = [];
let mySupplies = [];
let checkedTasks = {};
let growRecords = [];
let irangChanges = [];
let irangLog = [];

// Google Sheets 초기화 (Firebase 대체)
async function initializeGoogleSheets() {
  try {
    console.log('🔧 Google Sheets 초기화 중...');
    
    // 7개 컬렉션 동시 로드
    const [wl, gp, sup, ct, gr, ic, il] = await Promise.all([
      loadFromGoogleSheets(COLLECTIONS.workLog),
      loadFromGoogleSheets(COLLECTIONS.growPlants),
      loadFromGoogleSheets(COLLECTIONS.supplies),
      loadFromGoogleSheets(COLLECTIONS.checkedTasks),
      loadFromGoogleSheets(COLLECTIONS.growRecords),
      loadFromGoogleSheets(COLLECTIONS.irangChanges),
      loadFromGoogleSheets(COLLECTIONS.irangLog)
    ]);
    
    // 전역 변수에 할당
    workLog = wl || [];
    plants = gp || [];
    mySupplies = sup || [];
    
    // checkedTasks는 객체 형태로 변환
    if (Array.isArray(ct)) {
      checkedTasks = {};
      ct.forEach(item => {
        if (item.key && item.checked) {
          checkedTasks[item.key] = true;
        }
      });
    }
    
    growRecords = gr || [];
    irangChanges = ic || [];
    irangLog = il || [];
    
    // localStorage에 백업
    localStorage.setItem('workLog', JSON.stringify(workLog));
    localStorage.setItem('plants', JSON.stringify(plants));
    localStorage.setItem('mySupplies', JSON.stringify(mySupplies));
    localStorage.setItem('checkedTasks', JSON.stringify(checkedTasks));
    localStorage.setItem('growRecords', JSON.stringify(growRecords));
    localStorage.setItem('irangChanges', JSON.stringify(irangChanges));
    localStorage.setItem('irangLog', JSON.stringify(irangLog));
    
    console.log('✅ Google Sheets 초기화 완료');
    console.log(`  - workLog: ${workLog.length}개`);
    console.log(`  - plants: ${plants.length}개`);
    console.log(`  - supplies: ${mySupplies.length}개`);
    console.log(`  - growRecords: ${growRecords.length}개`);
    
    return true;
  } catch (err) {
    console.error('❌ Google Sheets 초기화 실패:', err);
    
    // Firebase 오류시 localStorage에서 복원
    try {
      workLog = JSON.parse(localStorage.getItem('workLog') || '[]');
      plants = JSON.parse(localStorage.getItem('plants') || '[]');
      mySupplies = JSON.parse(localStorage.getItem('mySupplies') || '[]');
      checkedTasks = JSON.parse(localStorage.getItem('checkedTasks') || '{}');
      growRecords = JSON.parse(localStorage.getItem('growRecords') || '[]');
      irangChanges = JSON.parse(localStorage.getItem('irangChanges') || '[]');
      irangLog = JSON.parse(localStorage.getItem('irangLog') || '[]');
      
      console.log('✅ localStorage에서 복원됨');
      return true;
    } catch (e) {
      console.error('❌ 데이터 복원 실패:', e);
      return false;
    }
  }
}

// ════════════════════════════════════════════════════════════════
// 🎨 SVG 라이브러리 로드 (Google Sheets에서)
// ════════════════════════════════════════════════════════════════

window.svgLibrary = {}; // 전역 SVG 저장소

async function loadSVGLibrary() {
  try {
    console.log('🎨 SVG 라이브러리 로드 중...');
    
    const params = new URLSearchParams();
    params.append('action', 'readCollection');
    params.append('collectionName', 'svgLibrary');
    
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: params
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    
    if (result.success && result.data) {
      // SVG 데이터를 ID로 매핑
      result.data.forEach(item => {
        window.svgLibrary[item.svgName] = item.svgData;
      });
      
      localStorage.setItem('svgLibrary', JSON.stringify(window.svgLibrary));
      console.log(`✅ SVG 라이브러리 로드 완료 (${Object.keys(window.svgLibrary).length}개)`);
      
      // 모든 placeholder에 SVG 렌더링
      renderAllSVGs();
      return true;
    } else {
      throw new Error(result.message || 'SVG 로드 실패');
    }
  } catch(err) {
    console.warn('⚠️ Google Sheets에서 SVG 로드 실패:', err.message);
    
    // localStorage에서 캐시된 SVG 복원
    try {
      window.svgLibrary = JSON.parse(localStorage.getItem('svgLibrary') || '{}');
      if (Object.keys(window.svgLibrary).length > 0) {
        console.log(`✅ localStorage에서 ${Object.keys(window.svgLibrary).length}개 SVG 복원됨`);
        renderAllSVGs();
        return true;
      }
    } catch(e) {}
    
    console.error('❌ SVG 로드 완전 실패');
    return false;
  }
}

// SVG placeholder를 실제 SVG로 렌더링
function renderAllSVGs() {
  const svgNames = ['schedule', 'calendar', 'growRecord', 'workLog', 'irangStatus', 'pestControl', 'fertilizer', 'fertilizer2', 'simple'];
  
  svgNames.forEach(name => {
    const placeholder = document.getElementById(`svg-${name}`);
    if (placeholder && window.svgLibrary[name]) {
      placeholder.innerHTML = window.svgLibrary[name];
      console.log(`📦 ${name} SVG 렌더링 완료`);
    } else if (placeholder) {
      console.warn(`⚠️ ${name} SVG를 찾을 수 없습니다`);
    }
  });
}

// ════════════════════════════════════════════════════════════════
// ⚙️ 설정 데이터 로드 (Google Sheets configData 탭)
// ════════════════════════════════════════════════════════════════

async function loadConfigData() {
  try {
    console.log('⚙️ 설정 데이터 로드 중...');
    
    const params = new URLSearchParams();
    params.append('action', 'readCollection');
    params.append('collectionName', 'configData');
    
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: params
    });
    
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    
    if (result.success && result.data) {
      // configData에서 각 설정 추출
      let configMap = {};
      result.data.forEach(item => {
        try {
          // JSON 문자열을 객체/배열로 파싱
          configMap[item.configName] = JSON.parse(item.configData);
        } catch(e) {
          console.warn(`⚠️ ${item.configName} 파싱 실패:`, e.message);
        }
      });
      
      // 전역 변수 업데이트
      if (configMap.MONTHLY_SCHEDULE) {
        window.MONTHLY_SCHEDULE = configMap.MONTHLY_SCHEDULE;
        console.log('✅ MONTHLY_SCHEDULE 로드 완료');
      }
      
      if (configMap.allPlants) {
        window.allPlants = configMap.allPlants;
        console.log(`✅ allPlants 로드 완료 (${configMap.allPlants.length}개)`);
      }
      
      localStorage.setItem('configData', JSON.stringify(configMap));
      return true;
    } else {
      throw new Error(result.message || '설정 로드 실패');
    }
  } catch(err) {
    console.warn('⚠️ Google Sheets에서 설정 로드 실패:', err.message);
    
    // localStorage에서 캐시된 데이터 복원
    try {
      const cached = JSON.parse(localStorage.getItem('configData') || '{}');
      if (cached.MONTHLY_SCHEDULE) {
        window.MONTHLY_SCHEDULE = cached.MONTHLY_SCHEDULE;
      }
      if (cached.allPlants) {
        window.allPlants = cached.allPlants;
      }
      console.log('✅ localStorage에서 설정 복원됨');
      return true;
    } catch(e) {
      console.error('❌ 설정 로드 완전 실패');
      return false;
    }
  }
}

// ════════════════════════════════════════════════════════════════
// 💾 CRUD 함수들 (Google Sheets 버전)
// ════════════════════════════════════════════════════════════════

// workLog 저장
async function fbSaveLog(entry) {
  try {
    const idx = workLog.findIndex(x => String(x.id) === String(entry.id));
    if (idx >= 0) {
      workLog[idx] = entry;
    } else {
      workLog.unshift(entry);
    }
    
    localStorage.setItem('workLog', JSON.stringify(workLog));
    
    // Google Sheets에 저장
    return await saveToGoogleSheets('create', COLLECTIONS.workLog, entry);
  } catch (err) {
    console.error('❌ workLog 저장 실패:', err);
    throw err;
  }
}

// workLog 삭제
async function fbDeleteLog(id) {
  try {
    workLog = workLog.filter(e => e.id !== id);
    localStorage.setItem('workLog', JSON.stringify(workLog));
    
    // Google Sheets에서 삭제
    return await saveToGoogleSheets('delete', COLLECTIONS.workLog, { id });
  } catch (err) {
    console.error('❌ workLog 삭제 실패:', err);
    throw err;
  }
}

// 식물 저장
async function fbSavePlant(id, plantData) {
  try {
    const idx = plants.findIndex(p => p.id === id);
    if (idx >= 0) {
      plants[idx] = plantData;
    } else {
      plants.push(plantData);
    }
    
    localStorage.setItem('plants', JSON.stringify(plants));
    
    // Google Sheets에 저장
    return await saveToGoogleSheets('create', COLLECTIONS.growPlants, plantData);
  } catch (err) {
    console.error('❌ 식물 저장 실패:', err);
    throw err;
  }
}

// 식물 삭제
async function fbDeletePlant(id) {
  try {
    plants = plants.filter(p => p.id !== id);
    localStorage.setItem('plants', JSON.stringify(plants));
    
    // Google Sheets에서 삭제
    return await saveToGoogleSheets('delete', COLLECTIONS.growPlants, { id });
  } catch (err) {
    console.error('❌ 식물 삭제 실패:', err);
    throw err;
  }
}

// 물품 저장
async function fbSaveSupply(entry) {
  try {
    const idx = mySupplies.findIndex(x => String(x.id) === String(entry.id));
    if (idx >= 0) {
      mySupplies[idx] = entry;
    } else {
      mySupplies.push(entry);
    }
    
    localStorage.setItem('mySupplies', JSON.stringify(mySupplies));
    
    // Google Sheets에 저장
    return await saveToGoogleSheets('create', COLLECTIONS.supplies, entry);
  } catch (err) {
    console.error('❌ 물품 저장 실패:', err);
    throw err;
  }
}

// 물품 삭제
async function fbDeleteSupply(id) {
  try {
    mySupplies = mySupplies.filter(s => s.id !== id);
    localStorage.setItem('mySupplies', JSON.stringify(mySupplies));
    
    // Google Sheets에서 삭제
    return await saveToGoogleSheets('delete', COLLECTIONS.supplies, { id });
  } catch (err) {
    console.error('❌ 물품 삭제 실패:', err);
    throw err;
  }
}

// 체크 작업 저장
async function fbSaveCheckTask(key, checked) {
  try {
    if (checked) {
      checkedTasks[key] = true;
    } else {
      delete checkedTasks[key];
    }
    
    localStorage.setItem('checkedTasks', JSON.stringify(checkedTasks));
    
    // Google Sheets에 저장
    return await saveToGoogleSheets('create', COLLECTIONS.checkedTasks, { key, checked });
  } catch (err) {
    console.error('❌ 체크 작업 저장 실패:', err);
    throw err;
  }
}

// 생육 기록 저장
async function fbSaveGrowRecord(entry) {
  try {
    const idx = growRecords.findIndex(x => String(x.id) === String(entry.id));
    if (idx >= 0) {
      growRecords[idx] = entry;
    } else {
      growRecords.push(entry);
    }
    
    localStorage.setItem('growRecords', JSON.stringify(growRecords));
    
    // Google Sheets에 저장
    return await saveToGoogleSheets('create', COLLECTIONS.growRecords, entry);
  } catch (err) {
    console.error('❌ 생육 기록 저장 실패:', err);
    throw err;
  }
}

// 이랑 변경 저장
async function fbSaveIrangChange(change) {
  try {
    irangChanges.push(change);
    localStorage.setItem('irangChanges', JSON.stringify(irangChanges));
    
    // Google Sheets에 저장
    return await saveToGoogleSheets('create', COLLECTIONS.irangChanges, change);
  } catch (err) {
    console.error('❌ 이랑 변경 저장 실패:', err);
    throw err;
  }
}

// 이랑 로그 저장
async function fbSaveIrangLog(entry) {
  try {
    irangLog.unshift(entry);
    localStorage.setItem('irangLog', JSON.stringify(irangLog));
    
    // Google Sheets에 저장
    return await saveToGoogleSheets('create', COLLECTIONS.irangLog, entry);
  } catch (err) {
    console.error('❌ 이랑 로그 저장 실패:', err);
    throw err;
  }
}

console.log('✅ Google Sheets 함수 로드 완료');