/**
 * Seed Data - Datos Iniciales
 * 
 * Datos reales del proyecto para cargar en nueva instalación:
 * - Productos (carnes, insumos)
 * - Proveedores (carnicería)
 * - Compras reales (datos documentados)
 * - Recetas base
 * 
 * ETAPA 0: Definidos en la solicitud del usuario
 * ETAPA 1: Será implementado aquí
 */

export const seedProducts = [
  // CARNES CRUDAS
  {
    id: 'prod-pork-neck',
    name: 'Cuello de cerdo sin hueso',
    category: 'raw_meat',
    unit: 'grams',
    description: 'Coll sense os - Producto principal',
    allergens: [],
    active: true
  },
  {
    id: 'prod-chicken-breast',
    name: 'Pechuga de pollo',
    category: 'raw_meat',
    unit: 'grams',
    description: 'Segunda línea de producción',
    allergens: [],
    active: true
  },
  {
    id: 'prod-beef-standby',
    name: 'Ternera',
    category: 'raw_meat',
    unit: 'grams',
    description: 'Standby/Premium - No activa por defecto',
    allergens: [],
    active: false
  },

  // INSUMOS
  {
    id: 'prod-broth-dry-pork',
    name: 'Caldo seco de carne',
    category: 'ingredient',
    unit: 'units',
    description: '2 unidades por 1,70€',
    allergens: ['gluten'],
    active: true
  },
  {
    id: 'prod-broth-dry-chicken',
    name: 'Caldo seco de pollo',
    category: 'ingredient',
    unit: 'units',
    description: '2 unidades por 1,50€',
    allergens: ['gluten'],
    active: true
  },
  {
    id: 'prod-sauce-yogurt',
    name: 'Salsa de yogur Salseo',
    category: 'ingredient',
    unit: 'milliliters',
    description: '300ml por 1,29€',
    allergens: ['lactose'],
    active: true
  },
  {
    id: 'prod-cheese-edam',
    name: 'Queso Edam para fundir',
    category: 'ingredient',
    unit: 'grams',
    description: '200g por 1,44€',
    allergens: ['lactose'],
    active: true
  },
  {
    id: 'prod-tortilla',
    name: 'Tortilla de trigo',
    category: 'ingredient',
    unit: 'units',
    description: '~100g por tortilla',
    allergens: ['gluten'],
    active: true
  },
  {
    id: 'prod-rice-cooked',
    name: 'Arroz basmati cocido',
    category: 'ingredient',
    unit: 'grams',
    description: '100g por ración',
    allergens: [],
    active: true
  },

  // PACKAGING
  {
    id: 'prod-bag-paper',
    name: 'Bolsas de papel Consum',
    category: 'packaging',
    unit: 'units',
    description: '30 unidades por 1,95€',
    allergens: [],
    active: true
  }
];

export const seedSuppliers = [
  {
    id: 'supp-carni-1',
    name: 'Carnicería local 1',
    contact: 'Juan García',
    email: 'juan@carnilocal.com',
    phone: '555-0001',
    city: 'Barcelona',
    active: true
  }
];

export const seedPurchases = [
  {
    id: 'purchase-001',
    productId: 'prod-pork-neck',
    supplierId: 'supp-carni-1',
    quantity: 2.385,
    unit: 'grams',
    priceTotal: 26.21,
    pricePerUnit: 10.99, // EUR/kg
    date: '2026-06-04',
    batch: 'CARNI-001',
    paid: true,
    paidAt: '2026-06-04',
    notes: 'Compra real documentada. Peso real 2.385g vs 2kg solicitado'
  }
];

export const seedRecipes = [
  {
    id: 'recipe-burrito-bbq',
    name: 'Burrito Cerdo BBQ',
    description: 'Nuestro clásico: cerdo desmechado BBQ',
    servingSize: 380,
    ingredients: [
      {
        productId: 'prod-cooked-pork-bbq',
        quantity: 100,
        unit: 'grams',
        flavor: 'bbq'
      },
      {
        productId: 'prod-rice-cooked',
        quantity: 100,
        unit: 'grams'
      },
      {
        productId: 'prod-tortilla',
        quantity: 1,
        unit: 'units'
      },
      {
        productId: 'prod-cheese-edam',
        quantity: 30,
        unit: 'grams'
      }
    ],
    allergens: ['gluten', 'lactose'],
    active: true,
    createdBy: 'system'
  },
  {
    id: 'recipe-burrito-honey-mustard',
    name: 'Burrito Cerdo Mostaza-Miel',
    description: 'Dulce y ácido: mostaza + miel',
    servingSize: 380,
    ingredients: [
      {
        productId: 'prod-cooked-pork-honey-mustard',
        quantity: 100,
        unit: 'grams',
        flavor: 'honey_mustard'
      },
      {
        productId: 'prod-rice-cooked',
        quantity: 100,
        unit: 'grams'
      },
      {
        productId: 'prod-tortilla',
        quantity: 1,
        unit: 'units'
      }
    ],
    allergens: ['gluten', 'mustard'],
    active: true,
    createdBy: 'system'
  }
];

export function getSeedData() {
  // TODO: Implementar en ETAPA 1
  // Retorna objeto con todos los datos iniciales
  return {
    products: seedProducts,
    suppliers: seedSuppliers,
    purchases: seedPurchases,
    recipes: seedRecipes
  };
}

export function loadSeedDataIfEmpty(storage) {
  // TODO: Implementar en ETAPA 1
  // Carga seed si storage está vacío
  // - Verificar si productos existen
  // - Si no, cargar todos los seed data
  console.log('Loading seed data...');
}
