# Architecture

Ramp Bites Control Panel es una app web local-first para gestion interna de produccion artesanal de burritos.

## Principios

- UI en espanol.
- MVP actual con LocalStorage como persistencia historica.
- Siguiente arquitectura local-first con Dexie.js sobre IndexedDB como persistencia principal.
- LocalStorage solo para preferencias simples, configuracion visual, ultimo backup temporal, flags de UI y modo demo.
- Logica de negocio separada de la interfaz.
- Stock derivado de movimientos trazables.
- Datos seed editables.
- Calculos centralizados y testeables.
- Backups antes de operaciones destructivas.
- Migracion tecnica a React, TypeScript, Vite, Dexie, Zod y Vitest.
- Backend futuro preparado para Node.js, Express, Prisma y SQLite/PostgreSQL.
- PWA instalable con app shell cacheada para uso offline del panel.
- Backend SQLite local disponible como capa paralela al frontend local-first.
- Sincronizacion manual LocalStorage/SQLite, sync por coleccion y modo API espejo opcional desde Configuracion.
- Seguridad local opcional para operaciones sensibles.
- Separacion explicita entre stock fisico, reservado y disponible.
- Autenticacion backend opcional con sesiones y roles cuando existe usuario activo.

## Decision Tecnica Objetivo

La siguiente etapa debe migrar la base frontend a:

- React para componentes y estado de UI.
- TypeScript para tipos de entidades, servicios y repositorios.
- Vite para desarrollo y build.
- Dexie.js sobre IndexedDB para persistencia real local-first.
- Zod para validar entradas antes de guardar.
- Vitest para calculos y logica critica.

Reglas clave:

- No usar LocalStorage como base de datos principal.
- Centralizar Dexie en `src/db/db.ts`.
- Acceder a datos mediante repositorios.
- Mantener calculos puros en `src/utils/calculations.ts`.
- Mantener pantallas libres de logica compleja de negocio.
- Crear export/import JSON desde IndexedDB.
- No implementar backend nuevo hasta que se solicite una etapa especifica.

Ver `docs/TECH_STACK_MIGRATION.md`.

## Capas Actuales

### UI

Archivos:

- `src/main.js`
- `src/router.js`
- `src/views/*`
- `src/styles/*`
- `src/html.js`
- `manifest.json`
- `service-worker.js`
- `assets/icon.svg`
- `assets/icon-maskable.svg`

Responsabilidades:

- renderizar pantallas,
- recoger formularios,
- mostrar toasts,
- navegar por hash,
- llamar servicios de negocio.
- registrar service worker,
- gestionar preferencia de tema,
- exponer modo cocina movil.

### Dominio

Archivos:

- `src/calculations.js`
- `src/reports.js`
- `src/exporters.js`
- `src/auth.js`
- `src/sync.js`

Responsabilidades:

- costes,
- rendimiento,
- merma,
- stock fisico, reservado y disponible por producto/lote,
- coste receta,
- burritos posibles,
- ingrediente limitante,
- precios sugeridos,
- coste pedido,
- reportes,
- CSV.
- PIN admin local,
- sesion admin local.
- merge por coleccion LocalStorage/SQLite,
- deteccion basica de conflictos de sincronizacion.

### Servicios de Aplicacion

Archivo:

- `src/services/businessService.js`

Responsabilidades:

- productos,
- proveedores,
- compras,
- movimientos,
- produccion,
- lotes,
- saborizacion,
- recetas,
- clientes,
- pedidos,
- feedback,
- configuracion.

### Persistencia

Archivo:

- `src/storage.js`
- `server/database.js`

Responsabilidades:

- `getData()`,
- `saveData(data)`,
- `resetData()`,
- `loadSeedData()`,
- `exportData()`,
- `importData(json)`,
- `createManualBackup(reason)`,
- `listBackups()`,
- `restoreBackup(id)`,
- `generateId(prefix)`,
- `getById(collection, id)`,
- `upsert(collection, item)`,
- `remove(collection, id)`.
- `loadBackendDataIfEnabled()`,
- espejo `PUT /api/data` en modo `api_mirror`.
- schema SQLite,
- migracion JSON a SQLite,
- lectura completa de datos desde SQLite,
- backups reales de `.sqlite`.

### Backend API

Archivos:

- `server/api.js`
- `server/auth.js`
- `server/server.js`
- `server/cli.js`
- `src/apiClient.js`

