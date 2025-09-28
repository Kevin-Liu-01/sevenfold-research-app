const popupElementIds = {
  statusEl: 'status',
  loginButton: 'login-button',
  logoutButton: 'logout-button',
  emailInput: 'email-input',
  passwordInput: 'password-input',
  emailLoginButton: 'email-login-button',
  signedOutView: 'signed-out-view',
  signedInView: 'signed-in-view'
};

const shadowElementIds = {
  statusEl: 'status',
  panelRoot: 'panel-root',
  panelCloseButton: 'panel-close',
  panelToggleButton: 'panel-toggle',
  projectsSection: 'projects-section',
  projectsList: 'projects-list',
  projectsEmpty: 'projects-empty',
  projectsLoadingEl: 'projects-loading',
  projectsErrorEl: 'projects-error',
  projectSelect: 'project-select',
  pdfStatusSection: 'pdf-status-section',
  pdfStatusPill: 'pdf-status-pill',
  pdfStatusMessage: 'pdf-status-message',
  metadataSection: 'metadata-section',
  metadataStatusEl: 'metadata-status',
  metadataSubmitButton: 'metadata-submit',
  metadataSourceEl: 'metadata-source'
};

function lookupById(root, id) {
  if (!root) {
    return null;
  }

  if (typeof root.getElementById === 'function') {
    return root.getElementById(id);
  }

  if (typeof root.querySelector === 'function') {
    const safeId = typeof CSS !== 'undefined' && typeof CSS.escape === 'function' ? CSS.escape(id) : id;
    return root.querySelector(`#${safeId}`);
  }

  return null;
}

function collectElements(root, idMap, contextLabel) {
  const elements = {};
  const missing = [];

  for (const [key, id] of Object.entries(idMap)) {
    const node = lookupById(root, id);
    if (!node) {
      missing.push(id);
    }
    elements[key] = node || null;
  }

  if (missing.length) {
    console.error(`[ui] missing ${contextLabel} elements`, missing);
    return null;
  }

  return elements;
}

export function queryPopupElements(root = document) {
  return collectElements(root, popupElementIds, 'popup');
}

export function queryShadowElements(root = document) {
  return collectElements(root, shadowElementIds, 'shadow');
}

export function getPopupElementIds() {
  return { ...popupElementIds };
}

export function getShadowElementIds() {
  return { ...shadowElementIds };
}
