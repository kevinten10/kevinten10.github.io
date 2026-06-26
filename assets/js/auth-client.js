/**
 * Auth Client - Auth0 SPA integration with anonymous fallback.
 * @version 1.0.0
 */
(function() {
  'use strict';

  var state = { client: null, user: null, token: '', ready: false };

  function config() {
    return window.CloudflareSiteConfig || {};
  }

  function apiBase() {
    return (config().apiBaseUrl || '').replace(/\/$/, '');
  }

  function anonymousId() {
    var key = 'kevinten-anon-id';
    var id = localStorage.getItem(key);
    if (!id) {
      id = 'anon_' + (crypto.randomUUID ? crypto.randomUUID().replace(/-/g, '') : String(Date.now()) + Math.random().toString(36).slice(2));
      localStorage.setItem(key, id);
    }
    return id;
  }

  async function init() {
    var auth = config().auth0 || {};
    if (!window.auth0 || !auth.domain || !auth.clientId || !auth.audience) {
      state.ready = true;
      updateUi();
      return;
    }
    try {
      state.client = await window.auth0.createAuth0Client({
        domain: auth.domain,
        clientId: auth.clientId,
        authorizationParams: {
          audience: auth.audience,
          redirect_uri: auth.redirectUri || window.location.origin + window.location.pathname
        },
        cacheLocation: 'localstorage'
      });
      if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
        await state.client.handleRedirectCallback();
        history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      }
      if (await state.client.isAuthenticated()) {
        state.user = await state.client.getUser();
        state.token = await state.client.getTokenSilently();
      }
    } catch (err) {
      state.client = null;
      state.user = null;
      state.token = '';
      if (window.location.search.includes('code=') && window.location.search.includes('state=')) {
        history.replaceState({}, document.title, window.location.pathname + window.location.hash);
      }
    }
    state.ready = true;
    updateUi();
  }

  function updateUi() {
    document.querySelectorAll('[data-auth-login]').forEach(function(btn) {
      btn.hidden = Boolean(state.user) || !state.client;
    });
    document.querySelectorAll('[data-auth-logout]').forEach(function(btn) {
      btn.hidden = !state.user;
    });
    document.querySelectorAll('[data-auth-name]').forEach(function(node) {
      node.textContent = state.user ? (state.user.name || state.user.email || 'Signed in') : 'Anonymous';
    });
  }

  async function login() {
    if (!state.client) return;
    await state.client.loginWithRedirect();
  }

  async function logout() {
    if (!state.client) return;
    var auth = config().auth0 || {};
    await state.client.logout({ logoutParams: { returnTo: auth.logoutUri || window.location.origin + '/' } });
  }

  function headers(extra) {
    var result = Object.assign({ 'Content-Type': 'application/json' }, extra || {});
    if (state.token) result.Authorization = 'Bearer ' + state.token;
    return result;
  }

  function visitor() {
    return {
      visitorId: anonymousId(),
      authenticated: Boolean(state.user),
      name: state.user ? (state.user.name || state.user.email) : ''
    };
  }

  document.addEventListener('click', function(event) {
    if (event.target.matches('[data-auth-login]')) login();
    if (event.target.matches('[data-auth-logout]')) logout();
  });

  window.KevinAuth = {
    init: init,
    apiBase: apiBase,
    headers: headers,
    visitor: visitor,
    token: function() { return state.token; },
    user: function() { return state.user; }
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
