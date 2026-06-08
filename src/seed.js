import {
  ALLERGENS,
  DEFAULT_SETTINGS,
  MOVEMENT_TYPES,
  PRODUCT_CATEGORIES,
  PRODUCT_STATUS,
  PRODUCTION_STATUS,
  RECIPE_CATEGORIES,
  RECIPE_INGREDIENT_GROUPS,
  RECIPE_STATUS,
  SCHEMA_VERSION,
  STOCK_TYPES,
  STORAGE_LOCATIONS,
  UNITS
} from './constants.js';
import {
  calculateFinalCostPer100g,
  calculateFinalCostPerGram,
  calculatePricePerKg,
  calculateUnitCost,
  calculateWaste,
  calculateYield
} from './calculations.js';
import { createEmptyDatabase } from './models.js';

const SEED_DATE = '2026-06-04';
const CREATED_AT = `${SEED_DATE}T12:00:00.000Z`;

export function createSeedData() {
  const porkRawCost = calculateUnitCost(26.21, 2385);
  const porkUsedProduction1Cost = 11.57;
  const production1FinalWeight = 800;
  const production1Yield = calculateYield(1053, production1FinalWeight);
  const production1Waste = calculateWaste(1053, production1FinalWeight);
  const production1CostPerGram = calculateFinalCostPerGram(porkUsedProduction1Cost, production1FinalWeight);
  const production1CostPer100g = calculateFinalCostPer100g(porkUsedProduction1Cost, production1FinalWeight);

  const products = [
    product({
      id: 'prod-pork-collar-raw',
      name: 'Cuello de cerdo sin hueso / coll sense os',
      category: PRODUCT_CATEGORIES.RAW_MEAT,
      subcategory: 'cerdo',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.RAW,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 100,
      currentUnitCost: porkRawCost,
      costSource: 'real',
      preferredSupplierId: 'sup-local-butcher-1',
      notes: 'Dato real comprado; producto principal de cerdo.'
    }),
    product({
      id: 'prod-pork-cooked-neutral',
      name: 'Cerdo desmechado neutro',
      category: PRODUCT_CATEGORIES.COOKED_MEAT,
      subcategory: 'cerdo',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.COOKED_NEUTRAL,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 400,
      currentUnitCost: production1CostPerGram,
      costSource: 'real',
      notes: 'Base neutra para separar por sabores segun pedidos.'
    }),
    product({
      id: 'prod-pork-bbq',
      name: 'Cerdo BBQ',
      category: PRODUCT_CATEGORIES.COOKED_MEAT,
      subcategory: 'cerdo saborizado',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.FLAVORED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 0,
      estimatedUnitCost: production1CostPerGram,
      costSource: 'estimated'
    }),
    product({
      id: 'prod-pork-honey-mustard',
      name: 'Cerdo mostaza-miel',
      category: PRODUCT_CATEGORIES.COOKED_MEAT,
      subcategory: 'cerdo saborizado',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.FLAVORED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 0,
      estimatedUnitCost: production1CostPerGram,
      costSource: 'estimated'
    }),
    product({
      id: 'prod-pork-spicy',
      name: 'Cerdo picante',
      category: PRODUCT_CATEGORIES.COOKED_MEAT,
      subcategory: 'cerdo saborizado',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.FLAVORED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 0,
      estimatedUnitCost: production1CostPerGram,
      costSource: 'estimated'
    }),
    product({
      id: 'prod-pork-yogurt-creamy',
      name: 'Cerdo yogur/cremoso',
      category: PRODUCT_CATEGORIES.COOKED_MEAT,
      subcategory: 'cerdo saborizado',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.FLAVORED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 0,
      estimatedUnitCost: production1CostPerGram,
      costSource: 'estimated'
    }),
    product({
      id: 'prod-chicken-raw',
      name: 'Pollo crudo',
      category: PRODUCT_CATEGORIES.CHICKEN,
      subcategory: 'pollo',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.RAW,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 500,
      costSource: 'none'
    }),
    product({
      id: 'prod-chicken-cooked-neutral',
      name: 'Pollo desmechado neutro',
      category: PRODUCT_CATEGORIES.COOKED_MEAT,
      subcategory: 'pollo',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.COOKED_NEUTRAL,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 300,
      costSource: 'none'
    }),
    product({
      id: 'prod-chicken-thigh',
      name: 'Contramuslo de pollo',
      category: PRODUCT_CATEGORIES.CHICKEN,
      subcategory: 'pollo',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.RAW,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 500,
      costSource: 'none'
    }),
    product({
      id: 'prod-chicken-bbq',
      name: 'Pollo BBQ',
      category: PRODUCT_CATEGORIES.COOKED_MEAT,
      subcategory: 'pollo saborizado',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.FLAVORED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 0,
      costSource: 'none'
    }),
    product({
      id: 'prod-chicken-yogurt',
      name: 'Pollo yogur',
      category: PRODUCT_CATEGORIES.COOKED_MEAT,
      subcategory: 'pollo saborizado',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.FLAVORED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 0,
      costSource: 'none'
    }),
    product({
      id: 'prod-chicken-spicy',
      name: 'Pollo picante',
      category: PRODUCT_CATEGORIES.COOKED_MEAT,
      subcategory: 'pollo saborizado',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.FLAVORED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 0,
      costSource: 'none'
    }),
    product({
      id: 'prod-dry-chicken-broth',
      name: 'Caldo seco pollo',
      category: PRODUCT_CATEGORIES.BROTH,
      baseUnit: UNITS.UNITS,
      stockType: STOCK_TYPES.DRY,
      location: STORAGE_LOCATIONS.PANTRY,
      stockMinimum: 2,
      currentUnitCost: calculateUnitCost(1.5, 2),
      costSource: 'real',
      allergens: [ALLERGENS.GLUTEN]
    }),
    product({
      id: 'prod-dry-meat-broth',
      name: 'Caldo seco carne',
      category: PRODUCT_CATEGORIES.BROTH,
      baseUnit: UNITS.UNITS,
      stockType: STOCK_TYPES.DRY,
      location: STORAGE_LOCATIONS.PANTRY,
      stockMinimum: 2,
      currentUnitCost: calculateUnitCost(1.7, 2),
      costSource: 'real',
      allergens: [ALLERGENS.GLUTEN]
    }),
    product({
      id: 'prod-liquid-meat-broth-large',
      name: 'Caldo carne liquido grande',
      category: PRODUCT_CATEGORIES.BROTH,
      baseUnit: UNITS.UNITS,
      stockType: STOCK_TYPES.DRY,
      location: STORAGE_LOCATIONS.PANTRY,
      stockMinimum: 1,
      currentUnitCost: 2.3,
      costSource: 'real'
    }),
    product({
      id: 'prod-yogurt-salseo',
      name: 'Salsa yogur Salseo',
      category: PRODUCT_CATEGORIES.SAUCE,
      baseUnit: UNITS.MILLILITERS,
      stockType: STOCK_TYPES.REFRIGERATED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 100,
      currentUnitCost: calculateUnitCost(1.29, 300),
      costSource: 'real',
      allergens: [ALLERGENS.LACTOSE]
    }),
    product({
      id: 'prod-edam-cheese',
      name: 'Queso Edam fundir',
      category: PRODUCT_CATEGORIES.DAIRY,
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.REFRIGERATED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 50,
      currentUnitCost: calculateUnitCost(1.44, 200),
      costSource: 'real',
      allergens: [ALLERGENS.LACTOSE]
    }),
    product({
      id: 'prod-paper-bag-consum',
      name: 'Bolsa papel Consum',
      category: PRODUCT_CATEGORIES.PACKAGING,
      baseUnit: UNITS.UNITS,
      stockType: STOCK_TYPES.PACKAGING,
      location: STORAGE_LOCATIONS.PANTRY,
      stockMinimum: 10,
      currentUnitCost: calculateUnitCost(1.95, 30),
      costSource: 'real'
    }),
    product({
      id: 'prod-tortilla',
      name: 'Tortilla',
      category: PRODUCT_CATEGORIES.TORTILLA,
      baseUnit: UNITS.UNITS,
      stockType: STOCK_TYPES.DRY,
      location: STORAGE_LOCATIONS.PANTRY,
      stockMinimum: 10,
      estimatedUnitCost: 0.31,
      costSource: 'estimated',
      allergens: [ALLERGENS.GLUTEN]
    }),
    product({
      id: 'prod-rice-basmati-cooked',
      name: 'Arroz basmati cocido',
      category: PRODUCT_CATEGORIES.RICE,
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.REFRIGERATED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 300,
      estimatedUnitCost: 0.0011,
      costSource: 'estimated'
    }),
    product({
      id: 'prod-red-onion',
      name: 'Cebolla morada',
      category: PRODUCT_CATEGORIES.VEGETABLE,
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.REFRIGERATED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 100,
      estimatedUnitCost: 0.002,
      costSource: 'estimated'
    }),
    product({
      id: 'prod-spinach',
      name: 'Espinaca',
      category: PRODUCT_CATEGORIES.VEGETABLE,
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.REFRIGERATED,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      stockMinimum: 100,
      costSource: 'none'
    }),
    product({
      id: 'prod-mustard',
      name: 'Mostaza',
      category: PRODUCT_CATEGORIES.SAUCE,
      baseUnit: UNITS.MILLILITERS,
      stockType: STOCK_TYPES.REFRIGERATED,
      location: STORAGE_LOCATIONS.FRIDGE,
      stockMinimum: 50,
      estimatedUnitCost: 0.004,
      costSource: 'estimated',
      allergens: [ALLERGENS.MUSTARD]
    }),
    product({
      id: 'prod-honey',
      name: 'Miel',
      category: PRODUCT_CATEGORIES.SEASONING,
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.DRY,
      location: STORAGE_LOCATIONS.PANTRY,
      stockMinimum: 100,
      estimatedUnitCost: 0.006,
      costSource: 'estimated'
    }),
    product({
      id: 'prod-bbq-sauce',
      name: 'Salsa BBQ',
      category: PRODUCT_CATEGORIES.SAUCE,
      baseUnit: UNITS.MILLILITERS,
      stockType: STOCK_TYPES.REFRIGERATED,
      location: STORAGE_LOCATIONS.FRIDGE,
      stockMinimum: 100,
      estimatedUnitCost: 0.005,
      costSource: 'estimated'
    }),
    product({
      id: 'prod-spicy-sauce',
      name: 'Salsa picante',
      category: PRODUCT_CATEGORIES.SAUCE,
      baseUnit: UNITS.MILLILITERS,
      stockType: STOCK_TYPES.REFRIGERATED,
      location: STORAGE_LOCATIONS.FRIDGE,
      stockMinimum: 50,
      estimatedUnitCost: 0.005,
      costSource: 'estimated'
    }),
    product({
      id: 'prod-beef-premium-standby',
      name: 'Ternera premium',
      category: PRODUCT_CATEGORIES.RAW_MEAT,
      subcategory: 'ternera',
      baseUnit: UNITS.GRAMS,
      stockType: STOCK_TYPES.RAW,
      location: STORAGE_LOCATIONS.FRIDGE,
      requiresCold: true,
      active: false,
      status: PRODUCT_STATUS.STANDBY,
      costSource: 'none',
      notes: 'Standby/premium por coste alto; no es base activa.'
    })
  ];

  const suppliers = [
    supplier({
      id: 'sup-local-butcher-1',
      name: 'Carniceria local 1',
      type: 'carniceria',
      perceivedQuality: 4,
      perceivedPrice: 'medio',
      usualProducts: ['prod-pork-collar-raw']
    }),
    supplier({
      id: 'sup-consum',
      name: 'Consum',
      type: 'supermercado',
      perceivedQuality: 3,
      perceivedPrice: 'medio',
      usualProducts: ['prod-yogurt-salseo', 'prod-edam-cheese', 'prod-paper-bag-consum']
    }),
    supplier({
      id: 'sup-pending',
      name: 'Proveedor pendiente',
      type: 'otro',
      perceivedQuality: 0,
      perceivedPrice: 'medio',
      notes: 'Placeholder para proveedores por validar.'
    })
  ];

  const purchases = [
    {
      id: 'purchase-meat-001',
      date: SEED_DATE,
      supplierId: 'sup-local-butcher-1',
      items: [
        purchaseItem({
          id: 'purchase-item-pork-raw-001',
          productId: 'prod-pork-collar-raw',
          quantity: 2385,
          unit: UNITS.GRAMS,
          totalPrice: 26.21,
          unitCost: porkRawCost,
          notes: `Precio/kg calculado: ${calculatePricePerKg(26.21, 2385).toFixed(2)} EUR`
        })
      ],
      calculatedTotal: 26.21,
      ticketTotal: 26.21,
      difference: 0,
      notes: 'Compra real de carne inicial.',
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT
    },
    {
      id: 'purchase-consum-001',
      date: SEED_DATE,
      supplierId: 'sup-consum',
      items: [
        purchaseItem({ id: 'purchase-item-yogurt-001', productId: 'prod-yogurt-salseo', quantity: 300, unit: UNITS.MILLILITERS, totalPrice: 1.29 }),
        purchaseItem({ id: 'purchase-item-edam-001', productId: 'prod-edam-cheese', quantity: 200, unit: UNITS.GRAMS, totalPrice: 1.44 }),
        purchaseItem({ id: 'purchase-item-bags-001', productId: 'prod-paper-bag-consum', quantity: 30, unit: UNITS.UNITS, totalPrice: 1.95 }),
        purchaseItem({ id: 'purchase-item-chicken-broth-001', productId: 'prod-dry-chicken-broth', quantity: 2, unit: UNITS.UNITS, totalPrice: 1.5 }),
        purchaseItem({ id: 'purchase-item-meat-broth-001', productId: 'prod-dry-meat-broth', quantity: 2, unit: UNITS.UNITS, totalPrice: 1.7 }),
        purchaseItem({ id: 'purchase-item-liquid-broth-001', productId: 'prod-liquid-meat-broth-large', quantity: 1, unit: UNITS.UNITS, totalPrice: 2.3 })
      ],
      calculatedTotal: 10.18,
      ticketTotal: 10.18,
      difference: 0,
      notes: 'Compra real de insumos Consum.',
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT
    }
  ];

  const lots = [
    lot({
      id: 'lot-pork-raw-001',
      lotCode: 'RAW-CERDO-20260604-001',
      productId: 'prod-pork-collar-raw',
      initialQuantity: 2385,
      unit: UNITS.GRAMS,
      unitCost: porkRawCost,
      sourceType: 'purchase',
      sourceId: 'purchase-meat-001',
      location: STORAGE_LOCATIONS.FRIDGE
    }),
    lot({
      id: 'lot-pork-neutral-001',
      lotCode: 'CERDO-20260604-T001',
      productId: 'prod-pork-cooked-neutral',
      initialQuantity: 800,
      unit: UNITS.GRAMS,
      unitCost: production1CostPerGram,
      sourceType: 'production',
      sourceId: 'batch-pork-001',
      location: STORAGE_LOCATIONS.FRIDGE,
      cookedAt: SEED_DATE,
      expiresAt: '2026-06-06'
    })
  ];

  const productionBatches = [
    {
      id: 'batch-pork-001',
      batchCode: 'CERDO-20260604-T001',
      type: 'cerdo',
      status: PRODUCTION_STATUS.FINISHED,
      date: SEED_DATE,
      startTime: '21:00',
      endTime: '00:30',
      durationMinutes: 210,
      rawProductId: 'prod-pork-collar-raw',
      rawWeightUsed: 1053,
      meatCost: porkUsedProduction1Cost,
      liquidInitialMl: 534,
      brothTotalMl: 550,
      brothLeftMl: 450,
      heatLevel: 'bajo',
      drainedWeight: 750,
      finalWeight: production1FinalWeight,
      yieldRatio: production1Yield,
      wasteGrams: production1Waste.grams,
      wastePercentage: production1Waste.percentage,
      totalCost: porkUsedProduction1Cost,
      finalCostPerGram: production1CostPerGram,
      finalCostPer100g: production1CostPer100g,
      resultProductId: 'prod-pork-cooked-neutral',
      resultLotId: 'lot-pork-neutral-001',
      notes: 'Produccion real 1: cerdo desmechado neutro.',
      createdAt: `${SEED_DATE}T23:59:00.000Z`,
      updatedAt: `${SEED_DATE}T23:59:00.000Z`
    },
    {
      id: 'batch-pork-002',
      batchCode: 'CERDO-20260604-T002',
      type: 'cerdo',
      status: PRODUCTION_STATUS.PENDING,
      date: SEED_DATE,
      startTime: '18:00',
      rawProductId: 'prod-pork-collar-raw',
      rawWeightUsed: 1318,
      meatCost: 14.49,
      inputs: [
        { productId: 'prod-dry-meat-broth', quantity: 2, unit: UNITS.UNITS, cost: 1.7 }
      ],
      totalCost: 16.19,
      finalWeight: null,
      yieldRatio: null,
      finalCostPerGram: null,
      finalCostPer100g: null,
      resultProductId: null,
      resultLotId: null,
      notes: 'Produccion real 2 pendiente de peso final y resultado.',
      createdAt: `${SEED_DATE}T18:00:00.000Z`,
      updatedAt: `${SEED_DATE}T18:00:00.000Z`
    }
  ];

  const stockMovements = [
    movement({ id: 'mov-purchase-pork-raw-001', productId: 'prod-pork-collar-raw', type: MOVEMENT_TYPES.PURCHASE, quantity: 2385, unit: UNITS.GRAMS, direction: 1, toLotId: 'lot-pork-raw-001', referenceId: 'purchase-meat-001', referenceType: 'purchase' }),
    movement({ id: 'mov-purchase-yogurt-001', productId: 'prod-yogurt-salseo', type: MOVEMENT_TYPES.PURCHASE, quantity: 300, unit: UNITS.MILLILITERS, direction: 1, referenceId: 'purchase-consum-001', referenceType: 'purchase' }),
    movement({ id: 'mov-purchase-edam-001', productId: 'prod-edam-cheese', type: MOVEMENT_TYPES.PURCHASE, quantity: 200, unit: UNITS.GRAMS, direction: 1, referenceId: 'purchase-consum-001', referenceType: 'purchase' }),
    movement({ id: 'mov-purchase-bags-001', productId: 'prod-paper-bag-consum', type: MOVEMENT_TYPES.PURCHASE, quantity: 30, unit: UNITS.UNITS, direction: 1, referenceId: 'purchase-consum-001', referenceType: 'purchase' }),
    movement({ id: 'mov-purchase-chicken-broth-001', productId: 'prod-dry-chicken-broth', type: MOVEMENT_TYPES.PURCHASE, quantity: 2, unit: UNITS.UNITS, direction: 1, referenceId: 'purchase-consum-001', referenceType: 'purchase' }),
    movement({ id: 'mov-purchase-meat-broth-001', productId: 'prod-dry-meat-broth', type: MOVEMENT_TYPES.PURCHASE, quantity: 2, unit: UNITS.UNITS, direction: 1, referenceId: 'purchase-consum-001', referenceType: 'purchase' }),
    movement({ id: 'mov-purchase-liquid-broth-001', productId: 'prod-liquid-meat-broth-large', type: MOVEMENT_TYPES.PURCHASE, quantity: 1, unit: UNITS.UNITS, direction: 1, referenceId: 'purchase-consum-001', referenceType: 'purchase' }),
    movement({ id: 'mov-batch-001-consume-pork', productId: 'prod-pork-collar-raw', type: MOVEMENT_TYPES.PRODUCTION_CONSUME, quantity: 1053, unit: UNITS.GRAMS, direction: -1, fromLotId: 'lot-pork-raw-001', referenceId: 'batch-pork-001', referenceType: 'production' }),
    movement({ id: 'mov-batch-001-output-neutral', productId: 'prod-pork-cooked-neutral', type: MOVEMENT_TYPES.PRODUCTION_OUTPUT, quantity: 800, unit: UNITS.GRAMS, direction: 1, toLotId: 'lot-pork-neutral-001', referenceId: 'batch-pork-001', referenceType: 'production' }),
    movement({ id: 'mov-batch-002-consume-pork', productId: 'prod-pork-collar-raw', type: MOVEMENT_TYPES.PRODUCTION_CONSUME, quantity: 1318, unit: UNITS.GRAMS, direction: -1, fromLotId: 'lot-pork-raw-001', referenceId: 'batch-pork-002', referenceType: 'production' }),
    movement({ id: 'mov-batch-002-consume-meat-broth', productId: 'prod-dry-meat-broth', type: MOVEMENT_TYPES.PRODUCTION_CONSUME, quantity: 2, unit: UNITS.UNITS, direction: -1, referenceId: 'batch-pork-002', referenceType: 'production' })
  ];

  const priceHistory = purchases.flatMap((purchase) => purchase.items.map((item) => priceHistoryEntry({
    id: `price-${item.id}`,
    productId: item.productId,
    supplierId: purchase.supplierId,
    purchaseId: purchase.id,
    purchaseItemId: item.id,
    date: purchase.date,
    quantity: item.quantity,
    unit: item.unit,
    totalPrice: item.totalPrice,
    unitCost: item.unitCost
  })));

  const recipes = [
    recipe({
      id: 'recipe-pork-standard',
      name: 'Cerdo BBQ Base',
      category: RECIPE_CATEGORIES.PORK,
      status: RECIPE_STATUS.ACTIVE,
      description: 'Burrito base de cerdo con BBQ, arroz, tortilla, queso y bolsa.',
      currentSalePrice: 5,
      targetMargin: 0.45,
      estimatedFinalWeight: 375,
      allergens: [ALLERGENS.GLUTEN, ALLERGENS.LACTOSE],
      ingredients: [
        recipeIngredient('recipe-pork-bbq-meat', 'prod-pork-cooked-neutral', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.MEAT),
        recipeIngredient('recipe-pork-bbq-rice', 'prod-rice-basmati-cooked', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.BASE),
        recipeIngredient('recipe-pork-bbq-tortilla', 'prod-tortilla', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.BASE),
        recipeIngredient('recipe-pork-bbq-cheese', 'prod-edam-cheese', 30, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.TOPPING),
        recipeIngredient('recipe-pork-bbq-sauce', 'prod-bbq-sauce', 25, UNITS.MILLILITERS, RECIPE_INGREDIENT_GROUPS.SAUCE),
        recipeIngredient('recipe-pork-bbq-bag', 'prod-paper-bag-consum', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.PACKAGING),
        recipeIngredient('recipe-pork-bbq-extra-cheese', 'prod-edam-cheese', 20, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.TOPPING, { required: false, optional: true, extraAvailable: true }),
        recipeIngredient('recipe-pork-bbq-extra-bbq', 'prod-bbq-sauce', 15, UNITS.MILLILITERS, RECIPE_INGREDIENT_GROUPS.SAUCE, { required: false, optional: true, extraAvailable: true })
      ],
      notes: 'Receta base actual con 100 g de carne. Salsa BBQ en rango editable 20-30 ml.'
    }),
    recipe({
      id: 'recipe-pork-honey-mustard',
      name: 'Cerdo Mostaza-Miel',
      category: RECIPE_CATEGORIES.PORK,
      status: RECIPE_STATUS.ACTIVE,
      description: 'Cerdo neutro con perfil dulce de mostaza y miel.',
      currentSalePrice: 5,
      targetMargin: 0.45,
      estimatedFinalWeight: 375,
      allergens: [ALLERGENS.GLUTEN, ALLERGENS.LACTOSE, ALLERGENS.MUSTARD],
      ingredients: [
        recipeIngredient('recipe-pork-hm-meat', 'prod-pork-cooked-neutral', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.MEAT),
        recipeIngredient('recipe-pork-hm-rice', 'prod-rice-basmati-cooked', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.BASE),
        recipeIngredient('recipe-pork-hm-tortilla', 'prod-tortilla', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.BASE),
        recipeIngredient('recipe-pork-hm-cheese', 'prod-edam-cheese', 30, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.TOPPING),
        recipeIngredient('recipe-pork-hm-mustard', 'prod-mustard', 15, UNITS.MILLILITERS, RECIPE_INGREDIENT_GROUPS.SAUCE),
        recipeIngredient('recipe-pork-hm-honey', 'prod-honey', 15, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.SAUCE),
        recipeIngredient('recipe-pork-hm-bag', 'prod-paper-bag-consum', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.PACKAGING),
        recipeIngredient('recipe-pork-hm-extra-cheese', 'prod-edam-cheese', 20, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.TOPPING, { required: false, optional: true, extraAvailable: true })
      ],
      notes: 'Cantidades de mostaza y miel estimadas y editables.'
    }),
    recipe({
      id: 'recipe-pork-yogurt-creamy',
      name: 'Cerdo Yogur/Cremoso',
      category: RECIPE_CATEGORIES.PORK,
      status: RECIPE_STATUS.ACTIVE,
      description: 'Cerdo neutro con salsa de yogur y cebolla morada.',
      currentSalePrice: 5,
      targetMargin: 0.45,
      estimatedFinalWeight: 390,
      allergens: [ALLERGENS.GLUTEN, ALLERGENS.LACTOSE],
      ingredients: [
        recipeIngredient('recipe-pork-yog-meat', 'prod-pork-cooked-neutral', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.MEAT),
        recipeIngredient('recipe-pork-yog-rice', 'prod-rice-basmati-cooked', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.BASE),
        recipeIngredient('recipe-pork-yog-tortilla', 'prod-tortilla', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.BASE),
        recipeIngredient('recipe-pork-yog-cheese', 'prod-edam-cheese', 30, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.TOPPING),
        recipeIngredient('recipe-pork-yog-sauce', 'prod-yogurt-salseo', 25, UNITS.MILLILITERS, RECIPE_INGREDIENT_GROUPS.SAUCE),
        recipeIngredient('recipe-pork-yog-onion', 'prod-red-onion', 25, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.TOPPING),
        recipeIngredient('recipe-pork-yog-bag', 'prod-paper-bag-consum', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.PACKAGING),
        recipeIngredient('recipe-pork-yog-extra-yogurt', 'prod-yogurt-salseo', 20, UNITS.MILLILITERS, RECIPE_INGREDIENT_GROUPS.SAUCE, { required: false, optional: true, extraAvailable: true }),
        recipeIngredient('recipe-pork-yog-extra-onion', 'prod-red-onion', 20, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.TOPPING, { required: false, optional: true, extraAvailable: true })
      ],
      notes: 'Cebolla y salsa yogur en rango editable 20-30 g/ml.'
    }),
    recipe({
      id: 'recipe-chicken-base',
      name: 'Pollo Base',
      category: RECIPE_CATEGORIES.CHICKEN,
      status: RECIPE_STATUS.TEST,
      description: 'Segunda linea: pollo neutro con salsa yogur.',
      currentSalePrice: 5,
      targetMargin: 0.45,
      estimatedFinalWeight: 375,
      allergens: [ALLERGENS.GLUTEN, ALLERGENS.LACTOSE],
      ingredients: [
        recipeIngredient('recipe-chicken-base-meat', 'prod-chicken-cooked-neutral', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.MEAT),
        recipeIngredient('recipe-chicken-base-rice', 'prod-rice-basmati-cooked', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.BASE),
        recipeIngredient('recipe-chicken-base-tortilla', 'prod-tortilla', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.BASE),
        recipeIngredient('recipe-chicken-base-cheese', 'prod-edam-cheese', 30, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.TOPPING),
        recipeIngredient('recipe-chicken-base-yogurt', 'prod-yogurt-salseo', 25, UNITS.MILLILITERS, RECIPE_INGREDIENT_GROUPS.SAUCE),
        recipeIngredient('recipe-chicken-base-bag', 'prod-paper-bag-consum', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.PACKAGING),
        recipeIngredient('recipe-chicken-base-extra-spinach', 'prod-spinach', 25, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.TOPPING, { required: false, optional: true, extraAvailable: true })
      ],
      notes: 'Pollo en prueba hasta validar coste real de produccion.'
    }),
    recipe({
      id: 'recipe-beef-premium',
      name: 'Ternera Premium',
      category: RECIPE_CATEGORIES.BEEF,
      status: RECIPE_STATUS.STANDBY,
      description: 'Linea premium en standby por coste alto.',
      currentSalePrice: 8,
      targetMargin: 0.5,
      estimatedFinalWeight: 375,
      allergens: [ALLERGENS.GLUTEN, ALLERGENS.LACTOSE],
      ingredients: [
        recipeIngredient('recipe-beef-premium-meat', 'prod-beef-premium-standby', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.MEAT),
        recipeIngredient('recipe-beef-premium-rice', 'prod-rice-basmati-cooked', 100, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.BASE),
        recipeIngredient('recipe-beef-premium-tortilla', 'prod-tortilla', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.BASE),
        recipeIngredient('recipe-beef-premium-cheese', 'prod-edam-cheese', 30, UNITS.GRAMS, RECIPE_INGREDIENT_GROUPS.TOPPING),
        recipeIngredient('recipe-beef-premium-bag', 'prod-paper-bag-consum', 1, UNITS.UNITS, RECIPE_INGREDIENT_GROUPS.PACKAGING)
      ],
      notes: 'No activa para produccion base; revisar solo como premium.'
    })
  ];

  const clients = [
    client({
      id: 'client-demo-001',
      name: 'Cliente prueba 1',
      alias: 'Trabajo',
      channel: 'whatsapp',
      deliveryZone: 'Zona por definir',
      preferences: ['cerdo bbq', 'extra queso'],
      allergies: []
    }),
    client({
      id: 'client-demo-002',
      name: 'Cliente prueba 2',
      alias: 'Instagram',
      channel: 'instagram',
      deliveryZone: 'Recogida',
      preferences: ['sin cebolla'],
      allergies: ['lactosa'],
      notes: 'Confirmar alergias antes de preparar.'
    })
  ];

  return createEmptyDatabase({
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      createdAt: CREATED_AT,
      updatedAt: CREATED_AT,
      seededAt: CREATED_AT
    },
    settings: DEFAULT_SETTINGS,
    products,
    suppliers,
    purchases,
    priceHistory,
    stockMovements,
    productionBatches,
    lots,
    recipes,
    clients,
    orders: [],
    feedback: []
  });
}

