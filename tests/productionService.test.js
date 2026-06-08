import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedData } from '../src/seed.js';
import { calculateStockByProduct, calculateStockByLot } from '../src/calculations.js';
import { completeProductionBatch, flavorLot, saveProductionBatch } from '../src/services/businessService.js';

test('crear produccion nueva consume lote crudo y genera lote cocido', () => {
  const data = createSeedData();
  const result = saveProductionBatch(data, {
    type: 'cerdo',
    date: '2026-06-05',
    rawLotId: 'lot-pork-raw-001',
    rawWeightUsed: 10,
    resultProductId: 'prod-pork-cooked-neutral',
    finalWeight: 7,
    drainedWeight: 6,
    startTime: '10:00',
    endTime: '11:00',
    method: 'olla',
    location: 'nevera',
    expiresAt: '2026-06-07',
    notes: 'test'
  });

  assert.equal(result.ok, true);
  assert.equal(result.item.yieldRatio.toFixed(3), '0.700');

  const stockByLot = calculateStockByLot(result.data.stockMovements);
  assert.equal(stockByLot['lot-pork-raw-001'], 4);
  assert.equal(stockByLot[result.item.resultLotId], 7);
});

test('completar produccion pendiente crea lote final y stock cocido', () => {
  const data = createSeedData();
  const result = completeProductionBatch(data, {
    batchId: 'batch-pork-002',
    resultProductId: 'prod-pork-cooked-neutral',
    finalWeight: 900,
    drainedWeight: 840,
    endTime: '21:30',
    location: 'nevera',
    expiresAt: '2026-06-06',
    notes: 'test'
  });

  assert.equal(result.ok, true);
  assert.equal(result.item.resultLotId, result.data.lots.at(-1).id);
  assert.equal(result.item.yieldRatio.toFixed(3), '0.683');
  assert.equal(result.item.finalCostPer100g.toFixed(3), '1.799');

  const stock = calculateStockByProduct(result.data.stockMovements);
  assert.equal(stock['prod-pork-cooked-neutral'], 1700);
});

test('saborizar descuenta neutro y crea lote saborizado', () => {
  const data = createSeedData();
  const result = flavorLot(data, {
    sourceLotId: 'lot-pork-neutral-001',
    resultProductId: 'prod-pork-yogurt-creamy',
    quantity: 400,
    flavorProductId: 'prod-yogurt-salseo',
    flavorQuantity: 40,
    location: 'nevera',
    expiresAt: '2026-06-06',
    notes: 'test'
  });

  assert.equal(result.ok, true);

  const stock = calculateStockByProduct(result.data.stockMovements);
  assert.equal(stock['prod-pork-cooked-neutral'], 400);
  assert.equal(stock['prod-pork-yogurt-creamy'], 400);
  assert.equal(stock['prod-yogurt-salseo'], 260);

  const stockByLot = calculateStockByLot(result.data.stockMovements);
  assert.equal(stockByLot['lot-pork-neutral-001'], 400);
  assert.equal(stockByLot[result.item.id], 400);
});

test('produccion rechaza lote de insumo que no pertenece al producto elegido', () => {
  const data = createSeedData();
  const result = saveProductionBatch(data, {
    type: 'cerdo',
    date: '2026-06-05',
    rawLotId: 'lot-pork-raw-001',
    rawWeightUsed: 10,
    resultProductId: 'prod-pork-cooked-neutral',
    finalWeight: 7,
    location: 'nevera',
    inputs: [
      {
        productId: 'prod-yogurt-salseo',
        lotId: 'lot-pork-neutral-001',
        quantity: 1
      }
    ]
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /no pertenece/);
});

test('saborizar rechaza lote de sabor que no pertenece al producto elegido', () => {
  const data = createSeedData();
  const result = flavorLot(data, {
    sourceLotId: 'lot-pork-neutral-001',
    resultProductId: 'prod-pork-yogurt-creamy',
    quantity: 100,
    flavorProductId: 'prod-yogurt-salseo',
    flavorLotId: 'lot-pork-neutral-001',
    flavorQuantity: 10,
    location: 'nevera'
  });

  assert.equal(result.ok, false);
  assert.match(result.errors.join(' '), /no pertenece/);
});
