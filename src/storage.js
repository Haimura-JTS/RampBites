import { createRampBitesApiClient, DEFAULT_API_BASE_URL } from './apiClient.js';
import { BACKUP_KEY, COLLECTIONS, DEFAULT_SETTINGS, SCHEMA_VERSION, STORAGE_KEY } from './constants.js';
import { createEmptyDatabase, migrateDatabase, normalizeDatabase } from './models.js';
import { createSeedData } from './seed.js';

export const BACKEND_SYNC_MODES = {
  MANUAL: 'manual',
  API_MIRROR: 'api_mirror'
};

let latestBackendMirror = Promise.resolve({
  ok: true,
  skipped: true,
  reason: 'not_started'
});

export function getData() {
  const storage = getLocalStorage();
  if (!storage) return createEmptyDatabase();

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return createEmptyDatabase();

  try {
    return migrateDatabase(JSON.parse(raw));
  } catch (error) {
    storage.setItem(`${BACKUP_KEY}:corrupt:${Date.now()}`, raw);
    console.error('Datos locales corruptos. Se conserva backup y se carga una base limpia.', error);
    return createEmptyDatabase({
      metadata: {
        lastError: 'JSON corrupto en LocalStorage'
      }
    });
  }
}

export function saveData(data, options = {}) {
  return saveDataInternal(data, {
    mirror: options.mirror !== false
  });
}

export async function loadBackendDataIfEnabled() {
  const current = getData();
  if (!isBackendMirrorEnabled(current)) {
    return {
      loaded: false,
      reason: 'disabled',
      data: current
    };
  }

  if (typeof fetch !== 'function') {
    return {
      loaded: false,
      reason: 'fetch_unavailable',
      data: current
    };
  }

  const baseUrl = getBackendBaseUrlFromData(current);
  const remoteData = await createRampBitesApiClient(baseUrl).getData();
  createBackup('before_backend_bootstrap');

  const now = new Date().toISOString();
  const data = saveDataInternal(
    applyBackendSettingsPatch(remoteData, {
      ...(current.settings?.backend ?? {}),
      baseUrl,
      syncMode: BACKEND_SYNC_MODES.API_MIRROR,
      lastStatus: 'backend cargado al iniciar',
      lastCheckedAt: now,
      lastSyncAt: now
    }),
    { mirror: false }
  );

  return {
    loaded: true,
    data
  };
}

export function isBackendMirrorEnabled(data = getData()) {
  return data?.settings?.backend?.syncMode === BACKEND_SYNC_MODES.API_MIRROR;
}

export function waitForBackendMirror() {
  return latestBackendMirror;
}

function saveDataInternal(data, options = {}) {
  const storage = getLocalStorage();
  if (!storage) return normalizeDatabase(data);

  const normalized = migrateDatabase({
    ...data,
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      ...(data.metadata ?? {}),
      updatedAt: new Date().toISOString()
    }
  });

  storage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  if (options.mirror !== false) queueBackendMirror(normalized);
  return normalized;
}

export function resetData() {
  createBackup('reset');
  const seed = createSeedData();
  return saveData(seed);
}

export function loadSeedData() {
  const current = getData();
  const hasData = COLLECTIONS.some((collection) => current[collection]?.length > 0);

  if (hasData || current.metadata?.lastError) {
    return current;
  }

  const seed = createSeedData();
  return saveData(seed);
}

export function exportData() {
  return JSON.stringify(getData(), null, 2);
}

export function importData(json) {
  createBackup('import');

  try {
    return saveData(parseDatabasePayload(json, 'importacion'));
  } catch (error) {
    throw new Error(`No se pudo importar: ${error.message}`);
  }
}

export function createManualBackup(reason = 'manual') {
  return createBackup(reason);
}

export function listBackups() {
  const storage = getLocalStorage();
  if (!storage) return [];
  const history = readBackupHistory(storage);
  const latest = storage.getItem(BACKUP_KEY);
  if (!latest) return history;

  try {
    const parsed = JSON.parse(latest);
    if (validateBackupEnvelope(parsed) && !history.some((backup) => backup.id === parsed.id)) {
      return [parsed, ...history].sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
    }
  } catch {
    return history;
  }

  return history;
}

export function restoreBackup(backupId = '') {
  const storage = getLocalStorage();
  if (!storage) throw new Error('LocalStorage no esta disponible.');

  const backups = listBackups();
  const backup = backupId
    ? backups.find((item) => item.id === backupId)
    : backups[0];
  if (!backup) throw new Error('No hay backup disponible para restaurar.');

  createBackup('before_restore');
  try {
    return saveData(parseDatabasePayload(backup.data, 'backup'));
  } catch (error) {
    throw new Error(`No se pudo restaurar backup: ${error.message}`);
  }
}

