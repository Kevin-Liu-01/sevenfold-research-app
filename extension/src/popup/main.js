import { queryPopupElements } from './dom/elements.js';
import { getState } from './state/store.js';
import { addTypedMessageListener } from './services/runtimeMessaging.js';
import { createAuthFeature } from './features/auth.js';
import { createProjectsFeature } from './features/projects.js';
import { createPdfMetadataFeature } from './features/pdfMetadata.js';

console.log('[popup] loaded');

document.addEventListener('DOMContentLoaded', () => {
  const elements = queryPopupElements();
  if (!elements) {
    return;
  }

  const {
    statusEl,
    loginButton,
    logoutButton,
    emailLoginButton,
    emailInput,
    passwordInput,
    signedOutView,
    signedInView,
    projectsSection
  } = elements;

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function updateUI() {
    const state = getState();
    if (!state.hasResolvedSession) {
      return;
    }

    const isAuthed = Boolean(state.currentSession && state.currentSession.accessToken);
    signedOutView.classList.toggle('hidden', isAuthed);
    signedInView.classList.toggle('hidden', !isAuthed);
    projectsSection.classList.toggle('hidden', !isAuthed);

    loginButton.disabled = isAuthed;
    emailLoginButton.disabled = isAuthed;
    emailInput.disabled = isAuthed;
    passwordInput.disabled = isAuthed;
    logoutButton.disabled = !isAuthed;

    metadataFeature.updatePdfStatusUI();
    metadataFeature.updateMetadataUI();
  }

  setStatus('Checking session…');
  loginButton.disabled = true;
  logoutButton.disabled = true;
  emailLoginButton.disabled = true;
  emailInput.disabled = true;
  passwordInput.disabled = true;

  signedOutView.classList.add('hidden');
  signedInView.classList.add('hidden');
  projectsSection.classList.add('hidden');

  const metadataFeature = createPdfMetadataFeature({ elements });
  metadataFeature.resetMetadataForm();

  const projectsFeature = createProjectsFeature({
    elements,
    updateMetadataUI: metadataFeature.updateMetadataUI
  });
  metadataFeature.setSyncProjectSelect(projectsFeature.syncProjectSelect);

  const authFeature = createAuthFeature({
    elements,
    setStatus,
    loadProjects: projectsFeature.loadProjects,
    loadPdfStatus: metadataFeature.loadPdfStatus,
    resetProjects: projectsFeature.resetProjects,
    resetPdfStatus: metadataFeature.resetPdfStatus,
    refreshUI: updateUI
  });

  metadataFeature.init();
  projectsFeature.init();
  authFeature.init();

  addTypedMessageListener('pdf:status-changed', (message) => {
    if (!message?.status) {
      return false;
    }
    metadataFeature.handlePdfStatusChange(message.status, message.tabId);
    return false;
  });

  addTypedMessageListener('auth:changed', (message) => {
    authFeature.handleAuthChanged(message?.payload || null);
    return false;
  });

  void authFeature.bootstrapSession();
});
