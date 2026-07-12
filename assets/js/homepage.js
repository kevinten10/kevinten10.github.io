(function() {
  'use strict';

  function initLanguageToggle() {
    var toggle = document.querySelector('.lang-toggle-btn');
    if (!toggle) return;
    toggle.addEventListener('click', function() {
      if (window.I18n && window.I18n.toggle) window.I18n.toggle();
    });
  }

  function initVideoModal() {
    var modal = document.getElementById('video-modal');
    var video = document.getElementById('promo-video');
    if (!modal || !video) return;

    var triggers = document.querySelectorAll('#video-play-btn, [data-video-trigger]');
    var close = modal.querySelector('.video-modal-close');
    var backdrop = modal.querySelector('.video-modal-backdrop');

    function open() {
      modal.classList.add('active');
      var playback = video.play();
      if (playback && playback.catch) playback.catch(function() {});
      document.body.style.overflow = 'hidden';
    }

    function shut() {
      modal.classList.remove('active');
      video.pause();
      document.body.style.overflow = '';
    }

    triggers.forEach(function(trigger) { trigger.addEventListener('click', open); });
    if (close) close.addEventListener('click', shut);
    if (backdrop) backdrop.addEventListener('click', shut);
    document.addEventListener('keydown', function(event) {
      if (event.key === 'Escape' && modal.classList.contains('active')) shut();
    });
  }

  function initEcosystemLauncher() {
    var trigger = document.querySelector('[data-open-eco-projects]');
    if (!trigger) return;

    trigger.addEventListener('click', function() {
      var items = document.querySelectorAll('.eco-item[href]');
      var links = Array.from(items).map(function(item) {
        return {
          href: item.href,
          name: (item.querySelector('.eco-name') || {}).textContent || '',
          desc: (item.querySelector('.eco-desc') || {}).textContent || ''
        };
      });
      var html = '<!DOCTYPE html><html><head><meta charset="utf-8"><title>AI Ecosystem - All Projects</title><style>'
        + 'body{background:#0a0a0f;color:#e2e8f0;font-family:system-ui,-apple-system,sans-serif;margin:0;padding:40px 20px}'
        + 'h1{text-align:center;font-size:28px;margin-bottom:8px}'
        + 'p.sub{text-align:center;color:#94a3b8;margin-bottom:32px;font-size:15px}'
        + '.g{display:grid;grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:14px;max-width:1100px;margin:0 auto}'
        + 'a{display:block;padding:18px 20px;background:#16162a;border:1px solid #ffffff10;border-radius:12px;text-decoration:none;color:#e2e8f0;transition:all .2s}'
        + 'a:hover{transform:translateY(-2px);background:#1e1e3a;border-color:#ffffff20}'
        + '.n{font-weight:600;font-size:16px;margin-bottom:4px}'
        + '.d{font-size:13px;color:#94a3b8}'
        + '</style></head><body>'
        + '<h1>\uD83D\uDC19 AI Agent Ecosystem</h1>'
        + '<p class="sub">' + links.length + ' Projects \u00b7 Click any card to open</p>'
        + '<div class="g">'
        + links.map(function(link) {
          return '<a href="' + link.href + '" target="_blank" rel="noopener"><div class="n">'
            + link.name + '</div><div class="d">' + link.desc + '</div></a>';
        }).join('')
        + '</div></body></html>';
      var blob = new Blob([html], { type: 'text/html' });
      window.open(URL.createObjectURL(blob), '_blank');
    });
  }

  function init() {
    initLanguageToggle();
    initVideoModal();
    initEcosystemLauncher();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
