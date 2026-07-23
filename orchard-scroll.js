(function(){
  var topBtn = document.getElementById('scrollTopBtn');
  var botBtn = document.getElementById('scrollBottomBtn');
  if (!topBtn || !botBtn) return;

  function show(btn) {
    btn.style.opacity = '1';
    btn.style.visibility = 'visible';
    btn.style.transform = 'translateY(0)';
  }
  function hide(btn) {
    btn.style.opacity = '0';
    btn.style.transform = 'translateY(10px)';
    setTimeout(function(){ if (btn.style.opacity === '0') btn.style.visibility = 'hidden'; }, 250);
  }

  function onScroll() {
    var y = window.pageYOffset || document.documentElement.scrollTop || 0;
    var docH = document.documentElement.scrollHeight;
    var winH = window.innerHeight;
    var maxScroll = docH - winH;

    // 위로 버튼: 조금이라도 내려오면 표시
    if (y > 320) show(topBtn); else hide(topBtn);

    // 아래로 버튼: 스크롤 여지가 충분하고, 바닥 근처가 아닐 때 표시
    if (maxScroll > 400 && (maxScroll - y) > 320) show(botBtn); else hide(botBtn);
  }

  topBtn.addEventListener('click', function(){
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
  botBtn.addEventListener('click', function(){
    window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'smooth' });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll, { passive: true });
  // 탭 전환 직후에도 상태 갱신
  document.addEventListener('click', function(e){
    if (e.target && e.target.closest && e.target.closest('.nav-item')) {
      setTimeout(onScroll, 80);
    }
  }, true);
  onScroll();
})();