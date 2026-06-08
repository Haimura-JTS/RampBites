import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedData } from '../src/seed.js';
import { calculateOrderTotals, calculateShoppingList, calculateStockByProduct } from '../src/calculations.js';
import { deliverOrder, markOrderPaid, saveOrder, savePurchase, setOrderStatus } from '../src/services/businessService.js';

test('guardar pedido calcula total, coste y ganancia desde receta', () => {
  const data = createSeedData();
  const result = saveOrder(data, {
    clientId: 'client-demo-001',
    orderDate: '2026-06-05',
    deliveryDate: '2026-06-05',
    status: 'pendiente',
    items: [
      {
        recipeId: 'recipe-pork-standard',
        quantity: 2,
        unitPrice: 5
      }
    ],
    discount: 1,
    paid: false,
    paymentMethod: 'bizum'
  });

  assert.equal(result.ok, true);
  assert.equal(result.item.orderNumber, 'PED-20260605-001');
  assert.equal(result.item.subtotal, 10);
  assert.equal(result.item.total, 9);
  assert.equal(result.item.estimatedCost.toFixed(2), '4.54');
  assert.equal(result.item.estimatedProfit.toFixed(2), '4.46');

  const totals = calculateOrderTotals(result.item, result.data.recipes, result.data.products, result.data.settings);
  assert.equal(totals.allergens.includes('gluten'), true);
  assert.equal(totals.items[0].recipeName, 'Cerdo BBQ Base');
});

test('entregar pedido descuenta stock y registra venta trazable', () => {
  const data = createSeedData();
  addBurritoInputStock(data);

  const saved = saveOrder(data, {
    clientId: 'client-demo-001',
    orderDate: '2026-06-05',
    deliveryDate: '2026-06-05',
    status: 'confirmado',
    items: [{ recipeId: 'recipe-pork-standard', quantity: 2, unitPrice: 5 }],
    paymentMethod: 'bizum'
  });
  assert.equal(saved.ok, true);
  assert.equal(saved.item.stockReserved, true);

  const delivered = deliverOrder(saved.data, saved.item.id);
  assert.equal(delivered.ok, true);
  assert.equal(delivered.item.status, 'entregado');
  assert.equal(delivered.item.stockReserved, false);
  assert.equal(delivered.item.stockMovementsCreated, true);

  const stock = calculateStockByProduct(delivered.data.stockMovements);
  assert.equal(stock['prod-pork-cooked-neutral'], 600);
  assert.equal(stock['prod-tortilla'], 8);
  assert.equal(stock['prod-paper-bag-consum'], 28);
  assert.equal(delivered.data.stockMovements.filter((movement) => movement.referenceId === delivered.item.id && movement.type === 'reserva').length > 0, true);
  assert.equal(delivered.data.stockMovements.filter((movement) => movement.referenceId === delivered.item.id && movement.type === 'liberacion_reserva').length > 0, true);
  assert.equal(delivered.data.stockMovements.filter((movement) => movement.referenceId === delivered.item.id && movement.type === 'venta').length > 0, true);

  const paid = markOrderPaid(delivered.data, delivered.item.id, true, 'bizum');
  assert.equal(paid.ok, true);
  assert.equal(paid.item.paid, true);
});

test('entregar pedido falla si falta stock', () => {
  const data = createSeedData();
  const saved = saveOrder(data, {
    clientId: 'client-demo-001',
    orderDate: '2026-06-05',
    deliveryDate: '2026-06-05',
    status: 'pendiente',
    items: [{ recipeId: 'recipe-pork-standard', quantity: 1, unitPrice: 5 }]
  });

  const delivered = deliverOrder(saved.data, saved.item.id);
  assert.equal(delivered.ok, false);
  assert.match(delivered.errors.join(' '), /Stock insuficiente/);
});

