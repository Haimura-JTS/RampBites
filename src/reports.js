import {
  ORDER_STATUS,
  RECIPE_STATUS,
  STOCK_TYPES
} from './constants.js';
import {
  calculateLotSummaries,
  calculateOrderPlanning,
  calculateOrderTotals,
  calculatePossibleUnits,
  calculateRecipeFinancials,
  calculateStockByProduct,
  calculateStockCommitments,
  calculateStockValue,
  formatCurrency,
  formatPercent,
  formatWeight,
  getProductUnitCost
} from './calculations.js';

const ACTIVE_ORDER_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.IN_PRODUCTION,
  ORDER_STATUS.READY
];

export function getDashboardAnalytics(data, today = todayString()) {
  const stockCommitments = getStockCommitmentReport(data);
  const stock = stockCommitments.availableByProduct;
  const salesReport = getSalesReport(data, { fromDate: null, toDate: today });
  const deliveredOrders = data.orders.filter((order) => order.status === ORDER_STATUS.DELIVERED);
  const dayOrders = deliveredOrders.filter((order) => orderDate(order) === today);
  const weekStart = addDays(today, -6);
  const weekOrders = deliveredOrders.filter((order) => inDateRange(orderDate(order), weekStart, today));
  const activeOrders = data.orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status));
  const lotSummaries = calculateLotSummaries(data.lots, data.stockMovements, data.products);
  const criticalStock = getCriticalStock(data.products, stock);
  const expiringLots = getExpiringLotSummaries(lotSummaries);
  const controlRecipe = getControlRecipe(data.recipes);
  const controlPossibleUnits = controlRecipe ? calculatePossibleUnits(controlRecipe, stock) : 0;
  const limiting = controlRecipe ? getRecipeLimitingIngredient(controlRecipe, stock, data.products) : null;
  const recipePerformance = getRecipePerformance(data);
  const pendingCollection = deliveredOrders
    .filter((order) => !order.paid)
    .reduce((total, order) => total + (Number(order.total) || 0), 0);
  const planning = calculateOrderPlanning(data.orders, data.recipes, data.products, stock, data.settings, {
    fromDate: today,
    toDate: addDays(today, 1)
  });

  return {
    today,
    weekStart,
    salesToday: summarizeOrders(dayOrders),
    salesWeek: summarizeOrders(weekOrders),
    pendingOrders: activeOrders.length,
    deliveredOrders: deliveredOrders.length,
    topSellingRecipe: recipePerformance.topSellingRecipe,
    mostProfitableRecipe: recipePerformance.mostProfitableRecipe,
    leastProfitableRecipe: recipePerformance.leastProfitableRecipe,
    criticalStock,
    stockCommitments,
    expiringLots,
    controlRecipe,
    burritosPossibleToday: controlPossibleUnits,
    limitingIngredient: limiting,
    pendingCollection,
    planning,
    salesReport
  };
}

export function getStockCommitmentReport(data, commitments = calculateStockCommitments(data.stockMovements)) {
  const {
    availableByProduct,
    physicalByProduct,
    reservedByProduct
  } = commitments;
  const rows = data.products.map((product) => {
    const physicalQuantity = Number(physicalByProduct[product.id] ?? 0);
    const reservedQuantity = Number(reservedByProduct[product.id] ?? 0);
    const availableQuantity = Number(availableByProduct[product.id] ?? 0);
    const unitCost = getProductUnitCost(product);
    return {
      productId: product.id,
      productName: product.name,
      category: product.category,
      location: product.location,
      unit: product.baseUnit,
      stockMinimum: Number(product.stockMinimum) || 0,
      physicalQuantity,
      reservedQuantity,
      availableQuantity,
      unitCost,
      physicalValue: Math.max(physicalQuantity, 0) * unitCost,
      reservedValue: Math.max(reservedQuantity, 0) * unitCost,
      availableValue: Math.max(availableQuantity, 0) * unitCost,
      hasReservation: reservedQuantity > 0,
      lowAvailable: product.active && Number(product.stockMinimum) > 0 && availableQuantity <= Number(product.stockMinimum)
    };
  });

  return {
    ...commitments,
    rows,
    reservedRows: rows.filter((row) => row.hasReservation),
    lowAvailableRows: rows.filter((row) => row.lowAvailable),
    metrics: {
      physicalValue: calculateStockValue(data.products, physicalByProduct),
      reservedValue: calculateStockValue(data.products, reservedByProduct),
      availableValue: calculateStockValue(data.products, availableByProduct),
      reservedProducts: rows.filter((row) => row.hasReservation).length,
      lowAvailableProducts: rows.filter((row) => row.lowAvailable).length,
      reservedUnits: rows.reduce((total, row) => total + row.reservedQuantity, 0)
    }
  };
}

