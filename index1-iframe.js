/* ═══════════════════════════════════════════════════════════════
   🔍 검색·방제 탭 → index3.html(병해충 진단·방제) iframe 임베드
   - 탭 클릭 시 아래 내용(재검색/QR/AI 버튼줄·검색창·목록)을 모두 숨기고
     index3.html을 iframe으로 전체 표시
   - iPhone 12 Pro(390×844) 등 iOS 대응:
     · visualViewport 기반 높이 자동 계산 (주소창/키보드 변동 반영)
     · 하단 네비 + safe-area 만큼 제외
     · 회전(orientationchange) 시 재계산
   - index3는 같은 폴더에 함께 배포되어야 합니다.
   ═══════════════════════════════════════════════════════════════ */
var SPRAY_EMBED_URL = 'index3.html';   // 다른 경로에 배포 시 전체 URL로 변경

/* 검색·방제 탭 진입/이탈 시 DB 패널 하위 UI 표시 토글 */
function _sprayEmbedUi(on){
  var row  = document.querySelector('#panel-db .db-action-row');
  var cnt  = document.getElementById('db-count');
  var srch = document.getElementById('db-search');
  if(row)  row.style.display = on ? 'none' : '';
  if(cnt)  cnt.style.display = on ? 'none' : '';
  if(on && srch) srch.style.display = 'none';   /* 해제는 setDbTab 기존 로직이 처리 */
}

/* iPhone 대응: iframe 높이를 화면에 맞게 동적 계산 */
function _sprayFrameResize(){
  var wrap = document.getElementById('spray-embed-wrap');
  if(!wrap) return;
  var vh   = (window.visualViewport && window.visualViewport.height) || window.innerHeight;
  var top  = wrap.getBoundingClientRect().top;
  var nav  = document.getElementById('main-bottomnav');
  var navH = nav ? nav.getBoundingClientRect().height : 60;
  var h = Math.floor(vh - top - navH - 6);
  if(h < 420) h = 420;               /* 최소 높이 보장 */
  wrap.style.height = h + 'px';
}

/* 새 검색·방제 패널: index3.html 임베드 */
function renderSpraySchedulerPanel(){
  var container = document.getElementById('db-list');
  if(!container) return;
  _sprayEmbedUi(true);

  container.innerHTML =
      '<div id="spray-embed-wrap" style="height:65vh;overflow:hidden;border-radius:12px;'
    +   'border:1px solid var(--gray-200);background:#F4F7F1;box-shadow:0 1px 4px rgba(0,0,0,.06);'
    +   '-webkit-overflow-scrolling:touch;">'
    +   '<iframe id="spray-embed-frame" src="' + SPRAY_EMBED_URL + '" title="병해충 진단 · 방제"'
    +     ' style="display:block;width:100%;height:100%;border:0;"'
    +     ' allow="camera; clipboard-write" loading="eager"></iframe>'
    + '</div>';

  /* 같은 도메인 배포 시: iframe 내부의 자체 헤더/푸터를 숨겨 iPhone 세로 공간 확보
     (← 관리앱 링크가 iframe 안에서 앱을 중첩 로드하는 문제도 함께 차단) */
  var frame = document.getElementById('spray-embed-frame');
  frame.addEventListener('load', function(){
    try{
      var doc = frame.contentDocument;
      if(doc){
        var st = doc.createElement('style');
        st.textContent = '.hdr,.foot{display:none!important}.wrap{padding-top:10px;padding-bottom:24px}';
        doc.head.appendChild(st);
      }
    }catch(e){ /* 교차 출처 배포 시 접근 불가 — 무시 */ }
    _sprayFrameResize();
  });

  _sprayFrameResize();
  if(!window.__sprayResizeBound){
    window.__sprayResizeBound = true;
    window.addEventListener('resize', _sprayFrameResize);
    window.addEventListener('orientationchange', function(){ setTimeout(_sprayFrameResize, 300); });
    if(window.visualViewport){
      window.visualViewport.addEventListener('resize', _sprayFrameResize);
    }
  }
}

/* 다른 탭 렌더러 진입 시 숨겼던 UI 복원 */
(function(){
  ['renderDb','renderFertPanel','renderMicroPanel','renderMyPestPanel','renderHarvestPanel']
  .forEach(function(fn){
    var orig = window[fn];
    if(typeof orig === 'function'){
      window[fn] = function(){ _sprayEmbedUi(false); return orig.apply(this, arguments); };
    }
  });
})();

