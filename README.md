# Ramp Bites Control Panel

Herramienta interna local-first para gestionar la produccion artesanal de burritos de Ramp Bites.

## Estado del Proyecto

Etapa actual: **ETAPA 16 - Sincronizacion por coleccion y conflictos basicos**.

La app ya abre como panel local-first con navegacion, LocalStorage endurecido, seed inicial, calculos base, dashboard avanzado, configuracion avanzada, gestion funcional de productos/proveedores/compras/stock/historial de precios, produccion por tandas, lotes trazables, alertas de caducidad, saborizacion desde carne neutra, recetas editables, desglose de coste por burrito, comparador de menu, simulador de produccion, clientes, pedidos, pagos, feedback, planificacion de pedidos proximos, lista de compra automatica, reportes internos, backups restaurables, exportaciones CSV/JSON, tests, PWA instalable, modo cocina movil, backend local SQLite, sincronizacion manual, modo API espejo configurable, sincronizacion por coleccion con conflictos basicos, proteccion local de operaciones sensibles, reservas de stock al confirmar pedidos, separacion visual entre stock fisico/reservado/disponible y autenticacion backend con sesiones y roles.

## Objetivo del Producto

Ramp Bites Control Panel servira para controlar:

- Productos comprados e insumos.
- Proveedores y precios.
- Compras y trazabilidad de lotes.
- Stock crudo, cocido neutro, saborizado, congelado, refrigerado, seco y packaging.
- Produccion por tandas.
- Rendimiento de carne, merma y coste por gramo final.
- Recetas y costes por burrito.
- Pedidos, clientes y previsiones de produccion.
- Alergenos, caducidad y conservacion.
- Lista de compra automatica.
- Margenes, reportes, exportacion, importacion y backups.

La app ayudara a organizar datos internos. No debe afirmar cumplimiento legal alimentario.

## Contexto de Negocio

La linea base actual es:

- **Cerdo**: producto principal activo.
- **Pollo**: segunda linea activa.
- **Ternera**: standby/premium por coste alto; no debe aparecer como base activa por defecto.

La carne base actual se calcula con **100 g de carne cocida por burrito**.

No se debe producir mas carne de la proyectada para 2 dias.

## Stack Tecnico

### Estado actual del MVP

La implementacion actual hasta Etapa 16 sigue siendo el MVP funcional construido en HTML, CSS, JavaScript modular, LocalStorage y backend SQLite local. Se mantiene como base operativa y fuente de exportacion JSON durante la migracion.

### Decision tecnica para la siguiente etapa

A partir de la proxima etapa, el stack objetivo pasa a ser:

- React.
- TypeScript.
- Vite.
- Dexie.js sobre IndexedDB como persistencia local principal.
- Zod para validacion de datos antes de guardar.
- Vitest para pruebas de calculos y logica critica.
- CSS modular, CSS tradicional organizado o Tailwind CSS solo si se justifica.
- Arquitectura preparada para PWA futura.
- Arquitectura preparada para backend futuro con Node.js, Express, Prisma y SQLite/PostgreSQL.

No se debe usar LocalStorage como base de datos principal. LocalStorage queda limitado a preferencias simples, configuracion visual, ultimo backup temporal, flags de UI y modo demo. Los datos importantes deben vivir en IndexedDB mediante Dexie.

Ver plan detallado en `docs/TECH_STACK_MIGRATION.md` y reglas globales para Prompts 2 a 9 en `docs/PROMPTS_2_9_GLOBAL_RULES.md`.

## Idioma, Moneda y Unidades

- UI: espanol.
- Moneda: euros.
- Peso: gramos.
- Volumen: mililitros.
- Cantidad discreta: unidades.

## Entidades Principales

- **Product**: item comprable o producible.
- **Supplier**: proveedor.
- **Purchase**: compra registrada.
- **PurchaseItem**: linea de compra con cantidad, unidad y precio.
- **Lot**: lote trazable de stock.
- **StockMovement**: movimiento de entrada, salida, transformacion, ajuste o descarte.
- **ProductionBatch**: tanda de produccion.
- **ProductionInput**: insumo usado en una tanda.
- **Recipe**: receta de burrito o preparacion.
- **RecipeIngredient**: ingrediente, cantidad requerida, grupo, obligatoriedad y extra opcional.
- **Client**: cliente.
- **Order**: pedido.
- **OrderItem**: linea de pedido.
- **Allergen**: alergeno catalogado.
- **Feedback**: valoraciones y notas de clientes.
- **Settings**: configuracion editable, como multiplicadores de precio.
- **BackupMetadata**: informacion de exportaciones/importaciones futuras.

