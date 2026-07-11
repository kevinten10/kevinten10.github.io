/**
 * Comments Module - Cloudflare Worker backed comments.
 * Supports Auth0 users and anonymous nickname fallback.
 * @version 3.1.1
 */
(function() {
  'use strict';

  var maxCommentLength = 1000;
  var state = { comments: [], submitting: false };
  var pagePath = window.location.pathname || '/';

  function t(key, fallback) {
    if (typeof I18n !== 'undefined' && I18n.get) return I18n.get(key) || fallback;
    return fallback;
  }

  function api(path) {
    return (window.KevinAuth ? window.KevinAuth.apiBase() : '') + path;
  }

  function apiBase() {
    return window.KevinAuth ? window.KevinAuth.apiBase() : '';
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
  }

  function markdown(value) {
    return escapeHtml(value)
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br>');
  }

  function initials(value) {
    var clean = String(value || '').trim();
    if (!clean) return 'A';
    var parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length > 1) {
      return (Array.from(parts[0])[0] + Array.from(parts[parts.length - 1])[0]).toUpperCase();
    }
    return Array.from(clean).slice(0, 2).join('').toUpperCase();
  }

  function formatDate(value) {
    var date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString([], {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function profile() {
    var key = 'kevinten-comment-profile';
    var saved = {};
    try { saved = JSON.parse(localStorage.getItem(key) || '{}'); } catch (err) {}
    return {
      key: key,
      nickname: saved.nickname || '',
      website: saved.website || ''
    };
  }

  function saveProfile(data) {
    try {
      localStorage.setItem(data.key, JSON.stringify({
        nickname: data.nickname,
        website: data.website
      }));
    } catch (err) {}
  }

  function renderForm(container) {
    var saved = profile();
    var wrapper = document.createElement('div');
    wrapper.className = 'comments-form-wrapper';
    wrapper.innerHTML =
      '<div class="comments-form" data-auth-shell>' +
        '<div class="comments-form-head">' +
          '<span class="comments-eyebrow">' + escapeHtml(t('comments.composer.kicker', '留言通道')) + '</span>' +
          '<h3>' + escapeHtml(t('comments.composer.title', '写下具体想法')) + '</h3>' +
          '<p>' + escapeHtml(t('comments.composer.desc', '可以匿名，也可以登录后留下可识别身份。内容会经过审核后展示。')) + '</p>' +
        '</div>' +
        '<div class="comments-auth-card">' +
          '<span class="comments-auth-avatar" data-auth-initial aria-hidden="true">A</span>' +
          '<span class="comments-auth-copy">' +
            '<span class="comments-auth-label">' + escapeHtml(t('comments.auth.label', '当前身份')) + '</span>' +
            '<strong data-auth-name>Anonymous</strong>' +
            '<span class="comments-auth-status" data-auth-status>' + escapeHtml(t('auth.status.guest', '匿名浏览，可直接留言')) + '</span>' +
          '</span>' +
          '<span class="comments-auth-actions">' +
            '<button type="button" class="comment-auth-button" data-auth-login>' + escapeHtml(t('auth.login', '登录')) + '</button>' +
            '<button type="button" class="comment-auth-button" data-auth-logout hidden>' + escapeHtml(t('auth.logout', '退出')) + '</button>' +
          '</span>' +
        '</div>' +
        '<div class="comments-fields-grid">' +
          '<label class="comments-field">' +
            '<span>' + escapeHtml(t('comments.name.label', '昵称')) + '</span>' +
            '<input class="comments-name" maxlength="40" autocomplete="name" placeholder="' + escapeHtml(t('comments.name.placeholder', '你的名字或代号')) + '" value="' + escapeHtml(saved.nickname) + '">' +
          '</label>' +
          '<label class="comments-field">' +
            '<span>' + escapeHtml(t('comments.website.label', '链接')) + '</span>' +
            '<input class="comments-website" maxlength="200" inputmode="url" placeholder="' + escapeHtml(t('comments.website.placeholder', '网站或主页，可选')) + '" value="' + escapeHtml(saved.website) + '">' +
          '</label>' +
          '<label class="comments-field comments-field-wide">' +
            '<span>' + escapeHtml(t('comments.message.label', '内容')) + '</span>' +
            '<textarea class="comments-input" maxlength="' + maxCommentLength + '" placeholder="' + escapeHtml(t('comments.placeholder', '写下一个问题、反馈或补充信息...')) + '"></textarea>' +
          '</label>' +
        '</div>' +
        '<div class="comments-form-footer">' +
          '<span class="comments-meta">' +
            '<span class="comments-hint">' + escapeHtml(t('comments.hint.markdown', '支持 Markdown：**加粗** 与 `代码`')) + '</span>' +
            '<span class="comments-counter"><span data-comments-count>0</span>/' + maxCommentLength + '</span>' +
          '</span>' +
          '<button type="button" class="comments-submit btn btn-primary">' + escapeHtml(t('comments.submit', '提交留言')) + '</button>' +
        '</div>' +
        '<p class="comments-status" aria-live="polite"></p>' +
      '</div>';
    container.insertBefore(wrapper, container.firstChild);
    updateCounter(container);
  }

  function status(container, message, tone) {
    var node = container.querySelector('.comments-status');
    if (!node) return;
    node.textContent = message || '';
    node.classList.remove('is-error', 'is-success', 'is-info');
    if (tone) node.classList.add('is-' + tone);
  }

  function updateCounter(container) {
    var input = container.querySelector('.comments-input');
    var counter = container.querySelector('[data-comments-count]');
    if (input && counter) counter.textContent = String(input.value.length);
  }

  function setSubmitting(container, value) {
    state.submitting = value;
    var button = container.querySelector('.comments-submit');
    if (!button) return;
    button.disabled = value;
    button.textContent = value ? t('comments.submitting', '提交中...') : t('comments.submit', '提交留言');
  }

  function bind(container) {
    container.addEventListener('click', function(event) {
      var submitButton = event.target.closest('.comments-submit');
      if (submitButton) submit(container);
    });
    container.addEventListener('input', function(event) {
      if (event.target.classList.contains('comments-input')) updateCounter(container);
    });
  }

  function submit(container) {
    if (!apiBase()) return status(container, t('comments.disabled', '留言功能暂未启用'), 'error');
    if (state.submitting) return;
    var name = container.querySelector('.comments-name').value.trim();
    var website = container.querySelector('.comments-website').value.trim();
    var content = container.querySelector('.comments-input').value.trim();
    var visitor = window.KevinAuth ? window.KevinAuth.visitor() : { visitorId: '' };
    if (!name && !visitor.name) return status(container, t('comments.error.name', '请先填写昵称或登录'), 'error');
    if (!content) return status(container, t('comments.error.empty', '请先写点内容'), 'error');

    saveProfile({ key: 'kevinten-comment-profile', nickname: name, website: website });
    setSubmitting(container, true);
    status(container, t('comments.status.sending', '正在提交，稍等片刻'), 'info');
    fetch(api('/api/comments'), {
      method: 'POST',
      headers: window.KevinAuth ? window.KevinAuth.headers() : { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        pagePath: pagePath,
        visitorId: visitor.visitorId,
        nickname: name || visitor.name,
        website: website,
        content: content
      })
    }).then(function(res) {
      return res.json();
    }).then(function(result) {
      if (!result.success) throw new Error(result.error || 'failed');
      container.querySelector('.comments-input').value = '';
      updateCounter(container);
      status(
        container,
        result.data.status === 'approved' ? t('comments.status.approved', '已发布') : t('comments.status.pending', '已提交，待审核'),
        'success'
      );
      loadComments();
    }).catch(function() {
      status(container, t('comments.error.submit', '提交失败'), 'error');
    }).finally(function() {
      setSubmitting(container, false);
    });
  }

  function renderState(list, kind, title, detail) {
    var body = detail ? '<p>' + escapeHtml(detail) + '</p>' : '';
    var skeleton = kind === 'loading'
      ? '<span class="comments-skeleton"></span><span class="comments-skeleton short"></span>'
      : '';
    list.innerHTML =
      '<div class="comments-state comments-state-' + escapeHtml(kind) + '">' +
        '<span class="comments-state-mark" aria-hidden="true">' + (kind === 'error' ? '!' : '01') + '</span>' +
        '<strong>' + escapeHtml(title) + '</strong>' +
        body +
        skeleton +
      '</div>';
  }

  function loadComments() {
    var list = document.getElementById('comments-list');
    if (!list) return Promise.resolve();
    if (!apiBase()) {
      renderState(list, 'disabled', t('comments.disabled.title', '留言功能暂未启用'), t('comments.disabled', '留言功能暂未启用'));
      return Promise.resolve();
    }
    renderState(list, 'loading', t('comments.loading', '加载中...'), t('comments.loading.detail', '正在同步最近的公开留言'));
    return fetch(api('/api/comments?page=' + encodeURIComponent(pagePath)))
      .then(function(res) { return res.json(); })
      .then(function(result) {
        state.comments = result.data || [];
        renderComments(list);
      }).catch(function() {
        renderState(list, 'error', t('comments.error.load', '加载失败，请稍后重试'), t('comments.error.load.detail', '网络或接口暂时不可用。'));
      });
  }

  function renderComments(list) {
    if (!state.comments.length) {
      renderState(list, 'empty', t('comments.empty', '暂无留言，来写第一条吧'), t('comments.empty.detail', '第一条留言会显示在这里，适合提问、补充资料或留下合作线索。'));
      return;
    }
    list.innerHTML = state.comments.map(function(comment) {
      var author = comment.author_name || t('comments.guest', '访客');
      return '<article class="comment-item" id="comment-' + escapeHtml(comment.id) + '">' +
        '<span class="comment-avatar" aria-hidden="true">' + escapeHtml(initials(author)) + '</span>' +
        '<div class="comment-content">' +
          '<header class="comment-header">' +
            '<span class="comment-author">' + escapeHtml(author) + '</span>' +
            '<time class="comment-date" datetime="' + escapeHtml(comment.created_at || '') + '">' + escapeHtml(formatDate(comment.created_at)) + '</time>' +
          '</header>' +
          '<div class="comment-body">' + markdown(comment.content || '') + '</div>' +
        '</div>' +
      '</article>';
    }).join('');
  }

  function setupViewportClass(container) {
    var section = container.closest('section') || document.getElementById('comments');
    if (!section || !('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function(entries) {
      var visible = entries.some(function(entry) {
        return entry.isIntersecting;
      });
      document.body.classList.toggle('comments-in-view', visible);
    }, {
      rootMargin: '-72px 0px -80px 0px',
      threshold: 0
    });
    observer.observe(section);
  }

  function init() {
    var container = document.getElementById('comments-container');
    if (!container) return;
    renderForm(container);
    bind(container);
    setupViewportClass(container);
    loadComments();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.Comments = { init: init, loadComments: loadComments };
})();
