console.log('[popup] loaded');

document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const emailLoginButton = document.getElementById('email-login-button');

  if (!statusEl || !loginButton || !logoutButton || !emailInput || !passwordInput || !emailLoginButton) {
    return;
  }

  let currentSession = null;
  setStatus('Checking session…');
  loginButton.disabled = true;
  logoutButton.disabled = true;
  emailLoginButton.disabled = true;
  emailInput.disabled = true;
  passwordInput.disabled = true;

  init();

  // Listen for session updates broadcast by the background worker.
  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== 'auth:changed') {
      return;
    }
    currentSession = message.payload;
    updateUI();
  });

  loginButton.addEventListener('click', async () => {
    loginButton.disabled = true;
    setStatus('Opening Supabase login…');
    try {
      const response = await sendMessage({ type: 'auth:login' });
      if (!response?.ok) {
        throw new Error(response?.error || 'Login failed');
      }
      currentSession = response.session;
      setStatus('Signed in. Ready to upload PDFs.');
    } catch (error) {
      console.error('[popup] login error', error);
      setStatus(`Login error: ${error.message}`);
    } finally {
      updateUI();
    }
  });

  emailLoginButton.addEventListener('click', async () => {
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    if (!email || !password) {
      setStatus('Enter email and password to continue.');
      return;
    }

    emailLoginButton.disabled = true;
    loginButton.disabled = true;
    logoutButton.disabled = true;
    emailInput.disabled = true;
    passwordInput.disabled = true;
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
      currentSession = response.session;
      setStatus('Signed in. Ready to upload PDFs.');
    } catch (error) {
      console.error('[popup] email login error', error);
      setStatus(`Email login error: ${error.message}`);
    } finally {
      passwordInput.value = '';
      updateUI();
    }
  });

  logoutButton.addEventListener('click', async () => {
    logoutButton.disabled = true;
    setStatus('Signing out…');
    try {
      const response = await sendMessage({ type: 'auth:logout' });
      if (!response?.ok) {
        throw new Error(response?.error || 'Logout failed');
      }
      currentSession = null;
      setStatus('Signed out.');
    } catch (error) {
      console.error('[popup] logout error', error);
      setStatus(`Logout error: ${error.message}`);
    } finally {
      updateUI();
    }
  });

  // Bootstrap the popup with the current session (if any).
  async function init() {
    try {
      const response = await sendMessage({ type: 'auth:getSession' });
      if (response?.ok) {
        currentSession = response.session || null;
        if (currentSession) {
          setStatus('Signed in. Ready to upload PDFs.');
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
      updateUI();
    }
  }

  // Enable/disable controls based on whether the user is authenticated.
  function updateUI() {
    const isAuthed = Boolean(currentSession && currentSession.accessToken);
    loginButton.disabled = isAuthed;
    logoutButton.disabled = !isAuthed;
    emailLoginButton.disabled = isAuthed;
    emailInput.disabled = isAuthed;
    passwordInput.disabled = isAuthed;
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }
});

// Small helper to call background scripts with promise semantics.
function sendMessage(message) {
  return new Promise((resolve, reject) => {
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
