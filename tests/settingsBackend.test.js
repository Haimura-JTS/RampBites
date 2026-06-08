import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedData } from '../src/seed.js';
import { saveSettings } from '../src/services/businessService.js';
import { renderSettings } from '../src/views/settingsView.js';

test('configuracion guarda URL y modo de backend', () => {
  const data = createSeedData();
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
    backendSyncMode: 'api_mirror'
  });

  assert.equal(result.ok, true);
  assert.equal(result.item.backend.baseUrl, 'http://127.0.0.1:8787/api');
  assert.equal(result.item.backend.syncMode, 'api_mirror');
});

test('vista configuracion renderiza controles de sincronizacion backend', () => {
  const html = renderSettings({
    data: createSeedData(),
    actions: {
      listBackups: () => []
    }
  });

  assert.match(html, /name="backendBaseUrl"/);
  assert.match(html, /api_mirror/);
  assert.match(html, /data-action="backend-health"/);
  assert.match(html, /data-action="backend-push"/);
  assert.match(html, /data-action="backend-pull"/);
  assert.match(html, /data-action="backend-backup"/);
});
