import test from 'node:test';
import assert from 'node:assert/strict';
import { STORAGE_KEY } from '../src/constants.js';
import { createSeedData } from '../src/seed.js';
import {
  loadBackendDataIfEnabled,
  saveData,
  waitForBackendMirror
} from '../src/storage.js';

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