export function getProductionReport(data) {
  const productIndex = toIndex(data.products);
  const supplierIndex = toIndex(data.suppliers);
  const rows = data.productionBatches.map((batch) => {
    const rawProduct = productIndex[batch.rawProductId];
    const resultProduct = productIndex[batch.resultProductId];
    const supplier = supplierIndex[rawProduct?.preferredSupplierId];
    const cut = rawProduct?.subcategory || rawProduct?.name || batch.type || 'sin corte';
    return {
      id: batch.id,
      date: batch.date || batch.createdAt?.slice(0, 10) || '',
      batchCode: batch.batchCode,
      lotCode: getLotCode(data.lots, batch.resultLotId),
      meat: rawProduct?.name ?? batch.rawProductId ?? '',
      result: resultProduct?.name ?? batch.resultProductId ?? '',
      cut,
      supplierName: supplier?.name ?? 'Sin proveedor',
      rawWeight: Number(batch.rawWeightUsed) || 0,
      finalWeight: Number(batch.finalWeight) || 0,
      yieldRatio: Number(batch.yieldRatio) || 0,
      totalCost: Number(batch.totalCost) || 0,
      costPer100g: Number(batch.finalCostPer100g) || 0,
      durationMinutes: Number(batch.durationMinutes) || 0,
      status: batch.status,
      notes: batch.notes ?? ''
    };
  });

  const finishedRows = rows.filter((row) => row.finalWeight > 0 && row.yieldRatio > 0);
  const yieldByCut = averageGroups(finishedRows, 'cut', 'yieldRatio');
  const costByCut = averageGroups(finishedRows.filter((row) => row.costPer100g > 0), 'cut', 'costPer100g');
  const costBySupplier = averageGroups(finishedRows.filter((row) => row.costPer100g > 0), 'supplierName', 'costPer100g');

  return {
    rows,
    metrics: {
      averageYield: average(finishedRows.map((row) => row.yieldRatio)),
      averageCostPer100g: average(finishedRows.map((row) => row.costPer100g).filter(Boolean)),
      bestSupplierByFinalCost: minGroup(costBySupplier),
      bestCutByYield: maxGroup(yieldByCut),
      yieldByCut,
      costByCut
    }
  };
}

export function getSalesReport(data, options = {}) {
  const fromDate = options.fromDate ?? null;
  const toDate = options.toDate ?? null;
  const clientIndex = toIndex(data.clients);
  const recipeIndex = toIndex(data.recipes);
  const rows = data.orders
    .filter((order) => inDateRange(orderDate(order), fromDate, toDate))
    .map((order) => {
      const totals = calculateOrderTotals(order, data.recipes, data.products, data.settings);
      return {
        id: order.id,
        orderNumber: order.orderNumber ?? order.id,
        clientName: clientIndex[order.clientId]?.name ?? 'Cliente eliminado',
        date: orderDate(order),
        items: (order.items ?? []).map((item) => {
          const recipe = recipeIndex[item.recipeId];
          return `${Number(item.quantity) || 0} x ${recipe?.name ?? item.recipeId}`;
        }).join(', '),
        total: totals.total,
        estimatedCost: totals.estimatedCost,
        grossProfit: totals.estimatedProfit,
        marginPercentage: totals.marginPercentage,
        status: order.status,
        paid: Boolean(order.paid),
        paymentMethod: order.paymentMethod ?? ''
      };
    });

  const deliveredRows = rows.filter((row) => row.status === ORDER_STATUS.DELIVERED);
  const collected = deliveredRows
    .filter((row) => row.paid)
    .reduce((total, row) => total + row.total, 0);
  const totalSold = deliveredRows.reduce((total, row) => total + row.total, 0);
  const grossProfit = deliveredRows.reduce((total, row) => total + row.grossProfit, 0);

  return {
    rows,
    metrics: {
      totalSold,
      totalCollected: collected,
      pendingCollection: totalSold - collected,
      grossProfit,
      averageMargin: totalSold > 0 ? grossProfit / totalSold : 0,
      deliveredCount: deliveredRows.length,
      pendingCount: rows.filter((row) => ACTIVE_ORDER_STATUSES.includes(row.status)).length
    }
  };
}

