import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedData } from '../src/seed.js';
import {
  calculateRecipeCost,
  calculateRecipeFinancials,
  calculateRecipeSimulation
} from '../src/calculations.js';
import { duplicateRecipe, saveRecipe, setRecipeStatus } from '../src/services/businessService.js';

test('calcula coste y alerta de precio para Cerdo BBQ Base', () => {
  const data = createSeedData();
  const recipe = data.recipes.find((item) => item.id === 'recipe-pork-standard');
  const cost = calculateRecipeCost(recipe, data.products);
  const financials = calculateRecipeFinancials(recipe, data.products, data.settings);

  assert.equal(cost.toFixed(3), '2.272');
  assert.equal(financials.groupTotals.carne.toFixed(3), '1.446');
  assert.equal(financials.groupTotals.salsa.toFixed(3), '0.125');
  assert.equal(financials.priceStatus.key, 'margen_ajustado');
  assert.equal(financials.allergens.includes('gluten'), true);
  assert.equal(financials.allergens.includes('lactosa'), true);
});

test('simulador detecta queso como ingrediente limitante con stock de ejemplo', () => {
  const data = createSeedData();
  const recipe = data.recipes.find((item) => item.id === 'recipe-pork-standard');
  const stock = {
    'prod-pork-cooked-neutral': 800,
    'prod-rice-basmati-cooked': 1000,
    'prod-tortilla': 8,
    'prod-edam-cheese': 200,
    'prod-bbq-sauce': 1000,
    'prod-paper-bag-consum': 30
  };

  const simulation = calculateRecipeSimulation(recipe, stock, data.products, 6, data.settings);

  assert.equal(simulation.possibleUnits, 6);
  assert.equal(simulation.limitingIngredient.productId, 'prod-edam-cheese');
  assert.equal(simulation.ingredients.find((item) => item.productId === 'prod-edam-cheese').possibleUnits, 6);
  assert.equal(simulation.totalProductionCost.toFixed(3), '13.634');
});

test('extras modifican coste, alergeno y margen de una receta', () => {
  const data = createSeedData();
  const recipe = data.recipes.find((item) => item.id === 'recipe-pork-standard');
  const base = calculateRecipeFinancials(recipe, data.products, data.settings);
  const withExtra = calculateRecipeFinancials(recipe, data.products, data.settings, {
    extraIngredientIds: ['recipe-pork-bbq-extra-cheese']
  });

  assert.equal((withExtra.totalCost - base.totalCost).toFixed(3), '0.144');
  assert.equal(withExtra.allergens.includes('lactosa'), true);
  assert.equal(withExtra.grossProfit < base.grossProfit, true);
});

test('multiplicador y margen objetivo de receta participan en financieros', () => {
  const data = createSeedData();
  const recipe = {
    ...data.recipes.find((item) => item.id === 'recipe-pork-standard'),
    priceMultiplier: 2.2,
    targetMargin: 0.5
  };
  const financials = calculateRecipeFinancials(recipe, data.products, data.settings);

  assert.equal(financials.suggestedPrices.healthy.toFixed(3), '4.999');
  assert.equal(financials.targetMarginPrice.toFixed(3), '4.545');
  assert.equal(financials.meetsTargetMargin, true);
});

test('guardar receta rechaza unidad incompatible con producto', () => {
  const data = createSeedData();
  const result = saveRecipe(data, {
    name: 'Receta unidad mala',
    category: 'cerdo',
    status: 'prueba',
    currentSalePrice: 5,
    ingredients: [
      {
        productId: 'prod-tortilla',
        quantity: 100,
        unit: 'g',
        group: 'base',
        required: true
      }
    ]
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /Unidad incompatible/);
});

test('guardar, duplicar y retirar receta mantiene estructura editable', () => {
  const data = createSeedData();
  const saved = saveRecipe(data, {
    name: 'Receta test',
    category: 'cerdo',
    status: 'prueba',
    currentSalePrice: 5,
    targetMargin: 0.45,
    estimatedFinalWeight: 360,
    allergens: 'gluten',
    description: '',
    notes: '',
    ingredients: [
      {
        productId: 'prod-tortilla',
        quantity: 1,
        unit: 'ud',
        group: 'base',
        required: true,
        optional: false,
        extraAvailable: false
      }
    ]
  });

  assert.equal(saved.ok, true);
  assert.equal(saved.item.ingredients.length, 1);
  assert.equal(saved.item.ingredients[0].id.startsWith('recipe-ing'), true);

  const duplicated = duplicateRecipe(saved.data, saved.item.id);
  assert.equal(duplicated.ok, true);
  assert.equal(duplicated.item.status, 'prueba');
  assert.match(duplicated.item.name, /copia/);

  const retired = setRecipeStatus(duplicated.data, duplicated.item.id, 'retirado');
  assert.equal(retired.ok, true);
  assert.equal(retired.item.active, false);
});