## Modelo de Datos Inicial

Durante el MVP actual, los datos se guardan como colecciones versionadas en LocalStorage:

```js
{
  schemaVersion: 1,
  products: [],
  suppliers: [],
  purchases: [],
  lots: [],
  stockMovements: [],
  priceHistory: [],
  productionBatches: [],
  recipes: [],
  clients: [],
  orders: [],
  allergens: [],
  feedback: [],
  settings: {}
}
```

Cada entidad tendra:

- `id`: identificador estable.
- `createdAt`: fecha ISO.
- `updatedAt`: fecha ISO.
- `notes`: notas opcionales cuando aplique.
- `status`: activo, standby, archivado, pendiente, completado o descartado segun entidad.

En la migracion React/Dexie estas colecciones se separaran en stores IndexedDB, incluyendo `purchaseItems`, `productionInputs`, `recipeIngredients` y `orderItems` como tablas propias cuando aporte trazabilidad y consultas mas claras.

Tambien deben vivir en IndexedDB los reportes/cache cuando haga falta y la configuracion principal exportable del negocio.

## Reglas de Stock

El stock se calcula desde movimientos, no desde valores sueltos editados a mano.

- **Stock fisico**: inventario real antes de reservas; ignora `reserva` y `liberacion_reserva`.
- **Stock reservado**: cantidad neta apartada por pedidos confirmados, en produccion o listos.
- **Stock disponible**: stock fisico menos reservas activas; es el stock usado para simular, planificar, producir, descartar o vender.
- Las alertas de stock bajo se calculan sobre stock disponible.
- El valor estimado de inventario se calcula sobre stock fisico.

Tipos de stock:

- `raw`: crudo.
- `cooked_neutral`: cocido neutro.
- `flavored`: saborizado.
- `frozen`: congelado.
- `refrigerated`: refrigerado.
- `dry`: seco.
- `packaging`: packaging.

Movimientos soportados:

- `purchase`: entrada por compra.
- `production_consume`: consumo de insumos en tanda.
- `production_output`: salida generada por tanda.
- `flavoring`: transformacion de neutro a saborizado.
- `sale`: salida por pedido.
- `reserva`: reserva temporal por pedido confirmado.
- `liberacion_reserva`: liberacion de reserva por cancelacion, cambio de estado o entrega.
- `waste`: descarte.
- `shrinkage`: merma.
- `own_consumption`: consumo propio.
- `gift`: regalo.
- `test`: prueba.
- `adjustment`: ajuste manual trazado.

Cada movimiento debe guardar:

- Producto.
- Lote origen y/o lote destino.
- Cantidad.
- Unidad.
- Fecha.
- Motivo.
- Referencia a compra, tanda o pedido cuando exista.

## Reglas de Coste

Formulas obligatorias:

```txt
precio_unitario = precio_total / cantidad
precio_kg = precio_total / cantidad_kg
rendimiento = peso_final / peso_crudo
merma = peso_crudo - peso_final
merma_porcentaje = merma / peso_crudo
coste_por_gramo_final = coste_total_produccion / peso_final
coste_100g = coste_por_gramo_final * 100
```

Coste de receta:

```txt
coste_receta = suma de coste de cada ingrediente segun unidad
```

Para ingredientes:

```txt
gramos: coste = gramos * coste_por_gramo
mililitros: coste = ml * coste_por_ml
unidades: coste = unidades * coste_unitario
```

Burritos posibles:

```txt
posibles_por_ingrediente = floor(stock_disponible / cantidad_requerida)
burritos_posibles = minimo de todos los posibles_por_ingrediente
ingrediente_limitante = ingrediente con menor cantidad posible
```

Los ingredientes opcionales o extras no limitan produccion base salvo que el usuario los seleccione en el simulador.

Precio recomendado configurable:

```txt
precio_minimo = coste_total * multiplicador_minimo
precio_sano = coste_total * multiplicador_sano
precio_premium = coste_total * multiplicador_premium
```

Valores iniciales:

- Minimo: 2.
- Sano: 2.5.
- Premium: 3.

La app debe indicar si vender a 5 EUR es viable para cada receta, no asumirlo.

Alertas de precio:

- **No rentable**: precio actual por debajo del precio minimo.
- **Margen ajustado**: precio actual entre minimo y sano.
- **Margen saludable**: precio actual igual o superior al precio sano.

## Flujo de Produccion

1. Registrar compra de carne cruda con peso, precio, proveedor y fecha.
2. Crear tanda de produccion.
3. Seleccionar lote crudo usado.
4. Registrar peso crudo, liquidos, caldos, condimentos, horario, fuego y notas.
5. Registrar peso escurrido si existe.
6. Registrar caldo reducido y caldo reintegrado.
7. Registrar peso final hidratado.
8. Calcular rendimiento, merma, coste por gramo final y coste por 100 g.
9. Descontar stock crudo por movimiento.
10. Crear lote cocido neutro con fecha de coccion y fecha limite de uso.
11. Separar a sabores solo segun pedidos o necesidad prevista.
12. Guardar sobrante como neutro cuando sea posible.

## Flujo de Pedido

1. Registrar cliente.
2. Crear pedido con fecha, entrega, estado, pago y lineas.
3. Seleccionar recetas, cantidades, extras, ingredientes quitados y precio.
4. Calcular subtotal, descuento, total, coste estimado, ganancia y margen.
5. Comprobar stock disponible desde recetas.
6. Mantener borrador y pendiente sin reservar stock.
7. Al confirmar, pasar a produccion o marcar listo, reservar stock con movimientos `reserva`.
8. Al cancelar o volver a pendiente/borrador, liberar reserva con movimientos `liberacion_reserva`.
9. Al marcar entregado, convertir la reserva en movimientos `venta`.
10. Si falta stock, generar necesidades para lista de compra o produccion.
11. Registrar feedback posterior a entrega.

## Datos Seed Reales Iniciales

### Compra de carne real

- Producto: cuello de cerdo sin hueso / `coll sense os`.
- Categoria: carne cruda.
- Peso comprado: 2385 g.
- Precio total: 26.21 EUR.
- Precio/kg: 10.99 EUR/kg.
- Proveedor: carniceria local 1.
- Estado: dato real comprado.

### Produccion real 1

- Carne usada: 1053 g.
- Coste carne usada aproximado: 11.57 EUR.
- Liquido inicial: 534 ml.
- Caldo total usado: 550 ml aprox.
- Caldo sobrante: 450 ml aprox.
- Tiempo coccion: 21:00 a 00:30.
- Tiempo total: 3 h 30 min.
- Fuego: bajo.
- Peso carne hidratada final: 750 g.
- Peso final con caldo reintegrado: 800 g.
- Rendimiento aproximado: 75.9%.
- Resultado: cerdo desmechado neutro.

### Produccion real 2

- Carne usada: 1318 g.
- Coste carne usada aproximado: 14.49 EUR.
- Inicio coccion: 18:00.
- Insumos usados inicialmente: 2 caldos secos de carne.
- Coste caldos secos carne: 1.70 EUR.
- Caldo liquido restante agregado posteriormente.
- Resultado: pendiente de cargar.
- Estado: produccion en curso / pendiente.

### Stock crudo teorico

- Compra inicial: 2385 g.
- Usado produccion 1: -1053 g.
- Usado produccion 2: -1318 g.
- Sobrante crudo teorico: 14 g.

### Otros insumos

- Caldo seco de pollo: 2 unidades por 1.50 EUR, unitario 0.75 EUR.
- Caldo seco de carne: 2 unidades por 1.70 EUR, unitario 0.85 EUR.
- Caldo carne liquido grande: 1 unidad por 2.30 EUR.
- Salsa de yogur Salseo: 300 ml por 1.29 EUR.
- Queso Edam para fundir: 200 g por 1.44 EUR.
- Bolsas de papel Consum: 30 unidades por 1.95 EUR, unitario 0.065 EUR.

## Estructura Propuesta

La estructura actual corresponde al MVP legacy. La estructura objetivo React/TypeScript/Dexie esta documentada en `docs/TECH_STACK_MIGRATION.md` y debe guiar la siguiente etapa.

