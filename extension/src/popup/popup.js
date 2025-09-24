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
  const projectSelect = document.getElementById('project-select');
  const pdfStatusSection = document.getElementById('pdf-status-section');
  const pdfStatusPill = document.getElementById('pdf-status-pill');
  const pdfStatusMessage = document.getElementById('pdf-status-message');
  const metadataSection = document.getElementById('metadata-section');
  const metadataForm = document.getElementById('metadata-form');
  const metadataTitleInput = document.getElementById('metadata-title');
  const metadataAbstractInput = document.getElementById('metadata-abstract');
  const metadataAuthorsInput = document.getElementById('metadata-authors');
  const metadataYearInput = document.getElementById('metadata-year');
  const metadataMonthInput = document.getElementById('metadata-month');
  const metadataDayInput = document.getElementById('metadata-day');
  const metadataDoiInput = document.getElementById('metadata-doi');
  const metadataCategoryInput = document.getElementById('metadata-category');
  const metadataStatusEl = document.getElementById('metadata-status');
  const metadataSubmitButton = document.getElementById('metadata-submit');
  const metadataSourceEl = document.getElementById('metadata-source');

  const EMPTY_PDF_STATUS = {
    isPdf: false,
    url: null,
    title: '',
    detectedAt: null,
    doi: null,
    source: null,
    arxivId: null
  };

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
    !projectSelect ||
    !pdfStatusSection ||
    !pdfStatusPill ||
    !pdfStatusMessage ||
    !metadataSection ||
    !metadataForm ||
    !metadataTitleInput ||
    !metadataAbstractInput ||
    !metadataAuthorsInput ||
    !metadataYearInput ||
    !metadataMonthInput ||
    !metadataDayInput ||
    !metadataDoiInput ||
    !metadataCategoryInput ||
    !metadataStatusEl ||
    !metadataSubmitButton ||
    !metadataSourceEl
  ) {
    return;
  }

  let currentSession = null;
  let projects = [];
  let projectsLoaded = false;
  let projectsLoading = false;
  let selectedProjectId = null;
  let defaultProjectId = null;
  let currentPdfStatus = { ...EMPTY_PDF_STATUS };
  let currentPdfTabId = null;
  let hasResolvedSession = false;
  let metadataContextUrl = null;
  let metadataLoading = false;
  let metadataUploading = false;
  let metadataSuccess = false;
  let metadataError = null;
  let metadataAlreadyIndexed = false;
  setStatus('Checking session…');
  loginButton.disabled = true;
  logoutButton.disabled = true;
  emailLoginButton.disabled = true;
  emailInput.disabled = true;
  passwordInput.disabled = true;

  signedOutView.classList.add('hidden');
  signedInView.classList.add('hidden');
  projectsSection.classList.add('hidden');
  pdfStatusSection.classList.add('hidden');
  metadataSection.classList.add('hidden');

  resetMetadataForm();

  init();

  // Listen for session updates broadcast by the background worker.
  chrome.runtime.onMessage.addListener((message) => {
    if (!message || message.type !== 'auth:changed') {
      if (message && message.type === 'pdf:status-changed') {
        if (message.status) {
          currentPdfStatus = { ...EMPTY_PDF_STATUS, ...message.status };
          currentPdfTabId = message.tabId ?? currentPdfTabId;
          updatePdfStatusUI();
        }
      }
      return;
    }
    currentSession = message.payload;
    hasResolvedSession = true;
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
      hasResolvedSession = true;
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
      hasResolvedSession = true;
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

  projectSelect.addEventListener('change', async (event) => {
    const projectId = event.target.value;
    try {
      await sendMessage({ type: 'projects:setDefault', projectId: projectId || null });
      selectedProjectId = projectId || null;
      defaultProjectId = projectId || null;
      syncProjectSelect();
      updateMetadataUI();
    } catch (error) {
      console.error('[popup] set default project error', error);
    }
  });

  metadataForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (metadataAlreadyIndexed) {
      metadataError = null;
      metadataSuccess = false;
      updateMetadataUI();
      return;
    }
    if (!currentSession || !currentSession.accessToken) {
      metadataError = 'Sign in to upload PDFs.';
      metadataSuccess = false;
      updateMetadataUI();
      return;
    }

    const collectResult = collectMetadataFromForm();
    if (!collectResult.ok) {
      metadataError = collectResult.error;
      metadataSuccess = false;
      updateMetadataUI();
      return;
    }

    const projectId = selectedProjectId || defaultProjectId || null;
    if (!projectId) {
      metadataError = 'Select a project before uploading.';
      metadataSuccess = false;
      updateMetadataUI();
      return;
    }

    metadataUploading = true;
    metadataSuccess = false;
    metadataError = null;
    updateMetadataUI();

    try {
      const response = await sendMessage({
        type: 'upload:request',
        payload: {
          url: currentPdfStatus?.url || window.location.href,
          metadata: { ...collectResult.value, projectId },
          projectId
        }
      });

      if (!response?.ok) {
        throw new Error(response?.error || 'Unable to upload PDF.');
      }

      metadataSuccess = true;
      metadataError = null;
    } catch (error) {
      metadataSuccess = false;
      metadataError = error?.message || 'Unable to upload PDF.';
    } finally {
      metadataUploading = false;
      updateMetadataUI();
    }
  });

  metadataForm.addEventListener('input', () => {
    metadataSuccess = false;
    metadataError = null;
    metadataAlreadyIndexed = false;
    updateMetadataUI();
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
      hasResolvedSession = true;
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
      hasResolvedSession = true;
      updateUI();
      updatePdfStatusUI();
    }
  }

  // Enable/disable controls based on whether the user is authenticated.
  function updateUI() {
    if (!hasResolvedSession) {
      return;
    }
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
    updateMetadataUI();
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
    defaultProjectId = null;
    selectedProjectId = null;
    projectSelect.innerHTML = '';
    projectSelect.classList.add('hidden');
    projectSelect.disabled = true;
    renderProjectList();
  }

  async function loadPdfStatus() {
    try {
      const response = await sendMessage({ type: 'pdf:getStatus' });
      if (response?.ok) {
        currentPdfStatus = response.status ? { ...EMPTY_PDF_STATUS, ...response.status } : { ...EMPTY_PDF_STATUS };
        currentPdfTabId = response.tabId ?? currentPdfTabId;
        if (response.defaultProjectId) {
          defaultProjectId = response.defaultProjectId;
          if (!selectedProjectId) {
            selectedProjectId = defaultProjectId;
          }
          syncProjectSelect();
        }
      }
    } catch (error) {
      console.error('[popup] load pdf status error', error);
    } finally {
      updatePdfStatusUI();
    }
  }

  function resetPdfStatus() {
    currentPdfStatus = { ...EMPTY_PDF_STATUS };
    currentPdfTabId = null;
    metadataContextUrl = null;
    resetMetadataForm();
    updatePdfStatusUI();
  }

  function updatePdfStatusUI() {
    if (!hasResolvedSession) {
      return;
    }
    if (!pdfStatusSection || !pdfStatusPill || !pdfStatusMessage) {
      return;
    }

    const isAuthed = Boolean(currentSession && currentSession.accessToken);
    pdfStatusSection.classList.toggle('hidden', !isAuthed);

    if (!isAuthed) {
      pdfStatusPill.textContent = 'Sign in required';
      pdfStatusPill.className = 'pill pill-idle';
      pdfStatusMessage.textContent = 'Sign in to monitor PDF pages and upload them to Sevenfold.';
      metadataSection.classList.add('hidden');
      metadataContextUrl = null;
      resetMetadataForm();
      updateMetadataUI();
      return;
    }

    if (currentPdfStatus && currentPdfStatus.isPdf) {
      pdfStatusPill.textContent = 'PDF detected';
      pdfStatusPill.className = 'pill pill-active';
      const url = currentPdfStatus.url ? safeHostname(currentPdfStatus.url) : 'current tab';
      pdfStatusMessage.textContent = `Metadata form is ready for the PDF (${url}).`;

      metadataSection.classList.remove('hidden');
      metadataForm.classList.remove('fields-hidden');

      metadataSourceEl.classList.toggle('hidden', !currentPdfStatus.source);
      if (currentPdfStatus.source) {
        metadataSourceEl.textContent = currentPdfStatus.source === 'arxiv' ? 'arXiv' : currentPdfStatus.source;
      } else {
        metadataSourceEl.textContent = '';
      }

      if (!metadataContextUrl || metadataContextUrl !== currentPdfStatus.url) {
        metadataContextUrl = currentPdfStatus.url;
        resetMetadataForm();
        if (metadataDoiInput) {
          metadataDoiInput.value = currentPdfStatus.doi || '';
        }
        if (currentPdfStatus.doi) {
          prefillMetadataForDoi(currentPdfStatus.doi, currentPdfStatus.source);
        } else {
          updateMetadataUI();
        }
      } else {
        updateMetadataUI();
      }
    } else {
      pdfStatusPill.textContent = 'No PDF detected';
      pdfStatusPill.className = 'pill pill-idle';
      pdfStatusMessage.textContent = 'Open a PDF (e.g. a link ending in .pdf or a viewer) to enable uploads.';
      metadataContextUrl = null;
      resetMetadataForm();
      metadataSection.classList.add('hidden');
      updateMetadataUI();
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
      defaultProjectId = response.defaultProjectId || null;
      if (!selectedProjectId) {
        selectedProjectId = defaultProjectId;
      }
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
    projectSelect.innerHTML = '';

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
      projectSelect.classList.add('hidden');
      updateMetadataUI();
      return;
    }

    projectsEmpty.classList.add('hidden');
    projectsList.classList.remove('hidden');
    projectSelect.classList.remove('hidden');

    for (const project of projects) {
      const option = document.createElement('option');
      option.value = project.id;
      option.textContent = project.name || project.title || 'Untitled project';
      projectSelect.append(option);
    }

    syncProjectSelect();

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

    updateMetadataUI();
  }

  function setProjectsLoading(isLoading) {
    projectsLoadingEl.classList.toggle('hidden', !isLoading);
    if (isLoading) {
      projectsEmpty.classList.add('hidden');
      projectSelect.disabled = true;
    } else if (
      !projects.length &&
      projectsErrorEl.classList.contains('hidden') &&
      !projectsSection.classList.contains('hidden')
    ) {
      projectsEmpty.classList.remove('hidden');
      projectSelect.disabled = true;
    } else if (!projects.length) {
      projectsEmpty.classList.add('hidden');
      projectSelect.disabled = true;
    } else {
      projectSelect.disabled = false;
    }
    updateMetadataUI();
  }

  function setProjectsError(message) {
    if (message) {
      projectsErrorEl.textContent = message;
      projectsErrorEl.classList.remove('hidden');
      projectsEmpty.classList.add('hidden');
      projectsList.classList.add('hidden');
      projectSelect.disabled = true;
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
        projectSelect.disabled = true;
      } else if (!projects.length) {
        projectsEmpty.classList.add('hidden');
        projectSelect.disabled = true;
      } else {
        projectSelect.disabled = false;
      }
    }
    updateMetadataUI();
  }

  function safeHostname(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return 'current tab';
    }
  }

  function resetMetadataForm() {
    metadataForm.reset();
    metadataLoading = false;
    metadataUploading = false;
    metadataSuccess = false;
    metadataError = null;
    metadataAlreadyIndexed = false;
    metadataSourceEl.classList.add('hidden');
    metadataSourceEl.textContent = '';
    metadataStatusEl.textContent = '';
    metadataStatusEl.className = 'status-message';
    metadataSubmitButton.textContent = 'Upload PDF';
    metadataSubmitButton.disabled = true;
    updateMetadataUI();
  }

  async function prefillMetadataForDoi(doi, source) {
    if (!doi) {
      return;
    }

    metadataLoading = true;
    metadataAlreadyIndexed = false;
    metadataError = null;
    if (source) {
      metadataSourceEl.classList.remove('hidden');
      metadataSourceEl.textContent = source === 'arxiv' ? 'arXiv' : source;
    } else {
      metadataSourceEl.classList.add('hidden');
      metadataSourceEl.textContent = '';
    }
    updateMetadataUI();

    try {
      const response = await sendMessage({
        type: 'metadata:lookup',
        payload: { doi }
      });

      if (response?.ok && response.paperId) {
        metadataAlreadyIndexed = true;
        metadataLoading = false;
        metadataError = null;
        updateMetadataUI();
      } else {
        metadataLoading = false;
        metadataAlreadyIndexed = false;
        updateMetadataUI();
      }
    } catch (error) {
      metadataLoading = false;
      metadataError = error?.message || 'Unable to fetch metadata.';
      metadataAlreadyIndexed = false;
      updateMetadataUI();
    }
  }

  function collectMetadataFromForm() {
    const title = metadataTitleInput.value.trim();
    if (!title) {
      return { ok: false, error: 'Title is required.' };
    }

    const abstract = metadataAbstractInput.value.trim();
    const authors = metadataAuthorsInput.value
      .split(/\n|,/)
      .map((author) => author.trim())
      .filter(Boolean);

    const year = parseInteger(metadataYearInput.value, 0, 5000);
    if (metadataYearInput.value && year === null) {
      return { ok: false, error: 'Year must be a positive number.' };
    }

    const month = parseInteger(metadataMonthInput.value, 1, 12);
    if (metadataMonthInput.value && month === null) {
      return { ok: false, error: 'Month must be between 1 and 12.' };
    }

    const day = parseInteger(metadataDayInput.value, 1, 31);
    if (metadataDayInput.value && day === null) {
      return { ok: false, error: 'Day must be between 1 and 31.' };
    }

    return {
      ok: true,
      value: {
        title,
        abstract: abstract || null,
        authors,
        year,
        month,
        day,
        doi: metadataDoiInput.value.trim() || null,
        category: metadataCategoryInput.value.trim() || null
      }
    };
  }

  function updateMetadataUI() {
    const isAuthed = Boolean(currentSession && currentSession.accessToken);
    const hasPdf = isAuthed && currentPdfStatus && currentPdfStatus.isPdf;

    if (!hasPdf) {
      metadataSection.classList.add('hidden');
      metadataSubmitButton.disabled = true;
      return;
    }

    metadataSection.classList.remove('hidden');
    metadataForm.classList.toggle('fields-hidden', metadataAlreadyIndexed);

    const disableControls = metadataUploading || metadataLoading;
    const controls = metadataForm.querySelectorAll('input, textarea');
    controls.forEach((control) => {
      control.disabled = disableControls;
    });

    const projectAvailable = Boolean(selectedProjectId || defaultProjectId);

    if (metadataLoading) {
      metadataForm.classList.add('fields-hidden');
      metadataStatusEl.textContent = 'Checking our records for this paper…';
      metadataStatusEl.className = 'status-message';
    } else if (metadataUploading) {
      metadataForm.classList.add('fields-hidden');
      metadataStatusEl.textContent = 'Uploading PDF to Sevenfold…';
      metadataStatusEl.className = 'status-message';
    } else if (metadataError) {
      metadataStatusEl.textContent = metadataError;
      metadataStatusEl.className = 'status-message error';
    } else if (metadataSuccess) {
      metadataStatusEl.textContent = 'Upload complete! You can close this tab or keep browsing.';
      metadataStatusEl.className = 'status-message success';
    } else if (metadataAlreadyIndexed) {
      metadataForm.classList.add('fields-hidden');
      metadataStatusEl.textContent = "We've already indexed this paper before; no need to fill in the metadata.";
      metadataStatusEl.className = 'status-message';
    } else if (!projectAvailable) {
      metadataForm.classList.add('fields-hidden');
      metadataStatusEl.textContent = 'Select a project before uploading.';
      metadataStatusEl.className = 'status-message';
    } else {
      metadataStatusEl.textContent = 'Fill in metadata and submit to store this PDF.';
      metadataStatusEl.className = 'status-message';
    }

    const idleButtonLabel = 'Upload PDF';
    metadataSubmitButton.textContent = metadataUploading
      ? 'Uploading…'
      : metadataSuccess
      ? 'Uploaded'
      : idleButtonLabel;
    metadataSubmitButton.disabled = disableControls || !projectAvailable || metadataSuccess;
  }

  function parseInteger(value, min, max) {
    if (!value && value !== 0) {
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

  function syncProjectSelect() {
    if (!projectSelect || !projectSelect.options.length) {
      return;
    }

    const desired = selectedProjectId || defaultProjectId;
    if (desired) {
      const optionExists = Array.from(projectSelect.options).some((option) => option.value === desired);
      if (optionExists) {
        projectSelect.value = desired;
        selectedProjectId = projectSelect.value;
        return;
      }
    }

    if (!projectSelect.value && projectSelect.options.length) {
      projectSelect.value = projectSelect.options[0].value;
      selectedProjectId = projectSelect.value;
    }

    updateMetadataUI();
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
