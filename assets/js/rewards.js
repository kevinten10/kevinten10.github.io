/**
 * Rewards Module - Cloudflare Worker backed thanks wall.
 * @version 1.0.0
 */
(function() {
  'use strict';

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
  }

  function api(path) {
    return (window.KevinAuth ? window.KevinAuth.apiBase() : '') + path;
  }

  function init() {
    var section = document.getElementById('rewards');
    if (!section) return;
    bind(section);
    load(section);
  }

  function bind(section) {
    var button = section.querySelector('.rewards-submit');
    if (!button) return;
    button.addEventListener('click', function() {
      var visitor = window.KevinAuth ? window.KevinAuth.visitor() : { visitorId: '' };
      var payload = {
        visitorId: visitor.visitorId,
        displayName: section.querySelector('.rewards-name').value || visitor.name || 'Supporter',
        amount: section.querySelector('.rewards-amount').value,
        currency: section.querySelector('.rewards-currency').value,
        message: section.querySelector('.rewards-message').value
      };
      submit(section, payload);
    });
  }

  function status(section, message) {
    var node = section.querySelector('.rewards-status');
    if (node) node.textContent = message || '';
  }

  function submit(section, payload) {
    fetch(api('/api/rewards'), {
      method: 'POST',
      headers: window.KevinAuth ? window.KevinAuth.headers() : { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res) {
      return res.json();
    }).then(function(result) {
      if (!result.success) throw new Error(result.error || 'failed');
      section.querySelector('.rewards-message').value = '';
      status(section, '已提交，审核后会出现在鸣谢墙');
      load(section);
    }).catch(function() {
      status(section, '提交失败，请稍后再试');
    });
  }

  function load(section) {
    var list = section.querySelector('.rewards-list');
    if (!list) return;
    fetch(api('/api/rewards')).then(function(res) {
      return res.json();
    }).then(function(result) {
      var rewards = result.data || [];
      if (!rewards.length) {
        list.innerHTML = '<p class="rewards-empty">还没有公开鸣谢。</p>';
        return;
      }
      list.innerHTML = rewards.map(function(item) {
        return '<article class="reward-item">' +
          '<div class="reward-meta"><strong>' + escapeHtml(item.display_name) + '</strong><span>' + escapeHtml(new Date(item.created_at).toLocaleDateString()) + '</span></div>' +
          (item.message ? '<p>' + escapeHtml(item.message) + '</p>' : '') +
          (item.status === 'verified' ? '<span class="reward-verified">Verified</span>' : '') +
          '</article>';
      }).join('');
    }).catch(function() {
      list.innerHTML = '<p class="rewards-empty">鸣谢墙暂时不可用。</p>';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
