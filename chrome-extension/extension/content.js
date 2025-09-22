const PDF_STATUS_MESSAGE = 'pdf:status';
const UPLOAD_REQUEST_MESSAGE = 'upload:request';
const UPLOAD_RESULT_MESSAGE = 'upload:result';
const UPLOAD_ERROR_MESSAGE = 'upload:error';
const CTA_HOST_ID = 'harbor-pdf-cta-host';

const state = {
  isPdf: false,
  lastUrlNotified: null,
  lastPdfUrl: null,
  isUploading: false,
  uploadSucceeded: false,
  uploadError: null
};

let ctaHost;
let shadowRoot;
let formEl;
let statusEl;
let submitButton;
let titleInput;
let abstractInput;
let authorsInput;
let yearInput;
let monthInput;
let dayInput;
let doiInput;
let categoryInput;
let formSubmitHandler = null;
let observer;
let urlCheckInterval;
let pendingDetection = false;
let lastKnownUrl = window.location.href;

console.log('[content] script injected on', window.location.href);

init();

function init() {
  ensureUi();
  detectPdf();
  setupObservers();
  chrome.runtime.onMessage.addListener(handleBackgroundMessage);
}

function ensureUi() {
  if (ctaHost) {
    return;
  }

  ctaHost = document.createElement('div');
  ctaHost.id = CTA_HOST_ID;
  ctaHost.style.position = 'fixed';
  ctaHost.style.bottom = '24px';
  ctaHost.style.right = '24px';
  ctaHost.style.zIndex = '2147483647';
  ctaHost.style.pointerEvents = 'none';
  ctaHost.style.width = '320px';
  ctaHost.style.maxWidth = 'calc(100vw - 32px)';
  ctaHost.style.display = 'none';

  shadowRoot = ctaHost.attachShadow({ mode: 'open' });
  shadowRoot.innerHTML = `
    <style>
      :host {
        all: initial;
      }

      .panel {
        pointer-events: auto;
        background: rgba(15, 23, 42, 0.96);
        color: #f8fafc;
        border-radius: 14px;
        box-shadow: 0 14px 40px rgba(15, 23, 42, 0.45);
        padding: 18px;
        font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        display: grid;
        gap: 12px;
        border: 1px solid rgba(148, 163, 184, 0.35);
      }

      .panel h2 {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        line-height: 1.4;
      }

      .panel p.description {
        margin: 0;
        font-size: 14px;
        color: #cbd5f5;
      }

      form {
        display: grid;
        gap: 10px;
      }

      label {
        display: grid;
        gap: 4px;
        font-size: 13px;
      }

      input,
      textarea {
        font-family: inherit;
        font-size: 13px;
        border-radius: 8px;
        border: 1px solid rgba(148, 163, 184, 0.5);
        background: rgba(15, 23, 42, 0.35);
        color: #f8fafc;
        padding: 8px 10px;
      }

      textarea {
        resize: vertical;
        min-height: 60px;
      }

      input:focus,
      textarea:focus {
        outline: 2px solid rgba(56, 189, 248, 0.6);
        border-color: rgba(56, 189, 248, 0.9);
      }

      .row {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .actions {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
      }

      button[type='submit'] {
        all: unset;
        cursor: pointer;
        padding: 10px 16px;
        border-radius: 10px;
        background: #38bdf8;
        color: #0f172a;
        font-weight: 600;
        text-align: center;
      }

      button[type='submit']:hover:not(:disabled) {
        background: #22d3ee;
      }

      button[type='submit']:disabled {
        cursor: not-allowed;
        opacity: 0.6;
      }

      .status-message {
        font-size: 13px;
        margin: 0;
        color: #cbd5f5;
      }

      .status-message.success {
        color: #4ade80;
      }

      .status-message.error {
        color: #f87171;
      }
    </style>
    <div class="panel">
      <div>
        <h2>Add this PDF to Harbor</h2>
        <p class="description">Provide metadata so Harbor can index your paper.</p>
      </div>
      <form id="metadata-form">
        <label>
          Title <span style="color:#f87171">*</span>
          <input id="pdf-title" name="title" type="text" required autocomplete="off" />
        </label>
        <label>
          Abstract
          <textarea id="pdf-abstract" name="abstract" placeholder="Optional summary"></textarea>
        </label>
        <label>
          Authors
          <textarea id="pdf-authors" name="authors" placeholder="One author per line"></textarea>
        </label>
        <div class="row">
          <label>
            Year
            <input id="pdf-year" name="year" type="number" inputmode="numeric" min="0" />
          </label>
          <label>
            Month
            <input id="pdf-month" name="month" type="number" inputmode="numeric" min="1" max="12" />
          </label>
          <label>
            Day
            <input id="pdf-day" name="day" type="number" inputmode="numeric" min="1" max="31" />
          </label>
        </div>
        <label>
          DOI
          <input id="pdf-doi" name="doi" type="text" autocomplete="off" />
        </label>
        <label>
          Category
          <input id="pdf-category" name="category" type="text" autocomplete="off" />
        </label>
        <div class="actions">
          <p id="cta-status" class="status-message"></p>
          <button type="submit" id="cta-submit">Upload PDF</button>
        </div>
      </form>
    </div>
  `;

  formEl = shadowRoot.getElementById('metadata-form');
  statusEl = shadowRoot.getElementById('cta-status');
  submitButton = shadowRoot.getElementById('cta-submit');
  titleInput = shadowRoot.getElementById('pdf-title');
  abstractInput = shadowRoot.getElementById('pdf-abstract');
  authorsInput = shadowRoot.getElementById('pdf-authors');
  yearInput = shadowRoot.getElementById('pdf-year');
  monthInput = shadowRoot.getElementById('pdf-month');
  dayInput = shadowRoot.getElementById('pdf-day');
  doiInput = shadowRoot.getElementById('pdf-doi');
  categoryInput = shadowRoot.getElementById('pdf-category');

  if (formEl) {
    formSubmitHandler = (event) => {
      event.preventDefault();
      if (!state.isPdf || state.isUploading) {
        return;
      }
      startUpload();
    };

    formEl.addEventListener('submit', formSubmitHandler);
  }

  document.documentElement.append(ctaHost);
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
  const hostRulePdf = url.hostname === 'arxiv.org' && pathname.startsWith('/pdf/');
  const embeddedPdf = hasEmbeddedPdf();

  const isPdf = Boolean(endsWithPdf || contentTypePdf || hostRulePdf || embeddedPdf);

  if (isPdf !== state.isPdf || window.location.href !== state.lastUrlNotified) {
    state.isPdf = isPdf;
    if (isPdf && state.lastPdfUrl !== window.location.href) {
      state.lastPdfUrl = window.location.href;
      resetForm();
      setTitlePlaceholder();
    }
    if (!isPdf) {
      state.lastPdfUrl = null;
      resetForm();
    }
    state.uploadSucceeded = false;
    state.uploadError = null;
    updateUi();
    notifyBackground();
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
      // cross-origin access blocked; ignore
    }
  }

  return false;
}

