# Backend Plan

Plan de migracion de Ramp Bites Control Panel desde LocalStorage a backend local/profesional. La base local SQLite ya existe desde Etapa 9.

## Objetivo

Mantener la app local-first mientras el negocio valida procesos, y abrir una ruta progresiva hacia:

- Node.js
- Express
- SQLite
- API REST
- autenticacion
- multiusuario
- roles
- backup real de base de datos
- exportacion PDF/Excel

La regla central no cambia: el stock se deriva de movimientos y los costes se calculan desde compras, producciones, recetas y pedidos.

## Arquitectura Propuesta

```txt
frontend HTML/CSS/JS
  |
  | REST JSON
  v
Node.js API REST
  |
  v
SQLite
```

Estado actual:

- Implementado con `node:http` para mantener cero dependencias externas.
- SQLite implementado con `node:sqlite` de Node 24.
- Frontend conectado mediante sincronizacion manual y modo API espejo opcional.
- Seguridad local frontend disponible para operaciones sensibles.
- Express queda como adaptacion futura de `server/api.js`.

Capas:

- `api`: rutas REST y validacion de entrada.
- `services`: reglas de negocio, costes, stock, produccion y pedidos.
- `repositories`: consultas SQLite.
- `migrations`: versionado de schema.
- `backups`: copia de `.sqlite`, export JSON y restauracion.
- `auth`: login, sesiones y roles.

## Tablas Iniciales

- `products`
- `suppliers`
- `purchases`
- `purchase_items`
- `stock_movements`
- `production_batches`
- `production_inputs`
- `lots`
- `recipes`
- `recipe_items`
- `clients`
- `orders`
- `order_items`
- `feedback`
- `settings`
- `price_history`
- `users`
- `roles`
- `audit_log`

Estas tablas ya existen en el schema inicial de `server/database.js`; varias guardan `payload_json` completo para preservar fidelidad con el modelo LocalStorage mientras se normalizan campos gradualmente.

## Endpoints REST Esperados

- `GET /api/products`
- `POST /api/products`
- `PATCH /api/products/:id`
- `GET /api/suppliers`
- `POST /api/suppliers`
- `GET /api/purchases`
- `POST /api/purchases`
- `GET /api/stock-movements`
- `POST /api/stock-movements`
- `GET /api/production-batches`
- `POST /api/production-batches`
- `POST /api/production-batches/:id/complete`
- `GET /api/lots`
- `POST /api/lots/:id/discard`
- `GET /api/recipes`
- `POST /api/recipes`
- `GET /api/clients`
- `POST /api/clients`
- `GET /api/orders`
- `POST /api/orders`
- `POST /api/orders/:id/deliver`
- `GET /api/reports/dashboard`
- `GET /api/reports/production`
- `GET /api/reports/sales`
- `GET /api/reports/prices`
- `POST /api/backups`
- `GET /api/backups`
- `POST /api/backups/:id/restore`
- `GET /api/export/:type`

## Migracion Desde LocalStorage

1. Exportar JSON desde Configuracion.
2. Validar `schemaVersion`.
3. Ejecutar migrador a schema SQLite actual.
4. Insertar datos en transaccion.
5. Recalcular reportes derivados.
6. Comparar totales clave:
   - stock por producto,
   - stock por lote,
   - compras totales,
   - pedidos entregados,
   - coste de recetas.

Comando actual:

```bash
npm.cmd run backend:import -- ruta\backup.json
```

Tambien se puede cargar seed:

```bash
npm.cmd run backend:seed
```

## Autenticacion y Roles

Estado actual:

- Existe seguridad local con PIN admin hasheado para evitar acciones accidentales en un solo dispositivo.
- No existe autenticacion backend real todavia.
- No hay usuarios, sesiones de servidor ni roles aplicados en API.

Roles sugeridos:

- `admin`: configuracion, backups, importacion, reset.
- `operaciones`: compras, stock, produccion, lotes.
- `ventas`: clientes, pedidos, feedback.
- `consulta`: dashboard y reportes.

No guardar datos sensibles innecesarios. Para clientes, mantener contacto operativo y alergias declaradas solo cuando sea necesario para preparar pedidos.

## Backups Reales

- Backup manual de archivo SQLite.
- Backup automatico antes de migraciones.
- Export JSON versionado.
- Retencion configurable.
- Verificacion de integridad antes de restaurar.

Estado actual:

- `POST /api/backups` crea backup `.sqlite`.
- `POST /api/backups/:filename/restore` restaura backup.
- CLI: `npm.cmd run backend:backup`.

## Exportacion PDF/Excel

Futuro:

- PDF de reportes de produccion.
- PDF de pedidos del dia.
- Excel/CSV de compras, stock, ventas y costes.
- Posible integracion con Google Sheets.

## Riesgos

- Concurrencia de stock si hay varios usuarios.
- Edicion de pedidos ya entregados.
- Restauracion de backups antiguos.
- Diferencias entre stock calculado y stock real si se hacen ajustes fuera del sistema.
- `node:sqlite` esta marcado como experimental por Node 24.
- Frontend no usa backend por defecto; `manual` sigue siendo el modo inicial.
- Modo `api_mirror` reemplaza el dataset completo del backend en cada guardado local.
- La seguridad local no protege contra manipulacion directa de LocalStorage.
- API HTTP nativa pendiente de adaptar a Express si se acepta dependencia.

## Reglas Que Deben Sobrevivir

- Ternera sigue en standby/premium hasta cambio explicito.
- Carne cocida con fecha de coccion y fecha limite de uso.
- No afirmar cumplimiento legal alimentario.
- Stock se reserva y descuenta con movimientos trazables.
- Producciones finalizadas no se corrigen sin ajuste trazable.
