/**
 * Admin Module - Cloudflare preview moderation shell.
 * @version 1.0.0
 */
(function() {
  'use strict';

  function api(path) {
    return (window.KevinAuth ? window.KevinAuth.apiBase() : '') + path;
  }

  function headers() {
    return window.KevinAuth ? window.KevinAuth.headers() : { 'Content-Type': 'application/json' };
  }

  function content(html) {
    document.getElementById('admin-content').innerHTML = html;
  }

  function fetchJson(path, options) {
    return fetch(api(path), Object.assign({ headers: headers() }, options || {})).then(function(res) {
      return res.json();
    });
  }

  function loadSummary() {
    fetchJson('/api/admin/summary').then(function(result) {
      if (!result.success) throw new Error(result.error || 'failed');
      var data = result.data;
      content('<div class="admin-card"><strong>Pending comments</strong><p>' + data.pendingComments + '</p></div>' +
        '<div class="admin-card"><strong>Pending rewards</strong><p>' + data.pendingRewards + '</p></div>' +
        '<div class="admin-card"><strong>Approved comments</strong><p>' + data.approvedComments + '</p></div>' +
        '<div class="admin-card"><strong>Supporters</strong><p>' + data.supporters + '</p></div>');
    }).catch(function(err) {
      content('<div class="admin-card">' + err.message + '</div>');
    });
  }

  function loadList(type) {
    fetchJson('/api/admin/' + type).then(function(result) {
      var rows = result.data || [];
      content(rows.map(function(row) {
        return '<article class="admin-card"><strong>' + (row.author_name || row.display_name || row.id) + '</strong><p>' +
          (row.content || row.message || '') + '</p><button class="admin-action" data-approve="' + type + '" data-id="' + row.id + '">Approve</button></article>';
      }).join('') || '<div class="admin-card">No pending items.</div>');
    }).catch(function(err) {
      content('<div class="admin-card">' + err.message + '</div>');
    });
  }

  function bind() {
    document.querySelectorAll('[data-admin-tab]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('[data-admin-tab]').forEach(function(item) { item.classList.remove('active'); });
        btn.classList.add('active');
        if (btn.dataset.adminTab === 'summary') loadSummary();
        if (btn.dataset.adminTab === 'comments') loadList('comments');
        if (btn.dataset.adminTab === 'rewards') loadList('rewards');
      });
    });
    document.addEventListener('click', function(event) {
      var target = event.target;
      if (!target.matches('[data-approve]')) return;
      var type = target.getAttribute('data-approve');
      var status = type === 'rewards' ? 'approved' : 'approved';
      fetchJson('/api/admin/' + type + '/' + target.getAttribute('data-id'), {
        method: 'PATCH',
        body: JSON.stringify({ status: status })
      }).then(function() { loadList(type); });
    });
  }

  function init() {
    bind();
    setTimeout(loadSummary, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