function notifyBackground() {
  const payload = {
    isPdf: state.isPdf,
    url: window.location.href,
    title: document.title || '',
    detectedAt: Date.now()
  };

  state.lastUrlNotified = payload.url;

  sendMessageToBackground({
    type: PDF_STATUS_MESSAGE,
    payload
  }).catch((error) => {
    console.warn('[content] failed to notify background', error);
  });
}

async function startUpload() {
  const metadata = readMetadataFromForm();
  if (!metadata.ok) {
    showStatus(metadata.error ?? 'Please fill in the required fields.', 'error');
    return;
  }

  state.isUploading = true;
  state.uploadError = null;
  state.uploadSucceeded = false;
  updateUi();

  try {
    const response = await sendMessageToBackground({
      type: UPLOAD_REQUEST_MESSAGE,
      payload: {
        url: window.location.href,
        metadata: metadata.value
      }
    });

    if (!response?.ok) {
      state.uploadError = response?.error || 'Unable to upload PDF.';
      updateUi();
      return;
    }

    state.uploadSucceeded = true;
    showStatus('Upload complete! You can close this tab or keep browsing.', 'success');
  } catch (error) {
    state.uploadError = error?.message || 'Unable to reach Harbor background script.';
  } finally {
    state.isUploading = false;
    updateUi();
  }
}

