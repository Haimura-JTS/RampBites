import test from 'node:test';
import assert from 'node:assert/strict';
import { PRODUCT_CATEGORIES, RECIPE_INGREDIENT_GROUPS, RECIPE_STATUS, STORAGE_LOCATIONS, UNITS } from '../src/constants.js';
import { calculateRecipeSimulation, calculateStockByProduct } from '../src/calculations.js';
import { buildCsvExport } from '../src/exporters.js';
import { createSeedData } from '../src/seed.js';
import {
  deliverOrder,
  saveOrder,
  saveProduct,
  saveProductionBatch,
  savePurchase,
  saveRecipe
} from '../src/services/businessService.js';

test('flujo funcional local: producto, compra, produccion, receta, pedido y export', () => {
  let data = createSeedData();

  const product = saveProduct(data, {
    name: 'Pimiento smoke test',
    category: PRODUCT_CATEGORIES.VEGETABLE,
    baseUnit: UNITS.GRAMS,
    stockMinimum: 50,
    estimatedUnitCost: 0.003,
    location: STORAGE_LOCATIONS.FRIDGE,
    requiresCold: true
  });
  assert.equal(product.ok, true);
  data = product.data;

  const purchase = savePurchase(data, {
    date: '2026-06-07',
    supplierId: 'sup-consum',
    ticketTotal: 12.4,
    ticketReference: 'smoke',
    notes: '',
    items: [
      { productId: 'prod-pork-collar-raw', quantity: 600, unit: UNITS.GRAMS, totalPrice: 6.6, destinationLocation: STORAGE_LOCATIONS.FRIDGE },
      { productId: 'prod-tortilla', quantity: 4, unit: UNITS.UNITS, totalPrice: 1.24, destinationLocation: STORAGE_LOCATIONS.PANTRY },
      { productId: 'prod-rice-basmati-cooked', quantity: 500, unit: UNITS.GRAMS, totalPrice: 0.55, destinationLocation: STORAGE_LOCATIONS.FRIDGE },
      { productId: 'prod-bbq-sauce', quantity: 200, unit: UNITS.MILLILITERS, totalPrice: 1, destinationLocation: STORAGE_LOCATIONS.FRIDGE },
      { productId: 'prod-pork-collar-raw', quantity: 300, unit: UNITS.GRAMS, totalPrice: 3.01, destinationLocation: STORAGE_LOCATIONS.FRIDGE }
    ]
  });
  assert.equal(purchase.ok, true);
  data = purchase.data;

  const rawLot = data.lots.find((lot) => lot.sourceId === purchase.item.id && lot.productId === 'prod-pork-collar-raw');
  const batch = saveProductionBatch(data, {
    date: '2026-06-07',
    type: 'cerdo',
    rawLotId: rawLot.id,
    rawWeightUsed: 500,
    finalWeight: 380,
    resultProductId: 'prod-pork-cooked-neutral',
    location: STORAGE_LOCATIONS.FRIDGE,
    startTime: '10:00',
    endTime: '13:00',
    method: 'olla',
    notes: 'Smoke test'
  });
  assert.equal(batch.ok, true);
  data = batch.data;

  const recipe = saveRecipe(data, {
    name: 'Smoke burrito cerdo',
    category: 'cerdo',
    status: RECIPE_STATUS.TEST,
    currentSalePrice: 5,
    targetMargin: 0.45,
    ingredients: [
      ingredient('prod-pork-cooked-neutral', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.MEAT),
      ingredient('prod-rice-basmati-cooked', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.BASE),
      ingredient('prod-tortilla', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.BASE),
      ingredient('prod-paper-bag-consum', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.PACKAGING)
    ]
  });
  assert.equal(recipe.ok, true);
  data = recipe.data;

  const stockBeforeOrder = calculateStockByProduct(data.stockMovements);
  const simulation = calculateRecipeSimulation(recipe.item, stockBeforeOrder, data.products, 2, data.settings);
  assert.equal(simulation.possibleUnits >= 2, true);

  const order = saveOrder(data, {
    clientId: 'client-demo-001',
    orderDate: '2026-06-07',
    deliveryDate: '2026-06-07',
    status: 'confirmado',
    items: [{ recipeId: recipe.item.id, quantity: 2, unitPrice: 5 }],
    paymentMethod: 'bizum'
  });
  assert.equal(order.ok, true);

  const delivered = deliverOrder(order.data, order.item.id);
  assert.equal(delivered.ok, true);
  const stockAfterOrder = calculateStockByProduct(delivered.data.stockMovements);
  assert.equal(stockAfterOrder['prod-tortilla'], stockBeforeOrder['prod-tortilla'] - 2);

  const csv = buildCsvExport(delivered.data, 'pedidos');
  assert.match(csv.content, /Smoke burrito cerdo/);
});

function ingredient(productId, quantity, unit, group) {
  return {
    productId,
    quantity,
    unit,
    group,
    required: true,
    optional: false,
    extraAvailable: false
  };
}