test('confirmar pedido reserva stock y cancelar libera reserva', () => {
  const data = createSeedData();
  addBurritoInputStock(data);
  const saved = saveOrder(data, {
    clientId: 'client-demo-001',
    orderDate: '2026-06-05',
    deliveryDate: '2026-06-05',
    status: 'pendiente',
    items: [{ recipeId: 'recipe-pork-standard', quantity: 2, unitPrice: 5 }]
  });

  assert.equal(saved.ok, true);
  const confirmed = setOrderStatus(saved.data, saved.item.id, 'confirmado');
  assert.equal(confirmed.ok, true);
  assert.equal(confirmed.item.stockReserved, true);
  assert.equal(confirmed.data.stockMovements.filter((movement) => movement.referenceId === confirmed.item.id && movement.type === 'reserva').length > 0, true);

  const reservedStock = calculateStockByProduct(confirmed.data.stockMovements);
  assert.equal(reservedStock['prod-pork-cooked-neutral'], 600);
  assert.equal(reservedStock['prod-tortilla'], 8);

  const cancelled = setOrderStatus(confirmed.data, confirmed.item.id, 'cancelado');
  assert.equal(cancelled.ok, true);
  assert.equal(cancelled.item.stockReserved, false);
  assert.equal(cancelled.data.stockMovements.filter((movement) => movement.referenceId === cancelled.item.id && movement.type === 'liberacion_reserva').length > 0, true);

  const releasedStock = calculateStockByProduct(cancelled.data.stockMovements);
  assert.equal(releasedStock['prod-pork-cooked-neutral'], 800);
  assert.equal(releasedStock['prod-tortilla'], 10);
});

test('reconfirmar despues de liberar no duplica reservas al entregar', () => {
  const data = createSeedData();
  addBurritoInputStock(data);
  const saved = saveOrder(data, {
    clientId: 'client-demo-001',
    orderDate: '2026-06-05',
    deliveryDate: '2026-06-05',
    status: 'pendiente',
    items: [{ recipeId: 'recipe-pork-standard', quantity: 1, unitPrice: 5 }]
  });

  const firstConfirm = setOrderStatus(saved.data, saved.item.id, 'confirmado');
  const pendingAgain = setOrderStatus(firstConfirm.data, firstConfirm.item.id, 'pendiente');
  const secondConfirm = setOrderStatus(pendingAgain.data, pendingAgain.item.id, 'confirmado');
  const delivered = deliverOrder(secondConfirm.data, secondConfirm.item.id);

  assert.equal(delivered.ok, true);
  const stock = calculateStockByProduct(delivered.data.stockMovements);
  assert.equal(stock['prod-pork-cooked-neutral'], 700);
  assert.equal(stock['prod-tortilla'], 9);
});

test('lista de compra detecta faltantes de pedidos proximos', () => {
  const data = createSeedData();
  const saved = saveOrder(data, {
    clientId: 'client-demo-001',
    orderDate: '2026-06-05',
    deliveryDate: '2026-06-05',
    status: 'pendiente',
    items: [{ recipeId: 'recipe-pork-standard', quantity: 3, unitPrice: 5 }]
  });

  assert.equal(saved.ok, true);
  const stock = calculateStockByProduct(saved.data.stockMovements);
  const shoppingList = calculateShoppingList(saved.data.orders, saved.data.recipes, saved.data.products, stock, saved.data.suppliers, saved.data.priceHistory, saved.data.settings, {
    fromDate: '2026-06-05',
    toDate: '2026-06-05'
  });

  const tortilla = shoppingList.find((item) => item.productId === 'prod-tortilla');
  const rice = shoppingList.find((item) => item.productId === 'prod-rice-basmati-cooked');
  assert.equal(tortilla.missingQuantity, 3);
  assert.equal(rice.missingQuantity, 300);
});

function addBurritoInputStock(data) {
  const result = savePurchase(data, {
    date: '2026-06-05',
    supplierId: 'sup-consum',
    ticketTotal: 6.1,
    ticketReference: 'test-stock',
    notes: '',
    items: [
      { productId: 'prod-tortilla', quantity: 10, unit: 'ud', totalPrice: 3.1, destinationLocation: 'despensa' },
      { productId: 'prod-rice-basmati-cooked', quantity: 1000, unit: 'g', totalPrice: 1.1, destinationLocation: 'nevera' },
      { productId: 'prod-bbq-sauce', quantity: 300, unit: 'ml', totalPrice: 1.5, destinationLocation: 'nevera' },
      { productId: 'prod-honey', quantity: 100, unit: 'g', totalPrice: 0.4, destinationLocation: 'despensa' }
    ]
  });
  assert.equal(result.ok, true);
}
