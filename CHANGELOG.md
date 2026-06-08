# CHANGELOG

## [Unreleased - Etapa 14] - 2026-06-09

### Added

- Calculos explicitos de stock fisico, stock reservado y stock disponible por producto y lote.
- Reporte `getStockCommitmentReport()` para stock comprometido por pedidos confirmados.
- Metricas de stock reservado y valor fisico en Dashboard.
- Columnas `Fisico`, `Reservado` y `Disponible` en Stock y Lotes.
- Tabla de stock comprometido en Reportes.
- Export CSV de stock con `stock_fisico`, `stock_reservado` y `stock_disponible`.
- Detalle de lote con fisico, reservado y disponible.
- Tests de calculo, reportes, CSV y bloqueo de descarte con reserva activa.

### Changed

- Version visible del proyecto actualizada a `0.14.0`.
- `APP_STAGE` pasa a Etapa 14.
- Cache PWA actualizado a `ramp-bites-control-panel-v0.14.0`.
- El valor estimado de inventario se calcula sobre stock fisico, no sobre disponible.
- Las alertas de stock bajo siguen usando stock disponible.

### Fixed

- Un lote completamente reservado ya no aparece como agotado mientras siga existiendo fisicamente.
- No se permite descartar un lote con reserva activa.

## [Unreleased - Etapa 13] - 2026-06-08

### Added

- Reservas de stock al confirmar pedido o pasar a `en_produccion` / `listo`.
- Movimientos de stock `reserva` y `liberacion_reserva`.
- Liberacion automatica de reserva al cancelar pedido o volver a estados sin reserva.
- Entrega desde reserva: libera reserva y crea movimientos `venta`.
- Indicador visual `reservado` en la tabla de pedidos.
- Metrica de pedidos reservados en la pantalla de Pedidos.
- Tests de reserva, liberacion, entrega y reconfirmacion en `tests/orders.test.js`.

### Changed

- Version visible del proyecto actualizada a `0.13.0`.
- `APP_STAGE` pasa a Etapa 13.
- Cache PWA actualizado a `ramp-bites-control-panel-v0.13.0`.
- La lista de compra evita contar dos veces pedidos que ya tienen stock reservado.

### Fixed

- Confirmar, liberar y volver a confirmar el mismo pedido ya no duplica reservas al entregar.

## [Unreleased - Etapa 12] - 2026-06-08

### Added

- Modulo `src/auth.js` para seguridad local.
- PIN admin hasheado con salt mediante Web Crypto.
- Sesion admin local en `sessionStorage` con caducidad configurable.
- Panel `Seguridad local` en Configuracion.
- Acciones para guardar PIN, desbloquear admin y bloquear admin.
- Proteccion opcional para:
  - importar JSON,
  - reset demo,
  - restaurar backups,
  - enviar local al backend,
  - traer backend a local,
  - cargar seed backend.
- Tests de seguridad local en `tests/auth.test.js`.

### Changed

- Version visible del proyecto actualizada a `0.12.0`.
- `APP_STAGE` pasa a Etapa 12.
- Cache PWA actualizado a `ramp-bites-control-panel-v0.12.0`.
- `settings.security` se normaliza y migra junto con el resto de settings.

### Notes

- La seguridad local reduce accidentes en un uso de un solo dispositivo.
- No sustituye autenticacion backend, usuarios reales, roles ni control multiusuario.

## [Unreleased - Etapa 11] - 2026-06-07

### Added

- Modo backend `api_mirror` opcional desde Configuracion.
- Carga inicial desde `GET /api/data` cuando el modo API espejo esta activo.
- Envio automatico en segundo plano a `PUT /api/data` tras `saveData()` local en modo API espejo.
- Fallback local-first si el backend no esta disponible.
- Etiqueta de footer para distinguir `LocalStorage` de `LocalStorage + API espejo`.
- Tests de sincronizacion API en `tests/backendSync.test.js`.

### Changed

- Version visible del proyecto actualizada a `0.11.0`.
- `APP_STAGE` pasa a Etapa 11.
- Cache PWA actualizado a `ramp-bites-control-panel-v0.11.0`.
- Configuracion backend permite elegir entre `manual` y `api espejo`.

