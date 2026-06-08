import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFinalCostPer100g,
  calculateFinalCostPerGram,
  calculateLotSummaries,
  calculateLimitingIngredient,
  calculatePhysicalStockByProduct,
  calculatePossibleUnits,
  calculatePricePerKg,
  calculateRecipeCost,
  calculateReservedStockByLot,
  calculateReservedStockByProduct,
  calculateStockByProduct,
  calculateStockCommitments,
  calculateSuggestedPrices,
  calculateUnitCost,
  calculateWaste,
  calculateYield,
  formatCurrency,
  formatPercent,
  formatWeight
} from '../src/calculations.js';
import { MOVEMENT_TYPES } from '../src/constants.js';

test('calcula coste unitario y precio por kg', () => {
  assert.equal(calculateUnitCost(26.21, 2385).toFixed(5), '0.01099');
  assert.equal(calculatePricePerKg(26.21, 2385).toFixed(2), '10.99');
});

test('calcula rendimiento, merma y coste final', () => {
  assert.equal(calculateYield(1053, 800).toFixed(3), '0.760');
  assert.deepEqual(roundWaste(calculateWaste(1053, 800)), { grams: 253, percentage: 0.24 });
  assert.equal(calculateFinalCostPerGram(11.57, 800).toFixed(5), '0.01446');
  assert.equal(calculateFinalCostPer100g(11.57, 800).toFixed(3), '1.446');
});

test('calcula coste de receta y precios sugeridos', () => {
  const recipe = {
    ingredients: [
      { productId: 'meat', quantity: 100 },
      { productId: 'bag', quantity: 1 }
    ]
  };
  const products = [
    { id: 'meat', currentUnitCost: 0.01446 },
    { id: 'bag', currentUnitCost: 0.065 }
  ];
  const cost = calculateRecipeCost(recipe, products);
  assert.equal(cost.toFixed(3), '1.511');
  assert.deepEqual(roundPrices(calculateSuggestedPrices(cost, { minimum: 2, healthy: 2.5, premium: 3 })), {
    minimum: 3.02,
    healthy: 3.78,
    premium: 4.53
  });
});

test('calcula unidades posibles e ingrediente limitante', () => {
  const recipe = {
    ingredients: [
      { productId: 'meat', quantity: 100 },
      { productId: 'bag', quantity: 1 }
    ]
  };
  const stock = { meat: 800, bag: 3 };

  assert.equal(calculatePossibleUnits(recipe, stock), 3);
  assert.deepEqual(calculateLimitingIngredient(recipe, stock), {
    productId: 'bag',
    possible: 3,
    required: 1,
    available: 3
  });
});

test('distingue stock fisico, reservado y disponible', () => {
  const movements = [
    {
      productId: 'meat',
      type: MOVEMENT_TYPES.PURCHASE,
      quantity: 800,
      unit: 'g',
      direction: 1,
      toLotId: 'lot-a'
    },
    {
      productId: 'meat',
      type: MOVEMENT_TYPES.RESERVATION,
      quantity: 200,
      unit: 'g',
      direction: -1,
      fromLotId: 'lot-a'
    },
    {
      productId: 'meat',
      type: MOVEMENT_TYPES.RESERVATION_RELEASE,
      quantity: 50,
      unit: 'g',
      direction: 1,
      toLotId: 'lot-a'
    }
  ];

  assert.equal(calculatePhysicalStockByProduct(movements).meat, 800);
  assert.equal(calculateReservedStockByProduct(movements).meat, 150);
  assert.equal(calculateStockByProduct(movements).meat, 650);
  assert.equal(calculateReservedStockByLot(movements)['lot-a'], 150);

  const commitments = calculateStockCommitments(movements);
  assert.equal(commitments.physicalByProduct.meat, 800);
  assert.equal(commitments.reservedByProduct.meat, 150);
  assert.equal(commitments.availableByProduct.meat, 650);

  const [lot] = calculateLotSummaries(
    [{ id: 'lot-a', productId: 'meat', lotCode: 'LOTE-A', unit: 'g', unitCost: 0.01, status: 'active' }],
    movements,
    [{ id: 'meat', name: 'Carne', baseUnit: 'g' }]
  );
  assert.equal(lot.physicalQuantity, 800);
  assert.equal(lot.reservedQuantity, 150);
  assert.equal(lot.currentQuantity, 650);
  assert.equal(lot.computedStatus, 'sin_fecha');
});

test('formatea moneda, peso y porcentaje', () => {
  assert.match(formatCurrency(5), /5/);
  assert.equal(formatWeight(1500), '1,5 kg');
  assert.equal(formatPercent(0.759), '75,9 %');
});

function roundWaste(waste) {
  return {
    grams: waste.grams,
    percentage: Number(waste.percentage.toFixed(2))
  };
}

function roundPrices(prices) {
  return Object.fromEntries(
    Object.entries(prices).map(([key, value]) => [key, Number(value.toFixed(2))])
  );
}
