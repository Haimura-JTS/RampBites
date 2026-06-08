import { MOVEMENT_TYPES } from '../constants.js';
import { calculateLotSummaries, calculateStockByProduct, calculateStockValue, formatCurrency, formatWeight } from '../calculations.js';
import { escapeAttribute, escapeHtml, option } from '../html.js';

export function renderStock({ data }) {
  const stock = calculateStockByProduct(data.stockMovements);
  const lotSummaries = calculateLotSummaries(data.lots, data.stockMovements, data.products);
  const stockValue = calculateStockValue(data.products, stock);
  const activeProducts = data.products.filter((product) => product.active);
  const lowStock = activeProducts.filter((product) => Number(product.stockMinimum) > 0 && (stock[product.id] ?? 0) <= product.stockMinimum);
  const withoutCost = activeProducts.filter((product) => !product.currentUnitCost && !product.estimatedUnitCost);
  const inFridge = activeProducts.filter((product) => product.location === 'nevera');
  const inFreezer = activeProducts.filter((product) => product.location === 'congelador');

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Movimientos trazables</p>
        <h2>Stock</h2>
      </div>
      <span class="badge badge-info">${data.stockMovements.length} movimientos</span>
    </section>

    <section class="metric-grid">
      ${metric('Valor estimado stock', formatCurrency(stockValue), 'Segun coste actual/estimado')}
      ${metric('Stock bajo', lowStock.length, 'Productos bajo minimo')}
      ${metric('Sin coste', withoutCost.length, 'Pendientes de compra real')}
      ${metric('Nevera / congelador', `${inFridge.length} / ${inFreezer.length}`, 'Productos ubicados')}
    </section>

    <section class="work-grid">
      <article class="panel">
        <h3>Movimiento manual</h3>
        <form class="stack-form" data-form="stock-movement">
          <div class="form-row">
            <label>Producto<select name="productId" required><option value="">Seleccionar</option>${activeProducts.map((product) => option(product.id, product.name)).join('')}</select></label>
            <label>Tipo<select name="type">
              ${option(MOVEMENT_TYPES.ADJUSTMENT, 'ajuste')}
              ${option(MOVEMENT_TYPES.WASTE, 'merma')}
              ${option(MOVEMENT_TYPES.OWN_CONSUMPTION, 'consumo_propio')}
              ${option(MOVEMENT_TYPES.GIFT, 'regalo')}
            </select></label>
          </div>
          <div class="form-row">
            <label>Cantidad<input name="quantity" type="number" min="0" step="0.001" required></label>
            <label>Signo ajuste<select name="direction"><option value="1">Entrada</option><option value="-1">Salida</option></select></label>
          </div>
          <label>Lote opcional<select name="lotId"><option value="">Sin lote</option>${lotSummaries.filter((lot) => lot.currentQuantity > 0).map((lot) => option(lot.id, `${lot.lotCode} - ${lot.product?.name ?? lot.productId} - ${formatQuantity(lot.currentQuantity, lot.unit)}`)).join('')}</select></label>
          <label>Notas<input name="notes"></label>
          <div class="button-row">
            <button class="btn" type="submit">Registrar movimiento</button>
          </div>
        </form>
      </article>

      <article class="panel">
        <h3>Alertas</h3>
        <div class="alert-list">
          ${alert(lowStock.length ? 'warning' : 'success', 'Stock bajo', lowStock.map((product) => product.name).join(', ') || 'Sin productos bajo minimo.')}
          ${alert(withoutCost.length ? 'info' : 'success', 'Productos sin coste', withoutCost.map((product) => product.name).join(', ') || 'Todo producto activo tiene coste.')}
        </div>
      </article>
    </section>

    <article class="panel table-panel">
      <h3>Stock actual</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoria</th>
            <th>Ubicacion</th>
            <th>Stock actual</th>
            <th>Minimo</th>
            <th>Valor</th>
          </tr>
        </thead>
        <tbody>
          ${activeProducts.map((product) => stockRow(product, stock)).join('')}
        </tbody>
      </table>
    </article>
  `;
}

function stockRow(product, stock) {
  const quantity = stock[product.id] ?? 0;
  const unitCost = product.currentUnitCost ?? product.estimatedUnitCost ?? 0;
  const low = Number(product.stockMinimum) > 0 && quantity <= product.stockMinimum;
  return `
    <tr>
      <td>${escapeHtml(product.name)}</td>
      <td>${escapeHtml(product.category)}</td>
      <td>${escapeHtml(product.location)}</td>
      <td><span class="${low ? 'stock-low' : ''}">${formatQuantity(quantity, product.baseUnit)}</span></td>
      <td>${formatQuantity(product.stockMinimum, product.baseUnit)}</td>
      <td>${formatCurrency(Math.max(quantity, 0) * unitCost)}</td>
    </tr>
  `;
}

function metric(label, value, hint) {
  return `<article class="metric-card"><span>${label}</span><strong>${value}</strong><small>${hint}</small></article>`;
}

function alert(level, title, message) {
  return `<div class="alert alert-${level}"><strong>${title}</strong><span>${escapeHtml(message)}</span></div>`;
}

function formatQuantity(value, unit) {
  if (unit === 'g') return formatWeight(value);
  return `${Number(value || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${escapeHtml(unit)}`;
}