### Notes

- El modo API espejo reemplaza el dataset completo del backend en cada guardado local; sigue siendo una etapa de transicion, no multiusuario.
- No se implementan autenticacion, roles ni resolucion de conflictos concurrentes todavia.

## [Unreleased - Etapa 10] - 2026-06-07

### Added

- Configuracion backend en settings: URL API, modo manual, estado y fechas de sincronizacion.
- Panel `Backend SQLite` en Configuracion.
- Acciones UI:
  - comprobar API,
  - enviar datos LocalStorage al backend,
  - traer datos SQLite al navegador,
  - crear backup backend,
  - cargar seed backend.
- Confirmaciones para operaciones que reemplazan datos.
- Backup local automatico antes de traer datos desde backend.
- `src/apiClient.js` integrado desde la UI.
- Tests de settings/backend en `tests/settingsBackend.test.js`.

### Changed

- Version visible del proyecto actualizada a `0.10.0`.
- `APP_STAGE` pasa a Etapa 10.
- Cache PWA actualizado a `ramp-bites-control-panel-v0.10.0`.

### Notes

- La UI sigue siendo LocalStorage-first. La sincronizacion con SQLite es manual y explicita.
- El modo API operativo para todos los CRUD queda como etapa futura.

## [Unreleased - Etapa 9] - 2026-06-07

### Added

- Backend local SQLite en `server/` usando `node:sqlite`.
- API REST local en `server/api.js` usando `node:http`.
- Schema SQLite con tablas principales: productos, proveedores, compras, items, movimientos, producciones, lotes, recetas, clientes, pedidos, feedback, settings, usuarios, roles y auditoria.
- Migracion desde JSON local-first a SQLite.
- CLI backend para `init`, `seed`, `import`, `export`, `backup` y `backups`.
- Backups reales de archivo `.sqlite` en `backups/`.
- Endpoints REST para colecciones, reportes, import/export JSON, seed, backups y acciones como entregar pedido, completar produccion y descartar lote.
- Cliente API futuro en `src/apiClient.js`.
- Tests de backend en `tests/backend.test.js`.

### Changed

- Version visible del proyecto actualizada a `0.9.0`.
- `APP_STAGE` pasa a Etapa 9.
- Cache PWA actualizado a `ramp-bites-control-panel-v0.9.0`.
- `package.json` agrega scripts de backend.
- `.gitignore` ignora `data/` y `backups/`.

### Notes

- No se instalo Express para mantener el proyecto ejecutable sin dependencias externas; la API queda estructurada para migrar a Express cuando se acepte esa dependencia.
- `node:sqlite` emite aviso experimental en Node 24.

### Not Implemented Yet

- Frontend conectado automaticamente al backend.
- Autenticacion real.
- Multiusuario.
- Roles activos en la UI.

## [Unreleased - Etapa 8] - 2026-06-07

### Added

- `manifest.json` con nombre, scope, display standalone, colores e iconos SVG.
- Service worker con cache de app shell, modulos, vistas, estilos e iconos.
- Iconos `assets/icon.svg` y `assets/icon-maskable.svg`.
- Ruta `Cocina` con botones grandes para movil.
- Pantalla movil de produccion rapida conectada a `saveProductionBatch`.
- Pantalla movil de pedido rapido conectada a `saveOrder`.
- Temporizador de coccion con persistencia local.
- Checklist de produccion persistente para cocina.
- Modo oscuro opcional con preferencia guardada.
- Boton de instalacion PWA cuando el navegador emite `beforeinstallprompt`.
- Test PWA/cocina en `tests/pwa.test.js`.

### Changed

- Version visible del proyecto actualizada a `0.8.0`.
- `APP_STAGE` pasa a Etapa 8.
- Servidor local sirve SVG con MIME `image/svg+xml`.
- README, Roadmap e indice de documentacion actualizados al estado PWA.

### Not Implemented Yet

