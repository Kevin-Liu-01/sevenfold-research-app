import { supabaseConfig, apiConfig } from './config.js';
import { supabase } from './background/supabaseClient.js';

const REFRESH_MARGIN_MS = 2 * 60 * 1000;
const OAUTH_SCOPES = 'openid email profile';
const PDF_STATUS_MESSAGE = 'pdf:status';
const PDF_STATUS_CHANGED_MESSAGE = 'pdf:status-changed';
const UPLOAD_REQUEST_MESSAGE = 'upload:request';
const UPLOAD_RESULT_MESSAGE = 'upload:result';
const UPLOAD_ERROR_MESSAGE = 'upload:error';

const pdfStatusByTab = new Map();

console.log('[background] service worker loaded');

chrome.runtime.onInstalled.addListener(() => {
  console.log('[background] extension installed');
});

bootstrapSession().catch((error) => {
  console.error('[auth] bootstrap failed', error);
});

supabase.auth.onAuthStateChange((_event, session) => {
  broadcastAuthChanged(normalizeSession(session));
});

if (chrome.tabs && chrome.tabs.onRemoved) {
  chrome.tabs.onRemoved.addListener((tabId) => {
    pdfStatusByTab.delete(tabId);
  });
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.type) {
    return undefined;
  }

  if (message.type === 'auth:login') {
    handleLogin(message.provider)
      .then((session) => {
        sendResponse({ ok: true, session });
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
        sendResponse({ ok: true, session });
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

  if (message.type === PDF_STATUS_MESSAGE) {
    handlePdfStatus(message.payload, sender);
    sendResponse({ ok: true });
    return false;
  }

  if (message.type === 'pdf:getStatus') {
    handleGetPdfStatus(message.tabId)
      .then((status) => sendResponse({ ok: true, ...status }))
      .catch((error) => {
        console.error('[pdf] getStatus failed', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  if (message.type === UPLOAD_REQUEST_MESSAGE) {
    handleUploadRequest(message.payload, sender?.tab?.id ?? null)
      .then((result) => {
        sendResponse({ ok: true, result });
      })
      .catch((error) => {
        console.error('[upload] request failed', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'projects:list') {
    handleProjectsListWithDefault()
      .then((result) => {
        sendResponse({ ok: true, ...result });
      })
      .catch((error) => {
        console.error('[projects] fetch failed', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  if (message.type === 'projects:setDefault') {
    handleSetDefaultProject(message.projectId)
      .then(() => sendResponse({ ok: true }))
      .catch((error) => {
        console.error('[projects] set default failed', error);
        sendResponse({ ok: false, error: error.message });
      });
    return true;
  }

  return undefined;
});

async function bootstrapSession() {
  try {
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      throw error;
    }

    let session = data.session;
    if (shouldRefresh(session)) {
      const refreshed = await supabase.auth.refreshSession();
      if (refreshed.error) {
        throw refreshed.error;
      }
      session = refreshed.data.session;
    }

    broadcastAuthChanged(normalizeSession(session));
  } catch (error) {
    console.error('[auth] bootstrap session failed', error);
  }
}

async function handleLogin(requestedProvider) {
  const provider = requestedProvider || supabaseConfig.defaultProvider;
  if (!provider) {
    throw new Error('auth provider not configured');
  }

  const redirectTo = chrome.identity.getRedirectURL('supabase');

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      scopes: OAUTH_SCOPES
    }
  });

  if (error) {
    throw error;
  }

  if (!data?.url) {
    throw new Error('unable to start OAuth flow');
  }

  const redirectResponse = await chrome.identity.launchWebAuthFlow({
    url: data.url,
    interactive: true
  });

  const { code, error: redirectError, errorDescription } = parseAuthRedirect(redirectResponse);
  if (redirectError) {
    throw new Error(errorDescription || redirectError);
  }
  if (!code) {
    throw new Error('authorization code missing');
  }

  const exchange = await supabase.auth.exchangeCodeForSession(code);
  if (exchange.error) {
    throw exchange.error;
  }

  const session = normalizeSession(exchange.data.session);
  broadcastAuthChanged(session);
  return session;
}

async function handlePasswordLogin(email, password) {
  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw error;
  }

  const session = normalizeSession(data.session);
  broadcastAuthChanged(session);
  return session;
}

async function handleGetSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  let session = data.session;
  if (shouldRefresh(session)) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) {
      throw refreshed.error;
    }
    session = refreshed.data.session;
  }

  return normalizeSession(session);
}

async function handleLogout() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }

  broadcastAuthChanged(null);
}

async function handleListProjects() {
  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data ?? [];
}

async function handleProjectsListWithDefault() {
  const projects = await handleListProjects();
  const defaultProjectId = await getDefaultProjectId();
  return { projects, defaultProjectId };
}

function handlePdfStatus(payload, sender) {
  const tabId = sender?.tab?.id;
  if (typeof tabId !== 'number') {
    return;
  }

  const status = {
    isPdf: Boolean(payload?.isPdf),
    url: typeof payload?.url === 'string' ? payload.url : null,
    title: typeof payload?.title === 'string' ? payload.title : '',
    detectedAt: payload?.detectedAt ?? Date.now()
  };

  pdfStatusByTab.set(tabId, status);

  chrome.runtime.sendMessage(
    { type: PDF_STATUS_CHANGED_MESSAGE, tabId, status },
    () => void chrome.runtime.lastError
  );
}

async function handleGetPdfStatus(requestedTabId) {
  let tabId = typeof requestedTabId === 'number' ? requestedTabId : null;

  if (tabId == null && chrome.tabs?.query) {
    const [activeTab] = await chrome.tabs.query({ active: true, lastFocusedWindow: true });
    if (activeTab && typeof activeTab.id === 'number') {
      tabId = activeTab.id;
    }
  }

  const status =
    tabId != null ? pdfStatusByTab.get(tabId) ?? { isPdf: false, url: null, title: '' } : null;
  const defaultProjectId = await getDefaultProjectId();
  return { tabId, status, defaultProjectId };
}

async function handleUploadRequest(payload, senderTabId) {
  try {
    if (!payload || typeof payload.url !== 'string' || !payload.url) {
      throw new Error('Missing PDF URL to upload');
    }

    const session = await handleGetSession();
    if (!session || !session.accessToken) {
      throw new Error('Sign in to upload PDFs');
    }

    const projectId = await resolveProjectId(payload.projectId);
    if (!projectId) {
      throw new Error('No project available. Create a project in Harbor first.');
    }

    const blob = await fetchPdfBlob(payload.url);

    const uploadUrl = buildUploadUrl();
    console.log('[upload] uploading to', uploadUrl);
    const formData = new FormData();
    formData.append('file', blob, deriveFileNameFromUrl(payload.url));
    formData.append('project_id', projectId);
    formData.append('paper_type', payload.paperType || 'source');

    const metadata = normalizeMetadata(payload.metadata);
    formData.append('metadata_json', JSON.stringify(metadata));

    const response = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.accessToken}`
      },
      body: formData
    });

    const responseBody = await parseJsonSafe(response);
    if (!response.ok) {
      const message = responseBody?.detail || responseBody?.error || response.statusText;
      throw new Error(message || 'Upload failed');
    }

    notifyUploadResult(senderTabId, responseBody || {});
    return responseBody;
  } catch (error) {
    notifyUploadError(senderTabId, error);
    throw error;
  }
}

async function handleSetDefaultProject(projectId) {
  if (projectId) {
    await chrome.storage.local.set({ defaultProjectId: projectId });
  } else {
    await chrome.storage.local.remove('defaultProjectId');
  }
}

async function getDefaultProjectId() {
  const stored = await chrome.storage.local.get('defaultProjectId');
  if (stored?.defaultProjectId) {
    return stored.defaultProjectId;
  }

  const projects = await handleListProjects();
  const firstProjectId = projects?.[0]?.id ?? null;
  if (firstProjectId) {
    await chrome.storage.local.set({ defaultProjectId: firstProjectId });
  }
  return firstProjectId;
}

async function resolveProjectId(requestedProjectId) {
  if (requestedProjectId) {
    await chrome.storage.local.set({ defaultProjectId: requestedProjectId });
    return requestedProjectId;
  }
  return await getDefaultProjectId();
}

async function fetchPdfBlob(url) {
  const response = await fetch(url, { credentials: 'include' });
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF (${response.status})`);
  }
  return await response.blob();
}

