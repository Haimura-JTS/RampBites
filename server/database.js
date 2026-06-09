import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { COLLECTIONS, SCHEMA_VERSION } from '../src/constants.js';
import { createEmptyDatabase, migrateDatabase } from '../src/models.js';
import { createSeedData } from '../src/seed.js';
import { generateId } from '../src/storage.js';
import { migrateAuthSchema } from './auth.js';
import { BACKUP_DIR, DEFAULT_DB_PATH, ensureBackendDirs } from './paths.js';

export const COLLECTION_TABLES = {
  products: 'products',
  suppliers: 'suppliers',
  purchases: 'purchases',
  priceHistory: 'price_history',
  stockMovements: 'stock_movements',
  productionBatches: 'production_batches',
  lots: 'lots',
  recipes: 'recipes',
  clients: 'clients',
  orders: 'orders',
  feedback: 'feedback'
};

const CHILD_TABLES = ['purchase_items', 'production_inputs', 'recipe_items', 'order_items'];
const COLLECTION_TABLE_NAMES = Object.values(COLLECTION_TABLES);

export class BackendDatabase {
  constructor(dbPath = DEFAULT_DB_PATH) {
    this.dbPath = dbPath;
    this.db = null;
  }

  open() {
    if (this.db) return this.db;
    ensureBackendDirs();
    mkdirSync(dirname(this.dbPath), { recursive: true });
    this.db = new DatabaseSync(this.dbPath);
    this.db.exec('PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;');
    migrateSchema(this.db);
    return this.db;
  }

  close() {
    if (!this.db) return;
    this.db.close();
    this.db = null;
  }

  readData() {
    return readDatabaseData(this.open());
  }

  replaceData(data) {
    return replaceDatabaseData(this.open(), data);
  }

  restoreBackup(filename) {
    const source = resolve(BACKUP_DIR, filename);
    if (!source.startsWith(resolve(BACKUP_DIR)) || !existsSync(source)) {
      throw new Error('Backup no encontrado.');
    }

    this.close();
    copyFileSync(source, this.dbPath);
    this.open();
    return this.readData();
  }
}

export function createBackendDatabase(dbPath = DEFAULT_DB_PATH) {
  const database = new BackendDatabase(dbPath);
  database.open();
  return database;
}