- Backend Node.js + SQLite.
- Autenticacion real.
- Multiusuario.
- Reservas de stock al confirmar pedido.

## [Unreleased - Etapa 7] - 2026-06-07

### Added

- Migracion explicita de datos legacy hacia `schemaVersion` actual.
- Validacion de backups antes de listar/restaurar.
- Restauracion de backup usando el mismo flujo de migracion que import JSON.
- Tests de storage en `tests/storage.test.js`.
- Smoke test funcional punta a punta en `tests/functionalSmoke.test.js`.
- Checklist manual de QA en `docs/QA_CHECKLIST.md`.
- Skip link, foco visible y `aria-current` en navegacion.
- Toasts con role `status` o `alert`.
- `docs/BACKEND_PLAN.md` actualizado para Node.js, Express, SQLite, API REST, autenticacion, multiusuario, roles, backup real y exportacion PDF/Excel.
- `docs/ROADMAP.md` actualizado con MVP local, backend, login, multiusuario, PWA, escaneo tickets, fotos, QR, Google Sheets y reportes financieros.
- `docs/ARCHITECTURE.md` e `docs/INDEX.md` actualizados al estado real del MVP.

### Changed

- Version visible del proyecto actualizada a `0.7.0`.
- `APP_STAGE` pasa a Etapa 7.
- `importData` acepta exports legacy sin `schemaVersion` y los normaliza a schema actual.
- README queda como guia final de ejecucion y uso local.

### Fixed

- Imports con schema futuro se rechazan con mensaje claro.
- Backups corruptos o invalidos ya no aparecen como restaurables.
- JSON corrupto de LocalStorage conserva copia y carga una base limpia.

### Not Implemented Yet

- PWA y modo cocina movil.
- Backend Node.js + SQLite.
- Autenticacion real.
- Multiusuario.

## [Unreleased - Etapa 6] - 2026-06-06

### Added

- Dashboard avanzado con ventas del dia, ventas de la semana, coste estimado, ganancia bruta, pedidos pendientes, entregados, pendiente de cobro, producto mas vendido, receta mas/menos rentable, stock critico, lotes urgentes, burritos posibles e ingrediente limitante.
- Modulo `src/reports.js` para metricas reutilizables de dashboard, produccion, ventas, proveedores/precios y costes.
- Vista real de Reportes con tablas de produccion, ventas, precios/proveedores y costes por receta.
- Metricas de produccion: rendimiento promedio, coste promedio por 100 g, mejor proveedor por coste final y mejor corte por rendimiento.
- Metricas de ventas: total vendido, cobrado, pendiente de cobro, ganancia bruta y margen promedio.
- Metricas de precios/proveedores: ultimo precio, minimo, maximo, variacion, proveedor mas usado y alertas de precio alto.
- Modulo `src/exporters.js` para exportar CSV de productos, stock, compras, producciones, pedidos y reporte de costes.
- Configuracion avanzada editable desde UI.
- Backup manual, historial de backups y restauracion desde UI.
- Exportaciones JSON y CSV desde Configuracion.
- Pruebas de reportes y exportadores en `tests/reports.test.js`.

### Changed

- Version visible del proyecto actualizada a `0.6.0`.
- `APP_STAGE` pasa a Etapa 6.
- La ruta Reportes deja de ser placeholder.
- Configuracion pasa de resumen basico a panel operativo de datos y backups.

### Not Implemented Yet

- QA general de punta a punta.
- Hardening completo de migraciones y datos corruptos.
- Refactor final de render/state/routing.
- Accesibilidad revisada de forma integral.
- Preparacion backend final con README de uso completo.

## [Unreleased - Etapa 5] - 2026-06-05

### Added

