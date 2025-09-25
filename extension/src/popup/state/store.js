const EMPTY_PDF_STATUS = {
  isPdf: false,
  url: null,
  title: '',
  detectedAt: null,
  doi: null,
  source: null,
  arxivId: null
};

const state = {
  currentSession: null,
  projects: [],
  projectsLoaded: false,
  projectsLoading: false,
  selectedProjectId: null,
  defaultProjectId: null,
  currentPdfStatus: { ...EMPTY_PDF_STATUS },
  currentPdfTabId: null,
  hasResolvedSession: false,
  metadataContextUrl: null,
  metadataLoading: false,
  metadataUploading: false,
  metadataSuccess: false,
  metadataError: null,
  metadataAlreadyIndexed: false
};

const listeners = new Set();

function notify() {
  listeners.forEach((listener) => {
    try {
      listener(state);
    } catch (error) {
      console.error('[popup][store] listener failed', error);
    }
  });
}

function getState() {
  return state;
}

function setState(partial) {
  if (!partial || typeof partial !== 'object') {
    return;
  }
  let changed = false;
  for (const [key, value] of Object.entries(partial)) {
    if (key in state && state[key] !== value) {
      state[key] = value;
      changed = true;
    }
  }
  if (changed) {
    notify();
  }
}

function updateState(updater) {
  if (typeof updater !== 'function') {
    return;
  }
  const draft = {};
  updater(state, draft);
  setState(draft);
}

function subscribe(listener) {
  if (typeof listener !== 'function') {
    return () => {};
  }
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function resetPdfStatusState() {
  setState({
    currentPdfStatus: { ...EMPTY_PDF_STATUS },
    currentPdfTabId: null,
    metadataContextUrl: null
  });
}

function resetProjectsState() {
  setState({
    projects: [],
    projectsLoaded: false,
    projectsLoading: false,
    selectedProjectId: null,
    defaultProjectId: null
  });
}

function resetMetadataFlags() {
  setState({
    metadataLoading: false,
    metadataUploading: false,
    metadataSuccess: false,
    metadataError: null,
    metadataAlreadyIndexed: false
  });
}

export {
  EMPTY_PDF_STATUS,
  getState,
  setState,
  updateState,
  subscribe,
  resetPdfStatusState,
  resetProjectsState,
  resetMetadataFlags
};
