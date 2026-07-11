/**
 * Rewards Module - Cloudflare Worker backed thanks wall.
 * @version 2.2.0
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
  var stripeClient = null;
  var stripeClientKey = '';
  var stripeCheckout = null;

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

  function siteConfig() {
    return window.CloudflareSiteConfig || {};
  }

  function stripePublishableKey() {
    var stripe = siteConfig().stripe || {};
    return stripe.publishableKey || '';
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
      if (input.disabled) return;
      input.addEventListener('change', function() {
        syncMethod(section);
      });
    });
    section.querySelectorAll('[data-reward-method]').forEach(function(card) {
      card.addEventListener('click', function() {
        if (card.getAttribute('aria-disabled') === 'true') return;
        var input = section.querySelector('.rewards-method input[value="' + card.dataset.rewardMethod + '"]');
        if (input && !input.disabled) {
          input.checked = true;
          syncMethod(section);
        }
      });
    });
    var button = section.querySelector('.rewards-submit');
    if (button) {
      button.addEventListener('click', function() {
        var payload = buildPayload(section);
        if (selectedProvider(section) === 'stripe_sandbox') {
          startStripeCheckout(section, payload);
          return;
        }
        submit(section, payload);
      });
    }
    var stripeButton = section.querySelector('.stripe-checkout-start');
    if (stripeButton) {
      stripeButton.addEventListener('click', function() {
        startStripeCheckout(section, buildPayload(section));
      });
    }
    syncMethod(section);
  }

  function buildPayload(section) {
    var visitor = window.KevinAuth ? window.KevinAuth.visitor() : { visitorId: '' };
    return {
      visitorId: visitor.visitorId,
      displayName: section.querySelector('.rewards-name').value || visitor.name || 'Supporter',
      amount: section.querySelector('.rewards-amount').value,
      currency: section.querySelector('.rewards-currency').value,
      provider: selectedProvider(section),
      message: section.querySelector('.rewards-message').value
    };
  }

  function selectedProvider(section) {
    var checked = section.querySelector('.rewards-method input:checked');
    return checked ? checked.value : 'alipay_qr';
  }

  function syncMethod(section) {
    var provider = selectedProvider(section);
    var stripeShell = section.querySelector('[data-stripe-embedded-shell]');
    var submitButton = section.querySelector('.rewards-submit');
    section.querySelectorAll('.rewards-method').forEach(function(label) {
      var input = label.querySelector('input');
      label.classList.toggle('is-active', Boolean(input && input.checked));
    });
    section.querySelectorAll('[data-reward-method]').forEach(function(card) {
      card.classList.toggle('is-active', card.dataset.rewardMethod === provider);
    });
    if (stripeShell) stripeShell.hidden = provider !== 'stripe_sandbox';
    if (provider === 'stripe_sandbox') {
      var currency = section.querySelector('.rewards-currency');
      if (currency && currency.value === 'CNY') currency.value = 'USD';
    }
    if (submitButton && !submitButton.disabled) {
      submitButton.textContent = provider === 'stripe_sandbox'
        ? t('rewards.stripe.start', '创建 Stripe 内嵌支付')
        : t('rewards.submit', '提交待确认');
    }
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

  function setSubmitting(section, value, text) {
    var button = section.querySelector('.rewards-submit');
    var stripeButton = section.querySelector('.stripe-checkout-start');
    if (button) {
      button.disabled = value;
      button.textContent = value ? text : '';
    }
    if (stripeButton) stripeButton.disabled = value;
    if (!value) syncMethod(section);
  }

  function validateCommon(section, payload) {
    if (!apiBase()) {
      status(section, t('rewards.disabled', '鸣谢功能暂未启用'), 'error');
      return false;
    }
    if (!payload.displayName.trim()) {
      status(section, t('rewards.error.name', '请先填写昵称'), 'error');
      return false;
    }
    return true;
  }

  function submit(section, payload) {
    if (!validateCommon(section, payload)) return;
    setSubmitting(section, true, t('rewards.submitting', '提交中...'));
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

  function getStripeClient() {
    var publishableKey = stripePublishableKey();
    if (!publishableKey) return null;
    if (!stripeClient || stripeClientKey !== publishableKey) {
      stripeClient = window.Stripe(publishableKey);
      stripeClientKey = publishableKey;
    }
    return stripeClient;
  }

  function resetStripeCheckout(section) {
    if (stripeCheckout && typeof stripeCheckout.destroy === 'function') stripeCheckout.destroy();
    stripeCheckout = null;
    var container = section.querySelector('#stripe-embedded-checkout');
    if (container) container.innerHTML = '';
    var shell = section.querySelector('[data-stripe-embedded-shell]');
    if (shell) shell.classList.remove('is-mounted');
  }

  function createStripeSession(payload) {
    return fetch(api('/api/rewards/stripe/checkout'), {
      method: 'POST',
      headers: window.KevinAuth ? window.KevinAuth.headers() : { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function(res) {
      return res.json();
    }).then(function(result) {
      if (!result.success || !result.data || !result.data.clientSecret) {
        throw new Error(result.error || 'Stripe checkout unavailable');
      }
      return result.data.clientSecret;
    });
  }

  function startStripeCheckout(section, payload) {
    if (!validateCommon(section, payload)) return;
    if (!window.Stripe) {
      status(section, 'Stripe.js 未加载，请稍后重试。', 'error');
      return;
    }
    var stripe = getStripeClient();
    if (!stripe) {
      status(section, 'Stripe 沙箱暂未配置 publishable key。', 'error');
      return;
    }
    var amount = Number(payload.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      status(section, 'Stripe 沙箱需要填写大于 0 的金额。', 'error');
      return;
    }

    payload.provider = 'stripe_sandbox';
    resetStripeCheckout(section);
    setSubmitting(section, true, t('rewards.stripe.loading', '创建 Stripe 支付中...'));
    status(section, '正在创建 Stripe 内嵌支付页...', 'info');

    var createEmbedded = stripe.createEmbeddedCheckoutPage || stripe.initEmbeddedCheckout;
    if (!createEmbedded) {
      setSubmitting(section, false);
      status(section, '当前 Stripe.js 不支持 Embedded Checkout。', 'error');
      return;
    }

    Promise.resolve(createEmbedded.call(stripe, {
      fetchClientSecret: function() {
        return createStripeSession(payload);
      },
      onComplete: function() {
        section.querySelector('.rewards-message').value = '';
        status(section, 'Stripe 支付完成，webhook 验证后会出现在鸣谢墙。', 'success');
        load(section);
      }
    })).then(function(checkout) {
      stripeCheckout = checkout;
      stripeCheckout.mount('#stripe-embedded-checkout');
      var shell = section.querySelector('[data-stripe-embedded-shell]');
      if (shell) shell.classList.add('is-mounted');
      status(section, 'Stripe 内嵌支付页已载入，可使用测试卡完成沙箱支付。', 'success');
    }).catch(function() {
      status(section, 'Stripe 内嵌支付暂时不可用，请稍后重试。', 'error');
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
