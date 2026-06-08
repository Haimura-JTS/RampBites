# Architecture

Ramp Bites Control Panel es una app web local-first para gestion interna de produccion artesanal de burritos.

## Principios

- UI en espanol.
- LocalStorage como persistencia inicial.
- Logica de negocio separada de la interfaz.
- Stock derivado de movimientos trazables.
- Datos seed editables.
- Calculos centralizados y testeables.
- Backups antes de operaciones destructivas.
- Migracion futura a IndexedDB, SQLite o backend Node.js.
- PWA instalable con app shell cacheada para uso offline del panel.
- Backend SQLite local disponible como capa paralela al frontend local-first.
- Sincronizacion manual LocalStorage/SQLite desde Configuracion y modo API espejo opcional.

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

Responsabilidades:

- costes,
- rendimiento,
- merma,
- stock por producto/lote,
- coste receta,
- burritos posibles,
- ingrediente limitante,
- precios sugeridos,
- coste pedido,
- reportes,
- CSV.

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
- `server/server.js`
- `server/cli.js`
- `src/apiClient.js`

Responsabilidades:

- exponer endpoints REST locales,
- reutilizar servicios de negocio existentes,
- importar/exportar JSON,
- crear backups de base,
- servir reportes desde SQLite,
- preparar migracion futura a Express.
- sincronizar datos locales y backend desde la UI, manualmente o en modo API espejo.

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

- El stock disponible se calcula desde `stockMovements`.
- Las compras crean lote, movimiento e historial de precio.
- Las producciones consumen lote crudo y generan lote cocido.
- La saborizacion transforma carne neutra en saborizada con movimientos.
- Los pedidos descuentan stock al marcar `entregado`.
- Los pedidos entregados no se editan; se corrigen con ajuste trazable.
- Backups se crean antes de import, reset y restore.
- El modo API espejo crea backup local antes de cargar datos del backend al iniciar.
- Imports legacy sin `schemaVersion` migran a schema actual.
- Imports con schema futuro se rechazan.
- El backend usa las mismas reglas de negocio para compras, producciones, recetas, clientes y pedidos.
- Los backups SQLite se crean antes de import, seed y restore.

## Preparacion Backend

La UI no debe llamar directamente a LocalStorage. Para migrar:

1. Sustituir `src/storage.js` por cliente API o repositorio IndexedDB.
2. Mantener `calculations.js`, `reports.js` y reglas de negocio.
3. Mover servicios de dominio al backend de forma progresiva.
4. Migrar JSON exportado a SQLite.

Estado actual:

- SQLite local implementado con `node:sqlite`.
- API REST implementada con `node:http`.
- UI conectada al backend mediante acciones manuales y modo API espejo opcional.
- Express queda como adaptacion futura para mantener el proyecto sin dependencias externas por ahora.

Ver `docs/BACKEND_PLAN.md`.