function recipe(fields) {
  return {
    id: fields.id,
    name: fields.name,
    category: fields.category,
    status: fields.status,
    description: fields.description ?? '',
    currentSalePrice: fields.currentSalePrice ?? 0,
    targetMargin: fields.targetMargin ?? 0,
    priceMultiplier: fields.priceMultiplier ?? null,
    allergens: fields.allergens ?? [],
    ingredients: fields.ingredients ?? [],
    estimatedFinalWeight: fields.estimatedFinalWeight ?? 0,
    notes: fields.notes ?? '',
    active: fields.status !== RECIPE_STATUS.RETIRED,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  };
}

function recipeIngredient(id, productId, quantity, unit, group, options = {}) {
  return {
    id,
    productId,
    quantity,
    unit,
    required: options.required ?? true,
    group,
    optional: options.optional ?? false,
    extraAvailable: options.extraAvailable ?? false
  };
}

function product(fields) {
  return {
    id: fields.id,
    name: fields.name,
    category: fields.category,
    subcategory: fields.subcategory ?? '',
    baseUnit: fields.baseUnit,
    stockType: fields.stockType,
    stockMinimum: fields.stockMinimum ?? 0,
    currentUnitCost: fields.currentUnitCost ?? null,
    estimatedUnitCost: fields.estimatedUnitCost ?? null,
    costSource: fields.costSource ?? 'none',
    preferredSupplierId: fields.preferredSupplierId ?? '',
    location: fields.location ?? STORAGE_LOCATIONS.PANTRY,
    requiresCold: fields.requiresCold ?? false,
    expirationDate: fields.expirationDate ?? null,
    openedAt: fields.openedAt ?? null,
    allergens: fields.allergens ?? [],
    notes: fields.notes ?? '',
    active: fields.active ?? true,
    status: fields.status ?? PRODUCT_STATUS.ACTIVE,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  };
}

