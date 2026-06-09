import { randomBytes, scryptSync, timingSafeEqual, createHash, randomUUID } from 'node:crypto';

const SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const ROLE_ORDER = {
  viewer: 1,
  operator: 2,
  admin: 3
};

const DEFAULT_ROLES = [
  { id: 'role-admin', name: 'admin', description: 'Acceso completo al backend local.' },
  { id: 'role-operator', name: 'operator', description: 'Puede registrar operaciones de negocio.' },
  { id: 'role-viewer', name: 'viewer', description: 'Solo lectura de datos y reportes.' }
];

export function migrateAuthSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (user_id, role_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS backend_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      last_seen_at TEXT,
      revoked_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_backend_sessions_token ON backend_sessions(token_hash);
    CREATE INDEX IF NOT EXISTS idx_backend_sessions_user ON backend_sessions(user_id);
  `);

  const statement = db.prepare(`
    INSERT OR IGNORE INTO roles (id, name, payload_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (const role of DEFAULT_ROLES) {
    statement.run(role.id, role.name, JSON.stringify(role), nowIso(), nowIso());
  }
}

export function getBackendAuthStatus(db, authContext = null) {
  return {
    enabled: isBackendAuthEnabled(db),
    hasAdmin: hasRoleUser(db, 'admin'),
    roles: DEFAULT_ROLES.map((role) => role.name),
    currentUser: authContext?.user ? publicUser(authContext.user, authContext.roles) : null
  };
}

export function bootstrapBackendAdmin(db, input = {}) {
  if (isBackendAuthEnabled(db)) {
    return failure(['El backend ya tiene usuarios activos.']);
  }

  const result = createBackendUser(db, {
    username: input.username,
    password: input.password,
    roles: ['admin']
  }, { allowWithoutAdmin: true });

  if (!result.ok) return result;
  writeAuditLog(db, {
    actorId: result.user.id,
    action: 'auth.bootstrap_admin',
    entityType: 'user',
    entityId: result.user.id
  });
  const session = createBackendSession(db, result.user);
  return success({
    user: publicUser(result.user, ['admin']),
    token: session.token,
    expiresAt: session.expiresAt
  });
}

export function loginBackendUser(db, input = {}) {
  const username = normalizeUsername(input.username);
  const password = String(input.password ?? '');
  const row = db.prepare('SELECT * FROM users WHERE username = ? AND active = 1').get(username);
  if (!row || !verifyPassword(password, row.password_hash)) {
    return failure(['Usuario o contrasena incorrectos.']);
  }

  const roles = getUserRoles(db, row.id);
  const session = createBackendSession(db, row);
  writeAuditLog(db, {
    actorId: row.id,
    action: 'auth.login',
    entityType: 'user',
    entityId: row.id
  });
  return success({
    user: publicUser(row, roles),
    token: session.token,
    expiresAt: session.expiresAt
  });
}

export function logoutBackendSession(db, token = '') {
  const tokenHash = hashToken(token);
  if (!tokenHash) return success({ revoked: false });
  const result = db.prepare('UPDATE backend_sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL')
    .run(nowIso(), tokenHash);
  return success({ revoked: (result.changes ?? 0) > 0 });
}

export function authenticateBackendRequest(db, request) {
  const token = getBearerToken(request);
  if (!token) {
    return { authenticated: false, user: null, roles: [], token: '' };
  }

  const tokenHash = hashToken(token);
  const row = db.prepare(`
    SELECT s.id AS session_id, s.expires_at, u.*
    FROM backend_sessions s
    JOIN users u ON u.id = s.user_id
    WHERE s.token_hash = ? AND s.revoked_at IS NULL AND u.active = 1
  `).get(tokenHash);
  if (!row || String(row.expires_at) <= nowIso()) {
    return { authenticated: false, user: null, roles: [], token };
  }

  db.prepare('UPDATE backend_sessions SET last_seen_at = ? WHERE id = ?').run(nowIso(), row.session_id);
  const roles = getUserRoles(db, row.id);
  return {
    authenticated: true,
    user: row,
    roles,
    token
  };
}

export function authorizeBackendRequest(db, request, segments, authContext) {
  const requiredRole = getRequiredRole(db, request, segments);
  if (!requiredRole) return { ok: true };
  if (!authContext?.authenticated) {
    return { ok: false, status: 401, payload: { ok: false, error: 'Autenticacion backend requerida.' } };
  }
  if (!hasRole(authContext.roles, requiredRole)) {
    return { ok: false, status: 403, payload: { ok: false, error: `Rol requerido: ${requiredRole}.` } };
  }
  return { ok: true };
}

export function listBackendUsers(db) {
  return db.prepare('SELECT id, username, active, created_at, updated_at FROM users ORDER BY username')
    .all()
    .map((user) => publicUser(user, getUserRoles(db, user.id)));
}

export function createBackendUser(db, input = {}, options = {}) {
  const username = normalizeUsername(input.username);
  const password = String(input.password ?? '');
  const roles = normalizeRoles(input.roles ?? input.role ?? 'operator');

  const errors = [];
  if (!username) errors.push('El usuario es obligatorio.');
  if (password.length < 6) errors.push('La contrasena debe tener al menos 6 caracteres.');
  if (roles.length === 0) errors.push('Selecciona al menos un rol valido.');
  if (!options.allowWithoutAdmin && !roles.includes('admin') && !isBackendAuthEnabled(db)) {
    errors.push('Crea primero un usuario admin.');
  }
  if (errors.length > 0) return failure(errors);

  const now = nowIso();
  const user = {
    id: `user-${randomUUID()}`,
    username,
    active: 1,
    created_at: now,
    updated_at: now
  };

  try {
    db.exec('BEGIN IMMEDIATE');
    db.prepare(`
      INSERT INTO users (id, username, password_hash, active, payload_json, created_at, updated_at)
      VALUES (?, ?, ?, 1, ?, ?, ?)
    `).run(
      user.id,
      username,
      hashPassword(password),
      JSON.stringify({ username, roles }),
      now,
      now
    );
    assignRoles(db, user.id, roles);
    db.exec('COMMIT');
    return success({ user, roles });
  } catch (error) {
    db.exec('ROLLBACK');
    if (String(error.message).includes('UNIQUE')) return failure(['Ese usuario ya existe.']);
    throw error;
  }
}

export function deactivateBackendUser(db, userId, actorId = '') {
  if (getUserRoles(db, userId).includes('admin') && countActiveAdmins(db) <= 1) {
    return failure(['No se puede desactivar el ultimo admin activo.']);
  }

  const result = db.prepare('UPDATE users SET active = 0, updated_at = ? WHERE id = ?').run(nowIso(), userId);
  if ((result.changes ?? 0) <= 0) return failure(['Usuario no encontrado.']);
  db.prepare('UPDATE backend_sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL').run(nowIso(), userId);
  writeAuditLog(db, {
    actorId,
    action: 'auth.deactivate_user',
    entityType: 'user',
    entityId: userId
  });
  return success({ deactivated: true });
}

export function hasRole(roles = [], requiredRole = 'viewer') {
  const required = ROLE_ORDER[requiredRole] ?? ROLE_ORDER.viewer;
  return roles.some((role) => (ROLE_ORDER[role] ?? 0) >= required);
}

export function extractBearerToken(request) {
  return getBearerToken(request);
}

function getRequiredRole(db, request, segments) {
  if (!isBackendAuthEnabled(db)) return null;
  const resource = segments[1] ?? '';
  if (!resource || resource === 'health' || resource === 'auth') return null;
  if (request.method === 'GET') return 'viewer';
  if (['data', 'seed', 'import', 'settings'].includes(resource)) return 'admin';
  if (resource === 'backups') return segments[3] === 'restore' || request.method === 'POST' ? 'admin' : 'viewer';
  if (request.method === 'DELETE') return 'admin';
  return 'operator';
}

function isBackendAuthEnabled(db) {
  return Number(db.prepare('SELECT COUNT(*) AS count FROM users WHERE active = 1').get().count) > 0;
}

function hasRoleUser(db, roleName) {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN roles r ON r.id = ur.role_id
    WHERE u.active = 1 AND r.name = ?
  `).get(roleName);
  return Number(row.count) > 0;
}

function countActiveAdmins(db) {
  const row = db.prepare(`
    SELECT COUNT(*) AS count
    FROM users u
    JOIN user_roles ur ON ur.user_id = u.id
    JOIN roles r ON r.id = ur.role_id
    WHERE u.active = 1 AND r.name = 'admin'
  `).get();
  return Number(row.count) || 0;
}

function assignRoles(db, userId, roles) {
  const statement = db.prepare('INSERT OR IGNORE INTO user_roles (user_id, role_id, created_at) VALUES (?, ?, ?)');
  for (const role of roles) {
    const row = db.prepare('SELECT id FROM roles WHERE name = ?').get(role);
    if (row) statement.run(userId, row.id, nowIso());
  }
}

function getUserRoles(db, userId) {
  return db.prepare(`
    SELECT r.name
    FROM user_roles ur
    JOIN roles r ON r.id = ur.role_id
    WHERE ur.user_id = ?
    ORDER BY r.name
  `).all(userId).map((row) => row.name);
}

function createBackendSession(db, user) {
  const token = randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS).toISOString();
  db.prepare(`
    INSERT INTO backend_sessions (id, user_id, token_hash, created_at, expires_at, last_seen_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(`session-${randomUUID()}`, user.id, hashToken(token), nowIso(), expiresAt, nowIso());
  return { token, expiresAt };
}

function publicUser(user, roles = []) {
  return {
    id: user.id,
    username: user.username,
    active: Boolean(user.active),
    roles,
    createdAt: user.created_at ?? user.createdAt ?? '',
    updatedAt: user.updated_at ?? user.updatedAt ?? ''
  };
}

function normalizeUsername(value) {
  return String(value ?? '').trim().toLowerCase();
}

function normalizeRoles(value) {
  const values = Array.isArray(value)
    ? value
    : String(value ?? '').split(',');
  return [...new Set(values.map((role) => String(role).trim()).filter((role) => ROLE_ORDER[role]))];
}

function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, 64).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password, storedHash = '') {
  const [method, salt, expectedHash] = String(storedHash).split(':');
  if (method !== 'scrypt' || !salt || !expectedHash) return false;
  const actual = Buffer.from(scryptSync(password, salt, 64).toString('hex'), 'hex');
  const expected = Buffer.from(expectedHash, 'hex');
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function getBearerToken(request) {
  const header = request.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1]?.trim() ?? '';
}

function hashToken(token) {
  if (!token) return '';
  return createHash('sha256').update(token).digest('hex');
}

function writeAuditLog(db, fields) {
  db.prepare(`
    INSERT INTO audit_log (id, actor_id, action, entity_type, entity_id, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(
    `audit-${randomUUID()}`,
    fields.actorId ?? '',
    fields.action,
    fields.entityType ?? '',
    fields.entityId ?? '',
    JSON.stringify(fields.payload ?? {}),
    nowIso()
  );
}

function success(payload) {
  return { ok: true, ...payload, errors: [] };
}

function failure(errors) {
  return { ok: false, errors };
}

function nowIso() {
  return new Date().toISOString();
}
