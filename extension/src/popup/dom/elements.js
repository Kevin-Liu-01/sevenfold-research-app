const elementIds = {
  statusEl: 'status',
  loginButton: 'login-button',
  logoutButton: 'logout-button',
  emailInput: 'email-input',
  passwordInput: 'password-input',
  emailLoginButton: 'email-login-button',
  signedOutView: 'signed-out-view',
  signedInView: 'signed-in-view',
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
  metadataForm: 'metadata-form',
  metadataTitleInput: 'metadata-title',
  metadataAbstractInput: 'metadata-abstract',
  metadataAuthorsInput: 'metadata-authors',
  metadataYearInput: 'metadata-year',
  metadataMonthInput: 'metadata-month',
  metadataDayInput: 'metadata-day',
  metadataDoiInput: 'metadata-doi',
  metadataCategoryInput: 'metadata-category',
  metadataStatusEl: 'metadata-status',
  metadataSubmitButton: 'metadata-submit',
  metadataSourceEl: 'metadata-source'
};

export function queryPopupElements() {
  const elements = {};
  const missing = [];

  for (const [key, id] of Object.entries(elementIds)) {
    const node = document.getElementById(id);
    if (!node) {
      missing.push(id);
    }
    elements[key] = node;
  }

  if (missing.length) {
    console.error('[popup] missing elements', missing);
    return null;
  }

  return elements;
}

export function getElementIds() {
  return { ...elementIds };
}
