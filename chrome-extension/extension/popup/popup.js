console.log('[popup] loaded');

document.addEventListener('DOMContentLoaded', () => {
  const statusEl = document.getElementById('status');
  const loginButton = document.getElementById('login-button');
  const logoutButton = document.getElementById('logout-button');
  const emailInput = document.getElementById('email-input');
  const passwordInput = document.getElementById('password-input');
  const emailLoginButton = document.getElementById('email-login-button');
  const signedOutView = document.getElementById('signed-out-view');
  const signedInView = document.getElementById('signed-in-view');
  const projectsSection = document.getElementById('projects-section');
  const projectsList = document.getElementById('projects-list');
  const projectsEmpty = document.getElementById('projects-empty');
  const projectsLoadingEl = document.getElementById('projects-loading');
  const projectsErrorEl = document.getElementById('projects-error');
  const pdfStatusSection = document.getElementById('pdf-status-section');
  const pdfStatusPill = document.getElementById('pdf-status-pill');
  const pdfStatusMessage = document.getElementById('pdf-status-message');

  if (
    !statusEl ||
    !loginButton ||
    !logoutButton ||
    !emailInput ||
    !passwordInput ||
    !emailLoginButton ||
    !signedOutView ||
    !signedInView ||
    !projectsSection ||
    !projectsList ||
    !projectsEmpty ||
    !projectsLoadingEl ||
    !projectsErrorEl ||
    !pdfStatusSection ||
    !pdfStatusPill ||
    !pdfStatusMessage
  ) {
    return;
  }

  let currentSession = null;
  let projects = [];
  let projectsLoaded = false;
  let projectsLoading = false;
  let currentPdfStatus = { isPdf: false, url: null, detectedAt: null };
  let currentPdfTabId = null;
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
      if (message && message.type === 'pdf:status-changed') {
        if (message.status) {
          currentPdfStatus = message.status;
          currentPdfTabId = message.tabId ?? currentPdfTabId;
          updatePdfStatusUI();
        }
      }
      return;
    }
    currentSession = message.payload;
    updateStatusForSession();
    if (!currentSession || !currentSession.accessToken) {
      resetProjects();
      resetPdfStatus();
    }
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
      setStatus('Ready to capture PDFs. Open a .pdf link to begin.');
      projectsLoaded = false;
      await loadProjects();
      await loadPdfStatus();
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
      setStatus('Ready to capture PDFs. Open a .pdf link to begin.');
      projectsLoaded = false;
      await loadProjects();
      await loadPdfStatus();
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
      resetProjects();
      resetPdfStatus();
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
          setStatus('Ready to capture PDFs. Open a .pdf link to begin.');
          await loadProjects();
          await loadPdfStatus();
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
    signedOutView.classList.toggle('hidden', isAuthed);
    signedInView.classList.toggle('hidden', !isAuthed);
    projectsSection.classList.toggle('hidden', !isAuthed);
    pdfStatusSection.classList.toggle('hidden', !isAuthed);

    loginButton.disabled = isAuthed;
    emailLoginButton.disabled = isAuthed;
    emailInput.disabled = isAuthed;
    passwordInput.disabled = isAuthed;
    logoutButton.disabled = !isAuthed;

    updatePdfStatusUI();
  }

  function setStatus(message) {
    statusEl.textContent = message;
  }

  function updateStatusForSession() {
    if (currentSession && currentSession.accessToken) {
      setStatus('Ready to capture PDFs. Open a .pdf link to begin.');
      void loadProjects();
      void loadPdfStatus();
    } else {
      setStatus('Not signed in.');
      resetProjects();
      resetPdfStatus();
    }
  }

  function resetProjects() {
    projects = [];
    projectsLoaded = false;
    if (!projectsLoading) {
      projectsLoadingEl.classList.add('hidden');
    }
    setProjectsError(null);
    projectsEmpty.classList.add('hidden');
    projectsList.classList.add('hidden');
    renderProjectList();
  }

  async function loadPdfStatus() {
    try {
      const response = await sendMessage({ type: 'pdf:getStatus' });
      if (response?.ok) {
        currentPdfStatus = response.status || { isPdf: false, url: null, detectedAt: null };
        currentPdfTabId = response.tabId ?? currentPdfTabId;
      }
    } catch (error) {
      console.error('[popup] load pdf status error', error);
    } finally {
      updatePdfStatusUI();
    }
  }

  function resetPdfStatus() {
    currentPdfStatus = { isPdf: false, url: null, detectedAt: null };
    currentPdfTabId = null;
    updatePdfStatusUI();
  }

  function updatePdfStatusUI() {
    if (!pdfStatusSection || !pdfStatusPill || !pdfStatusMessage) {
      return;
    }

    const isAuthed = Boolean(currentSession && currentSession.accessToken);
    pdfStatusSection.classList.toggle('hidden', !isAuthed);

    if (!isAuthed) {
      pdfStatusPill.textContent = 'Sign in required';
      pdfStatusPill.className = 'pill pill-idle';
      pdfStatusMessage.textContent = 'Sign in to monitor PDF pages and upload them to Harbor.';
      return;
    }

    if (currentPdfStatus && currentPdfStatus.isPdf) {
      pdfStatusPill.textContent = 'PDF detected';
      pdfStatusPill.className = 'pill pill-active';
      const url = currentPdfStatus.url ? safeHostname(currentPdfStatus.url) : 'current tab';
      pdfStatusMessage.textContent = `Metadata form is visible on the PDF page (${url}). Fill it out to upload.`;
    } else {
      pdfStatusPill.textContent = 'No PDF detected';
      pdfStatusPill.className = 'pill pill-idle';
      pdfStatusMessage.textContent = 'Open a PDF (e.g. a link ending in .pdf or a viewer) to enable uploads.';
    }
  }

  async function loadProjects() {
    if (!currentSession || !currentSession.accessToken || projectsLoading || projectsLoaded) {
      return;
    }

    projectsLoading = true;
    setProjectsError(null);
    setProjectsLoading(true);

    try {
      const response = await sendMessage({ type: 'projects:list' });
      if (!response?.ok) {
        throw new Error(response?.error || 'Unable to fetch projects');
      }
      projects = Array.isArray(response.projects) ? response.projects : [];
      projectsLoaded = true;
      renderProjectList();
    } catch (error) {
      console.error('[popup] load projects error', error);
      setProjectsError(error.message || 'Unable to fetch projects');
      projectsLoaded = false;
    } finally {
      projectsLoading = false;
      setProjectsLoading(false);
    }
  }

  function renderProjectList() {
    projectsList.innerHTML = '';

    if (!projects.length) {
      projectsList.classList.add('hidden');
      if (
        !projectsLoading &&
        projectsErrorEl.classList.contains('hidden') &&
        !projectsSection.classList.contains('hidden')
      ) {
        projectsEmpty.classList.remove('hidden');
      } else if (!projectsLoading) {
        projectsEmpty.classList.add('hidden');
      }
      return;
    }

    projectsEmpty.classList.add('hidden');
    projectsList.classList.remove('hidden');

    for (const project of projects) {
      const item = document.createElement('li');

      const primary = document.createElement('span');
      primary.textContent = project.name || project.title || 'Untitled project';
      item.append(primary);

      if (project.created_at) {
        const createdDate = new Date(project.created_at);
        if (!Number.isNaN(createdDate.getTime())) {
          const meta = document.createElement('span');
          meta.className = 'project-meta';
          meta.textContent = `Created ${createdDate.toLocaleDateString()}`;
          item.append(meta);
        }
      }

      projectsList.append(item);
    }
  }

  function setProjectsLoading(isLoading) {
    projectsLoadingEl.classList.toggle('hidden', !isLoading);
    if (isLoading) {
      projectsEmpty.classList.add('hidden');
    } else if (
      !projects.length &&
      projectsErrorEl.classList.contains('hidden') &&
      !projectsSection.classList.contains('hidden')
    ) {
      projectsEmpty.classList.remove('hidden');
    } else if (!projects.length) {
      projectsEmpty.classList.add('hidden');
    }
  }

  function setProjectsError(message) {
    if (message) {
      projectsErrorEl.textContent = message;
      projectsErrorEl.classList.remove('hidden');
      projectsEmpty.classList.add('hidden');
      projectsList.classList.add('hidden');
    } else {
      projectsErrorEl.textContent = '';
      projectsErrorEl.classList.add('hidden');
      if (
        !projects.length &&
        !projectsLoading &&
        !projectsSection.classList.contains('hidden')
      ) {
        projectsList.classList.add('hidden');
        projectsEmpty.classList.remove('hidden');
      } else if (!projects.length) {
        projectsEmpty.classList.add('hidden');
      }
    }
  }

  function safeHostname(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'current tab';
    }
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
