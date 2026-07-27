// ================================================================
// 💾 localStorage 캐시 관리 시스템
// ================================================================
// 작성일: 2026-07-27
// 버전: v1.0
// 설명: GAS와 localStorage 동기화 시스템
// ================================================================

// ================================================================
// 📋 캐시 키 정의
// ================================================================

const CACHE_CONFIG = {
  KEYS: {
    plants: 'cache_plants',
    workLog: 'cache_workLog',
    checkedTasks: 'cache_checkedTasks',
    pesticides: 'cache_pesticides',
    preparation: 'cache_preparation',
    meta: 'cache_meta'
  },
  REQUIRED_KEYS: [
    'cache_plants',
    'cache_workLog',
    'cache_checkedTasks',
    'cache_pesticides'
  ],
  VERSION: '1.0'
};

// ================================================================
// 1️⃣ initCache() - 초기 캐시 확인 및 초기화
// ================================================================

async function initCache() {
  console.log('[initCache] 시작');
  
  try {
    // localStorage에 캐시가 있는지 확인
    const hasCachedData = checkCacheValidity();
    
    if (hasCachedData) {
      console.log('[initCache] ✅ 캐시 데이터 발견, 사용');
      return true; // 캐시 있음
    } else {
      console.log('[initCache] 캐시 데이터 없음, GAS에서 새로 로드');
      return false; // 캐시 없음
    }
    
  } catch (error) {
    console.error('[initCache] 오류:', error);
    return false;
  }
}

function checkCacheValidity() {
  // 모든 필수 캐시 키가 있는지 확인
  for (const key of CACHE_CONFIG.REQUIRED_KEYS) {
    const data = localStorage.getItem(key);
    if (!data) {
      console.warn(`[checkCacheValidity] ${key} 없음`);
      return false;
    }
    
    // JSON 형식 검증
    try {
      JSON.parse(data);
    } catch (e) {
      console.warn(`[checkCacheValidity] ${key} JSON 형식 오류`);
      return false;
    }
  }
  
  console.log('[checkCacheValidity] ✅ 모든 캐시 유효');
  return true;
}

// ================================================================
// 2️⃣ loadFromCache() - localStorage에서 데이터 읽기
// ================================================================

function loadFromCache() {
  console.log('[loadFromCache] 시작');
  
  try {
    // plants
    const plantsCache = localStorage.getItem(CACHE_CONFIG.KEYS.plants);
    if (plantsCache) {
      APP.plants = JSON.parse(plantsCache);
      console.log(`[loadFromCache] ✓ plants: ${APP.plants.length}개`);
    }
    
    // workLog
    const logsCache = localStorage.getItem(CACHE_CONFIG.KEYS.workLog);
    if (logsCache) {
      APP.logs = JSON.parse(logsCache);
      console.log(`[loadFromCache] ✓ workLog: ${APP.logs.length}개`);
    }
    
    // checkedTasks
    const checkedCache = localStorage.getItem(CACHE_CONFIG.KEYS.checkedTasks);
    if (checkedCache) {
      APP.doneTasks = JSON.parse(checkedCache);
      console.log('[loadFromCache] ✓ checkedTasks');
    }
    
    // pesticides
    const pesticidesCache = localStorage.getItem(CACHE_CONFIG.KEYS.pesticides);
    if (pesticidesCache) {
      APP.pesticides = JSON.parse(pesticidesCache);
      console.log(`[loadFromCache] ✓ pesticides: ${APP.pesticides.length}개`);
    }
    
    // 준비사항 (선택사항)
    const prepCache = localStorage.getItem(CACHE_CONFIG.KEYS.preparation);
    if (prepCache) {
      APP.allPreparations = JSON.parse(prepCache);
      console.log(`[loadFromCache] ✓ 준비사항: ${APP.allPreparations.length}개`);
    }
    
    console.log('[loadFromCache] ✅ 완료');
    return true;
    
  } catch (error) {
    console.error('[loadFromCache] 오류:', error);
    return false;
  }
}

