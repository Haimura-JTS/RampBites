export function calculateUnitCost(totalCost, quantity) {
  if (!isPositiveNumber(totalCost) || !isPositiveNumber(quantity)) return 0;
  return totalCost / quantity;
}

export function calculatePricePerKg(totalCost, grams) {
  if (!isPositiveNumber(totalCost) || !isPositiveNumber(grams)) return 0;
  return totalCost / (grams / 1000);
}

export function calculateYield(rawWeight, finalWeight) {
  if (!isPositiveNumber(rawWeight) || !isPositiveNumber(finalWeight)) return 0;
  return finalWeight / rawWeight;
}

export function calculateWaste(rawWeight, finalWeight) {
  if (!isPositiveNumber(rawWeight)) {
    return { grams: 0, percentage: 0 };
  }

  const grams = Math.max(rawWeight - Math.max(Number(finalWeight) || 0, 0), 0);
  return {
    grams,
    percentage: grams / rawWeight
  };
}

export function calculateFinalCostPerGram(totalCost, finalWeight) {
  if (!isPositiveNumber(totalCost) || !isPositiveNumber(finalWeight)) return 0;
  return totalCost / finalWeight;
}

export function calculateFinalCostPer100g(totalCost, finalWeight) {
  return calculateFinalCostPerGram(totalCost, finalWeight) * 100;
}

export function calculateRecipeCost(recipe, products, options = {}) {
  return calculateRecipeCostBreakdown(recipe, products, options).totalCost;
}

export function calculateRecipeCostBreakdown(recipe, products, options = {}) {
  const productIndex = toProductIndex(products);
  const effectiveIngredients = getEffectiveRecipeIngredients(recipe, options);
  const rows = effectiveIngredients.map((ingredient) => {
    const product = productIndex[ingredient.productId];
    const unitCost = getProductUnitCost(product);
    const quantity = Number(ingredient.quantity) || 0;
    const cost = quantity * unitCost;
    return {
      id: getIngredientId(ingredient),
      productId: ingredient.productId,
      productName: product?.name ?? ingredient.productId,
      product,
      quantity,
      unit: ingredient.unit ?? product?.baseUnit ?? '',
      group: ingredient.group ?? ingredient.role ?? 'otro',
      required: isRequiredIngredient(ingredient),
      optional: Boolean(ingredient.optional),
      extraAvailable: Boolean(ingredient.extraAvailable),
      unitCost,
      cost,
      costSource: product?.costSource ?? 'none',
      missingCost: unitCost <= 0,
      allergens: product?.allergens ?? []
    };
  });

  const groupTotals = rows.reduce((groups, row) => {
    groups[row.group] = (groups[row.group] ?? 0) + row.cost;
    return groups;
  }, {});
  const allergens = [...new Set([
    ...(recipe?.allergens ?? []),
    ...rows.flatMap((row) => row.allergens)
  ])].filter(Boolean);

  return {
    rows,
    groupTotals,
    totalCost: rows.reduce((total, row) => total + row.cost, 0),
    allergens,
    missingCostIngredients: rows.filter((row) => row.missingCost)
  };
}

export function calculateRecipeFinancials(recipe, products, settings = {}, options = {}) {
  const breakdown = calculateRecipeCostBreakdown(recipe, products, options);
  const salePrice = getRecipeSalePrice(recipe, settings);
  const multipliers = getRecipeMultipliers(recipe, settings);
  const suggestedPrices = calculateSuggestedPrices(breakdown.totalCost, multipliers);
  const targetMargin = Number(recipe?.targetMargin);
  const targetMarginPrice = targetMargin > 0 && targetMargin < 1
    ? breakdown.totalCost / (1 - targetMargin)
    : null;
  if (targetMarginPrice !== null) suggestedPrices.targetMargin = targetMarginPrice;
  const grossProfit = salePrice - breakdown.totalCost;
  const marginPercentage = salePrice > 0 ? grossProfit / salePrice : 0;
  const priceStatus = getPriceAlertStatus(salePrice, suggestedPrices);

  return {
    ...breakdown,
    salePrice,
    suggestedPrices,
    grossProfit,
    marginPercentage,
    targetMargin: targetMarginPrice === null ? null : targetMargin,
    targetMarginPrice,
    meetsTargetMargin: targetMarginPrice === null ? null : salePrice >= targetMarginPrice,
    priceStatus
  };
}

