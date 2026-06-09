import { createServer } from 'node:http';
import { buildCsvExport } from '../src/exporters.js';
import {
  getCostReport,
  getDashboardAnalytics,
  getPriceSupplierReport,
  getProductionReport,
  getSalesReport
} from '../src/reports.js';
import {
  completeProductionBatch,
  createStockMovement,
  deactivateClient,
  deactivateProduct,
  deactivateSupplier,
  deliverOrder,
  markLotDiscarded,
  saveClient,
  saveFeedback,
  saveOrder,
  saveProduct,
  saveProductionBatch,
  savePurchase,
  saveRecipe,
  saveSettings,
  saveSupplier
} from '../src/services/businessService.js';
import {
  createBackendDatabase,
  createDatabaseBackup,
  deleteCollectionItem,
  getCollectionCounts,
  listDatabaseBackups,
  readCollection,
  readCollectionItem,
  readSettings,
  replaceDatabaseData,
  safeBackupFilename,
  seedDatabase,
  upsertCollectionItem,
  upsertSettings
} from './database.js';
import {
  authenticateBackendRequest,
  authorizeBackendRequest,
  bootstrapBackendAdmin,
  createBackendUser,
  deactivateBackendUser,
  extractBearerToken,
  getBackendAuthStatus,
  hasRole,
  listBackendUsers,
  loginBackendUser,
  logoutBackendSession
} from './auth.js';
import { DEFAULT_DB_PATH } from './paths.js';

export const API_ENDPOINTS = {
  products: 'products',
  suppliers: 'suppliers',
  purchases: 'purchases',
  'stock-movements': 'stockMovements',
  'production-batches': 'productionBatches',
  lots: 'lots',
  recipes: 'recipes',
  clients: 'clients',
  orders: 'orders',
  feedback: 'feedback',
  'price-history': 'priceHistory'
};

export function createApiServer(options = {}) {
  const database = createBackendDatabase(options.dbPath ?? DEFAULT_DB_PATH);
  const server = createServer((request, response) => {
    handleRequest(request, response, database).catch((error) => {
      sendJson(response, 500, {
        ok: false,
        error: error.message
      });
    });
  });

  return {
    database,
    server,
    listen(port = process.env.BACKEND_PORT === undefined ? 8787 : Number(process.env.BACKEND_PORT), host = process.env.BACKEND_HOST || '127.0.0.1') {
      return new Promise((resolve) => {
        server.listen(port, host, () => resolve(this));
      });
    },
    address() {
      return server.address();
    },
    close() {
      return new Promise((resolve, reject) => {
        server.close((error) => {
          database.close();
          if (error) reject(error);
          else resolve();
        });
      });
    }
  };
}

async function handleRequest(request, response, database) {
  setBaseHeaders(response);
  if (request.method === 'OPTIONS') {
    response.writeHead(204);
    response.end();
    return;
  }

  const url = new URL(request.url, `http://${request.headers.host}`);
  const segments = url.pathname.split('/').filter(Boolean);
  if (segments[0] !== 'api') return sendJson(response, 404, { ok: false, error: 'Endpoint no encontrado.' });

  if (segments.length === 1) {
    return sendJson(response, 200, {
      ok: true,
      name: 'Ramp Bites Backend',
      endpoints: Object.keys(API_ENDPOINTS).map((endpoint) => `/api/${endpoint}`)
    });
  }

  const authContext = authenticateBackendRequest(database.open(), request);
  if (segments[1] === 'auth') return handleAuth(request, response, database, segments, authContext);

  const authorization = authorizeBackendRequest(database.open(), request, segments, authContext);
  if (!authorization.ok) return sendJson(response, authorization.status, authorization.payload);

  if (segments[1] === 'health') return handleHealth(response, database);
  if (segments[1] === 'data') return handleData(request, response, database);
  if (segments[1] === 'seed') return handleSeed(request, response, database);
  if (segments[1] === 'import' && segments[2] === 'json') return handleJsonImport(request, response, database);
  if (segments[1] === 'export') return handleExport(request, response, database, segments[2]);
  if (segments[1] === 'backups') return handleBackups(request, response, database, segments);
  if (segments[1] === 'reports') return handleReports(request, response, database, segments[2]);
  if (segments[1] === 'settings') return handleSettings(request, response, database);

  const collection = API_ENDPOINTS[segments[1]];
  if (collection) return handleCollection(request, response, database, collection, segments);

  return sendJson(response, 404, { ok: false, error: 'Endpoint no encontrado.' });
}

