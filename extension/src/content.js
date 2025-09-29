const PDF_STATUS_MESSAGE = 'pdf:status';
const MAX_NOTIFY_ATTEMPTS = 4;
const NOTIFY_RETRY_DELAY_MS = 500;
const ARXIV_HOST = 'arxiv.org';
const ARXIV_DOI_PREFIX = '10.48550/arXiv.';
const SHADOW_HOST_ID = 'sevenfold-shadow-root-host';
const SHADOW_STYLE_PATH = 'content/shadow-root.css';
const SHADOW_STYLE_ATTR = 'data-sevenfold-shadow-style';

const state = {
  isPdf: false,
  lastUrlNotified: null
};

let observer;
let urlCheckInterval;
let pendingDetection = false;
let lastKnownUrl = window.location.href;
let notifyRetryTimer = null;
let notifyAttempts = 0;
let lastNotifyPayload = null;
let shadowRootHost = null;
let shadowTemplatePromise = null;
let shadowMounted = false;
let shadowAppController = null;
let shadowAppModulePromise = null;

function loadShadowAppModule() {
  if (!shadowAppModulePromise) {
    try {
      const moduleUrl = chrome.runtime.getURL('content/shadowApp.js');
      if (!moduleUrl) {
        throw new Error('Unable to resolve shadow app module URL');
      }
      shadowAppModulePromise = import(moduleUrl).catch((error) => {
        shadowAppModulePromise = null;
        throw error;
      });
    } catch (error) {
      console.warn('[content] failed to resolve shadow app module', error);
      shadowAppModulePromise = Promise.reject(error);
      shadowAppModulePromise.catch(() => {
        shadowAppModulePromise = null;
      });
    }
  }
  return shadowAppModulePromise;
}

console.log('[content] script injected on', window.location.href);

init();

function init() {
  detectPdf();
  setupObservers();
}

function setupObservers() {
  observer = new MutationObserver(scheduleDetection);
  observer.observe(document, {
    childList: true,
    subtree: true
  });

  window.addEventListener('hashchange', detectPdf);
  window.addEventListener('popstate', detectPdf);
  window.addEventListener('pageshow', detectPdf);
  document.addEventListener('DOMContentLoaded', detectPdf, { once: true });

  urlCheckInterval = window.setInterval(() => {
    if (window.location.href !== lastKnownUrl) {
      lastKnownUrl = window.location.href;
      console.log('[content] URL change detected to', lastKnownUrl);
      detectPdf();
    }
  }, 1000);
}

function scheduleDetection() {
  if (pendingDetection) {
    return;
  }
  pendingDetection = true;
  window.setTimeout(() => {
    pendingDetection = false;
    detectPdf();
  }, 150);
}

function detectPdf() {
  const url = new URL(window.location.href);
  const pathname = url.pathname.toLowerCase();
  console.log('[content] checking for PDF at', url.href);

  const endsWithPdf = pathname.endsWith('.pdf') || pathname.endsWith('.pdf/');
  const contentTypePdf = (document.contentType || '').toLowerCase() === 'application/pdf';
  const hostRulePdf = url.hostname === ARXIV_HOST && pathname.startsWith('/pdf/');
  const embeddedPdf = hasEmbeddedPdf();

  const isPdf = Boolean(endsWithPdf || contentTypePdf || hostRulePdf || embeddedPdf);

  if (isPdf !== state.isPdf || window.location.href !== state.lastUrlNotified) {
    state.isPdf = isPdf;

    console.log('[content] PDF detected, displaying shadow root');
    handleShadowRootForPdf(isPdf);

    let doi = null;
    let arxivId = null;
    let source = null;

    if (isPdf) {
      if (url.hostname === ARXIV_HOST) {
        const arxivInfo = extractArxivInfo(url.pathname);
        if (arxivInfo) {
          ({ doi, arxivId } = arxivInfo);
          source = 'arxiv';
        }
      }
    }

    console.log('[content] notify background: isPdf=', isPdf, 'doi=', doi, 'arxivId=', arxivId);
    notifyBackground({
      isPdf,
      url: window.location.href,
      title: document.title || '',
      detectedAt: Date.now(),
      doi,
      arxivId,
      source
    });
  }
}

function hasEmbeddedPdf() {
  const selectors = [
    'embed[type="application/pdf"]',
    'object[type="application/pdf"]',
    'iframe[type="application/pdf"]'
  ];

  if (selectors.some((selector) => document.querySelector(selector))) {
    return true;
  }

  const frames = document.querySelectorAll('iframe');
  for (const frame of frames) {
    try {
      if (frame.contentDocument?.contentType?.toLowerCase() === 'application/pdf') {
        return true;
      }
    } catch {
      // Cross-origin frame, ignore.
    }
  }

  return false;
}

function notifyBackground(payload) {
  state.lastUrlNotified = payload.url;
  lastNotifyPayload = payload;
  notifyAttempts = 0;
  clearNotifyRetry();
  attemptNotifyBackground();
}

function attemptNotifyBackground() {
  if (!lastNotifyPayload) {
    return;
  }

  notifyAttempts += 1;

  sendMessageToBackground({
    type: PDF_STATUS_MESSAGE,
    payload: lastNotifyPayload
  })
    .then(() => {
      clearNotifyRetry();
    })
    .catch((error) => {
      console.warn('[content] failed to notify background', error);
      if (notifyAttempts < MAX_NOTIFY_ATTEMPTS) {
        scheduleNotifyRetry();
      } else {
        clearNotifyRetry();
      }
    });
}

