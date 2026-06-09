# TODO NEXT STAGE

## Checkpoint Actual

Etapa cerrada: **ETAPA 16 - Sincronizacion por coleccion y conflictos basicos**.

Decision nueva registrada: **migracion tecnologica a React + TypeScript + Vite + Dexie/IndexedDB + Zod + Vitest**.

Instruccion global nueva registrada: **Prompts 2 a 9 deben mantener React + TypeScript + Vite + Dexie/IndexedDB + Zod + Vitest, con calculos en `src/utils/calculations.ts` y datos importantes en Dexie**.

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
- Se registro el cambio tecnologico para no seguir creciendo el MVP en JavaScript plano con LocalStorage como base principal.
- Se creo `docs/TECH_STACK_MIGRATION.md` con estructura objetivo, stores Dexie, reglas tecnicas y fases de migracion.
- Se creo `docs/PROMPTS_2_9_GLOBAL_RULES.md` con reglas obligatorias para tipos, Zod, servicios, paginas, Dexie, stock, produccion, recetas, pedidos, tests y documentacion.

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
- `docs/ARCHITECTURE.md`
- `docs/BACKEND_PLAN.md`
- `docs/DATA_MODEL.md`
- `docs/INDEX.md`
- `docs/QA_CHECKLIST.md`
- `docs/ROADMAP.md`
- `docs/TECH_STACK_MIGRATION.md`
- `docs/PROMPTS_2_9_GLOBAL_RULES.md`

## Verificacion

- `npm.cmd test` pasa correctamente: 52/52.
- `node --check` paso para JS/MJS de `src/`, `server/` y `scripts/`.

## Etapa Siguiente

**ETAPA 17 - Migracion tecnologica base a React + TypeScript + Vite + Dexie**.

Objetivo recomendado:

- crear base Vite React TS,
- instalar Dexie, Zod y Vitest,
- crear `src/db/db.ts`, schema Dexie, seed y migraciones,
- crear tipos TypeScript de dominio,
- crear schemas Zod,
- migrar calculos puros a `src/utils/calculations.ts`,
- crear app shell React con paginas placeholder,
- cargar seed inicial en IndexedDB,
- implementar export/import JSON inicial,
- dejar LocalStorage solo para preferencias no criticas,
- mantener el MVP legacy como referencia hasta tener paridad minima.

## Riesgos o Bugs Pendientes

- La sync por coleccion conserva local ante conflicto; no hay resolucion manual aun.
- Los borrados no se sincronizan hasta definir tombstones.
- El MVP actual aun usa LocalStorage como base principal; la siguiente etapa debe migrar a Dexie/IndexedDB.
- La migracion React/Dexie debe cuidar compatibilidad de export JSON para no perder datos existentes.
- Si dos navegadores usan `api_mirror`, todavia pueden pisarse cambios por reemplazo completo de dataset.
- Las sesiones backend se guardan en `sessionStorage`; al cerrar pestana hay que iniciar sesion de nuevo.
- La API se mantiene abierta si no existe ningun usuario activo para conservar compatibilidad local.
- Express no esta instalado; la API usa `node:http` para seguir sin dependencias externas.
- `node:sqlite` emite aviso experimental en Node 24.
