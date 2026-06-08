import { ORDER_STATUS, RECIPE_STATUS, STOCK_TYPES, STORAGE_LOCATIONS } from '../constants.js';
import {
  addDays,
  calculateLotSummaries,
  calculateOrderPlanning,
  calculateOrderTotals,
  calculateStockByProduct,
  formatCurrency,
  formatNumber,
  formatWeight
} from '../calculations.js';
import { escapeAttribute, escapeHtml, option } from '../html.js';

const KITCHEN_STATUSES = [
  ORDER_STATUS.PENDING,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.IN_PRODUCTION,
  ORDER_STATUS.READY
];

const CHECKLIST_ITEMS = [
  { id: 'carne-pesada', label: 'Carne pesada' },
  { id: 'agua-caldo-agregado', label: 'Agua/caldo agregado' },
  { id: 'hora-inicio', label: 'Hora inicio' },
  { id: 'revision-1', label: 'Revision 1' },
  { id: 'revision-2', label: 'Revision 2' },
  { id: 'desmechado', label: 'Desmechado' },
  { id: 'pesado-final', label: 'Pesado final' },
  { id: 'enfriado', label: 'Enfriado' },
  { id: 'nevera-congelador', label: 'Nevera/congelador' }
];

export function renderKitchen({ data }) {
  const today = todayString();
  const tomorrow = addDays(today, 1);
  const stock = calculateStockByProduct(data.stockMovements);
  const lotSummaries = calculateLotSummaries(data.lots, data.stockMovements, data.products);
  const rawLots = lotSummaries.filter((lot) => lot.currentQuantity > 0 && lot.product?.stockType === STOCK_TYPES.RAW);
  const cookedNeutralProducts = data.products.filter((product) => product.active && product.stockType === STOCK_TYPES.COOKED_NEUTRAL);
  const neutralStock = data.products
    .filter((product) => product.stockType === STOCK_TYPES.COOKED_NEUTRAL)
    .reduce((total, product) => total + Math.max(Number(stock[product.id]) || 0, 0), 0);
  const activeOrders = data.orders.filter((order) => KITCHEN_STATUSES.includes(order.status));
  const upcomingOrders = activeOrders
    .filter((order) => (order.deliveryDate || order.orderDate || '') <= tomorrow)
    .slice(0, 8);
  const planning = calculateOrderPlanning(data.orders, data.recipes, data.products, stock, data.settings, {
    fromDate: today,
    toDate: tomorrow,
    statuses: KITCHEN_STATUSES
  });
  const defaultRecipe = data.recipes.find((recipe) => recipe.status === RECIPE_STATUS.ACTIVE) ?? data.recipes[0];

  return `
    <section class="view-header kitchen-view-header">
      <div>
        <p class="eyebrow">Modo cocina movil</p>
        <h2>Cocina</h2>
      </div>
      <span class="badge badge-info">offline ready</span>
    </section>

    <section class="kitchen-actions" aria-label="Accesos rapidos">
      <a class="kitchen-action" href="#production">
        <strong>Produccion</strong>
        <span>Tandas y lotes</span>
      </a>
      <a class="kitchen-action" href="#orders">
        <strong>Pedidos</strong>
        <span>Estados y pagos</span>
      </a>
      <a class="kitchen-action" href="#stock">
        <strong>Stock</strong>
        <span>Movimientos</span>
      </a>
      <a class="kitchen-action" href="#simulator">
        <strong>Simulador</strong>
        <span>Burritos posibles</span>
      </a>
    </section>

    <section class="metric-grid kitchen-metrics">
      ${metric('Carne neutra', formatWeight(neutralStock), 'Stock cocido')}
      ${metric('Pedidos activos', activeOrders.length, 'Sin entregar')}
      ${metric('Burritos proximos', planning.totalUnits, `${today} / ${tomorrow}`)}
      ${metric('Faltantes', planning.missingItems.length, 'Productos')}
    </section>

    <section class="kitchen-grid">
      <article class="panel kitchen-card">
        <div class="panel-header">
          <h3>Produccion rapida</h3>
          <span class="badge">${rawLots.length} lotes crudos</span>
        </div>
        <form class="stack-form" data-form="kitchen-production">
          <input type="hidden" name="type" value="cerdo">
          <input type="hidden" name="date" value="${escapeAttribute(today)}">
          <input type="hidden" name="method" value="olla">
          <div class="form-row">
            <label>Lote crudo<select name="rawLotId" required><option value="">Seleccionar</option>${rawLotOptions(rawLots)}</select></label>
            <label>Crudo usado g<input name="rawWeightUsed" type="number" min="0.001" step="0.001" inputmode="decimal" required></label>
          </div>
          <div class="form-row">
            <label>Resultado<select name="resultProductId" required><option value="">Seleccionar</option>${productOptions(cookedNeutralProducts)}</select></label>
            <label>Peso final g<input name="finalWeight" type="number" min="0.001" step="0.001" inputmode="decimal" required></label>
          </div>
          <div class="form-row">
            <label>Inicio<input name="startTime" type="time"></label>
            <label>Fin<input name="endTime" type="time"></label>
          </div>
          <div class="form-row">
            <label>Liquido ml<input name="liquidInitialMl" type="number" min="0" step="1" inputmode="numeric"></label>
            <label>Caldo ml<input name="brothTotalMl" type="number" min="0" step="1" inputmode="numeric"></label>
          </div>
          <div class="form-row">
            <label>Ubicacion<select name="location">${locationOptions()}</select></label>
            <label>Limite uso<input name="expiresAt" type="date" value="${escapeAttribute(addDays(today, data.settings?.cookedFridgeMaxDays ?? 2))}"></label>
          </div>
          <label>Notas<input name="notes" value="Modo cocina"></label>
          <button class="btn btn-kitchen" type="submit">Guardar tanda</button>
        </form>
      </article>

      <article class="panel kitchen-card">
        <div class="panel-header">
          <h3>Pedido rapido</h3>
          <span class="badge">${data.clients.filter((client) => client.active).length} clientes</span>
        </div>
        <form class="stack-form" data-form="kitchen-order">
          <label>Cliente<select name="clientId" required><option value="">Seleccionar</option>${clientOptions(data.clients)}</select></label>
          <label>Receta<select name="recipeId" required><option value="">Seleccionar</option>${recipeOptions(data.recipes, defaultRecipe?.id)}</select></label>
          <div class="form-row">
            <label>Cantidad<input name="quantity" type="number" min="1" step="1" inputmode="numeric" value="1" required></label>
            <label>Precio ud<input name="unitPrice" type="number" min="0" step="0.01" inputmode="decimal" value="${escapeAttribute(defaultRecipe?.currentSalePrice ?? 5)}"></label>
          </div>
          <div class="form-row">
            <label>Entrega<input name="deliveryDate" type="date" value="${escapeAttribute(today)}"></label>
            <label>Hora<input name="deliveryTime" type="time"></label>
          </div>
          <button class="btn btn-kitchen" type="submit">Guardar pedido</button>
        </form>
      </article>

      <article class="panel kitchen-card">
        <div class="panel-header">
          <h3>Temporizador coccion</h3>
          <span class="badge badge-info" data-kitchen-timer-status>listo</span>
        </div>
        <div class="kitchen-timer" data-kitchen-timer-display>03:30:00</div>
        <label class="kitchen-timer-input">Minutos<input data-kitchen-timer-input type="number" min="1" step="1" inputmode="numeric" value="210"></label>
        <div class="button-row kitchen-button-row">
          <button class="btn btn-kitchen" type="button" data-action="start-kitchen-timer">Iniciar</button>
          <button class="btn btn-secondary btn-kitchen" type="button" data-action="pause-kitchen-timer">Pausar</button>
          <button class="btn btn-danger btn-kitchen" type="button" data-action="reset-kitchen-timer">Reset</button>
        </div>
      </article>

      <article class="panel kitchen-card">
        <div class="panel-header">
          <h3>Checklist produccion</h3>
          <button class="btn btn-small btn-secondary" type="button" data-action="reset-kitchen-checklist">Limpiar</button>
        </div>
        <div class="kitchen-checklist">
          ${CHECKLIST_ITEMS.map((item) => `
            <label class="kitchen-check">
              <input type="checkbox" data-kitchen-check="${escapeAttribute(item.id)}">
              <span>${escapeHtml(item.label)}</span>
            </label>
          `).join('')}
        </div>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel table-panel">
        <div class="panel-header">
          <h3>Pedidos proximos</h3>
          <span class="badge badge-info">${upcomingOrders.length}</span>
        </div>
        <table class="data-table">
          <thead><tr><th>Pedido</th><th>Cliente</th><th>Entrega</th><th>Items</th><th>Estado</th></tr></thead>
          <tbody>
            ${upcomingOrders.map((order) => orderRow(order, data)).join('') || '<tr><td colspan="5">Sin pedidos proximos.</td></tr>'}
          </tbody>
        </table>
      </article>

      <article class="panel table-panel">
        <div class="panel-header">
          <h3>Necesidades</h3>
          <span class="badge ${planning.missingItems.length ? 'badge-warning' : 'badge-success'}">${planning.missingItems.length ? 'faltantes' : 'ok'}</span>
        </div>
        <table class="data-table">
          <thead><tr><th>Producto</th><th>Necesario</th><th>Stock</th><th>Faltante</th></tr></thead>
          <tbody>
            ${planning.availability.map((item) => `
              <tr>
                <td>${escapeHtml(item.productName)}</td>
                <td>${formatQuantity(item.quantity, item.unit)}</td>
                <td>${formatQuantity(item.available, item.unit)}</td>
                <td><span class="${item.shortage > 0 ? 'stock-low' : ''}">${formatQuantity(item.shortage, item.unit)}</span></td>
              </tr>
            `).join('') || '<tr><td colspan="4">Sin necesidades abiertas.</td></tr>'}
          </tbody>
        </table>
      </article>
    </section>
  `;
}