- Vista funcional de Clientes con crear, editar, desactivar, buscar e historial resumido.
- Modelo de cliente ampliado con alias, canal, contacto, zona de entrega, preferencias, alergias declaradas, total de pedidos y total gastado.
- Vista funcional de Pedidos con pedido completo y modo pedido rapido.
- Estados de pedido: borrador, pendiente, confirmado, en produccion, listo, entregado y cancelado.
- Calculo de subtotal, descuento, total, coste estimado, ganancia estimada y margen por pedido.
- Soporte de extras e ingredientes quitados en lineas de pedido.
- Marcado de pago y metodo de pago.
- Descuento definitivo de stock al marcar pedido como entregado mediante movimientos tipo `venta`.
- Consumo preferente de lotes por fecha de caducidad cuando existe lote trazable.
- Seccion de pedidos proximos para hoy/manana con necesidades por producto.
- Lista de compra automatica desde pedidos, recetas, stock, proveedor preferido e historial de precios.
- Feedback posterior a entrega con sabor, tamano, precio, textura, repetiria, comentario y sugerencias.
- Seed de dos clientes demo editables.
- Pruebas de pedidos, entrega, stock insuficiente y lista de compra en `tests/orders.test.js`.

### Changed

- Version visible del proyecto actualizada a `0.5.0`.
- `APP_STAGE` pasa a Etapa 5.
- `Order`, `OrderItem`, `Client` y `Feedback` quedan alineados con el flujo operativo de pedidos.
- Router y controlador principal conectan las vistas reales de Clientes y Pedidos.

### Not Implemented Yet

- Reservas de stock al confirmar pedido; por ahora solo se descuenta al entregar.
- Dashboard avanzado de ventas, rentabilidad y cobros.
- Reportes profundos y exportaciones CSV.
- Backup manual avanzado y restauracion de backups desde UI.

## [Unreleased - Etapa 4] - 2026-06-04

### Added

- Modelo ampliado de recetas con categoria, estado, descripcion, precio actual, margen objetivo, multiplicador, peso estimado, alergenos e ingredientes configurables.
- Ingredientes de receta con grupo, obligatoriedad, opcion extra y soporte para quitar ingredientes en simulacion.
- Seed de recetas: Cerdo BBQ Base, Cerdo Mostaza-Miel, Cerdo Yogur/Cremoso, Pollo Base y Ternera Premium en standby.
- Vista funcional de Recetas con crear, editar, duplicar, activar, marcar prueba, standby y retirar.
- Desglose de coste por grupo: carne, base, salsa, topping y packaging.
- Calculo de coste total, ganancia bruta, margen porcentual y precios minimo/sano/premium.
- Alertas de precio: No rentable, Margen ajustado y Margen saludable.
- Vista funcional de Simulador con receta, unidades deseadas, extras, ingredientes omitidos, faltantes, restante y coste/venta/margen esperado.
- Comparador de recetas con coste, precio actual, ganancia, margen, burritos posibles, ingrediente limitante y estado.
- Pruebas de receta, simulador, extras y servicio de recetas en `tests/recipeService.test.js`.

### Changed

- Version visible del proyecto actualizada a `0.4.0`.
- `APP_STAGE` pasa a Etapa 4.
- `calculateRecipeCost`, `calculatePossibleUnits` y `calculateLimitingIngredient` ahora respetan ingredientes opcionales/extras.
- Router soporta parametros simples en hash para simulaciones reproducibles.

### Fixed

- Los movimientos manuales rechazan lotes de otro producto y salidas con stock insuficiente.
- Los insumos de produccion rechazan lotes que no pertenecen al producto elegido.
- La saborizacion rechaza lotes de sabor que no pertenecen al insumo seleccionado.
- Las recetas rechazan ingredientes con unidad incompatible con la unidad base del producto.
- El multiplicador propio de receta y el margen objetivo participan en los financieros de receta.

### Not Implemented Yet

- Clientes y pedidos conectados a recetas.
- Reservas o descuentos de stock por pedido.
- Planificacion de pedidos proximos.
- Lista de compra automatica desde pedidos.
- Feedback post-entrega.

## [Unreleased - Etapa 3] - 2026-06-04

### Added

