/**
 * AI Assistant Module - floating site guide.
 * Calls Cloudbase aiChat when available, with local knowledge fallback.
 * Keyboard shortcut: Cmd/Ctrl + K
 * @version 1.1.0
 */
(function() {
  'use strict';

  var CONFIG = {
    envId: 'ai-native-2gknzsob14f42138',
    functionName: 'aiChat',
    sessionKey: 'kevinten-ai-session',
    maxHistory: 10,
    suggestedQuestions: [
      { key: 'ai.suggested1', text: 'What is OpenOctopus?' },
      { key: 'ai.suggested2', text: "What is KevinTen's tech stack?" },
      { key: 'ai.suggested3', text: 'How does multi-runtime architecture work?' },
      { key: 'ai.suggested4', text: 'How does AI Native show up in his work?' }
    ],
    localKnowledge: [
      {
        matches: ['openoctopus', 'open octopus', '什么是 openoctopus', 'openoctopus 是什么', '生活智能体'],
        answerKey: 'ai.answer.openoctopus',
        fallback: 'OpenOctopus is KevinTen\'s Realm-native personal agent system: a life operating layer where independent agents handle different domains, share context, and collaborate through runtime boundaries.'
      },
      {
        matches: ['tech stack', '技术栈', 'skills', 'stack'],
        answerKey: 'ai.answer.techstack',
        fallback: 'KevinTen works across Java, Go, TypeScript, cloud-native systems, Dapr, Layotto, Dubbo, MCP tools, AI agents, and full-stack AI application engineering.'
      },
      {
        matches: ['multi-runtime', 'multi runtime', '多运行时', 'runtime architecture', '运行时架构'],
        answerKey: 'ai.answer.multiruntime',
        fallback: 'Multi-runtime architecture separates capabilities into specialized runtimes, such as service invocation, state, workflow, agents, and tool execution, then connects them through clear contracts so systems can evolve independently.'
      },
      {
        matches: ['ai native', 'ai-native', 'ai 项目', 'ai native 项目', 'mcp', 'agent'],
        answerKey: 'ai.answer.ainative',
        fallback: 'His AI Native work focuses on turning agents into practical software teammates: MCP tools, coding automation, review and diagnostic systems, and personal-product workflows.'
      },
      {
        matches: ['contact', 'collaborate', '合作', '联系', '交流'],
        answerKey: 'ai.answer.contact',
        fallback: 'For collaboration, the strongest fits are AI Agent architecture, cloud-native distributed systems, MCP tooling, open source, and one-person-company style product experiments.'
      }
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
    if (typeof cloudbase !== 'undefined') {
      try {
        cloudbase.init({ env: CONFIG.envId });
      } catch (e) {
        // SDK may already be initialized.
      }
    }
    renderWidget();
    bindEvents();
    updateSendState();
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

    var titleText = getI18nText('ai.title', 'KevinTen AI Guide');
    var statusText = getI18nText('ai.status', 'Site guide');
    var subtitleText = getI18nText('ai.subtitle', 'Ask about projects, architecture, AI Native work, or collaboration.');
    var placeholderText = getI18nText('ai.placeholder', 'Ask about OpenOctopus, tech stack, or experience...');
    var clearText = getI18nText('ai.clear', 'Clear');

    var widget = document.createElement('div');
    widget.id = 'ai-assistant-widget';
    widget.innerHTML =
      '<button class="ai-fab" id="ai-fab" aria-label="Open AI assistant" aria-controls="ai-drawer" aria-expanded="false">' +
        '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>' +
      '</button>' +
      '<div class="ai-drawer" id="ai-drawer" role="dialog" aria-modal="true" aria-labelledby="ai-title" aria-describedby="ai-subtitle">' +
        '<div class="ai-drawer-header">' +
          '<div class="ai-title-block">' +
            '<span class="ai-shell-status" data-i18n="ai.status">' + escapeHtml(statusText) + '</span>' +
            '<h3 id="ai-title" data-i18n="ai.title">' + escapeHtml(titleText) + '</h3>' +
            '<p id="ai-subtitle" data-i18n="ai.subtitle">' + escapeHtml(subtitleText) + '</p>' +
          '</div>' +
          '<div class="ai-header-actions">' +
            '<button class="ai-clear" type="button" data-i18n="ai.clear">' + escapeHtml(clearText) + '</button>' +
            '<button class="ai-close" type="button" aria-label="Close">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="ai-messages" id="ai-messages" aria-live="polite" aria-relevant="additions"></div>' +
        '<div class="ai-input-area">' +
          '<input type="text" class="ai-input" id="ai-input" placeholder="' + escapeHtml(placeholderText) + '" data-i18n-placeholder="ai.placeholder" autocomplete="off" />' +
          '<button class="ai-send" id="ai-send" aria-label="Send" disabled>' +
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

    var welcomeText = getI18nText('ai.welcome', "Hi, I'm KevinTen's AI guide. I can answer common site questions instantly and route deeper questions to the live model when it is available.");

    var html = '<div class="ai-message ai-message-bot" id="ai-welcome">' +
      '<span class="ai-message-avatar" aria-hidden="true">K</span>' +
      '<div class="ai-message-content">' + escapeHtml(welcomeText) + '</div>' +
      '</div>';

    var suggestedHtml = CONFIG.suggestedQuestions.map(function(q) {
      var text = getI18nText(q.key, q.text);
      return '<button class="ai-suggested-chip" type="button" data-text="' + escapeHtml(text) + '">' + escapeHtml(text) + '</button>';
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
    return drawer.querySelectorAll('.ai-close, .ai-clear, .ai-suggested-chip, .ai-input, .ai-send');
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
    var clearBtn = drawer.querySelector('.ai-clear');
    var input = document.getElementById('ai-input');
    var sendBtn = document.getElementById('ai-send');

    fab.addEventListener('click', toggle);
    closeBtn.addEventListener('click', close);
    clearBtn.addEventListener('click', clearConversation);

    document.addEventListener('langchange', refreshLanguage);

    drawer.addEventListener('click', function(e) {
      if (e.target.classList.contains('ai-suggested-chip')) {
        var text = e.target.dataset.text;
        input.value = text;
        updateSendState();
        sendMessage(text);
      }
    });

    sendBtn.addEventListener('click', function() {
      var text = input.value.trim();
      if (text) sendMessage(text);
    });

    input.addEventListener('input', updateSendState);
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

  function refreshLanguage() {
    var pairs = [
      ['ai-title', 'ai.title', 'KevinTen AI Guide'],
      ['ai-subtitle', 'ai.subtitle', 'Ask about projects, architecture, AI Native work, or collaboration.']
    ];
    pairs.forEach(function(item) {
      var node = document.getElementById(item[0]);
      if (node) node.textContent = getI18nText(item[1], item[2]);
    });
    var status = document.querySelector('.ai-shell-status');
    if (status) status.textContent = getI18nText('ai.status', 'Site guide');
    var clear = document.querySelector('.ai-clear');
    if (clear) clear.textContent = getI18nText('ai.clear', 'Clear');
    var input = document.getElementById('ai-input');
    if (input) input.placeholder = getI18nText('ai.placeholder', 'Ask about OpenOctopus, tech stack, or experience...');
    var welcome = document.querySelector('#ai-welcome .ai-message-content');
    if (welcome) welcome.textContent = getI18nText('ai.welcome', "Hi, I'm KevinTen's AI guide. I can answer common site questions instantly and route deeper questions to the live model when it is available.");
    var chips = document.querySelectorAll('.ai-suggested-chip');
    for (var i = 0; i < chips.length; i++) {
      var q = CONFIG.suggestedQuestions[i];
      if (q) {
        var text = getI18nText(q.key, q.text);
        chips[i].textContent = text;
        chips[i].dataset.text = text;
      }
    }
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
      }, 220);
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

  function clearConversation() {
    state.messages = [];
    hideTyping();
    renderWelcome();
    updateSendState();
    var input = document.getElementById('ai-input');
    if (input) input.focus();
  }

  function sendMessage(text) {
    if (state.loading) return;

    var input = document.getElementById('ai-input');
    input.value = '';
    updateSendState();

    addMessage('user', text);
    var localAnswer = findLocalAnswer(text);
    if (localAnswer) {
      setLoading(true);
      showTyping();
      window.setTimeout(function() {
        hideTyping();
        setLoading(false);
        addMessage('assistant', localAnswer);
      }, 180);
      return;
    }

    var messages = state.messages.slice(-CONFIG.maxHistory).map(function(m) {
      return { role: m.role, content: m.content };
    });
    messages.push({ role: 'user', content: text });

    if (typeof cloudbase === 'undefined') {
      addMessage('assistant', getI18nText('ai.offline', 'The live model is not connected here, but I can answer the suggested site questions locally.'));
      return;
    }

    setLoading(true);
    showTyping();
    cloudbase.callFunction({
      name: CONFIG.functionName,
      data: { messages: messages, sessionId: state.sessionId, uid: 'anonymous' }
    }).then(function(res) {
      hideTyping();
      setLoading(false);
      var data = res.result || {};
      if (data.success && data.data && data.data.content) {
        addMessage('assistant', data.data.content);
      } else {
        addMessage('assistant', getI18nText('ai.error', 'The live model did not return an answer. Try one of the suggested site questions.'));
      }
    }).catch(function() {
      hideTyping();
      setLoading(false);
      addMessage('assistant', getI18nText('ai.error', 'The live model is temporarily unavailable. Try one of the suggested site questions.'));
    });
  }

  function findLocalAnswer(text) {
    var normalized = normalizeText(text);
    for (var i = 0; i < CONFIG.localKnowledge.length; i++) {
      var topic = CONFIG.localKnowledge[i];
      for (var j = 0; j < topic.matches.length; j++) {
        if (normalized.indexOf(normalizeText(topic.matches[j])) !== -1) {
          return getI18nText(topic.answerKey, topic.fallback);
        }
      }
    }
    return '';
  }

  function normalizeText(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function setLoading(value) {
    state.loading = value;
    var drawer = document.getElementById('ai-drawer');
    if (drawer) drawer.classList.toggle('is-loading', value);
    updateSendState();
  }

  function updateSendState() {
    var input = document.getElementById('ai-input');
    var send = document.getElementById('ai-send');
    if (!input || !send) return;
    send.disabled = state.loading || !input.value.trim();
  }

  function addMessage(role, content) {
    state.messages.push({ role: role, content: content });
    if (state.messages.length > CONFIG.maxHistory * 2) {
      state.messages = state.messages.slice(-CONFIG.maxHistory * 2);
    }
    var container = document.getElementById('ai-messages');
    var div = document.createElement('div');
    var isUser = role === 'user';
    div.className = 'ai-message ai-message-' + (isUser ? 'user' : 'bot');
    div.innerHTML = '<span class="ai-message-avatar" aria-hidden="true">' + (isUser ? 'You' : 'K') + '</span>' +
      '<div class="ai-message-content">' + escapeHtml(content) + '</div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  function showTyping() {
    var container = document.getElementById('ai-messages');
    if (!container || document.getElementById('ai-typing')) return;
    var div = document.createElement('div');
    div.id = 'ai-typing';
    div.className = 'ai-message ai-message-bot ai-typing';
    div.innerHTML = '<span class="ai-message-avatar" aria-hidden="true">K</span>' +
      '<div class="ai-typing-indicator" aria-label="' + escapeHtml(getI18nText('ai.thinking', 'Thinking')) + '"><span></span><span></span><span></span></div>';
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

  window.AIAssistant = {
    toggle: toggle,
    close: close,
    findLocalAnswer: findLocalAnswer
  };
})();
