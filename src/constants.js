export const APP_VERSION = '0.14.0';
export const APP_STAGE = 'Etapa 14';
export const STORAGE_KEY = 'ramp-bites-control-panel:v1';
export const BACKUP_KEY = 'ramp-bites-control-panel:backup';
export const SCHEMA_VERSION = 1;

export const COLLECTIONS = [
  'products',
  'suppliers',
  'purchases',
  'priceHistory',
  'stockMovements',
  'productionBatches',
  'lots',
  'recipes',
  'clients',
  'orders',
  'feedback'
];

export const PRODUCT_CATEGORIES = {
  RAW_MEAT: 'carne_cruda',
  COOKED_MEAT: 'carne_cocida',
  CHICKEN: 'pollo',
  RICE: 'arroz',
  TORTILLA: 'tortilla',
  SAUCE: 'salsa',
  DAIRY: 'lacteo',
  VEGETABLE: 'verdura',
  SEASONING: 'condimento',
  BROTH: 'caldo',
  PACKAGING: 'packaging',
  OTHER: 'otro'
};

export const UNITS = {
  GRAMS: 'g',
  MILLILITERS: 'ml',
  UNITS: 'ud'
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

export const STORAGE_LOCATIONS = {
  PANTRY: 'despensa',
  FRIDGE: 'nevera',
  FREEZER: 'congelador'
};

export const PRODUCT_STATUS = {
  ACTIVE: 'active',
  STANDBY: 'standby',
  PREMIUM: 'premium',
  ARCHIVED: 'archived'
};

export const MOVEMENT_TYPES = {
  PURCHASE: 'compra',
  PRODUCTION_CONSUME: 'produccion_consumo',
  PRODUCTION_OUTPUT: 'produccion_resultado',
  FLAVORING: 'saborizacion',
  RESERVATION: 'reserva',
  RESERVATION_RELEASE: 'liberacion_reserva',
  SALE: 'venta',
  ADJUSTMENT: 'ajuste',
  WASTE: 'merma',
  OWN_CONSUMPTION: 'consumo_propio',
  GIFT: 'regalo',
  EXPIRY: 'vencimiento',
  RETURN: 'devolucion'
};

export const PRICE_UNITS = {
  KG: 'kg',
  LITER: 'litro',
  UNIT: 'ud'
};

export const PRODUCTION_STATUS = {
  PLANNED: 'planificada',
  COOKING: 'cocinando',
  FINISHED: 'finalizada',
  STORED: 'almacenada',
  PENDING: 'pendiente',
  DISCARDED: 'descartada'
};

export const RECIPE_CATEGORIES = {
  PORK: 'cerdo',
  CHICKEN: 'pollo',
  BEEF: 'ternera',
  VEGETARIAN: 'vegetariano',
  OTHER: 'otro'
};

export const RECIPE_STATUS = {
  ACTIVE: 'activo',
  TEST: 'prueba',
  STANDBY: 'standby',
  RETIRED: 'retirado'
};

export const RECIPE_INGREDIENT_GROUPS = {
  MEAT: 'carne',
  BASE: 'base',
  SAUCE: 'salsa',
  TOPPING: 'topping',
  PACKAGING: 'packaging'
};

export const ORDER_STATUS = {
  DRAFT: 'borrador',
  PENDING: 'pendiente',
  CONFIRMED: 'confirmado',
  IN_PRODUCTION: 'en_produccion',
  READY: 'listo',
  DELIVERED: 'entregado',
  CANCELLED: 'cancelado'
};

export const CLIENT_CHANNELS = {
  WHATSAPP: 'whatsapp',
  INSTAGRAM: 'instagram',
  WORK: 'trabajo',
  FRIEND: 'amigo',
  OTHER: 'otro'
};

export const PAYMENT_METHODS = {
  CASH: 'efectivo',
  BIZUM: 'bizum',
  TRANSFER: 'transferencia',
  OTHER: 'otro'
};

export const ALLERGENS = {
  GLUTEN: 'gluten',
  LACTOSE: 'lactosa',
  EGG: 'huevo',
  SOY: 'soja',
  NUTS: 'frutos_secos',
  SESAME: 'sesamo',
  MUSTARD: 'mostaza',
  CELERY: 'apio',
  SULFITES: 'sulfitos'
};

export const DEFAULT_SETTINGS = {
  businessName: 'Ramp Bites',
  currency: 'EUR',
  locale: 'es-ES',
  priceMultipliers: {
    minimum: 2,
    healthy: 2.5,
    premium: 3
  },
  cookedFridgeMaxDays: 2,
  cookedFrozenMaxDays: 30,
  lowStockThreshold: 5,
  defaultMeatPerBurritoG: 100,
  targetBasePrice: 5,
  demoMode: true,
  beefStatusNote: 'Ternera en standby por coste alto',
  backend: {
    baseUrl: 'http://127.0.0.1:8787/api',
    syncMode: 'manual',
    lastStatus: '',
    lastCheckedAt: '',
    lastSyncAt: ''
  },
  security: {
    localAuthEnabled: false,
    adminPinHash: '',
    adminPinSalt: '',
    adminSessionMinutes: 30,
    lastPinChangedAt: '',
    lastUnlockedAt: '',
    lastLockedAt: ''
  }
};

export const ROUTES = [
  { name: 'dashboard', label: 'Dashboard' },
  { name: 'products', label: 'Productos' },
  { name: 'suppliers', label: 'Proveedores' },
  { name: 'purchases', label: 'Compras' },
  { name: 'priceHistory', label: 'Historial precios' },
  { name: 'stock', label: 'Stock' },
  { name: 'production', label: 'Produccion' },
  { name: 'lots', label: 'Lotes' },
  { name: 'expiry', label: 'Caducidad' },
  { name: 'recipes', label: 'Recetas' },
  { name: 'simulator', label: 'Simulador' },
  { name: 'kitchen', label: 'Cocina' },
  { name: 'clients', label: 'Clientes' },
  { name: 'orders', label: 'Pedidos' },
  { name: 'reports', label: 'Reportes' },
  { name: 'settings', label: 'Configuracion' }
];
