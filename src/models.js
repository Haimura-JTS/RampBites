import { COLLECTIONS, DEFAULT_SETTINGS, SCHEMA_VERSION } from './constants.js';

export const MODEL_DEFINITIONS = {
  Product: {
    id: 'string',
    name: 'string',
    category: 'string',
    subcategory: 'string',
    baseUnit: 'g | ml | ud',
    stockType: 'string',
    stockMinimum: 'number',
    currentUnitCost: 'number',
    estimatedUnitCost: 'number',
    costSource: 'real | estimated | none',
    preferredSupplierId: 'string',
    location: 'despensa | nevera | congelador',
    requiresCold: 'boolean',
    expirationDate: 'ISO_DATE | null',
    openedAt: 'ISO_DATE | null',
    allergens: 'string[]',
    notes: 'string',
    active: 'boolean',
    status: 'active | standby | premium | archived',
    createdAt: 'ISO_DATE',
    updatedAt: 'ISO_DATE'
  },
  Supplier: {
    id: 'string',
    name: 'string',
    type: 'carniceria | supermercado | mayorista | online | otro',
    address: 'string',
    city: 'string',
    phone: 'string',
    whatsapp: 'string',
    email: 'string',
    schedule: 'string',
    perceivedQuality: 'number',
    perceivedPrice: 'barato | medio | caro',
    usualProducts: 'string[]',
    notes: 'string',
    active: 'boolean'
  },
  Purchase: {
    id: 'string',
    date: 'ISO_DATE',
    supplierId: 'string',
    items: 'PurchaseItem[]',
    calculatedTotal: 'number',
    ticketTotal: 'number',
    difference: 'number',
    ticketReference: 'string',
    notes: 'string'
  },
  PurchaseItem: {
    id: 'string',
    productId: 'string',
    quantity: 'number',
    unit: 'g | ml | ud',
    totalPrice: 'number',
    unitCost: 'number',
    expirationDate: 'ISO_DATE | null',
    destinationLocation: 'string',
    notes: 'string'
  },
  StockMovement: {
    id: 'string',
    productId: 'string',
    type: 'string',
    quantity: 'number',
    unit: 'g | ml | ud',
    direction: '1 | -1',
    lotId: 'string',
    fromLotId: 'string',
    toLotId: 'string',
    referenceId: 'string',
    referenceType: 'string',
    date: 'ISO_DATE',
    notes: 'string'
  },
  PriceHistory: {
    id: 'string',
    productId: 'string',
    supplierId: 'string',
    purchaseId: 'string',
    purchaseItemId: 'string',
    date: 'ISO_DATE',
    quantity: 'number',
    unit: 'g | ml | ud',
    totalPrice: 'number',
    unitCost: 'number',
    normalizedPrice: 'number',
    normalizedUnit: 'kg | litro | ud'
  },
  ProductionBatch: {
    id: 'string',
    batchCode: 'string',
    type: 'cerdo | pollo | ternera | otro',
    status: 'planificada | cocinando | finalizada | almacenada | agotada | descartada | pendiente',
    date: 'ISO_DATE',
    startTime: 'HH:mm',
    endTime: 'HH:mm',
    durationMinutes: 'number',
    method: 'olla | presion | slow cooker | horno',
    rawProductId: 'string',
    rawLotId: 'string',
    rawWeightUsed: 'number',
    meatCost: 'number',
    inputs: 'ProductionInput[]',
    liquidInitialMl: 'number',
    brothTotalMl: 'number',
    brothLeftMl: 'number',
    heatLevel: 'string',
    drainedWeight: 'number | null',
    finalWeight: 'number',
    totalCost: 'number',
    yieldRatio: 'number | null',
    wasteGrams: 'number',
    wastePercentage: 'number',
    finalCostPerGram: 'number | null',
    finalCostPer100g: 'number | null',
    resultProductId: 'string | null',
    resultLotId: 'string | null',
    location: 'nevera | congelador',
    expiresAt: 'ISO_DATE',
    frozen: 'boolean'
  },
  ProductionInput: {
    productId: 'string',
    lotId: 'string',
    quantity: 'number',
    unit: 'g | ml | ud',
    cost: 'number'
  },
  Lot: {
    id: 'string',
    lotCode: 'string',
    productId: 'string',
    initialQuantity: 'number',
    unit: 'g | ml | ud',
    unitCost: 'number',
    sourceType: 'purchase | production',
    sourceId: 'string',
    location: 'string',
    cookedAt: 'ISO_DATE | null',
    expiresAt: 'ISO_DATE | null',
    status: 'active | reserved | consumed | expired | discarded | agotado | descartado'
  },
  Recipe: {
    id: 'string',
    name: 'string',
    category: 'cerdo | pollo | ternera | vegetariano | otro',
    status: 'activo | prueba | standby | retirado',
    description: 'string',
    currentSalePrice: 'number',
    targetMargin: 'number',
    priceMultiplier: 'number',
    ingredients: 'RecipeIngredient[]',
    allergens: 'string[]',
    estimatedFinalWeight: 'number',
    notes: 'string',
    active: 'boolean',
    createdAt: 'ISO_DATE',
    updatedAt: 'ISO_DATE'
  },
  RecipeIngredient: {
    id: 'string',
    productId: 'string',
    quantity: 'number',
    unit: 'g | ml | ud',
    required: 'boolean',
    group: 'carne | base | salsa | topping | packaging',
    optional: 'boolean',
    extraAvailable: 'boolean'
  },
  Client: {
    id: 'string',
    name: 'string',
    alias: 'string',
    contact: 'string',
    channel: 'whatsapp | instagram | trabajo | amigo | otro',
    deliveryZone: 'string',
    preferences: 'string[]',
    allergies: 'string[]',
    notes: 'string',
    totalOrders: 'number',
    totalSpent: 'number',
    active: 'boolean',
    createdAt: 'ISO_DATE',
    updatedAt: 'ISO_DATE'
  },
  Order: {
    id: 'string',
    orderNumber: 'string',
    clientId: 'string',
    orderDate: 'ISO_DATE',
    deliveryDate: 'ISO_DATE | null',
    deliveryTime: 'HH:mm',
    status: 'borrador | pendiente | confirmado | en_produccion | listo | entregado | cancelado',
    items: 'OrderItem[]',
    subtotal: 'number',
    discount: 'number',
    total: 'number',
    estimatedCost: 'number',
    estimatedProfit: 'number',
    paid: 'boolean',
    paymentMethod: 'efectivo | bizum | transferencia | otro',
    notes: 'string'
  },
  OrderItem: {
    recipeId: 'string',
    quantity: 'number',
    unitPrice: 'number',
    unitCost: 'number',
    extras: 'string[]',
    excludedIngredientIds: 'string[]',
    assignedLotId: 'string | null',
    notes: 'string'
  },
  Feedback: {
    id: 'string',
    clientId: 'string',
    orderId: 'string',
    taste: 'number',
    size: 'number',
    price: 'number',
    texture: 'string',
    wouldRepeat: 'boolean',
    comment: 'string',
    suggestions: 'string',
    createdAt: 'ISO_DATE'
  },
  Settings: {
    businessName: 'string',
    currency: 'EUR',
    priceMultipliers: 'object',
    cookedFridgeMaxDays: 'number',
    cookedFrozenMaxDays: 'number',
    lowStockThreshold: 'number',
    demoMode: 'boolean'
  }
};

