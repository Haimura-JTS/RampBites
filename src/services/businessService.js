import {
  CLIENT_CHANNELS,
  DEFAULT_SETTINGS,
  MOVEMENT_TYPES,
  ORDER_STATUS,
  PAYMENT_METHODS,
  PRODUCT_STATUS,
  PRODUCTION_STATUS,
  RECIPE_INGREDIENT_GROUPS,
  RECIPE_STATUS,
  STORAGE_LOCATIONS,
  UNITS
} from '../constants.js';
import {
  addDays,
  calculateFinalCostPer100g,
  calculateFinalCostPerGram,
  calculateOrderIngredientNeeds,
  calculateOrderTotals,
  calculatePricePerKg,
  calculateReservedStockByLot,
  calculateStockByProduct,
  calculateStockByLot,
  calculateUnitCost,
  calculateWaste,
  calculateYield
} from '../calculations.js';
import { generateId } from '../storage.js';
import { validateClient, validateOrder, validateProduct, validatePurchase, validateRecipe, validateSupplier, validateUnitCompatibility } from '../validators.js';

export function saveProduct(data, input) {
  const validation = validateProduct(input);
  if (!validation.valid) return failure(validation.errors);

  const now = new Date().toISOString();
  const existing = data.products.find((product) => product.id === input.id);
  const product = {
    ...(existing ?? {}),
    id: input.id || generateId('prod'),
    name: input.name.trim(),
    category: input.category,
    subcategory: input.subcategory?.trim() ?? '',
    baseUnit: input.baseUnit,
    stockMinimum: Number(input.stockMinimum) || 0,
    currentUnitCost: toNullableNumber(input.currentUnitCost),
    estimatedUnitCost: toNullableNumber(input.estimatedUnitCost),
    costSource: input.currentUnitCost ? 'real' : (input.estimatedUnitCost ? 'estimated' : 'none'),
    preferredSupplierId: input.preferredSupplierId ?? '',
    location: input.location || STORAGE_LOCATIONS.PANTRY,
    requiresCold: Boolean(input.requiresCold),
    expirationDate: input.expirationDate || null,
    openedAt: input.openedAt || null,
    allergens: parseList(input.allergens),
    notes: input.notes?.trim() ?? '',
    active: input.active ?? true,
    status: input.active === false ? PRODUCT_STATUS.ARCHIVED : PRODUCT_STATUS.ACTIVE,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  upsertInPlace(data.products, product);
  touch(data);
  return success(data, product);
}

export function deactivateProduct(data, productId) {
  const product = data.products.find((item) => item.id === productId);
  if (!product) return failure(['Producto no encontrado.']);
  product.active = false;
  product.status = PRODUCT_STATUS.ARCHIVED;
  product.updatedAt = new Date().toISOString();
  touch(data);
  return success(data, product);
}

export function saveSupplier(data, input) {
  const validation = validateSupplier(input);
  if (!validation.valid) return failure(validation.errors);

  const now = new Date().toISOString();
  const existing = data.suppliers.find((supplier) => supplier.id === input.id);
  const supplier = {
    ...(existing ?? {}),
    id: input.id || generateId('sup'),
    name: input.name.trim(),
    type: input.type,
    address: input.address?.trim() ?? '',
    city: input.city?.trim() ?? '',
    phone: input.phone?.trim() ?? '',
    whatsapp: input.whatsapp?.trim() ?? '',
    email: input.email?.trim() ?? '',
    schedule: input.schedule?.trim() ?? '',
    perceivedQuality: Number(input.perceivedQuality) || 0,
    perceivedPrice: input.perceivedPrice || 'medio',
    usualProducts: parseList(input.usualProducts),
    notes: input.notes?.trim() ?? '',
    active: input.active ?? true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  upsertInPlace(data.suppliers, supplier);
  touch(data);
  return success(data, supplier);
}

export function deactivateSupplier(data, supplierId) {
  const supplier = data.suppliers.find((item) => item.id === supplierId);
  if (!supplier) return failure(['Proveedor no encontrado.']);
  supplier.active = false;
  supplier.updatedAt = new Date().toISOString();
  touch(data);
  return success(data, supplier);
}

export function savePurchase(data, input) {
  const normalizedItems = input.items.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    totalPrice: Number(item.totalPrice),
    unitCost: calculateUnitCost(Number(item.totalPrice), Number(item.quantity))
  }));
  const purchaseInput = { ...input, items: normalizedItems };
  const validations = [validatePurchase(purchaseInput)];

  for (const item of normalizedItems) {
    const product = data.products.find((entry) => entry.id === item.productId);
    validations.push(validateUnitCompatibility(item, product));
  }

  const errors = validations.flatMap((validation) => validation.errors);
  if (errors.length > 0) return failure(errors);

  const now = new Date().toISOString();
  const purchaseId = input.id || generateId('purchase');
  const calculatedTotal = roundMoney(normalizedItems.reduce((total, item) => total + item.totalPrice, 0));
  const ticketTotal = Number.isFinite(Number(input.ticketTotal)) ? Number(input.ticketTotal) : calculatedTotal;
  const purchase = {
    id: purchaseId,
    date: input.date,
    supplierId: input.supplierId,
    items: normalizedItems.map((item) => ({
      id: item.id || generateId('purchase-item'),
      productId: item.productId,
      quantity: item.quantity,
      unit: item.unit,
      totalPrice: item.totalPrice,
      unitCost: item.unitCost,
      expirationDate: item.expirationDate || null,
      destinationLocation: item.destinationLocation || '',
      notes: item.notes?.trim() ?? ''
    })),
    calculatedTotal,
    ticketTotal,
    difference: roundMoney(ticketTotal - calculatedTotal),
    ticketReference: input.ticketReference?.trim() ?? '',
    notes: input.notes?.trim() ?? '',
    createdAt: now,
    updatedAt: now
  };

  data.purchases.push(purchase);

  for (const item of purchase.items) {
    const product = data.products.find((entry) => entry.id === item.productId);
    product.currentUnitCost = item.unitCost;
    product.costSource = 'real';
    product.preferredSupplierId = purchase.supplierId;
    product.updatedAt = now;

    const lotId = generateId('lot');
    const lot = {
      id: lotId,
      lotCode: createPurchaseLotCode(product, purchase.date),
      productId: product.id,
      initialQuantity: item.quantity,
      unit: item.unit,
      unitCost: item.unitCost,
      sourceType: 'purchase',
      sourceId: purchase.id,
      location: item.destinationLocation || product.location || STORAGE_LOCATIONS.PANTRY,
      cookedAt: null,
      expiresAt: item.expirationDate || product.expirationDate || null,
      status: 'active',
      notes: item.notes,
      createdAt: now,
      updatedAt: now
    };

    data.lots.push(lot);
    data.stockMovements.push({
      id: generateId('mov'),
      productId: product.id,
      type: MOVEMENT_TYPES.PURCHASE,
      quantity: item.quantity,
      unit: item.unit,
      direction: 1,
      lotId,
      fromLotId: '',
      toLotId: lotId,
      referenceId: purchase.id,
      referenceType: 'purchase',
      date: `${purchase.date}T12:00:00.000Z`,
      notes: item.notes
    });

    data.priceHistory.push(createPriceHistoryEntry({
      productId: product.id,
      supplierId: purchase.supplierId,
      purchaseId: purchase.id,
      purchaseItemId: item.id,
      date: purchase.date,
      quantity: item.quantity,
      unit: item.unit,
      totalPrice: item.totalPrice,
      unitCost: item.unitCost,
      now
    }));
  }

  touch(data);
  return success(data, purchase);
}

