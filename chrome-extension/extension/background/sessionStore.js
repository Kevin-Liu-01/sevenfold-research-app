const SESSION_KEY = 'supabaseSession';
const PKCE_KEY = 'supabasePkce';

export async function saveSession(session) {
  await chrome.storage.session.set({ [SESSION_KEY]: session });
}

export async function getSession() {
  const stored = await chrome.storage.session.get(SESSION_KEY);
  return stored[SESSION_KEY] ?? null;
}

export async function clearSession() {
  await chrome.storage.session.remove(SESSION_KEY);
}

export async function savePkceState(state) {
  await chrome.storage.session.set({ [PKCE_KEY]: state });
}

export async function getPkceState() {
  const stored = await chrome.storage.session.get(PKCE_KEY);
  return stored[PKCE_KEY] ?? null;
}

export async function clearPkceState() {
  await chrome.storage.session.remove(PKCE_KEY);
}