export function createBaseEntity(fields = {}) {
  const now = new Date().toISOString();
  return {
    id: fields.id,
    createdAt: fields.createdAt ?? now,
    updatedAt: fields.updatedAt ?? now,
    ...fields
  };
}

export function createEmptyDatabase(overrides = {}) {
  const safeOverrides = isPlainObject(overrides) ? overrides : {};
  const now = new Date().toISOString();
  const database = {
    schemaVersion: SCHEMA_VERSION,
    metadata: {
      createdAt: now,
      updatedAt: now,
      seededAt: null
    },
    settings: structuredCloneSafe(DEFAULT_SETTINGS)
  };

  for (const collection of COLLECTIONS) {
    database[collection] = [];
  }

  return {
    ...database,
    ...safeOverrides,
    metadata: {
      ...database.metadata,
      ...(isPlainObject(safeOverrides.metadata) ? safeOverrides.metadata : {})
    },
    settings: {
      ...database.settings,
      ...(isPlainObject(safeOverrides.settings) ? safeOverrides.settings : {}),
      backend: {
        ...database.settings.backend,
        ...(isPlainObject(safeOverrides.settings?.backend) ? safeOverrides.settings.backend : {})
      },
      priceMultipliers: {
        ...database.settings.priceMultipliers,
        ...(isPlainObject(safeOverrides.settings?.priceMultipliers) ? safeOverrides.settings.priceMultipliers : {})
      }
    }
  };
}

export function normalizeDatabase(input = {}) {
  const source = isPlainObject(input) ? input : {};
  const normalized = createEmptyDatabase(source);
  normalized.schemaVersion = SCHEMA_VERSION;

  for (const collection of COLLECTIONS) {
    normalized[collection] = Array.isArray(source[collection]) ? source[collection] : [];
  }

  return normalized;
}

export function migrateDatabase(input = {}) {
  if (!isPlainObject(input)) {
    throw new Error('La base de datos debe ser un objeto.');
  }

  const fromVersion = Number(input.schemaVersion ?? 0);
  if (!Number.isFinite(fromVersion) || fromVersion < 0) {
    throw new Error('schemaVersion invalido.');
  }
  if (fromVersion > SCHEMA_VERSION) {
    throw new Error(`Version de esquema futura no soportada: ${fromVersion}.`);
  }

  const migrated = normalizeDatabase(input);
  if (fromVersion < SCHEMA_VERSION) {
    migrated.metadata = {
      ...(migrated.metadata ?? {}),
      migratedAt: new Date().toISOString(),
      migratedFromSchemaVersion: fromVersion,
      migratedToSchemaVersion: SCHEMA_VERSION
    };
  }
  migrated.schemaVersion = SCHEMA_VERSION;
  return migrated;
}

function structuredCloneSafe(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}
