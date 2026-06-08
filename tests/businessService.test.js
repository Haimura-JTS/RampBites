import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedData } from '../src/seed.js';
import { calculateStockByProduct } from '../src/calculations.js';
import { createStockMovement, savePurchase } from '../src/services/businessService.js';

test('guardar compra actualiza stock, coste real e historial de precios', () => {
  const data = createSeedData();
  const result = savePurchase(data, {
    date: '2026-06-05',
    supplierId: 'sup-consum',
    ticketTotal: 0.62,
    ticketReference: 'test',
    notes: '',
    items: [
      {
        productId: 'prod-tortilla',
        quantity: 2,
        unit: 'ud',
        totalPrice: 0.62,
        expirationDate: '',
        destinationLocation: 'despensa',
        notes: 'test'
      }
    ]
  });

  assert.equal(result.ok, true);
  const stock = calculateStockByProduct(result.data.stockMovements);
  assert.equal(stock['prod-tortilla'], 2);

  const tortilla = result.data.products.find((product) => product.id === 'prod-tortilla');
  assert.equal(tortilla.currentUnitCost, 0.31);
  assert.equal(tortilla.costSource, 'real');

  const latestPrice = result.data.priceHistory.at(-1);
  assert.equal(latestPrice.productId, 'prod-tortilla');
  assert.equal(latestPrice.normalizedPrice, 0.31);
  assert.equal(latestPrice.normalizedUnit, 'ud');
});

test('movimiento manual rechaza lote de otro producto y stock insuficiente', () => {
  const data = createSeedData();
  const mismatchedLot = createStockMovement(data, {
    productId: 'prod-paper-bag-consum',
    type: 'merma',
    quantity: 1,
    lotId: 'lot-pork-neutral-001',
    notes: 'test'
  });

  assert.equal(mismatchedLot.ok, false);
  assert.match(mismatchedLot.errors.join(' '), /no pertenece/);

  const insufficient = createStockMovement(data, {
    productId: 'prod-paper-bag-consum',
    type: 'merma',
    quantity: 31,
    notes: 'test'
  });

  assert.equal(insufficient.ok, false);
  assert.match(insufficient.errors.join(' '), /Stock insuficiente/);
});
