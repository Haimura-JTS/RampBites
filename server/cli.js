import { readFileSync, writeFileSync } from 'node:fs';
import {
  createBackendDatabase,
  createDatabaseBackup,
  getCollectionCounts,
  listDatabaseBackups,
  seedDatabase
} from './database.js';

const command = process.argv[2] ?? 'help';
const arg = process.argv[3] ?? '';
const database = createBackendDatabase();

try {
  if (command === 'init') {
    console.log(JSON.stringify({ ok: true, dbPath: database.dbPath, counts: getCollectionCounts(database.open()) }, null, 2));
  } else if (command === 'seed') {
    createDatabaseBackup(database.open(), database.dbPath, 'before_seed');
    const data = seedDatabase(database.open());
    console.log(JSON.stringify({ ok: true, counts: getCollectionCounts(database.open()), metadata: data.metadata }, null, 2));
  } else if (command === 'import') {
    if (!arg) throw new Error('Uso: npm.cmd run backend:import -- ruta\\backup.json');
    createDatabaseBackup(database.open(), database.dbPath, 'before_import');
    const data = database.replaceData(JSON.parse(readFileSync(arg, 'utf8')));
    console.log(JSON.stringify({ ok: true, counts: getCollectionCounts(database.open()), metadata: data.metadata }, null, 2));
  } else if (command === 'export') {
    const outputPath = arg || `ramp-bites-sqlite-export-${new Date().toISOString().slice(0, 10)}.json`;
    writeFileSync(outputPath, JSON.stringify(database.readData(), null, 2));
    console.log(JSON.stringify({ ok: true, outputPath }, null, 2));
  } else if (command === 'backup') {
    const backup = createDatabaseBackup(database.open(), database.dbPath, 'manual');
    console.log(JSON.stringify({ ok: true, backup }, null, 2));
  } else if (command === 'backups') {
    console.log(JSON.stringify({ ok: true, backups: listDatabaseBackups() }, null, 2));
  } else {
    console.log([
      'Ramp Bites Backend CLI',
      '',
      'Comandos:',
      '  init',
      '  seed',
      '  import <archivo-json>',
      '  export [archivo-json]',
      '  backup',
      '  backups'
    ].join('\n'));
  }
} finally {
  database.close();
}