function buildUploadUrl() {
  if (!apiConfig?.baseUrl) {
    throw new Error('API base URL not configured');
  }

  const base = apiConfig.baseUrl.endsWith('/')
    ? apiConfig.baseUrl.slice(0, -1)
    : apiConfig.baseUrl;
  const path = apiConfig.uploadPath || '/upload-pdf';
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
}

function deriveFileNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const segments = parsed.pathname.split('/').filter(Boolean);
    if (!segments.length) {
      return 'document.pdf';
    }
    const last = segments[segments.length - 1];
    if (last.toLowerCase().endsWith('.pdf')) {
      return decodeURIComponent(last);
    }
    return `${decodeURIComponent(last)}.pdf`;
  } catch {
    return 'document.pdf';
  }
}

function normalizeMetadata(rawMetadata) {
  if (!rawMetadata || typeof rawMetadata !== 'object') {
    throw new Error('Metadata is required. Fill out the form in the extension popup.');
  }

  const title = (rawMetadata.title || '').trim();
  if (!title) {
    throw new Error('Title is required.');
  }

  const abstract = sanitizeNullableString(rawMetadata.abstract);
  const authors = Array.isArray(rawMetadata.authors)
    ? rawMetadata.authors
        .map((author) => (typeof author === 'string' ? author.trim() : ''))
        .filter(Boolean)
    : [];

  const year = sanitizeNullableInteger(rawMetadata.year, 0, 5000, 'Year must be a positive number.');
  const month = sanitizeNullableInteger(rawMetadata.month, 1, 12, 'Month must be between 1 and 12.');
  const day = sanitizeNullableInteger(rawMetadata.day, 1, 31, 'Day must be between 1 and 31.');

  return {
    title,
    abstract,
    authors,
    year,
    month,
    day,
    doi: sanitizeNullableString(rawMetadata.doi),
    category: sanitizeNullableString(rawMetadata.category)
  };
}

