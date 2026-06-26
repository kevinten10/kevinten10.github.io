/**
 * Comments Module - Cloudflare Worker backed comments.
 * Supports Auth0 users and anonymous nickname fallback.
 * @version 2.0.0
 */
(function() {
  'use strict';

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
      '<div class="comments-form">' +
        '<div class="comments-auth-row">' +
          '<span>' + escapeHtml(t('comments.auth.label', '身份')) + ': <strong data-auth-name>Anonymous</strong></span>' +
          '<button type="button" class="comment-auth-button" data-auth-login>' + escapeHtml(t('auth.login', '登录')) + '</button>' +
          '<button type="button" class="comment-auth-button" data-auth-logout hidden>' + escapeHtml(t('auth.logout', '退出')) + '</button>' +
        '</div>' +
        '<div class="comments-identity-row">' +
          '<input class="comments-name" maxlength="40" placeholder="' + escapeHtml(t('comments.name.placeholder', '昵称')) + '" value="' + escapeHtml(saved.nickname) + '">' +
          '<input class="comments-website" maxlength="200" placeholder="' + escapeHtml(t('comments.website.placeholder', '网站（可选）')) + '" value="' + escapeHtml(saved.website) + '">' +
        '</div>' +
        '<textarea class="comments-input" maxlength="1000" placeholder="' + escapeHtml(t('comments.placeholder', '写下你的留言...')) + '"></textarea>' +
        '<div class="comments-form-footer">' +
          '<span class="comments-hint">' + escapeHtml(t('comments.hint.markdown', '支持 Markdown 语法')) + '</span>' +
          '<button class="comments-submit btn btn-primary">' + escapeHtml(t('comments.submit', '提交留言')) + '</button>' +
        '</div>' +
        '<p class="comments-status" aria-live="polite"></p>' +
      '</div>';
    container.insertBefore(wrapper, container.firstChild);
  }

  function status(container, message) {
    var node = container.querySelector('.comments-status');
    if (node) node.textContent = message || '';
  }

  function bind(container) {
    container.addEventListener('click', function(event) {
      if (event.target.classList.contains('comments-submit')) submit(container);
    });
  }

  function submit(container) {
    if (!apiBase()) return status(container, t('comments.disabled', '留言功能暂未启用'));
    if (state.submitting) return;
    var name = container.querySelector('.comments-name').value.trim();
    var website = container.querySelector('.comments-website').value.trim();
    var content = container.querySelector('.comments-input').value.trim();
    var visitor = window.KevinAuth ? window.KevinAuth.visitor() : { visitorId: '' };
    if (!name && !visitor.name) return status(container, t('comments.error.name', '请先填写昵称或登录'));
    if (!content) return status(container, t('comments.error.empty', '请先写点内容'));

    saveProfile({ key: 'kevinten-comment-profile', nickname: name, website: website });
    state.submitting = true;
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
      status(container, result.data.status === 'approved' ? t('comments.status.approved', '已发布') : t('comments.status.pending', '已提交，待审核'));
      loadComments();
    }).catch(function() {
      status(container, t('comments.error.submit', '提交失败'));
    }).finally(function() {
      state.submitting = false;
    });
  }

  function loadComments() {
    var list = document.getElementById('comments-list');
    if (!list) return Promise.resolve();
    if (!apiBase()) {
      list.innerHTML = '<p class="comments-empty">' + escapeHtml(t('comments.disabled', '留言功能暂未启用')) + '</p>';
      return Promise.resolve();
    }
    list.innerHTML = '<p class="comments-loading">' + escapeHtml(t('comments.loading', '加载中...')) + '</p>';
    return fetch(api('/api/comments?page=' + encodeURIComponent(pagePath)))
      .then(function(res) { return res.json(); })
      .then(function(result) {
        state.comments = result.data || [];
        renderComments(list);
      }).catch(function() {
        list.innerHTML = '<p class="comments-error">' + escapeHtml(t('comments.error.load', '加载失败，请稍后重试')) + '</p>';
      });
  }

  function renderComments(list) {
    if (!state.comments.length) {
      list.innerHTML = '<p class="comments-empty">' + escapeHtml(t('comments.empty', '暂无留言，来写第一条吧！')) + '</p>';
      return;
    }
    list.innerHTML = state.comments.map(function(comment) {
      return '<article class="comment-item" id="comment-' + escapeHtml(comment.id) + '">' +
        '<div class="comment-header"><span class="comment-author">' + escapeHtml(comment.author_name) + '</span><span class="comment-date">' + escapeHtml(new Date(comment.created_at).toLocaleString()) + '</span></div>' +
        '<div class="comment-body">' + markdown(comment.content || '') + '</div>' +
      '</article>';
    }).join('');
  }

  function init() {
    var container = document.getElementById('comments-container');
    if (!container) return;
    renderForm(container);
    bind(container);
    loadComments();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.Comments = { init: init, loadComments: loadComments };
})();
