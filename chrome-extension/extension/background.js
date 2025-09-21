import { supabaseConfig } from './config.js';
import {
  saveSession,
  getSession,
  clearSession,
  savePkceState,
  getPkceState,
  clearPkceState
} from './background/sessionStore.js';
import {
  generateCodeVerifier,
  generateCodeChallenge,
  generateState
} from './background/pkce.js';

const REFRESH_ALARM = 'supabase-auth-refresh';
const REFRESH_MARGIN_MS = 2 * 60 * 1000;

console.log('[background] service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[background] extension installed');
});

bootstrapSession().catch((error) => {
  console.error('[auth] bootstrap failed', error);
});

if (chrome.alarms && chrome.alarms.onAlarm) {
  chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === REFRESH_ALARM) {
      refreshSession().catch((error) => {
        console.error('[auth] refresh alarm failed', error);
      });
    }
  });
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || !message.type) {
    return undefined;
  }

  if (message.type === 'auth:login') {
    handleLogin(message.provider)
      .then((session) => {
        sendResponse({ ok: true, session: sanitizeSession(session) });
      })
      .catch((error) => {
        console.error('[auth] login failed', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'auth:loginPassword') {
    handlePasswordLogin(message.email, message.password)
      .then((session) => {
        sendResponse({ ok: true, session: sanitizeSession(session) });
      })
      .catch((error) => {
        console.error('[auth] password login failed', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'auth:getSession') {
    handleGetSession()
      .then((session) => sendResponse({ ok: true, session }))
      .catch((error) => {
        console.error('[auth] getSession failed', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'auth:logout') {
    handleLogout()
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error('[auth] logout failed', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  return undefined;
});

async function bootstrapSession() {
  const current = await getSession();
  if (!current) {
    return;
  }

  if (shouldRefresh(current)) {
    await refreshSession();
    return;
  }

  scheduleRefresh(current.expiresAt);
  broadcastAuthChanged(current);
}

async function handleLogin(requestedProvider) {
  const provider = requestedProvider || supabaseConfig.defaultProvider;
  if (!provider) {
    throw new Error('auth provider not configured');
  }

  const redirectUri = chrome.identity.getRedirectURL('supabase');
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  await savePkceState({
    codeVerifier,
    state,
    redirectUri,
    createdAt: Date.now(),
    provider
  });

  const authUrl = buildAuthorizeUrl({ codeChallenge, state, redirectUri, provider });

  let redirectResponse;
  try {
    redirectResponse = await chrome.identity.launchWebAuthFlow({
      url: authUrl,
      interactive: true
    });
  } catch (error) {
    await clearPkceState();
    throw error;
  }

  const pkceState = await getPkceState();
  if (!pkceState || pkceState.state !== state) {
    await clearPkceState();
    throw new Error('PKCE state mismatch or expired');
  }

  const { code, error, errorDescription, returnedState } = parseAuthRedirect(redirectResponse);

  if (error) {
    await clearPkceState();
    throw new Error(errorDescription || error);
  }

  if (!code || returnedState !== state) {
    await clearPkceState();
    throw new Error('Auth code missing or state mismatch');
  }

  const session = await exchangeCodeForSession({
    code,
    codeVerifier: pkceState.codeVerifier,
    redirectUri: pkceState.redirectUri
  });

  await clearPkceState();
  await saveSession(session);
  scheduleRefresh(session.expiresAt);
  broadcastAuthChanged(session);
  return session;
}

/**
 * Perform email/password authentication using Supabase's password grant. The session shape matches
 * the PKCE flow, enabling shared storage and refresh handling.
 */
async function handlePasswordLogin(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const url = `${supabaseConfig.url}/auth/v1/token?grant_type=password`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      // Required by Supabase for all auth/REST calls:
      'apikey': supabaseConfig.anonKey
      // no Authorization header for this request
    },
    body: JSON.stringify({ email, password })
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    // GoTrue uses error_description / error fields
    throw new Error(payload?.error_description || payload?.error || 'Invalid credentials');
  }

  // Expected fields: access_token, token_type, expires_in, refresh_token, user
  const now = Date.now();
  const expiresAt = now + (payload.expires_in ?? 3600) * 1000;

  const session = {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    tokenType: payload.token_type || 'bearer',
    user: payload.user || null,
    expiresAt
  };

  await saveSession(session);
  // Refresh a bit early (e.g., 60s before expiry)
  scheduleRefresh(expiresAt - 60_000);

  broadcastAuthChanged(session);
  return session;
}

async function handleGetSession() {
  let session = await getSession();
  if (session && shouldRefresh(session)) {
    session = await refreshSession();
  }
  return sanitizeSession(session);
}

async function handleLogout() {
  const session = await getSession();
  if (session) {
    try {
      await sendLogoutRequest(session.accessToken);
    } catch (error) {
      console.warn('[auth] remote logout failed', error);
    }
  }

  await clearSession();
  cancelRefresh();
  broadcastAuthChanged(null);
}

function buildAuthorizeUrl({ codeChallenge, state, redirectUri, provider }) {
  const authorizeUrl = new URL(`${supabaseConfig.url}/auth/v1/authorize`);
  const params = authorizeUrl.searchParams;
  params.set('provider', provider);
  params.set('response_type', 'code');
  params.set('redirect_to', redirectUri);
  params.set('code_challenge', codeChallenge);
  params.set('code_challenge_method', 'S256');
  params.set('state', state);
  params.set('scope', 'openid email profile');
  if (supabaseConfig.clientId || supabaseConfig.anonKey) {
    params.set('client_id', supabaseConfig.clientId || supabaseConfig.anonKey);
  }
  return authorizeUrl.toString();
}

function parseAuthRedirect(redirectUrl) {
  const url = new URL(redirectUrl);
  const query = url.search ? new URLSearchParams(url.search.substring(1)) : new URLSearchParams();
  const hash = url.hash ? new URLSearchParams(url.hash.substring(1)) : new URLSearchParams();

  const code = query.get('code') || hash.get('code');
  const returnedState = query.get('state') || hash.get('state');
  const error = query.get('error') || hash.get('error');
  const errorDescription =
    query.get('error_description') || hash.get('error_description') || hash.get('errorDescription');

  return { code, returnedState, error, errorDescription };
}

async function exchangeCodeForSession({ code, codeVerifier, redirectUri }) {
  const form = new URLSearchParams();
  form.set('grant_type', 'pkce');
  form.set('code', code);
  form.set('code_verifier', codeVerifier);
  form.set('redirect_to', redirectUri);
  if (supabaseConfig.clientId || supabaseConfig.anonKey) {
    form.set('client_id', supabaseConfig.clientId || supabaseConfig.anonKey);
  }

  const response = await fetch(`${supabaseConfig.url}/auth/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      apikey: supabaseConfig.anonKey || ''
    },
    body: form.toString()
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    throw new Error(payload.error_description || payload.error || 'token exchange failed');
  }

  return buildSessionFromPayload(payload);
}

async function refreshSession() {
  const current = await getSession();
  if (!current || !current.refreshToken) {
    await clearSession();
    cancelRefresh();
    broadcastAuthChanged(null);
    return null;
  }

  const form = new URLSearchParams();
  form.set('grant_type', 'refresh_token');
  form.set('refresh_token', current.refreshToken);
  if (supabaseConfig.clientId || supabaseConfig.anonKey) {
    form.set('client_id', supabaseConfig.clientId || supabaseConfig.anonKey);
  }

  const response = await fetch(`${supabaseConfig.url}/auth/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      apikey: supabaseConfig.anonKey || ''
    },
    body: form.toString()
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    await clearSession();
    cancelRefresh();
    broadcastAuthChanged(null);
    throw new Error(payload.error_description || payload.error || 'token refresh failed');
  }

  const updated = buildSessionFromPayload(payload);
  await saveSession(updated);
  scheduleRefresh(updated.expiresAt);
  broadcastAuthChanged(updated);
  return updated;
}

async function sendLogoutRequest(accessToken) {
  await fetch(`${supabaseConfig.url}/auth/v1/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: supabaseConfig.anonKey || '',
      'Content-Type': 'application/json'
    }
  });
}

function buildSessionFromPayload(payload) {
  return {
    accessToken: payload.access_token,
    refreshToken: payload.refresh_token,
    expiresAt: Date.now() + payload.expires_in * 1000,
    tokenType: payload.token_type,
    user: payload.user ?? null
  };
}

function sanitizeSession(session) {
  if (!session) {
    return null;
  }
  const sanitized = { ...session };
  delete sanitized.refreshToken;
  return sanitized;
}

function shouldRefresh(session) {
  return session.expiresAt - REFRESH_MARGIN_MS <= Date.now();
}

function scheduleRefresh(expiresAt) {
  if (!chrome.alarms || !chrome.alarms.create) {
    console.warn('[auth] chrome.alarms unavailable; skipping auto-refresh');
    return;
  }
  const triggerAt = expiresAt - REFRESH_MARGIN_MS;
  if (triggerAt <= Date.now()) {
    refreshSession().catch((error) => {
      console.error('[auth] immediate refresh failed', error);
    });
    return;
  }
  chrome.alarms.create(REFRESH_ALARM, { when: triggerAt });
}

function cancelRefresh() {
  if (chrome.alarms && chrome.alarms.clear) {
    chrome.alarms.clear(REFRESH_ALARM);
  }
}

function broadcastAuthChanged(session) {
  chrome.runtime.sendMessage(
    { type: 'auth:changed', payload: sanitizeSession(session) },
    () => void chrome.runtime.lastError
  );
}

async function parseJsonResponse(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch (error) {
    console.error('[auth] failed to parse response', error, text);
    return {};
  }
}