```txt
/index.html
/manifest.json
/service-worker.js
/package.json
/README.md
/CHANGELOG.md
/TODO_NEXT_STAGE.md
/assets/icon.svg
/assets/icon-maskable.svg

/src/main.js
/src/storage.js
/src/models.js
/src/constants.js
/src/calculations.js
/src/validators.js
/src/seed.js
/src/router.js
/src/html.js
/src/sync.js
/src/services/businessService.js
/src/apiClient.js

/server/api.js
/server/database.js
/server/server.js
/server/cli.js
/server/paths.js

/src/views/dashboardView.js
/src/views/productsView.js
/src/views/suppliersView.js
/src/views/purchasesView.js
/src/views/priceHistoryView.js
/src/views/stockView.js
/src/views/productionView.js
/src/views/lotsView.js
/src/views/expiryView.js
/src/views/recipesView.js
/src/views/simulatorView.js
/src/views/kitchenView.js
/src/views/clientsView.js
/src/views/ordersView.js
/src/views/reportsView.js
/src/views/settingsView.js
/src/views/placeholderView.js

/src/components/table.js
/src/components/form.js
/src/components/modal.js
/src/components/toast.js
/src/components/badge.js
/src/components/tabs.js

/src/styles/base.css
/src/styles/layout.css
/src/styles/components.css
/src/styles/theme.css

/tests/calculations.test.js
/tests/businessService.test.js
/tests/productionService.test.js
/tests/recipeService.test.js
/tests/orders.test.js
/tests/reports.test.js
/tests/storage.test.js
/tests/functionalSmoke.test.js
/tests/pwa.test.js
/tests/backend.test.js
/scripts/dev-server.mjs

/docs/ARCHITECTURE.md
/docs/BACKEND_PLAN.md
/docs/ROADMAP.md
```

## Etapas Planeadas

- **Etapa 1**: skeleton funcional local-first, layout, router, storage, seed y dashboard basico. **Completada**.
- **Etapa 2**: productos, proveedores, compras, stock e historial de precios. **Completada**.
- **Etapa 3**: produccion por tandas, lotes, rendimiento, conservacion y caducidad. **Completada**.
- **Etapa 4**: recetas, menu, costes por burrito, simulador y precios. **Completada**.
- **Etapa 5**: clientes, pedidos, estados, pagos, planificacion y lista de compra. **Completada**.
- **Etapa 6**: dashboard avanzado, reportes, analitica, exportacion e importacion. **Completada**.
- **Etapa 7**: QA, hardening, refactor y preparacion backend. **Completada**.
- **Etapa 8**: PWA opcional y modo cocina movil. **Completada**.
- **Etapa 9**: backend Node.js/SQLite, API REST, migracion JSON y backups DB. **Completada**.
- **Etapa 10**: sincronizacion frontend/backend desde Configuracion. **Completada**.
- **Etapa 11**: modo API espejo opcional con carga inicial desde SQLite y envio automatico de guardados. **Completada**.
- **Etapa 12**: seguridad local opcional con PIN admin para operaciones sensibles. **Completada**.
- **Etapa 13**: reservas de stock al confirmar pedidos y conversion a venta al entregar. **Completada**.
- **Etapa 14**: stock fisico, reservado y disponible en UI, reportes y CSV. **Completada**.
- **Etapa 15**: autenticacion backend real con sesiones y roles activos en API/UI. **Completada**.
- **Etapa 16**: sincronizacion por coleccion y conflictos basicos LocalStorage/SQLite. **Completada**.
- **Etapa 17**: migracion tecnologica a React + TypeScript + Vite + Dexie/IndexedDB + Zod + Vitest. **Siguiente**.
- **Etapa 18+**: paridad funcional por modulos, tombstones de borrado, auditoria visible, PWA futura y backend Prisma.

## Continuidad

Antes de cada etapa se deben leer:

- `README.md`
- `CHANGELOG.md`
- `TODO_NEXT_STAGE.md`

No avanzar a una etapa nueva sin peticion explicita.

## Como Ejecutar

Modo actual MVP legacy:

```bash
npm.cmd run dev
```

Abrir:

```txt
http://localhost:5173
```

Pruebas:

```bash
npm.cmd test
```

Nota Windows: `npm test` puede quedar bloqueado por la politica de ejecucion de PowerShell; `npm.cmd test` evita ese problema.

