import {
  clearStoredBackendAuthToken,
  createRampBitesApiClient,
  DEFAULT_API_BASE_URL,
  setStoredBackendAuthToken
} from './apiClient.js';
import {
  hasAdminPin,
  lockAdminSession,
  requestAdminUnlock,
  setAdminPin,
  unlockAdminSession
} from './auth.js';
import { APP_STAGE, APP_VERSION, DEFAULT_SETTINGS, ORDER_STATUS, PAYMENT_METHODS, STOCK_TYPES } from './constants.js';
import { calculateLotSummaries } from './calculations.js';
import { buildCsvExport } from './exporters.js';
import {
  createManualBackup,
  exportData,
  getData,
  importData,
  listBackups,
  loadBackendDataIfEnabled,
  loadSeedData,
  resetData,
  restoreBackup,
  saveData,
  isBackendMirrorEnabled
} from './storage.js';
import { syncCollectionsWithBackend } from './sync.js';
import { router } from './router.js';
import { orderItemRow } from './views/ordersView.js';
import { productionInputRow } from './views/productionView.js';
import { purchaseItemRow } from './views/purchasesView.js';
import { recipeIngredientRow } from './views/recipesView.js';
import {
  completeProductionBatch,
  createStockMovement,
  deactivateClient,
  deactivateProduct,
  deactivateSupplier,
  duplicateRecipe,
  deliverOrder,
  flavorLot,
  markOrderPaid,
  markLotDiscarded,
  saveClient,
  saveFeedback,
  saveOrder,
  saveProduct,
  saveProductionBatch,
  savePurchase,
  saveRecipe,
  saveSettings,
  setOrderStatus,
  setRecipeStatus,
  saveSupplier
} from './services/businessService.js';

const THEME_STORAGE_KEY = 'ramp-bites-control-panel:theme';
const KITCHEN_CHECKLIST_KEY = 'ramp-bites-control-panel:kitchen-checklist';
const KITCHEN_TIMER_KEY = 'ramp-bites-control-panel:kitchen-timer';

let deferredInstallPrompt = null;
const kitchenTimer = {
  intervalId: null,
  remainingSeconds: null
};

function bootstrap() {
  loadSeedData();
  applyStoredTheme();
  renderShell();
  bindShellActions();
  registerServiceWorker();

  router.init({
    mainElement: document.querySelector('[data-app-main]'),
    navElement: document.querySelector('[data-app-nav]'),
    context: {
      getData,
      actions: {
        exportData,
        importData,
        listBackups,
        resetData,
        rerender: () => router.renderFromHash()
      },
      afterRender: bindViewActions
    }
  });

  hydrateBackendOnBoot();
}

function renderShell() {
  const app = document.getElementById('app');
  const storageMode = isBackendMirrorEnabled(getData()) ? 'LocalStorage + API espejo' : 'LocalStorage';
  app.innerHTML = `
    <header class="app-header">
      <div>
        <p class="eyebrow">Panel interno</p>
        <h1>Ramp Bites Control Panel</h1>
      </div>
      <div class="header-actions">
        <button class="btn btn-small btn-secondary" type="button" data-action="toggle-theme" aria-pressed="false">Modo oscuro</button>
        <button class="btn btn-small" type="button" data-action="install-app" hidden>Instalar</button>
        <span class="version-pill">v${APP_VERSION}</span>
      </div>
    </header>

    <a class="skip-link" href="#app-main">Saltar al contenido</a>

    <div class="app-shell">
      <nav class="app-nav" aria-label="Navegacion principal" data-app-nav></nav>
      <main class="app-main" id="app-main" tabindex="-1" data-app-main></main>
    </div>

    <footer class="app-footer">
      <span>${APP_STAGE}</span>
      <span data-storage-mode>${storageMode}</span>
      <span>Version ${APP_VERSION}</span>
    </footer>
    <div class="toast-region" aria-live="polite" aria-atomic="true" data-toast-region></div>
  `;
}

async function hydrateBackendOnBoot() {
  try {
    const result = await loadBackendDataIfEnabled();
    if (!result.loaded) return;
    showToast('Datos cargados desde backend.', 'success');
    syncStorageModeLabel();
    router.renderFromHash();
  } catch (error) {
    showToast(`Backend no disponible: ${error.message}`, 'warning');
  }
}

function syncStorageModeLabel() {
  const label = document.querySelector('[data-storage-mode]');
  if (label) label.textContent = isBackendMirrorEnabled(getData()) ? 'LocalStorage + API espejo' : 'LocalStorage';
}

function bindShellActions() {
  document.querySelector('[data-action="toggle-theme"]')?.addEventListener('click', () => {
    const isDark = document.documentElement.dataset.theme === 'dark';
    setStoredTheme(isDark ? 'light' : 'dark');
  });

  document.querySelector('[data-action="install-app"]')?.addEventListener('click', async () => {
    if (!deferredInstallPrompt) {
      showToast('Instalacion no disponible en este navegador.', 'info');
      return;
    }

    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    syncInstallButton();
  });

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferredInstallPrompt = event;
    syncInstallButton();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    syncInstallButton();
    showToast('App instalada.', 'success');
  });

  syncThemeButton();
  syncInstallButton();
}

function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch((error) => {
      console.warn('No se pudo registrar el service worker.', error);
    });
  });
}

function bindViewActions() {
  bindProductActions();
  bindSupplierActions();
  bindPurchaseActions();
  bindProductionActions();
  bindLotActions();
  bindRecipeActions();
  bindSimulatorActions();
  bindClientActions();
  bindOrderActions();
  bindKitchenActions();
  bindStockActions();
  bindSettingsActions();
  bindSecurityActions();
  bindBackupActions();
  bindBackendActions();
}

