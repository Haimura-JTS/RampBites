import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createSeedData } from '../src/seed.js';
import { renderKitchen } from '../src/views/kitchenView.js';

test('manifest define PWA instalable', async () => {
  const manifest = JSON.parse(await readFile(new URL('../manifest.json', import.meta.url), 'utf8'));

  assert.equal(manifest.name, 'Ramp Bites Control Panel');
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, './index.html');
  assert.equal(manifest.icons.some((icon) => icon.purpose === 'maskable'), true);
});

test('service worker precachea shell y vista cocina', async () => {
  const serviceWorker = await readFile(new URL('../service-worker.js', import.meta.url), 'utf8');

  assert.match(serviceWorker, /ramp-bites-control-panel-v0\.11\.0/);
  assert.match(serviceWorker, /src\/views\/kitchenView\.js/);
  assert.match(serviceWorker, /caches\.open/);
  assert.match(serviceWorker, /request\.mode === 'navigate'/);
});

test('vista cocina renderiza produccion, pedido, temporizador y checklist', () => {
  const html = renderKitchen({ data: createSeedData() });

  assert.match(html, /data-form="kitchen-production"/);
  assert.match(html, /data-form="kitchen-order"/);
  assert.match(html, /data-kitchen-timer-display/);
  assert.match(html, /data-kitchen-check="carne-pesada"/);
});
