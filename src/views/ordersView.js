import { ORDER_STATUS, PAYMENT_METHODS, RECIPE_STATUS } from '../constants.js';
import {
  addDays,
  calculateOrderPlanning,
  calculateOrderTotals,
  calculateShoppingList,
  calculateStockByProduct,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatWeight
} from '../calculations.js';
import { escapeAttribute, escapeHtml, option } from '../html.js';

export function renderOrders({ data }) {
  const stock = calculateStockByProduct(data.stockMovements);
  const today = todayString();
  const tomorrow = addDays(today, 1);
  const upcomingPlanning = calculateOrderPlanning(data.orders, data.recipes, data.products, stock, data.settings, {
    fromDate: today,
    toDate: tomorrow
  });
  const shoppingList = calculateShoppingList(data.orders, data.recipes, data.products, stock, data.suppliers, data.priceHistory, data.settings, {
    fromDate: today,
    toDate: tomorrow
  });
  const pendingOrders = data.orders.filter((order) => ['pendiente', 'confirmado', 'en_produccion', 'listo'].includes(order.status));
  const reservedOrders = data.orders.filter((order) => order.stockReserved);
  const deliveredOrders = data.orders.filter((order) => order.status === ORDER_STATUS.DELIVERED);
  const pendingPayment = deliveredOrders
    .filter((order) => !order.paid)
    .reduce((total, order) => total + (Number(order.total) || 0), 0);

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Pedidos, pagos y planificacion</p>
        <h2>Pedidos</h2>
      </div>
      <span class="badge badge-info">${data.orders.length} pedidos</span>
    </section>

    <section class="metric-grid">
      ${metric('Pendientes', pendingOrders.length, 'Pedidos activos')}
      ${metric('Reservados', reservedOrders.length, 'Stock apartado')}
      ${metric('Entregados', deliveredOrders.length, 'Stock descontado')}
      ${metric('Pendiente cobro', formatCurrency(pendingPayment), 'Entregados no pagados')}
      ${metric('Burritos proximos', upcomingPlanning.totalUnits, `${today} / ${tomorrow}`)}
    </section>

    <section class="work-grid">
      <article class="panel">
        <h3>Crear o editar pedido</h3>
        <form class="stack-form" data-form="order">
          <input type="hidden" name="id">
          <div class="form-row">
            <label>Cliente<select name="clientId" required><option value="">Seleccionar</option>${clientOptions(data.clients)}</select></label>
            <label>Estado<select name="status">${options(ORDER_STATUS, ORDER_STATUS.PENDING)}</select></label>
          </div>
          <div class="form-row">
            <label>Fecha pedido<input name="orderDate" type="date" value="${escapeAttribute(today)}" required></label>
            <label>Fecha entrega<input name="deliveryDate" type="date"></label>
          </div>
          <div class="form-row">
            <label>Hora entrega<input name="deliveryTime" type="time"></label>
            <label>Descuento<input name="discount" type="number" min="0" step="0.01" value="0"></label>
          </div>

          <div class="panel-subheader">
            <h4>Lineas</h4>
            <button class="btn btn-secondary btn-small" type="button" data-action="add-order-item">Anadir linea</button>
          </div>
          <div class="order-items" data-order-items>
            ${orderItemRow(data)}
          </div>

          <div class="form-row">
            <label>Metodo pago<select name="paymentMethod">${options(PAYMENT_METHODS, PAYMENT_METHODS.BIZUM)}</select></label>
            <label class="checkbox-line"><input name="paid" type="checkbox"> Pagado</label>
          </div>
          <label>Notas<textarea name="notes" rows="2"></textarea></label>
          <div class="button-row">
            <button class="btn" type="submit">Guardar pedido</button>
            <button class="btn btn-secondary" type="button" data-action="clear-order-form">Limpiar</button>
          </div>
        </form>
      </article>

      <article class="panel">
        <h3>Pedido rapido</h3>
        <form class="stack-form" data-form="quick-order">
          <label>Cliente<select name="clientId" required><option value="">Seleccionar</option>${clientOptions(data.clients)}</select></label>
          <label>Receta<select name="recipeId" required><option value="">Seleccionar</option>${recipeOptions(data.recipes)}</select></label>
          <div class="form-row">
            <label>Cantidad<input name="quantity" type="number" min="1" step="1" value="1" required></label>
            <label>Precio ud<input name="unitPrice" type="number" min="0" step="0.01" value="5"></label>
          </div>
          <div class="form-row">
            <label>Entrega<input name="deliveryDate" type="date" value="${escapeAttribute(today)}"></label>
            <label>Hora<input name="deliveryTime" type="time"></label>
          </div>
          <button class="btn" type="submit">Guardar rapido</button>
        </form>
        <div class="alert alert-info">
          <strong>Regla de stock</strong>
          <span>Confirmado, en produccion y listo reservan stock. Cancelado libera reserva. Entregado convierte reserva en venta.</span>
        </div>
      </article>
    </section>

    <section class="dashboard-grid">
      ${planningCard('Pedidos proximos', upcomingPlanning)}
      ${shoppingCard(shoppingList)}
    </section>

    <article class="panel table-panel">
      <div class="panel-header"><h3>Pedidos registrados</h3></div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Entrega</th>
            <th>Items</th>
            <th>Total</th>
            <th>Coste</th>
            <th>Ganancia</th>
            <th>Estado</th>
            <th>Pago</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.orders.map((order) => orderRow(order, data)).join('')}
        </tbody>
      </table>
    </article>

    <article class="panel">
      <h3>Feedback post-entrega</h3>
      <form class="stack-form" data-form="feedback">
        <label>Pedido entregado<select name="orderId" required><option value="">Seleccionar</option>${deliveredOrders.map((order) => option(order.id, `${order.orderNumber} - ${clientName(data.clients, order.clientId)} - ${formatCurrency(order.total)}`)).join('')}</select></label>
        <div class="form-row">
          <label>Sabor 1-5<input name="taste" type="number" min="1" max="5" step="1" value="5"></label>
          <label>Tamano 1-5<input name="size" type="number" min="1" max="5" step="1" value="5"></label>
        </div>
        <div class="form-row">
          <label>Precio 1-5<input name="price" type="number" min="1" max="5" step="1" value="5"></label>
          <label>Textura<input name="texture"></label>
        </div>
        <label class="checkbox-line"><input name="wouldRepeat" type="checkbox" checked> Repetiria</label>
        <label>Comentario<textarea name="comment" rows="2"></textarea></label>
        <label>Sugerencias<textarea name="suggestions" rows="2"></textarea></label>
        <button class="btn" type="submit">Guardar feedback</button>
      </form>
    </article>
  `;
}

export function orderItemRow(data, item = {}) {
  return `
    <div class="order-item-row" data-order-item-row>
      <label>Receta<select name="recipeId" required><option value="">Seleccionar</option>${recipeOptions(data.recipes, item.recipeId)}</select></label>
      <label>Cantidad<input name="quantity" type="number" min="1" step="1" value="${escapeAttribute(item.quantity ?? 1)}" required></label>
      <label>Precio ud<input name="unitPrice" type="number" min="0" step="0.01" value="${escapeAttribute(item.unitPrice ?? defaultRecipePrice(data.recipes, item.recipeId))}"></label>
      <label>Extras<select name="extraIngredientIds" multiple size="3">${modifierOptions(data, item.extras ?? item.extraIngredientIds, 'extra')}</select></label>
      <label>Sin ingredientes<select name="excludedIngredientIds" multiple size="3">${modifierOptions(data, item.excludedIngredientIds, 'skip')}</select></label>
      <label>Notas<input name="notes" value="${escapeAttribute(item.notes ?? '')}"></label>
      <button class="btn btn-small btn-danger" type="button" data-action="remove-order-item">Quitar</button>
    </div>
  `;
}

function orderRow(order, data) {
  const client = data.clients.find((item) => item.id === order.clientId);
  const totals = calculateOrderTotals(order, data.recipes, data.products, data.settings);
  const itemsLabel = totals.items.map((item) => `${item.quantity} x ${item.recipeName}`).join(', ');
  return `
    <tr>
      <td><strong>${escapeHtml(order.orderNumber ?? order.id)}</strong><div class="muted">${escapeHtml(order.orderDate ?? order.date ?? '')}</div></td>
      <td>${escapeHtml(client?.name ?? 'Cliente eliminado')}</td>
      <td>${escapeHtml(order.deliveryDate || 'sin fecha')}<div class="muted">${escapeHtml(order.deliveryTime || '')}</div></td>
      <td>${escapeHtml(itemsLabel || 'Sin items')}</td>
      <td>${formatCurrency(totals.total)}</td>
      <td>${formatCurrency(totals.estimatedCost)}</td>
      <td>${formatCurrency(totals.estimatedProfit)}<div class="muted">${formatPercent(totals.marginPercentage)}</div></td>
      <td><span class="badge ${statusBadge(order.status)}">${escapeHtml(order.status)}</span>${order.stockReserved ? '<div><span class="badge badge-info">reservado</span></div>' : ''}</td>
      <td><span class="badge ${order.paid ? 'badge-success' : 'badge-warning'}">${order.paid ? 'pagado' : 'pendiente'}</span><div class="muted">${escapeHtml(order.paymentMethod || '')}</div></td>
      <td class="action-cell">
        <button class="btn btn-small btn-secondary" data-action="edit-order" data-id="${escapeAttribute(order.id)}">Editar</button>
        ${orderActions(order)}
      </td>
    </tr>
  `;
}

function orderActions(order) {
  const buttons = [];
  if (order.status !== ORDER_STATUS.DELIVERED && order.status !== ORDER_STATUS.CANCELLED) {
    if (order.status !== ORDER_STATUS.CONFIRMED) buttons.push(statusButton(order, ORDER_STATUS.CONFIRMED, 'Confirmar'));
    if (order.status !== ORDER_STATUS.IN_PRODUCTION) buttons.push(statusButton(order, ORDER_STATUS.IN_PRODUCTION, 'Produccion'));
    if (order.status !== ORDER_STATUS.READY) buttons.push(statusButton(order, ORDER_STATUS.READY, 'Listo'));
    buttons.push(statusButton(order, ORDER_STATUS.DELIVERED, 'Entregar', 'btn'));
    buttons.push(statusButton(order, ORDER_STATUS.CANCELLED, 'Cancelar', 'btn-danger'));
  }
  buttons.push(`<button class="btn btn-small btn-secondary" data-action="order-paid" data-paid="${order.paid ? 'false' : 'true'}" data-id="${escapeAttribute(order.id)}">${order.paid ? 'Marcar impago' : 'Marcar pagado'}</button>`);
  return buttons.join('');
}

function statusButton(order, status, label, extraClass = 'btn-secondary') {
  return `<button class="btn btn-small ${extraClass}" data-action="order-status" data-status="${escapeAttribute(status)}" data-id="${escapeAttribute(order.id)}">${escapeHtml(label)}</button>`;
}

function planningCard(title, planning) {
  return `
    <article class="panel table-panel">
      <div class="panel-header">
        <h3>${escapeHtml(title)}</h3>
        <span class="badge badge-info">${planning.orders.length} pedidos</span>
      </div>
      <dl class="summary-list">
        <div><dt>Burritos</dt><dd>${planning.totalUnits}</dd></div>
        <div><dt>Venta esperada</dt><dd>${formatCurrency(planning.expectedRevenue)}</dd></div>
        <div><dt>Coste estimado</dt><dd>${formatCurrency(planning.estimatedCost)}</dd></div>
        <div><dt>Ganancia</dt><dd>${formatCurrency(planning.estimatedProfit)}</dd></div>
      </dl>
      <h4>Necesidades</h4>
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
          `).join('') || '<tr><td colspan="4">Sin pedidos proximos.</td></tr>'}
        </tbody>
      </table>
    </article>
  `;
}

