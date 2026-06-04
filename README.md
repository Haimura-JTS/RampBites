# Ramp Bites Control Panel

Herramienta interna local-first para gestionar la produccion artesanal de burritos de Ramp Bites.

## Estado del Proyecto

Etapa actual: **ETAPA 0 - Analisis, planificacion y diseno tecnico**.

En esta etapa no se implementa la aplicacion completa. El objetivo es dejar claro que se va a construir, como se organizaran los datos y como se continuara en la Etapa 1.

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

- HTML5.
- CSS3.
- JavaScript moderno con modulos ES.
- LocalStorage como persistencia inicial.
- Arquitectura preparada para migrar a IndexedDB, SQLite o backend Node.js.
- Vite opcional desde Etapa 1 si compensa por ergonomia.
- Sin frameworks pesados en la primera version.

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
- **PurchaseLine**: linea de compra con cantidad, unidad y precio.
- **StockLot**: lote trazable de stock.
- **StockMovement**: movimiento de entrada, salida, transformacion, ajuste o descarte.
- **ProductionBatch**: tanda de produccion.
- **ProductionInput**: insumo usado en una tanda.
- **ProductionOutput**: resultado de una tanda.
- **Recipe**: receta de burrito o preparacion.
- **RecipeIngredient**: ingrediente y cantidad requerida.
- **Customer**: cliente.
- **Order**: pedido.
- **OrderLine**: linea de pedido.
- **Allergen**: alergeno catalogado.
- **Feedback**: valoraciones y notas de clientes.
- **Settings**: configuracion editable, como multiplicadores de precio.
- **BackupMetadata**: informacion de exportaciones/importaciones futuras.

## Modelo de Datos Inicial

Los datos se guardaran como colecciones versionadas en LocalStorage:

```js
{
  schemaVersion: 1,
  products: [],
  suppliers: [],
  purchases: [],
  stockLots: [],
  stockMovements: [],
  productionBatches: [],
  recipes: [],
  customers: [],
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

## Reglas de Stock

El stock se calcula desde movimientos, no desde valores sueltos editados a mano.

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
2. Crear pedido con fecha, estado y lineas.
3. Seleccionar recetas y cantidades.
4. Calcular coste real y precio recomendado.
5. Comprobar stock disponible e ingrediente limitante.
6. Reservar o descontar stock segun estado del pedido.
7. Si falta stock, generar necesidades para lista de compra o produccion.
8. Al completar pedido, registrar salidas de stock por lote.

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

```txt
/index.html
/package.json
/README.md
/CHANGELOG.md
/TODO_NEXT_STAGE.md

/src/main.js
/src/storage.js
/src/models.js
/src/constants.js
/src/calculations.js
/src/validators.js
/src/seed.js
/src/router.js

/src/views/dashboardView.js
/src/views/productsView.js
/src/views/suppliersView.js
/src/views/purchasesView.js
/src/views/stockView.js
/src/views/productionView.js
/src/views/lotsView.js
/src/views/recipesView.js
/src/views/simulatorView.js
/src/views/clientsView.js
/src/views/ordersView.js
/src/views/reportsView.js
/src/views/settingsView.js

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

/docs/ARCHITECTURE.md
/docs/BACKEND_PLAN.md
/docs/ROADMAP.md
```

## Etapas Planeadas

- **Etapa 1**: skeleton funcional local-first, layout, router, storage, seed y dashboard basico.
- **Etapa 2**: productos, proveedores y compras.
- **Etapa 3**: stock, lotes y movimientos trazables.
- **Etapa 4**: produccion por tandas, rendimiento, merma y costes.
- **Etapa 5**: recetas, costes por burrito y viabilidad de precio.
- **Etapa 6**: simulador de burritos posibles y lista de compra.
- **Etapa 7**: clientes, pedidos y reservas/salidas de stock.
- **Etapa 8**: alergenos, caducidad, conservacion y alertas.
- **Etapa 9**: reportes, margenes, feedback y analisis.
- **Etapa 10**: exportar/importar datos y backups.
- **Etapa 11+**: preparacion de backend, IndexedDB/SQLite y pruebas ampliadas.

## Continuidad

Antes de cada etapa se deben leer:

- `README.md`
- `CHANGELOG.md`
- `TODO_NEXT_STAGE.md`

No avanzar a una etapa nueva sin peticion explicita.

Ultima actualizacion: 2026-06-04.