- Vista funcional de produccion con nueva tanda, insumos, pesos, horarios, coste, rendimiento y lote resultado.
- Accion para completar la Produccion 2 pendiente y generar stock cocido trazable.
- Vista de lotes con activos, por vencer, vencidos, congelados, agotados y descartados calculados desde movimientos.
- Vista de caducidad/conservacion con alertas de vencido, vence hoy, vence manana, por vencer, sin fecha y congelado.
- Saborizacion desde carne neutra a productos saborizados con consumo de salsa/insumos y lote resultado.
- Descarte trazable de lotes mediante movimiento de merma.
- Calculos de resumen de lote, estado computado de lote y fechas sugeridas de caducidad.
- Seleccion opcional de lote en movimientos manuales de stock.
- Pruebas de produccion, completar tanda pendiente y saborizacion en `tests/productionService.test.js`.

### Changed

- Version visible del proyecto actualizada a `0.3.0`.
- `APP_STAGE` pasa a Etapa 3.
- Seed ampliado con productos saborizados faltantes para cerdo y pollo.
- Modelo de `ProductionBatch`, `ProductionInput`, `Lot` y `Settings` ampliado para produccion real.
- Router y navegacion incluyen la pantalla de Caducidad.

### Not Implemented Yet

- Edicion profunda de producciones finalizadas con flujo de correccion guiado.
- Recetas avanzadas y coste real por burrito editable.
- Pedidos con reserva/descuento automatico por lote.
- Lista de compra automatica.

## [Unreleased - Etapa 2] - 2026-06-04

### Added

- Vista funcional de productos con listado, busqueda, filtros, creacion, edicion, desactivacion y detalle.
- Vista funcional de proveedores con creacion, edicion, desactivacion, compras asociadas y resumen de precios.
- Registro de compras con multiples items.
- Al guardar compras se actualiza stock, coste unitario actual, lote, movimiento de stock e historial de precios.
- Vista de historial de precios por producto y proveedor con minimo, maximo, ultimo precio y variacion.
- Vista de stock con valor estimado, stock bajo, productos sin coste, nevera/congelador y movimientos manuales.
- Servicio `src/services/businessService.js` para separar reglas de negocio de UI.
- Utilidades `src/html.js` para escapar HTML renderizado desde datos locales/importados.
- Prueba de flujo de compra en `tests/businessService.test.js`.

### Fixed

- `loadSeedData()` ya no pisa datos existentes o importados si falta `metadata.seededAt`.
- Los movimientos seed principales enlazan lotes origen/destino para trazabilidad.
- El dashboard muestra lotes vencidos ademas de lotes por vencer.
- Se escapa HTML en vistas que renderizan datos de LocalStorage.

### Changed

- `package.json` ejecuta todas las pruebas `tests/*.test.js`.
- Dashboard, router y estilos se ampliaron para soportar Etapa 2.
- Se agrego la coleccion `priceHistory` al modelo local.

### Not Implemented Yet

- Produccion real editable/completable.
- Lotes avanzados con agotado/descartado y caducidad completa.
- Saborizacion.
- Pedidos y clientes funcionales.

## [Unreleased - Etapa 1] - 2026-06-04

### Added

- App shell funcional con header, navegacion, main y footer.
- Navegacion inicial para Dashboard, Productos, Proveedores, Compras, Stock, Produccion, Lotes, Recetas, Simulador, Clientes, Pedidos, Reportes y Configuracion.
- LocalStorage versionado con `getData`, `saveData`, `resetData`, `loadSeedData`, `exportData`, `importData`, `generateId`, `getById`, `upsert` y `remove`.
- Backup simple antes de reset e importacion.
- Manejo de LocalStorage vacio y JSON corrupto.
- Modelos base para Product, Supplier, Purchase, PurchaseItem, StockMovement, ProductionBatch, Lot, Recipe, RecipeIngredient, Client, Order, OrderItem, Feedback y Settings.
- Seed inicial con productos, proveedores, compras reales, producciones reales 1 y 2, lotes, movimientos de stock y receta base.
- Calculos base de coste, rendimiento, merma, receta, unidades posibles, ingrediente limitante, precios sugeridos y formateos.
- Dashboard funcional con tarjetas de stock, costes, ultima produccion, burritos posibles, stock bajo, costes pendientes, lotes por vencer y avisos de margen.
- Pantalla de configuracion basica con valores iniciales, exportacion, importacion y reset demo.
- Pruebas minimas en `tests/calculations.test.js`.
- Servidor local sin dependencias en `scripts/dev-server.mjs`.

