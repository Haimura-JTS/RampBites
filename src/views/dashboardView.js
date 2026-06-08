import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatWeight
} from '../calculations.js';
import { APP_STAGE } from '../constants.js';
import { getDashboardAnalytics, formatReportQuantity } from '../reports.js';
import { escapeHtml } from '../html.js';

export function renderDashboard({ data }) {
  const analytics = getDashboardAnalytics(data);

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Control operativo</p>
        <h2>Dashboard</h2>
      </div>
      <span class="badge badge-info">${escapeHtml(APP_STAGE)}</span>
    </section>

    <section class="metric-grid">
      ${metricCard('Ventas hoy', formatCurrency(analytics.salesToday.total), `${analytics.salesToday.count} pedidos entregados`)}
      ${metricCard('Ventas semana', formatCurrency(analytics.salesWeek.total), `${analytics.weekStart} a ${analytics.today}`)}
      ${metricCard('Coste estimado', formatCurrency(analytics.salesWeek.estimatedCost), 'Semana movil')}
      ${metricCard('Ganancia bruta', formatCurrency(analytics.salesWeek.grossProfit), formatPercent(analytics.salesWeek.marginPercentage))}
      ${metricCard('Pedidos pendientes', analytics.pendingOrders, 'Pendiente/confirmado/listo')}
      ${metricCard('Pedidos entregados', analytics.deliveredOrders, 'Historico local')}
      ${metricCard('Pendiente cobro', formatCurrency(analytics.pendingCollection), 'Entregados no pagados')}
      ${metricCard('Stock reservado', analytics.stockCommitments.metrics.reservedProducts, formatCurrency(analytics.stockCommitments.metrics.reservedValue))}
      ${metricCard('Valor stock fisico', formatCurrency(analytics.stockCommitments.metrics.physicalValue), 'Inventario antes de reservas')}
      ${metricCard('Burritos posibles hoy', analytics.burritosPossibleToday, analytics.controlRecipe?.name ?? 'Sin receta control')}
      ${metricCard('Producto mas vendido', analytics.topSellingRecipe?.recipeName ?? 'Sin ventas', `${formatNumber(analytics.topSellingRecipe?.quantity ?? 0)} uds`)}
      ${metricCard('Mas rentable', analytics.mostProfitableRecipe?.recipeName ?? 'Sin ventas', formatCurrency(analytics.mostProfitableRecipe?.grossProfit ?? 0))}
      ${metricCard('Menos rentable', analytics.leastProfitableRecipe?.recipeName ?? 'Sin ventas', formatCurrency(analytics.leastProfitableRecipe?.grossProfit ?? 0))}
      ${metricCard('Stock critico', analytics.criticalStock.length, 'Productos bajo minimo')}
    </section>

    <section class="dashboard-grid">
      <article class="panel">
        <div class="panel-header">
          <h3>Alertas</h3>
          <span class="badge ${analytics.criticalStock.length ? 'badge-warning' : 'badge-success'}">stock</span>
        </div>
        <div class="alert-list">
          ${alert('warning', 'Ternera en standby', data.settings.beefStatusNote)}
          ${analytics.limitingIngredient ? alert('info', 'Ingrediente limitante general', `${analytics.limitingIngredient.productName}: permite ${analytics.limitingIngredient.possible} burritos de control.`) : alert('warning', 'Ingrediente limitante general', 'Sin receta de control.')}
          ${analytics.stockCommitments.metrics.reservedProducts > 0 ? alert('info', 'Stock comprometido', `${analytics.stockCommitments.metrics.reservedProducts} productos tienen reservas activas por pedidos.`) : alert('success', 'Stock comprometido', 'No hay reservas activas.')}
          ${analytics.pendingCollection > 0 ? alert('warning', 'Pendiente de cobro', `${formatCurrency(analytics.pendingCollection)} en pedidos entregados no pagados.`) : alert('success', 'Pendiente de cobro', 'No hay entregados pendientes de pago.')}
          ${analytics.expiringLots.length ? alert('warning', 'Lotes por vencer', `${analytics.expiringLots.length} lotes requieren revision.`) : alert('success', 'Lotes por vencer', 'Sin lotes activos urgentes.')}
        </div>
      </article>

      <article class="panel table-panel">
        <div class="panel-header">
          <h3>Stock critico</h3>
        </div>
        <table class="data-table">
          <thead><tr><th>Producto</th><th>Stock</th><th>Minimo</th><th>Ubicacion</th></tr></thead>
          <tbody>
            ${analytics.criticalStock.map((product) => `
              <tr>
                <td><strong>${escapeHtml(product.name)}</strong><div class="muted">${escapeHtml(product.category)}</div></td>
                <td><span class="stock-low">${formatQuantity(product.currentStock, product.baseUnit)}</span></td>
                <td>${formatQuantity(product.stockMinimum, product.baseUnit)}</td>
                <td>${escapeHtml(product.location)}</td>
              </tr>
            `).join('') || '<tr><td colspan="4">Sin productos bajo minimo.</td></tr>'}
          </tbody>
        </table>
      </article>

      <article class="panel table-panel">
        <div class="panel-header">
          <h3>Planificacion hoy/manana</h3>
          <span class="badge badge-info">${analytics.planning.totalUnits} burritos</span>
        </div>
        <table class="data-table">
          <thead><tr><th>Producto</th><th>Necesario</th><th>Disponible</th><th>Faltante</th></tr></thead>
          <tbody>
            ${analytics.planning.availability.map((item) => `
              <tr>
                <td>${escapeHtml(item.productName)}</td>
                <td>${formatReportQuantity(item.quantity, item.unit)}</td>
                <td>${formatReportQuantity(item.available, item.unit)}</td>
                <td><span class="${item.shortage > 0 ? 'stock-low' : ''}">${formatReportQuantity(item.shortage, item.unit)}</span></td>
              </tr>
            `).join('') || '<tr><td colspan="4">Sin pedidos proximos.</td></tr>'}
          </tbody>
        </table>
      </article>

      <article class="panel table-panel">
        <div class="panel-header">
          <h3>Lotes urgentes</h3>
          <span class="badge ${analytics.expiringLots.length ? 'badge-warning' : 'badge-success'}">${analytics.expiringLots.length}</span>
        </div>
        <table class="data-table">
          <thead><tr><th>Lote</th><th>Producto</th><th>Stock</th><th>Estado</th><th>Limite</th></tr></thead>
          <tbody>
            ${analytics.expiringLots.map((lot) => `
              <tr>
                <td><strong>${escapeHtml(lot.lotCode)}</strong></td>
                <td>${escapeHtml(lot.product?.name ?? lot.productId)}</td>
                <td>${formatQuantity(lot.currentQuantity, lot.unit)}</td>
                <td><span class="badge ${lot.computedStatus === 'vencido' ? 'badge-danger' : 'badge-warning'}">${escapeHtml(lot.computedStatus)}</span></td>
                <td>${escapeHtml(lot.expiresAt || 'sin fecha')}</td>
              </tr>
            `).join('') || '<tr><td colspan="5">Sin lotes urgentes.</td></tr>'}
          </tbody>
        </table>
      </article>
    </section>
  `;
}

function metricCard(label, value, hint) {
  return `
    <article class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(hint)}</small>
    </article>
  `;
}

function alert(level, title, message) {
  return `
    <div class="alert alert-${level}">
      <strong>${escapeHtml(title)}</strong>
      <span>${escapeHtml(message)}</span>
    </div>
  `;
}

function formatQuantity(value, unit) {
  if (unit === 'g') return formatWeight(value);
  return `${formatNumber(value)} ${escapeHtml(unit)}`;
}
