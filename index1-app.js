// ============================================
// index1-app.js에 교체할 loadPreparation 함수
// ============================================

/**
 * 준비사항 데이터 로드 
 * - 현재 월/주를 자동 계산
 * - 데이터가 없으면 기본값 설정
 */
async function loadPreparation() {
  try {
    const now = new Date();
    const month = now.getMonth() + 1;  // 1~12
    const week = Math.ceil(now.getDate() / 7);  // 1~4
    
    console.log('[loadPreparation] 로드 시작: ' + month + '월 ' + week + '주');
    
    // 📌 GAS에서 데이터 로드
    const response = await _gasGet('getPreparation', { 
      month: month.toString(), 
      week: week.toString() 
    });
    
    if (response && response.prep !== undefined) {
      APP_PREPARATION = response;
      console.log('[loadPreparation] 로드 완료: 준비사항 ' + response.prep.length + '개, 팁 ' + response.tips.length + '개');
      renderPreparation();
      return true;
    } else {
      // 🔄 데이터가 없으면 기본값 설정
      console.warn('[loadPreparation] 데이터 없음 → 기본값 사용');
      APP_PREPARATION = { 
        prep: [], 
        tips: [] 
      };
      renderPreparation();
      return false;
    }
  } catch(e) {
    console.error('[loadPreparation] 오류:', e.message);
    APP_PREPARATION = { prep: [], tips: [] };
    renderPreparation();
    return false;
  }
}

/**
 * 준비사항 + 팁 렌더링
 */
function renderPreparation() {
  try {
    // 📌 준비사항 렌더링
    const prepHtml = renderPrepHtml();
    const prepEl = document.getElementById('weekly-prep');
    if (prepEl) prepEl.innerHTML = prepHtml;
    
    // 💡 팁 렌더링
    const tipsHtml = renderTipsHtml();
    const tipsEl = document.getElementById('monthly-tips');
    if (tipsEl) tipsEl.innerHTML = tipsHtml;
    
    console.log('[renderPreparation] 렌더링 완료');
  } catch(e) {
    console.error('[renderPreparation] 오류:', e.message);
  }
}

/**
 * 준비사항 HTML 생성
 */
function renderPrepHtml() {
  if (!APP_PREPARATION.prep || APP_PREPARATION.prep.length === 0) {
    return '<div style="color:#999;font-size:12px;text-align:center;">이번 주 준비사항이 없습니다.</div>';
  }
  
  let html = '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;">';
  
  APP_PREPARATION.prep.forEach(function(item, idx) {
    const isFullWidth = idx === APP_PREPARATION.prep.length - 1 && APP_PREPARATION.prep.length % 2 === 1;
    const gridColSpan = isFullWidth ? 'grid-column:1 / -1;' : '';
    
    html += '<div style="background:white;border-radius:8px;padding:10px;border-left:4px solid #4CAF50;' + gridColSpan + '">';
    html += '<div style="font-weight:700;color:#1B5E20;font-size:13px;margin-bottom:4px;">' + (item.emoji || '') + ' ' + (item.title || '') + '</div>';
    
    if (item.contentLines && item.contentLines.length > 0) {
      html += '<div style="font-size:11px;color:#558B2F;line-height:1.6;">';
      item.contentLines.forEach(function(line) {
        html += (line || '') + '<br>';
      });
      html = html.slice(0, -4); // 마지막 <br> 제거
      html += '</div>';
    }
    
    html += '</div>';
  });
  
  html += '</div>';
  return html;
}

/**
 * 팁 HTML 생성
 */
function renderTipsHtml() {
  if (!APP_PREPARATION.tips || APP_PREPARATION.tips.length === 0) {
    return '<div style="color:#999;font-size:12px;text-align:center;">이달의 팁이 없습니다.</div>';
  }
  
  let html = '<div style="display:grid;grid-template-columns:1fr;gap:8px;">';
  
  APP_PREPARATION.tips.forEach(function(item) {
    html += '<div style="background:white;border-radius:8px;padding:10px;border-left:4px solid #FF9800;">';
    html += '<div style="font-weight:700;color:#E65100;font-size:13px;margin-bottom:4px;">' + (item.emoji || '') + ' ' + (item.title || '') + '</div>';
    
    if (item.contentLines && item.contentLines.length > 0) {
      html += '<div style="font-size:11px;color:#E0A575;line-height:1.6;">';
      item.contentLines.forEach(function(line) {
        html += (line || '') + '<br>';
      });
      html = html.slice(0, -4); // 마지막 <br> 제거
      html += '</div>';
    }
    
    html += '</div>';
  });
  
  html += '</div>';
  return html;
}