export function getPriceSupplierReport(data) {
  const productIndex = toIndex(data.products);
  const supplierIndex = toIndex(data.suppliers);
  const groups = new Map();
  const supplierUse = new Map();

  for (const entry of data.priceHistory) {
    const key = `${entry.productId}::${entry.supplierId}`;
    const entries = groups.get(key) ?? [];
    entries.push(entry);
    groups.set(key, entries);
    supplierUse.set(entry.supplierId, (supplierUse.get(entry.supplierId) ?? 0) + 1);
  }

  const rows = [...groups.values()].map((entries) => {
    const sorted = [...entries].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const latest = sorted.at(-1);
    const prices = sorted.map((entry) => Number(entry.normalizedPrice) || 0).filter(Boolean);
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const latestPrice = Number(latest?.normalizedPrice) || 0;
    return {
      productId: latest?.productId ?? '',
      productName: productIndex[latest?.productId]?.name ?? latest?.productId ?? '',
      supplierId: latest?.supplierId ?? '',
      supplierName: supplierIndex[latest?.supplierId]?.name ?? 'Sin proveedor',
      latestPrice,
      latestUnitCost: Number(latest?.unitCost) || 0,
      latestDate: latest?.date ?? '',
      normalizedUnit: latest?.normalizedUnit ?? '',
      min,
      max,
      count: sorted.length,
      variation: min > 0 ? (latestPrice - min) / min : 0,
      highPriceAlert: min > 0 && latestPrice > min * 1.15
    };
  }).sort((a, b) => a.productName.localeCompare(b.productName));

  return {
    rows,
    metrics: {
      cheapestByProduct: getCheapestSuppliers(rows),
      mostUsedSupplier: maxPair(supplierUse, supplierIndex),
      highPriceAlerts: rows.filter((row) => row.highPriceAlert),
      supplierCount: new Set(rows.map((row) => row.supplierId)).size
    }
  };
}

export function getRecipePerformance(data) {
  const recipeIndex = toIndex(data.recipes);
  const performance = new Map();

  for (const order of data.orders.filter((item) => item.status === ORDER_STATUS.DELIVERED)) {
    const totals = calculateOrderTotals(order, data.recipes, data.products, data.settings);
    for (const item of totals.items) {
      const current = performance.get(item.recipeId) ?? {
        recipeId: item.recipeId,
        recipeName: recipeIndex[item.recipeId]?.name ?? item.recipeId,
        quantity: 0,
        revenue: 0,
        cost: 0,
        grossProfit: 0
      };
      current.quantity += item.quantity;
      current.revenue += item.lineTotal;
      current.cost += item.lineCost;
      current.grossProfit += item.grossProfit;
      performance.set(item.recipeId, current);
    }
  }

  const rows = [...performance.values()].map((row) => ({
    ...row,
    marginPercentage: row.revenue > 0 ? row.grossProfit / row.revenue : 0
  }));

  return {
    rows,
    topSellingRecipe: maxBy(rows, 'quantity'),
    mostProfitableRecipe: maxBy(rows, 'grossProfit'),
    leastProfitableRecipe: rows.length ? minBy(rows, 'grossProfit') : null
  };
}

export function getCostReport(data) {
  const stock = calculateStockByProduct(data.stockMovements);
  return data.recipes.map((recipe) => {
    const financials = calculateRecipeFinancials(recipe, data.products, data.settings);
    return {
      recipeId: recipe.id,
      recipeName: recipe.name,
      status: recipe.status,
      cost: financials.totalCost,
      salePrice: financials.salePrice,
      grossProfit: financials.grossProfit,
      marginPercentage: financials.marginPercentage,
      possibleUnits: calculatePossibleUnits(recipe, stock),
      priceStatus: financials.priceStatus.label
    };
  });
}

export function formatReportQuantity(value, unit) {
  if (unit === 'g') return formatWeight(value);
  return `${Number(value || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${unit}`;
}

export function formatReportMoney(value) {
  return formatCurrency(value);
}

export function formatReportPercent(value) {
  return formatPercent(value);
}