export function migrateSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS app_metadata (
      key TEXT PRIMARY KEY,
      value_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      id TEXT PRIMARY KEY,
      payload_json TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      label TEXT,
      status TEXT,
      date TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS suppliers (
      id TEXT PRIMARY KEY,
      label TEXT,
      status TEXT,
      date TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS purchases (
      id TEXT PRIMARY KEY,
      label TEXT,
      status TEXT,
      date TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS purchase_items (
      id TEXT PRIMARY KEY,
      purchase_id TEXT NOT NULL,
      product_id TEXT,
      quantity REAL,
      unit TEXT,
      total_price REAL,
      unit_cost REAL,
      payload_json TEXT NOT NULL,
      FOREIGN KEY (purchase_id) REFERENCES purchases(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS price_history (
      id TEXT PRIMARY KEY,
      label TEXT,
      status TEXT,
      date TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id TEXT PRIMARY KEY,
      label TEXT,
      status TEXT,
      date TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS production_batches (
      id TEXT PRIMARY KEY,
      label TEXT,
      status TEXT,
      date TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS production_inputs (
      id TEXT PRIMARY KEY,
      batch_id TEXT NOT NULL,
      product_id TEXT,
      lot_id TEXT,
      quantity REAL,
      unit TEXT,
      cost REAL,
      payload_json TEXT NOT NULL,
      FOREIGN KEY (batch_id) REFERENCES production_batches(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS lots (
      id TEXT PRIMARY KEY,
      label TEXT,
      status TEXT,
      date TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS recipes (
      id TEXT PRIMARY KEY,
      label TEXT,
      status TEXT,
      date TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS recipe_items (
      id TEXT PRIMARY KEY,
      recipe_id TEXT NOT NULL,
      product_id TEXT,
      quantity REAL,
      unit TEXT,
      ingredient_group TEXT,
      required INTEGER,
      optional INTEGER,
      extra_available INTEGER,
      payload_json TEXT NOT NULL,
      FOREIGN KEY (recipe_id) REFERENCES recipes(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS clients (
      id TEXT PRIMARY KEY,
      label TEXT,
      status TEXT,
      date TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS orders (
      id TEXT PRIMARY KEY,
      label TEXT,
      status TEXT,
      date TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id TEXT PRIMARY KEY,
      order_id TEXT NOT NULL,
      recipe_id TEXT,
      quantity REAL,
      unit_price REAL,
      unit_cost REAL,
      payload_json TEXT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS feedback (
      id TEXT PRIMARY KEY,
      label TEXT,
      status TEXT,
      date TEXT,
      payload_json TEXT NOT NULL,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      payload_json TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      payload_json TEXT,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      actor_id TEXT,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id TEXT,
      payload_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(date);
    CREATE INDEX IF NOT EXISTS idx_lots_status ON lots(status);
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
    CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
    CREATE INDEX IF NOT EXISTS idx_purchase_items_purchase ON purchase_items(purchase_id);
    CREATE INDEX IF NOT EXISTS idx_recipe_items_recipe ON recipe_items(recipe_id);
    CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
  `);

  db.prepare('INSERT OR IGNORE INTO schema_migrations (version, applied_at) VALUES (?, ?)').run(1, nowIso());
  migrateAuthSchema(db);
}

export function replaceDatabaseData(db, input) {
  const data = migrateDatabase(input);

  db.exec('BEGIN IMMEDIATE');
  try {
    for (const table of CHILD_TABLES) db.exec(`DELETE FROM ${table}`);
    for (const table of COLLECTION_TABLE_NAMES) db.exec(`DELETE FROM ${table}`);
    db.exec('DELETE FROM settings');
    db.exec('DELETE FROM app_metadata');

    upsertMetadata(db, 'schemaVersion', data.schemaVersion);
    upsertMetadata(db, 'metadata', data.metadata ?? {});
    upsertSettings(db, data.settings ?? {});

    for (const collection of COLLECTIONS) {
      const table = COLLECTION_TABLES[collection];
      for (const item of data[collection] ?? []) {
        upsertCollectionPayload(db, table, item);
        syncChildRows(db, collection, item);
      }
    }

    db.exec('COMMIT');
    return readDatabaseData(db);
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function seedDatabase(db) {
  return replaceDatabaseData(db, createSeedData());
}

export function readDatabaseData(db) {
  const metadata = readMetadata(db);
  const data = createEmptyDatabase({
    metadata: metadata.metadata ?? {},
    settings: readSettings(db)
  });
  data.schemaVersion = Number(metadata.schemaVersion ?? SCHEMA_VERSION);

  for (const collection of COLLECTIONS) {
    data[collection] = readCollection(db, collection);
  }

  return migrateDatabase(data);
}

export function readCollection(db, collection) {
  const table = assertCollectionTable(collection);
  return db.prepare(`SELECT payload_json FROM ${table} ORDER BY COALESCE(date, created_at, updated_at, id), id`)
    .all()
    .map((row) => parseJson(row.payload_json, {}));
}

export function readCollectionItem(db, collection, id) {
  const table = assertCollectionTable(collection);
  const row = db.prepare(`SELECT payload_json FROM ${table} WHERE id = ?`).get(id);
  return row ? parseJson(row.payload_json, null) : null;
}

export function upsertCollectionItem(db, collection, item) {
  const table = assertCollectionTable(collection);
  const nextItem = {
    ...item,
    id: item.id || generateId(collection),
    updatedAt: item.updatedAt ?? nowIso(),
    createdAt: item.createdAt ?? nowIso()
  };
  upsertCollectionPayload(db, table, nextItem);
  syncChildRows(db, collection, nextItem);
  return nextItem;
}

export function deleteCollectionItem(db, collection, id) {
  const table = assertCollectionTable(collection);
  const result = db.prepare(`DELETE FROM ${table} WHERE id = ?`).run(id);
  return result.changes ?? 0;
}

export function readSettings(db) {
  const row = db.prepare('SELECT payload_json FROM settings WHERE id = ?').get('default');
  return row ? parseJson(row.payload_json, {}) : createEmptyDatabase().settings;
}

export function upsertSettings(db, settings) {
  db.prepare(`
    INSERT INTO settings (id, payload_json, updated_at)
    VALUES ('default', ?, ?)
    ON CONFLICT(id) DO UPDATE SET payload_json = excluded.payload_json, updated_at = excluded.updated_at
  `).run(JSON.stringify(settings ?? {}), nowIso());
}

export function getCollectionCounts(db) {
  return Object.fromEntries(
    Object.entries(COLLECTION_TABLES).map(([collection, table]) => {
      const row = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get();
      return [collection, row.count];
    })
  );
}

export function createDatabaseBackup(db, dbPath, reason = 'manual') {
  db.exec('PRAGMA wal_checkpoint(FULL)');
  mkdirSync(BACKUP_DIR, { recursive: true });
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `ramp-bites-${reason}-${timestamp}.sqlite`;
  const targetPath = join(BACKUP_DIR, filename);
  copyFileSync(dbPath, targetPath);
  return {
    filename,
    path: targetPath,
    reason,
    createdAt: nowIso(),
    sizeBytes: statSync(targetPath).size
  };
}

export function listDatabaseBackups() {
  mkdirSync(BACKUP_DIR, { recursive: true });
  return readdirSync(BACKUP_DIR)
    .filter((file) => file.endsWith('.sqlite'))
    .map((file) => {
      const fullPath = join(BACKUP_DIR, file);
      const stat = statSync(fullPath);
      return {
        filename: file,
        path: fullPath,
        sizeBytes: stat.size,
        createdAt: stat.birthtime.toISOString(),
        updatedAt: stat.mtime.toISOString()
      };
    })
    .sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt)));
}

export function safeBackupFilename(filename) {
  if (!filename || basename(filename) !== filename || !filename.endsWith('.sqlite')) {
    throw new Error('Nombre de backup no valido.');
  }
  return filename;
}

function upsertCollectionPayload(db, table, item) {
  const payload = JSON.stringify(item);
  db.prepare(`
    INSERT INTO ${table} (id, label, status, date, payload_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      label = excluded.label,
      status = excluded.status,
      date = excluded.date,
      payload_json = excluded.payload_json,
      created_at = excluded.created_at,
      updated_at = excluded.updated_at
  `).run(
    item.id,
    getItemLabel(item),
    getItemStatus(item),
    getItemDate(item),
    payload,
    item.createdAt ?? item.created_at ?? null,
    item.updatedAt ?? item.updated_at ?? null
  );
}

function syncChildRows(db, collection, item) {
  if (collection === 'purchases') return syncPurchaseItems(db, item);
  if (collection === 'productionBatches') return syncProductionInputs(db, item);
  if (collection === 'recipes') return syncRecipeItems(db, item);
  if (collection === 'orders') return syncOrderItems(db, item);
  return null;
}

function syncPurchaseItems(db, purchase) {
  db.prepare('DELETE FROM purchase_items WHERE purchase_id = ?').run(purchase.id);
  const statement = db.prepare(`
    INSERT INTO purchase_items (id, purchase_id, product_id, quantity, unit, total_price, unit_cost, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of purchase.items ?? []) {
    statement.run(
      item.id || generateId('purchase-item'),
      purchase.id,
      item.productId ?? '',
      Number(item.quantity) || 0,
      item.unit ?? '',
      Number(item.totalPrice) || 0,
      Number(item.unitCost) || 0,
      JSON.stringify(item)
    );
  }
}

function syncProductionInputs(db, batch) {
  db.prepare('DELETE FROM production_inputs WHERE batch_id = ?').run(batch.id);
  const statement = db.prepare(`
    INSERT INTO production_inputs (id, batch_id, product_id, lot_id, quantity, unit, cost, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of batch.inputs ?? []) {
    statement.run(
      item.id || generateId('production-input'),
      batch.id,
      item.productId ?? '',
      item.lotId ?? '',
      Number(item.quantity) || 0,
      item.unit ?? '',
      Number(item.cost) || 0,
      JSON.stringify(item)
    );
  }
}

function syncRecipeItems(db, recipe) {
  db.prepare('DELETE FROM recipe_items WHERE recipe_id = ?').run(recipe.id);
  const statement = db.prepare(`
    INSERT INTO recipe_items (id, recipe_id, product_id, quantity, unit, ingredient_group, required, optional, extra_available, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of recipe.ingredients ?? []) {
    statement.run(
      item.id || generateId('recipe-item'),
      recipe.id,
      item.productId ?? '',
      Number(item.quantity) || 0,
      item.unit ?? '',
      item.group ?? item.role ?? '',
      item.required === false ? 0 : 1,
      item.optional ? 1 : 0,
      item.extraAvailable ? 1 : 0,
      JSON.stringify(item)
    );
  }
}

function syncOrderItems(db, order) {
  db.prepare('DELETE FROM order_items WHERE order_id = ?').run(order.id);
  const statement = db.prepare(`
    INSERT INTO order_items (id, order_id, recipe_id, quantity, unit_price, unit_cost, payload_json)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  for (const item of order.items ?? []) {
    statement.run(
      item.id || generateId('order-item'),
      order.id,
      item.recipeId ?? '',
      Number(item.quantity) || 0,
      Number(item.unitPrice) || 0,
      Number(item.unitCost) || 0,
      JSON.stringify(item)
    );
  }
}

function readMetadata(db) {
  const rows = db.prepare('SELECT key, value_json FROM app_metadata').all();
  return Object.fromEntries(rows.map((row) => [row.key, parseJson(row.value_json, null)]));
}

function upsertMetadata(db, key, value) {
  db.prepare(`
    INSERT INTO app_metadata (key, value_json, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(key) DO UPDATE SET value_json = excluded.value_json, updated_at = excluded.updated_at
  `).run(key, JSON.stringify(value), nowIso());
}

function assertCollectionTable(collection) {
  const table = COLLECTION_TABLES[collection];
  if (!table) throw new Error(`Coleccion no soportada: ${collection}.`);
  return table;
}

function getItemLabel(item) {
  return item.name ?? item.orderNumber ?? item.batchCode ?? item.lotCode ?? item.type ?? item.id ?? '';
}

function getItemStatus(item) {
  if (typeof item.status === 'string') return item.status;
  if (typeof item.active === 'boolean') return item.active ? 'active' : 'inactive';
  return '';
}

function getItemDate(item) {
  return item.date ?? item.orderDate ?? item.deliveryDate ?? item.createdAt ?? '';
}

function parseJson(value, fallback) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function nowIso() {
  return new Date().toISOString();
}