### Changed

- Se reemplazo el CSS anidado por CSS estandar compatible con navegador.
- `index.html` ahora carga la app real de Etapa 1.
- `README.md` y `TODO_NEXT_STAGE.md` actualizados para continuidad.

### Not Implemented Yet

- CRUD real de productos, proveedores y compras.
- Formularios completos de stock y produccion.
- Historial de precios.
- Gestion real de pedidos.
- Backend o IndexedDB.

## [Unreleased - Etapa 0] - 2026-06-04

### Added

- Documentacion base del proyecto Ramp Bites Control Panel.
- Identificacion de entidades principales.
- Diseno del modelo de datos inicial para LocalStorage.
- Definicion de reglas de stock, movimientos y trazabilidad por lote.
- Definicion de reglas de coste, rendimiento, merma, recetas y precios recomendados.
- Definicion del flujo de produccion artesanal.
- Definicion del flujo de pedidos.
- Plan de etapas de desarrollo.
- Checkpoint para continuar en Etapa 1.
- Documento tecnico `docs/ARCHITECTURE.md`.
- Documento tecnico `docs/DATA_MODEL.md`.
- Documento tecnico `docs/BUSINESS_RULES.md`.
- Documento tecnico `docs/PRODUCTION_FLOW.md`.
- Documento tecnico `docs/ROADMAP.md`.
- Documento tecnico `docs/BACKEND_PLAN.md`.
- Indice de documentacion `docs/INDEX.md`.
- Resumen de cierre `docs/ETAPA0_COMPLETED.md`.
- Skeleton conceptual en `src/main.js`, `src/storage.js`, `src/constants.js` y `src/models.js`.
- Pantalla estatica de cierre en `index.html`.
- Archivo `src/styles/theme.css` para completar los estilos enlazados.

### Changed

- Se reescribio `README.md` para corregir problemas de codificacion y dejar la Etapa 0 cerrada con alcance claro.
- Se reescribio `docs/DATA_MODEL.md` para alinearlo con el modelo de Etapa 0.
- Se reescribio `docs/BUSINESS_RULES.md` para consolidar reglas internas sin contradicciones.
- Se reescribio `docs/PRODUCTION_FLOW.md` para compactar el flujo operativo.
- Se reescribio `docs/ROADMAP.md` para dejar etapas futuras accionables.
- Se normalizaron documentos y comentarios existentes para evitar problemas de codificacion.
- Se normalizo `index.html` para evitar texto roto y enlaces a recursos ausentes.

### Not Implemented Yet

- No se implemento UI funcional.
- No se implemento persistencia real.
- No se implementaron calculos en codigo.
- No se crearon tests ejecutables.

## Politica de Versionado

Durante el desarrollo inicial se usara version `0.x`.

- `0.1.0`: skeleton funcional y almacenamiento local.
- `0.2.0`: productos, proveedores y compras.
- `0.3.0`: stock, lotes y produccion.
- `0.4.0`: recetas, menu, simulador y precios.
- `0.5.0`: clientes, pedidos, pagos, planificacion y lista de compra.
- `0.6.0`: dashboard avanzado, reportes, backups y CSV.
- `0.7.0`: QA, hardening, accesibilidad base y preparacion backend.
- `0.8.0`: PWA, modo cocina movil, temporizador y checklist.
- `0.9.0`: backend local SQLite, API REST, migracion JSON y backups DB.
- `0.10.0`: sincronizacion manual frontend/backend desde Configuracion.
- `0.11.0`: modo API espejo opcional con carga inicial y guardado automatico.
- `0.12.0`: seguridad local con PIN admin para operaciones sensibles.
- `0.13.0`: reservas de stock al confirmar pedidos.
- `0.14.0`: stock fisico, reservado y disponible.
- `1.0.0`: primera version interna usable con exportacion/importacion y reportes basicos.