async function handleAuth(request, response, database, segments, authContext) {
  const action = segments[2] ?? 'status';
  const db = database.open();

  if (action === 'status' && request.method === 'GET') {
    return sendJson(response, 200, { ok: true, auth: getBackendAuthStatus(db, authContext) });
  }

  if (action === 'bootstrap' && request.method === 'POST') {
    const body = await readJsonBody(request);
    const result = bootstrapBackendAdmin(db, body);
    return sendAuthResult(response, result, 201);
  }

  if (action === 'login' && request.method === 'POST') {
    const body = await readJsonBody(request);
    const result = loginBackendUser(db, body);
    return sendAuthResult(response, result);
  }

  if (action === 'logout' && request.method === 'POST') {
    const result = logoutBackendSession(db, extractBearerToken(request));
    return sendAuthResult(response, result);
  }

  if (action === 'me' && request.method === 'GET') {
    if (!authContext.authenticated) return sendJson(response, 401, { ok: false, error: 'Autenticacion backend requerida.' });
    return sendJson(response, 200, {
      ok: true,
      user: getBackendAuthStatus(db, authContext).currentUser
    });
  }

  if (action === 'users' && segments[4] === 'deactivate' && request.method === 'POST') {
    if (!authContext.authenticated) return sendJson(response, 401, { ok: false, error: 'Autenticacion backend requerida.' });
    if (!hasRole(authContext.roles, 'admin')) return sendJson(response, 403, { ok: false, error: 'Rol requerido: admin.' });
    const result = deactivateBackendUser(db, decodeURIComponent(segments[3] ?? ''), authContext.user?.id);
    return sendAuthResult(response, result);
  }

  if (action === 'users') {
    if (!authContext.authenticated) return sendJson(response, 401, { ok: false, error: 'Autenticacion backend requerida.' });
    if (!hasRole(authContext.roles, 'admin')) return sendJson(response, 403, { ok: false, error: 'Rol requerido: admin.' });
    if (request.method === 'GET') return sendJson(response, 200, { ok: true, users: listBackendUsers(db) });
    if (request.method === 'POST') {
      const body = await readJsonBody(request);
      const result = createBackendUser(db, body);
      return sendAuthResult(response, result, 201);
    }
  }

  return methodNotAllowed(response);
}

function sendAuthResult(response, result, successStatus = 200) {
  if (!result.ok) return sendJson(response, 400, { ok: false, errors: result.errors });
  return sendJson(response, successStatus, result);
}

function handleHealth(response, database) {
  return sendJson(response, 200, {
    ok: true,
    storage: 'sqlite',
    dbPath: database.dbPath,
    counts: getCollectionCounts(database.open())
  });
}

async function handleData(request, response, database) {
  if (request.method === 'GET') return sendJson(response, 200, { ok: true, data: database.readData() });
  if (request.method !== 'PUT' && request.method !== 'POST') return methodNotAllowed(response);

  const body = await readJsonBody(request);
  createDatabaseBackup(database.open(), database.dbPath, 'before_replace');
  const data = database.replaceData(body.data ?? body);
  return sendJson(response, 200, { ok: true, data });
}

async function handleSeed(request, response, database) {
  if (request.method !== 'POST') return methodNotAllowed(response);
  createDatabaseBackup(database.open(), database.dbPath, 'before_seed');
  const data = seedDatabase(database.open());
  return sendJson(response, 200, { ok: true, data });
}

async function handleJsonImport(request, response, database) {
  if (request.method !== 'POST') return methodNotAllowed(response);
  const body = await readJsonBody(request);
  createDatabaseBackup(database.open(), database.dbPath, 'before_import');
  const data = replaceDatabaseData(database.open(), body.data ?? body);
  return sendJson(response, 200, { ok: true, data });
}

function handleExport(request, response, database, type = 'json') {
  if (request.method !== 'GET') return methodNotAllowed(response);
  const data = database.readData();
  if (!type || type === 'json') return sendJson(response, 200, { ok: true, data });

  const csv = buildCsvExport(data, type);
  response.writeHead(200, {
    ...baseHeaders(),
    'Content-Type': 'text/csv; charset=utf-8',
    'Content-Disposition': `attachment; filename="${csv.filename}"`
  });
  response.end(csv.content);
  return null;
}

async function handleBackups(request, response, database, segments) {
  if (segments.length === 2 && request.method === 'GET') {
    return sendJson(response, 200, { ok: true, backups: listDatabaseBackups() });
  }

  if (segments.length === 2 && request.method === 'POST') {
    const backup = createDatabaseBackup(database.open(), database.dbPath, 'manual');
    return sendJson(response, 201, { ok: true, backup });
  }

  if (segments.length === 4 && segments[3] === 'restore' && request.method === 'POST') {
    const filename = safeBackupFilename(decodeURIComponent(segments[2]));
    createDatabaseBackup(database.open(), database.dbPath, 'before_restore');
    const data = database.restoreBackup(filename);
    return sendJson(response, 200, { ok: true, data });
  }

  return methodNotAllowed(response);
}

function handleReports(request, response, database, reportName = 'dashboard') {
  if (request.method !== 'GET') return methodNotAllowed(response);
  const data = database.readData();
  const reports = {
    dashboard: () => getDashboardAnalytics(data),
    production: () => getProductionReport(data),
    sales: () => getSalesReport(data),
    prices: () => getPriceSupplierReport(data),
    costs: () => getCostReport(data)
  };
  const report = reports[reportName]?.();
  if (!report) return sendJson(response, 404, { ok: false, error: 'Reporte no encontrado.' });
  return sendJson(response, 200, { ok: true, report });
}