export function calculatePossibleUnits(recipe, stock, options = {}) {
  const ingredients = getEffectiveRecipeIngredients(recipe, options);
  if (ingredients.length === 0) return 0;

  const possibleByIngredient = ingredients.map((ingredient) => {
    const available = Number(stock?.[ingredient.productId] ?? 0);
    const required = Number(ingredient.quantity) || 0;
    if (required <= 0) return 0;
    return Math.floor(available / required);
  });

  return Math.max(Math.min(...possibleByIngredient), 0);
}

export function calculateLimitingIngredient(recipe, stock, options = {}) {
  const ingredients = getEffectiveRecipeIngredients(recipe, options);
  let limitingIngredient = null;
  let minimumPossible = Infinity;

  for (const ingredient of ingredients) {
    const available = Number(stock?.[ingredient.productId] ?? 0);
    const required = Number(ingredient.quantity) || 0;
    const possible = required > 0 ? Math.floor(available / required) : 0;

    if (possible < minimumPossible) {
      minimumPossible = possible;
      limitingIngredient = {
        productId: ingredient.productId,
        possible,
        required,
        available
      };
    }
  }

  return limitingIngredient;
}

export function calculateRecipeSimulation(recipe, stock, products, desiredUnits = 1, settings = {}, options = {}) {
  const units = Math.max(Number(desiredUnits) || 0, 0);
  const financials = calculateRecipeFinancials(recipe, products, settings, options);
  const ingredients = financials.rows.map((row) => {
    const available = Number(stock?.[row.productId] ?? 0);
    const requiredTotal = row.quantity * units;
    return {
      ...row,
      available,
      requiredTotal,
      shortage: Math.max(requiredTotal - available, 0),
      remaining: Math.max(available - requiredTotal, 0),
      possibleUnits: row.quantity > 0 ? Math.floor(available / row.quantity) : 0
    };
  });
  const possibleUnits = ingredients.length === 0
    ? 0
    : Math.max(Math.min(...ingredients.map((ingredient) => ingredient.possibleUnits)), 0);
  const limitingIngredient = ingredients.reduce((limiting, ingredient) => {
    if (!limiting || ingredient.possibleUnits < limiting.possibleUnits) return ingredient;
    return limiting;
  }, null);
  const totalProductionCost = financials.totalCost * units;
  const expectedRevenue = financials.salePrice * units;
  const expectedGrossProfit = expectedRevenue - totalProductionCost;

  return {
    recipe,
    units,
    possibleUnits,
    limitingIngredient,
    ingredients,
    unitCost: financials.totalCost,
    salePrice: financials.salePrice,
    totalProductionCost,
    expectedRevenue,
    expectedGrossProfit,
    expectedMarginPercentage: expectedRevenue > 0 ? expectedGrossProfit / expectedRevenue : 0,
    priceStatus: financials.priceStatus,
    suggestedPrices: financials.suggestedPrices,
    allergens: financials.allergens
  };
}

export function calculateOrderTotals(order = {}, recipes = [], products = [], settings = {}) {
  const recipeIndex = toRecipeIndex(recipes);
  const items = (order.items ?? []).map((item) => {
    const recipe = recipeIndex[item.recipeId];
    const quantity = Math.max(Number(item.quantity) || 0, 0);
    const modifiers = normalizeOrderItemModifiers(item);
    const financials = recipe
      ? calculateRecipeFinancials(recipe, products, settings, modifiers)
      : emptyRecipeFinancials();
    const unitCost = isFiniteNumber(item.unitCost) && Number(item.unitCost) > 0
      ? Number(item.unitCost)
      : financials.totalCost;
    const unitPrice = isFiniteNumber(item.unitPrice)
      ? Number(item.unitPrice)
      : financials.salePrice;
    const lineCost = unitCost * quantity;
    const lineTotal = unitPrice * quantity;

    return {
      ...item,
      recipe,
      recipeName: recipe?.name ?? item.recipeId ?? 'Receta no encontrada',
      quantity,
      unitCost,
      unitPrice,
      lineCost,
      lineTotal,
      grossProfit: lineTotal - lineCost,
      marginPercentage: lineTotal > 0 ? (lineTotal - lineCost) / lineTotal : 0,
      allergens: financials.allergens ?? [],
      priceStatus: financials.priceStatus,
      missingCostIngredients: financials.missingCostIngredients ?? []
    };
  });
  const subtotal = roundMoney(items.reduce((total, item) => total + item.lineTotal, 0));
  const discount = Math.max(Number(order.discount) || 0, 0);
  const total = roundMoney(Math.max(subtotal - discount, 0));
  const estimatedCost = roundMoney(items.reduce((totalCost, item) => totalCost + item.lineCost, 0));
  const estimatedProfit = roundMoney(total - estimatedCost);

  return {
    items,
    subtotal,
    discount,
    total,
    estimatedCost,
    estimatedProfit,
    marginPercentage: total > 0 ? estimatedProfit / total : 0,
    allergens: [...new Set(items.flatMap((item) => item.allergens ?? []))].filter(Boolean),
    missingCostIngredients: items.flatMap((item) => item.missingCostIngredients ?? [])
  };
}

