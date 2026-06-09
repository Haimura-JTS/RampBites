# Roadmap

Roadmap vivo de Ramp Bites Control Panel. Las etapas 0 a 16 dejan un MVP local usable, instalable, probado, con backend SQLite, sincronizacion manual, modo API espejo opcional, sync por coleccion, seguridad local, reservas de stock por pedido, control de stock fisico/reservado/disponible y autenticacion backend con roles.

## MVP Local

Estado: completado en Etapas 0-16.

Incluye:

- app shell local-first,
- LocalStorage versionado,
- seed real editable,
- productos,
- proveedores,
- compras,
- historial de precios,
- stock y movimientos,
- produccion por tandas,
- lotes,
- caducidad/conservacion,
- saborizacion,
- recetas,
- simulador,
- clientes,
- pedidos,
- pagos,
- feedback,
- lista de compra automatica,
- dashboard avanzado,
- reportes,
- backups,
- exportacion/importacion JSON,
- exportacion CSV,
- tests y QA base,
- PWA instalable,
- modo cocina movil,
- temporizador,
- checklist de produccion,
- backend SQLite local,
- API REST,
- backups de base de datos,
- sincronizacion manual LocalStorage/SQLite,
- modo API espejo con carga inicial desde backend y envio automatico de guardados,
- sincronizacion por coleccion con conflictos basicos,
- seguridad local con PIN admin para operaciones sensibles,
- reservas de stock al confirmar pedidos y conversion a venta al entregar,
- separacion de stock fisico, reservado y disponible en UI, reportes y CSV,
- autenticacion backend con sesiones Bearer token y roles.

## Backend

Objetivo: pasar de LocalStorage a Node.js + SQLite y preparar Express.

Estado: base local completada en Etapa 9, sincronizacion manual en Etapa 10, API espejo en Etapa 11, autenticacion backend en Etapa 15 y sync por coleccion en Etapa 16.

Incluye:

- API REST local.
- Migracion desde JSON exportado.
- SQLite con schema inicial.
- Backups reales.
- Reutilizar reglas de negocio actuales.
- Cliente API en `src/apiClient.js`.
- Modo `api_mirror` desde Configuracion.
- Auth backend con roles `admin`, `operator`, `viewer`.
- Sync por coleccion mediante `POST /api/sync/:collection`.

Pendiente:

- tombstones para borrados,
- resolucion manual de conflictos,
- instalar/adaptar Express si se acepta dependencia externa,
- multiusuario.

## Login / Autenticacion

Objetivo: proteger operaciones sensibles.

Estado: seguridad local completada en Etapa 12; autenticacion backend real completada en Etapa 15.

Primer alcance:

- bootstrap de primer admin,
- sesiones de servidor,
- proteccion de import/reset/restore en API,
- roles activos en API,
- registro de auditoria basico.

## Multiusuario

Objetivo: que varias personas puedan operar sin pisar datos.

Primer alcance:

- roles,
- bloqueo o transacciones para stock,
- auditoria por usuario,
- resolucion de conflictos en pedidos/stock.

## PWA

Objetivo: modo cocina movil instalable.

Estado: completado en Etapa 8.

Incluye:

- `manifest.json`,
- service worker,
- offline,
- botones grandes,
- pantalla rapida de produccion,
- pantalla rapida de pedidos,
- checklist de coccion,
- temporizador.

## Escaneo Tickets

Objetivo: acelerar carga de compras.

Ideas:

- OCR local o asistido,
- captura de fecha/proveedor/importe,
- lineas sugeridas editables,
- validacion manual antes de guardar.

## Fotos Productos

Objetivo: reconocer productos/insumos y documentar lotes.

Ideas:

- foto de ticket,
- foto de producto,
- foto de lote cocido,
- galeria por compra/lote.

## QR Pedidos

Objetivo: facilitar entrega y trazabilidad.

Ideas:

- QR por pedido,
- vista rapida de pedido,
- estado de pago,
- feedback posterior.

## Integracion Google Sheets

Objetivo: exportar/reportar sin duplicar carga manual.

Ideas:

- export periodico de ventas,
- coste por receta,
- stock critico,
- compras por proveedor.

## Reportes Financieros

Objetivo: mejorar decisiones de negocio.

Ideas:

- margen por periodo,
- margen por receta,
- coste por proveedor,
- tendencia de precios,
- forecast de compra,
- caja cobrada vs pendiente.

## Criterio Para Backend

Migrar cuando se cumpla al menos uno:

- varios usuarios necesitan operar,
- LocalStorage se queda corto,
- se necesita historico mas robusto,
- se requiere backup real automatico,
- se empiezan a tomar decisiones financieras recurrentes con los reportes.
