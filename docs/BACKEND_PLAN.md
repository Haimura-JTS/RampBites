# Backend Plan

Plan futuro para migrar Ramp Bites Control Panel desde LocalStorage a una persistencia mas robusta.

## Objetivo

La primera version sera local-first. El backend no se implementa en Etapa 0 ni Etapa 1, pero la arquitectura debe dejar una ruta clara de migracion.

## Principio de Migracion

La UI no debe depender directamente de LocalStorage. Toda persistencia debe pasar por `src/storage.js` o una capa equivalente.

Contrato inicial:

```js
loadDatabase()
saveDatabase(database)
resetDatabase()
seedDatabaseIfNeeded()
getCollection(name)
upsertEntity(collectionName, entity)
deleteEntity(collectionName, id)
```

## Fase A - LocalStorage

Uso:

- Prototipo local.
- Un solo usuario.
- Datos pequenos.
- Exportacion/importacion manual.

Riesgos:

- Limite de espacio.
- Sin consultas complejas.
- Sin concurrencia.
- Facil de borrar desde navegador.

Mitigacion:

- Backups JSON.
- Schema versionado.
- Validacion antes de importar.

## Fase B - IndexedDB

Uso:

- Local-first mas robusto.
- Mayor volumen.
- Consultas por indices.

Colecciones candidatas:

- `products`
- `suppliers`
- `purchases`
- `stockLots`
- `stockMovements`
- `productionBatches`
- `recipes`
- `orders`

## Fase C - SQLite

Uso:

- App local de escritorio o backend ligero.
- Consultas historicas mas fiables.
- Reportes y agregaciones.

Tablas candidatas:

- `products`
- `suppliers`
- `purchase_lines`
- `stock_lots`
- `stock_movements`
- `production_batches`
- `production_inputs`
- `production_outputs`
- `recipes`
- `recipe_ingredients`
- `customers`
- `orders`
- `order_lines`
- `allergens`
- `product_allergens`
- `recipe_allergens`

## Fase D - Backend Node.js

Uso:

- Multiusuario.
- Backups centralizados.
- Roles y auditoria.
- Acceso desde varios dispositivos.

API futura sugerida:

- `GET /api/products`
- `POST /api/products`
- `GET /api/stock/lots`
- `GET /api/stock/movements`
- `POST /api/purchases`
- `POST /api/production-batches`
- `POST /api/orders`
- `GET /api/reports/summary`
- `POST /api/backups/export`
- `POST /api/backups/import`

## Reglas que Deben Sobrevivir a la Migracion

- Stock derivado de movimientos.
- Trazabilidad por lote.
- Producciones pendientes sin stock vendible.
- Costes calculados desde inputs reales.
- Multiplicadores de precio configurables.
- Ternera en standby/premium.
- Exportacion e importacion versionadas.

## No Implementar Aun

- Autenticacion.
- Servidor Node.js.
- Base de datos real.
- Sincronizacion remota.
- Roles de usuario.
- Deploy cloud.
