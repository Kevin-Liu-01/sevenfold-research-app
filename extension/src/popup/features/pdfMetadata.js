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

export function createPdfMetadataFeature({ elements, syncProjectSelect }) {
  let syncProjectSelectRef = typeof syncProjectSelect === 'function' ? syncProjectSelect : () => {};
  const {
    panelRoot,
    panelCloseButton,
    panelToggleButton,
    pdfStatusSection,
    pdfStatusPill,
    pdfStatusMessage,
    metadataSection,
    metadataStatusEl,
    metadataSubmitButton,
    metadataSourceEl
  } = elements;

  let panelHidden = false;

  function showPanel() {
    panelHidden = false;
    if (panelRoot) {
      panelRoot.classList.remove('panel-hidden');
    }
    if (panelToggleButton) {
      panelToggleButton.classList.add('hidden');
      panelToggleButton.classList.remove('panel-toggle-attention');
      panelToggleButton.setAttribute('aria-expanded', 'true');
      panelToggleButton.setAttribute('aria-hidden', 'true');
    }
    updateMetadataUI();
  }

  function hidePanel() {
    if (panelHidden) {
      return;
    }
    panelHidden = true;
    if (panelRoot) {
      panelRoot.classList.add('panel-hidden');
    }
    if (panelToggleButton) {
      panelToggleButton.classList.remove('hidden');
      panelToggleButton.setAttribute('aria-expanded', 'false');
      panelToggleButton.setAttribute('aria-hidden', 'false');
      panelToggleButton.focus();
    }
    updateMetadataUI();
  }

  function resetMetadataForm() {
    setState({
      metadataLoading: false,
      metadataUploading: false,
      metadataSuccess: false,
      metadataError: null,
      metadataAlreadyIndexed: false
    });
    if (metadataSourceEl) {
      metadataSourceEl.classList.add('hidden');
      metadataSourceEl.textContent = '';
    }
    if (metadataStatusEl) {
      metadataStatusEl.textContent = '';
      metadataStatusEl.className = 'status-message';
    }
    if (metadataSubmitButton) {
      metadataSubmitButton.textContent = 'Upload PDF';
      metadataSubmitButton.disabled = true;
    }
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

  async function prefillMetadataForDoi(doi, source) {
    if (!doi) {
      setState({
        metadataLoading: false,
        metadataAlreadyIndexed: false,
        metadataError: null
      });
      updateMetadataUI();
      return;
    }

    setState({
      metadataLoading: true,
      metadataAlreadyIndexed: false,
      metadataError: null
    });

    if (metadataSourceEl) {
      if (source) {
        metadataSourceEl.classList.remove('hidden');
        metadataSourceEl.textContent = source === 'arxiv' ? 'arXiv' : source;
      } else {
        metadataSourceEl.classList.add('hidden');
        metadataSourceEl.textContent = '';
      }
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

  async function handleUploadClick(event) {
    event?.preventDefault();

    const state = getState();
    const { currentSession } = state;
    if (!currentSession || !currentSession.accessToken) {
      setState({
        metadataError: 'Sign in to upload PDFs.',
        metadataSuccess: false
      });
      updateMetadataUI();
      return;
    }

    const projectId = state.selectedProjectId || state.defaultProjectId || null;
    if (!projectId) {
      setState({
        metadataError: 'Select a project before uploading.',
        metadataSuccess: false
      });
      updateMetadataUI();
      return;
    }

    const metadataHints = {};
    if (state.currentPdfStatus?.doi) {
      metadataHints.doi = state.currentPdfStatus.doi;
    }

    setState({
      metadataUploading: true,
      metadataSuccess: false,
      metadataError: null
    });
    updateMetadataUI();

    try {
      const messagePayload = {
        url: state.currentPdfStatus?.url || window.location.href,
        metadata: metadataHints,
        projectId
      };

      if (state.currentPdfStatus?.source === 'arxiv') {
        messagePayload.paperType = 'source';
      }

      const response = await sendMessage({
        type: 'upload:request',
        payload: messagePayload
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

  function syncPanelToggle(state, hasPdf) {
    if (!panelToggleButton) {
      return;
    }

    let toggleText = 'Open Research Library';
    if (state.metadataUploading) {
      toggleText = 'Uploading… (show panel)';
    } else if (state.metadataError) {
      toggleText = 'Open panel to resolve upload';
    } else if (state.metadataSuccess) {
      toggleText = 'Upload complete – open panel';
    } else if (state.metadataLoading) {
      toggleText = 'Fetching metadata… (show panel)';
    } else if (state.metadataAlreadyIndexed) {
      toggleText = 'Open panel to link paper';
    } else if (!hasPdf) {
      toggleText = 'Open Research Library';
    }

    panelToggleButton.setAttribute('aria-label', toggleText);

    if (
      panelHidden &&
      (state.metadataUploading || state.metadataError || state.metadataSuccess || state.metadataLoading || hasPdf)
    ) {
      panelToggleButton.classList.add('panel-toggle-attention');
    } else {
      panelToggleButton.classList.remove('panel-toggle-attention');
    }
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
      pdfStatusMessage.textContent = `Upload is ready. We'll extract metadata automatically for ${url}.`;

      if (metadataSourceEl) {
        metadataSourceEl.classList.toggle('hidden', !currentPdfStatus.source);
        metadataSourceEl.textContent = currentPdfStatus.source
          ? currentPdfStatus.source === 'arxiv'
            ? 'arXiv'
            : currentPdfStatus.source
          : '';
      }

      if (!metadataContextUrl || metadataContextUrl !== currentPdfStatus.url) {
        setState({ metadataContextUrl: currentPdfStatus.url });
        resetMetadataForm();
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

    syncPanelToggle(state, hasPdf);

    if (!hasPdf) {
      metadataSection.classList.add('hidden');
      if (metadataSubmitButton) {
        metadataSubmitButton.disabled = true;
      }
      return;
    }

    metadataSection.classList.remove('hidden');

    const disableControls = state.metadataUploading || state.metadataLoading;
    const projectAvailable = Boolean(state.selectedProjectId || state.defaultProjectId);

    let statusText = 'Ready to upload. We will extract the metadata automatically.';
    let statusClass = 'status-message info';

    if (state.metadataLoading) {
      statusText = 'Checking our records for this paper…';
      statusClass = 'status-message';
    } else if (state.metadataUploading) {
      statusText = 'Uploading PDF to Sevenfold…';
      statusClass = 'status-message';
    } else if (state.metadataError) {
      statusText = state.metadataError;
      statusClass = 'status-message error';
    } else if (state.metadataSuccess) {
      statusText = 'Upload complete! You can close this tab or keep browsing.';
      statusClass = 'status-message success';
    } else if (!projectAvailable) {
      statusText = 'Select a project before uploading.';
      statusClass = 'status-message';
    } else if (state.metadataAlreadyIndexed) {
      statusText = 'We already have metadata for this DOI. We will link it to your project when you upload.';
      statusClass = 'status-message info';
    }

    if (metadataStatusEl) {
      metadataStatusEl.textContent = statusText;
      metadataStatusEl.className = statusClass;
    }

    if (metadataSubmitButton) {
      const idleButtonLabel = 'Upload PDF';
      metadataSubmitButton.textContent = state.metadataUploading
        ? 'Uploading…'
        : state.metadataSuccess
          ? 'Uploaded'
          : idleButtonLabel;
      metadataSubmitButton.disabled = disableControls || !projectAvailable || state.metadataSuccess;
    }
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
    showPanel();

    if (panelCloseButton) {
      panelCloseButton.addEventListener('click', (event) => {
        event.preventDefault();
        hidePanel();
      });
    }

    if (panelToggleButton) {
      panelToggleButton.addEventListener('click', (event) => {
        event.preventDefault();
        showPanel();
      });
    }

    if (metadataSubmitButton) {
      metadataSubmitButton.addEventListener('click', (event) => {
        if (metadataSubmitButton.disabled) {
          event.preventDefault();
          return;
        }
        void handleUploadClick(event);
      });
    }
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