Responsabilidades:

- exponer endpoints REST locales,
- reutilizar servicios de negocio existentes,
- importar/exportar JSON,
- crear backups de base,
- servir reportes desde SQLite,
- autenticar usuarios backend,
- aplicar roles `viewer`, `operator` y `admin`,
- exponer `POST /api/sync/:collection` para upsert raw por coleccion,
- preparar migracion futura a Express.
- sincronizar datos locales y backend desde la UI, manualmente, por coleccion o en modo API espejo.

### Modelos y Validacion

Archivos:

- `src/models.js`
- `src/validators.js`
- `src/constants.js`
- `src/seed.js`

Responsabilidades:

- schema local,
- migracion a `schemaVersion` actual,
- defaults,
- validaciones de formularios,
- datos seed reales.

## Persistencia Local

Clave principal:

```txt
ramp-bites-control-panel:v1
```

Clave de backup:

```txt
ramp-bites-control-panel:backup
```

Historial de backup:

```txt
ramp-bites-control-panel:backup:history
```

Base SQLite:

```txt
data/ramp-bites.sqlite
```

Backups SQLite:

```txt
backups/*.sqlite
```

Preferencias PWA/UI:

```txt
ramp-bites-control-panel:theme
ramp-bites-control-panel:kitchen-checklist
ramp-bites-control-panel:kitchen-timer
ramp-bites-control-panel:backend-auth-token
```

Colecciones:

- `products`
- `suppliers`
- `purchases`
- `priceHistory`
- `stockMovements`
- `productionBatches`
- `lots`
- `recipes`
- `clients`
- `orders`
- `feedback`

## Reglas Criticas

- El stock fisico, reservado y disponible se calcula desde `stockMovements`.
- El stock fisico ignora `reserva` y `liberacion_reserva`.
- El stock reservado es la reserva neta activa.
- El stock disponible descuenta reservas y se usa para produccion, venta, simulacion y descarte.
- Las compras crean lote, movimiento e historial de precio.
- Las producciones consumen lote crudo y generan lote cocido.
- La saborizacion transforma carne neutra en saborizada con movimientos.
- Los pedidos reservan stock al confirmar, liberan al cancelar y convierten reserva en venta al entregar.
- No se puede descartar un lote con reserva activa.
- Los pedidos entregados no se editan; se corrigen con ajuste trazable.
- Backups se crean antes de import, reset y restore.
- El modo API espejo crea backup local antes de cargar datos del backend al iniciar.
- La sync por coleccion crea backup local, fusiona por fecha de actualizacion y conserva la version local ante conflicto.
- La sync por coleccion no propaga borrados todavia porque falta tombstone o `deletedAt`.
- La seguridad local puede pedir PIN admin antes de operaciones destructivas.
- Imports legacy sin `schemaVersion` migran a schema actual.
- Imports con schema futuro se rechazan.
- El backend usa las mismas reglas de negocio para compras, producciones, recetas, clientes y pedidos.
- Los backups SQLite se crean antes de import, seed y restore.
- Si existe usuario backend activo, la API exige Bearer token.
- Lectura requiere `viewer`, operaciones de negocio `operator`, y acciones destructivas/configuracion `admin`.

## Preparacion Backend

La UI no debe llamar directamente a LocalStorage ni a Dexie sin repositorios. Para migrar:

1. Crear capa Dexie en `src/db/db.ts`.
2. Crear tipos TypeScript en `src/types/`.
3. Crear schemas Zod en `src/schemas/`.
4. Migrar calculos a `src/utils/calculations.ts`.
5. Crear servicios por modulo en `src/services/`.
6. Mantener export/import JSON para mover datos del MVP actual a IndexedDB.
7. Preparar backend futuro con Prisma y API REST.

Estado actual:

- SQLite local implementado con `node:sqlite`.
- API REST implementada con `node:http`.
- UI conectada al backend mediante acciones manuales y modo API espejo opcional.
- Sync por coleccion implementada con endpoint raw y conflictos basicos local-first.
- Seguridad local implementada en frontend con PIN admin hasheado.
- Autenticacion backend implementada con usuarios SQLite, roles y sesiones.
- Express queda como adaptacion futura para mantener el proyecto sin dependencias externas por ahora.
- Decision nueva: React/Dexie sera la base local principal antes de crecer mas funcionalidades.

Ver `docs/BACKEND_PLAN.md`.
