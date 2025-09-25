import { getState, setState } from '../state/store.js';
import { sendMessage } from '../services/runtimeMessaging.js';

export function createProjectsFeature({ elements, updateMetadataUI }) {
  const {
    projectsSection,
    projectsList,
    projectsEmpty,
    projectsLoadingEl,
    projectsErrorEl,
    projectSelect
  } = elements;

  function resetProjects() {
    setState({
      projects: [],
      projectsLoaded: false,
      projectsLoading: false,
      selectedProjectId: null,
      defaultProjectId: null
    });

    projectsList.innerHTML = '';
    projectSelect.innerHTML = '';
    projectsEmpty.classList.add('hidden');
    projectsList.classList.add('hidden');
    projectsLoadingEl.classList.add('hidden');
    projectsErrorEl.textContent = '';
    projectsErrorEl.classList.add('hidden');
    projectSelect.classList.add('hidden');
    projectSelect.disabled = true;

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
      const { projects, projectsLoading } = getState();
      if (!projects.length && !projectsLoading && !projectsSection.classList.contains('hidden')) {
        projectsEmpty.classList.remove('hidden');
        projectsList.classList.add('hidden');
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

  function setProjectsLoading(isLoading) {
    projectsLoadingEl.classList.toggle('hidden', !isLoading);
    if (isLoading) {
      projectsEmpty.classList.add('hidden');
      projectSelect.disabled = true;
    } else {
      const { projects } = getState();
      if (!projects.length && projectsErrorEl.classList.contains('hidden') && !projectsSection.classList.contains('hidden')) {
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

  function renderProjectList() {
    const { projects } = getState();
    projectsList.innerHTML = '';
    projectSelect.innerHTML = '';

    if (!projects.length) {
      projectsList.classList.add('hidden');
      if (
        projectsErrorEl.classList.contains('hidden') &&
        !projectsSection.classList.contains('hidden') &&
        !getState().projectsLoading
      ) {
        projectsEmpty.classList.remove('hidden');
      } else {
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

  async function loadProjects() {
    const { currentSession, projectsLoading, projectsLoaded } = getState();
    if (!currentSession || !currentSession.accessToken || projectsLoading || projectsLoaded) {
      return;
    }

    setState({ projectsLoading: true });
    setProjectsError(null);
    setProjectsLoading(true);

    try {
      const response = await sendMessage({ type: 'projects:list' });
      if (!response?.ok) {
        throw new Error(response?.error || 'Unable to fetch projects');
      }

      const projects = Array.isArray(response.projects) ? response.projects : [];
      const defaultProjectId = response.defaultProjectId || null;
      const desiredSelected = getState().selectedProjectId || defaultProjectId;

      setState({
        projects,
        defaultProjectId,
        selectedProjectId: desiredSelected || null,
        projectsLoaded: true
      });

      renderProjectList();
    } catch (error) {
      console.error('[popup] load projects error', error);
      setState({ projectsLoaded: false });
      setProjectsError(error.message || 'Unable to fetch projects');
    } finally {
      setState({ projectsLoading: false });
      setProjectsLoading(false);
    }
  }

  async function handleProjectSelectChange(projectId) {
    try {
      await sendMessage({ type: 'projects:setDefault', projectId: projectId || null });
      setState({
        selectedProjectId: projectId || null,
        defaultProjectId: projectId || null
      });
      syncProjectSelect();
      updateMetadataUI();
    } catch (error) {
      console.error('[popup] set default project error', error);
    }
  }

  function syncProjectSelect() {
    if (!projectSelect || !projectSelect.options.length) {
      return;
    }

    const { selectedProjectId, defaultProjectId } = getState();
    const desired = selectedProjectId || defaultProjectId;
    if (desired) {
      const optionExists = Array.from(projectSelect.options).some((option) => option.value === desired);
      if (optionExists) {
        projectSelect.value = desired;
        setState({ selectedProjectId: projectSelect.value });
        return;
      }
    }

    if (!projectSelect.value && projectSelect.options.length) {
      projectSelect.value = projectSelect.options[0].value;
      setState({ selectedProjectId: projectSelect.value });
    }

    updateMetadataUI();
  }

  function init() {
    projectSelect.addEventListener('change', (event) => {
      const projectId = event.target.value;
      void handleProjectSelectChange(projectId);
    });
  }

  return {
    init,
    loadProjects,
    resetProjects,
    renderProjectList,
    setProjectsError,
    setProjectsLoading,
    syncProjectSelect
  };
}