export function calculateOrderIngredientNeeds(order = {}, recipes = [], products = []) {
  const recipeIndex = toRecipeIndex(recipes);
  const productIndex = toProductIndex(products);
  const grouped = new Map();

  for (const item of order.items ?? []) {
    const recipe = recipeIndex[item.recipeId];
    if (!recipe) continue;
    const quantity = Math.max(Number(item.quantity) || 0, 0);
    const modifiers = normalizeOrderItemModifiers(item);

    for (const ingredient of getEffectiveRecipeIngredients(recipe, modifiers)) {
      const product = productIndex[ingredient.productId];
      const neededQuantity = (Number(ingredient.quantity) || 0) * quantity;
      if (neededQuantity <= 0) continue;

      const existing = grouped.get(ingredient.productId) ?? {
        productId: ingredient.productId,
        productName: product?.name ?? ingredient.productId,
        unit: ingredient.unit ?? product?.baseUnit ?? '',
        group: ingredient.group ?? 'otro',
        quantity: 0,
        unitCost: getProductUnitCost(product),
        cost: 0
      };
      existing.quantity += neededQuantity;
      existing.cost += neededQuantity * existing.unitCost;
      grouped.set(ingredient.productId, existing);
    }
  }

  return [...grouped.values()];
}

export function calculateStockAvailability(needs = [], stock = {}, products = []) {
  const productIndex = toProductIndex(products);
  return needs.map((need) => {
    const product = productIndex[need.productId];
    const available = Number(stock?.[need.productId] ?? 0);
    const quantity = Number(need.quantity) || 0;
    return {
      ...need,
      product,
      productName: product?.name ?? need.productName ?? need.productId,
      available,
      shortage: Math.max(quantity - available, 0),
      remaining: Math.max(available - quantity, 0),
      possibleUnits: quantity > 0 ? Math.floor(available / quantity) : 0
    };
  });
}

export function calculateOrderPlanning(orders = [], recipes = [], products = [], stock = {}, settings = {}, options = {}) {
  const fromDate = options.fromDate ?? null;
  const toDate = options.toDate ?? null;
  const includedStatuses = new Set(options.statuses ?? ['pendiente', 'confirmado', 'en_produccion', 'listo']);
  const plannedOrders = orders.filter((order) => {
    if (includedStatuses.size > 0 && !includedStatuses.has(order.status)) return false;
    const date = order.deliveryDate || order.orderDate || order.date || '';
    if (fromDate && date < fromDate) return false;
    if (toDate && date > toDate) return false;
    return true;
  });
  const totalsByRecipe = new Map();
  const planningOrder = { items: [] };
  let expectedRevenue = 0;
  let estimatedCost = 0;

  for (const order of plannedOrders) {
    const orderTotals = calculateOrderTotals(order, recipes, products, settings);
    expectedRevenue += orderTotals.total;
    estimatedCost += orderTotals.estimatedCost;

    if (!order.stockReserved || options.includeReservedNeeds) {
      for (const item of order.items ?? []) {
        planningOrder.items.push(item);
      }
    }

    for (const item of order.items ?? []) {
      const current = totalsByRecipe.get(item.recipeId) ?? 0;
      totalsByRecipe.set(item.recipeId, current + (Number(item.quantity) || 0));
    }
  }

  const needs = calculateOrderIngredientNeeds(planningOrder, recipes, products);
  const availability = calculateStockAvailability(needs, stock, products);

  return {
    orders: plannedOrders,
    totalsByRecipe: [...totalsByRecipe.entries()].map(([recipeId, quantity]) => ({
      recipeId,
      quantity,
      recipeName: recipes.find((recipe) => recipe.id === recipeId)?.name ?? recipeId
    })),
    needs,
    availability,
    missingItems: availability.filter((item) => item.shortage > 0),
    totalUnits: [...totalsByRecipe.values()].reduce((total, quantity) => total + quantity, 0),
    expectedRevenue: roundMoney(expectedRevenue),
    estimatedCost: roundMoney(estimatedCost),
    estimatedProfit: roundMoney(expectedRevenue - estimatedCost)
  };
}

