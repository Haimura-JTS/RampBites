import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY } from '../src/constants.js';
import { createSeedData } from '../src/seed.js';
import {
  loadBackendDataIfEnabled,
  saveData,
  waitForBackendMirror
} from '../src/storage.js';
import { mergeCollection, syncCollectionsWithBackend } from '../src/sync.js';

test('merge por coleccion trae remoto mas nuevo y sube local mas nuevo', () => {
  const result = mergeCollection(
    [
      { id: 'local-newer', name: 'Local', updatedAt: '2026-06-09T11:00:00.000Z' },
      { id: 'remote-newer', name: 'Viejo local', updatedAt: '2026-06-09T09:00:00.000Z' }
    ],
    [
      { id: 'local-newer', name: 'Viejo remoto', updatedAt: '2026-06-09T09:00:00.000Z' },
      { id: 'remote-newer', name: 'Remoto', updatedAt: '2026-06-09T12:00:00.000Z' }
    ],
    { collection: 'products', lastSyncAt: '2026-06-09T10:00:00.000Z' }
  );

  assert.equal(result.summary.toPush, 1);
  assert.equal(result.summary.pulled, 1);
  assert.equal(result.summary.conflicts, 0);
  assert.equal(result.items.find((item) => item.id === 'local-newer').name, 'Local');
  assert.equal(result.items.find((item) => item.id === 'remote-newer').name, 'Remoto');
});

test('merge por coleccion detecta conflicto y conserva local', () => {
  const result = mergeCollection(
    [{ id: 'prod-1', name: 'Version local', updatedAt: '2026-06-09T11:00:00.000Z' }],
    [{ id: 'prod-1', name: 'Version remota', updatedAt: '2026-06-09T11:30:00.000Z' }],
    { collection: 'products', lastSyncAt: '2026-06-09T10:00:00.000Z' }
  );

  assert.equal(result.summary.toPush, 1);
  assert.equal(result.summary.pulled, 0);
  assert.equal(result.summary.conflicts, 1);
  assert.equal(result.items[0].name, 'Version local');
  assert.deepEqual(result.conflicts[0], {
    collection: 'products',
    id: 'prod-1',
    localUpdatedAt: '2026-06-09T11:00:00.000Z',
    remoteUpdatedAt: '2026-06-09T11:30:00.000Z',
    resolution: 'local',
    reason: 'local_and_remote_changed'
  });
});

test('sync por coleccion usa endpoint raw y fusiona remoto en local', async () => {
  const data = createSeedData();
  data.products = [{ id: 'prod-local', name: 'Local', updatedAt: '2026-06-09T11:00:00.000Z' }];
  data.suppliers = [];

  const pushed = [];
  const client = {
    list: async (resource) => ({
      products: [{ id: 'prod-local', name: 'Remoto viejo', updatedAt: '2026-06-09T09:00:00.000Z' }],
      suppliers: [{ id: 'supplier-remote', name: 'Proveedor remoto', updatedAt: '2026-06-09T11:30:00.000Z' }]
    })[resource] ?? [],
    syncCollection: async (resource, items) => {
      pushed.push({ resource, items });
      return items;
    }
  };

  const result = await syncCollectionsWithBackend(data, client, {
    collections: ['products', 'suppliers'],
    lastSyncAt: '2026-06-09T10:00:00.000Z'
  });

  assert.equal(result.summary.pushed, 1);
  assert.equal(result.summary.pulled, 1);
  assert.equal(pushed.length, 1);
  assert.equal(pushed[0].resource, 'products');
  assert.equal(pushed[0].items[0].id, 'prod-local');
  assert.equal(result.data.suppliers[0].id, 'supplier-remote');
});

test('modo manual no envia datos al backend al guardar', async () => {
  const storage = setupLocalStorage();
  let fetchCalls = 0;
  global.fetch = async () => {
    fetchCalls += 1;
    return jsonResponse({ ok: true });
  };

  saveData(createSeedData());
  await waitForBackendMirror();

  assert.equal(fetchCalls, 0);
  teardownLocalStorage(storage);
});

test('modo api espejo envia datos locales al endpoint de datos', async () => {
  const storage = setupLocalStorage();
  const requests = [];
  global.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    return jsonResponse({ ok: true });
  };

  const data = createSeedData();
  data.settings.backend.baseUrl = 'http://backend.test/api';
  data.settings.backend.syncMode = 'api_mirror';

  saveData(data);
  const result = await waitForBackendMirror();

  assert.equal(result.ok, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'http://backend.test/api/data');
  assert.equal(requests[0].options.method, 'PUT');
  assert.equal(JSON.parse(requests[0].options.body).settings.backend.syncMode, 'api_mirror');
  teardownLocalStorage(storage);
});

test('arranque api espejo trae datos backend y conserva configuracion local', async () => {
  const storage = setupLocalStorage();
  const localData = createSeedData();
  localData.settings.backend.baseUrl = 'http://backend.test/api';
  localData.settings.backend.syncMode = 'api_mirror';
  storage.setItem(STORAGE_KEY, JSON.stringify(localData));

  const remoteData = createSeedData();
  remoteData.settings.businessName = 'Ramp Bites Backend';
  remoteData.settings.backend.syncMode = 'manual';

  const requests = [];
  global.fetch = async (url, options = {}) => {
    requests.push({ url, options });
    return jsonResponse({ ok: true, data: remoteData });
  };

  const result = await loadBackendDataIfEnabled();
  const stored = JSON.parse(storage.getItem(STORAGE_KEY));

  assert.equal(result.loaded, true);
  assert.equal(requests.length, 1);
  assert.equal(requests[0].url, 'http://backend.test/api/data');
  assert.equal(stored.settings.businessName, 'Ramp Bites Backend');
  assert.equal(stored.settings.backend.baseUrl, 'http://backend.test/api');
  assert.equal(stored.settings.backend.syncMode, 'api_mirror');
  assert.equal(stored.settings.backend.lastStatus, 'backend cargado al iniciar');
  teardownLocalStorage(storage);
});

function setupLocalStorage() {
  const storage = createMockLocalStorage();
  global.window = { localStorage: storage };
  return storage;
}

function teardownLocalStorage(storage) {
  storage.clear();
  delete global.fetch;
  delete global.window;
}

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

function createMockLocalStorage() {
  const store = new Map();
  return {
    _store: store,
    get length() {
      return store.size;
    },
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, String(value));
    },
    removeItem(key) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
    key(index) {
      return [...store.keys()][index] ?? null;
    }
  };
}
