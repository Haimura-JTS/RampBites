export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8787/api';
export const BACKEND_AUTH_TOKEN_KEY = 'ramp-bites-control-panel:backend-auth-token';

export function createRampBitesApiClient(baseUrl = DEFAULT_API_BASE_URL, options = {}) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');
  const getToken = options.getToken ?? getStoredBackendAuthToken;

  return {
    health: () => requestJson(normalizedBaseUrl, '/health', { getToken }),
    authStatus: () => requestJson(normalizedBaseUrl, '/auth/status', { getToken }).then((response) => response.auth),
    bootstrapAuth: (credentials) => requestJson(normalizedBaseUrl, '/auth/bootstrap', { method: 'POST', body: credentials, getToken }),
    login: (credentials) => requestJson(normalizedBaseUrl, '/auth/login', { method: 'POST', body: credentials, getToken }),
    logout: () => requestJson(normalizedBaseUrl, '/auth/logout', { method: 'POST', getToken }),
    me: () => requestJson(normalizedBaseUrl, '/auth/me', { getToken }).then((response) => response.user),
    listUsers: () => requestJson(normalizedBaseUrl, '/auth/users', { getToken }).then((response) => response.users),
    createUser: (user) => requestJson(normalizedBaseUrl, '/auth/users', { method: 'POST', body: user, getToken }),
    deactivateUser: (id) => requestJson(normalizedBaseUrl, `/auth/users/${encodeURIComponent(id)}/deactivate`, { method: 'POST', getToken }),
    getData: () => requestJson(normalizedBaseUrl, '/data', { getToken }).then((response) => response.data),
    replaceData: (data) => requestJson(normalizedBaseUrl, '/data', { method: 'PUT', body: data, getToken }),
    importJson: (data) => requestJson(normalizedBaseUrl, '/import/json', { method: 'POST', body: data, getToken }),
    seed: () => requestJson(normalizedBaseUrl, '/seed', { method: 'POST', getToken }),
    list: (resource) => requestJson(normalizedBaseUrl, `/${resource}`, { getToken }).then((response) => response.items),
    get: (resource, id) => requestJson(normalizedBaseUrl, `/${resource}/${encodeURIComponent(id)}`, { getToken }).then((response) => response.item),
    create: (resource, item) => requestJson(normalizedBaseUrl, `/${resource}`, { method: 'POST', body: item, getToken }),
    update: (resource, id, patch) => requestJson(normalizedBaseUrl, `/${resource}/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch, getToken }),
    remove: (resource, id) => requestJson(normalizedBaseUrl, `/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE', getToken }),
    syncCollection: (resource, items) => requestJson(normalizedBaseUrl, `/sync/${resource}`, { method: 'POST', body: { items }, getToken }).then((response) => response.items),
    action: (resource, id, action, body = {}) => requestJson(
      normalizedBaseUrl,
      `/${resource}/${encodeURIComponent(id)}/${action}`,
      { method: 'POST', body, getToken }
    ),
    report: (name) => requestJson(normalizedBaseUrl, `/reports/${name}`, { getToken }).then((response) => response.report),
    createBackup: () => requestJson(normalizedBaseUrl, '/backups', { method: 'POST', getToken }),
    listBackups: () => requestJson(normalizedBaseUrl, '/backups', { getToken }).then((response) => response.backups)
  };
}

export function getStoredBackendAuthToken() {
  try {
    return window.sessionStorage?.getItem(BACKEND_AUTH_TOKEN_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredBackendAuthToken(token) {
  try {
    if (token) window.sessionStorage?.setItem(BACKEND_AUTH_TOKEN_KEY, token);
    else window.sessionStorage?.removeItem(BACKEND_AUTH_TOKEN_KEY);
  } catch {
    // Session storage can be unavailable in tests or restricted browsers.
  }
}

export function clearStoredBackendAuthToken() {
  setStoredBackendAuthToken('');
}

async function requestJson(baseUrl, path, options = {}) {
  const token = typeof options.getToken === 'function' ? options.getToken() : '';
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {})
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body)
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok || payload.ok === false) {
    const message = payload.error || payload.errors?.join?.(' ') || `HTTP ${response.status}`;
    throw new Error(message);
  }

  return payload;
}