export function calculateShoppingList(orders = [], recipes = [], products = [], stock = {}, suppliers = [], priceHistory = [], settings = {}, options = {}) {
  const planning = calculateOrderPlanning(orders, recipes, products, stock, settings, options);
  const supplierIndex = Object.fromEntries(suppliers.map((supplier) => [supplier.id, supplier]));
  const productIndex = toProductIndex(products);

  return planning.missingItems.map((item) => {
    const product = productIndex[item.productId];
    const latestPrice = getLatestPriceHistory(item.productId, priceHistory);
    const supplierId = product?.preferredSupplierId || latestPrice?.supplierId || '';
    return {
      productId: item.productId,
      productName: item.productName,
      unit: item.unit,
      neededQuantity: item.quantity,
      stockQuantity: item.available,
      missingQuantity: item.shortage,
      supplierId,
      supplierName: supplierIndex[supplierId]?.name ?? 'Proveedor pendiente',
      lastUnitCost: latestPrice?.unitCost ?? getProductUnitCost(product),
      lastPriceDate: latestPrice?.date ?? ''
    };
  });
}

export function calculateSuggestedPrices(cost, multipliers = {}) {
  const normalizedCost = Number(cost) || 0;
  const minimum = Number(multipliers.minimum ?? multipliers.MINIMUM ?? 2);
  const healthy = Number(multipliers.healthy ?? multipliers.HEALTHY ?? 2.5);
  const premium = Number(multipliers.premium ?? multipliers.PREMIUM ?? 3);

  return {
    minimum: normalizedCost * minimum,
    healthy: normalizedCost * healthy,
    premium: normalizedCost * premium
  };
}

export function getPriceAlertStatus(salePrice, suggestedPrices) {
  const price = Number(salePrice) || 0;
  if (price < (Number(suggestedPrices.minimum) || 0)) {
    return {
      key: 'no_rentable',
      level: 'danger',
      label: 'No rentable',
      message: 'Precio actual por debajo del minimo recomendado.'
    };
  }

  if (price < (Number(suggestedPrices.healthy) || 0)) {
    return {
      key: 'margen_ajustado',
      level: 'warning',
      label: 'Margen ajustado',
      message: 'Cubre minimo, pero no llega al margen sano.'
    };
  }

  return {
    key: 'margen_saludable',
    level: 'success',
    label: 'Margen saludable',
    message: 'Precio actual iguala o supera el margen sano.'
  };
}

export function calculateStockByProduct(stockMovements = []) {
  return stockMovements.reduce((stock, movement) => {
    const productId = movement.productId;
    if (!productId) return stock;

    const direction = Number(movement.direction) || 1;
    const quantity = Number(movement.quantity) || 0;
    stock[productId] = (stock[productId] ?? 0) + direction * quantity;
    return stock;
  }, {});
}

export function calculateStockByLot(stockMovements = []) {
  return stockMovements.reduce((stock, movement) => {
    const direction = Number(movement.direction) || 1;
    const quantity = Number(movement.quantity) || 0;

    if (direction > 0) {
      const lotId = movement.toLotId ?? movement.lotId;
      if (lotId) stock[lotId] = (stock[lotId] ?? 0) + quantity;
      return stock;
    }

    const lotId = movement.fromLotId ?? movement.lotId;
    if (lotId) stock[lotId] = (stock[lotId] ?? 0) - quantity;
    return stock;
  }, {});
}

export function calculateStockValue(products = [], stock = {}) {
  const productIndex = toProductIndex(products);

  return Object.entries(stock).reduce((total, [productId, quantity]) => {
    const product = productIndex[productId];
    return total + Math.max(Number(quantity) || 0, 0) * getProductUnitCost(product);
  }, 0);
}

export function calculateLotSummaries(lots = [], stockMovements = [], products = []) {
  const stockByLot = calculateStockByLot(stockMovements);
  const productIndex = toProductIndex(products);

  return lots.map((lot) => {
    const currentQuantity = stockByLot[lot.id] ?? 0;
    const product = productIndex[lot.productId];
    return {
      ...lot,
      product,
      currentQuantity,
      stockValue: Math.max(currentQuantity, 0) * (Number(lot.unitCost) || 0),
      computedStatus: getLotComputedStatus(lot, currentQuantity)
    };
  });
}