function handleShadowRootForPdf(isPdf) {
  if (isPdf) {
    void mountShadowRoot();
  } else {
    removeShadowRoot();
  }
}

async function mountShadowRoot() {
  const host = ensureShadowHost();
  if (!host) {
    return;
  }

  if (shadowMounted && host.shadowRoot && host.shadowRoot.childElementCount) {
    return;
  }

  if (!host.shadowRoot) {
    host.attachShadow({ mode: 'open' });
  }

  try {
    const template = await loadShadowTemplate();
    host.shadowRoot.innerHTML = template;
    injectShadowStyles(host.shadowRoot);
    shadowAppController?.destroy();
    try {
      const module = await loadShadowAppModule();
      if (module?.initShadowApp) {
        shadowAppController = await module.initShadowApp(host.shadowRoot);
      }
    } catch (error) {
      console.warn('[content] failed to initialize shadow app', error);
    }
    shadowMounted = true;
  } catch (error) {
    console.warn('[content] failed to mount shadow root', error);
  }
}

function injectShadowStyles(root) {
  if (!root) {
    return;
  }

  const existingLink = root.querySelector(`link[rel="stylesheet"][${SHADOW_STYLE_ATTR}]`);
  if (existingLink) {
    return;
  }

  let styleUrl;
  try {
    styleUrl = chrome.runtime.getURL(SHADOW_STYLE_PATH);
  } catch (error) {
    console.warn('[content] failed to resolve shadow style URL', error);
    return;
  }

  if (!styleUrl) {
    console.warn('[content] shadow style URL unavailable');
    return;
  }

  const linkEl = document.createElement('link');
  linkEl.rel = 'stylesheet';
  linkEl.href = styleUrl;
  linkEl.setAttribute(SHADOW_STYLE_ATTR, 'true');

  try {
    if (root.firstChild) {
      root.insertBefore(linkEl, root.firstChild);
    } else {
      root.append(linkEl);
    }
  } catch (error) {
    console.warn('[content] failed to inject shadow styles', error);
  }
}

function removeShadowRoot() {
  if (shadowAppController) {
    try {
      shadowAppController.destroy();
    } catch (error) {
      console.warn('[content] failed to destroy shadow app', error);
    }
  }
  shadowAppController = null;

  if (shadowRootHost && shadowRootHost.isConnected && shadowRootHost.dataset.sevenfoldShadowHost === 'true') {
    shadowRootHost.remove();
  }
  shadowRootHost = null;
  shadowMounted = false;
}

function ensureShadowHost() {
  if (shadowRootHost && shadowRootHost.isConnected) {
    return shadowRootHost;
  }

  const existing = document.getElementById(SHADOW_HOST_ID);
  if (existing) {
    shadowRootHost = existing;
    return shadowRootHost;
  }

  const target = document.documentElement || document.body;
  if (!target) {
    return null;
  }

  const host = document.createElement('div');
  host.id = SHADOW_HOST_ID;
  host.dataset.sevenfoldShadowHost = 'true';
  target.append(host);
  shadowRootHost = host;
  return shadowRootHost;
}

function loadShadowTemplate() {
  if (!shadowTemplatePromise) {
    const resourceUrl = chrome.runtime.getURL('content/shadow-root.html');
    shadowTemplatePromise = fetch(resourceUrl).then((response) => {
      if (!response.ok) {
        throw new Error(`Failed to load shadow root template: ${response.status}`);
      }
      return response.text();
    });
  }
  return shadowTemplatePromise;
}

function scheduleNotifyRetry() {
  clearNotifyRetry();
  notifyRetryTimer = window.setTimeout(() => {
    attemptNotifyBackground();
  }, NOTIFY_RETRY_DELAY_MS * notifyAttempts);
}

function clearNotifyRetry() {
  if (notifyRetryTimer) {
    window.clearTimeout(notifyRetryTimer);
    notifyRetryTimer = null;
  }
}

function sendMessageToBackground(message) {
  return new Promise((resolve, reject) => {
    if (!chrome?.runtime) {
      reject(new Error('Extension runtime unavailable'));
      return;
    }

    try {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(response);
      });
    } catch (error) {
      reject(error);
    }
  });
}

function extractArxivInfo(pathname) {
  console.log('[content] extracting arXiv info from', pathname);
  const segments = pathname.split('/').filter(Boolean);
  if (!segments.length) {
    return null;
  }

  let candidate = segments[segments.length - 1];
  if (candidate.toLowerCase().endsWith('.pdf')) {
    candidate = candidate.slice(0, -4);
  }

  candidate = candidate.trim();
  if (!candidate) {
    return null;
  }

  const versionMatch = candidate.match(/^(.*?)(v\d+)$/i);
  if (versionMatch) {
    candidate = versionMatch[1] || candidate;
  }

  if (!candidate) {
    return null;
  }

  const doi = `${ARXIV_DOI_PREFIX}${candidate}`;
  return { arxivId: candidate, doi };
}

window.addEventListener('beforeunload', () => {
  observer?.disconnect();
  if (urlCheckInterval) {
    window.clearInterval(urlCheckInterval);
  }
  clearNotifyRetry();
  if (shadowAppController) {
    try {
      shadowAppController.destroy();
    } catch (error) {
      console.warn('[content] failed to destroy shadow app on unload', error);
    }
  }
});