export function createStockMovement(data, input) {
  const product = data.products.find((item) => item.id === input.productId);
  if (!product) return failure(['Producto no encontrado.']);
  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return failure(['La cantidad debe ser mayor que 0.']);

  const type = input.type;
  const direction = type === MOVEMENT_TYPES.ADJUSTMENT ? Number(input.direction || 1) : -1;
  const lot = input.lotId ? data.lots.find((item) => item.id === input.lotId) : null;
  if (input.lotId && !lot) return failure(['Lote no encontrado.']);
  if (lot && lot.productId !== product.id) return failure([`El lote ${lot.lotCode} no pertenece a ${product.name}.`]);
  if (direction < 0) {
    const stockByLot = calculateStockByLot(data.stockMovements);
    const stockByProduct = calculateStockByProduct(data.stockMovements);
    const available = lot ? (stockByLot[lot.id] ?? 0) : (stockByProduct[product.id] ?? 0);
    if (available < quantity) return failure([`Stock insuficiente para ${product.name}. Disponible: ${available} ${product.baseUnit}.`]);
  }

  const now = new Date().toISOString();
  data.stockMovements.push({
    id: generateId('mov'),
    productId: product.id,
    type,
    quantity,
    unit: product.baseUnit,
    direction,
    lotId: input.lotId ?? '',
    fromLotId: direction < 0 ? (input.lotId ?? '') : '',
    toLotId: direction > 0 ? (input.lotId ?? '') : '',
    referenceId: input.referenceId ?? '',
    referenceType: input.referenceType ?? 'manual',
    date: now,
    notes: input.notes?.trim() ?? ''
  });

  touch(data);
  return success(data, data.stockMovements.at(-1));
}

export function getPriceHistoryStats(data) {
  const groups = new Map();
  for (const entry of data.priceHistory) {
    const key = `${entry.productId}::${entry.supplierId}`;
    const group = groups.get(key) ?? [];
    group.push(entry);
    groups.set(key, group);
  }

  return [...groups.entries()].map(([key, entries]) => {
    const [productId, supplierId] = key.split('::');
    const sorted = [...entries].sort((a, b) => String(a.date).localeCompare(String(b.date)));
    const prices = sorted.map((entry) => Number(entry.normalizedPrice) || 0);
    const first = sorted[0];
    const latest = sorted.at(-1);
    const variation = first?.normalizedPrice ? (latest.normalizedPrice - first.normalizedPrice) / first.normalizedPrice : 0;
    return {
      productId,
      supplierId,
      min: Math.min(...prices),
      max: Math.max(...prices),
      latest: latest?.normalizedPrice ?? 0,
      latestDate: latest?.date ?? '',
      normalizedUnit: latest?.normalizedUnit ?? '',
      variation,
      count: entries.length
    };
  });
}