function orderRow(order, data) {
  const client = data.clients.find((item) => item.id === order.clientId);
  const totals = calculateOrderTotals(order, data.recipes, data.products, data.settings);
  const itemsLabel = totals.items.map((item) => `${item.quantity} x ${item.recipeName}`).join(', ');
  return `
    <tr>
      <td><strong>${escapeHtml(order.orderNumber ?? order.id)}</strong><div class="muted">${formatCurrency(totals.total)}</div></td>
      <td>${escapeHtml(client?.name ?? 'Cliente eliminado')}</td>
      <td>${escapeHtml(order.deliveryDate || 'sin fecha')}<div class="muted">${escapeHtml(order.deliveryTime || '')}</div></td>
      <td>${escapeHtml(itemsLabel || 'Sin items')}</td>
      <td><span class="badge ${statusBadge(order.status)}">${escapeHtml(order.status)}</span></td>
    </tr>
  `;
}

function metric(label, value, hint) {
  return `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(hint)}</small></article>`;
}

function rawLotOptions(rawLots) {
  return rawLots
    .map((lot) => option(lot.id, `${lot.lotCode} - ${lot.product?.name ?? lot.productId} - ${formatWeight(lot.currentQuantity)}`))
    .join('');
}

function productOptions(products, selectedValue = '') {
  return products.map((product) => option(product.id, product.name, selectedValue)).join('');
}

function clientOptions(clients) {
  return clients
    .filter((client) => client.active)
    .map((client) => option(client.id, `${client.name}${client.alias ? ` (${client.alias})` : ''}`))
    .join('');
}

function recipeOptions(recipes, selectedValue = '') {
  return recipes
    .filter((recipe) => recipe.status !== RECIPE_STATUS.RETIRED)
    .map((recipe) => option(recipe.id, `${recipe.name} (${recipe.status})`, selectedValue))
    .join('');
}

function locationOptions() {
  return [STORAGE_LOCATIONS.FRIDGE, STORAGE_LOCATIONS.FREEZER].map((value) => option(value, value)).join('');
}

function statusBadge(status) {
  if (status === ORDER_STATUS.DELIVERED) return 'badge-success';
  if (status === ORDER_STATUS.CANCELLED) return 'badge-danger';
  if (status === ORDER_STATUS.READY) return 'badge-info';
  return 'badge-warning';
}

function formatQuantity(value, unit) {
  if (unit === 'g') return formatWeight(value);
  return `${formatNumber(value)} ${escapeHtml(unit)}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}
