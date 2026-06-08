import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { CLIENT_CHANNELS } from '../src/constants.js';
import { createRampBitesApiClient } from '../src/apiClient.js';
import { createApiServer } from '../server/api.js';
import { createBackendDatabase, getCollectionCounts, seedDatabase } from '../server/database.js';

test('backend SQLite migra seed y conserva colecciones principales', async () => {
  const tmpRoot = await mkdtemp(join(tmpdir(), 'ramp-bites-backend-'));
  const dbPath = join(tmpRoot, 'ramp-bites.sqlite');
  const database = createBackendDatabase(dbPath);

  try {
    const data = seedDatabase(database.open());
    const counts = getCollectionCounts(database.open());

    assert.equal(data.schemaVersion, 1);
    assert.equal(counts.products > 0, true);
    assert.equal(counts.purchases > 0, true);
    assert.equal(counts.productionBatches > 0, true);
    assert.equal(database.readData().products.length, counts.products);
  } finally {
    database.close();
    await rm(tmpRoot, { recursive: true, force: true });
  }
});

test('backend API expone health, colecciones, escritura, reportes y backup', async () => {
  const tmpRoot = await mkdtemp(join(tmpdir(), 'ramp-bites-api-'));
  const dbPath = join(tmpRoot, 'api.sqlite');
  const database = createBackendDatabase(dbPath);
  seedDatabase(database.open());
  database.close();

  const api = createApiServer({ dbPath });
  await api.listen(0, '127.0.0.1');
  const port = api.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;
  const client = createRampBitesApiClient(baseUrl);

  try {
    const health = await client.health();
    assert.equal(health.ok, true);
    assert.equal(health.storage, 'sqlite');

    const products = await client.list('products');
    assert.equal(products.length > 0, true);

    const createdClient = await postJson(`${baseUrl}/clients`, {
      name: 'Cliente API',
      alias: 'api',
      channel: CLIENT_CHANNELS.WHATSAPP,
      contact: 'demo',
      deliveryZone: 'local',
      preferences: 'BBQ',
      allergies: '',
      notes: 'test backend'
    });
    assert.equal(createdClient.ok, true);
    assert.equal(createdClient.item.name, 'Cliente API');

    const dashboard = await client.report('dashboard');
    assert.equal(typeof dashboard, 'object');

    const backup = await client.createBackup();
    assert.match(backup.backup.filename, /\.sqlite$/);
    await rm(backup.backup.path, { force: true });
  } finally {
    await api.close();
    await rm(tmpRoot, { recursive: true, force: true });
  }
});

async function getJson(url) {
  const response = await fetch(url);
  assert.equal(response.ok, true);
  return response.json();
}

async function postJson(url, body) {
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  });
  assert.equal(response.ok, true);
  return response.json();
}