async function handleSettings(request, response, database) {
  if (request.method === 'GET') return sendJson(response, 200, { ok: true, item: readSettings(database.open()) });
  if (request.method !== 'PATCH' && request.method !== 'POST') return methodNotAllowed(response);

  const input = await readJsonBody(request);
  const data = database.readData();
  const result = saveSettings(data, {
    ...data.settings,
    ...input
  });
  if (!result.ok) return sendJson(response, 400, { ok: false, errors: result.errors });
  database.replaceData(result.data);
  return sendJson(response, 200, { ok: true, item: result.item, data: result.data });
}

async function handleCollection(request, response, database, collection, segments) {
  const id = segments[2] ? decodeURIComponent(segments[2]) : '';
  const action = segments[3] ?? '';

  if (action) return handleCollectionAction(request, response, database, collection, id, action);

  if (!id && request.method === 'GET') {
    return sendJson(response, 200, { ok: true, items: readCollection(database.open(), collection) });
  }

  if (id && request.method === 'GET') {
    const item = readCollectionItem(database.open(), collection, id);
    return item
      ? sendJson(response, 200, { ok: true, item })
      : sendJson(response, 404, { ok: false, error: 'Registro no encontrado.' });
  }

  if (!id && request.method === 'POST') {
    const input = await readJsonBody(request);
    return saveCollectionViaBusinessService(response, database, collection, input);
  }

  if (id && request.method === 'PATCH') {
    const current = readCollectionItem(database.open(), collection, id);
    if (!current) return sendJson(response, 404, { ok: false, error: 'Registro no encontrado.' });
    const input = {
      ...current,
      ...(await readJsonBody(request)),
      id
    };
    return saveCollectionViaBusinessService(response, database, collection, input);
  }

  if (id && request.method === 'DELETE') {
    const changes = deleteCollectionItem(database.open(), collection, id);
    return sendJson(response, changes > 0 ? 200 : 404, { ok: changes > 0, deleted: changes });
  }

  return methodNotAllowed(response);
}

async function handleCollectionAction(request, response, database, collection, id, action) {
  if (request.method !== 'POST') return methodNotAllowed(response);
  const data = database.readData();
  const body = await readJsonBody(request, { optional: true });
  let result = null;

  if (collection === 'orders' && action === 'deliver') result = deliverOrder(data, id);
  if (collection === 'productionBatches' && action === 'complete') {
    result = completeProductionBatch(data, { ...body, batchId: id });
  }
  if (collection === 'lots' && action === 'discard') {
    result = markLotDiscarded(data, id, body.notes || 'Descarte via API');
  }
  if (collection === 'products' && action === 'deactivate') result = deactivateProduct(data, id);
  if (collection === 'suppliers' && action === 'deactivate') result = deactivateSupplier(data, id);
  if (collection === 'clients' && action === 'deactivate') result = deactivateClient(data, id);

  if (!result) return sendJson(response, 404, { ok: false, error: 'Accion no encontrada.' });
  if (!result.ok) return sendJson(response, 400, { ok: false, errors: result.errors });

  database.replaceData(result.data);
  return sendJson(response, 200, { ok: true, item: result.item, data: result.data });
}

function saveCollectionViaBusinessService(response, database, collection, input) {
  const data = database.readData();
  const fallback = () => ({
    ok: true,
    data: database.readData(),
    item: upsertCollectionItem(database.open(), collection, input),
    errors: []
  });
  const services = {
    products: () => saveProduct(data, input),
    suppliers: () => saveSupplier(data, input),
    purchases: () => savePurchase(data, input),
    stockMovements: () => createStockMovement(data, input),
    productionBatches: () => saveProductionBatch(data, input),
    recipes: () => saveRecipe(data, input),
    clients: () => saveClient(data, input),
    orders: () => saveOrder(data, input),
    feedback: () => saveFeedback(data, input),
    lots: fallback,
    priceHistory: fallback
  };

  const result = services[collection]?.();
  if (!result) return sendJson(response, 404, { ok: false, error: 'Coleccion no soportada.' });
  if (!result.ok) return sendJson(response, 400, { ok: false, errors: result.errors });

  if (collection !== 'lots' && collection !== 'priceHistory') database.replaceData(result.data);
  return sendJson(response, input.id ? 200 : 201, { ok: true, item: result.item, data: database.readData() });
}

async function readJsonBody(request, options = {}) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw && options.optional) return {};
  if (!raw) throw new Error('Body JSON requerido.');
  try {
    return JSON.parse(raw);
  } catch {
    throw new Error('Body JSON invalido.');
  }
}

function methodNotAllowed(response) {
  return sendJson(response, 405, { ok: false, error: 'Metodo no permitido.' });
}

function sendJson(response, statusCode, payload) {
  response.writeHead(statusCode, {
    ...baseHeaders(),
    'Content-Type': 'application/json; charset=utf-8'
  });
  response.end(JSON.stringify(payload, null, 2));
}

function setBaseHeaders(response) {
  for (const [key, value] of Object.entries(baseHeaders())) {
    response.setHeader(key, value);
  }
}

function baseHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Cache-Control': 'no-store'
  };
}
