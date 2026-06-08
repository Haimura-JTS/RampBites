import { createApiServer } from './api.js';

const port = process.env.BACKEND_PORT === undefined ? 8787 : Number(process.env.BACKEND_PORT);
const host = process.env.BACKEND_HOST || '127.0.0.1';
const api = createApiServer();

await api.listen(port, host);

console.log(`Ramp Bites Backend API: http://${host}:${api.address().port}/api`);
console.log(`SQLite: ${api.database.dbPath}`);

function shutdown() {
  api.close().finally(() => process.exit(0));
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
