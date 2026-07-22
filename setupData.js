/**
 * setupData.js
 * 
 * 사용 방법:
 * 1. index.html의 <head>에 이 파일을 포함: <script src="setupData.js"></script>
 * 2. 브라우저 콘솔에서 다음 명령 실행:
 *    await setupAllData();
 * 
 * 이 프로그램은 한 번만 실행하면 됩니다!
 */

const GAS_URL = 'https://script.google.com/macros/s/AKfycbwXbgptSmUJ8vhr_crTAsnbMhoSPzronQdJNWfLN2z7xaJpb-k3Pr8Ts9aNjfqKDI4b/exec';
/**
 * setupData.js
 * 
 * 사용 방법:
 * 1. index.html의 <head>에 이 파일을 포함: <script src="setupData.js"></script>
 * 2. 브라우저 콘솔에서 다음 명령 실행:
 *    await setupAllData();
 * 
 * 이 프로그램은 한 번만 실행하면 됩니다!
 */

/**
 * Google Sheets에 데이터 저장 (탭별로)
 * GAS_URL은 index.html에서 이미 정의됨
 */
async function saveToGoogleSheets(tabName, data) {
  try {
    const response = await fetch(GAS_URL, {
      method: 'POST',
      body: new URLSearchParams({
        action: 'saveData',
        tabName: tabName,
        data: JSON.stringify(data)
      })
    });
    const result = await response.json();
    console.log(`✅ ${tabName} 저장 완료:`, result.message);
    return result.success;
  } catch (error) {
    console.error(`❌ ${tabName} 저장 실패:`, error);
    return false;
  }
}

/**
 * 모든 데이터 추출 및 Google Sheets에 업로드
 */