function bindProductActions() {
  const form = document.querySelector('[data-form="product"]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = formToObject(form);
    input.requiresCold = Boolean(form.elements.requiresCold?.checked);
    input.active = true;

    const result = saveProduct(getData(), input);
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');

    saveData(result.data);
    showToast('Producto guardado.', 'success');
    router.renderFromHash();
  });

  document.querySelector('[data-action="clear-product-form"]')?.addEventListener('click', () => {
    clearForm(form);
  });

  document.querySelectorAll('[data-action="edit-product"]').forEach((button) => {
    button.addEventListener('click', () => {
      const product = getData().products.find((item) => item.id === button.dataset.id);
      if (!product || !form) return;
      fillForm(form, {
        ...product,
        allergens: product.allergens?.join(', ') ?? ''
      });
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('[data-action="view-product"]').forEach((button) => {
    button.addEventListener('click', () => {
      const product = getData().products.find((item) => item.id === button.dataset.id);
      if (!product) return;
      window.alert([
        product.name,
        `Categoria: ${product.category}`,
        `Unidad: ${product.baseUnit}`,
        `Ubicacion: ${product.location}`,
        `Notas: ${product.notes || 'Sin notas'}`
      ].join('\n'));
    });
  });

  document.querySelectorAll('[data-action="deactivate-product"]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('Desactivar producto?')) return;
      const result = deactivateProduct(getData(), button.dataset.id);
      if (!result.ok) return showToast(result.errors.join(' '), 'danger');
      saveData(result.data);
      showToast('Producto desactivado.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelectorAll('[data-filter]').forEach((input) => {
    input.addEventListener('input', filterProducts);
    input.addEventListener('change', filterProducts);
  });
}

function bindSupplierActions() {
  const form = document.querySelector('[data-form="supplier"]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = saveSupplier(getData(), formToObject(form));
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');
    saveData(result.data);
    showToast('Proveedor guardado.', 'success');
    router.renderFromHash();
  });

  document.querySelector('[data-action="clear-supplier-form"]')?.addEventListener('click', () => clearForm(form));

  document.querySelectorAll('[data-action="edit-supplier"]').forEach((button) => {
    button.addEventListener('click', () => {
      const supplier = getData().suppliers.find((item) => item.id === button.dataset.id);
      if (!supplier || !form) return;
      fillForm(form, {
        ...supplier,
        usualProducts: supplier.usualProducts?.join(', ') ?? ''
      });
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('[data-action="view-supplier"]').forEach((button) => {
    button.addEventListener('click', () => {
      const data = getData();
      const supplier = data.suppliers.find((item) => item.id === button.dataset.id);
      const purchases = data.purchases.filter((purchase) => purchase.supplierId === button.dataset.id);
      if (!supplier) return;
      window.alert(`${supplier.name}\nCompras asociadas: ${purchases.length}`);
    });
  });

  document.querySelectorAll('[data-action="deactivate-supplier"]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('Desactivar proveedor?')) return;
      const result = deactivateSupplier(getData(), button.dataset.id);
      if (!result.ok) return showToast(result.errors.join(' '), 'danger');
      saveData(result.data);
      showToast('Proveedor desactivado.', 'success');
      router.renderFromHash();
    });
  });
}

function bindClientActions() {
  const form = document.querySelector('[data-form="client"]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = formToObject(form);
    input.active = true;
    const result = saveClient(getData(), input);
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');
    saveData(result.data);
    showToast('Cliente guardado.', 'success');
    router.renderFromHash();
  });

  document.querySelector('[data-action="clear-client-form"]')?.addEventListener('click', () => clearForm(form));

  document.querySelectorAll('[data-action="edit-client"]').forEach((button) => {
    button.addEventListener('click', () => {
      const client = getData().clients.find((item) => item.id === button.dataset.id);
      if (!client || !form) return;
      fillForm(form, {
        ...client,
        preferences: client.preferences?.join(', ') ?? '',
        allergies: client.allergies?.join(', ') ?? ''
      });
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('[data-action="view-client-history"]').forEach((button) => {
    button.addEventListener('click', () => {
      const data = getData();
      const client = data.clients.find((item) => item.id === button.dataset.id);
      const orders = data.orders.filter((order) => order.clientId === button.dataset.id);
      if (!client) return;
      window.alert([
        client.name,
        `Pedidos: ${orders.length}`,
        `Entregados: ${orders.filter((order) => order.status === ORDER_STATUS.DELIVERED).length}`,
        `Preferencias: ${client.preferences?.join(', ') || 'sin datos'}`,
        `Alergias: ${client.allergies?.join(', ') || 'sin datos'}`
      ].join('\n'));
    });
  });

  document.querySelectorAll('[data-action="deactivate-client"]').forEach((button) => {
    button.addEventListener('click', () => {
      if (!window.confirm('Desactivar cliente?')) return;
      const result = deactivateClient(getData(), button.dataset.id);
      if (!result.ok) return showToast(result.errors.join(' '), 'danger');
      saveData(result.data);
      showToast('Cliente desactivado.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelector('[data-filter="client-search"]')?.addEventListener('input', filterClients);
}

function bindPurchaseActions() {
  const form = document.querySelector('[data-form="purchase"]');

  document.querySelector('[data-action="add-purchase-item"]')?.addEventListener('click', () => {
    document.querySelector('[data-purchase-items]')?.insertAdjacentHTML('beforeend', purchaseItemRow(getData()));
  });

  document.querySelector('[data-purchase-items]')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="remove-purchase-item"]');
    if (button) {
      const rows = document.querySelectorAll('[data-purchase-item-row]');
      if (rows.length <= 1) return showToast('La compra debe tener al menos un item.', 'warning');
      button.closest('[data-purchase-item-row]')?.remove();
    }
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = formToObject(form);
    input.items = [...document.querySelectorAll('[data-purchase-item-row]')].map((row) => formElementsToObject(row.querySelectorAll('input, select')));

    const result = savePurchase(getData(), input);
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');

    saveData(result.data);
    const difference = Math.abs(result.item.difference);
    showToast(difference > 0.01 ? 'Compra guardada con diferencia frente al ticket.' : 'Compra guardada y stock actualizado.', difference > 0.01 ? 'warning' : 'success');
    router.renderFromHash();
  });
}

function bindStockActions() {
  const form = document.querySelector('[data-form="stock-movement"]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = createStockMovement(getData(), formToObject(form));
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');
    saveData(result.data);
    showToast('Movimiento registrado.', 'success');
    router.renderFromHash();
  });
}

function bindProductionActions() {
  const productionForm = document.querySelector('[data-form="production"]');
  const completeForm = document.querySelector('[data-form="complete-production"]');
  const flavoringForm = document.querySelector('[data-form="flavoring"]');

  document.querySelector('[data-action="add-production-input"]')?.addEventListener('click', () => {
    const data = getData();
    const lots = calculateLotSummaries(data.lots, data.stockMovements, data.products);
    document.querySelector('[data-production-inputs]')?.insertAdjacentHTML(
      'beforeend',
      productionInputRow(data.products.filter((product) => product.active && product.stockType !== STOCK_TYPES.PACKAGING), lots)
    );
  });

  document.querySelector('[data-production-inputs]')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="remove-production-input"]');
    if (button) button.closest('[data-production-input-row]')?.remove();
  });

  productionForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = formToObject(productionForm);
    input.inputs = [...document.querySelectorAll('[data-production-input-row]')]
      .map((row) => formElementsToObject(row.querySelectorAll('input, select')));

    const result = saveProductionBatch(getData(), input);
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');

    saveData(result.data);
    showToast('Produccion finalizada y lote creado.', 'success');
    router.renderFromHash();
  });

  completeForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = completeProductionBatch(getData(), formToObject(completeForm));
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');

    saveData(result.data);
    showToast('Produccion pendiente completada.', 'success');
    router.renderFromHash();
  });

  flavoringForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = flavorLot(getData(), formToObject(flavoringForm));
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');

    saveData(result.data);
    showToast('Lote saborizado creado.', 'success');
    router.renderFromHash();
  });
}

