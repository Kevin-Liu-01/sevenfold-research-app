import {
  EMPTY_PDF_STATUS,
  getState,
  setState
} from '../state/store.js';
import { sendMessage } from '../services/runtimeMessaging.js';

function safeHostname(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return 'current tab';
  }
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

export function createPdfMetadataFeature({ elements, syncProjectSelect }) {
  let syncProjectSelectRef = typeof syncProjectSelect === 'function' ? syncProjectSelect : () => {};
  const {
    pdfStatusSection,
    pdfStatusPill,
    pdfStatusMessage,
    metadataSection,
    metadataForm,
    metadataTitleInput,
    metadataAbstractInput,
    metadataAuthorsInput,
    metadataYearInput,
    metadataMonthInput,
    metadataDayInput,
    metadataDoiInput,
    metadataCategoryInput,
    metadataStatusEl,
    metadataSubmitButton,
    metadataSourceEl
  } = elements;

  function resetMetadataForm() {
    metadataForm.reset();
    setState({
      metadataLoading: false,
      metadataUploading: false,
      metadataSuccess: false,
      metadataError: null,
      metadataAlreadyIndexed: false
    });
    metadataSourceEl.classList.add('hidden');
    metadataSourceEl.textContent = '';
    metadataStatusEl.textContent = '';
    metadataStatusEl.className = 'status-message';
    metadataSubmitButton.textContent = 'Upload PDF';
    metadataSubmitButton.disabled = true;
    updateMetadataUI();
  }

  async function loadPdfStatus() {
    try {
      const response = await sendMessage({ type: 'pdf:getStatus' });
      if (response?.ok) {
        const status = response.status ? { ...EMPTY_PDF_STATUS, ...response.status } : { ...EMPTY_PDF_STATUS };
        const nextState = {
          currentPdfStatus: status,
          currentPdfTabId: response.tabId ?? getState().currentPdfTabId
        };

        if (response.defaultProjectId) {
          nextState.defaultProjectId = response.defaultProjectId;
          if (!getState().selectedProjectId) {
            nextState.selectedProjectId = response.defaultProjectId;
          }
        }

        setState(nextState);
        if (response.defaultProjectId) {
          syncProjectSelectRef();
        }
      }
    } catch (error) {
      console.error('[popup] load pdf status error', error);
    } finally {
      updatePdfStatusUI();
    }
  }

  function resetPdfStatus() {
    setState({
      currentPdfStatus: { ...EMPTY_PDF_STATUS },
      currentPdfTabId: null,
      metadataContextUrl: null
    });
    resetMetadataForm();
    updatePdfStatusUI();
  }

  function collectMetadataFromForm() {
    const title = metadataTitleInput.value.trim();
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

  async function prefillMetadataForDoi(doi, source) {
    if (!doi) {
      return;
    }

    setState({
      metadataLoading: true,
      metadataAlreadyIndexed: false,
      metadataError: null
    });

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
        setState({
          metadataAlreadyIndexed: true,
          metadataLoading: false,
          metadataError: null
        });
      } else {
        setState({
          metadataAlreadyIndexed: false,
          metadataLoading: false
        });
      }
    } catch (error) {
      setState({
        metadataLoading: false,
        metadataError: error?.message || 'Unable to fetch metadata.',
        metadataAlreadyIndexed: false
      });
    } finally {
      updateMetadataUI();
    }
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    const { currentSession } = getState();
    if (!currentSession || !currentSession.accessToken) {
      setState({
        metadataError: 'Sign in to upload PDFs.',
        metadataSuccess: false
      });
      updateMetadataUI();
      return;
    }

    const collectResult = collectMetadataFromForm();
    if (!collectResult.ok) {
      setState({
        metadataError: collectResult.error,
        metadataSuccess: false
      });
      updateMetadataUI();
      return;
    }

    const { selectedProjectId, defaultProjectId, currentPdfStatus } = getState();
    const projectId = selectedProjectId || defaultProjectId || null;
    if (!projectId) {
      setState({
        metadataError: 'Select a project before uploading.',
        metadataSuccess: false
      });
      updateMetadataUI();
      return;
    }

    setState({
      metadataUploading: true,
      metadataSuccess: false,
      metadataError: null
    });
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

      setState({
        metadataSuccess: true,
        metadataError: null
      });
    } catch (error) {
      setState({
        metadataSuccess: false,
        metadataError: error?.message || 'Unable to upload PDF.'
      });
    } finally {
      setState({ metadataUploading: false });
      updateMetadataUI();
    }
  }

  function handleFormInput() {
    setState({
      metadataSuccess: false,
      metadataError: null,
      metadataAlreadyIndexed: false
    });
    updateMetadataUI();
  }

  function updatePdfStatusUI() {
    const state = getState();
    if (!state.hasResolvedSession) {
      return;
    }

    const isAuthed = Boolean(state.currentSession && state.currentSession.accessToken);
    pdfStatusSection.classList.toggle('hidden', !isAuthed);

    if (!isAuthed) {
      pdfStatusPill.textContent = 'Sign in required';
      pdfStatusPill.className = 'pill pill-idle';
      pdfStatusMessage.textContent = 'Sign in to monitor PDF pages and upload them to Sevenfold.';
      metadataSection.classList.add('hidden');
      setState({ metadataContextUrl: null });
      resetMetadataForm();
      updateMetadataUI();
      return;
    }

    const { currentPdfStatus, metadataContextUrl } = state;
    if (currentPdfStatus && currentPdfStatus.isPdf) {
      pdfStatusPill.textContent = 'PDF detected';
      pdfStatusPill.className = 'pill pill-active';
      const url = currentPdfStatus.url ? safeHostname(currentPdfStatus.url) : 'current tab';
      pdfStatusMessage.textContent = `Metadata form is ready for the PDF (${url}).`;

      metadataSourceEl.classList.toggle('hidden', !currentPdfStatus.source);
      if (currentPdfStatus.source) {
        metadataSourceEl.textContent = currentPdfStatus.source === 'arxiv' ? 'arXiv' : currentPdfStatus.source;
      } else {
        metadataSourceEl.textContent = '';
      }

      if (!metadataContextUrl || metadataContextUrl !== currentPdfStatus.url) {
        setState({ metadataContextUrl: currentPdfStatus.url });
        resetMetadataForm();
        if (metadataDoiInput) {
          metadataDoiInput.value = currentPdfStatus.doi || '';
        }
        if (currentPdfStatus.doi) {
          void prefillMetadataForDoi(currentPdfStatus.doi, currentPdfStatus.source);
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
      metadataSection.classList.add('hidden');
      setState({ metadataContextUrl: null });
      resetMetadataForm();
      updateMetadataUI();
    }
  }

  function updateMetadataUI() {
    const state = getState();
    const isAuthed = Boolean(state.currentSession && state.currentSession.accessToken);
    const hasPdf = isAuthed && state.currentPdfStatus && state.currentPdfStatus.isPdf;

    if (!hasPdf) {
      metadataSection.classList.add('hidden');
      metadataSubmitButton.disabled = true;
      return;
    }

    metadataSection.classList.remove('hidden');
    metadataForm.classList.toggle('fields-hidden', state.metadataAlreadyIndexed);

    const disableControls = state.metadataUploading || state.metadataLoading;
    const controls = metadataForm.querySelectorAll('input, textarea');
    controls.forEach((control) => {
      control.disabled = disableControls;
    });

    const projectAvailable = Boolean(state.selectedProjectId || state.defaultProjectId);

    if (state.metadataLoading) {
      metadataForm.classList.add('fields-hidden');
      metadataStatusEl.textContent = 'Checking our records for this paper…';
      metadataStatusEl.className = 'status-message';
    } else if (state.metadataUploading) {
      metadataForm.classList.add('fields-hidden');
      metadataStatusEl.textContent = 'Uploading PDF to Sevenfold…';
      metadataStatusEl.className = 'status-message';
    } else if (state.metadataError) {
      metadataStatusEl.textContent = state.metadataError;
      metadataStatusEl.className = 'status-message error';
    } else if (state.metadataSuccess) {
      metadataStatusEl.textContent = 'Upload complete! You can close this tab or keep browsing.';
      metadataStatusEl.className = 'status-message success';
    } else if (state.metadataAlreadyIndexed) {
      metadataForm.classList.add('fields-hidden');
      metadataTitleInput.removeAttribute('required');
      metadataStatusEl.textContent = "We've already indexed this paper before; no need to fill in the metadata.";
      metadataStatusEl.className = 'status-message';
    } else if (!projectAvailable) {
      metadataForm.classList.add('fields-hidden');
      metadataStatusEl.textContent = 'Select a project before uploading.';
      metadataStatusEl.className = 'status-message';
    } else {
      metadataForm.classList.remove('fields-hidden');
      metadataTitleInput.setAttribute('required', 'required');
      metadataStatusEl.textContent = 'Fill in metadata and submit to store this PDF.';
      metadataStatusEl.className = 'status-message';
    }

    const idleButtonLabel = 'Upload PDF';
    metadataSubmitButton.textContent = state.metadataUploading
      ? 'Uploading…'
      : state.metadataSuccess
        ? 'Uploaded'
        : idleButtonLabel;
    metadataSubmitButton.disabled = disableControls || !projectAvailable || state.metadataSuccess;
  }

  function handlePdfStatusChange(status, tabId) {
    const mergedStatus = status ? { ...EMPTY_PDF_STATUS, ...status } : { ...EMPTY_PDF_STATUS };
    setState({
      currentPdfStatus: mergedStatus,
      currentPdfTabId: tabId ?? getState().currentPdfTabId
    });
    updatePdfStatusUI();
  }

  function setSyncProjectSelect(fn) {
    if (typeof fn === 'function') {
      syncProjectSelectRef = fn;
    }
  }

  function init() {
    metadataForm.addEventListener('submit', (event) => {
      void handleFormSubmit(event);
    });

    metadataForm.addEventListener('input', () => {
      handleFormInput();
    });
  }

  return {
    init,
    loadPdfStatus,
    resetPdfStatus,
    updatePdfStatusUI,
    updateMetadataUI,
    resetMetadataForm,
    handlePdfStatusChange,
    setSyncProjectSelect
  };
}
