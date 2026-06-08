# TODO NEXT STAGE

## Checkpoint Actual

Etapa cerrada: **ETAPA 14 - Stock fisico, reservado y disponible**.

Fecha: 2026-06-09.

## Completado

- Se leyeron `README.md`, `CHANGELOG.md` y `TODO_NEXT_STAGE.md` antes de modificar.
- Se agregaron calculos explicitos para:
  - stock fisico por producto y lote,
  - stock reservado por producto y lote,
  - stock disponible por producto y lote,
  - resumen `calculateStockCommitments()`.
- `calculateStockByProduct()` y `calculateStockByLot()` mantienen el significado operativo de stock disponible, para no romper pedidos, simulador ni produccion.
- `calculateLotSummaries()` ahora expone:
  - `physicalQuantity`,
  - `reservedQuantity`,
  - `availableQuantity`,
  - `currentQuantity` como disponible.
- Un lote totalmente reservado ya no se marca como agotado si sigue existiendo fisicamente.
- Dashboard muestra:
  - stock reservado,
  - valor de stock fisico,
  - alerta de stock comprometido.
- Stock muestra columnas:
  - fisico,
  - reservado,
  - disponible.
- Lotes muestra fisico/reservado/disponible y oculta descarte cuando hay reserva activa.
- El detalle de lote muestra stock fisico, reservado y disponible.
- Reportes incluye:
  - tarjeta de stock,
  - tabla de stock comprometido,
  - valor fisico, reservado y disponible.
- CSV de stock exporta:
  - `stock_fisico`,
  - `stock_reservado`,
  - `stock_disponible`.
- El descarte de lote queda bloqueado si el lote tiene reserva activa.
- Version actualizada a `0.14.0`, `APP_STAGE` a Etapa 14 y cache PWA a `0.14.0`.
- Se ampliaron tests de calculos, reportes, CSV y bloqueo de descarte con reserva.

## Archivos Modificados

- `README.md`
- `CHANGELOG.md`
- `TODO_NEXT_STAGE.md`
- `package.json`
- `service-worker.js`
- `src/calculations.js`
- `src/constants.js`
- `src/exporters.js`
- `src/main.js`
- `src/reports.js`
- `src/services/businessService.js`
- `src/views/dashboardView.js`
- `src/views/lotsView.js`
- `src/views/ordersView.js`
- `src/views/reportsView.js`
- `src/views/stockView.js`
- `tests/calculations.test.js`
- `tests/orders.test.js`
- `tests/pwa.test.js`
- `tests/reports.test.js`
- `docs/ARCHITECTURE.md`
- `docs/BUSINESS_RULES.md`
- `docs/INDEX.md`
- `docs/QA_CHECKLIST.md`
- `docs/ROADMAP.md`

## Verificacion

- `npm.cmd test` pasa correctamente: 48/48.
- `node --check` paso para JS/MJS de `src/`, `server/` y `scripts/`.

## Etapa Siguiente

No hay siguiente prompt obligatorio definido.

Opciones razonables para una proxima etapa:

- autenticacion backend real con usuarios y sesiones,
- roles activos en UI/API,
- sincronizacion por coleccion en vez de reemplazo completo,
- resolucion de conflictos entre LocalStorage y SQLite,
- reportes avanzados de reservas por fecha de entrega,
- adaptar `server/api.js` a Express si se acepta dependencia.

## Riesgos o Bugs Pendientes

- La reserva usa movimientos de stock y funciona en uso local; no hay control de concurrencia multiusuario.
- Si dos navegadores editan contra el mismo backend en modo espejo, pueden pisarse reservas.
- El modo `api_mirror` reemplaza el dataset completo del backend en cada guardado local.
- La seguridad local ayuda contra acciones accidentales, pero no es autenticacion backend real.
- Express no esta instalado; la API usa `node:http` para seguir sin dependencias externas.
- `node:sqlite` emite aviso experimental en Node 24.
