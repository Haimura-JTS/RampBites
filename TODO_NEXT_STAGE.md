# TODO NEXT STAGE

## Checkpoint Actual

Etapa cerrada: **ETAPA 15 - Autenticacion backend y roles**.

Fecha: 2026-06-09.

## Completado

- Se leyeron `README.md`, `CHANGELOG.md` y `TODO_NEXT_STAGE.md` antes de modificar.
- Se creo `server/auth.js` con:
  - bootstrap del primer admin,
  - login/logout,
  - sesiones backend con Bearer token,
  - hash de contrasena con `scrypt`,
  - hash de token de sesion en SQLite,
  - roles `admin`, `operator`, `viewer`,
  - auditoria basica de bootstrap/login/desactivacion.
- Se amplio schema SQLite con:
  - `user_roles`,
  - `backend_sessions`,
  - roles seed internos.
- La API queda abierta mientras no exista usuario activo.
- Al crear el primer admin, la API exige `Authorization: Bearer <token>`.
- Permisos aplicados:
  - lectura: `viewer`,
  - operaciones de negocio: `operator`,
  - import/seed/settings/backups destructivos: `admin`.
- Se agregaron endpoints:
  - `GET /api/auth/status`,
  - `POST /api/auth/bootstrap`,
  - `POST /api/auth/login`,
  - `POST /api/auth/logout`,
  - `GET /api/auth/me`,
  - `GET /api/auth/users`,
  - `POST /api/auth/users`,
  - `POST /api/auth/users/:id/deactivate`.
- No se permite desactivar el ultimo admin activo.
- `src/apiClient.js` envia token Bearer desde `sessionStorage`.
- Configuracion incluye panel de Autenticacion backend:
  - estado,
  - crear primer admin,
  - login,
  - logout,
  - crear usuario con rol.
- CORS backend permite cabecera `Authorization`.
- Version actualizada a `0.15.0`, `APP_STAGE` a Etapa 15 y cache PWA a `0.15.0`.
- Se agregaron tests de auth backend y roles.

## Archivos Modificados

- `README.md`
- `CHANGELOG.md`
- `TODO_NEXT_STAGE.md`
- `package.json`
- `service-worker.js`
- `server/api.js`
- `server/auth.js`
- `server/database.js`
- `src/apiClient.js`
- `src/constants.js`
- `src/main.js`
- `src/views/settingsView.js`
- `tests/backend.test.js`
- `tests/pwa.test.js`
- `tests/settingsBackend.test.js`
- `docs/ARCHITECTURE.md`
- `docs/BACKEND_PLAN.md`
- `docs/INDEX.md`
- `docs/QA_CHECKLIST.md`
- `docs/ROADMAP.md`

## Verificacion

- `npm.cmd test` pasa correctamente: 49/49.
- `node --check` paso para JS/MJS de `src/`, `server/` y `scripts/`.

## Etapa Siguiente

No hay siguiente prompt obligatorio definido.

Opciones razonables para una proxima etapa:

- sincronizacion por coleccion en vez de reemplazo completo,
- resolucion de conflictos entre LocalStorage y SQLite,
- auditoria visible en UI,
- bloqueo/transacciones especificas para reservas multiusuario,
- adaptar `server/api.js` a Express si se acepta dependencia,
- gestionar usuarios backend con UI completa.

## Riesgos o Bugs Pendientes

- La autenticacion backend protege endpoints, pero no resuelve conflictos de varios usuarios editando a la vez.
- Si dos navegadores usan `api_mirror`, todavia pueden pisarse cambios por reemplazo completo de dataset.
- Las sesiones se guardan en `sessionStorage`; al cerrar pestana hay que iniciar sesion de nuevo.
- La API se mantiene abierta si no existe ningun usuario activo para conservar compatibilidad local.
- Express no esta instalado; la API usa `node:http` para seguir sin dependencias externas.
- `node:sqlite` emite aviso experimental en Node 24.
