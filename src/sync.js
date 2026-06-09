import { COLLECTIONS } from './constants.js';

export const COLLECTION_SYNC_RESOURCES = {
  products: 'products',
  suppliers: 'suppliers',
  purchases: 'purchases',
  priceHistory: 'price-history',
  stockMovements: 'stock-movements',
  productionBatches: 'production-batches',
  lots: 'lots',
  recipes: 'recipes',
  clients: 'clients',
  orders: 'orders',
  feedback: 'feedback'
};

export function mergeCollection(localItems = [], remoteItems = [], options = {}) {
  const collection = options.collection ?? '';
  const lastSyncAt = options.lastSyncAt ?? '';
  const localMap = mapById(localItems);
  const remoteMap = mapById(remoteItems);
  const remoteIds = new Set(remoteMap.keys());
  const ids = [...new Set([...localMap.keys(), ...remoteMap.keys()])].sort();
  const items = [];
  const toPush = [];
  const pulled = [];
  const conflicts = [];

  for (const id of ids) {
    const local = localMap.get(id);
    const remote = remoteMap.get(id);

    if (local && !remote) {
      const item = clone(local);
      items.push(item);
      toPush.push(item);
      continue;
    }

    if (!local && remote) {
      const item = clone(remote);
      items.push(item);
      pulled.push(item);
      continue;
    }

    if (samePayload(local, remote)) {
      items.push(clone(local));
      continue;
    }

    const localChanged = wasChangedAfter(local, lastSyncAt);
    const remoteChanged = wasChangedAfter(remote, lastSyncAt);
    if (lastSyncAt && localChanged && remoteChanged) {
      const item = clone(local);
      items.push(item);
      toPush.push(item);
      conflicts.push({
        collection,
        id,
        localUpdatedAt: getItemTimestamp(local),
        remoteUpdatedAt: getItemTimestamp(remote),
        resolution: 'local',
        reason: 'local_and_remote_changed'
      });
      continue;
    }

    if (!lastSyncAt || localChanged || remoteChanged) {
      const winner = chooseNewerItem(local, remote);
      const item = clone(winner.item);
      items.push(item);
      if (winner.source === 'local') toPush.push(item);
      else pulled.push(item);
      continue;
    }

    const fallback = chooseNewerItem(local, remote);
    const item = clone(fallback.item);
    items.push(item);
    if (fallback.source === 'local') toPush.push(item);
    else pulled.push(item);
  }

  return {
    items,
    toPush,
    pulled,
    conflicts,
    remoteIds,
    summary: {
      local: localMap.size,
      remote: remoteMap.size,
      merged: items.length,
      toPush: toPush.length,
      pulled: pulled.length,
      conflicts: conflicts.length
    }
  };
}

export function mergeBackendCollections(localData, remoteCollections = {}, options = {}) {
  const collections = options.collections ?? COLLECTIONS;
  const lastSyncAtByCollection = options.lastSyncAtByCollection ?? {};
  const data = clone(localData);
  const collectionResults = {};
  const conflicts = [];
  const summary = {
    collections: 0,
    pushed: 0,
    pulled: 0,
    conflicts: 0
  };

  for (const collection of collections) {
    const result = mergeCollection(data[collection] ?? [], remoteCollections[collection] ?? [], {
      collection,
      lastSyncAt: lastSyncAtByCollection[collection] ?? options.lastSyncAt ?? ''
    });
    data[collection] = result.items;
    collectionResults[collection] = result;
    conflicts.push(...result.conflicts);
    summary.collections += 1;
    summary.pushed += result.toPush.length;
    summary.pulled += result.pulled.length;
    summary.conflicts += result.conflicts.length;
  }

  return {
    data,
    collectionResults,
    conflicts,
    summary
  };
}

export async function syncCollectionsWithBackend(localData, client, options = {}) {
  if (!client || typeof client.list !== 'function') {
    throw new Error('Cliente backend no disponible para sincronizacion por coleccion.');
  }
  if (typeof client.syncCollection !== 'function') {
    throw new Error('El backend no soporta sincronizacion por coleccion. Actualiza el servidor local.');
  }

  const collections = options.collections ?? COLLECTIONS;
  const remoteCollections = {};
  for (const collection of collections) {
    remoteCollections[collection] = await client.list(getSyncResource(collection));
  }

  const result = mergeBackendCollections(localData, remoteCollections, {
    ...options,
    collections
  });

  const pushedByCollection = {};
  for (const collection of collections) {
    const toPush = result.collectionResults[collection].toPush;
    pushedByCollection[collection] = toPush.length;
    if (toPush.length > 0) {
      await client.syncCollection(getSyncResource(collection), toPush);
    }
  }

  return {
    ...result,
    pushedByCollection
  };
}

export function getSyncResource(collection) {
  const resource = COLLECTION_SYNC_RESOURCES[collection];
  if (!resource) throw new Error(`Coleccion no soportada para sync: ${collection}`);
  return resource;
}

function mapById(items) {
  const map = new Map();
  for (const item of items ?? []) {
    if (item?.id) map.set(item.id, item);
  }
  return map;
}

function chooseNewerItem(local, remote) {
  const comparison = compareTimestamps(getItemTimestamp(local), getItemTimestamp(remote));
  if (comparison >= 0) return { source: 'local', item: local };
  return { source: 'remote', item: remote };
}

function wasChangedAfter(item, lastSyncAt) {
  if (!lastSyncAt) return true;
  return compareTimestamps(getItemTimestamp(item), lastSyncAt) > 0;
}

function getItemTimestamp(item) {
  return item?.updatedAt || item?.createdAt || item?.date || item?.orderDate || '';
}

function compareTimestamps(left, right) {
  const leftTime = Date.parse(left || '');
  const rightTime = Date.parse(right || '');
  if (Number.isFinite(leftTime) && Number.isFinite(rightTime)) return leftTime - rightTime;
  return String(left || '').localeCompare(String(right || ''));
}

function samePayload(left, right) {
  return stableStringify(left) === stableStringify(right);
}

function stableStringify(value) {
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  if (!value || typeof value !== 'object') return JSON.stringify(value);
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableStringify(value[key])}`).join(',')}}`;
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}
