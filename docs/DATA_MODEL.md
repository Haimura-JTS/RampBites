# Data Model

Modelo de datos inicial para Ramp Bites Control Panel.

Este documento define las colecciones y entidades previstas para la version local-first. El MVP actual usa LocalStorage, pero la siguiente base tecnica debe migrar la persistencia principal a IndexedDB mediante Dexie.js. El modelo debe seguir preparado para backend futuro con Node.js, Express, Prisma y SQLite/PostgreSQL.

## Database

```js
{
  schemaVersion: 1,
  metadata: {
    createdAt: "ISO_DATE",
    updatedAt: "ISO_DATE",
    seededAt: "ISO_DATE"
  },
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

## Shared Fields

La mayoria de entidades incluiran:

```js
{
  id: "string",
  createdAt: "ISO_DATE",
  updatedAt: "ISO_DATE",
  status: "active | standby | archived | pending | completed | cancelled",
  notes: "string"
}
```

## Product

Representa un producto comprable o producible.

```js
{
  id: "prod_pork_collar_raw",
  name: "Cuello de cerdo sin hueso",
  alias: "coll sense os",
  category: "raw_meat",
  baseUnit: "g",
  stockType: "raw",
  proteinType: "pork",
  active: true,
  status: "active",
  allergenIds: [],
  defaultSupplierId: "sup_local_butcher_1",
  notes: "Producto principal real comprado"
}
```

Categorias sugeridas:

- `raw_meat`
- `cooked_meat`
- `ingredient`
- `sauce`
- `seasoning`
- `broth`
- `packaging`
- `finished_product`

Unidades:

- `g`
- `ml`
- `unit`

Estados de producto:

- `active`
- `standby`
- `premium`
- `archived`

La ternera debe cargarse como `standby` o `premium`, no como base activa.

## Supplier

```js
{
  id: "sup_local_butcher_1",
  name: "Carniceria local 1",
  contactName: "",
  phone: "",
  email: "",
  address: "",
  notes: "",
  status: "active"
}
```

## Purchase

Compra registrada con lineas. Una compra puede crear uno o varios lotes de stock.

```js
{
  id: "pur_2026_06_04_001",
  supplierId: "sup_local_butcher_1",
  date: "2026-06-04",
  status: "completed",
  lines: [
    {
      id: "pur_line_001",
      productId: "prod_pork_collar_raw",
      quantity: 2385,
      unit: "g",
      totalCost: 26.21,
      unitCost: 0.01099,
      pricePerKg: 10.99,
      createdLotId: "lot_pork_raw_001"
    }
  ],
  totalCost: 26.21,
  notes: "Dato real comprado"
}
```

## StockLot

Lote trazable de stock disponible o historico.

```js
{
  id: "lot_pork_raw_001",
  lotCode: "RAW-PORK-20260604-001",
  productId: "prod_pork_collar_raw",
  sourceType: "purchase",
  sourceId: "pur_2026_06_04_001",
  stockType: "raw",
  storageState: "refrigerated",
  initialQuantity: 2385,
  unit: "g",
  unitCost: 0.01099,
  totalCost: 26.21,
  receivedAt: "2026-06-04",
  producedAt: null,
  expiresAt: null,
  status: "active",
  notes: ""
}
```

`currentQuantity` no debe ser la fuente de verdad. Puede calcularse desde `stockMovements`.

## StockMovement

Movimiento de stock. Es la base de la trazabilidad.

```js
{
  id: "mov_001",
  date: "2026-06-04T18:00:00.000Z",
  type: "purchase",
  productId: "prod_pork_collar_raw",
  fromLotId: null,
  toLotId: "lot_pork_raw_001",
  quantity: 2385,
  unit: "g",
  unitCost: 0.01099,
  reason: "Compra inicial",
  referenceType: "purchase",
  referenceId: "pur_2026_06_04_001",
  notes: ""
}
```

Tipos:

- `purchase`
- `production_consume`
- `production_output`
- `flavoring`
- `sale`
- `waste`
- `shrinkage`
- `own_consumption`
- `gift`
- `test`
- `adjustment`

## ProductionBatch

Tanda de produccion.

```js
{
  id: "batch_pork_001",
  batchCode: "PORK-20260604-001",
  date: "2026-06-04",
  status: "completed",
  mainProductId: "prod_pork_collar_raw",
  rawInputWeightG: 1053,
  drainedWeightG: 750,
  finalWeightG: 800,
  liquidInitialMl: 534,
  brothUsedMl: 550,
  brothLeftMl: 450,
  startTime: "21:00",
  endTime: "00:30",
  durationMinutes: 210,
  heatLevel: "bajo",
  inputs: [
    {
      productId: "prod_pork_collar_raw",
      lotId: "lot_pork_raw_001",
      quantity: 1053,
      unit: "g",
      cost: 11.57
    }
  ],
  outputs: [
    {
      productId: "prod_pork_neutral_cooked",
      lotId: "lot_pork_cooked_neutral_001",
      quantity: 800,
      unit: "g",
      storageState: "refrigerated"
    }
  ],
  yieldRatio: 0.759,
  shrinkageG: 253,
  shrinkagePercentage: 0.2403,
  totalCost: 11.57,
  costPerFinalGram: 0.01446,
  costPer100g: 1.446,
  notes: "Cerdo desmechado neutro"
}
```

Una tanda `pending` no debe generar stock final vendible hasta completarse.

## Recipe

```js
{
  id: "recipe_pork_standard",
  name: "Burrito estandar de cerdo",
  status: "active",
  servingSizeG: 375,
  ingredients: [
    {
      productId: "prod_pork_neutral_cooked",
      quantity: 100,
      unit: "g",
      role: "main"
    },
    {
      productId: "prod_rice_basmati_cooked",
      quantity: 100,
      unit: "g",
      role: "base"
    },
    {
      productId: "prod_tortilla",
      quantity: 1,
      unit: "unit",
      role: "wrap"
    }
  ],
  allergenIds: ["allergen_gluten"],
  targetPrice: 5,
  notes: "Receta base; extras variables de 50 g a 100 g"
}
```

## Customer

```js
{
  id: "cust_001",
  name: "Cliente",
  phone: "",
  email: "",
  preferences: "",
  allergensToAvoid: [],
  notes: "",
  status: "active"
}
```

## Order

```js
{
  id: "order_001",
  customerId: "cust_001",
  date: "2026-06-04",
  deliveryDate: "2026-06-05",
  status: "draft",
  lines: [
    {
      id: "order_line_001",
      recipeId: "recipe_pork_standard",
      quantity: 2,
      unitCost: 0,
      unitPrice: 5,
      notes: ""
    }
  ],
  totalCost: 0,
  totalPrice: 10,
  stockReservationIds: [],
  notes: ""
}
```

Estados de pedido:

- `draft`
- `confirmed`
- `in_production`
- `ready`
- `delivered`
- `cancelled`

## Allergen

```js
{
  id: "allergen_gluten",
  name: "Gluten",
  description: "",
  status: "active"
}
```

Alergenos iniciales:

- Gluten.
- Lactosa.
- Huevo.
- Soja.
- Frutos secos.
- Sesamo.
- Mostaza.
- Apio.
- Sulfitos.

## Feedback

```js
{
  id: "feedback_001",
  customerId: "cust_001",
  orderId: "order_001",
  rating: 5,
  flavor: "BBQ",
  comment: "",
  createdAt: "ISO_DATE"
}
```

## Settings

```js
{
  currency: "EUR",
  locale: "es-ES",
  defaultMeatPerBurritoG: 100,
  productionProjectionDays: 2,
  priceMultipliers: {
    minimum: 2,
    healthy: 2.5,
    premium: 3
  },
  storageDefaults: {
    cookedRefrigeratedUseDays: 2,
    cookedFrozenUseDays: 30
  }
}
```

## Seed Real Inicial

El seed debe crear, como minimo:

- Proveedor `Carniceria local 1`.
- Producto crudo `Cuello de cerdo sin hueso / coll sense os`.
- Compra real de 2385 g por 26.21 EUR.
- Lote crudo inicial de 2385 g.
- Movimiento de entrada por compra.
- Produccion real 1 completada usando 1053 g y generando 800 g de cerdo neutro.
- Produccion real 2 pendiente usando 1318 g.
- Movimientos de consumo para ambas producciones.
- Stock crudo teorico restante de 14 g derivado de movimientos.
- Caldos, salsa de yogur, queso Edam y bolsas de papel como productos/insumos.

## Calculos Asociados

Los calculos deben vivir en `src/calculations.js` y no dentro de las vistas.

Prioridad:

- Precio unitario.
- Precio por kg.
- Rendimiento.
- Merma.
- Coste por gramo final.
- Coste por 100 g.
- Coste receta.
- Burritos posibles.
- Ingrediente limitante.
- Precio recomendado.
- Viabilidad de venta a 5 EUR.