function bindLotActions() {
  document.querySelectorAll('[data-action="view-lot"]').forEach((button) => {
    button.addEventListener('click', () => {
      const data = getData();
      const lot = calculateLotSummaries(data.lots, data.stockMovements, data.products)
        .find((item) => item.id === button.dataset.id);
      const product = data.products.find((item) => item.id === lot?.productId);
      if (!lot) return;
      window.alert([
        lot.lotCode,
        `Producto: ${product?.name ?? lot.productId}`,
        `Cantidad inicial: ${lot.initialQuantity} ${lot.unit}`,
        `Stock fisico: ${lot.physicalQuantity} ${lot.unit}`,
        `Reservado: ${lot.reservedQuantity} ${lot.unit}`,
        `Disponible: ${lot.currentQuantity} ${lot.unit}`,
        `Coste unitario: ${lot.unitCost}`,
        `Ubicacion: ${lot.location}`,
        `Coccion: ${lot.cookedAt || 'no aplica'}`,
        `Limite uso: ${lot.expiresAt || 'sin fecha'}`,
        `Notas: ${lot.notes || 'sin notas'}`
      ].join('\n'));
    });
  });

  document.querySelectorAll('[data-action="discard-lot"]').forEach((button) => {
    button.addEventListener('click', () => {
      const notes = window.prompt('Motivo del descarte del lote:', 'Descarte manual') ?? '';
      if (!notes) return;
      const result = markLotDiscarded(getData(), button.dataset.id, notes);
      if (!result.ok) return showToast(result.errors.join(' '), 'danger');
      saveData(result.data);
      showToast('Lote descartado con movimiento trazable.', 'success');
      router.renderFromHash();
    });
  });
}