Modo objetivo tras la migracion React/Vite:

```bash
npm install
npm run dev
npm run test
```

## Backend SQLite

Requisito: Node.js 24 o superior por uso de `node:sqlite`.

Inicializar base vacia:

```bash
npm.cmd run backend:init
```

Cargar seed en SQLite:

```bash
npm.cmd run backend:seed
```

Arrancar API:

```bash
npm.cmd run backend
```

Abrir:

```txt
http://127.0.0.1:8787/api/health
```

Importar JSON exportado desde la UI:

```bash
npm.cmd run backend:import -- ruta\backup-ramp-bites.json
```

Exportar JSON desde SQLite:

```bash
npm.cmd run backend:export -- ramp-bites-sqlite-export.json
```

Crear backup de la base:

```bash
npm.cmd run backend:backup
```

La base local vive en `data/ramp-bites.sqlite` y los backups en `backups/`. Ambas carpetas estan ignoradas por Git.

Endpoints principales:

- `GET /api/health`
- `GET /api/auth/status`
- `POST /api/auth/bootstrap`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `GET /api/auth/users`, `POST /api/auth/users`
- `GET /api/data`
- `PUT /api/data`
- `POST /api/import/json`
- `GET /api/products`, `POST /api/products`, `PATCH /api/products/:id`
- `GET /api/suppliers`, `POST /api/suppliers`
- `GET /api/purchases`, `POST /api/purchases`
- `GET /api/stock-movements`, `POST /api/stock-movements`
- `GET /api/production-batches`, `POST /api/production-batches`
- `POST /api/production-batches/:id/complete`
- `GET /api/lots`, `POST /api/lots/:id/discard`
- `GET /api/recipes`, `POST /api/recipes`
- `GET /api/clients`, `POST /api/clients`
- `GET /api/orders`, `POST /api/orders`
- `POST /api/orders/:id/deliver`
- `GET /api/reports/dashboard`
- `GET /api/reports/production`
- `GET /api/reports/sales`
- `GET /api/reports/prices`
- `GET /api/reports/costs`
- `GET /api/backups`, `POST /api/backups`
- `POST /api/sync/:collection`

## Autenticacion Backend

El backend SQLite funciona en modo abierto mientras no exista ningun usuario activo. Al crear el primer admin, la API pasa a exigir token Bearer.

Desde `Configuracion > Autenticacion backend`:

1. Comprobar estado de auth.
2. Crear primer admin con usuario y contrasena.
3. Iniciar sesion para guardar token en `sessionStorage`.
4. Crear usuarios adicionales con rol `operator`, `viewer` o `admin`.
5. Cerrar sesion cuando no se use.

Roles:

- `viewer`: lectura de datos y reportes.
- `operator`: puede registrar operaciones de negocio.
- `admin`: puede hacer import, seed, settings, backups destructivos y gestionar usuarios.

Si se usa `api_mirror` con backend protegido, hay que iniciar sesion backend en ese navegador antes de sincronizar.

## Sincronizacion Frontend/Backend

La UI sigue operando sobre LocalStorage por defecto. En `Configuracion > Backend SQLite` hay dos modos:

- `manual`: la app guarda solo en LocalStorage y usa botones explicitos para enviar/traer datos.
- `api_mirror`: al iniciar trae datos desde `GET /api/data` y cada `saveData()` local envia un `PUT /api/data` en segundo plano.

Controles disponibles:

- comprobar `GET /api/health`,
- enviar datos locales al backend con backup SQLite previo,
- traer datos del backend creando backup local antes,
- sincronizar colecciones sin reemplazar todo el dataset,
- crear backup backend,
- cargar seed backend.

La sync por coleccion:

- lee cada coleccion con los endpoints REST,
- fusiona por fecha de actualizacion,
- sube al backend solo items locales cambiados mediante `POST /api/sync/:collection`,
- conserva la version local cuando local y remoto cambiaron despues de la ultima sync,
- guarda resumen y conflictos en `settings.backend.collectionSync`.

Limitacion actual: los borrados aun no se propagan porque falta un modelo de tombstones o `deletedAt`.

Si el backend no esta disponible, la app no bloquea el uso local; queda LocalStorage como base de trabajo.

La URL por defecto es:

```txt
http://127.0.0.1:8787/api
```

## Seguridad Local