function readMetadataFromForm() {
  if (!titleInput) {
    return { ok: false, error: 'Unable to read metadata inputs.' };
  }

  const title = (titleInput.value || '').trim();
  if (!title) {
    titleInput.focus();
    return { ok: false, error: 'Title is required.' };
  }

  const abstract = (abstractInput?.value || '').trim();

  const authorsRaw = (authorsInput?.value || '')
    .split(/\n|,/)
    .map((author) => author.trim())
    .filter(Boolean);

  const year = parseInteger(yearInput?.value, 0, 5000);
  if (yearInput?.value && year === null) {
    yearInput.focus();
    return { ok: false, error: 'Year must be a positive number.' };
  }

  const month = parseInteger(monthInput?.value, 1, 12);
  if (monthInput?.value && month === null) {
    monthInput.focus();
    return { ok: false, error: 'Month must be between 1 and 12.' };
  }

  const day = parseInteger(dayInput?.value, 1, 31);
  if (dayInput?.value && day === null) {
    dayInput.focus();
    return { ok: false, error: 'Day must be between 1 and 31.' };
  }

  const metadata = {
    title,
    abstract: abstract || null,
    authors: authorsRaw,
    year,
    month,
    day,
    doi: (doiInput?.value || '').trim() || null,
    category: (categoryInput?.value || '').trim() || null
  };

  return { ok: true, value: metadata };
}

function parseInteger(value, min, max) {
  if (!value) {
    return null;
  }
  const parsed = Number.parseInt(String(value), 10);
  if (Number.isNaN(parsed)) {
    return null;
  }
  if (typeof min === 'number' && parsed < min) {
    return null;
  }
  if (typeof max === 'number' && parsed > max) {
    return null;
  }
  return parsed;
}

function updateUi() {
  if (!ctaHost || !formEl || !submitButton || !statusEl) {
    return;
  }

  if (!state.isPdf) {
    ctaHost.style.display = 'none';
    return;
  }

  ctaHost.style.display = 'block';

  if (state.isUploading) {
    setFormDisabled(true);
    showStatus('Uploading PDF to Harbor…', 'info');
    submitButton.textContent = 'Uploading…';
    submitButton.disabled = true;
    return;
  }

  setFormDisabled(false);
  submitButton.disabled = false;
  submitButton.textContent = state.uploadSucceeded ? 'Uploaded' : 'Upload PDF';

  if (state.uploadSucceeded) {
    setFormDisabled(true);
    showStatus('Upload complete! You can close this tab or keep browsing.', 'success');
    submitButton.disabled = true;
    return;
  }

  if (state.uploadError) {
    showStatus(state.uploadError, 'error');
    return;
  }

  showStatus('Fill in metadata and submit to store this PDF.', 'info');
}

function showStatus(message, tone) {
  if (!statusEl) {
    return;
  }
  statusEl.textContent = message || '';
  statusEl.className = 'status-message';
  if (tone === 'success') {
    statusEl.classList.add('success');
  } else if (tone === 'error') {
    statusEl.classList.add('error');
  }
}

function setFormDisabled(disabled) {
  if (!formEl) {
    return;
  }
  const controls = formEl.querySelectorAll('input, textarea');
  for (const control of controls) {
    control.disabled = disabled;
  }
}

function resetForm() {
  if (!formEl) {
    return;
  }
  formEl.reset();
  state.isUploading = false;
  state.uploadSucceeded = false;
  state.uploadError = null;
  showStatus('', 'info');
}

function setTitlePlaceholder() {
  if (!titleInput) {
    return;
  }
  const docTitle = (document.title || '').trim();
  if (docTitle) {
    titleInput.placeholder = docTitle;
  } else {
    titleInput.placeholder = 'Enter the paper title';
  }
}

function handleBackgroundMessage(message) {
  if (!message || typeof message !== 'object') {
    return;
  }

  if (message.type === UPLOAD_RESULT_MESSAGE) {
    state.uploadSucceeded = true;
    state.uploadError = null;
    state.isUploading = false;
    updateUi();
    return;
  }

  if (message.type === UPLOAD_ERROR_MESSAGE) {
    state.uploadSucceeded = false;
    state.uploadError = message.error || 'Upload failed.';
    state.isUploading = false;
    updateUi();
  }
}

window.addEventListener('beforeunload', cleanup);

function cleanup() {
  observer?.disconnect();
  if (urlCheckInterval) {
    window.clearInterval(urlCheckInterval);
  }
  chrome.runtime.onMessage.removeListener(handleBackgroundMessage);
  if (formEl && formSubmitHandler) {
    formEl.removeEventListener('submit', formSubmitHandler);
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