function shoppingCard(items) {
  return `
    <article class="panel table-panel">
      <div class="panel-header">
        <h3>Lista de compra automatica</h3>
        <span class="badge ${items.length ? 'badge-warning' : 'badge-success'}">${items.length ? 'faltantes' : 'sin faltantes'}</span>
      </div>
      <table class="data-table">
        <thead><tr><th>Producto</th><th>Faltante</th><th>Stock</th><th>Proveedor</th><th>Ultimo coste</th></tr></thead>
        <tbody>
          ${items.map((item) => `
            <tr>
              <td>${escapeHtml(item.productName)}</td>
              <td><span class="stock-low">${formatQuantity(item.missingQuantity, item.unit)}</span></td>
              <td>${formatQuantity(item.stockQuantity, item.unit)}</td>
              <td>${escapeHtml(item.supplierName)}</td>
              <td>${formatCurrency(item.lastUnitCost)}<div class="muted">${escapeHtml(item.lastPriceDate || 'sin historial')}</div></td>
            </tr>
          `).join('') || '<tr><td colspan="5">Stock suficiente para pedidos proximos.</td></tr>'}
        </tbody>
      </table>
    </article>
  `;
}

function modifierOptions(data, selectedValues = [], mode) {
  const selected = new Set(normalizeSelectedValues(selectedValues));
  const productIndex = Object.fromEntries(data.products.map((product) => [product.id, product]));
  return data.recipes.flatMap((recipe) => {
    const ingredients = (recipe.ingredients ?? []).filter((ingredient) => {
      if (mode === 'extra') return ingredient.optional || ingredient.extraAvailable;
      return !ingredient.optional && !ingredient.extraAvailable && ['salsa', 'topping'].includes(ingredient.group);
    });

    return ingredients.map((ingredient) => {
      const value = `${recipe.id}::${ingredient.id}`;
      const label = `${recipe.name} - ${mode === 'skip' ? 'sin ' : ''}${productIndex[ingredient.productId]?.name ?? ingredient.productId}`;
      const isSelected = selected.has(ingredient.id) || selected.has(value);
      return option(value, label, isSelected ? value : '');
    });
  }).join('');
}