function summarizeOrders(orders) {
  const total = orders.reduce((sum, order) => sum + (Number(order.total) || 0), 0);
  const cost = orders.reduce((sum, order) => sum + (Number(order.estimatedCost) || 0), 0);
  return {
    count: orders.length,
    total,
    estimatedCost: cost,
    grossProfit: total - cost,
    marginPercentage: total > 0 ? (total - cost) / total : 0
  };
}

function getControlRecipe(recipes = []) {
  return recipes.find((recipe) => recipe.id === 'recipe-pork-standard')
    ?? recipes.find((recipe) => recipe.status === RECIPE_STATUS.ACTIVE)
    ?? recipes[0]
    ?? null;
}

function getRecipeLimitingIngredient(recipe, stock, products) {
  let limiting = null;
  for (const ingredient of recipe.ingredients ?? []) {
    if (ingredient.optional || ingredient.extraAvailable || ingredient.required === false) continue;
    const available = Number(stock[ingredient.productId] ?? 0);
    const required = Number(ingredient.quantity) || 0;
    const possible = required > 0 ? Math.floor(available / required) : 0;
    if (!limiting || possible < limiting.possible) {
      const product = products.find((item) => item.id === ingredient.productId);
      limiting = {
        productId: ingredient.productId,
        productName: product?.name ?? ingredient.productId,
        possible,
        available,
        required,
        unit: ingredient.unit ?? product?.baseUnit ?? ''
      };
    }
  }
  return limiting;
}

function getCriticalStock(products, stock) {
  return products
    .filter((product) => product.active && Number(product.stockMinimum) > 0)
    .filter((product) => {
      const current = Number(stock[product.id] ?? 0);
      return current <= Number(product.stockMinimum);
    })
    .map((product) => ({
      ...product,
      currentStock: Number(stock[product.id] ?? 0),
      severity: product.stockType === STOCK_TYPES.PACKAGING || product.stockType === STOCK_TYPES.RAW ? 'high' : 'normal'
    }));
}

function getExpiringLotSummaries(lots) {
  return lots.filter((lot) => (
    (Number(lot.physicalQuantity ?? lot.currentQuantity) || 0) > 0
    && ['vencido', 'vence_hoy', 'vence_manana', 'por_vencer', 'sin_fecha'].includes(lot.computedStatus)
  ));
}

function getCheapestSuppliers(rows) {
  const byProduct = new Map();
  for (const row of rows) {
    const current = byProduct.get(row.productId);
    if (!current || row.min < current.min) byProduct.set(row.productId, row);
  }
  return [...byProduct.values()];
}

function getLotCode(lots, lotId) {
  return lots.find((lot) => lot.id === lotId)?.lotCode ?? '';
}

function averageGroups(rows, labelKey, valueKey) {
  const groups = new Map();
  for (const row of rows) {
    const key = row[labelKey] || 'sin datos';
    const values = groups.get(key) ?? [];
    values.push(Number(row[valueKey]) || 0);
    groups.set(key, values);
  }
  return [...groups.entries()].map(([label, values]) => ({
    label,
    average: average(values),
    count: values.length
  }));
}

function maxGroup(groups) {
  return groups.length ? groups.reduce((best, item) => item.average > best.average ? item : best, groups[0]) : null;
}

function minGroup(groups) {
  return groups.length ? groups.reduce((best, item) => item.average < best.average ? item : best, groups[0]) : null;
}

function maxPair(map, index) {
  const entries = [...map.entries()];
  if (entries.length === 0) return null;
  const [id, count] = entries.reduce((best, item) => item[1] > best[1] ? item : best, entries[0]);
  return {
    id,
    name: index[id]?.name ?? id,
    count
  };
}

function maxBy(rows, key) {
  return rows.length ? rows.reduce((best, item) => item[key] > best[key] ? item : best, rows[0]) : null;
}

function minBy(rows, key) {
  return rows.length ? rows.reduce((best, item) => item[key] < best[key] ? item : best, rows[0]) : null;
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value)));
  if (valid.length === 0) return 0;
  return valid.reduce((total, value) => total + Number(value), 0) / valid.length;
}

function orderDate(order) {
  return order.deliveryDate || order.orderDate || order.date || '';
}

function inDateRange(date, fromDate, toDate) {
  if (!date) return false;
  if (fromDate && date < fromDate) return false;
  if (toDate && date > toDate) return false;
  return true;
}

function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}

function toIndex(items = []) {
  return Object.fromEntries(items.map((item) => [item.id, item]));
}