export function saveProductionBatch(data, input) {
  const rawLot = data.lots.find((lot) => lot.id === input.rawLotId);
  if (!rawLot) return failure(['Selecciona un lote de carne cruda.']);

  const rawProduct = data.products.find((product) => product.id === rawLot.productId);
  const resultProduct = data.products.find((product) => product.id === input.resultProductId);
  if (!rawProduct) return failure(['Producto crudo no encontrado.']);
  if (!resultProduct) return failure(['Producto resultado no encontrado.']);

  const rawWeightUsed = Number(input.rawWeightUsed);
  const finalWeight = Number(input.finalWeight);
  if (!Number.isFinite(rawWeightUsed) || rawWeightUsed <= 0) return failure(['El peso crudo usado debe ser mayor que 0.']);
  if (!Number.isFinite(finalWeight) || finalWeight <= 0) return failure(['El peso final hidratado debe ser mayor que 0.']);

  const stockByLot = calculateStockByLot(data.stockMovements);
  const stockByProduct = calculateStockByProduct(data.stockMovements);
  if ((stockByLot[rawLot.id] ?? 0) < rawWeightUsed) {
    return failure([`Stock insuficiente en lote ${rawLot.lotCode}.`]);
  }

  const inputs = normalizeProductionInputs(input.inputs ?? [], data);
  const inputErrors = inputs.filter((item) => item.error).map((item) => item.error);
  if (inputErrors.length > 0) return failure(inputErrors);

  for (const item of inputs) {
    if (item.lotId && (stockByLot[item.lotId] ?? 0) < item.quantity) {
      return failure([`Stock insuficiente en lote de insumo ${item.lotCode}.`]);
    }
    if (!item.lotId && (stockByProduct[item.productId] ?? 0) < item.quantity) {
      return failure([`Stock insuficiente para insumo ${item.productId}.`]);
    }
  }

  const now = new Date().toISOString();
  const date = input.date || new Date().toISOString().slice(0, 10);
  const batchId = input.id || generateId('batch');
  const meatCost = Number(input.meatCost) || rawWeightUsed * (Number(rawLot.unitCost) || Number(rawProduct.currentUnitCost) || 0);
  const inputCost = inputs.reduce((total, item) => total + item.cost, 0);
  const totalCost = meatCost + inputCost;
  const yieldRatio = calculateYield(rawWeightUsed, finalWeight);
  const waste = calculateWaste(rawWeightUsed, finalWeight);
  const finalCostPerGram = calculateFinalCostPerGram(totalCost, finalWeight);
  const finalCostPer100g = calculateFinalCostPer100g(totalCost, finalWeight);
  const expiresAt = input.expiresAt || getSuggestedExpiry(date, input.location, data.settings);
  const lotId = generateId('lot');
  const batchCode = input.batchCode || createBatchCode(input.type || rawProduct.subcategory || 'OTRO', date, data.productionBatches.length + 1);
  const durationMinutes = calculateDurationMinutes(input.startTime, input.endTime);

  const batch = {
    id: batchId,
    batchCode,
    type: input.type || rawProduct.subcategory || 'otro',
    status: PRODUCTION_STATUS.FINISHED,
    date,
    startTime: input.startTime || '',
    endTime: input.endTime || '',
    durationMinutes,
    method: input.method || 'olla',
    rawProductId: rawProduct.id,
    rawLotId: rawLot.id,
    rawWeightUsed,
    meatCost,
    inputs: inputs.map(({ error, lotCode, ...item }) => item),
    liquidInitialMl: Number(input.liquidInitialMl) || 0,
    brothTotalMl: Number(input.brothTotalMl) || 0,
    brothLeftMl: Number(input.brothLeftMl) || 0,
    heatLevel: input.heatLevel || '',
    drainedWeight: Number(input.drainedWeight) || null,
    finalWeight,
    yieldRatio,
    wasteGrams: waste.grams,
    wastePercentage: waste.percentage,
    totalCost,
    finalCostPerGram,
    finalCostPer100g,
    resultProductId: resultProduct.id,
    resultLotId: lotId,
    location: input.location || STORAGE_LOCATIONS.FRIDGE,
    expiresAt,
    frozen: input.location === STORAGE_LOCATIONS.FREEZER,
    notes: input.notes?.trim() ?? '',
    createdAt: now,
    updatedAt: now
  };

  data.productionBatches.push(batch);
  data.lots.push({
    id: lotId,
    lotCode: batchCode,
    productId: resultProduct.id,
    initialQuantity: finalWeight,
    unit: resultProduct.baseUnit,
    unitCost: finalCostPerGram,
    sourceType: 'production',
    sourceId: batch.id,
    location: batch.location,
    cookedAt: date,
    expiresAt,
    status: 'active',
    notes: batch.notes,
    createdAt: now,
    updatedAt: now
  });

  data.stockMovements.push(createMovement({
    productId: rawProduct.id,
    type: MOVEMENT_TYPES.PRODUCTION_CONSUME,
    quantity: rawWeightUsed,
    unit: rawProduct.baseUnit,
    direction: -1,
    fromLotId: rawLot.id,
    referenceId: batch.id,
    referenceType: 'production',
    date: now,
    notes: `Consumo carne cruda ${batchCode}`
  }));

  for (const item of inputs) {
    data.stockMovements.push(createMovement({
      productId: item.productId,
      type: MOVEMENT_TYPES.PRODUCTION_CONSUME,
      quantity: item.quantity,
      unit: item.unit,
      direction: -1,
      fromLotId: item.lotId,
      referenceId: batch.id,
      referenceType: 'production',
      date: now,
      notes: `Insumo ${batchCode}`
    }));
  }

  data.stockMovements.push(createMovement({
    productId: resultProduct.id,
    type: MOVEMENT_TYPES.PRODUCTION_OUTPUT,
    quantity: finalWeight,
    unit: resultProduct.baseUnit,
    direction: 1,
    toLotId: lotId,
    referenceId: batch.id,
    referenceType: 'production',
    date: now,
    notes: `Resultado ${batchCode}`
  }));

  resultProduct.currentUnitCost = finalCostPerGram;
  resultProduct.costSource = 'real';
  resultProduct.updatedAt = now;
  touch(data);
  return success(data, batch);
}

export function completeProductionBatch(data, input) {
  const batch = data.productionBatches.find((item) => item.id === input.batchId);
  if (!batch) return failure(['Produccion pendiente no encontrada.']);
  if (batch.resultLotId) return failure(['Esta produccion ya tiene lote resultado.']);

  const resultProduct = data.products.find((product) => product.id === input.resultProductId);
  if (!resultProduct) return failure(['Producto resultado no encontrado.']);

  const finalWeight = Number(input.finalWeight);
  if (!Number.isFinite(finalWeight) || finalWeight <= 0) return failure(['El peso final hidratado debe ser mayor que 0.']);

  const now = new Date().toISOString();
  const date = input.date || batch.date || now.slice(0, 10);
  const totalCost = Number(input.totalCost) || Number(batch.totalCost) || Number(batch.meatCost) || 0;
  const yieldRatio = calculateYield(batch.rawWeightUsed, finalWeight);
  const waste = calculateWaste(batch.rawWeightUsed, finalWeight);
  const finalCostPerGram = calculateFinalCostPerGram(totalCost, finalWeight);
  const finalCostPer100g = calculateFinalCostPer100g(totalCost, finalWeight);
  const lotId = generateId('lot');
  const expiresAt = input.expiresAt || getSuggestedExpiry(date, input.location, data.settings);

  Object.assign(batch, {
    status: PRODUCTION_STATUS.FINISHED,
    endTime: input.endTime || batch.endTime || '',
    durationMinutes: calculateDurationMinutes(batch.startTime, input.endTime || batch.endTime),
    drainedWeight: Number(input.drainedWeight) || batch.drainedWeight || null,
    finalWeight,
    yieldRatio,
    wasteGrams: waste.grams,
    wastePercentage: waste.percentage,
    totalCost,
    finalCostPerGram,
    finalCostPer100g,
    resultProductId: resultProduct.id,
    resultLotId: lotId,
    location: input.location || STORAGE_LOCATIONS.FRIDGE,
    expiresAt,
    frozen: input.location === STORAGE_LOCATIONS.FREEZER,
    notes: [batch.notes, input.notes].filter(Boolean).join(' | '),
    updatedAt: now
  });

  data.lots.push({
    id: lotId,
    lotCode: batch.batchCode,
    productId: resultProduct.id,
    initialQuantity: finalWeight,
    unit: resultProduct.baseUnit,
    unitCost: finalCostPerGram,
    sourceType: 'production',
    sourceId: batch.id,
    location: batch.location,
    cookedAt: date,
    expiresAt,
    status: 'active',
    notes: batch.notes,
    createdAt: now,
    updatedAt: now
  });

  data.stockMovements.push(createMovement({
    productId: resultProduct.id,
    type: MOVEMENT_TYPES.PRODUCTION_OUTPUT,
    quantity: finalWeight,
    unit: resultProduct.baseUnit,
    direction: 1,
    toLotId: lotId,
    referenceId: batch.id,
    referenceType: 'production',
    date: now,
    notes: `Resultado ${batch.batchCode}`
  }));

  resultProduct.currentUnitCost = finalCostPerGram;
  resultProduct.costSource = 'real';
  resultProduct.updatedAt = now;
  touch(data);
  return success(data, batch);
}

