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
           + '<td style="padding:4px 6px;text-align:center;font-weight:700;color:var(--blue-dark);">' + esc(entry.amount || '') + '</td>'
           + '<td style="padding:4px 6px;text-align:center;font-weight:700;color:#F57F17;">' + esc(entry.safety || '') + '</td>'
           + '<td style="padding:4px 6px;text-align:center;">' + esc(entry.times || '') + '</td>'
           + '</tr>';
        ri++;
      });
    });
    
    h += '</tbody></table></div>';
  }

  // 액션 버튼 영역 (저장 등)
  h += '<div style="margin-top:12px;">'
     + '<button id="btn-save-qr-pesticide" style="width:100%;padding:12px;background:var(--blue-dark);color:#fff;border-radius:8px;border:none;font-size:14px;font-weight:700;cursor:pointer;">💾 내 농약 목록에 저장</button>'
     + '</div>';

  h += '</div>'; // 제일 바깥 div 닫기

  return h;
}

// 예외 시 수동 입력 UI 생성 함수
function _buildManualInputUI(input, urlInfo) {
  var h = '<div style="background:#FFF3E0;border:1.5px solid #FFB74D;border-radius:12px;padding:14px;text-align:center;">'
        + '<div style="font-size:24px;margin-bottom:8px;">⚠️</div>'
        + '<div style="font-size:14px;font-weight:700;color:#E65100;margin-bottom:4px;">정확한 정보를 찾을 수 없습니다</div>'
        + '<div style="font-size:11px;color:#F57F17;margin-bottom:12px;">바코드나 QR코드의 정보가 부족하거나 DB에 없는 농약입니다.</div>';
        
  if (input) {
    h += '<div style="font-size:10px;color:var(--gray-500);word-break:break-all;background:#fff;padding:6px;border-radius:6px;margin-bottom:12px;text-align:left;">'
       + '인식된 값: ' + esc(input) + '</div>';
  }
  
  h += '<button id="btn-manual-entry" style="width:100%;padding:12px;background:#FB8C00;color:#fff;border-radius:8px;border:none;font-size:14px;font-weight:700;cursor:pointer;">✏️ 직접 입력하기</button>'
     + '</div>';
     
  return h;
}

// 문자열 이스케이프 헬퍼 함수 (XSS 방지 및 안전한 HTML 출력을 위함)
function esc(str) {
  if (typeof str !== 'string') return str || '';
  return str.replace(/[&<>'"]/g, function(tag) {
    var charsToReplace = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      "'": '&#39;',
      '"': '&quot;'
    };
    return charsToReplace[tag] || tag;
  });
}