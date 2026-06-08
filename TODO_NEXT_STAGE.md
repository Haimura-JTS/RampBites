# TODO NEXT STAGE

## Checkpoint Actual

Etapa cerrada: **ETAPA 13 - Reservas de stock en pedidos**.

Fecha: 2026-06-08.

## Completado

- Se leyeron `README.md`, `CHANGELOG.md` y `TODO_NEXT_STAGE.md` antes de modificar.
- Se agregaron tipos de movimiento:
  - `reserva`,
  - `liberacion_reserva`.
- Confirmar pedido, pasarlo a `en_produccion` o `listo` reserva stock disponible.
- Cancelar pedido o volverlo a `pendiente` / `borrador` libera la reserva activa.
- Entregar pedido convierte la reserva en venta:
  - crea `liberacion_reserva`,
  - crea `venta`,
  - mantiene trazabilidad por lote.
- Si se entrega un pedido sin reserva previa, se reserva primero y luego se convierte en venta.
- Se evita editar pedidos con stock reservado para no romper trazabilidad.
- La planificacion/lista de compra no vuelve a contar necesidades de pedidos ya reservados.
- La pantalla Pedidos muestra:
  - metrica `Reservados`,
  - badge `reservado`,
  - regla de stock actualizada.
- Se actualizo version visible a `0.13.0`, `APP_STAGE` a Etapa 13 y cache PWA a `0.13.0`.
- Se ampliaron tests de pedidos para reserva, liberacion, entrega y reconfirmacion.

## Archivos Modificados

- `README.md`
- `CHANGELOG.md`
- `TODO_NEXT_STAGE.md`
- `package.json`
- `service-worker.js`
- `src/calculations.js`
- `src/constants.js`
- `src/main.js`
- `src/models.js`
- `src/services/businessService.js`
- `src/views/ordersView.js`
- `tests/orders.test.js`
- `tests/pwa.test.js`
- `docs/ARCHITECTURE.md`
- `docs/BACKEND_PLAN.md`
- `docs/INDEX.md`
- `docs/QA_CHECKLIST.md`
- `docs/ROADMAP.md`

## Verificacion

- `npm.cmd test` pasa correctamente: 45/45.
- `node --check` paso para JS/MJS de `src/`, `server/` y `scripts/`.
- Prueba HTTP basica del dev server en `http://127.0.0.1:5199/index.html`:
  - status `200`,
  - `#app` presente,
  - `src/main.js` presente.

## Etapa Siguiente

No hay siguiente prompt obligatorio definido.

Opciones razonables para una proxima etapa:

- sincronizacion por coleccion en vez de reemplazo completo,
- roles activos en UI/API,
- autenticacion backend real,
- resolver conflictos entre LocalStorage y SQLite,
- adaptar `server/api.js` a Express si se acepta dependencia,
- mejorar reportes especificos de reservas y compromisos de stock.

## Riesgos o Bugs Pendientes

- La reserva usa movimientos de stock y funciona en uso local; no hay control de concurrencia multiusuario.
- Si dos navegadores editan contra el mismo backend en modo espejo, pueden pisarse reservas.
- El modo `api_mirror` reemplaza el dataset completo del backend en cada guardado local.
- La seguridad local ayuda contra acciones accidentales, pero no es autenticacion backend real.
- Express no esta instalado; la API usa `node:http` para seguir sin dependencias externas.
- `node:sqlite` emite aviso experimental en Node 24.
