import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateFinalCostPer100g,
  calculateFinalCostPerGram,
  calculateLimitingIngredient,
  calculatePossibleUnits,
  calculatePricePerKg,
  calculateRecipeCost,
  calculateSuggestedPrices,
  calculateUnitCost,
  calculateWaste,
  calculateYield,
  formatCurrency,
  formatPercent,
  formatWeight
} from '../src/calculations.js';

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