function normalizeSelectedValues(values) {
  if (Array.isArray(values)) return values;
  return String(values ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
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

function defaultRecipePrice(recipes, recipeId) {
  const recipe = recipes.find((item) => item.id === recipeId) ?? recipes.find((item) => item.status === RECIPE_STATUS.ACTIVE);
  return recipe?.currentSalePrice ?? 5;
}

function clientName(clients, clientId) {
  return clients.find((client) => client.id === clientId)?.name ?? 'Cliente eliminado';
}

function statusBadge(status) {
  if (status === ORDER_STATUS.DELIVERED) return 'badge-success';
  if (status === ORDER_STATUS.CANCELLED) return 'badge-danger';
  if (status === ORDER_STATUS.DRAFT) return 'badge-muted';
  if (status === ORDER_STATUS.READY) return 'badge-info';
  return 'badge-warning';
}

function metric(label, value, hint) {
  return `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(hint)}</small></article>`;
}

function options(source, selectedValue = '') {
  return Object.values(source).map((value) => option(value, value, selectedValue)).join('');
}

function formatQuantity(value, unit) {
  if (unit === 'g') return formatWeight(value);
  return `${formatNumber(value)} ${escapeHtml(unit)}`;
}

function todayString() {
  return new Date().toISOString().slice(0, 10);
}
