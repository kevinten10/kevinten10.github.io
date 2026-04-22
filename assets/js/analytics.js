/**
 * Analytics Module - Lightweight page view tracking
 * Sends anonymized visit data to Cloudbase via trackView function
 * Respects doNotTrack, lazy-loaded, fails silently
 * @version 1.0.0
 */
(function() {
  'use strict';

  var CONFIG = {
    envId: 'ai-native-2gknzsob14f42138',
    functionName: 'trackView',
    sessionKey: 'kevinten-session',
    deferMs: 2000
  };

  function init() {
    if (navigator.doNotTrack === '1' || window.doNotTrack === '1') {
      return;
    }

    if (typeof cloudbase === 'undefined') {
      return;
    }

    try {
      cloudbase.init({ env: CONFIG.envId });
    } catch (e) {
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
      cloudbase.callFunction({
        name: CONFIG.functionName,
        data: data
      }).catch(function() {});
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
