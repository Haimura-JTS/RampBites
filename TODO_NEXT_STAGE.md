# TODO NEXT STAGE

## Checkpoint Actual

Etapa cerrada: **ETAPA 12 - Seguridad local**.

Fecha: 2026-06-08.

## Completado

- Se ordeno el repo antes de continuar:
  - commit creado: `1cba96c feat: complete Ramp Bites MVP through API mirror`,
  - push realizado a `origin/main`.
- Se leyeron `README.md`, `CHANGELOG.md` y `TODO_NEXT_STAGE.md` antes de modificar.
- Se agrego `src/auth.js` con:
  - PIN admin hasheado con salt,
  - verificacion de PIN,
  - sesion admin en `sessionStorage`,
  - bloqueo/desbloqueo local,
  - estado textual de seguridad.
- Se agrego `settings.security` al modelo normalizado.
- Se agrego panel `Seguridad local` en Configuracion.
- Se protegen cuando la seguridad esta activa:
  - importacion JSON,
  - reset demo,
  - restauracion de backups,
  - enviar local al backend,
  - traer backend a local,
  - cargar seed backend.
- Se actualizo version visible a `0.12.0`, `APP_STAGE` a Etapa 12 y cache PWA a `0.12.0`.
- Se agrego `tests/auth.test.js`.

## Archivos Modificados

- `README.md`
- `CHANGELOG.md`
- `TODO_NEXT_STAGE.md`
- `package.json`
- `service-worker.js`
- `src/auth.js`
- `src/constants.js`
- `src/main.js`
- `src/models.js`
- `src/services/businessService.js`
- `src/views/settingsView.js`
- `tests/auth.test.js`
- `tests/pwa.test.js`
- `tests/settingsBackend.test.js`
- `docs/ARCHITECTURE.md`
- `docs/BACKEND_PLAN.md`
- `docs/INDEX.md`
- `docs/ROADMAP.md`

## Verificacion

- `npm.cmd test` pasa correctamente: 43/43.
- `node --check` paso para JS/MJS de `src/`, `server/` y `scripts/`.
- Prueba HTTP basica del dev server en `http://127.0.0.1:5199/index.html`:
  - status `200`,
  - `#app` presente,
  - `src/main.js` presente.

## Etapa Siguiente

No hay siguiente prompt obligatorio definido.

Opciones razonables para una proxima etapa:

- roles activos en UI/API,
- autenticacion backend real,
- reservas de stock al confirmar pedido,
- resolver conflictos entre LocalStorage y SQLite,
- sincronizacion por coleccion en vez de reemplazo completo,
- adaptar `server/api.js` a Express si se acepta dependencia.

## Riesgos o Bugs Pendientes

- La seguridad local ayuda contra acciones accidentales, pero no es autenticacion backend real.
- El PIN vive en datos locales como hash con salt; quien tenga control total del navegador/dispositivo puede manipular LocalStorage.
- El modo `api_mirror` reemplaza el dataset completo del backend en cada guardado local.
- No hay control de concurrencia; no usar simultaneamente varios navegadores editando el mismo backend.
- Express no esta instalado; la API usa `node:http` para seguir sin dependencias externas.
- `node:sqlite` emite aviso experimental en Node 24.
- No hay reservas de stock al confirmar pedido; se descuenta al entregar.
