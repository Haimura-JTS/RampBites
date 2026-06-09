# TODO NEXT STAGE

## Checkpoint Actual

Etapa cerrada: **ETAPA 16 - Sincronizacion por coleccion y conflictos basicos**.

Fecha: 2026-06-09.

## Completado

- Se leyeron `README.md`, `CHANGELOG.md` y `TODO_NEXT_STAGE.md` antes de modificar.
- Se creo `src/sync.js` con:
  - mapa de colecciones frontend/backend,
  - merge por coleccion,
  - comparacion por fecha de actualizacion,
  - deteccion basica de conflictos local/remoto,
  - resolucion local-first,
  - resumen de items subidos, traidos y conflictos.
- Se agrego `syncCollection(resource, items)` en `src/apiClient.js`.
- Se agrego endpoint backend `POST /api/sync/:collection`.
- El endpoint de sync usa upsert raw sobre SQLite para no recalcular compras, producciones o movimientos ya trazados.
- El endpoint de sync requiere rol `admin` cuando la autenticacion backend esta activa.
- Configuracion > Backend SQLite incluye boton `Sync colecciones`.
- La UI crea backup local antes de sincronizar colecciones.
- La UI guarda resumen y conflictos en `settings.backend.collectionSync`.
- Version actualizada a `0.16.0`, `APP_STAGE` a Etapa 16 y cache PWA a `0.16.0`.
- Se amplio la cobertura de tests para merge, conflictos, sync y endpoint backend.

## Archivos Modificados

- `README.md`
- `CHANGELOG.md`
- `TODO_NEXT_STAGE.md`
- `package.json`
- `service-worker.js`
- `server/api.js`
- `server/auth.js`
- `src/apiClient.js`
- `src/constants.js`
- `src/main.js`
- `src/sync.js`
- `src/views/settingsView.js`
- `tests/backend.test.js`
- `tests/backendSync.test.js`
- `tests/pwa.test.js`
- `tests/settingsBackend.test.js`

## Verificacion

- `npm.cmd test` pasa correctamente: 52/52.
- `node --check` paso para JS/MJS de `src/`, `server/` y `scripts/`.

## Etapa Siguiente

No hay siguiente prompt obligatorio definido.

Opciones razonables para una proxima etapa:

- implementar tombstones o `deletedAt` para sincronizar borrados,
- crear UI de auditoria visible para conflictos y acciones backend,
- permitir resolver conflictos manualmente en vez de resolver siempre local-first,
- bloquear/transaccionar reservas multiusuario,
- adaptar `server/api.js` a Express si se acepta dependencia,
- gestionar usuarios backend con UI completa.

## Riesgos o Bugs Pendientes

- La sync por coleccion conserva local ante conflicto; no hay resolucion manual aun.
- Los borrados no se sincronizan hasta definir tombstones.
- Si dos navegadores usan `api_mirror`, todavia pueden pisarse cambios por reemplazo completo de dataset.
- Las sesiones backend se guardan en `sessionStorage`; al cerrar pestana hay que iniciar sesion de nuevo.
- La API se mantiene abierta si no existe ningun usuario activo para conservar compatibilidad local.
- Express no esta instalado; la API usa `node:http` para seguir sin dependencias externas.
- `node:sqlite` emite aviso experimental en Node 24.
