/**
 * AI Assistant Module - Floating chat widget
 * Calls Cloudbase aiChat function, supports streaming simulation
 * Keyboard shortcut: Cmd/Ctrl + K
 * @version 1.0.0
 */
(function() {
  'use strict';

  var CONFIG = {
    endpoint: 'https://kevinten.com/aiChat',
    sessionKey: 'kevinten-ai-session',
    maxHistory: 10,
    suggestedQuestions: [
      { key: 'ai.suggested1', text: 'What is OpenOctopus?' },
      { key: 'ai.suggested2', text: "Tell me about KevinTen's tech stack" },
      { key: 'ai.suggested3', text: 'What is multi-runtime architecture?' }
    ]
  };

  var state = {
    open: false,
    messages: [],
    loading: false,
    sessionId: ''
  };

  function init() {
    state.sessionId = getSessionId();
    renderWidget();
    bindEvents();
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

  function renderWidget() {
    var existing = document.getElementById('ai-assistant-widget');
    if (existing) existing.remove();

    var widget = document.createElement('div');
    widget.id = 'ai-assistant-widget';
    widget.innerHTML =
      '<button class="ai-fab" id="ai-fab" aria-label="Open AI assistant">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' +
      '</button>' +
      '<div class="ai-drawer" id="ai-drawer" role="dialog" aria-modal="true" aria-labelledby="ai-title">' +
        '<div class="ai-drawer-header">' +
          '<h3 id="ai-title" data-i18n="ai.title">AI Assistant</h3>' +
          '<button class="ai-close" aria-label="Close">&times;</button>' +
        '</div>' +
        '<div class="ai-messages" id="ai-messages"></div>' +
        '<div class="ai-input-area">' +
          '<input type="text" class="ai-input" id="ai-input" placeholder="Type your question..." data-i18n-placeholder="ai.placeholder" />' +
          '<button class="ai-send" id="ai-send" aria-label="Send">' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
          '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(widget);
    renderWelcome();
  }

  function renderWelcome() {
    var container = document.getElementById('ai-messages');
    if (!container) return;

    var welcomeText = getI18nText('ai.welcome', "Hi! I'm KevinTen's AI assistant. Ask me about his projects, tech stack, or experience.");

    var html = '<div class="ai-message ai-message-bot" id="ai-welcome">' +
      '<div class="ai-message-content">' + escapeHtml(welcomeText) + '</div>' +
      '</div>';

    var suggestedHtml = CONFIG.suggestedQuestions.map(function(q) {
      var text = getI18nText(q.key, q.text);
      return '<button class="ai-suggested-chip" data-text="' + escapeHtml(text) + '">' + escapeHtml(text) + '</button>';
    }).join('');

    html += '<div class="ai-suggested-list">' + suggestedHtml + '</div>';
    container.innerHTML = html;
  }

  function getI18nText(key, fallback) {
    if (typeof I18n !== 'undefined' && I18n.get) {
      return I18n.get(key) || fallback;
    }
    return fallback;
  }

  function getFocusableElements(drawer) {
    return drawer.querySelectorAll('.ai-close, .ai-suggested-chip, .ai-input, .ai-send');
  }

  function trapFocus(e) {
    if (!state.open || e.key !== 'Tab') return;
    var drawer = document.getElementById('ai-drawer');
    var focusable = Array.prototype.slice.call(getFocusableElements(drawer)).filter(function(el) {
      return !el.disabled && el.offsetParent !== null;
    });
    if (focusable.length === 0) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function bindEvents() {
    var fab = document.getElementById('ai-fab');
    var drawer = document.getElementById('ai-drawer');
    var closeBtn = drawer.querySelector('.ai-close');
    var input = document.getElementById('ai-input');
    var sendBtn = document.getElementById('ai-send');

    fab.addEventListener('click', toggle);
    closeBtn.addEventListener('click', close);

    document.addEventListener('langchange', function() {
      var title = document.getElementById('ai-title');
      if (title) title.textContent = getI18nText('ai.title', 'AI Assistant');
      if (input) input.placeholder = getI18nText('ai.placeholder', 'Type your question...');
      var welcome = document.querySelector('#ai-welcome .ai-message-content');
      if (welcome) welcome.textContent = getI18nText('ai.welcome', "Hi! I'm KevinTen's AI assistant. Ask me about his projects, tech stack, or experience.");
      var chips = document.querySelectorAll('.ai-suggested-chip');
      for (var i = 0; i < chips.length; i++) {
        var q = CONFIG.suggestedQuestions[i];
        if (q) {
          var text = getI18nText(q.key, q.text);
          chips[i].textContent = text;
          chips[i].dataset.text = text;
        }
      }
    });

    drawer.addEventListener('click', function(e) {
      if (e.target.classList.contains('ai-suggested-chip')) {
        var text = e.target.dataset.text;
        input.value = text;
        sendMessage(text);
      }
    });

    sendBtn.addEventListener('click', function() {
      var text = input.value.trim();
      if (text) sendMessage(text);
    });

    input.addEventListener('keydown', function(e) {
      if (e.key === 'Enter') {
        var text = input.value.trim();
        if (text) sendMessage(text);
      }
    });

    document.addEventListener('keydown', function(e) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && state.open) {
        close();
      }
      trapFocus(e);
    });
  }

  function toggle() {
    state.open = !state.open;
    var drawer = document.getElementById('ai-drawer');
    var fab = document.getElementById('ai-fab');
    if (state.open) {
      drawer.classList.add('open');
      fab.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      setTimeout(function() {
        var input = document.getElementById('ai-input');
        if (input) input.focus();
      }, 300);
    } else {
      drawer.classList.remove('open');
      fab.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  }

  function close() {
    state.open = false;
    var drawer = document.getElementById('ai-drawer');
    var fab = document.getElementById('ai-fab');
    drawer.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    fab.focus();
    hideTyping();
  }

  function sendMessage(text) {
    if (state.loading) return;

    var input = document.getElementById('ai-input');
    input.value = '';

    addMessage('user', text);
    state.loading = true;
    showTyping();

    var messages = state.messages.slice(-CONFIG.maxHistory).map(function(m) {
      return { role: m.role, content: m.content };
    });
    messages.push({ role: 'user', content: text });

    fetch(CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: messages, sessionId: state.sessionId, uid: 'anonymous' })
    })
    .then(function(res) { return res.json(); })
    .then(function(data) {
      hideTyping();
      state.loading = false;
      if (data.success && data.data && data.data.content) {
        addMessage('assistant', data.data.content);
      } else {
        addMessage('assistant', getI18nText('ai.error', 'Sorry, I encountered an error. Please try again.'));
      }
    })
    .catch(function(err) {
      hideTyping();
      state.loading = false;
      console.error('[AI Assistant] API error:', err);
      addMessage('assistant', getI18nText('ai.error', 'Sorry, I encountered an error. Please try again.'));
    });
  }

  function addMessage(role, content) {
    state.messages.push({ role: role, content: content });
    if (state.messages.length > CONFIG.maxHistory * 2) {
      state.messages = state.messages.slice(-CONFIG.maxHistory * 2);
    }
    var container = document.getElementById('ai-messages');
    var div = document.createElement('div');
    div.className = 'ai-message ai-message-' + (role === 'user' ? 'user' : 'bot');
    div.innerHTML = '<div class="ai-message-content">' + escapeHtml(content) + '</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    var container = document.getElementById('ai-messages');
    var div = document.createElement('div');
    div.id = 'ai-typing';
    div.className = 'ai-message ai-message-bot ai-typing';
    div.innerHTML = '<div class="ai-typing-indicator"><span></span><span></span><span></span></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    var el = document.getElementById('ai-typing');
    if (el) el.remove();
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  window.AIAssistant = { toggle: toggle, close: close };
})();