En `Configuracion > Seguridad local` se puede activar proteccion de operaciones sensibles con un PIN admin.

Operaciones protegidas cuando la seguridad esta activa:

- importar JSON,
- reset demo,
- restaurar backups,
- enviar datos locales al backend,
- traer datos del backend,
- cargar seed backend.

El PIN se guarda hasheado con salt en la configuracion local. La sesion admin vive en `sessionStorage` y caduca segun los minutos configurados. Esta proteccion ayuda a evitar acciones accidentales en uso local, pero no sustituye autenticacion backend ni multiusuario real.

## Uso Actual

- `Clientes`: crear, editar, desactivar, buscar y ver historial resumido.
- `Pedidos`: crear pedido completo con recetas, extras, ingredientes quitados, descuento, pago y estado.
- `Pedido rapido`: crear una linea simple de cliente + receta + cantidad.
- `Confirmar`: reserva stock por lote cuando hay disponibilidad.
- `Cancelar`: libera reservas activas del pedido.
- `Entregar`: convierte la reserva en movimientos `venta` con referencia al pedido.
- `Stock`: muestra inventario fisico, reservado y disponible.
- `Lotes`: muestra reservas por lote y bloquea descarte si hay reserva activa.
- `Pedidos proximos`: resume necesidades de hoy y manana.
- `Lista de compra automatica`: muestra faltantes segun pedidos proximos, stock y proveedor recomendado.
- `Feedback`: registrar valoracion despues de entregar.
- `Reportes`: revisar produccion, ventas, proveedores/precios y costes por receta.
- `Configuracion`: ajustar multiplicadores, conservacion, modo demo, JSON, backups y CSV.
- `Configuracion > Seguridad local`: activar PIN admin, desbloquear/bloquear sesion y definir minutos de sesion.
- `Configuracion > Backend SQLite`: comprobar API, enviar local, traer backend, sincronizar colecciones, crear backup backend, cargar seed backend y activar `api_mirror`.
- `Configuracion > Autenticacion backend`: crear primer admin, iniciar sesion, cerrar sesion y crear usuarios con rol.
- `Cocina`: pantalla movil con produccion rapida, pedido rapido, temporizador, checklist y accesos grandes.
- PWA: instalable cuando el navegador lo permite; el shell principal queda cacheado para offline.
- `Backend`: API local SQLite para migrar datos, consultar colecciones, generar reportes y crear backups de base.

## Flujo Rapido de Uso

1. Ejecutar `npm.cmd run dev`.
2. Abrir `http://localhost:5173`.
3. En `Productos`, revisar o crear insumos.
4. En `Proveedores`, registrar proveedor si falta.
5. En `Compras`, cargar tickets con varios items; esto actualiza stock, lotes e historial de precios.
6. En `Produccion`, registrar tanda, consumir carne cruda/insumos y crear lote cocido.
7. En `Recetas`, crear o editar burritos y revisar coste real.
8. En `Simulador`, calcular burritos posibles, faltantes e ingrediente limitante.
9. En `Cocina`, usar produccion rapida, pedido rapido, checklist y temporizador desde movil.
10. En `Clientes` y `Pedidos`, crear pedidos, marcarlos pagados y entregarlos.
11. En `Reportes`, revisar ventas, produccion, proveedores y costes.
12. En `Configuracion`, exportar JSON, crear backup, restaurar backup o exportar CSV.
13. Para backend, importar ese JSON con `npm.cmd run backend:import -- archivo.json` o cargar demo con `npm.cmd run backend:seed`.
14. Si se quiere sincronizar sin reemplazar todo, arrancar `npm.cmd run backend` y usar `Sync colecciones` en Configuracion.
15. Si se quiere trabajar contra SQLite en espejo, activar `api_mirror` en Configuracion.
16. Si se quieren proteger operaciones destructivas, activar Seguridad local y guardar un PIN admin.
17. Si se quiere proteger la API SQLite, crear primer admin en `Autenticacion backend` e iniciar sesion.

## QA

- Tests automaticos: `npm.cmd test` (52 tests).
- Checklist manual: `docs/QA_CHECKLIST.md`.
- Backend futuro: `docs/BACKEND_PLAN.md`.
- Roadmap: `docs/ROADMAP.md`.

Ultima actualizacion: 2026-06-09.
