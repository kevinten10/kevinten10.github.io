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

  var commentActions = [
    { status: 'approved', label: 'Approve' },
    { status: 'hidden', label: 'Hide' },
    { status: 'spam', label: 'Spam' }
  ];

  var rewardActions = [
    { status: 'approved', label: 'Approve' },
    { status: 'verified', label: 'Verify' },
    { status: 'hidden', label: 'Hide' }
  ];

  var providerLabels = {
    wechat_qr: 'WeChat QR',
    alipay_qr: 'Alipay QR',
    manual_qr: 'Manual QR',
    stripe: 'Stripe Sandbox',
    stripe_sandbox: 'Stripe Sandbox'
  };

  function clearContent() {
    var root = document.getElementById('admin-content');
    root.replaceChildren();
    return root;
  }

  function card(title, bodyText) {
    var node = document.createElement('div');
    node.className = 'admin-card';
    if (title) {
      var strong = document.createElement('strong');
      strong.textContent = title;
      node.appendChild(strong);
    }
    var body = document.createElement('p');
    body.textContent = bodyText || '';
    node.appendChild(body);
    return node;
  }

  function showMessage(message) {
    clearContent().appendChild(card('', message));
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
      var root = clearContent();
      root.appendChild(card('Pending comments', String(data.pendingComments || 0)));
      root.appendChild(card('Pending rewards', String(data.pendingRewards || 0)));
      root.appendChild(card('Approved comments', String(data.approvedComments || 0)));
      root.appendChild(card('Supporters', String(data.supporters || 0)));
    }).catch(function(err) {
      showMessage(err.message);
    });
  }

  function loadList(type) {
    fetchJson('/api/admin/' + type).then(function(result) {
      var rows = result.data || [];
      var root = clearContent();
      if (!rows.length) {
        root.appendChild(card('', 'No pending items.'));
        return;
      }
      rows.forEach(function(row) {
        var article = document.createElement('article');
        article.className = 'admin-card';
        var title = document.createElement('strong');
        title.textContent = row.author_name || row.display_name || row.id;
        var meta = document.createElement('div');
        meta.className = 'admin-row-meta';
        if (type === 'rewards') {
          var amount = row.amount === null || row.amount === undefined ? 'amount not provided' : String(row.amount) + ' ' + (row.currency || '');
          meta.textContent = [
            providerLabels[row.provider] || row.provider || 'unknown provider',
            amount,
            row.status || 'pending',
            row.id
          ].join(' · ');
        } else {
          meta.textContent = [row.status || 'pending', row.id].join(' · ');
        }
        var body = document.createElement('p');
        body.textContent = row.content || row.message || '';
        var actions = document.createElement('div');
        actions.className = 'admin-actions';
        (type === 'rewards' ? rewardActions : commentActions).forEach(function(action) {
          var button = document.createElement('button');
          button.className = 'admin-action';
          button.type = 'button';
          button.setAttribute('data-approve', type);
          button.setAttribute('data-id', row.id);
          button.setAttribute('data-status', action.status);
          button.textContent = action.label;
          actions.appendChild(button);
        });
        article.appendChild(title);
        article.appendChild(meta);
        article.appendChild(body);
        article.appendChild(actions);
        root.appendChild(article);
      });
    }).catch(function(err) {
      showMessage(err.message);
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
      var status = target.getAttribute('data-status') || 'approved';
      target.disabled = true;
      fetchJson('/api/admin/' + type + '/' + target.getAttribute('data-id'), {
        method: 'PATCH',
        body: JSON.stringify({ status: status })
      }).then(function(result) {
        if (!result.success) throw new Error(result.error || 'failed');
        loadList(type);
      }).catch(function(err) {
        showMessage(err.message);
      });
    });
  }

  function init() {
    bind();
    setTimeout(loadSummary, 800);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
