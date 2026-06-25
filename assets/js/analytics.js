/**
 * Analytics Module - Cloudflare Worker backed public stats.
 * @version 3.0.0
 */
(function() {
  'use strict';

  var SESSION_KEY = 'kevinten-session';

  function api(path) {
    return (window.KevinAuth ? window.KevinAuth.apiBase() : '') + path;
  }

  function sessionId() {
    try {
      var current = localStorage.getItem(SESSION_KEY);
      if (current) return current;
      current = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(36).slice(2);
      localStorage.setItem(SESSION_KEY, current);
      return current;
    } catch (err) {
      return String(Date.now()) + Math.random().toString(36).slice(2);
    }
  }

  function track() {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') return;
    var visitor = window.KevinAuth ? window.KevinAuth.visitor() : {};
    fetch(api('/api/stats/view'), {
      method: 'POST',
      headers: window.KevinAuth ? window.KevinAuth.headers() : { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePath: window.location.pathname || '/',
        sessionId: sessionId(),
        visitorId: visitor.visitorId || '',
        referrer: document.referrer || '',
        userAgent: navigator.userAgent || ''
      })
    }).catch(function() {});
  }

  function stats() {
    var nodes = document.querySelectorAll('[data-public-stat]');
    if (!nodes.length) return;
    fetch(api('/api/stats/public?page=' + encodeURIComponent(window.location.pathname || '/')))
      .then(function(res) { return res.json(); })
      .then(function(result) {
        if (!result.success) return;
        nodes.forEach(function(node) {
          var key = node.getAttribute('data-public-stat');
          if (key === 'pageViews') node.textContent = result.data.page.pv || 0;
          if (key === 'comments') node.textContent = result.data.totalComments || 0;
          if (key === 'supporters') node.textContent = result.data.supporterCount || 0;
        });
      }).catch(function() {});
  }

  function init() {
    setTimeout(track, 1500);
    setTimeout(stats, 500);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
