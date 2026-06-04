# Architecture

## Proposito

Ramp Bites Control Panel sera una app web local-first para gestion interna de produccion artesanal de burritos. La arquitectura debe permitir empezar con LocalStorage y migrar despues a IndexedDB, SQLite o backend Node.js sin reescribir la logica de negocio.

## Principios

- UI en espanol.
- Logica de negocio separada de la interfaz.
- Stock derivado de movimientos trazables.
- Datos seed editables, no hardcodeados en las vistas.
- Calculos centralizados y testeables.
- Formularios validados antes de persistir.
- Modulos pequenos y mantenibles.

## Capas

### UI

Responsable de renderizar vistas, formularios, tablas, mensajes y navegacion.

Archivos previstos:

- `src/main.js`
- `src/router.js`
- `src/views/*`
- `src/components/*`
- `src/styles/*`

### Aplicacion

Coordina acciones de usuario, validaciones y persistencia.

Archivos previstos:

- `src/validators.js`
- `src/models.js`
- Servicios futuros por dominio si el codigo crece.

### Dominio

Contiene reglas puras de negocio:

- Calculos de coste.
- Rendimiento y merma.
- Burritos posibles.
- Ingrediente limitante.
- Viabilidad de precio.
- Reglas de stock.

Archivo previsto:

- `src/calculations.js`

### Persistencia

Adaptador local con API pequena. La UI no debe llamar directamente a `localStorage`.

Archivo previsto:

- `src/storage.js`

API inicial sugerida:

```js
loadDatabase()
saveDatabase(database)
resetDatabase()
seedDatabaseIfNeeded()
getCollection(name)
upsertEntity(collectionName, entity)
deleteEntity(collectionName, id)
```

## Modelo LocalStorage

Clave sugerida:

```txt
ramp-bites-control-panel:v1
```

Estructura:

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
  settings: {
    currency: "EUR",
    units: ["g", "ml", "unit"],
    priceMultipliers: {
      minimum: 2,
      healthy: 2.5,
      premium: 3
    }
  }
}
```

## Entidades Iniciales

### Product

Campos sugeridos:

- `id`
- `name`
- `alias`
- `category`
- `baseUnit`
- `stockType`
- `active`
- `status`
- `allergenIds`
- `notes`

### Supplier

- `id`
- `name`
- `contact`
- `notes`
- `status`

### Purchase

- `id`
- `supplierId`
- `date`
- `status`
- `lines`
- `totalCost`
- `notes`

### StockLot

- `id`
- `productId`
- `lotCode`
- `sourceType`
- `sourceId`
- `stockType`
- `storageState`
- `initialQuantity`
- `unit`
- `unitCost`
- `totalCost`
- `producedAt`
- `expiresAt`
- `status`
- `notes`

### StockMovement

- `id`
- `date`
- `type`
- `productId`
- `fromLotId`
- `toLotId`
- `quantity`
- `unit`
- `unitCost`
- `reason`
- `referenceType`
- `referenceId`
- `notes`

### ProductionBatch

- `id`
- `batchCode`
- `date`
- `status`
- `mainProductId`
- `rawInputWeightG`
- `finalWeightG`
- `drainedWeightG`
- `liquidInitialMl`
- `brothUsedMl`
- `brothLeftMl`
- `startTime`
- `endTime`
- `heatLevel`
- `inputs`
- `outputs`
- `yieldRatio`
- `shrinkageG`
- `shrinkagePercentage`
- `totalCost`
- `costPerFinalGram`
- `notes`

### Recipe

- `id`
- `name`
- `status`
- `servingSizeG`
- `ingredients`
- `allergenIds`
- `targetPrice`
- `notes`

### Order

- `id`
- `customerId`
- `date`
- `deliveryDate`
- `status`
- `lines`
- `totalCost`
- `totalPrice`
- `notes`

## Reglas de Dominio Criticas

- El stock disponible debe calcularse sumando entradas y salidas por lote.
- Las transformaciones deben crear movimientos enlazados, no borrar el lote original sin rastro.
- La carne saborizada debe proceder de un lote cocido neutro.
- El sobrante de carne debe permanecer neutro cuando sea posible.
- La produccion debe avisar si supera la proyeccion de 2 dias.
- La ternera debe estar marcada como `standby` o `premium`.
- Una tanda pendiente no debe generar stock final vendible hasta completarse.
- Vender a 5 EUR debe evaluarse contra el coste real de la receta.

## Migracion Futura

La capa `storage.js` debe ser reemplazable por:

- IndexedDB para uso local robusto.
- SQLite para escritorio o backend ligero.
- API HTTP Node.js para multiusuario.

La clave es mantener contratos estables entre UI, dominio y persistencia.

## Pruebas Futuras

Prioridad inicial:

- `calculateUnitPrice`
- `calculatePricePerKg`
- `calculateYield`
- `calculateShrinkage`
- `calculateProductionCostPerGram`
- `calculateRecipeCost`
- `calculatePossibleBurritos`
- `calculateRecommendedPrices`

Las pruebas deben cubrir redondeos y unidades.