function supplier(fields) {
  return {
    id: fields.id,
    name: fields.name,
    type: fields.type ?? 'otro',
    address: fields.address ?? '',
    city: fields.city ?? '',
    phone: fields.phone ?? '',
    whatsapp: fields.whatsapp ?? '',
    email: fields.email ?? '',
    schedule: fields.schedule ?? '',
    perceivedQuality: fields.perceivedQuality ?? 0,
    perceivedPrice: fields.perceivedPrice ?? 'medio',
    usualProducts: fields.usualProducts ?? [],
    notes: fields.notes ?? '',
    active: fields.active ?? true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  };
}

function client(fields) {
  return {
    id: fields.id,
    name: fields.name,
    alias: fields.alias ?? '',
    contact: fields.contact ?? '',
    channel: fields.channel ?? 'otro',
    deliveryZone: fields.deliveryZone ?? '',
    preferences: fields.preferences ?? [],
    allergies: fields.allergies ?? [],
    notes: fields.notes ?? '',
    totalOrders: fields.totalOrders ?? 0,
    totalSpent: fields.totalSpent ?? 0,
    active: fields.active ?? true,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  };
}

function purchaseItem(fields) {
  const unitCost = fields.unitCost ?? calculateUnitCost(fields.totalPrice, fields.quantity);
  return {
    id: fields.id,
    productId: fields.productId,
    quantity: fields.quantity,
    unit: fields.unit,
    totalPrice: fields.totalPrice,
    unitCost,
    expirationDate: fields.expirationDate ?? null,
    destinationLocation: fields.destinationLocation ?? '',
    notes: fields.notes ?? ''
  };
}