/* index3 → 관리앱 postMessage 수신:
   iframe 안에서 작물 추가/수정/상태 변경 시 관리앱 데이터 재동기화 */
(function(){
  var _syncTimer = null;
  window.addEventListener('message', function(ev){
    var m = ev.data || {};
    if(m.type === 'orchard:addCrop' || m.type === 'orchard:updateCropInfo' || m.type === 'orchard:updateCropStatus'){
      clearTimeout(_syncTimer);
      _syncTimer = setTimeout(function(){
        try{ syncNow(); }catch(e){ console.warn('spray embed sync 오류:', e.message); }
      }, 800);
    }
    /* 진단앱에서 방제 계획 저장/체크 → 오늘 할일 즉시 갱신 */
    if(m.type === 'orchard:planSaved'){
      _loadFbTasks().then(function(){ try{ renderToday(); }catch(e){} });
    }
  });
})();

/* ═══════════════════════════════════════════════════════════════
   🧪 진단앱(index3) 방제 스케줄 ↔ 오늘 할일 연동
   - 진단앱 Plan.save()가 'tasks' 컬렉션에 회차별로 저장한 방제 할일을
     오늘 할일 화면에 표시 (오늘 + 기한 지난 항목)
   - '이번 주 예정'에는 7일 이내 예정 방제 표시
   - 완료 체크 시 tasks 문서 + 원본 sprayPlan.entries[n].done 동시 갱신
   ═══════════════════════════════════════════════════════════════ */
// 1. APP 객체가 아직 없다면 빈 객체로 초기화해 줍니다. 
// (window 객체에 붙여 전역으로 관리하면 여러 파일에서 접근하기 안전합니다.)
window.APP = window.APP || {}; 

// 2. 이제 APP 객체가 존재하므로 에러 없이 fbTasks를 배열로 초기화할 수 있습니다.
APP.fbTasks = APP.fbTasks || [];

async function _loadFbTasks(){
  if(!db){ return; }
  try{
    var snap = await db.collection('tasks').limit(300).get();
    APP.fbTasks = snap.docs.map(function(d){ return Object.assign({id:d.id}, d.data()); });
  }catch(e){ console.warn('tasks 컬렉션 로드 실패:', e.message); }
}

function _fbTaskCardHTML(t){
  var overdue = !t.done && t.date < TODAY_STR;
  var cardCls = 'task-card'+(t.done?' done':'')+(overdue?' urgent':'');
  return '<div class="'+cardCls+'">'
    +'<div class="task-top">'
    +'<div style="flex:1;">'
    +'<div class="task-plant"><span class="emoji">🧪</span>'+esc(t.cropName||'')
    +' <span class="badge badge-ins">🧪 방제계획</span>'
    +(overdue?'<span class="badge badge-today">기한 지남</span>':'')
    +(t.done?'<span class="badge badge-done">완료</span>':'')
    +'</div>'
    +'<div class="task-action">'+esc(t.title||'')+'</div>'
    +'<div class="task-meta"><span>📅 '+esc(t.date||'')+'</span>'
    +(t.brandName?'<span>💊 '+esc(t.brandName)+'</span>':'')
    +'<span style="color:var(--gray-400);">진단앱 연동</span></div>'
    +'</div>'
    +'<button class="check-btn'+(t.done?' checked':'')+'" onclick="_toggleFbTask(\''+esc(t.id)+'\')">'
    +(t.done?'✓':'')+'</button>'
    +'</div></div>';
}

