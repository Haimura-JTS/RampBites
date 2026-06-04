/**
 * Cálculos de Lógica de Negocio
 * 
 * Funciones de cálculo para:
 * - Costes (por gramo, por 100g, de receta, total)
 * - Rendimiento (%, merma, merma %)
 * - Márgenes (total, %)
 * - Burritos posibles
 * - Precios recomendados
 * 
 * ETAPA 0: Fórmulas definidas en BUSINESS_RULES.md (sección 11)
 * ETAPA 1: Será implementado aquí
 */

// ============ COSTES ============

export function calculateCostPerGram(totalCost, finalWeight) {
  // TODO: Implementar en ETAPA 1
  // coste_por_gramo = coste_total / peso_final
  if (finalWeight <= 0) return 0;
  return totalCost / finalWeight;
}

export function calculateCostPer100g(costPerGram) {
  // TODO: Implementar en ETAPA 1
  // coste_por_100g = coste_por_gramo × 100
  return costPerGram * 100;
}

export function calculateRecipeCost(ingredients, stockPrices) {
  // TODO: Implementar en ETAPA 1
  // coste_receta = Σ (cantidad × precio_unitario)
  let total = 0;
  for (let ingredient of ingredients) {
    const price = stockPrices[ingredient.productId] || 0;
    total += ingredient.quantity * price;
  }
  return total;
}

// ============ PRODUCCIÓN ============

export function calculateYield(finalWeight, rawWeight) {
  // TODO: Implementar en ETAPA 1
  // rendimiento = peso_final / peso_crudo
  if (rawWeight <= 0) return 0;
  return (finalWeight / rawWeight) * 100; // retorna en porcentaje
}

export function calculateLoss(rawWeight, finalWeight) {
  // TODO: Implementar en ETAPA 1
  // merma = peso_crudo - peso_final
  return rawWeight - finalWeight;
}

export function calculateLossPercentage(loss, rawWeight) {
  // TODO: Implementar en ETAPA 1
  // merma_% = (merma / peso_crudo) × 100
  if (rawWeight <= 0) return 0;
  return (loss / rawWeight) * 100;
}

// ============ MÁRGENES ============

export function calculateMargin(sellingPrice, cost) {
  // TODO: Implementar en ETAPA 1
  // margen = precio_venta - coste
  return sellingPrice - cost;
}

export function calculateMarginPercentage(margin, sellingPrice) {
  // TODO: Implementar en ETAPA 1
  // margen_% = (margen / precio_venta) × 100
  if (sellingPrice <= 0) return 0;
  return (margin / sellingPrice) * 100;
}

// ============ PRECIOS RECOMENDADOS ============

export function calculateRecommendedPrices(cost, multipliers = {}) {
  // TODO: Implementar en ETAPA 1
  // precio_mínimo = coste × 2.0
  // precio_sano = coste × 2.5
  // precio_premium = coste × 3.0
  const {
    minimum = 2.0,
    healthy = 2.5,
    premium = 3.0
  } = multipliers;

  return {
    minimum: cost * minimum,
    healthy: cost * healthy,
    premium: cost * premium
  };
}

// ============ BURRITOS POSIBLES ============

export function calculateBurritosPossible(recipe, stock) {
  // TODO: Implementar en ETAPA 1
  // burritos_posibles = min(stock_ingrediente / cantidad_requerida)
  let minimum = Infinity;
  let limitingIngredient = null;

  for (let ingredient of recipe.ingredients) {
    const available = stock[ingredient.productId] || 0;
    const possible = Math.floor(available / ingredient.quantity);
    
    if (possible < minimum) {
      minimum = possible;
      limitingIngredient = ingredient.productId;
    }
  }

  return {
    totalPossible: minimum === Infinity ? 0 : minimum,
    limitingIngredient
  };
}

// ============ VIABILIDAD ============

export function isViablePrice(cost, sellingPrice, minimumMultiplier = 2.0) {
  // TODO: Implementar en ETAPA 1
  // Verifica si precio de venta es >= coste × multiplicador mínimo
  const minimumPrice = cost * minimumMultiplier;
  return sellingPrice >= minimumPrice;
}

export function getPriceViability(cost, sellingPrice) {
  // TODO: Implementar en ETAPA 1
  // Retorna: "VIABLE", "WARNING", "NOT_VIABLE"
  const minimumPrice = cost * 2.0;
  const healthyPrice = cost * 2.5;

  if (sellingPrice >= healthyPrice) {
    return { status: 'VIABLE', message: '✓ Precio viable' };
  } else if (sellingPrice >= minimumPrice) {
    return { status: 'WARNING', message: '⚠️ Margen bajo, considera subir precio' };
  } else {
    return { status: 'NOT_VIABLE', message: '❌ Precio NO viable, margen insostenible' };
  }
}
