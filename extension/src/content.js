const PDF_STATUS_MESSAGE = 'pdf:status';
const MAX_NOTIFY_ATTEMPTS = 4;
const NOTIFY_RETRY_DELAY_MS = 500;
const ARXIV_HOST = 'arxiv.org';
const ARXIV_DOI_PREFIX = '10.48550/arXiv.';

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

  const endsWithPdf = pathname.endsWith('.pdf') || pathname.endsWith('.pdf/');
  const contentTypePdf = (document.contentType || '').toLowerCase() === 'application/pdf';
  const hostRulePdf = url.hostname === ARXIV_HOST && pathname.startsWith('/pdf/');
  const embeddedPdf = hasEmbeddedPdf();

  const isPdf = Boolean(endsWithPdf || contentTypePdf || hostRulePdf || embeddedPdf);

  if (isPdf !== state.isPdf || window.location.href !== state.lastUrlNotified) {
    state.isPdf = isPdf;

    let doi = null;
    let arxivId = null;
    let source = null;

    if (isPdf) {
      const arxivInfo = extractArxivInfo(url.pathname);
      if (arxivInfo) {
        ({ doi, arxivId } = arxivInfo);
        source = 'arxiv';
      }
    }

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
});
