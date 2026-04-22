/**
 * Analytics Module - Lightweight page view tracking
 * Sends anonymized visit data to Cloudbase via trackView function
 * Respects doNotTrack, lazy-loaded, fails silently
 * @version 1.0.0
 */
(function() {
  'use strict';

  var CONFIG = {
    endpoint: 'https://kevinten.com/trackView',
    sessionKey: 'kevinten-session',
    deferMs: 2000
  };

  function init() {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
      return;
    }

    var sessionId = getSessionId();
    var data = {
      page: window.location.pathname || '/',
      referrer: document.referrer || '',
      userAgent: navigator.userAgent || '',
      screenSize: (window.screen ? window.screen.width + 'x' + window.screen.height : ''),
      sessionId: sessionId,
      uid: 'anonymous'
    };

    send(data);
  }

  function getSessionId() {
    var id = '';
    try {
      id = localStorage.getItem(CONFIG.sessionKey) || '';
      if (!id) {
        id = generateUUID();
        localStorage.setItem(CONFIG.sessionKey, id);
      }
    } catch (e) {
      id = generateUUID();
    }
    return id;
  }

  function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = Math.random() * 16 | 0;
      var v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  function send(data) {
    try {
      if (typeof fetch !== 'undefined') {
        fetch(CONFIG.endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true
        }).catch(function() {});
      } else {
        var xhr = new XMLHttpRequest();
        xhr.open('POST', CONFIG.endpoint, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.send(JSON.stringify(data));
      }
    } catch (e) {
      // Analytics must never break the site
    }
  }

  function schedule() {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', function() {
        setTimeout(init, CONFIG.deferMs);
      });
    } else {
      setTimeout(init, CONFIG.deferMs);
    }
  }

  schedule();
})();
