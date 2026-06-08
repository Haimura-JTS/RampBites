import test from 'node:test';
import assert from 'node:assert/strict';
import { BACKUP_KEY, SCHEMA_VERSION, STORAGE_KEY } from '../src/constants.js';
import { createSeedData } from '../src/seed.js';
import {
  createManualBackup,
  getData,
  importData,
  listBackups,
  restoreBackup,
  saveData,
  validateBackup
} from '../src/storage.js';

test('importa datos legacy sin schemaVersion y los migra a schema actual', () => {
  const storage = setupLocalStorage();
  const imported = importData(JSON.stringify({
    products: [{ id: 'legacy-product', name: 'Legacy' }],
    settings: { businessName: 'Legacy Bites' }
  }));

  assert.equal(imported.schemaVersion, SCHEMA_VERSION);
  assert.equal(imported.metadata.migratedFromSchemaVersion, 0);
  assert.equal(imported.products[0].id, 'legacy-product');
  assert.equal(getData().settings.businessName, 'Legacy Bites');
  teardownLocalStorage(storage);
});

test('protege datos corruptos creando backup corrupt y devolviendo base limpia', () => {
  const storage = setupLocalStorage();
  storage.setItem(STORAGE_KEY, '{json-roto');
  const originalError = console.error;
  console.error = () => {};

  try {
    const data = getData();

    assert.equal(data.metadata.lastError, 'JSON corrupto en LocalStorage');
    assert.equal([...storage._store.keys()].some((key) => key.startsWith(`${BACKUP_KEY}:corrupt:`)), true);
  } finally {
    console.error = originalError;
    teardownLocalStorage(storage);
  }
});

test('crea, valida y restaura backup manual', () => {
  const storage = setupLocalStorage();
  const seed = createSeedData();
  saveData(seed);
  const backup = createManualBackup('manual-test');

  assert.equal(validateBackup(backup), true);
  assert.equal(listBackups().length, 1);

  saveData({ ...seed, products: [] });
  assert.equal(getData().products.length, 0);

  const restored = restoreBackup(backup.id);
  assert.equal(restored.products.length, seed.products.length);
  assert.equal(getData().products.length, seed.products.length);
  teardownLocalStorage(storage);
});

test('rechaza importaciones con schemaVersion futuro', () => {
  const storage = setupLocalStorage();
  assert.throws(
    () => importData(JSON.stringify({ schemaVersion: SCHEMA_VERSION + 1 })),
    /Version de esquema futura/
  );
  teardownLocalStorage(storage);
});

function setupLocalStorage() {
  const storage = createMockLocalStorage();
  global.window = { localStorage: storage };
  return storage;
}

function teardownLocalStorage(storage) {
  storage.clear();
  delete global.window;
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
