import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedData } from '../src/seed.js';
import {
  ADMIN_SESSION_KEY,
  describeSecurityStatus,
  getSecuritySettings,
  isAdminUnlocked,
  lockAdminSession,
  setAdminPin,
  unlockAdminSession,
  verifyAdminPin
} from '../src/auth.js';
import { saveSettings } from '../src/services/businessService.js';

test('PIN admin se guarda hasheado y permite verificacion', async () => {
  const data = createSeedData();
  const result = await setAdminPin(data, '1234');

  assert.equal(result.ok, true);
  assert.equal(result.data.settings.security.localAuthEnabled, true);
  assert.notEqual(result.data.settings.security.adminPinHash, '1234');
  assert.equal(result.data.settings.security.adminPinHash.length, 64);
  assert.equal(await verifyAdminPin(result.data, '1234'), true);
  assert.equal(await verifyAdminPin(result.data, '0000'), false);
});

test('sesion admin se desbloquea y se puede bloquear', async () => {
  const storage = setupSessionStorage();
  const withPin = (await setAdminPin(createSeedData(), '2468')).data;
  const unlocked = await unlockAdminSession(withPin, '2468');

  assert.equal(unlocked.ok, true);
  assert.equal(isAdminUnlocked(unlocked.data), true);
  assert.equal(JSON.parse(storage.getItem(ADMIN_SESSION_KEY)).role, 'admin');

  const locked = lockAdminSession(unlocked.data);
  assert.equal(isAdminUnlocked(locked), false);
  assert.equal(storage.getItem(ADMIN_SESSION_KEY), null);
  teardownSessionStorage(storage);
});

test('configuracion activa proteccion local y conserva hash existente', async () => {
  const data = (await setAdminPin(createSeedData(), '1357')).data;
  const hash = data.settings.security.adminPinHash;
  const result = saveSettings(data, {
    businessName: 'Ramp Bites',
    currency: 'EUR',
    locale: 'es-ES',
    targetBasePrice: 5,
    minimumMultiplier: 2,
    healthyMultiplier: 2.5,
    premiumMultiplier: 3,
    lowStockThreshold: 5,
    cookedFridgeMaxDays: 2,
    cookedFrozenMaxDays: 30,
    defaultMeatPerBurritoG: 100,
    demoMode: true,
    beefStatusNote: 'Ternera standby',
    backendBaseUrl: 'http://127.0.0.1:8787/api',
    backendSyncMode: 'manual',
    localAuthEnabled: true,
    adminSessionMinutes: 15
  });

  assert.equal(result.ok, true);
  assert.equal(getSecuritySettings(result.data).localAuthEnabled, true);
  assert.equal(getSecuritySettings(result.data).adminSessionMinutes, 15);
  assert.equal(getSecuritySettings(result.data).adminPinHash, hash);
  assert.equal(describeSecurityStatus(result.data), 'admin bloqueado');
});

function setupSessionStorage() {
  const storage = createMockStorage();
  global.window = {
    sessionStorage: storage
  };
  return storage;
}

function teardownSessionStorage(storage) {
  storage.clear();
  delete global.window;
}

function createMockStorage() {
  const store = new Map();
  return {
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
    }
  };
}
