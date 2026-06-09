# Tech Stack Migration

Decision tecnica para la siguiente etapa de Ramp Bites Control Panel.

## Motivo

El proyecto ya no es una calculadora simple. La app gestiona productos, proveedores, compras, stock, producciones, lotes, caducidad, recetas, clientes, pedidos, costes, reportes, exportacion/importacion y simulacion. Mantener todo en JavaScript plano con LocalStorage como base principal aumenta el riesgo de datos inconsistentes y codigo dificil de mantener.

## Stack Objetivo

Construir una app web local-first profesional con:

- React.
- TypeScript.
- Vite.
- Dexie.js sobre IndexedDB como persistencia local principal.
- Zod para validacion de datos antes de guardar.
- Vitest para pruebas de calculos y servicios de dominio.
- CSS modular o CSS organizado por componentes.
- Arquitectura preparada para PWA futura.
- Arquitectura preparada para backend futuro con Node.js, Express, Prisma y SQLite/PostgreSQL.

No usar LocalStorage como base de datos principal.

LocalStorage queda limitado a:

- preferencias simples de usuario,
- tema visual,
- ultima pantalla visitada,
- configuracion menor no critica.

## Datos en IndexedDB

La persistencia real debe vivir en IndexedDB usando Dexie.js.

Stores minimos:

- `products`
- `suppliers`
- `purchases`
- `purchaseItems`
- `stockMovements`
- `productionBatches`
- `productionInputs`
- `lots`
- `recipes`
- `recipeIngredients`
- `clients`
- `orders`
- `orderItems`
- `feedback`
- `settings`
- `backups`
- `reportCache`

## Estructura Objetivo

```txt
/index.html
/package.json
/vite.config.ts
/tsconfig.json
/README.md
/CHANGELOG.md
/TODO_NEXT_STAGE.md

/src/main.tsx
/src/App.tsx
/src/router.tsx

/src/db/db.ts
/src/db/schema.ts
/src/db/seed.ts
/src/db/migrations.ts
/src/types/index.ts
/src/types/product.ts
/src/types/supplier.ts
/src/types/purchase.ts
/src/types/stock.ts
/src/types/production.ts
/src/types/recipe.ts
/src/types/client.ts
/src/types/order.ts
/src/types/settings.ts

/src/schemas/productSchema.ts
/src/schemas/supplierSchema.ts
/src/schemas/purchaseSchema.ts
/src/schemas/productionSchema.ts
/src/schemas/recipeSchema.ts
/src/schemas/clientSchema.ts
/src/schemas/orderSchema.ts

/src/services/productService.ts
/src/services/supplierService.ts
/src/services/purchaseService.ts
/src/services/stockService.ts
/src/services/productionService.ts
/src/services/recipeService.ts
/src/services/orderService.ts
/src/services/reportService.ts

/src/utils/calculations.ts
/src/utils/formatters.ts
/src/utils/dates.ts
/src/utils/ids.ts

/src/pages/DashboardPage.tsx
/src/pages/ProductsPage.tsx
/src/pages/SuppliersPage.tsx
/src/pages/PurchasesPage.tsx
/src/pages/StockPage.tsx
/src/pages/ProductionPage.tsx
/src/pages/LotsPage.tsx
/src/pages/RecipesPage.tsx
/src/pages/SimulatorPage.tsx
/src/pages/ClientsPage.tsx
/src/pages/OrdersPage.tsx
/src/pages/ReportsPage.tsx
/src/pages/SettingsPage.tsx

/src/components/layout/AppLayout.tsx
/src/components/layout/Sidebar.tsx
/src/components/layout/Header.tsx

/src/components/ui/Button.tsx
/src/components/ui/Input.tsx
/src/components/ui/Select.tsx
/src/components/ui/Card.tsx
/src/components/ui/Table.tsx
/src/components/ui/Modal.tsx
/src/components/ui/Toast.tsx
/src/components/ui/Badge.tsx
/src/components/ui/Tabs.tsx

/src/styles/global.css
/src/styles/theme.css

/src/test/calculations.test.ts
/src/test/stock.test.ts
/src/test/recipes.test.ts
/src/test/production.test.ts

/docs/ARCHITECTURE.md
/docs/BACKEND_PLAN.md
/docs/ROADMAP.md
```

## Dependencias Base

```bash
npm create vite@latest ramp-bites-control-panel -- --template react-ts
npm install dexie zod
npm install -D vitest
```

Opcionales, solo si aportan valor:

```bash
npm install @tanstack/react-table
npm install lucide-react
```

## Reglas Obligatorias

1. Toda entidad debe tener tipos TypeScript.
2. Toda entrada importante debe validarse con Zod antes de guardarse.
3. Los calculos de negocio deben estar en funciones puras dentro de `src/utils/calculations.ts`.
4. Las pantallas no deben contener logica compleja de negocio.
5. La base Dexie debe estar centralizada en `src/db/db.ts`.
6. El acceso a datos debe hacerse mediante servicios y repositorios internos cuando el modulo lo requiera.
7. El seed inicial debe ser reproducible.
8. Debe existir exportacion/importacion JSON.
9. Antes de modificar datos criticos, crear backup interno si corresponde.
10. El proyecto debe poder ejecutarse con `npm install` y `npm run dev`.
11. Los tests deben ejecutarse con `npm run test`.

## Estrategia de Migracion

### Etapa 17 - Base React/Dexie

- Crear Vite + React + TypeScript.
- Mantener export JSON del MVP actual como puente.
- Crear Dexie schema inicial y migraciones.
- Crear tipos TypeScript de entidades.
- Crear schemas Zod.
- Migrar calculos puros a `src/utils/calculations.ts`.
- Crear app shell React y paginas base.
- Cargar seed en IndexedDB.
- Crear tests Vitest de calculos.
- Aplicar `docs/PROMPTS_2_9_GLOBAL_RULES.md` para el resto de etapas.

### Etapa 18 - Migrar Modulos Operativos

- Productos, proveedores, compras y stock mediante servicios que lean y escriban en Dexie.
- Formularios con Zod.
- Movimientos de stock transaccionales cuando sea posible.
- Dashboard leyendo desde IndexedDB.

### Etapa 19 - Produccion, Lotes, Recetas y Simulador

- `stockService.ts`, `productionService.ts`, `recipeService.ts`.
- Produccion con movimientos trazables.
- Lotes y caducidad desde IndexedDB.
- Recetas, extras y simulador con stock real.

### Etapa 20 - Clientes, Pedidos, Reportes y Exportaciones

- `clientsRepo.ts`, `ordersRepo.ts`, `orderService.ts`.
- Pedidos con coste, margen y stock necesario.
- `reportService.ts` con consultas IndexedDB.
- Export JSON y CSV.

### Etapa 21 - QA y Backend Futuro

- Tests Vitest de calculos, stock, recetas, produccion y pedidos.
- Revision de tipos.
- Revision de validaciones Zod.
- Revision de repositorios.
- Plan backend con Node.js, Express, Prisma, SQLite y PostgreSQL.

## Riesgos

- La migracion no debe perder los datos exportados del MVP actual.
- IndexedDB requiere flujos async en UI y servicios.
- Las transacciones Dexie deben proteger operaciones de stock conectadas.
- La app actual seguira funcionando hasta que la version React/Dexie alcance paridad minima.
