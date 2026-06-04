/**
 * Constantes iniciales.
 *
 * Etapa 0: catalogo base alineado con docs.
 * Etapa 1: estas constantes se usaran en seed, vistas y validaciones.
 */

export const PRODUCT_CATEGORIES = {
  RAW_MEAT: 'raw_meat',
  COOKED_MEAT: 'cooked_meat',
  INGREDIENT: 'ingredient',
  SAUCE: 'sauce',
  SEASONING: 'seasoning',
  BROTH: 'broth',
  PACKAGING: 'packaging',
  FINISHED_PRODUCT: 'finished_product'
};

export const UNITS = {
  GRAMS: 'g',
  MILLILITERS: 'ml',
  UNITS: 'unit'
};

export const STOCK_TYPES = {
  RAW: 'raw',
  COOKED_NEUTRAL: 'cooked_neutral',
  FLAVORED: 'flavored',
  FROZEN: 'frozen',
  REFRIGERATED: 'refrigerated',
  DRY: 'dry',
  PACKAGING: 'packaging'
};

export const STORAGE_STATES = {
  REFRIGERATED: 'refrigerated',
  FROZEN: 'frozen',
  DRY: 'dry',
  AMBIENT: 'ambient'
};

export const FLAVORS = {
  NEUTRAL: 'neutral',
  BBQ: 'bbq',
  HONEY_MUSTARD: 'honey_mustard',
  SPICY: 'spicy',
  YOGURT_CREAMY: 'yogurt_creamy'
};

export const ALLERGENS = {
  GLUTEN: 'gluten',
  LACTOSE: 'lactose',
  EGG: 'egg',
  SOY: 'soy',
  NUTS: 'nuts',
  SESAME: 'sesame',
  MUSTARD: 'mustard',
  CELERY: 'celery',
  SULFITES: 'sulfites'
};

export const ORDER_STATES = {
  DRAFT: 'draft',
  CONFIRMED: 'confirmed',
  IN_PRODUCTION: 'in_production',
  READY: 'ready',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled'
};

export const MOVEMENT_TYPES = {
  PURCHASE: 'purchase',
  PRODUCTION_CONSUME: 'production_consume',
  PRODUCTION_OUTPUT: 'production_output',
  FLAVORING: 'flavoring',
  SALE: 'sale',
  WASTE: 'waste',
  SHRINKAGE: 'shrinkage',
  OWN_CONSUMPTION: 'own_consumption',
  GIFT: 'gift',
  TEST: 'test',
  ADJUSTMENT: 'adjustment'
};

export const PRICE_MULTIPLIERS = {
  MINIMUM: 2,
  HEALTHY: 2.5,
  PREMIUM: 3
};