export function validateBackup(backup) {
  return validateBackupEnvelope(backup);
}

export function generateId(prefix = 'id') {
  const randomPart = Math.random().toString(36).slice(2, 8);
  return `${prefix}-${Date.now().toString(36)}-${randomPart}`;
}

export function getById(collection, id) {
  const data = getData();
  return getCollection(data, collection).find((item) => item.id === id) ?? null;
}

export function upsert(collection, item) {
  assertCollection(collection);
  const data = getData();
  const now = new Date().toISOString();
  const items = getCollection(data, collection);
  const id = item.id ?? generateId(collection);
  const existingIndex = items.findIndex((entry) => entry.id === id);
  const nextItem = {
    ...item,
    id,
    createdAt: item.createdAt ?? items[existingIndex]?.createdAt ?? now,
    updatedAt: now
  };

  if (existingIndex >= 0) {
    items[existingIndex] = nextItem;
  } else {
    items.push(nextItem);
  }

  return saveData(data);
}

export function remove(collection, id) {
  assertCollection(collection);
  const data = getData();
  data[collection] = getCollection(data, collection).filter((item) => item.id !== id);
  return saveData(data);
}

function createBackup(reason) {
  const storage = getLocalStorage();
  if (!storage) return null;

  const raw = storage.getItem(STORAGE_KEY);
  if (!raw) return null;

  const backup = {
    id: generateId('backup'),
    reason,
    createdAt: new Date().toISOString(),
    data: raw
  };

  storage.setItem(BACKUP_KEY, JSON.stringify(backup));
  pushBackupHistory(storage, backup);
  return backup;
}

function readBackupHistory(storage) {
  try {
    const raw = storage.getItem(`${BACKUP_KEY}:history`);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter(validateBackupEnvelope).sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
      : [];
  } catch {
    return [];
  }
}

function pushBackupHistory(storage, backup) {
  if (!validateBackupEnvelope(backup)) return;
  const history = readBackupHistory(storage)
    .filter((item) => item.id !== backup.id);
  history.unshift(backup);
  storage.setItem(`${BACKUP_KEY}:history`, JSON.stringify(history.slice(0, 10)));
}

function parseDatabasePayload(payload, label) {
  const parsed = typeof payload === 'string' ? JSON.parse(payload) : payload;
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(`El JSON de ${label} no es un objeto valido.`);
  }
  return migrateDatabase(parsed);
}

function validateBackupEnvelope(backup) {
  if (!backup || typeof backup !== 'object' || Array.isArray(backup)) return false;
  if (!backup.id || !backup.createdAt || typeof backup.data !== 'string') return false;
  try {
    parseDatabasePayload(backup.data, 'backup');
    return true;
  } catch {
    return false;
  }
}

function queueBackendMirror(data) {
  if (!isBackendMirrorEnabled(data) || typeof fetch !== 'function') return;

  const payload = cloneForTransport(data);
  latestBackendMirror = sendBackendMirror(payload);
}

async function sendBackendMirror(data) {
  try {
    await createRampBitesApiClient(getBackendBaseUrlFromData(data)).replaceData(data);
    return {
      ok: true,
      syncedAt: new Date().toISOString()
    };
  } catch (error) {
    console.warn('No se pudo sincronizar con backend en modo espejo.', error);
    return {
      ok: false,
      error
    };
  }
}

function getBackendBaseUrlFromData(data) {
  return data?.settings?.backend?.baseUrl || DEFAULT_API_BASE_URL;
}

function applyBackendSettingsPatch(data, patch) {
  return {
    ...data,
    settings: {
      ...DEFAULT_SETTINGS,
      ...(data.settings ?? {}),
      backend: {
        ...DEFAULT_SETTINGS.backend,
        ...(data.settings?.backend ?? {}),
        ...patch
      }
    }
  };
}

function cloneForTransport(data) {
  return JSON.parse(JSON.stringify(data));
}

function getCollection(data, collection) {
  assertCollection(collection);
  if (!Array.isArray(data[collection])) data[collection] = [];
  return data[collection];
}

function assertCollection(collection) {
  if (!COLLECTIONS.includes(collection)) {
    throw new Error(`Coleccion no soportada: ${collection}`);
  }
}

function getLocalStorage() {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    return window.localStorage;
  } catch {
    return null;
  }
}
