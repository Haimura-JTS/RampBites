export const DEFAULT_API_BASE_URL = 'http://127.0.0.1:8787/api';

export function createRampBitesApiClient(baseUrl = DEFAULT_API_BASE_URL) {
  const normalizedBaseUrl = baseUrl.replace(/\/$/, '');

  return {
    health: () => requestJson(normalizedBaseUrl, '/health'),
    getData: () => requestJson(normalizedBaseUrl, '/data').then((response) => response.data),
    replaceData: (data) => requestJson(normalizedBaseUrl, '/data', { method: 'PUT', body: data }),
    importJson: (data) => requestJson(normalizedBaseUrl, '/import/json', { method: 'POST', body: data }),
    seed: () => requestJson(normalizedBaseUrl, '/seed', { method: 'POST' }),
    list: (resource) => requestJson(normalizedBaseUrl, `/${resource}`).then((response) => response.items),
    get: (resource, id) => requestJson(normalizedBaseUrl, `/${resource}/${encodeURIComponent(id)}`).then((response) => response.item),
    create: (resource, item) => requestJson(normalizedBaseUrl, `/${resource}`, { method: 'POST', body: item }),
    update: (resource, id, patch) => requestJson(normalizedBaseUrl, `/${resource}/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch }),
    remove: (resource, id) => requestJson(normalizedBaseUrl, `/${resource}/${encodeURIComponent(id)}`, { method: 'DELETE' }),
    action: (resource, id, action, body = {}) => requestJson(
      normalizedBaseUrl,
      `/${resource}/${encodeURIComponent(id)}/${action}`,
      { method: 'POST', body }
    ),
    report: (name) => requestJson(normalizedBaseUrl, `/reports/${name}`).then((response) => response.report),
    createBackup: () => requestJson(normalizedBaseUrl, '/backups', { method: 'POST' }),
    listBackups: () => requestJson(normalizedBaseUrl, '/backups').then((response) => response.backups)
  };
}

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
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
