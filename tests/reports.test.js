import test from 'node:test';
import assert from 'node:assert/strict';
import { createSeedData } from '../src/seed.js';
import {
  getDashboardAnalytics,
  getPriceSupplierReport,
  getProductionReport,
  getSalesReport
} from '../src/reports.js';
import { createCsvExports, CSV_EXPORT_TYPES } from '../src/exporters.js';
import { deliverOrder, markOrderPaid, saveOrder, savePurchase } from '../src/services/businessService.js';

test('dashboard avanzado resume ventas, cobros y stock critico', () => {
  const data = createSeedData();
  addBurritoInputStock(data);
  const delivered = createDeliveredOrder(data, { paid: false });
  const analytics = getDashboardAnalytics(delivered.data, '2026-06-05');

  assert.equal(analytics.salesToday.total, 10);
  assert.equal(analytics.salesWeek.grossProfit > 0, true);
  assert.equal(analytics.pendingCollection, 10);
  assert.equal(analytics.topSellingRecipe.recipeName, 'Cerdo BBQ Base');
  assert.equal(Array.isArray(analytics.criticalStock), true);
});

test('reportes de ventas, produccion y precios calculan metricas base', () => {
  const data = createSeedData();
  addBurritoInputStock(data);
  const delivered = createDeliveredOrder(data, { paid: true });
  markOrderPaid(delivered.data, delivered.item.id, true, 'bizum');

  const sales = getSalesReport(delivered.data);
  const production = getProductionReport(delivered.data);
  const prices = getPriceSupplierReport(delivered.data);

  assert.equal(sales.metrics.totalSold, 10);
  assert.equal(sales.metrics.totalCollected, 10);
  assert.equal(production.metrics.averageYield.toFixed(3), '0.760');
  assert.equal(production.metrics.bestCutByYield.label, 'cerdo');
  assert.equal(prices.rows.length > 0, true);
  assert.equal(prices.metrics.mostUsedSupplier.name, 'Consum');
});

test('exportadores CSV generan archivos esperados', () => {
  const data = createSeedData();
  const exports = createCsvExports(data);

  assert.equal(Object.keys(exports).length, 6);
  assert.match(exports[CSV_EXPORT_TYPES.PRODUCTS].filename, /productos/);
  assert.match(exports[CSV_EXPORT_TYPES.PRODUCTIONS].content, /coste_100g/);
  assert.match(exports[CSV_EXPORT_TYPES.COSTS].content, /Cerdo BBQ Base/);
});

function createDeliveredOrder(data, { paid }) {
  const saved = saveOrder(data, {
    clientId: 'client-demo-001',
    orderDate: '2026-06-05',
    deliveryDate: '2026-06-05',
    status: 'confirmado',
    items: [{ recipeId: 'recipe-pork-standard', quantity: 2, unitPrice: 5 }],
    paymentMethod: 'bizum',
    paid
  });
  assert.equal(saved.ok, true);
  const delivered = deliverOrder(saved.data, saved.item.id);
  assert.equal(delivered.ok, true);
  if (paid) markOrderPaid(delivered.data, delivered.item.id, true, 'bizum');
  return delivered;
}

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