function bindRecipeActions() {
  const form = document.querySelector('[data-form="recipe"]');

  document.querySelector('[data-action="add-recipe-ingredient"]')?.addEventListener('click', () => {
    document.querySelector('[data-recipe-ingredients]')?.insertAdjacentHTML('beforeend', recipeIngredientRow(getData().products));
  });

  document.querySelector('[data-recipe-ingredients]')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="remove-recipe-ingredient"]');
    if (!button) return;
    const rows = document.querySelectorAll('[data-recipe-ingredient-row]');
    if (rows.length <= 1) return showToast('La receta debe tener al menos un ingrediente.', 'warning');
    button.closest('[data-recipe-ingredient-row]')?.remove();
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = formToObject(form);
    input.ingredients = [...document.querySelectorAll('[data-recipe-ingredient-row]')]
      .map((row) => {
        const item = formElementsToObject(row.querySelectorAll('input, select'));
        return {
          ...item,
          id: item.ingredientId
        };
      });

    const result = saveRecipe(getData(), input);
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');

    saveData(result.data);
    showToast('Receta guardada.', 'success');
    router.renderFromHash();
  });

  document.querySelector('[data-action="clear-recipe-form"]')?.addEventListener('click', () => {
    clearForm(form);
    const container = document.querySelector('[data-recipe-ingredients]');
    if (container) container.innerHTML = recipeIngredientRow(getData().products);
  });

  document.querySelectorAll('[data-action="edit-recipe"]').forEach((button) => {
    button.addEventListener('click', () => {
      const recipe = getData().recipes.find((item) => item.id === button.dataset.id);
      if (!recipe || !form) return;
      fillForm(form, {
        ...recipe,
        allergens: recipe.allergens?.join(', ') ?? ''
      });
      const container = document.querySelector('[data-recipe-ingredients]');
      if (container) {
        container.innerHTML = (recipe.ingredients ?? [])
          .map((ingredient) => recipeIngredientRow(getData().products, ingredient))
          .join('');
      }
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('[data-action="duplicate-recipe"]').forEach((button) => {
    button.addEventListener('click', () => {
      const result = duplicateRecipe(getData(), button.dataset.id);
      if (!result.ok) return showToast(result.errors.join(' '), 'danger');
      saveData(result.data);
      showToast('Receta duplicada como prueba.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelectorAll('[data-action="recipe-status"]').forEach((button) => {
    button.addEventListener('click', () => {
      const result = setRecipeStatus(getData(), button.dataset.id, button.dataset.status);
      if (!result.ok) return showToast(result.errors.join(' '), 'danger');
      saveData(result.data);
      showToast('Estado de receta actualizado.', 'success');
      router.renderFromHash();
    });
  });
}

function bindSimulatorActions() {
  const form = document.querySelector('[data-form="simulation"]');
  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(form);
    const params = new URLSearchParams();
    params.set('recipeId', formData.get('recipeId') ?? '');
    params.set('quantity', formData.get('quantity') ?? '1');
    for (const extra of formData.getAll('extra')) params.append('extra', extra);
    for (const skipped of formData.getAll('skip')) params.append('skip', skipped);
    window.location.hash = `simulator?${params.toString()}`;
    router.renderFromHash();
  });
}

function bindOrderActions() {
  const form = document.querySelector('[data-form="order"]');
  const quickForm = document.querySelector('[data-form="quick-order"]');
  const feedbackForm = document.querySelector('[data-form="feedback"]');

  document.querySelector('[data-action="add-order-item"]')?.addEventListener('click', () => {
    document.querySelector('[data-order-items]')?.insertAdjacentHTML('beforeend', orderItemRow(getData()));
  });

  document.querySelector('[data-order-items]')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-action="remove-order-item"]');
    if (!button) return;
    const rows = document.querySelectorAll('[data-order-item-row]');
    if (rows.length <= 1) return showToast('El pedido debe tener al menos una linea.', 'warning');
    button.closest('[data-order-item-row]')?.remove();
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const result = saveOrder(getData(), collectOrderInput(form));
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');
    saveData(result.data);
    showToast('Pedido guardado.', 'success');
    router.renderFromHash();
  });

  quickForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = formToObject(quickForm);
    const result = saveOrder(getData(), {
      clientId: input.clientId,
      orderDate: new Date().toISOString().slice(0, 10),
      deliveryDate: input.deliveryDate,
      deliveryTime: input.deliveryTime,
      status: ORDER_STATUS.PENDING,
      paymentMethod: PAYMENT_METHODS.BIZUM,
      items: [{
        recipeId: input.recipeId,
        quantity: input.quantity,
        unitPrice: input.unitPrice
      }],
      discount: 0,
      paid: false,
      notes: 'Pedido rapido'
    });
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');
    saveData(result.data);
    showToast('Pedido rapido guardado.', 'success');
    router.renderFromHash();
  });

  feedbackForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = formToObject(feedbackForm);
    input.wouldRepeat = Boolean(feedbackForm.elements.wouldRepeat?.checked);
    const result = saveFeedback(getData(), input);
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');
    saveData(result.data);
    showToast('Feedback guardado.', 'success');
    router.renderFromHash();
  });

  document.querySelector('[data-action="clear-order-form"]')?.addEventListener('click', () => {
    clearForm(form);
    const container = document.querySelector('[data-order-items]');
    if (container) container.innerHTML = orderItemRow(getData());
  });

  document.querySelectorAll('[data-action="edit-order"]').forEach((button) => {
    button.addEventListener('click', () => {
      const order = getData().orders.find((item) => item.id === button.dataset.id);
      if (!order || !form) return;
      fillForm(form, order);
      const container = document.querySelector('[data-order-items]');
      if (container) {
        container.innerHTML = (order.items ?? [])
          .map((item) => orderItemRow(getData(), item))
          .join('') || orderItemRow(getData());
      }
      form.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  document.querySelectorAll('[data-action="order-status"]').forEach((button) => {
    button.addEventListener('click', () => {
      const data = getData();
      const order = data.orders.find((item) => item.id === button.dataset.id);
      if (!order) return showToast('Pedido no encontrado.', 'danger');
      if (button.dataset.status === ORDER_STATUS.DELIVERED && !window.confirm('Entregar pedido y convertir reserva en venta definitiva?')) return;
      const result = button.dataset.status === ORDER_STATUS.DELIVERED
        ? deliverOrder(data, button.dataset.id)
        : setOrderStatus(data, button.dataset.id, button.dataset.status);
      if (!result.ok) return showToast(result.errors.join(' '), 'danger');
      saveData(result.data);
      showToast(button.dataset.status === ORDER_STATUS.DELIVERED ? 'Pedido entregado y stock descontado.' : 'Estado actualizado.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelectorAll('[data-action="order-paid"]').forEach((button) => {
    button.addEventListener('click', () => {
      const result = markOrderPaid(getData(), button.dataset.id, button.dataset.paid === 'true');
      if (!result.ok) return showToast(result.errors.join(' '), 'danger');
      saveData(result.data);
      showToast('Pago actualizado.', 'success');
      router.renderFromHash();
    });
  });
}

function bindKitchenActions() {
  const productionForm = document.querySelector('[data-form="kitchen-production"]');
  const orderForm = document.querySelector('[data-form="kitchen-order"]');

  productionForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = formToObject(productionForm);
    input.inputs = [];
    const result = saveProductionBatch(getData(), input);
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');
    saveData(result.data);
    showToast('Tanda guardada desde cocina.', 'success');
    router.renderFromHash();
  });

  orderForm?.addEventListener('submit', (event) => {
    event.preventDefault();
    const input = formToObject(orderForm);
    const result = saveOrder(getData(), {
      clientId: input.clientId,
      orderDate: new Date().toISOString().slice(0, 10),
      deliveryDate: input.deliveryDate,
      deliveryTime: input.deliveryTime,
      status: ORDER_STATUS.PENDING,
      paymentMethod: PAYMENT_METHODS.BIZUM,
      items: [{
        recipeId: input.recipeId,
        quantity: input.quantity,
        unitPrice: input.unitPrice
      }],
      discount: 0,
      paid: false,
      notes: 'Modo cocina'
    });
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');
    saveData(result.data);
    showToast('Pedido guardado desde cocina.', 'success');
    router.renderFromHash();
  });

  bindKitchenTimerActions();
  bindKitchenChecklistActions();
}

function bindKitchenTimerActions() {
  const display = document.querySelector('[data-kitchen-timer-display]');
  const input = document.querySelector('[data-kitchen-timer-input]');
  if (!display || !input) return;

  if (kitchenTimer.remainingSeconds === null) {
    kitchenTimer.remainingSeconds = getStoredKitchenTimerSeconds() ?? minutesToSeconds(input.value);
  }

  updateKitchenTimerDisplay();
  document.querySelector('[data-action="start-kitchen-timer"]')?.addEventListener('click', () => startKitchenTimer());
  document.querySelector('[data-action="pause-kitchen-timer"]')?.addEventListener('click', () => pauseKitchenTimer());
  document.querySelector('[data-action="reset-kitchen-timer"]')?.addEventListener('click', () => resetKitchenTimer());
}

function startKitchenTimer() {
  if (kitchenTimer.intervalId) return;
  const input = document.querySelector('[data-kitchen-timer-input]');
  if (!Number.isFinite(kitchenTimer.remainingSeconds) || kitchenTimer.remainingSeconds <= 0) {
    kitchenTimer.remainingSeconds = minutesToSeconds(input?.value);
  }
  setKitchenTimerStatus('activo');
  kitchenTimer.intervalId = window.setInterval(() => {
    kitchenTimer.remainingSeconds = Math.max((kitchenTimer.remainingSeconds ?? 0) - 1, 0);
    persistKitchenTimer();
    updateKitchenTimerDisplay();
    if (kitchenTimer.remainingSeconds <= 0) {
      pauseKitchenTimer();
      setKitchenTimerStatus('fin');
      showToast('Temporizador finalizado.', 'success');
    }
  }, 1000);
}

function pauseKitchenTimer() {
  if (kitchenTimer.intervalId) {
    window.clearInterval(kitchenTimer.intervalId);
    kitchenTimer.intervalId = null;
  }
  setKitchenTimerStatus('pausa');
  persistKitchenTimer();
}

function resetKitchenTimer() {
  pauseKitchenTimer();
  const input = document.querySelector('[data-kitchen-timer-input]');
  kitchenTimer.remainingSeconds = minutesToSeconds(input?.value);
  persistKitchenTimer();
  setKitchenTimerStatus('listo');
  updateKitchenTimerDisplay();
}

function updateKitchenTimerDisplay() {
  const display = document.querySelector('[data-kitchen-timer-display]');
  if (!display) return;
  display.textContent = formatTimer(kitchenTimer.remainingSeconds ?? 0);
}

function setKitchenTimerStatus(label) {
  const status = document.querySelector('[data-kitchen-timer-status]');
  if (status) status.textContent = label;
}

function bindKitchenChecklistActions() {
  const checks = [...document.querySelectorAll('[data-kitchen-check]')];
  if (checks.length === 0) return;

  const state = getJsonFromLocalStorage(KITCHEN_CHECKLIST_KEY, {});
  checks.forEach((checkbox) => {
    checkbox.checked = Boolean(state[checkbox.dataset.kitchenCheck]);
    checkbox.addEventListener('change', () => {
      const nextState = getJsonFromLocalStorage(KITCHEN_CHECKLIST_KEY, {});
      nextState[checkbox.dataset.kitchenCheck] = checkbox.checked;
      localStorage.setItem(KITCHEN_CHECKLIST_KEY, JSON.stringify(nextState));
    });
  });

  document.querySelector('[data-action="reset-kitchen-checklist"]')?.addEventListener('click', () => {
    localStorage.removeItem(KITCHEN_CHECKLIST_KEY);
    checks.forEach((checkbox) => {
      checkbox.checked = false;
    });
    showToast('Checklist limpia.', 'success');
  });
}

function bindSettingsActions() {
  const form = document.querySelector('[data-form="settings"]');
  form?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const current = getData();
    const input = formToObject(form);
    input.demoMode = Boolean(form.elements.demoMode?.checked);
    input.localAuthEnabled = Boolean(form.elements.localAuthEnabled?.checked);
    const disablingSecurity = current.settings?.security?.localAuthEnabled && !input.localAuthEnabled;
    if (disablingSecurity && !(await ensureAdminAccess('desactivar seguridad local'))) return;

    const result = saveSettings(current, input);
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');
    saveData(result.data);
    syncStorageModeLabel();
    showToast('Configuracion guardada.', 'success');
    router.renderFromHash();
  });
}

function bindSecurityActions() {
  const pinForm = document.querySelector('[data-form="security-pin"]');
  pinForm?.addEventListener('submit', async (event) => {
    event.preventDefault();
    const input = formToObject(pinForm);
    if (input.adminPin !== input.adminPinConfirm) {
      return showToast('Los PIN no coinciden.', 'danger');
    }

    try {
      const result = await setAdminPin(getData(), input.adminPin);
      if (!result.ok) return showToast(result.errors.join(' '), 'danger');
      saveData(result.data);
      clearForm(pinForm);
      showToast('PIN admin guardado y proteccion activada.', 'success');
      router.renderFromHash();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  document.querySelector('[data-action="unlock-admin"]')?.addEventListener('click', async () => {
    const data = getData();
    if (!hasAdminPin(data)) return showToast('Configura un PIN admin primero.', 'warning');
    const pin = window.prompt('Introduce PIN admin:');
    if (!pin) return;
    const result = await unlockAdminSession(data, pin);
    if (!result.ok) return showToast(result.errors.join(' '), 'danger');
    saveData(result.data, { mirror: false });
    showToast('Sesion admin desbloqueada.', 'success');
    router.renderFromHash();
  });

  document.querySelector('[data-action="lock-admin"]')?.addEventListener('click', () => {
    saveData(lockAdminSession(getData()), { mirror: false });
    showToast('Sesion admin bloqueada.', 'success');
    router.renderFromHash();
  });
}

function bindBackupActions() {
  document.querySelector('[data-action="reset-data"]')?.addEventListener('click', async () => {
    const confirmed = window.confirm('Esto reiniciara los datos demo y guardara un backup local. Continuar?');
    if (!confirmed) return;
    if (!(await ensureAdminAccess('reset demo'))) return;
    resetData();
    showToast('Datos demo reiniciados.', 'success');
    router.renderFromHash();
  });

  document.querySelector('[data-action="export-data"]')?.addEventListener('click', () => {
    downloadTextFile(
      `ramp-bites-backup-${new Date().toISOString().slice(0, 10)}.json`,
      exportData(),
      'application/json'
    );
  });

  document.querySelector('[data-action="manual-backup"]')?.addEventListener('click', () => {
    const backup = createManualBackup('manual');
    if (!backup) return showToast('No hay datos locales para respaldar.', 'warning');
    showToast('Backup manual creado.', 'success');
    router.renderFromHash();
  });

  document.querySelector('[data-action="restore-backup"]')?.addEventListener('click', async () => {
    const backupId = document.querySelector('[data-backup-select]')?.value ?? '';
    if (!backupId) return showToast('Selecciona un backup.', 'warning');
    if (!window.confirm('Restaurar backup seleccionado? Se creara un backup automatico antes.')) return;
    if (!(await ensureAdminAccess('restaurar backup'))) return;
    try {
      restoreBackup(backupId);
      showToast('Backup restaurado.', 'success');
      router.renderFromHash();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });

  document.querySelectorAll('[data-action="export-csv"]').forEach((button) => {
    button.addEventListener('click', () => {
      try {
        const file = buildCsvExport(getData(), button.dataset.type);
        downloadTextFile(file.filename, file.content, 'text/csv;charset=utf-8');
        showToast('CSV exportado.', 'success');
      } catch (error) {
        showToast(error.message, 'danger');
      }
    });
  });

  document.querySelector('[data-action="import-data"]')?.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!(await ensureAdminAccess('importar JSON'))) {
      event.target.value = '';
      return;
    }

    try {
      const text = await file.text();
      importData(text);
      showToast('Datos importados.', 'success');
      router.renderFromHash();
    } catch (error) {
      showToast(error.message, 'danger');
    }
  });
}

function bindBackendActions() {
  document.querySelector('[data-action="backend-auth-status"]')?.addEventListener('click', async (event) => {
    await runBackendAction(event.currentTarget, async (client) => {
      const auth = await client.authStatus();
      updateBackendAuthSettings(auth);
      showToast(auth.enabled ? 'Autenticacion backend activa.' : 'Backend sin usuarios activos.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelector('[data-action="backend-auth-bootstrap"]')?.addEventListener('click', async (event) => {
    const form = document.querySelector('[data-form="backend-auth"]');
    const input = formToObject(form);
    await runBackendAction(event.currentTarget, async (client) => {
      const result = await client.bootstrapAuth({
        username: input.backendUsername,
        password: input.backendPassword
      });
      setStoredBackendAuthToken(result.token);
      updateBackendAuthSettings({
        enabled: true,
        hasAdmin: true,
        currentUser: result.user,
        lastAuthAt: new Date().toISOString()
      });
      showToast('Primer admin backend creado y sesion iniciada.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelector('[data-action="backend-auth-login"]')?.addEventListener('click', async (event) => {
    const form = document.querySelector('[data-form="backend-auth"]');
    const input = formToObject(form);
    await runBackendAction(event.currentTarget, async (client) => {
      const result = await client.login({
        username: input.backendUsername,
        password: input.backendPassword
      });
      setStoredBackendAuthToken(result.token);
      updateBackendAuthSettings({
        enabled: true,
        currentUser: result.user,
        lastAuthAt: new Date().toISOString()
      });
      showToast('Sesion backend iniciada.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelector('[data-action="backend-auth-logout"]')?.addEventListener('click', async (event) => {
    await runBackendAction(event.currentTarget, async (client) => {
      await client.logout();
      clearStoredBackendAuthToken();
      updateBackendAuthSettings({
        currentUser: null,
        lastLogoutAt: new Date().toISOString()
      });
      showToast('Sesion backend cerrada.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelector('[data-action="backend-auth-create-user"]')?.addEventListener('click', async (event) => {
    const form = document.querySelector('[data-form="backend-auth"]');
    const input = formToObject(form);
    await runBackendAction(event.currentTarget, async (client) => {
      await client.createUser({
        username: input.backendNewUsername,
        password: input.backendNewPassword,
        role: input.backendRole
      });
      const auth = await client.authStatus();
      updateBackendAuthSettings(auth);
      showToast('Usuario backend creado.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelector('[data-action="backend-health"]')?.addEventListener('click', async (event) => {
    await runBackendAction(event.currentTarget, async (client) => {
      const health = await client.health();
      updateBackendSettings({
        lastStatus: `ok - ${health.counts?.products ?? 0} productos`,
        lastCheckedAt: new Date().toISOString()
      });
      showToast('Backend conectado.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelector('[data-action="backend-push"]')?.addEventListener('click', async (event) => {
    const confirmed = window.confirm('Enviar datos locales al backend? Esto reemplazara la base SQLite actual y creara backup backend.');
    if (!confirmed) return;
    if (!(await ensureAdminAccess('enviar local al backend'))) return;

    await runBackendAction(event.currentTarget, async (client) => {
      const now = new Date().toISOString();
      const data = applyBackendSettingsPatch(getData(), {
        lastStatus: 'local enviado a backend',
        lastSyncAt: now,
        lastCheckedAt: now
      });
      saveData(data, { mirror: false });
      await client.replaceData(data);
      showToast('Datos locales enviados al backend.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelector('[data-action="backend-pull"]')?.addEventListener('click', async (event) => {
    const confirmed = window.confirm('Traer datos del backend? Se creara backup local y se reemplazaran los datos actuales del navegador.');
    if (!confirmed) return;
    if (!(await ensureAdminAccess('traer datos del backend'))) return;

    await runBackendAction(event.currentTarget, async (client) => {
      const current = getData();
      const remoteData = await client.getData();
      createManualBackup('before_backend_pull');
      saveData(applyBackendSettingsPatch(remoteData, {
        ...(current.settings?.backend ?? {}),
        baseUrl: getBackendBaseUrl(),
        lastStatus: 'backend traido a local',
        lastSyncAt: new Date().toISOString()
      }), { mirror: false });
      showToast('Datos traidos desde backend.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelector('[data-action="backend-sync-collections"]')?.addEventListener('click', async (event) => {
    const confirmed = window.confirm('Sincronizar colecciones con backend? Se creara backup local. Los borrados aun no se sincronizan automaticamente.');
    if (!confirmed) return;
    if (!(await ensureAdminAccess('sincronizar colecciones'))) return;

    await runBackendAction(event.currentTarget, async (client) => {
      const current = getData();
      createManualBackup('before_backend_collection_sync');
      const result = await syncCollectionsWithBackend(current, client, {
        lastSyncAt: current.settings?.backend?.collectionSync?.lastSyncAt || current.settings?.backend?.lastSyncAt || ''
      });
      const now = new Date().toISOString();
      const status = `sync colecciones: ${result.summary.pushed} subidos, ${result.summary.pulled} traidos, ${result.summary.conflicts} conflictos`;
      saveData(applyBackendSettingsPatch(result.data, {
        baseUrl: getBackendBaseUrl(),
        lastStatus: status,
        lastCheckedAt: now,
        lastSyncAt: now,
        collectionSync: {
          lastSyncAt: now,
          lastRunAt: now,
          summary: result.summary,
          conflicts: result.conflicts.slice(0, 20)
        }
      }), { mirror: false });
      syncStorageModeLabel();
      showToast(
        result.summary.conflicts > 0 ? `${status}. Se resolvieron conservando la version local.` : status,
        result.summary.conflicts > 0 ? 'warning' : 'success'
      );
      router.renderFromHash();
    });
  });

  document.querySelector('[data-action="backend-backup"]')?.addEventListener('click', async (event) => {
    await runBackendAction(event.currentTarget, async (client) => {
      const result = await client.createBackup();
      updateBackendSettings({
        lastStatus: `backup ${result.backup?.filename ?? 'creado'}`,
        lastCheckedAt: new Date().toISOString()
      });
      showToast('Backup backend creado.', 'success');
      router.renderFromHash();
    });
  });

  document.querySelector('[data-action="backend-seed"]')?.addEventListener('click', async (event) => {
    const confirmed = window.confirm('Cargar seed en backend? Esto reemplazara la base SQLite actual y creara backup backend.');
    if (!confirmed) return;
    if (!(await ensureAdminAccess('cargar seed backend'))) return;

    await runBackendAction(event.currentTarget, async (client) => {
      await client.seed();
      updateBackendSettings({
        lastStatus: 'seed backend cargado',
        lastSyncAt: new Date().toISOString()
      });
      showToast('Seed backend cargado.', 'success');
      router.renderFromHash();
    });
  });
}

async function ensureAdminAccess(actionLabel) {
  const result = await requestAdminUnlock(getData(), {
    message: `PIN admin para ${actionLabel}:`
  });
  if (!result.ok) {
    showToast(result.errors.join(' '), 'warning');
    return false;
  }
  if (!result.skipped && !result.alreadyUnlocked) {
    saveData(result.data, { mirror: false });
    showToast('Sesion admin desbloqueada.', 'success');
  }
  return true;
}

async function runBackendAction(button, callback) {
  const previousText = button?.textContent;
  try {
    if (button) {
      button.disabled = true;
      button.textContent = 'Procesando';
    }
    await callback(createRampBitesApiClient(getBackendBaseUrl()));
  } catch (error) {
    updateBackendSettings({
      lastStatus: `error - ${error.message}`,
      lastCheckedAt: new Date().toISOString()
    });
    showToast(error.message, 'danger');
    router.renderFromHash();
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = previousText;
    }
  }
}

function getBackendBaseUrl() {
  const formValue = document.querySelector('input[name="backendBaseUrl"]')?.value?.trim();
  return formValue || getData().settings?.backend?.baseUrl || DEFAULT_API_BASE_URL;
}

function updateBackendSettings(patch) {
  saveData(applyBackendSettingsPatch(getData(), patch), { mirror: false });
  syncStorageModeLabel();
}

function updateBackendAuthSettings(authPatch) {
  const currentAuth = getData().settings?.backend?.auth ?? {};
  updateBackendSettings({
    auth: {
      ...currentAuth,
      ...authPatch,
      checked: true,
      lastCheckedAt: new Date().toISOString()
    }
  });
}

function applyBackendSettingsPatch(data, patch) {
  return {
    ...data,
    settings: {
      ...(data.settings ?? DEFAULT_SETTINGS),
      backend: {
        ...DEFAULT_SETTINGS.backend,
        ...(data.settings?.backend ?? {}),
        ...patch
      }
    }
  };
}

function applyStoredTheme() {
  const theme = localStorage.getItem(THEME_STORAGE_KEY);
  setStoredTheme(theme === 'dark' ? 'dark' : 'light', { persist: false });
}

function setStoredTheme(theme, options = {}) {
  const isDark = theme === 'dark';
  if (isDark) document.documentElement.dataset.theme = 'dark';
  else delete document.documentElement.dataset.theme;
  if (options.persist !== false) localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light');
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor) themeColor.setAttribute('content', isDark ? '#1f2326' : '#a63d2f');
  syncThemeButton();
}

function syncThemeButton() {
  const button = document.querySelector('[data-action="toggle-theme"]');
  if (!button) return;
  const isDark = document.documentElement.dataset.theme === 'dark';
  button.textContent = isDark ? 'Modo claro' : 'Modo oscuro';
  button.setAttribute('aria-pressed', String(isDark));
}

function syncInstallButton() {
  const button = document.querySelector('[data-action="install-app"]');
  if (button) button.hidden = !deferredInstallPrompt;
}

function getStoredKitchenTimerSeconds() {
  const stored = getJsonFromLocalStorage(KITCHEN_TIMER_KEY, null);
  const seconds = Number(stored?.remainingSeconds);
  return Number.isFinite(seconds) && seconds >= 0 ? seconds : null;
}

function persistKitchenTimer() {
  localStorage.setItem(KITCHEN_TIMER_KEY, JSON.stringify({
    remainingSeconds: kitchenTimer.remainingSeconds ?? 0
  }));
}

function minutesToSeconds(value) {
  const minutes = Number(value);
  return Math.max(Math.round((Number.isFinite(minutes) && minutes > 0 ? minutes : 210) * 60), 0);
}

function formatTimer(seconds) {
  const safeSeconds = Math.max(Math.round(Number(seconds) || 0), 0);
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  return [hours, minutes, remainingSeconds].map((part) => String(part).padStart(2, '0')).join(':');
}

function getJsonFromLocalStorage(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function downloadTextFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function filterProducts() {
  const search = document.querySelector('[data-filter="product-search"]')?.value.toLowerCase() ?? '';
  const category = document.querySelector('[data-filter="product-category"]')?.value ?? '';
  const location = document.querySelector('[data-filter="product-location"]')?.value ?? '';
  const active = document.querySelector('[data-filter="product-active"]')?.value ?? '';

  document.querySelectorAll('[data-product-row]').forEach((row) => {
    const matchesSearch = !search || row.dataset.search.includes(search);
    const matchesCategory = !category || row.dataset.category === category;
    const matchesLocation = !location || row.dataset.location === location;
    const matchesActive = !active || row.dataset.active === active;
    row.hidden = !(matchesSearch && matchesCategory && matchesLocation && matchesActive);
  });
}

function filterClients() {
  const search = document.querySelector('[data-filter="client-search"]')?.value.toLowerCase() ?? '';
  document.querySelectorAll('[data-client-row]').forEach((row) => {
    row.hidden = Boolean(search) && !row.dataset.search.includes(search);
  });
}

function collectOrderInput(form) {
  const input = formToObject(form);
  input.paid = Boolean(form.elements.paid?.checked);
  input.items = [...document.querySelectorAll('[data-order-item-row]')].map((row) => {
    const item = formElementsToObject(row.querySelectorAll('input, select'));
    return {
      ...item,
      extraIngredientIds: getScopedMultiSelectValues(row.querySelector('select[name="extraIngredientIds"]'), item.recipeId),
      extras: getScopedMultiSelectValues(row.querySelector('select[name="extraIngredientIds"]'), item.recipeId),
      excludedIngredientIds: getScopedMultiSelectValues(row.querySelector('select[name="excludedIngredientIds"]'), item.recipeId)
    };
  });
  return input;
}

function getScopedMultiSelectValues(select, recipeId) {
  if (!select) return [];
  return [...select.selectedOptions]
    .map((option) => option.value)
    .filter((value) => !value.includes('::') || value.startsWith(`${recipeId}::`))
    .map((value) => value.includes('::') ? value.split('::')[1] : value);
}

function formToObject(form) {
  return formElementsToObject(form.querySelectorAll('input, select, textarea'));
}

function formElementsToObject(elements) {
  return [...elements].reduce((data, element) => {
    if (!element.name) return data;
    data[element.name] = element.type === 'checkbox' ? element.checked : element.value;
    return data;
  }, {});
}

function fillForm(form, values) {
  for (const [key, value] of Object.entries(values)) {
    const element = form.elements[key];
    if (!element) continue;
    if (element.type === 'checkbox') element.checked = Boolean(value);
    else element.value = value ?? '';
  }
}

function clearForm(form) {
  form?.reset();
  const idInput = form?.querySelector('input[name="id"]');
  if (idInput) idInput.value = '';
}

function showToast(message, level = 'info') {
  const region = document.querySelector('[data-toast-region]');
  if (!region) return;
  const toast = document.createElement('div');
  toast.className = `toast toast-${level}`;
  toast.setAttribute('role', level === 'danger' ? 'alert' : 'status');
  toast.textContent = message;
  region.appendChild(toast);
  window.setTimeout(() => toast.remove(), 3600);
}

bootstrap();