async function setupAllData() {
  console.log('🚀 데이터 설정 시작...\n');

  const results = [];

  // 1️⃣ allPlants 저장
  console.log('1️⃣ allPlants 업로드 중...');
  if (typeof allPlants !== 'undefined') {
    const success = await saveToGoogleSheets('plants', {
      id: 'allPlants',
      dataName: 'allPlants',
      data: JSON.stringify(allPlants)
    });
    results.push({ name: 'allPlants', success });
  } else {
    console.warn('⚠️ allPlants 정의되지 않음');
  }

  // 2️⃣ MONTHLY_SCHEDULE 저장
  console.log('\n2️⃣ MONTHLY_SCHEDULE 업로드 중...');
  if (typeof MONTHLY_SCHEDULE !== 'undefined') {
    const success = await saveToGoogleSheets('config', {
      id: 'monthly_schedule',
      configName: 'MONTHLY_SCHEDULE',
      configData: JSON.stringify(MONTHLY_SCHEDULE)
    });
    results.push({ name: 'MONTHLY_SCHEDULE', success });
  } else {
    console.warn('⚠️ MONTHLY_SCHEDULE 정의되지 않음');
  }

  // 3️⃣ SVG 저장
  console.log('\n3️⃣ SVG 라이브러리 업로드 중...');
  const svgElements = document.querySelectorAll('svg[id^="svg-"]');
  if (svgElements.length > 0) {
    const svgLibrary = [];
    svgElements.forEach((svg, index) => {
      const svgName = svg.id.replace('svg-', '') || `svg_${index + 1}`;
      const svgData = svg.outerHTML;
      svgLibrary.push({
        id: index + 1,
        svgName: svgName,
        svgData: svgData
      });
    });

    for (let i = 0; i < svgLibrary.length; i++) {
      const svg = svgLibrary[i];
      const success = await saveToGoogleSheets('svgLibrary', svg);
      if (i === 0) results.push({ name: `SVG (${svgLibrary.length}개)`, success });
    }
  } else {
    console.warn('⚠️ SVG 요소 없음');
  }

  // 4️⃣ Manifest 저장
  console.log('\n4️⃣ Manifest 업로드 중...');
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink && manifestLink.href.includes('data:')) {
    const b64Data = manifestLink.href.split('base64,')[1];
    if (b64Data) {
      const manifestJSON = JSON.parse(atob(b64Data));
      const success = await saveToGoogleSheets('config', {
        id: 'manifest',
        configName: 'manifest',
        configData: JSON.stringify(manifestJSON)
      });
      results.push({ name: 'Manifest', success });
    }
  } else {
    console.warn('⚠️ Manifest 링크 없음');
  }

  // 5️⃣ Meta 태그 저장
  console.log('\n5️⃣ Meta 태그 업로드 중...');
  const metaTags = [];
  document.querySelectorAll('meta').forEach((meta, index) => {
    if (meta.name || meta.charset) {
      metaTags.push({
        name: meta.name || meta.charset,
        content: meta.content || ''
      });
    }
  });
  
  if (metaTags.length > 0) {
    const success = await saveToGoogleSheets('config', {
      id: 'metaTags',
      configName: 'metaTags',
      configData: JSON.stringify(metaTags)
    });
    results.push({ name: 'Meta 태그', success });
  }

  // ✅ 완료 요약
  console.log('\n' + '='.repeat(50));
  console.log('✅ 데이터 설정 완료!\n');
  console.log('📊 결과:');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} ${r.name}`);
  });
  console.log('\n💡 다음 단계:');
  console.log('  1. Google Sheets 확인: https://docs.google.com/spreadsheets/d/12cRWUcZah1z3DaZq5aJcojV8m3J5UU3m2F2ux6GwCec');
  console.log('  2. index.html 수정 (setupData.js 제거)');
  console.log('  3. GitHub에 배포');
  console.log('='.repeat(50) + '\n');
}

// 콘솔에서 쉽게 실행하도록 전역 함수로 노출
window.setupAllData = setupAllData;

console.log('💡 setupData.js 로드됨');
console.log('📝 사용: await setupAllData() (콘솔에서 실행)');    });
    results.push({ name: 'MONTHLY_SCHEDULE', success });
  } else {
    console.warn('⚠️ MONTHLY_SCHEDULE 정의되지 않음');
  }

  // 3️⃣ SVG 저장
  console.log('\n3️⃣ SVG 라이브러리 업로드 중...');
  const svgElements = document.querySelectorAll('svg[id^="svg-"]');
  if (svgElements.length > 0) {
    const svgLibrary = [];
    svgElements.forEach((svg, index) => {
      const svgName = svg.id.replace('svg-', '') || `svg_${index + 1}`;
      const svgData = svg.outerHTML;
      svgLibrary.push({
        id: index + 1,
        svgName: svgName,
        svgData: svgData
      });
    });

    for (let i = 0; i < svgLibrary.length; i++) {
      const svg = svgLibrary[i];
      const success = await saveToGoogleSheets('svgLibrary', svg);
      if (i === 0) results.push({ name: `SVG (${svgLibrary.length}개)`, success });
    }
  } else {
    console.warn('⚠️ SVG 요소 없음');
  }

  // 4️⃣ Manifest 저장
  console.log('\n4️⃣ Manifest 업로드 중...');
  const manifestLink = document.querySelector('link[rel="manifest"]');
  if (manifestLink && manifestLink.href.includes('data:')) {
    const b64Data = manifestLink.href.split('base64,')[1];
    if (b64Data) {
      const manifestJSON = JSON.parse(atob(b64Data));
      const success = await saveToGoogleSheets('config', {
        id: 'manifest',
        configName: 'manifest',
        configData: JSON.stringify(manifestJSON)
      });
      results.push({ name: 'Manifest', success });
    }
  } else {
    console.warn('⚠️ Manifest 링크 없음');
  }

  // 5️⃣ Meta 태그 저장
  console.log('\n5️⃣ Meta 태그 업로드 중...');
  const metaTags = [];
  document.querySelectorAll('meta').forEach((meta, index) => {
    if (meta.name || meta.charset) {
      metaTags.push({
        name: meta.name || meta.charset,
        content: meta.content || ''
      });
    }
  });
  
  if (metaTags.length > 0) {
    const success = await saveToGoogleSheets('config', {
      id: 'metaTags',
      configName: 'metaTags',
      configData: JSON.stringify(metaTags)
    });
    results.push({ name: 'Meta 태그', success });
  }

  // ✅ 완료 요약
  console.log('\n' + '='.repeat(50));
  console.log('✅ 데이터 설정 완료!\n');
  console.log('📊 결과:');
  results.forEach(r => {
    const status = r.success ? '✅' : '❌';
    console.log(`  ${status} ${r.name}`);
  });
  console.log('\n💡 다음 단계:');
  console.log('  1. Google Sheets 확인: https://docs.google.com/spreadsheets/d/12cRWUcZah1z3DaZq5aJcojV8m3J5UU3m2F2ux6GwCec');
  console.log('  2. index.html 수정 (setupData.js 제거)');
  console.log('  3. GitHub에 배포');
  console.log('='.repeat(50) + '\n');
}

// 콘솔에서 쉽게 실행하도록 전역 함수로 노출
window.setupAllData = setupAllData;

console.log('💡 setupData.js 로드됨');
console.log('📝 사용: await setupAllData() (콘솔에서 실행)');