// ================================================================
// 3️⃣ saveAllToCache() - 모든 데이터를 localStorage에 저장
// ================================================================

function saveAllToCache() {
  console.log('[saveAllToCache] 시작');
  
  try {
    // plants
    if (APP.plants && APP.plants.length > 0) {
      localStorage.setItem(
        CACHE_CONFIG.KEYS.plants,
        JSON.stringify(APP.plants)
      );
      console.log(`[saveAllToCache] ✓ plants: ${APP.plants.length}개 저장`);
    }
    
    // workLog
    if (APP.logs && APP.logs.length > 0) {
      localStorage.setItem(
        CACHE_CONFIG.KEYS.workLog,
        JSON.stringify(APP.logs)
      );
      console.log(`[saveAllToCache] ✓ workLog: ${APP.logs.length}개 저장`);
    }
    
    // checkedTasks
    if (APP.doneTasks) {
      localStorage.setItem(
        CACHE_CONFIG.KEYS.checkedTasks,
        JSON.stringify(APP.doneTasks)
      );
      console.log('[saveAllToCache] ✓ checkedTasks 저장');
    }
    
    // pesticides
    if (APP.pesticides && APP.pesticides.length > 0) {
      localStorage.setItem(
        CACHE_CONFIG.KEYS.pesticides,
        JSON.stringify(APP.pesticides)
      );
      console.log(`[saveAllToCache] ✓ pesticides: ${APP.pesticides.length}개 저장`);
    }
    
    // 준비사항
    if (APP.allPreparations && APP.allPreparations.length > 0) {
      localStorage.setItem(
        CACHE_CONFIG.KEYS.preparation,
        JSON.stringify(APP.allPreparations)
      );
      console.log(`[saveAllToCache] ✓ 준비사항: ${APP.allPreparations.length}개 저장`);
    }
    
    // 메타데이터
    const meta = {
      version: CACHE_CONFIG.VERSION,
      lastUpdated: new Date().toISOString(),
      timestamp: Date.now()
    };
    localStorage.setItem(CACHE_CONFIG.KEYS.meta, JSON.stringify(meta));
    console.log('[saveAllToCache] ✓ 메타데이터 저장');
    
    console.log('[saveAllToCache] ✅ 완료');
    return true;
    
  } catch (error) {
    console.error('[saveAllToCache] 오류:', error);
    
    // localStorage 공간 부족 처리
    if (error.name === 'QuotaExceededError') {
      console.warn('[saveAllToCache] 공간 부족, 정리 중...');
      clearOldCache();
      // 재시도
      return saveAllToCache();
    }
    
    return false;
  }
}

// ================================================================
// 4️⃣ saveSingleToCache() - 특정 시트만 캐시 업데이트
// ================================================================

function saveSingleToCache(sheetName, data) {
  console.log(`[saveSingleToCache] ${sheetName} 시작`);
  
  try {
    const cacheKeyMap = {
      'plants': CACHE_CONFIG.KEYS.plants,
      'workLog': CACHE_CONFIG.KEYS.workLog,
      'checkedTasks': CACHE_CONFIG.KEYS.checkedTasks,
      'pesticides': CACHE_CONFIG.KEYS.pesticides,
      '준비사항': CACHE_CONFIG.KEYS.preparation
    };
    
    const cacheKey = cacheKeyMap[sheetName];
    
    if (!cacheKey) {
      console.warn(`[saveSingleToCache] 알 수 없는 시트: ${sheetName}`);
      return false;
    }
    
    if (data) {
      localStorage.setItem(cacheKey, JSON.stringify(data));
      console.log(`[saveSingleToCache] ✅ ${sheetName} 캐시 업데이트`);
      return true;
    }
    
    return false;
    
  } catch (error) {
    console.error(`[saveSingleToCache] 오류:`, error);
    
    if (error.name === 'QuotaExceededError') {
      clearOldCache();
      return saveSingleToCache(sheetName, data);
    }
    
    return false;
  }
}

