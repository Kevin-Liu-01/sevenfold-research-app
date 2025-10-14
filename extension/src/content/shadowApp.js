function noop() {}

let dependenciesPromise = null;

function resolveModuleUrl(relativePath) {
  if (!chrome?.runtime?.getURL) {
    throw new Error('Extension runtime unavailable');
  }
  return chrome.runtime.getURL(relativePath);
}

function loadDependencies() {
  if (!dependenciesPromise) {
    dependenciesPromise = Promise.all([
      import(/* @vite-ignore */ resolveModuleUrl('popup/dom/elements.js')),
      import(/* @vite-ignore */ resolveModuleUrl('popup/services/runtimeMessaging.js')),
      import(/* @vite-ignore */ resolveModuleUrl('popup/features/projects.js')),
      import(/* @vite-ignore */ resolveModuleUrl('popup/features/pdfMetadata.js')),
      import(/* @vite-ignore */ resolveModuleUrl('popup/state/store.js'))
    ]).catch((error) => {
      dependenciesPromise = null;
      throw error;
    });
  }
  return dependenciesPromise;
}

export async function initShadowApp(root) {
  if (!root) {
    return { destroy: noop };
  }

  let modules;
  try {
    modules = await loadDependencies();
  } catch (error) {
    console.error('[content] failed to load shadow dependencies', error);
    return { destroy: noop };
  }

  const [elementsModule, runtimeMessagingModule, projectsModule, pdfMetadataModule, stateModule] = modules;
  const { queryShadowElements } = elementsModule;
  const { addTypedMessageListener, sendMessage } = runtimeMessagingModule;
  const { createProjectsFeature } = projectsModule;
  const { createPdfMetadataFeature } = pdfMetadataModule;
  const { setState } = stateModule;

  const elements = queryShadowElements(root);
  if (!elements) {
    return { destroy: noop };
  }

  const { statusEl } = elements;

  function setStatus(message) {
    if (statusEl) {
      statusEl.textContent = message;
    }
  }

  setStatus('Checking session…');

  const metadataFeature = createPdfMetadataFeature({ elements });
  metadataFeature.resetMetadataForm();

  const projectsFeature = createProjectsFeature({
    elements,
    updateMetadataUI: metadataFeature.updateMetadataUI
  });
  metadataFeature.setSyncProjectSelect(projectsFeature.syncProjectSelect);

  metadataFeature.init();
  projectsFeature.init();

  const unsubscribes = [];

  unsubscribes.push(
    addTypedMessageListener('pdf:status-changed', (message) => {
      if (!message?.status) {
        return false;
      }
      metadataFeature.handlePdfStatusChange(message.status, message.tabId);
      return false;
    })
  );

  function handleAuthChanged(session) {
    setState({ currentSession: session, hasResolvedSession: true });
    const isAuthed = Boolean(session && session.accessToken);

    if (isAuthed) {
      setStatus('Ready to capture PDFs.');
      void projectsFeature.loadProjects();
      void metadataFeature.loadPdfStatus();
    } else {
      setStatus('Not signed in. Open the Sevenfold popup to connect.');
      projectsFeature.resetProjects();
      metadataFeature.resetPdfStatus();
    }

    metadataFeature.updatePdfStatusUI();
    metadataFeature.updateMetadataUI();
  }

  unsubscribes.push(
    addTypedMessageListener('auth:changed', (message) => {
      handleAuthChanged(message?.payload || null);
      return false;
    })
  );

  async function bootstrap() {
    try {
      const response = await sendMessage({ type: 'auth:getSession' });
      if (response?.ok) {
        handleAuthChanged(response.session || null);
        if (response.session) {
          await metadataFeature.loadPdfStatus();
          await projectsFeature.loadProjects();
        }
      } else {
        setStatus('Unable to fetch session.');
        setState({ hasResolvedSession: true });
        metadataFeature.updatePdfStatusUI();
        metadataFeature.updateMetadataUI();
      }
    } catch (error) {
      console.error('[content] shadow bootstrap failed', error);
      setStatus('Unable to reach background script.');
      setState({ hasResolvedSession: true });
      metadataFeature.updatePdfStatusUI();
      metadataFeature.updateMetadataUI();
    }
  }

  void bootstrap();

  return {
    destroy() {
      while (unsubscribes.length) {
        try {
          const unsubscribe = unsubscribes.pop();
          unsubscribe?.();
        } catch (error) {
          console.error('[content] failed to remove listener', error);
        }
      }
    }
  };
}
