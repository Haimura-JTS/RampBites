import { mkdirSync } from 'node:fs';
import { join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

export const PROJECT_ROOT = normalize(join(fileURLToPath(new URL('..', import.meta.url))));
export const DATA_DIR = process.env.RAMP_BITES_DATA_DIR || join(PROJECT_ROOT, 'data');
export const BACKUP_DIR = process.env.RAMP_BITES_BACKUP_DIR || join(PROJECT_ROOT, 'backups');
export const DEFAULT_DB_PATH = process.env.RAMP_BITES_DB || join(DATA_DIR, 'ramp-bites.sqlite');

export function ensureBackendDirs() {
  mkdirSync(DATA_DIR, { recursive: true });
  mkdirSync(BACKUP_DIR, { recursive: true });
}