export function getLotComputedStatus(lot, currentQuantity, today = new Date()) {
  if (lot.status === 'descartado' || lot.status === 'discarded') return 'descartado';
  if ((Number(currentQuantity) || 0) <= 0) return 'agotado';
  if (lot.location === 'congelador') return 'congelado';
  if (!lot.expiresAt) return 'sin_fecha';

  const start = startOfDay(today);
  const expiresAt = startOfDay(new Date(`${lot.expiresAt}T00:00:00`));
  const diffDays = Math.round((expiresAt - start) / 86400000);
  if (diffDays < 0) return 'vencido';
  if (diffDays === 0) return 'vence_hoy';
  if (diffDays === 1) return 'vence_manana';
  if (diffDays <= 2) return 'por_vencer';
  return 'ok';
}

export function addDays(dateString, days) {
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + Number(days || 0));
  return date.toISOString().slice(0, 10);
}

export function formatCurrency(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR'
  }).format(Number(value) || 0);
}

export function formatWeight(value) {
  const grams = Number(value) || 0;
  if (Math.abs(grams) >= 1000) {
    return `${formatNumber(grams / 1000)} kg`;
  }

  return `${formatNumber(grams)} g`;
}

export function formatPercent(value) {
  return new Intl.NumberFormat('es-ES', {
    style: 'percent',
    minimumFractionDigits: 1,
    maximumFractionDigits: 1
  }).format(Number(value) || 0).replace(/\u00a0/g, ' ');
}

export function formatNumber(value, maximumFractionDigits = 2) {
  return new Intl.NumberFormat('es-ES', {
    maximumFractionDigits
  }).format(Number(value) || 0);
}

function toProductIndex(products) {
  if (!products) return {};
  if (Array.isArray(products)) {
    return Object.fromEntries(products.map((product) => [product.id, product]));
  }

  return products;
}

function toRecipeIndex(recipes) {
  if (!recipes) return {};
  if (Array.isArray(recipes)) {
    return Object.fromEntries(recipes.map((recipe) => [recipe.id, recipe]));
  }

  return recipes;
}

export function getProductUnitCost(product) {
  if (!product) return 0;
  if (Number.isFinite(product.currentUnitCost)) return product.currentUnitCost;
  if (Number.isFinite(product.estimatedUnitCost)) return product.estimatedUnitCost;
  if (Number.isFinite(product.unitCost)) return product.unitCost;
  return 0;
}

function normalizeOrderItemModifiers(item = {}) {
  return {
    extraIngredientIds: item.extraIngredientIds ?? item.extras ?? [],
    excludedIngredientIds: item.excludedIngredientIds ?? item.sinIngredientes ?? item.excluded ?? []
  };
}

function emptyRecipeFinancials() {
  return {
    totalCost: 0,
    salePrice: 0,
    allergens: [],
    missingCostIngredients: [],
    priceStatus: null
  };
}

function getEffectiveRecipeIngredients(recipe, options = {}) {
  const extraIds = new Set(options.extraIngredientIds ?? options.extras ?? []);
  const excludedIds = new Set(options.excludedIngredientIds ?? options.excluded ?? []);

  return (recipe?.ingredients ?? []).filter((ingredient, index) => {
    const ingredientId = getIngredientId(ingredient, index);
    if (excludedIds.has(ingredientId)) return false;
    if (ingredient.optional || ingredient.extraAvailable) return extraIds.has(ingredientId);
    return isRequiredIngredient(ingredient);
  });
}

function getIngredientId(ingredient, index = 0) {
  return ingredient.id ?? `${ingredient.productId}:${ingredient.group ?? ingredient.role ?? 'item'}:${index}`;
}

function isRequiredIngredient(ingredient) {
  if (ingredient.required === false) return false;
  if (ingredient.obligatory === false) return false;
  return !ingredient.optional;
}

function getRecipeSalePrice(recipe, settings = {}) {
  const value = recipe?.currentSalePrice ?? recipe?.precioVentaActual ?? recipe?.targetPrice ?? settings.targetBasePrice ?? 0;
  return Number(value) || 0;
}

function getRecipeMultipliers(recipe, settings = {}) {
  const recipeMultiplier = Number(recipe?.priceMultiplier);
  return {
    ...(settings.priceMultipliers ?? {}),
    ...(Number.isFinite(recipeMultiplier) && recipeMultiplier > 0 ? { healthy: recipeMultiplier } : {})
  };
}

function isPositiveNumber(value) {
  return Number.isFinite(Number(value)) && Number(value) > 0;
}

function isFiniteNumber(value) {
  return Number.isFinite(Number(value));
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function getLatestPriceHistory(productId, priceHistory = []) {
  return priceHistory
    .filter((entry) => entry.productId === productId)
    .sort((a, b) => String(a.date).localeCompare(String(b.date)))
    .at(-1);
}

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
