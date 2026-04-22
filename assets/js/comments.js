/**
 * Comments Module - Cloudbase NoSQL based commenting system
 * Supports anonymous login, markdown rendering, replies, theme sync
 * @version 1.0.0
 */
(function() {
  'use strict';

  var CONFIG = {
    envId: 'ai-native-2gknzsob14f42138',
    collection: 'comments',
    pageId: '/',
    apiEndpoint: 'https://kevinten.com/trackView',
    maxLength: 1000,
    rateLimitMs: 30000
  };

  var state = {
    auth: null,
    db: null,
    user: null,
    comments: [],
    submitting: false,
    lastSubmitTime: 0
  };

  function init() {
    var container = document.getElementById('comments-container');
    if (!container) return;

    if (typeof cloudbase === 'undefined') {
      container.innerHTML = '<p class="comments-error">评论系统加载失败，请刷新页面重试</p>';
      return;
    }

    state.auth = cloudbase.auth({ env: CONFIG.envId });
    state.db = cloudbase.database({ env: CONFIG.envId });

    signInAnonymous().then(function() {
      loadComments();
    });

    renderForm(container);
    bindEvents(container);
  }

  function signInAnonymous() {
    return state.auth.signInAnonymously().then(function(res) {
      state.user = res;
    }).catch(function(err) {
      console.error('[Comments] Anonymous login failed:', err);
    });
  }

  function loadComments() {
    var container = document.getElementById('comments-list');
    if (!container) return;

    container.innerHTML = '<p class="comments-loading">加载中...</p>';

    state.db.collection(CONFIG.collection)
      .where({ pageId: CONFIG.pageId, parentId: null })
      .orderBy('createdAt', 'desc')
      .get()
      .then(function(res) {
        state.comments = res.data || [];
        return loadReplies();
      })
      .then(function() {
        renderComments(container);
      })
      .catch(function(err) {
        console.error('[Comments] Load failed:', err);
        container.innerHTML = '<p class="comments-error">加载失败，请稍后重试</p>';
      });
  }

  function loadReplies() {
    if (!state.comments.length) return Promise.resolve();

    var parentIds = state.comments.map(function(c) { return c._id; });
    return state.db.collection(CONFIG.collection)
      .where({ parentId: state.db.command.in(parentIds) })
      .orderBy('createdAt', 'asc')
      .get()
      .then(function(res) {
        var replies = res.data || [];
        state.comments.forEach(function(comment) {
          comment.replies = replies.filter(function(r) {
            return r.parentId === comment._id;
          });
        });
      });
  }

  function renderComments(container) {
    if (!state.comments.length) {
      container.innerHTML = '<p class="comments-empty">暂无留言，来写第一条吧！</p>';
      return;
    }

    var html = state.comments.map(function(comment) {
      return renderCommentItem(comment);
    }).join('');

    container.innerHTML = html;
  }

  function renderCommentItem(comment, isReply) {
    isReply = isReply || false;
    var date = formatDate(comment.createdAt);
    var authorName = escapeHtml(comment.author?.name || '访客');
    var content = renderMarkdown(comment.content || '');
    var replyBtn = isReply ? '' : '<button class="comment-reply-btn" data-id="' + comment._id + '">回复</button>';
    var repliesHtml = '';

    if (!isReply && comment.replies && comment.replies.length) {
      repliesHtml = '<div class="comment-replies">' +
        comment.replies.map(function(r) {
          return renderCommentItem(r, true);
        }).join('') +
        '</div>';
    }

    return '<div class="comment-item ' + (isReply ? 'comment-reply' : '') + '" id="comment-' + comment._id + '">' +
      '<div class="comment-header">' +
        '<span class="comment-author">' + authorName + '</span>' +
        '<span class="comment-date">' + date + '</span>' +
      '</div>' +
      '<div class="comment-body">' + content + '</div>' +
      '<div class="comment-actions">' + replyBtn + '</div>' +
      repliesHtml +
      '</div>';
  }

  function renderForm(container) {
    var existing = container.querySelector('.comments-form-wrapper');
    if (existing) return;

    var wrapper = document.createElement('div');
    wrapper.className = 'comments-form-wrapper';
    wrapper.innerHTML =
      '<div class="comments-form">' +
        '<textarea class="comments-input" placeholder="写下你的留言..." maxlength="' + CONFIG.maxLength + '"></textarea>' +
        '<div class="comments-form-footer">' +
          '<span class="comments-hint">支持 Markdown 语法</span>' +
          '<button class="comments-submit btn btn-primary">提交留言</button>' +
        '</div>' +
      '</div>';

    container.insertBefore(wrapper, container.firstChild);
  }

  function bindEvents(container) {
    container.addEventListener('click', function(e) {
      if (e.target.classList.contains('comments-submit')) {
        handleSubmit(container);
      } else if (e.target.classList.contains('comment-reply-btn')) {
        handleReplyClick(e.target, container);
      } else if (e.target.classList.contains('comment-reply-submit')) {
        handleReplySubmit(e.target, container);
      }
    });

    container.addEventListener('keydown', function(e) {
      if (e.target.classList.contains('comments-input') && e.key === 'Enter' && e.metaKey) {
        handleSubmit(container);
      }
    });
  }

  function handleSubmit(container) {
    var input = container.querySelector('.comments-input');
    var content = input.value.trim();

    if (!content) return;
    if (!checkRateLimit()) {
      alert('提交太频繁，请稍后再试');
      return;
    }

    state.submitting = true;
    submitComment(content, null, function() {
      state.submitting = false;
      input.value = '';
      loadComments();
    }, function(err) {
      state.submitting = false;
      alert('提交失败: ' + (err.message || '未知错误'));
    });
  }

  function handleReplyClick(btn, container) {
    var id = btn.dataset.id;
    var existing = container.querySelector('.reply-form[data-parent="' + id + '"]');
    if (existing) {
      existing.remove();
      return;
    }

    var form = document.createElement('div');
    form.className = 'reply-form';
    form.dataset.parent = id;
    form.innerHTML =
      '<textarea class="reply-input" placeholder="回复..." maxlength="' + CONFIG.maxLength + '"></textarea>' +
      '<button class="comment-reply-submit btn btn-sm btn-primary" data-parent="' + id + '">提交回复</button>';

    btn.parentNode.appendChild(form);
    form.querySelector('.reply-input').focus();
  }

  function handleReplySubmit(btn, container) {
    var parentId = btn.dataset.parent;
    var form = container.querySelector('.reply-form[data-parent="' + parentId + '"]');
    var input = form.querySelector('.reply-input');
    var content = input.value.trim();

    if (!content) return;
    if (!checkRateLimit()) {
      alert('提交太频繁，请稍后再试');
      return;
    }

    submitComment(content, parentId, function() {
      form.remove();
      loadComments();
    }, function(err) {
      alert('提交失败: ' + (err.message || '未知错误'));
    });
  }

  function submitComment(content, parentId, onSuccess, onError) {
    if (!state.user) {
      onError(new Error('未登录'));
      return;
    }

    var doc = {
      pageId: CONFIG.pageId,
      parentId: parentId || null,
      content: content,
      author: {
        uid: state.user.uid || 'anonymous',
        name: '访客',
        loginType: 'anonymous'
      },
      status: 'approved',
      createdAt: new Date(),
      likes: 0
    };

    state.db.collection(CONFIG.collection).add(doc)
      .then(onSuccess)
      .catch(onError);
  }

  function checkRateLimit() {
    var now = Date.now();
    if (now - state.lastSubmitTime < CONFIG.rateLimitMs) {
      return false;
    }
    state.lastSubmitTime = now;
    return true;
  }

  function formatDate(dateValue) {
    var d = dateValue ? new Date(dateValue) : new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    var h = String(d.getHours()).padStart(2, '0');
    var min = String(d.getMinutes()).padStart(2, '0');
    return y + '-' + m + '-' + day + ' ' + h + ':' + min;
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function renderMarkdown(text) {
    var html = escapeHtml(text);

    html = html
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>')
      .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([^*]+)\*/g, '<em>$1</em>')
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');

    return html.replace(/\n/g, '<br>');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.Comments = { init: init, loadComments: loadComments };
})();