export function flavorLot(data, input) {
  const sourceLot = data.lots.find((lot) => lot.id === input.sourceLotId);
  if (!sourceLot) return failure(['Selecciona lote neutro origen.']);

  const sourceProduct = data.products.find((product) => product.id === sourceLot.productId);
  const resultProduct = data.products.find((product) => product.id === input.resultProductId);
  if (!sourceProduct || !resultProduct) return failure(['Producto de origen o resultado no encontrado.']);

  const quantity = Number(input.quantity);
  if (!Number.isFinite(quantity) || quantity <= 0) return failure(['La cantidad a saborizar debe ser mayor que 0.']);

  const stockByLot = calculateStockByLot(data.stockMovements);
  const stockByProduct = calculateStockByProduct(data.stockMovements);
  if ((stockByLot[sourceLot.id] ?? 0) < quantity) return failure([`Stock insuficiente en ${sourceLot.lotCode}.`]);

  const flavorProduct = data.products.find((product) => product.id === input.flavorProductId);
  const flavorQuantity = Number(input.flavorQuantity) || 0;
  const flavorLot = input.flavorLotId ? data.lots.find((lot) => lot.id === input.flavorLotId) : null;
  if (flavorQuantity > 0 && !flavorProduct) return failure(['Selecciona producto de sabor.']);
  if (flavorQuantity > 0 && input.flavorLotId && !flavorLot) return failure(['Lote de sabor no encontrado.']);
  if (flavorQuantity > 0 && flavorLot && flavorLot.productId !== flavorProduct.id) {
    return failure([`El lote ${flavorLot.lotCode} no pertenece a ${flavorProduct.name}.`]);
  }
  if (flavorQuantity > 0 && flavorLot && (stockByLot[flavorLot.id] ?? 0) < flavorQuantity) {
    return failure([`Stock insuficiente en ${flavorLot.lotCode}.`]);
  }
  if (flavorQuantity > 0 && !flavorLot && (stockByProduct[flavorProduct.id] ?? 0) < flavorQuantity) {
    return failure([`Stock insuficiente para ${flavorProduct.name}.`]);
  }

  const now = new Date().toISOString();
  const date = input.date || now.slice(0, 10);
  const sourceCost = quantity * (Number(sourceLot.unitCost) || Number(sourceProduct.currentUnitCost) || 0);
  const flavorCost = flavorQuantity * (Number(flavorLot?.unitCost) || Number(flavorProduct?.currentUnitCost) || Number(flavorProduct?.estimatedUnitCost) || 0);
  const totalCost = sourceCost + flavorCost;
  const outputLotId = generateId('lot');
  const lotCode = createFlavorLotCode(resultProduct, date);
  const expiresAt = input.expiresAt || getSuggestedExpiry(date, input.location, data.settings);

  data.lots.push({
    id: outputLotId,
    lotCode,
    productId: resultProduct.id,
    initialQuantity: quantity,
    unit: resultProduct.baseUnit,
    unitCost: calculateFinalCostPerGram(totalCost, quantity),
    sourceType: 'flavoring',
    sourceId: sourceLot.id,
    location: input.location || sourceLot.location || STORAGE_LOCATIONS.FRIDGE,
    cookedAt: sourceLot.cookedAt || date,
    expiresAt,
    status: 'active',
    notes: input.notes?.trim() ?? '',
    createdAt: now,
    updatedAt: now
  });

  data.stockMovements.push(createMovement({
    productId: sourceProduct.id,
    type: MOVEMENT_TYPES.FLAVORING,
    quantity,
    unit: sourceProduct.baseUnit,
    direction: -1,
    fromLotId: sourceLot.id,
    referenceId: outputLotId,
    referenceType: 'flavoring',
    date: now,
    notes: `Saborizado a ${resultProduct.name}`
  }));

  if (flavorQuantity > 0 && flavorProduct) {
    data.stockMovements.push(createMovement({
      productId: flavorProduct.id,
      type: MOVEMENT_TYPES.FLAVORING,
      quantity: flavorQuantity,
      unit: flavorProduct.baseUnit,
      direction: -1,
      fromLotId: flavorLot?.id ?? '',
      referenceId: outputLotId,
      referenceType: 'flavoring',
      date: now,
      notes: `Sabor para ${resultProduct.name}`
    }));
  }

  data.stockMovements.push(createMovement({
    productId: resultProduct.id,
    type: MOVEMENT_TYPES.FLAVORING,
    quantity,
    unit: resultProduct.baseUnit,
    direction: 1,
    toLotId: outputLotId,
    referenceId: outputLotId,
    referenceType: 'flavoring',
    date: now,
    notes: `Lote saborizado ${lotCode}`
  }));

  resultProduct.currentUnitCost = calculateFinalCostPerGram(totalCost, quantity);
  resultProduct.costSource = 'real';
  resultProduct.updatedAt = now;
  touch(data);
  return success(data, data.lots.at(-1));
}

export function markLotDiscarded(data, lotId, notes = '') {
  const lot = data.lots.find((item) => item.id === lotId);
  if (!lot) return failure(['Lote no encontrado.']);

  const stockByLot = calculateStockByLot(data.stockMovements);
  const reservedByLot = calculateReservedStockByLot(data.stockMovements);
  if ((reservedByLot[lot.id] ?? 0) > 0) {
    return failure(['No se puede descartar un lote con stock reservado. Cancela o entrega los pedidos asociados antes.']);
  }

  const remaining = Math.max(stockByLot[lot.id] ?? 0, 0);
  const now = new Date().toISOString();
  if (remaining > 0) {
    data.stockMovements.push(createMovement({
      productId: lot.productId,
      type: MOVEMENT_TYPES.WASTE,
      quantity: remaining,
      unit: lot.unit,
      direction: -1,
      fromLotId: lot.id,
      referenceId: lot.id,
      referenceType: 'lot',
      date: now,
      notes: notes || 'Lote descartado'
    }));
  }

  lot.status = 'descartado';
  lot.updatedAt = now;
  touch(data);
  return success(data, lot);
}

