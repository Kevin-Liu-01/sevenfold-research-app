import { queryPopupElements } from './dom/elements.js';
import { getState } from './state/store.js';
import { addTypedMessageListener } from './services/runtimeMessaging.js';
import { createAuthFeature } from './features/auth.js';

console.log('[popup] loaded');

document.addEventListener('DOMContentLoaded', () => {
  const elements = queryPopupElements();
  if (!elements) {
    return;
  }

  const {
    statusEl,
    logoutButton,
    emailLoginButton,
    emailInput,
    passwordInput,
    signedOutView,
    signedInView
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

    emailLoginButton.disabled = isAuthed;
    emailInput.disabled = isAuthed;
    passwordInput.disabled = isAuthed;
    logoutButton.disabled = !isAuthed;
  }

  setStatus('Checking session…');
  logoutButton.disabled = true;
  emailLoginButton.disabled = true;
  emailInput.disabled = true;
  passwordInput.disabled = true;

  signedOutView.classList.add('hidden');
  signedInView.classList.add('hidden');

  const authFeature = createAuthFeature({
    elements,
    setStatus,
    refreshUI: updateUI
  });

  authFeature.init();

  addTypedMessageListener('auth:changed', (message) => {
    authFeature.handleAuthChanged(message?.payload || null);
    return false;
  });

  void authFeature.bootstrapSession();
});
