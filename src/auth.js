export const ADMIN_SESSION_KEY = 'ramp-bites-control-panel:admin-session';

export const DEFAULT_SECURITY_SETTINGS = {
  localAuthEnabled: false,
  adminPinHash: '',
  adminPinSalt: '',
  adminSessionMinutes: 30,
  lastPinChangedAt: '',
  lastUnlockedAt: '',
  lastLockedAt: ''
};

const MIN_PIN_LENGTH = 4;

export function getSecuritySettings(data) {
  return {
    ...DEFAULT_SECURITY_SETTINGS,
    ...(data?.settings?.security ?? {})
  };
}

export function isLocalAuthEnabled(data) {
  return Boolean(getSecuritySettings(data).localAuthEnabled);
}

export function hasAdminPin(data) {
  const security = getSecuritySettings(data);
  return Boolean(security.adminPinHash && security.adminPinSalt);
}

export function isAdminUnlocked(data, now = new Date()) {
  if (!isLocalAuthEnabled(data)) return true;
  const session = getAdminSession();
  if (session?.role !== 'admin') return false;
  return new Date(session.expiresAt).getTime() > now.getTime();
}

export function getAdminSession() {
  const storage = getSessionStorage();
  if (!storage) return null;
  try {
    const raw = storage.getItem(ADMIN_SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function lockAdminSession(data) {
  const storage = getSessionStorage();
  if (storage) storage.removeItem(ADMIN_SESSION_KEY);
  return applySecurityPatch(data, {
    lastLockedAt: new Date().toISOString()
  });
}

export async function setAdminPin(data, pin) {
  const normalizedPin = String(pin ?? '').trim();
  if (normalizedPin.length < MIN_PIN_LENGTH) {
    return failure(['El PIN admin debe tener al menos 4 caracteres.']);
  }

  const salt = generateSalt();
  const hash = await hashPin(normalizedPin, salt);
  return success(applySecurityPatch(data, {
    adminPinSalt: salt,
    adminPinHash: hash,
    localAuthEnabled: true,
    lastPinChangedAt: new Date().toISOString()
  }));
}

export async function verifyAdminPin(data, pin) {
  const security = getSecuritySettings(data);
  if (!security.adminPinHash || !security.adminPinSalt) return false;
  const hash = await hashPin(String(pin ?? '').trim(), security.adminPinSalt);
  return timingSafeEqual(hash, security.adminPinHash);
}

export async function unlockAdminSession(data, pin) {
  if (!isLocalAuthEnabled(data)) {
    return success(data);
  }
  if (!(await verifyAdminPin(data, pin))) {
    return failure(['PIN admin incorrecto.']);
  }

  const now = new Date();
  const security = getSecuritySettings(data);
  const minutes = Number(security.adminSessionMinutes) > 0 ? Number(security.adminSessionMinutes) : DEFAULT_SECURITY_SETTINGS.adminSessionMinutes;
  const expiresAt = new Date(now.getTime() + minutes * 60 * 1000).toISOString();
  const storage = getSessionStorage();
  if (storage) {
    storage.setItem(ADMIN_SESSION_KEY, JSON.stringify({
      role: 'admin',
      unlockedAt: now.toISOString(),
      expiresAt
    }));
  }

  return success(applySecurityPatch(data, {
    lastUnlockedAt: now.toISOString()
  }));
}

export async function requestAdminUnlock(data, options = {}) {
  if (!isLocalAuthEnabled(data)) {
    return success(data, { skipped: true });
  }
  if (!hasAdminPin(data)) {
    return failure(['Activa un PIN admin antes de proteger operaciones.']);
  }
  if (isAdminUnlocked(data)) {
    return success(data, { alreadyUnlocked: true });
  }

  const promptFn = options.promptFn ?? getPrompt();
  if (typeof promptFn !== 'function') {
    return failure(['No hay interfaz disponible para pedir PIN admin.']);
  }

  const pin = promptFn(options.message ?? 'Introduce PIN admin para continuar:');
  if (!pin) return failure(['Operacion cancelada.']);
  return unlockAdminSession(data, pin);
}

export function describeSecurityStatus(data) {
  const security = getSecuritySettings(data);
  if (!security.localAuthEnabled) return 'desactivada';
  if (!security.adminPinHash) return 'activa sin PIN';
  return isAdminUnlocked(data) ? 'admin desbloqueado' : 'admin bloqueado';
}

function applySecurityPatch(data, patch) {
  return {
    ...data,
    settings: {
      ...(data.settings ?? {}),
      security: {
        ...DEFAULT_SECURITY_SETTINGS,
        ...(data.settings?.security ?? {}),
        ...patch
      }
    }
  };
}

async function hashPin(pin, salt) {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) throw new Error('Crypto API no disponible para proteger el PIN.');
  const payload = new TextEncoder().encode(`${salt}:${pin}`);
  const digest = await subtle.digest('SHA-256', payload);
  return [...new Uint8Array(digest)]
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

function generateSalt() {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let index = 0; index < bytes.length; index += 1) {
      bytes[index] = Math.floor(Math.random() * 256);
    }
  }
  return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function timingSafeEqual(left, right) {
  if (left.length !== right.length) return false;
  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}

function getSessionStorage() {
  try {
    if (typeof window === 'undefined' || !window.sessionStorage) return null;
    return window.sessionStorage;
  } catch {
    return null;
  }
}

function getPrompt() {
  try {
    return typeof window?.prompt === 'function' ? window.prompt.bind(window) : null;
  } catch {
    return null;
  }
}

function success(data, meta = {}) {
  return {
    ok: true,
    data,
    ...meta
  };
}

function failure(errors) {
  return {
    ok: false,
    errors
  };
}
