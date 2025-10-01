import { getState, setState } from '../state/store.js';
import { sendMessage } from '../services/runtimeMessaging.js';

export function createAuthFeature({
  elements,
  setStatus,
  loadProjects,
  loadPdfStatus,
  resetProjects,
  resetPdfStatus,
  refreshUI
}) {
  const {
    logoutButton,
    emailInput,
    passwordInput,
    emailLoginButton
  } = elements;

  const loadProjectsFn = typeof loadProjects === 'function' ? loadProjects : null;
  const loadPdfStatusFn = typeof loadPdfStatus === 'function' ? loadPdfStatus : null;
  const resetProjectsFn = typeof resetProjects === 'function' ? resetProjects : null;
  const resetPdfStatusFn = typeof resetPdfStatus === 'function' ? resetPdfStatus : null;
  const refreshUIFn = typeof refreshUI === 'function' ? refreshUI : null;

  function disableAuthControls() {
    logoutButton.disabled = true;
    emailLoginButton.disabled = true;
    emailInput.disabled = true;
    passwordInput.disabled = true;
  }

  function enableAuthInputs() {
    const { currentSession } = getState();
    const isAuthed = Boolean(currentSession && currentSession.accessToken);
    emailLoginButton.disabled = isAuthed;
    emailInput.disabled = isAuthed;
    passwordInput.disabled = isAuthed;
    logoutButton.disabled = !isAuthed;
  }

  async function handleEmailLogin() {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setStatus('Enter email and password to continue.');
      return;
    }

    disableAuthControls();
    setStatus('Signing in with email…');

    try {
      const response = await sendMessage({
        type: 'auth:loginPassword',
        email,
        password
      });

      if (!response?.ok) {
        throw new Error(response?.error || 'Login failed');
      }

      setState({
        currentSession: response.session,
        hasResolvedSession: true,
        projectsLoaded: false
      });

      setStatus('Ready to capture PDFs.');
      if (loadProjectsFn) {
        await loadProjectsFn();
      }
      if (loadPdfStatusFn) {
        await loadPdfStatusFn();
      }
    } catch (error) {
      console.error('[popup] email login error', error);
      setStatus(`Email login error: ${error.message}`);
    } finally {
      passwordInput.value = '';
      enableAuthInputs();
      refreshUIFn?.();
    }
  }

  async function handleLogout() {
    logoutButton.disabled = true;
    setStatus('Signing out…');

    try {
      const response = await sendMessage({ type: 'auth:logout' });
      if (!response?.ok) {
        throw new Error(response?.error || 'Logout failed');
      }

      setState({ currentSession: null, hasResolvedSession: true });
      setStatus('Signed out.');
      resetProjectsFn?.();
      resetPdfStatusFn?.();
    } catch (error) {
      console.error('[popup] logout error', error);
      setStatus(`Logout error: ${error.message}`);
    } finally {
      passwordInput.value = '';
      enableAuthInputs();
      refreshUIFn?.();
    }
  }

  async function bootstrapSession() {
    console.log('init');
    try {
      console.log('fetching session');
      const response = await sendMessage({ type: 'auth:getSession' });
      console.log('[popup] got session', response);
      if (response?.ok) {
        setState({ currentSession: response.session || null });
        if (response.session) {
          setStatus('Ready to capture PDFs.');
          if (loadProjectsFn) {
            await loadProjectsFn();
          }
          if (loadPdfStatusFn) {
            await loadPdfStatusFn();
          }
        } else {
          setStatus('Not signed in.');
        }
      } else {
        setStatus('Unable to fetch session. Sign in to continue.');
      }
    } catch (error) {
      console.error('[popup] init error', error);
      setStatus('Unable to reach background script.');
    } finally {
      setState({ hasResolvedSession: true });
      enableAuthInputs();
      refreshUIFn?.();
    }
  }

  function handleAuthChanged(session) {
    setState({ currentSession: session, hasResolvedSession: true });
    const isAuthed = Boolean(session && session.accessToken);

    if (isAuthed) {
      setStatus('Ready to capture PDFs.');
      if (loadProjectsFn) {
        void loadProjectsFn();
      }
      if (loadPdfStatusFn) {
        void loadPdfStatusFn();
      }
    } else {
      setStatus('Not signed in.');
      resetProjectsFn?.();
      resetPdfStatusFn?.();
    }

    enableAuthInputs();
    refreshUIFn?.();
  }

  function init() {
    emailLoginButton.addEventListener('click', handleEmailLogin);
    logoutButton.addEventListener('click', handleLogout);
  }

  return {
    init,
    bootstrapSession,
    handleAuthChanged,
    enableAuthInputs
  };
}