// ================================================================
// 5️⃣ saveToGAS() - GAS와 localStorage에 동시 저장 ⭐ 중요!
// ================================================================

async function saveToGAS(sheetName, data, action = 'update') {
  console.log(`[saveToGAS] ${sheetName} (${action}) 시작`);
  
  try {
    // 1️⃣ GAS에 저장
    const response = await _gasSet(action, sheetName, data);
    
    if (!response.success) {
      console.error(`[saveToGAS] GAS 저장 실패:`, response);
      throw new Error('GAS 저장 실패');
    }
    
    console.log(`[saveToGAS] ✓ GAS에 저장됨`);
    
    // 2️⃣ localStorage에도 즉시 업데이트
    const updateSuccess = saveSingleToCache(sheetName, data);
    
    if (!updateSuccess) {
      console.warn(`[saveToGAS] 캐시 업데이트 실패`);
      // 캐시 실패는 계속 진행 (GAS는 성공했으므로)
    }
    
    console.log(`[saveToGAS] ✅ 완료 (GAS + 캐시)`);
    return true;
    
  } catch (error) {
    console.error(`[saveToGAS] 오류:`, error);
    showErrorDialog(`저장 실패: ${error.message}`);
    return false;
  }
}

// ================================================================
// 6️⃣ refreshFromGAS() - GAS에서 새로고침 (덮어쓰기)
// ================================================================

async function refreshFromGAS() {
  console.log('[refreshFromGAS] 새로고침 시작');
  
  // 확인 대화
  if (!confirm('새로운 데이터를 가져올까요?\n(로컬 캐시는 초기화됩니다)')) {
    console.log('[refreshFromGAS] 사용자 취소');
    return false;
  }
  
  // 로딩 UI 표시
  showLoadingOverlay(true);
  
  try {
    // 1️⃣ 기존 캐시 삭제
    clearAllCache();
    console.log('[refreshFromGAS] ✓ 캐시 삭제');
    
    // 2️⃣ GAS에서 새 데이터 로드
    console.log('[refreshFromGAS] GAS에서 로드 중...');
    await loadPlantsFromGAS();
    await loadWorklogsFromGAS();
    await loadCheckedTasksFromGAS();
    await loadPesticidesFromGAS();
    await loadPreparationFromGAS();
    console.log('[refreshFromGAS] ✓ GAS에서 로드 완료');
    
    // 3️⃣ 새 데이터를 캐시에 저장 (덮어쓰기)
    saveAllToCache();
    console.log('[refreshFromGAS] ✓ 새 데이터로 캐시 덮어쓰기');
    
    // 4️⃣ UI 업데이트
    renderToday();
    renderPlants();
    renderLogs();
    renderDb();
    renderPreparation();
    
    showToast('✅ 새로고침 완료!');
    console.log('[refreshFromGAS] ✅ 완료');
    
    return true;
    
  } catch (error) {
    console.error('[refreshFromGAS] 오류:', error);
    showErrorDialog('새로고침 실패');
    
    // 에러 발생시 캐시 복구 시도
    try {
      await loadFromCache();
      renderToday();
      renderPlants();
    } catch (e) {
      console.error('[refreshFromGAS] 캐시 복구 실패:', e);
    }
    
    return false;
    
  } finally {
    showLoadingOverlay(false);
  }
}

// ================================================================
// 7️⃣ clearAllCache() - 캐시 전체 삭제
// ================================================================

function clearAllCache() {
  console.log('[clearAllCache] 시작');
  
  const keys = Object.values(CACHE_CONFIG.KEYS);
  
  keys.forEach(key => {
    localStorage.removeItem(key);
    console.log(`[clearAllCache] ✓ ${key} 삭제됨`);
  });
  
  console.log('[clearAllCache] ✅ 전체 캐시 삭제');
}

// ================================================================
// 8️⃣ clearOldCache() - 공간 부족시 오래된 캐시 정리
// ================================================================