function _appendFbTasksToToday(){
  var el = document.getElementById('today-list');
  if(!el || !APP.fbTasks || !APP.fbTasks.length) return _appendFbTasksToWeek();

  /* 필터 존중: 시비/작업 필터에서는 숨김, 방제는 spray 취급 */
  if(APP.filter==='fert' || APP.filter==='task') return _appendFbTasksToWeek();

  var items = APP.fbTasks.filter(function(t){
    if(!t.date) return false;
    if(APP.filter==='pending' && t.done) return false;
    /* 오늘 항목(완료 포함) + 기한 지난 미완료 항목 */
    return (t.date === TODAY_STR) || (!t.done && t.date < TODAY_STR);
  }).sort(function(a,b){ return (a.date||'').localeCompare(b.date||''); });

  if(items.length){
    /* '할 일 없음' 빈 화면이면 제거 */
    var emptyEl = el.querySelector('.empty-state');
    if(emptyEl) el.innerHTML = '';

    el.insertAdjacentHTML('beforeend',
      '<div style="font-size:12px;font-weight:700;color:var(--green-dark);margin:12px 0 6px;">'
      + '🧪 방제 계획 (진단앱 연동) · '+items.length+'건</div>'
      + items.map(_fbTaskCardHTML).join(''));

    /* 상단 카운트/미완료 뱃지에 합산 반영 */
    var fbPending = items.filter(function(t){ return !t.done; }).length;
    try{
      var base = calcTodayTasks();
      var basePending = base.filter(function(t){ return !t.done; }).length;
      var countEl = document.getElementById('today-count');
      if(countEl) countEl.textContent = '총 '+(base.length+items.length)+'건 (미완료 '+(basePending+fbPending)+'건)';
      var badge = document.getElementById('today-pending-count');
      if(badge){
        var tot = basePending + fbPending;
        badge.textContent = tot; badge.style.display = tot>0 ? '' : 'none';
      }
    }catch(e){}
  }
  _appendFbTasksToWeek();
}

function _appendFbTasksToWeek(){
  var wel = document.getElementById('week-list');
  if(!wel || !APP.fbTasks || !APP.fbTasks.length) return;
  var limit = fmt(addDays(TODAY,7));
  var upcoming = APP.fbTasks.filter(function(t){
    return t.date && !t.done && t.date > TODAY_STR && t.date <= limit;
  }).sort(function(a,b){ return (a.date||'').localeCompare(b.date||''); });
  if(!upcoming.length) return;

  var emptyEl = wel.querySelector('.empty-state');
  if(emptyEl) wel.innerHTML = '';
  wel.insertAdjacentHTML('beforeend', upcoming.map(function(t){
    return '<div class="task-card" style="border-left-color:var(--amber);opacity:.85;">'
      +'<div class="task-top"><div>'
      +'<div class="task-plant"><span class="emoji">🧪</span>'+esc(t.cropName||'')+'</div>'
      +'<div class="task-action">'+esc(t.title||'')+'</div>'
      +'<div class="task-meta"><span>📅 '+esc(t.date)+'</span><span style="color:var(--gray-400);">진단앱 연동</span></div>'
      +'</div><span class="badge badge-soon">예정</span></div></div>';
  }).join(''));
}

/* 완료 체크: tasks 문서 + 원본 sprayPlan.entries 동시 갱신 (양방향) */
async function _toggleFbTask(taskId){
  var t = (APP.fbTasks||[]).find(function(x){ return x.id===taskId; });
  if(!t || !db) return;
  var newDone = !t.done;
  try{
    await db.collection('tasks').doc(taskId).update({ done:newDone, doneAt: newDone?Date.now():null });
    t.done = newDone;

    if(t.linkedPlanId){
      var ref = db.collection('sprayPlan').doc(t.linkedPlanId);
      var doc = await ref.get();
      if(doc.exists){
        var entries = doc.data().entries || [];
        var idx = (typeof t.entryIndex==='number') ? t.entryIndex
                : entries.findIndex(function(e){ return e.date===t.date; });
        if(idx>=0 && entries[idx]){
          entries[idx].done = newDone;
          await ref.update({ entries:entries });
        }
      }
    }
    showToast(newDone ? '✅ 방제 완료 (원본 계획에도 반영)' : '완료 취소됨');
  }catch(e){ showToast('⚠️ 처리 실패: '+e.message); }
  renderToday();
}

/* renderToday 후 방제 할일 섹션 자동 부착 */
(function(){
  var _origRenderToday = window.renderToday;
  if(typeof _origRenderToday === 'function'){
    window.renderToday = function(){
      _origRenderToday.apply(this, arguments);
      try{ _appendFbTasksToToday(); }catch(e){ console.warn('방제 할일 렌더 오류:', e.message); }
    };
  }
})();

/* syncNow 후 tasks도 함께 갱신 */
(function(){
  var _origSyncNow = window.syncNow;
  if(typeof _origSyncNow === 'function'){
    window.syncNow = async function(){
      var r = await _origSyncNow.apply(this, arguments);
      try{ await _loadFbTasks(); renderToday(); }catch(e){}
      return r;
    };
  }
})();

/* 최초 로드 */
_loadFbTasks().then(function(){ try{ renderToday(); }catch(e){} });