function sanitizeNullableString(value) {
  if (value == null) {
    return null;
  }
  const trimmed = String(value).trim();
  return trimmed ? trimmed : null;
}

function sanitizeNullableInteger(value, min, max, errorMessage) {
  if (value == null || value === '') {
    return null;
  }
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(errorMessage);
  }
  if (typeof min === 'number' && parsed < min) {
    throw new Error(errorMessage);
  }
  if (typeof max === 'number' && parsed > max) {
    throw new Error(errorMessage);
  }
  return parsed;
}

function notifyUploadResult(tabId, payload) {
  if (typeof tabId !== 'number' || !chrome.tabs?.sendMessage) {
    return;
  }
  chrome.tabs.sendMessage(
    tabId,
    { type: UPLOAD_RESULT_MESSAGE, payload },
    () => void chrome.runtime.lastError
  );
}

function notifyUploadError(tabId, error) {
  if (typeof tabId !== 'number' || !chrome.tabs?.sendMessage) {
    return;
  }
  chrome.tabs.sendMessage(
    tabId,
    { type: UPLOAD_ERROR_MESSAGE, error: error?.message || String(error) },
    () => void chrome.runtime.lastError
  );
}

async function parseJsonSafe(response) {
  try {
    const text = await response.text();
    return text ? JSON.parse(text) : {};
  } catch {
    return {};
  }
}

function shouldRefresh(session) {
  if (!session) {
    return false;
  }

  const expiresAt = session.expires_at
    ? session.expires_at * 1000
    : session.expires_in
      ? Date.now() + session.expires_in * 1000
      : null;

  if (!expiresAt) {
    return false;
  }

  return expiresAt - REFRESH_MARGIN_MS <= Date.now();
}

function normalizeSession(session) {
  if (!session) {
    return null;
  }

  const expiresAt = session.expires_at
    ? session.expires_at * 1000
    : session.expires_in
      ? Date.now() + session.expires_in * 1000
      : null;

  return {
    accessToken: session.access_token,
    tokenType: session.token_type,
    expiresAt,
    user: session.user ?? null
  };
}

function broadcastAuthChanged(session) {
  chrome.runtime.sendMessage(
    { type: 'auth:changed', payload: session },
    () => void chrome.runtime.lastError
  );
}

function parseAuthRedirect(redirectUrl) {
  const url = new URL(redirectUrl);
  const query = url.search ? new URLSearchParams(url.search.substring(1)) : new URLSearchParams();
  const hash = url.hash ? new URLSearchParams(url.hash.substring(1)) : new URLSearchParams();

  const code = query.get('code') || hash.get('code');
  const error = query.get('error') || hash.get('error');
  const errorDescription =
    query.get('error_description') || hash.get('error_description') || hash.get('errorDescription');

  return { code, error, errorDescription };
}