function clearOldCache() {
  console.warn('[clearOldCache] localStorage 공간 부족, 정리 중...');
  
  // 크기 큰 것부터 삭제
  const priorityKeys = [
    CACHE_CONFIG.KEYS.preparation,  // 가장 큼 (71%)
    CACHE_CONFIG.KEYS.pesticides,   // (24%)
    CACHE_CONFIG.KEYS.plants,       // (3%)
    CACHE_CONFIG.KEYS.workLog,      // (1%)
    CACHE_CONFIG.KEYS.checkedTasks  // 가장 작음 (0.2%)
  ];
  
  for (const key of priorityKeys) {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`[clearOldCache] ✓ ${key} 삭제됨 (용량 확보)`);
      return true;
    }
  }
  
  console.warn('[clearOldCache] 삭제할 캐시 없음');
  return false;
}

// ================================================================
// 9️⃣ getCacheSize() - 캐시 용량 확인 (디버그용)
// ================================================================

function getCacheSize() {
  let totalSize = 0;
  const details = {};
  
  for (const [name, key] of Object.entries(CACHE_CONFIG.KEYS)) {
    const data = localStorage.getItem(key);
    if (data) {
      const size = new Blob([data]).size;
      details[name] = {
        key: key,
        sizeBytes: size,
        sizeKB: (size / 1024).toFixed(2),
        sizeMB: (size / 1024 / 1024).toFixed(4)
      };
      totalSize += size;
    }
  }
  
  return {
    totalBytes: totalSize,
    totalKB: (totalSize / 1024).toFixed(2),
    totalMB: (totalSize / 1024 / 1024).toFixed(4),
    details: details,
    timestamp: new Date().toISOString()
  };
}

// 콘솔에서 확인
function showCacheInfo() {
  const info = getCacheSize();
  console.table(info.details);
  console.log(`[Cache] 총 용량: ${info.totalKB} KB (${info.totalMB} MB)`);
  console.log('[Cache] localStorage 한도: 5 MB (Safari)');
  console.log(`[Cache] 사용률: ${(info.totalBytes / 5242880 * 100).toFixed(1)}%`);
}

// ================================================================
// 🔟 initGAS() - 수정된 초기화 함수 ⭐ 중요!
// ================================================================

async function initGAS() {
  console.log('[initGAS] 시작 (캐시 기반)');
  
  try {
    // 1️⃣ 캐시 확인
    const hasCachedData = await initCache();
    
    if (hasCachedData) {
      // 캐시 있음: localStorage에서 로드
      console.log('[initGAS] 캐시에서 로드');
      loadFromCache();
      
    } else {
      // 캐시 없음: GAS에서 로드 후 캐시 저장
      console.log('[initGAS] GAS에서 로드');
      
      await loadPlantsFromGAS();
      await loadWorklogsFromGAS();
      await loadCheckedTasksFromGAS();
      await loadPesticidesFromGAS();
      
      // 로드 완료 후 캐시 저장
      saveAllToCache();
    }
    
    // 2️⃣ UI 렌더링
    renderToday();
    renderPlants();
    renderLogs();
    renderDb();
    
    // 3️⃣ 준비사항은 매번 로드 (현재 주차만 필요하므로 캐시 안 함)
    await loadPreparationFromGAS();
    renderPreparation();
    
    console.log('[initGAS] ✅ 완료');
    
  } catch (error) {
    console.error('[initGAS] 오류:', error);
    showErrorDialog('앱 초기화 실패');
  }
}

// ================================================================
// 📝 사용 예시
// ================================================================

/*
// 콘솔에서 캐시 상태 확인
showCacheInfo();

// 캐시 삭제 후 새로고침
refreshFromGAS();

// 특정 시트 저장 (GAS + 캐시)
saveToGAS('plants', plantObject, 'update');

// 캐시 전체 삭제
clearAllCache();
*/

// ================================================================
// ✅ 이 파일의 함수들을 index1-app.js에 추가하세요!
// ================================================================