export function saveRecipe(data, input) {
  const normalizedIngredients = normalizeRecipeIngredients(input.ingredients ?? []);
  const recipeInput = {
    ...input,
    ingredients: normalizedIngredients,
    status: input.status || RECIPE_STATUS.ACTIVE
  };
  const validations = [validateRecipe(recipeInput)];
  for (const ingredient of normalizedIngredients) {
    const product = data.products.find((item) => item.id === ingredient.productId);
    validations.push(validateUnitCompatibility(ingredient, product));
  }

  const errors = validations.flatMap((validation) => validation.errors);
  if (errors.length > 0) return failure(errors);

  const now = new Date().toISOString();
  const existing = data.recipes.find((recipe) => recipe.id === input.id);
  const recipe = {
    ...(existing ?? {}),
    id: input.id || generateId('recipe'),
    name: input.name.trim(),
    category: input.category,
    status: recipeInput.status,
    description: input.description?.trim() ?? '',
    currentSalePrice: toNullableNumber(input.currentSalePrice) ?? toNullableNumber(input.targetPrice) ?? 0,
    targetMargin: toNullableNumber(input.targetMargin) ?? 0,
    priceMultiplier: toNullableNumber(input.priceMultiplier) ?? null,
    allergens: parseList(input.allergens),
    ingredients: normalizedIngredients,
    estimatedFinalWeight: toNullableNumber(input.estimatedFinalWeight) ?? toNullableNumber(input.servingSizeG) ?? 0,
    notes: input.notes?.trim() ?? '',
    active: recipeInput.status !== RECIPE_STATUS.RETIRED,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  upsertInPlace(data.recipes, recipe);
  touch(data);
  return success(data, recipe);
}

export function duplicateRecipe(data, recipeId) {
  const recipe = data.recipes.find((item) => item.id === recipeId);
  if (!recipe) return failure(['Receta no encontrada.']);

  const now = new Date().toISOString();
  const copy = {
    ...recipe,
    id: generateId('recipe'),
    name: `${recipe.name} copia`,
    status: RECIPE_STATUS.TEST,
    active: true,
    ingredients: (recipe.ingredients ?? []).map((ingredient) => ({
      ...ingredient,
      id: generateId('recipe-ing')
    })),
    createdAt: now,
    updatedAt: now
  };

  data.recipes.push(copy);
  touch(data);
  return success(data, copy);
}

export function setRecipeStatus(data, recipeId, status) {
  const recipe = data.recipes.find((item) => item.id === recipeId);
  if (!recipe) return failure(['Receta no encontrada.']);
  if (!Object.values(RECIPE_STATUS).includes(status)) return failure(['Estado de receta no valido.']);

  recipe.status = status;
  recipe.active = status !== RECIPE_STATUS.RETIRED;
  recipe.updatedAt = new Date().toISOString();
  touch(data);
  return success(data, recipe);
}

export function saveClient(data, input) {
  const validation = validateClient(input);
  if (!validation.valid) return failure(validation.errors);

  const now = new Date().toISOString();
  const existing = data.clients.find((client) => client.id === input.id);
  const client = {
    ...(existing ?? {}),
    id: input.id || generateId('client'),
    name: input.name.trim(),
    alias: input.alias?.trim() ?? '',
    contact: input.contact?.trim() ?? '',
    channel: input.channel || CLIENT_CHANNELS.OTHER,
    deliveryZone: input.deliveryZone?.trim() ?? '',
    preferences: parseList(input.preferences),
    allergies: parseList(input.allergies),
    notes: input.notes?.trim() ?? '',
    totalOrders: existing?.totalOrders ?? 0,
    totalSpent: existing?.totalSpent ?? 0,
    active: input.active ?? true,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  upsertInPlace(data.clients, client);
  touch(data);
  return success(data, client);
}

export function deactivateClient(data, clientId) {
  const client = data.clients.find((item) => item.id === clientId);
  if (!client) return failure(['Cliente no encontrado.']);
  client.active = false;
  client.updatedAt = new Date().toISOString();
  touch(data);
  return success(data, client);
}

export function saveOrder(data, input) {
  const existing = data.orders.find((order) => order.id === input.id);
  if (existing?.stockMovementsCreated) {
    return failure(['Pedido ya entregado con stock descontado. Crea un ajuste manual si necesitas corregir stock.']);
  }
  if (existing?.stockReserved) {
    return failure(['Pedido con stock reservado: cambia estado o cancela para liberar antes de editar.']);
  }

  const orderInput = {
    ...input,
    orderDate: input.orderDate || input.date || new Date().toISOString().slice(0, 10),
    status: input.status || ORDER_STATUS.PENDING,
    items: normalizeOrderItems(input.items ?? [])
  };
  const validation = validateOrder(orderInput);
  if (!validation.valid) return failure(validation.errors);

  const client = data.clients.find((item) => item.id === orderInput.clientId);
  if (!client) return failure(['Cliente no encontrado.']);

  for (const item of orderInput.items) {
    const recipe = data.recipes.find((entry) => entry.id === item.recipeId);
    if (!recipe) return failure([`Receta no encontrada: ${item.recipeId}.`]);
  }

  const now = new Date().toISOString();
  const calculation = calculateOrderTotals(orderInput, data.recipes, data.products, data.settings);
  const order = {
    ...(existing ?? {}),
    id: input.id || generateId('order'),
    orderNumber: existing?.orderNumber || input.orderNumber || createOrderNumber(data, orderInput.orderDate),
    clientId: orderInput.clientId,
    orderDate: orderInput.orderDate,
    deliveryDate: orderInput.deliveryDate || null,
    deliveryTime: orderInput.deliveryTime || '',
    status: orderInput.status,
    items: calculation.items.map((item) => ({
      recipeId: item.recipeId,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      unitCost: item.unitCost,
      extras: item.extras ?? item.extraIngredientIds ?? [],
      excludedIngredientIds: item.excludedIngredientIds ?? [],
      assignedLotId: item.assignedLotId || null,
      notes: item.notes?.trim() ?? ''
    })),
    subtotal: calculation.subtotal,
    discount: calculation.discount,
    total: calculation.total,
    estimatedCost: calculation.estimatedCost,
    estimatedProfit: calculation.estimatedProfit,
    paid: Boolean(input.paid),
    paymentMethod: input.paymentMethod || PAYMENT_METHODS.CASH,
    notes: input.notes?.trim() ?? '',
    stockReserved: false,
    stockReservedAt: null,
    stockReservationReleasedAt: null,
    stockMovementsCreated: false,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  if (shouldReserveOrderStatus(order.status)) {
    const reservation = reserveOrderStock(data, order, now);
    if (!reservation.ok) return reservation;
  }
  upsertInPlace(data.orders, order);
  updateClientStats(data, order.clientId);
  touch(data);
  return success(data, order);
}

export function setOrderStatus(data, orderId, status) {
  if (status === ORDER_STATUS.DELIVERED) return deliverOrder(data, orderId);
  if (!Object.values(ORDER_STATUS).includes(status)) return failure(['Estado de pedido no valido.']);

  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return failure(['Pedido no encontrado.']);
  if (order.stockMovementsCreated) return failure(['Pedido entregado: no se puede cambiar el estado sin ajuste manual.']);

  const now = new Date().toISOString();
  if (shouldReserveOrderStatus(status) && !order.stockReserved) {
    const reservation = reserveOrderStock(data, order, now);
    if (!reservation.ok) return reservation;
  }
  if (!shouldReserveOrderStatus(status) && order.stockReserved) {
    releaseOrderStock(data, order, now, status === ORDER_STATUS.CANCELLED ? 'cancelacion' : 'cambio_estado');
  }

  order.status = status;
  order.updatedAt = now;
  touch(data);
  return success(data, order);
}

export function markOrderPaid(data, orderId, paid = true, paymentMethod = '') {
  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return failure(['Pedido no encontrado.']);
  order.paid = Boolean(paid);
  if (paymentMethod) order.paymentMethod = paymentMethod;
  order.updatedAt = new Date().toISOString();
  touch(data);
  return success(data, order);
}

export function deliverOrder(data, orderId) {
  const order = data.orders.find((item) => item.id === orderId);
  if (!order) return failure(['Pedido no encontrado.']);
  if (order.stockMovementsCreated) return failure(['Este pedido ya desconto stock.']);

  const now = new Date().toISOString();
  if (!order.stockReserved) {
    const reservation = reserveOrderStock(data, order, now);
    if (!reservation.ok) return reservation;
  }

  const reservationMovements = getActiveReservationMovements(data, order.id);
  const releaseMovements = createReservationReleaseMovements(order, reservationMovements, now, 'entrega');
  data.stockMovements.push(...releaseMovements);
  order.stockReserved = false;
  order.stockReservationReleasedAt = now;

  const movements = createSaleMovementsFromReservations(data, order, reservationMovements, now);
  data.stockMovements.push(...movements);
  order.status = ORDER_STATUS.DELIVERED;
  order.deliveredAt = now;
  order.stockMovementsCreated = true;
  order.updatedAt = now;
  updateConsumedLots(data, movements, now);
  updateClientStats(data, order.clientId);
  touch(data);
  return success(data, order);
}

export function saveFeedback(data, input) {
  const order = data.orders.find((item) => item.id === input.orderId);
  if (!order) return failure(['Pedido no encontrado para feedback.']);
  const now = new Date().toISOString();
  const existing = data.feedback.find((item) => item.id === input.id);
  const feedback = {
    ...(existing ?? {}),
    id: input.id || generateId('feedback'),
    clientId: input.clientId || order.clientId,
    orderId: order.id,
    taste: clampRating(input.taste),
    size: clampRating(input.size),
    price: clampRating(input.price),
    texture: input.texture?.trim() ?? '',
    wouldRepeat: Boolean(input.wouldRepeat),
    comment: input.comment?.trim() ?? '',
    suggestions: input.suggestions?.trim() ?? '',
    createdAt: existing?.createdAt ?? now,
    updatedAt: now
  };

  upsertInPlace(data.feedback, feedback);
  touch(data);
  return success(data, feedback);
}

export function saveSettings(data, input) {
  const backendSyncMode = ['manual', 'api_mirror'].includes(input.backendSyncMode)
    ? input.backendSyncMode
    : data.settings?.backend?.syncMode || DEFAULT_SETTINGS.backend.syncMode;
  const multipliers = {
    minimum: positiveNumber(input.minimumMultiplier, DEFAULT_SETTINGS.priceMultipliers.minimum),
    healthy: positiveNumber(input.healthyMultiplier, DEFAULT_SETTINGS.priceMultipliers.healthy),
    premium: positiveNumber(input.premiumMultiplier, DEFAULT_SETTINGS.priceMultipliers.premium)
  };

  if (multipliers.minimum <= 0 || multipliers.healthy <= 0 || multipliers.premium <= 0) {
    return failure(['Los multiplicadores deben ser mayores que 0.']);
  }
  if (multipliers.minimum > multipliers.healthy || multipliers.healthy > multipliers.premium) {
    return failure(['Los multiplicadores deben mantener orden minimo <= sano <= premium.']);
  }

  data.settings = {
    ...(data.settings ?? {}),
    businessName: input.businessName?.trim() || DEFAULT_SETTINGS.businessName,
    currency: input.currency?.trim() || DEFAULT_SETTINGS.currency,
    locale: input.locale?.trim() || DEFAULT_SETTINGS.locale,
    priceMultipliers: multipliers,
    cookedFridgeMaxDays: positiveNumber(input.cookedFridgeMaxDays, DEFAULT_SETTINGS.cookedFridgeMaxDays),
    cookedFrozenMaxDays: positiveNumber(input.cookedFrozenMaxDays, DEFAULT_SETTINGS.cookedFrozenMaxDays),
    lowStockThreshold: positiveNumber(input.lowStockThreshold, DEFAULT_SETTINGS.lowStockThreshold),
    defaultMeatPerBurritoG: positiveNumber(input.defaultMeatPerBurritoG, DEFAULT_SETTINGS.defaultMeatPerBurritoG),
    targetBasePrice: positiveNumber(input.targetBasePrice, DEFAULT_SETTINGS.targetBasePrice),
    demoMode: Boolean(input.demoMode),
    beefStatusNote: input.beefStatusNote?.trim() || DEFAULT_SETTINGS.beefStatusNote,
    backend: {
      ...(data.settings?.backend ?? DEFAULT_SETTINGS.backend),
      baseUrl: input.backendBaseUrl?.trim() || data.settings?.backend?.baseUrl || DEFAULT_SETTINGS.backend.baseUrl,
      syncMode: backendSyncMode
    },
    security: {
      ...DEFAULT_SETTINGS.security,
      ...(data.settings?.security ?? {}),
      localAuthEnabled: Boolean(input.localAuthEnabled),
      adminSessionMinutes: positiveNumber(input.adminSessionMinutes, DEFAULT_SETTINGS.security.adminSessionMinutes)
    }
  };
  touch(data);
  return success(data, data.settings);
}

function normalizeOrderItems(items) {
  return items
    .filter((item) => item.recipeId && Number(item.quantity) > 0)
    .map((item) => ({
      recipeId: item.recipeId,
      quantity: Number(item.quantity),
      unitPrice: toNullableNumber(item.unitPrice) ?? 0,
      unitCost: toNullableNumber(item.unitCost) ?? null,
      extras: parseList(item.extras ?? item.extraIngredientIds),
      extraIngredientIds: parseList(item.extraIngredientIds ?? item.extras),
      excludedIngredientIds: parseList(item.excludedIngredientIds ?? item.sinIngredientes),
      assignedLotId: item.assignedLotId || null,
      notes: item.notes?.trim() ?? ''
    }));
}

function createOrderNumber(data, orderDate) {
  const date = String(orderDate || new Date().toISOString().slice(0, 10)).replaceAll('-', '');
  const sequence = data.orders
    .filter((order) => String(order.orderNumber ?? '').startsWith(`PED-${date}`))
    .length + 1;
  return `PED-${date}-${String(sequence).padStart(3, '0')}`;
}

function shouldReserveOrderStatus(status) {
  return [ORDER_STATUS.CONFIRMED, ORDER_STATUS.IN_PRODUCTION, ORDER_STATUS.READY].includes(status);
}

function reserveOrderStock(data, order, now) {
  const stockByProduct = calculateStockByProduct(data.stockMovements);
  const needs = calculateOrderIngredientNeeds(order, data.recipes, data.products);
  const shortages = needs
    .map((need) => ({
      ...need,
      available: Number(stockByProduct[need.productId] ?? 0),
      shortage: Math.max((Number(need.quantity) || 0) - Number(stockByProduct[need.productId] ?? 0), 0)
    }))
    .filter((need) => need.shortage > 0);

  if (shortages.length > 0) {
    return failure(shortages.map((need) => `Stock insuficiente para reservar ${need.productName}: faltan ${need.shortage} ${need.unit}.`));
  }

  const movements = createReservationMovements(data, order, needs, now);
  data.stockMovements.push(...movements);
  order.stockReserved = true;
  order.stockReservedAt = now;
  order.stockReservationReleasedAt = null;
  return success(data, order);
}

function releaseOrderStock(data, order, now, reason = 'liberacion') {
  const reservationMovements = getActiveReservationMovements(data, order.id);
  const releaseMovements = createReservationReleaseMovements(order, reservationMovements, now, reason);
  data.stockMovements.push(...releaseMovements);
  order.stockReserved = false;
  order.stockReservationReleasedAt = now;
  return releaseMovements;
}

function getActiveReservationMovements(data, orderId) {
  const reservations = new Map();

  for (const movement of data.stockMovements) {
    if (movement.referenceId !== orderId || movement.referenceType !== 'order') continue;
    const isReservation = movement.type === MOVEMENT_TYPES.RESERVATION;
    const isRelease = movement.type === MOVEMENT_TYPES.RESERVATION_RELEASE;
    if (!isReservation && !isRelease) continue;

    const lotId = isRelease
      ? movement.toLotId || movement.lotId || ''
      : movement.fromLotId || movement.lotId || '';
    const key = [movement.productId, lotId, movement.unit].join('::');
    const current = reservations.get(key) ?? {
      productId: movement.productId,
      unit: movement.unit,
      fromLotId: lotId,
      lotId,
      quantity: 0
    };
    current.quantity += isReservation ? Number(movement.quantity) || 0 : -(Number(movement.quantity) || 0);
    reservations.set(key, current);
  }

  return [...reservations.values()].filter((movement) => movement.quantity > 0.000001);
}

function createReservationMovements(data, order, needs, now) {
  const stockByLot = calculateStockByLot(data.stockMovements);
  const movements = [];

  for (const need of needs) {
    const product = data.products.find((item) => item.id === need.productId);
    let remaining = Number(need.quantity) || 0;
    const productLots = data.lots
      .filter((lot) => lot.productId === need.productId && (stockByLot[lot.id] ?? 0) > 0 && !['descartado', 'discarded'].includes(lot.status))
      .sort(compareLotsForConsumption);

    for (const lot of productLots) {
      if (remaining <= 0) break;
      const available = stockByLot[lot.id] ?? 0;
      const quantity = Math.min(available, remaining);
      movements.push(createMovement({
        productId: need.productId,
        type: MOVEMENT_TYPES.RESERVATION,
        quantity,
        unit: need.unit || product?.baseUnit || '',
        direction: -1,
        fromLotId: lot.id,
        referenceId: order.id,
        referenceType: 'order',
        date: now,
        notes: `Reserva ${order.orderNumber} - ${need.productName}`
      }));
      remaining -= quantity;
    }

    if (remaining > 0) {
      movements.push(createMovement({
        productId: need.productId,
        type: MOVEMENT_TYPES.RESERVATION,
        quantity: remaining,
        unit: need.unit || product?.baseUnit || '',
        direction: -1,
        referenceId: order.id,
        referenceType: 'order',
        date: now,
        notes: `Reserva ${order.orderNumber} - ${need.productName}`
      }));
    }
  }

  return movements;
}

function createReservationReleaseMovements(order, reservationMovements, now, reason) {
  return reservationMovements.map((movement) => createMovement({
    productId: movement.productId,
    type: MOVEMENT_TYPES.RESERVATION_RELEASE,
    quantity: movement.quantity,
    unit: movement.unit,
    direction: 1,
    toLotId: movement.fromLotId || movement.lotId || '',
    referenceId: order.id,
    referenceType: 'order',
    date: now,
    notes: `Libera reserva ${order.orderNumber} - ${reason}`
  }));
}

function createSaleMovementsFromReservations(data, order, reservationMovements, now) {
  return reservationMovements.map((movement) => {
    const product = data.products.find((item) => item.id === movement.productId);
    return createMovement({
      productId: movement.productId,
      type: MOVEMENT_TYPES.SALE,
      quantity: movement.quantity,
      unit: movement.unit || product?.baseUnit || '',
      direction: -1,
      fromLotId: movement.fromLotId || movement.lotId || '',
      referenceId: order.id,
      referenceType: 'order',
      date: now,
      notes: `Venta ${order.orderNumber} - desde reserva`
    });
  });
}

function compareLotsForConsumption(a, b) {
  const expiresA = a.expiresAt || '9999-12-31';
  const expiresB = b.expiresAt || '9999-12-31';
  if (expiresA !== expiresB) return expiresA.localeCompare(expiresB);
  return String(a.createdAt ?? '').localeCompare(String(b.createdAt ?? ''));
}

function updateConsumedLots(data, movements, now) {
  const consumedLotIds = [...new Set(movements.map((movement) => movement.fromLotId).filter(Boolean))];
  const stockByLot = calculateStockByLot(data.stockMovements);
  for (const lotId of consumedLotIds) {
    const lot = data.lots.find((item) => item.id === lotId);
    if (!lot) continue;
    if ((stockByLot[lot.id] ?? 0) <= 0) lot.status = 'agotado';
    lot.updatedAt = now;
  }
}

function updateClientStats(data, clientId) {
  const client = data.clients.find((item) => item.id === clientId);
  if (!client) return;
  const deliveredOrders = data.orders.filter((order) => order.clientId === clientId && order.status === ORDER_STATUS.DELIVERED);
  client.totalOrders = deliveredOrders.length;
  client.totalSpent = roundMoney(deliveredOrders.reduce((total, order) => total + (Number(order.total) || 0), 0));
  client.updatedAt = new Date().toISOString();
}

function clampRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  return Math.min(Math.max(Math.round(rating), 1), 5);
}

function positiveNumber(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function createPriceHistoryEntry(fields) {
  const normalized = normalizePrice(fields.totalPrice, fields.quantity, fields.unit);
  return {
    id: generateId('price'),
    productId: fields.productId,
    supplierId: fields.supplierId,
    purchaseId: fields.purchaseId,
    purchaseItemId: fields.purchaseItemId,
    date: fields.date,
    quantity: fields.quantity,
    unit: fields.unit,
    totalPrice: fields.totalPrice,
    unitCost: fields.unitCost,
    normalizedPrice: normalized.value,
    normalizedUnit: normalized.unit,
    createdAt: fields.now,
    updatedAt: fields.now
  };
}

function normalizeProductionInputs(inputs, data) {
  return inputs
    .filter((item) => item.productId && Number(item.quantity) > 0)
    .map((item) => {
      const product = data.products.find((entry) => entry.id === item.productId);
      if (!product) return { error: 'Insumo no encontrado.' };
      const lot = item.lotId ? data.lots.find((entry) => entry.id === item.lotId) : null;
      if (item.lotId && !lot) return { error: `Lote de insumo no encontrado para ${product.name}.` };
      if (lot && lot.productId !== product.id) return { error: `El lote ${lot.lotCode} no pertenece al insumo ${product.name}.` };
      const unitCost = Number(lot?.unitCost) || Number(product.currentUnitCost) || Number(product.estimatedUnitCost) || 0;
      const quantity = Number(item.quantity);
      return {
        productId: product.id,
        lotId: lot?.id ?? '',
        lotCode: lot?.lotCode ?? '',
        quantity,
        unit: product.baseUnit,
        cost: quantity * unitCost
      };
    });
}

function normalizeRecipeIngredients(ingredients) {
  return ingredients
    .filter((item) => item.productId && Number(item.quantity) > 0)
    .map((item) => ({
      id: item.id || generateId('recipe-ing'),
      productId: item.productId,
      quantity: Number(item.quantity),
      unit: item.unit,
      required: item.required === undefined ? !Boolean(item.optional) : Boolean(item.required),
      group: item.group || item.role || RECIPE_INGREDIENT_GROUPS.TOPPING,
      optional: Boolean(item.optional),
      extraAvailable: Boolean(item.extraAvailable)
    }));
}

function createMovement(fields) {
  return {
    id: generateId('mov'),
    productId: fields.productId,
    type: fields.type,
    quantity: fields.quantity,
    unit: fields.unit,
    direction: fields.direction,
    lotId: fields.lotId ?? fields.toLotId ?? fields.fromLotId ?? '',
    fromLotId: fields.fromLotId ?? '',
    toLotId: fields.toLotId ?? '',
    referenceId: fields.referenceId ?? '',
    referenceType: fields.referenceType ?? '',
    date: fields.date ?? new Date().toISOString(),
    notes: fields.notes ?? ''
  };
}

function getSuggestedExpiry(date, location, settings = {}) {
  if (location === STORAGE_LOCATIONS.FREEZER) {
    return addDays(date, settings.cookedFrozenMaxDays ?? 30);
  }
  return addDays(date, settings.cookedFridgeMaxDays ?? 2);
}

function createBatchCode(type, date, sequence) {
  const prefix = String(type || 'OTRO')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '')
    .toUpperCase()
    .slice(0, 8) || 'OTRO';
  return `${prefix}-${date}-T${String(sequence).padStart(3, '0')}`;
}

function createFlavorLotCode(product, date) {
  const prefix = product.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toUpperCase()
    .slice(0, 18) || 'SABOR';
  return `${prefix}-${date.replaceAll('-', '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

function calculateDurationMinutes(startTime, endTime) {
  if (!startTime || !endTime) return null;
  const [startHour, startMinute] = startTime.split(':').map(Number);
  const [endHour, endMinute] = endTime.split(':').map(Number);
  if (![startHour, startMinute, endHour, endMinute].every(Number.isFinite)) return null;
  let start = startHour * 60 + startMinute;
  let end = endHour * 60 + endMinute;
  if (end < start) end += 24 * 60;
  return end - start;
}

function normalizePrice(totalPrice, quantity, unit) {
  if (unit === UNITS.GRAMS) return { value: calculatePricePerKg(totalPrice, quantity), unit: 'kg' };
  if (unit === UNITS.MILLILITERS) return { value: calculateUnitCost(totalPrice, quantity) * 1000, unit: 'litro' };
  return { value: calculateUnitCost(totalPrice, quantity), unit: 'ud' };
}

function createPurchaseLotCode(product, date) {
  const slug = product.name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 18)
    .toUpperCase();
  return `${slug || 'LOTE'}-${date.replaceAll('-', '')}-${Date.now().toString(36).slice(-4).toUpperCase()}`;
}

function upsertInPlace(collection, item) {
  const index = collection.findIndex((entry) => entry.id === item.id);
  if (index >= 0) collection[index] = item;
  else collection.push(item);
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  return String(value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function toNullableNumber(value) {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function roundMoney(value) {
  return Math.round((Number(value) || 0) * 100) / 100;
}

function touch(data) {
  data.metadata = {
    ...(data.metadata ?? {}),
    updatedAt: new Date().toISOString()
  };
}

function success(data, item) {
  return { ok: true, data, item, errors: [] };
}

function failure(errors) {
  return { ok: false, data: null, item: null, errors };
}
