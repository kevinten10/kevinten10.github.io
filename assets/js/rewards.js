/**
 * Rewards Module - Cloudflare Worker backed thanks wall.
 * @version 2.1.0
 */
(function() {
  'use strict';

  var providerLabels = {
    wechat_qr: 'WeChat',
    alipay_qr: 'Alipay',
    manual_qr: 'QR',
    stripe: 'Stripe Sandbox',
    stripe_sandbox: 'Stripe Sandbox'
  };

  function t(key, fallback) {
    if (typeof I18n !== 'undefined' && I18n.get) return I18n.get(key) || fallback;
    return fallback;
  }

  function escapeHtml(value) {
    var div = document.createElement('div');
    div.textContent = value || '';
    return div.innerHTML;
  }

  function api(path) {
    return (window.KevinAuth ? window.KevinAuth.apiBase() : '') + path;
  }

  function apiBase() {
    return window.KevinAuth ? window.KevinAuth.apiBase() : '';
  }

  function init() {
    var section = document.getElementById('rewards');
    if (!section) return;
    bind(section);
    setupViewportClass(section);
    load(section);
  }

  function bind(section) {
    section.querySelectorAll('.rewards-method input').forEach(function(input) {
      input.addEventListener('change', function() {
        syncMethod(section);
      });
    });
    section.querySelectorAll('[data-reward-method]').forEach(function(card) {
      card.addEventListener('click', function() {
        var input = section.querySelector('.rewards-method input[value="' + card.dataset.rewardMethod + '"]');
        if (input) {
          input.checked = true;
          syncMethod(section);
        }
      });
    });
    var button = section.querySelector('.rewards-submit');
    if (!button) return;
    button.addEventListener('click', function() {
      var visitor = window.KevinAuth ? window.KevinAuth.visitor() : { visitorId: '' };
      var payload = {
        visitorId: visitor.visitorId,
        displayName: section.querySelector('.rewards-name').value || visitor.name || 'Supporter',
        amount: section.querySelector('.rewards-amount').value,
        currency: section.querySelector('.rewards-currency').value,
        provider: selectedProvider(section),
        message: section.querySelector('.rewards-message').value
      };
      submit(section, payload);
    });
    syncMethod(section);
  }

  function selectedProvider(section) {
    var checked = section.querySelector('.rewards-method input:checked');
    return checked ? checked.value : 'wechat_qr';
  }

  function syncMethod(section) {
    var provider = selectedProvider(section);
    section.querySelectorAll('.rewards-method').forEach(function(label) {
      var input = label.querySelector('input');
      label.classList.toggle('is-active', Boolean(input && input.checked));
    });
    section.querySelectorAll('[data-reward-method]').forEach(function(card) {
      card.classList.toggle('is-active', card.dataset.rewardMethod === provider);
    });
  }

  function setupViewportClass(section) {
    if (!('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function(entries) {
      var visible = entries.some(function(entry) {
        return entry.isIntersecting;
      });
      document.body.classList.toggle('rewards-in-view', visible);
    }, {
      rootMargin: '-72px 0px -80px 0px',
      threshold: 0
    });
    observer.observe(section);
  }

  function status(section, message, tone) {
    var node = section.querySelector('.rewards-status');
    if (!node) return;
    node.textContent = message || '';
    node.classList.remove('is-error', 'is-success', 'is-info');
    if (tone) node.classList.add('is-' + tone);
  }

  function setSubmitting(section, value) {
    var button = section.querySelector('.rewards-submit');
    if (!button) return;
    button.disabled = value;
    button.textContent = value ? t('rewards.submitting', '提交中...') : t('rewards.submit', '提交待确认');
  }

  function submit(section, payload) {
    if (!apiBase()) return status(section, t('rewards.disabled', '鸣谢功能暂未启用'), 'error');
    if (!payload.displayName.trim()) return status(section, t('rewards.error.name', '请先填写昵称'), 'error');
    setSubmitting(section, true);
    status(section, t('rewards.status.sending', '正在提交待确认记录'), 'info');
    fetch(api('/api/rewards'), {
      method: 'POST',
      headers: window.KevinAuth ? window.KevinAuth.headers() : { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res) {
      return res.json();
    }).then(function(result) {
      if (!result.success) throw new Error(result.error || 'failed');
      section.querySelector('.rewards-message').value = '';
      status(section, t('rewards.status.pending', '已提交待确认，核对到账后会出现在鸣谢墙'), 'success');
      load(section);
    }).catch(function() {
      status(section, t('rewards.error.submit', '提交失败，请稍后再试'), 'error');
    }).finally(function() {
      setSubmitting(section, false);
    });
  }

  function load(section) {
    var list = section.querySelector('.rewards-list');
    if (!list) return;
    if (!apiBase()) {
      list.innerHTML = '<p class="rewards-empty">' + escapeHtml(t('rewards.disabled', '鸣谢功能暂未启用')) + '</p>';
      return;
    }
    fetch(api('/api/rewards')).then(function(res) {
      return res.json();
    }).then(function(result) {
      var rewards = result.data || [];
      if (!rewards.length) {
        list.innerHTML = '<p class="rewards-empty">' + escapeHtml(t('rewards.empty', '还没有公开鸣谢。')) + '</p>';
        return;
      }
      list.innerHTML = rewards.map(function(item) {
        var provider = providerLabels[item.provider] || providerLabels.manual_qr;
        var amount = item.amount === null || item.amount === undefined ? '' : Number(item.amount).toLocaleString([], {
          minimumFractionDigits: 0,
          maximumFractionDigits: 2
        }) + ' ' + escapeHtml(item.currency || 'CNY');
        return '<article class="reward-item">' +
          '<div class="reward-meta"><strong>' + escapeHtml(item.display_name) + '</strong><span>' + escapeHtml(new Date(item.created_at).toLocaleDateString()) + '</span></div>' +
          '<div class="reward-tags"><span>' + escapeHtml(provider) + '</span>' + (amount ? '<span>' + amount + '</span>' : '') + '</div>' +
          (item.message ? '<p>' + escapeHtml(item.message) + '</p>' : '') +
          (item.status === 'verified' ? '<span class="reward-verified">' + escapeHtml(t('rewards.verified', 'Verified')) + '</span>' : '') +
          '</article>';
      }).join('');
    }).catch(function() {
      list.innerHTML = '<p class="rewards-empty">' + escapeHtml(t('rewards.error.load', '鸣谢墙暂时不可用。')) + '</p>';
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
