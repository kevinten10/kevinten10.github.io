/**
 * AI Assistant Module - Cloudflare Worker backed site guide.
 * Uses Workers AI for open questions with local knowledge fallback.
 * @version 2.0.0
 */
(function() {
  'use strict';

  var CONFIG = {
    endpoint: '/api/assistant',
    sessionKey: 'kevinten-ai-session',
    maxHistory: 8,
    maxInputLength: 500,
    requestTimeoutMs: 18000,
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
        fallback: 'OpenOctopus is KevinTen\'s Realm-native personal agent system: independent agents handle different life domains, share context, and collaborate through clear runtime boundaries.',
        links: [{ href: '#projects', labelKey: 'ai.link.projects', fallback: 'View projects' }]
      },
      {
        matches: ['tech stack', '技术栈', 'skills', 'stack'],
        answerKey: 'ai.answer.techstack',
        fallback: 'KevinTen works across Java, Go, TypeScript, cloud-native systems, Dapr, Layotto, Dubbo, MCP tools, AI agents, and full-stack AI application engineering.',
        links: [{ href: '#tech', labelKey: 'ai.link.tech', fallback: 'View tech stack' }]
      },
      {
        matches: ['multi-runtime', 'multi runtime', '多运行时', 'runtime architecture', '运行时架构'],
        answerKey: 'ai.answer.multiruntime',
        fallback: 'Multi-runtime architecture separates service invocation, state, workflows, tools, and agents into specialized runtimes connected by stable contracts.',
        links: [{ href: '#experience', labelKey: 'ai.link.experience', fallback: 'View experience' }]
      },
      {
        matches: ['ai native', 'ai-native', 'ai 项目', 'ai native 项目', 'mcp', 'agent'],
        answerKey: 'ai.answer.ainative',
        fallback: 'His AI Native work turns agents into practical software collaborators through MCP tools, coding automation, review and diagnostics systems, and personal-product workflows.',
        links: [{ href: '#projects', labelKey: 'ai.link.projects', fallback: 'View projects' }]
      },
      {
        matches: ['contact', 'collaborate', '合作', '联系', '交流'],
        answerKey: 'ai.answer.contact',
        fallback: 'Strong collaboration topics include AI-agent architecture, cloud-native distributed systems, MCP tooling, open source, and one-person-company product experiments.',
        links: [{ href: '#contact', labelKey: 'ai.link.contact', fallback: 'Contact KevinTen' }]
      }
    ]
  };

  var state = {
    open: false,
    messages: [],
    loading: false,
    sessionId: '',
    controller: null,
    requestId: 0
  };

  function init() {
    state.sessionId = getSessionId();
    renderWidget();
    bindEvents();
    updateInputState();
  }

  function apiBase() {
    if (window.KevinAuth && window.KevinAuth.apiBase) return window.KevinAuth.apiBase();
    return String((window.CloudflareSiteConfig || {}).apiBaseUrl || '').replace(/\/$/, '');
  }

  function apiHeaders() {
    if (window.KevinAuth && window.KevinAuth.headers) return window.KevinAuth.headers();
    return { 'Content-Type': 'application/json' };
  }

  function getSessionId() {
    var id = '';
    try {
      id = localStorage.getItem(CONFIG.sessionKey) || '';
      if (!id) {
        id = generateUUID();
        localStorage.setItem(CONFIG.sessionKey, id);
      }
    } catch (err) {
      id = generateUUID();
    }
    return id;
  }

  function generateUUID() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(char) {
      var random = Math.random() * 16 | 0;
      var value = char === 'x' ? random : (random & 0x3 | 0x8);
      return value.toString(16);
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
    var openText = getI18nText('ai.open', 'Open AI guide');
    var closeText = getI18nText('ai.close', 'Close AI guide');
    var sendText = getI18nText('ai.send', 'Send question');

    var widget = document.createElement('div');
    widget.id = 'ai-assistant-widget';
    widget.innerHTML =
      '<button class="ai-fab" id="ai-fab" aria-label="' + escapeHtml(openText) + '" aria-controls="ai-drawer" aria-expanded="false">' +
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
            '<button class="ai-close" type="button" aria-label="' + escapeHtml(closeText) + '">' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
        '<div class="ai-messages" id="ai-messages" aria-live="polite" aria-relevant="additions"></div>' +
        '<div class="ai-input-area">' +
          '<div class="ai-input-meta">' +
            '<span class="ai-service-state" id="ai-service-state" aria-live="polite"></span>' +
            '<span class="ai-char-count" id="ai-char-count">0 / ' + CONFIG.maxInputLength + '</span>' +
          '</div>' +
          '<div class="ai-input-row">' +
            '<textarea class="ai-input" id="ai-input" rows="2" maxlength="' + CONFIG.maxInputLength + '" placeholder="' + escapeHtml(placeholderText) + '" data-i18n-placeholder="ai.placeholder" autocomplete="off"></textarea>' +
            '<button class="ai-send" id="ai-send" aria-label="' + escapeHtml(sendText) + '" disabled>' +
              '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>' +
            '</button>' +
          '</div>' +
        '</div>' +
      '</div>';

    document.body.appendChild(widget);
    renderWelcome();
    setServiceState('ready');
  }

  function renderWelcome() {
    var container = document.getElementById('ai-messages');
    if (!container) return;
    container.innerHTML = '';
    addStaticWelcome(container);
    addSuggestedQuestions(container);
  }

  function addStaticWelcome(container) {
    var message = document.createElement('div');
    message.className = 'ai-message ai-message-bot';
    message.id = 'ai-welcome';
    message.innerHTML = '<span class="ai-message-avatar" aria-hidden="true">K</span>' +
      '<div class="ai-message-content"></div>';
    message.querySelector('.ai-message-content').textContent = getI18nText(
      'ai.welcome',
      "Hi, I'm KevinTen's AI guide. I answer common site questions instantly and use the live model for deeper questions."
    );
    container.appendChild(message);
  }

  function addSuggestedQuestions(container) {
    var list = document.createElement('div');
    list.className = 'ai-suggested-list';
    CONFIG.suggestedQuestions.forEach(function(question) {
      var text = getI18nText(question.key, question.text);
      var button = document.createElement('button');
      button.className = 'ai-suggested-chip';
      button.type = 'button';
      button.dataset.text = text;
      button.textContent = text;
      list.appendChild(button);
    });
    container.appendChild(list);
  }

  function getI18nText(key, fallback) {
    if (window.I18n && window.I18n.get) return window.I18n.get(key) || fallback;
    return fallback;
  }

  function currentLanguage() {
    return document.documentElement.lang.toLowerCase().indexOf('zh') === 0 ? 'zh' : 'en';
  }

  function getFocusableElements(drawer) {
    return drawer.querySelectorAll('.ai-close, .ai-clear, .ai-suggested-chip, .ai-input, .ai-send, .ai-message-link');
  }

  function trapFocus(event) {
    if (!state.open || event.key !== 'Tab') return;
    var drawer = document.getElementById('ai-drawer');
    var focusable = Array.prototype.slice.call(getFocusableElements(drawer)).filter(function(element) {
      return !element.disabled && element.offsetParent !== null;
    });
    if (!focusable.length) return;
    var first = focusable[0];
    var last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  function bindEvents() {
    var fab = document.getElementById('ai-fab');
    var drawer = document.getElementById('ai-drawer');
    var input = document.getElementById('ai-input');
    var send = document.getElementById('ai-send');

    fab.addEventListener('click', toggle);
    drawer.querySelector('.ai-close').addEventListener('click', close);
    drawer.querySelector('.ai-clear').addEventListener('click', clearConversation);
    document.addEventListener('langchange', refreshLanguage);

    drawer.addEventListener('click', function(event) {
      if (event.target.classList.contains('ai-suggested-chip')) {
        input.value = event.target.dataset.text || '';
        updateInputState();
        sendMessage(input.value.trim());
      }
      if (event.target.classList.contains('ai-message-link')) close();
    });

    send.addEventListener('click', function() {
      var text = input.value.trim();
      if (text) sendMessage(text);
    });
    input.addEventListener('input', updateInputState);
    input.addEventListener('keydown', function(event) {
      if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        var text = input.value.trim();
        if (text && !state.loading) sendMessage(text);
      }
    });

    document.addEventListener('keydown', function(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        toggle();
      }
      if (event.key === 'Escape' && state.open) close();
      trapFocus(event);
    });
  }

  function refreshLanguage() {
    var textPairs = [
      ['ai-title', 'ai.title', 'KevinTen AI Guide'],
      ['ai-subtitle', 'ai.subtitle', 'Ask about projects, architecture, AI Native work, or collaboration.']
    ];
    textPairs.forEach(function(item) {
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
    if (welcome) welcome.textContent = getI18nText('ai.welcome', "Hi, I'm KevinTen's AI guide. I answer common site questions instantly and use the live model for deeper questions.");
    var chips = document.querySelectorAll('.ai-suggested-chip');
    for (var index = 0; index < chips.length; index += 1) {
      var question = CONFIG.suggestedQuestions[index];
      if (!question) continue;
      var text = getI18nText(question.key, question.text);
      chips[index].textContent = text;
      chips[index].dataset.text = text;
    }
    document.getElementById('ai-fab').setAttribute('aria-label', getI18nText('ai.open', 'Open AI guide'));
    document.querySelector('.ai-close').setAttribute('aria-label', getI18nText('ai.close', 'Close AI guide'));
    document.getElementById('ai-send').setAttribute('aria-label', getI18nText('ai.send', 'Send question'));
    setServiceState(state.loading ? 'thinking' : 'ready');
  }

  function toggle() {
    if (state.open) close();
    else open();
  }

  function open() {
    state.open = true;
    var drawer = document.getElementById('ai-drawer');
    var fab = document.getElementById('ai-fab');
    drawer.classList.add('open');
    fab.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    window.setTimeout(function() {
      var input = document.getElementById('ai-input');
      if (input) input.focus();
    }, 220);
  }

  function close() {
    state.open = false;
    var drawer = document.getElementById('ai-drawer');
    var fab = document.getElementById('ai-fab');
    drawer.classList.remove('open');
    fab.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    fab.focus();
  }

  function clearConversation() {
    if (state.controller) state.controller.abort();
    state.controller = null;
    state.requestId += 1;
    state.messages = [];
    setLoading(false);
    hideTyping();
    renderWelcome();
    var input = document.getElementById('ai-input');
    if (input) {
      input.value = '';
      input.focus();
    }
    updateInputState();
  }

  function sendMessage(text) {
    if (state.loading || !text) return;
    var requestId = state.requestId + 1;
    var input = document.getElementById('ai-input');
    var history = state.messages.slice(-CONFIG.maxHistory).map(function(message) {
      return { role: message.role, content: message.content };
    });
    input.value = '';
    state.requestId = requestId;
    addMessage('user', text);
    setLoading(true);
    showTyping();
    updateInputState();

    requestAnswer(text, history).then(function(answer) {
      if (requestId !== state.requestId) return;
      hideTyping();
      setLoading(false);
      addMessage('assistant', answer.content, answer);
      setServiceState(answer.source === 'workers_ai' ? 'online' : 'ready');
    });
  }

  function requestAnswer(text, history) {
    var base = apiBase();
    if (!base || !window.fetch) return Promise.resolve(localFallback(text));

    var controller = window.AbortController ? new AbortController() : null;
    var timeout = window.setTimeout(function() {
      if (controller) controller.abort();
    }, CONFIG.requestTimeoutMs);
    state.controller = controller;

    return fetch(base + CONFIG.endpoint, {
      method: 'POST',
      headers: apiHeaders(),
      body: JSON.stringify({
        message: text,
        messages: history,
        sessionId: state.sessionId,
        language: currentLanguage()
      }),
      signal: controller ? controller.signal : undefined
    }).then(function(response) {
      return response.json().catch(function() { return {}; }).then(function(result) {
        if (!response.ok || !result.success || !result.data || !result.data.content) {
          var error = new Error(result.error || 'Assistant request failed');
          error.status = response.status;
          throw error;
        }
        return result.data;
      });
    }).catch(function(error) {
      var fallback = localFallback(text);
      if (!fallback.localMatch) {
        fallback.content = error && error.status === 429
          ? getI18nText('ai.rateLimit', 'Too many questions at once. Please wait a moment and try again.')
          : getI18nText('ai.offline', 'The live guide is temporarily unavailable. Try a suggested site question or use the links below.');
      }
      return fallback;
    }).finally(function() {
      window.clearTimeout(timeout);
      state.controller = null;
    });
  }

  function localFallback(text) {
    var match = findLocalAnswer(text);
    if (match) {
      return {
        content: match.content,
        source: 'site_knowledge',
        links: match.links,
        localMatch: true
      };
    }
    return {
      content: getI18nText('ai.offline', 'The live guide is temporarily unavailable. Try a suggested site question or use the links below.'),
      source: 'fallback',
      links: [
        { href: '#projects', label: getI18nText('ai.link.projects', 'View projects') },
        { href: '#contact', label: getI18nText('ai.link.contact', 'Contact KevinTen') }
      ],
      localMatch: false
    };
  }

  function findLocalAnswer(text) {
    var normalized = normalizeText(text);
    for (var index = 0; index < CONFIG.localKnowledge.length; index += 1) {
      var topic = CONFIG.localKnowledge[index];
      for (var matchIndex = 0; matchIndex < topic.matches.length; matchIndex += 1) {
        if (normalized.indexOf(normalizeText(topic.matches[matchIndex])) !== -1) {
          return {
            content: getI18nText(topic.answerKey, topic.fallback),
            links: topic.links.map(function(link) {
              return {
                href: link.href,
                label: getI18nText(link.labelKey, link.fallback)
              };
            })
          };
        }
      }
    }
    return null;
  }

  function normalizeText(text) {
    return String(text || '').toLowerCase().replace(/\s+/g, ' ').trim();
  }

  function setLoading(value) {
    state.loading = value;
    var drawer = document.getElementById('ai-drawer');
    if (drawer) drawer.classList.toggle('is-loading', value);
    setServiceState(value ? 'thinking' : 'ready');
    updateInputState();
  }

  function setServiceState(status) {
    var node = document.getElementById('ai-service-state');
    if (!node) return;
    var labels = {
      ready: ['ai.ready', 'Ready'],
      thinking: ['ai.thinking', 'Thinking'],
      online: ['ai.online', 'AI answer ready']
    };
    var config = labels[status] || labels.ready;
    node.textContent = getI18nText(config[0], config[1]);
    node.dataset.state = status;
  }

  function updateInputState() {
    var input = document.getElementById('ai-input');
    var send = document.getElementById('ai-send');
    var counter = document.getElementById('ai-char-count');
    if (!input || !send) return;
    send.disabled = state.loading || !input.value.trim();
    input.disabled = state.loading;
    if (counter) counter.textContent = input.value.length + ' / ' + CONFIG.maxInputLength;
  }

  function addMessage(role, content, meta) {
    state.messages.push({ role: role, content: content });
    if (state.messages.length > CONFIG.maxHistory * 2) {
      state.messages = state.messages.slice(-CONFIG.maxHistory * 2);
    }

    var container = document.getElementById('ai-messages');
    var message = document.createElement('div');
    var isUser = role === 'user';
    message.className = 'ai-message ai-message-' + (isUser ? 'user' : 'bot');

    var avatar = document.createElement('span');
    avatar.className = 'ai-message-avatar';
    avatar.setAttribute('aria-hidden', 'true');
    avatar.textContent = isUser ? getI18nText('ai.you', 'You') : 'K';

    var body = document.createElement('div');
    body.className = 'ai-message-body';
    var text = document.createElement('div');
    text.className = 'ai-message-content';
    text.textContent = content;
    body.appendChild(text);

    if (!isUser && meta) {
      var source = document.createElement('span');
      source.className = 'ai-message-source';
      source.textContent = meta.source === 'workers_ai'
        ? getI18nText('ai.source.model', 'AI generated')
        : getI18nText('ai.source.knowledge', 'Site knowledge');
      body.appendChild(source);
      addMessageLinks(body, meta.links);
    }

    message.appendChild(avatar);
    message.appendChild(body);
    container.appendChild(message);
    container.scrollTop = container.scrollHeight;
  }

  function addMessageLinks(container, links) {
    if (!Array.isArray(links) || !links.length) return;
    var list = document.createElement('div');
    list.className = 'ai-message-links';
    links.slice(0, 3).forEach(function(link) {
      if (!link || typeof link.href !== 'string' || link.href.charAt(0) !== '#') return;
      var anchor = document.createElement('a');
      anchor.className = 'ai-message-link';
      anchor.href = link.href;
      anchor.textContent = String(link.label || link.href.slice(1));
      list.appendChild(anchor);
    });
    if (list.children.length) container.appendChild(list);
  }

  function showTyping() {
    var container = document.getElementById('ai-messages');
    if (!container || document.getElementById('ai-typing')) return;
    var typing = document.createElement('div');
    typing.id = 'ai-typing';
    typing.className = 'ai-message ai-message-bot ai-typing';
    typing.innerHTML = '<span class="ai-message-avatar" aria-hidden="true">K</span>' +
      '<div class="ai-typing-indicator" aria-label="' + escapeHtml(getI18nText('ai.thinking', 'Thinking')) + '"><span></span><span></span><span></span></div>';
    container.appendChild(typing);
    container.scrollTop = container.scrollHeight;
  }

  function hideTyping() {
    var typing = document.getElementById('ai-typing');
    if (typing) typing.remove();
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.AIAssistant = {
    toggle: toggle,
    open: open,
    close: close,
    findLocalAnswer: findLocalAnswer
  };
})();