function lot(fields) {
  return {
    id: fields.id,
    lotCode: fields.lotCode,
    productId: fields.productId,
    initialQuantity: fields.initialQuantity,
    unit: fields.unit,
    unitCost: fields.unitCost,
    sourceType: fields.sourceType,
    sourceId: fields.sourceId,
    location: fields.location,
    cookedAt: fields.cookedAt ?? null,
    expiresAt: fields.expiresAt ?? null,
    status: fields.status ?? 'active',
    notes: fields.notes ?? '',
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  };
}

function movement(fields) {
  return {
    id: fields.id,
    productId: fields.productId,
    type: fields.type,
    quantity: fields.quantity,
    unit: fields.unit,
    direction: fields.direction,
    lotId: fields.lotId ?? '',
    fromLotId: fields.fromLotId ?? '',
    toLotId: fields.toLotId ?? '',
    referenceId: fields.referenceId,
    referenceType: fields.referenceType,
    date: fields.date ?? CREATED_AT,
    notes: fields.notes ?? ''
  };
}

function priceHistoryEntry(fields) {
  const normalized = getNormalizedPrice(fields.totalPrice, fields.quantity, fields.unit);
  return {
    id: fields.id,
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
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT
  };
}

function getNormalizedPrice(totalPrice, quantity, unit) {
  if (unit === UNITS.GRAMS) return { value: calculatePricePerKg(totalPrice, quantity), unit: 'kg' };
  if (unit === UNITS.MILLILITERS) return { value: calculateUnitCost(totalPrice, quantity) * 1000, unit: 'litro' };
  return { value: calculateUnitCost(totalPrice, quantity), unit: 'ud' };
}
