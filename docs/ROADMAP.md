# Roadmap

Roadmap vivo de Ramp Bites Control Panel. Las etapas 0 a 13 dejan un MVP local usable, instalable, probado, con backend SQLite, sincronizacion manual, modo API espejo opcional, seguridad local y reservas de stock por pedido.

## MVP Local

Estado: completado en Etapas 0-13.

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
- seguridad local con PIN admin para operaciones sensibles,
- reservas de stock al confirmar pedidos y conversion a venta al entregar.

## Backend

Objetivo: pasar de LocalStorage a Node.js + SQLite y preparar Express.

Estado: base local completada en Etapa 9, sincronizacion manual en Etapa 10 y API espejo en Etapa 11.

Incluye:

- API REST local.
- Migracion desde JSON exportado.
- SQLite con schema inicial.
- Backups reales.
- Reutilizar reglas de negocio actuales.
- Cliente API en `src/apiClient.js`.
- Modo `api_mirror` desde Configuracion.

Pendiente:

- sincronizacion por coleccion y resolucion de conflictos,
- instalar/adaptar Express si se acepta dependencia externa,
- autenticacion,
- multiusuario.

## Login / Autenticacion

Objetivo: proteger operaciones sensibles.

Estado: seguridad local completada en Etapa 12; autenticacion backend real pendiente.

Primer alcance:

- usuario admin local,
- sesiones de servidor,
- proteccion de import/reset/restore en API,
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
