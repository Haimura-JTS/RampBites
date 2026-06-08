import {
  formatCurrency,
  formatNumber,
  formatPercent,
  formatWeight
} from '../calculations.js';
import {
  getCostReport,
  getPriceSupplierReport,
  getProductionReport,
  getSalesReport
} from '../reports.js';
import { escapeHtml } from '../html.js';

export function renderReports({ data }) {
  const production = getProductionReport(data);
  const sales = getSalesReport(data);
  const prices = getPriceSupplierReport(data);
  const costs = getCostReport(data);

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Analitica local</p>
        <h2>Reportes</h2>
      </div>
      <span class="badge badge-info">Datos internos</span>
    </section>

    <section class="dashboard-grid">
      ${salesSummary(sales)}
      ${productionSummary(production)}
      ${pricesSummary(prices)}
      ${costSummary(costs)}
    </section>

    <article class="panel table-panel">
      <div class="panel-header">
        <h3>Reporte de produccion</h3>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Lote</th>
            <th>Carne</th>
            <th>Corte</th>
            <th>Peso crudo</th>
            <th>Peso final</th>
            <th>Rendimiento</th>
            <th>Coste total</th>
            <th>Coste/100 g</th>
            <th>Tiempo</th>
            <th>Observaciones</th>
          </tr>
        </thead>
        <tbody>
          ${production.rows.map((row) => `
            <tr>
              <td>${escapeHtml(row.date)}</td>
              <td><strong>${escapeHtml(row.lotCode || row.batchCode)}</strong></td>
              <td>${escapeHtml(row.meat)}</td>
              <td>${escapeHtml(row.cut)}</td>
              <td>${formatWeight(row.rawWeight)}</td>
              <td>${row.finalWeight ? formatWeight(row.finalWeight) : 'Pendiente'}</td>
              <td>${row.yieldRatio ? formatPercent(row.yieldRatio) : 'Pendiente'}</td>
              <td>${formatCurrency(row.totalCost)}</td>
              <td>${row.costPer100g ? formatCurrency(row.costPer100g) : 'Pendiente'}</td>
              <td>${row.durationMinutes ? `${row.durationMinutes} min` : 'Pendiente'}</td>
              <td>${escapeHtml(row.notes || '')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </article>

    <article class="panel table-panel">
      <div class="panel-header">
        <h3>Reporte de ventas</h3>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Pedido</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Productos</th>
            <th>Total venta</th>
            <th>Coste estimado</th>
            <th>Ganancia</th>
            <th>Margen</th>
            <th>Estado</th>
            <th>Pago</th>
          </tr>
        </thead>
        <tbody>
          ${sales.rows.map((row) => `
            <tr>
              <td><strong>${escapeHtml(row.orderNumber)}</strong></td>
              <td>${escapeHtml(row.clientName)}</td>
              <td>${escapeHtml(row.date)}</td>
              <td>${escapeHtml(row.items)}</td>
              <td>${formatCurrency(row.total)}</td>
              <td>${formatCurrency(row.estimatedCost)}</td>
              <td>${formatCurrency(row.grossProfit)}</td>
              <td>${formatPercent(row.marginPercentage)}</td>
              <td><span class="badge ${statusBadge(row.status)}">${escapeHtml(row.status)}</span></td>
              <td><span class="badge ${row.paid ? 'badge-success' : 'badge-warning'}">${row.paid ? 'pagado' : 'pendiente'}</span></td>
            </tr>
          `).join('') || '<tr><td colspan="10">Sin pedidos registrados.</td></tr>'}
        </tbody>
      </table>
    </article>

    <article class="panel table-panel">
      <div class="panel-header">
        <h3>Reporte de precios y proveedores</h3>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Proveedor</th>
            <th>Ultimo precio</th>
            <th>Minimo</th>
            <th>Maximo</th>
            <th>Variacion</th>
            <th>Compras</th>
            <th>Alerta</th>
          </tr>
        </thead>
        <tbody>
          ${prices.rows.map((row) => `
            <tr>
              <td>${escapeHtml(row.productName)}</td>
              <td>${escapeHtml(row.supplierName)}</td>
              <td>${formatCurrency(row.latestPrice)} / ${escapeHtml(row.normalizedUnit)}<div class="muted">${escapeHtml(row.latestDate)}</div></td>
              <td>${formatCurrency(row.min)}</td>
              <td>${formatCurrency(row.max)}</td>
              <td>${formatPercent(row.variation)}</td>
              <td>${row.count}</td>
              <td>${row.highPriceAlert ? '<span class="badge badge-warning">precio alto</span>' : '<span class="badge badge-success">ok</span>'}</td>
            </tr>
          `).join('') || '<tr><td colspan="8">Sin historial de precios.</td></tr>'}
        </tbody>
      </table>
    </article>

    <article class="panel table-panel">
      <div class="panel-header">
        <h3>Reporte de costes por receta</h3>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Receta</th>
            <th>Estado</th>
            <th>Coste</th>
            <th>Precio actual</th>
            <th>Ganancia</th>
            <th>Margen</th>
            <th>Burritos posibles</th>
            <th>Precio</th>
          </tr>
        </thead>
        <tbody>
          ${costs.map((row) => `
            <tr>
              <td><strong>${escapeHtml(row.recipeName)}</strong></td>
              <td><span class="badge">${escapeHtml(row.status)}</span></td>
              <td>${formatCurrency(row.cost)}</td>
              <td>${formatCurrency(row.salePrice)}</td>
              <td>${formatCurrency(row.grossProfit)}</td>
              <td>${formatPercent(row.marginPercentage)}</td>
              <td>${formatNumber(row.possibleUnits)}</td>
              <td>${escapeHtml(row.priceStatus)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </article>
  `;
}

function salesSummary(report) {
  return `
    <article class="panel">
      <div class="panel-header"><h3>Ventas</h3></div>
      <dl class="summary-list">
        <div><dt>Total vendido</dt><dd>${formatCurrency(report.metrics.totalSold)}</dd></div>
        <div><dt>Total cobrado</dt><dd>${formatCurrency(report.metrics.totalCollected)}</dd></div>
        <div><dt>Pendiente cobro</dt><dd>${formatCurrency(report.metrics.pendingCollection)}</dd></div>
        <div><dt>Ganancia bruta</dt><dd>${formatCurrency(report.metrics.grossProfit)}</dd></div>
        <div><dt>Margen promedio</dt><dd>${formatPercent(report.metrics.averageMargin)}</dd></div>
      </dl>
    </article>
  `;
}

function productionSummary(report) {
  return `
    <article class="panel">
      <div class="panel-header"><h3>Produccion</h3></div>
      <dl class="summary-list">
        <div><dt>Rendimiento promedio</dt><dd>${formatPercent(report.metrics.averageYield)}</dd></div>
        <div><dt>Coste promedio 100 g</dt><dd>${formatCurrency(report.metrics.averageCostPer100g)}</dd></div>
        <div><dt>Mejor proveedor</dt><dd>${escapeHtml(report.metrics.bestSupplierByFinalCost?.label ?? 'Sin datos')}</dd></div>
        <div><dt>Mejor corte</dt><dd>${escapeHtml(report.metrics.bestCutByYield?.label ?? 'Sin datos')}</dd></div>
      </dl>
    </article>
  `;
}

function pricesSummary(report) {
  return `
    <article class="panel">
      <div class="panel-header"><h3>Precios</h3></div>
      <dl class="summary-list">
        <div><dt>Proveedores usados</dt><dd>${report.metrics.supplierCount}</dd></div>
        <div><dt>Proveedor mas usado</dt><dd>${escapeHtml(report.metrics.mostUsedSupplier?.name ?? 'Sin datos')}</dd></div>
        <div><dt>Alertas precio alto</dt><dd>${report.metrics.highPriceAlerts.length}</dd></div>
        <div><dt>Productos con historial</dt><dd>${report.metrics.cheapestByProduct.length}</dd></div>
      </dl>
    </article>
  `;
}

function costSummary(rows) {
  const profitable = rows.filter((row) => row.grossProfit > 0).length;
  return `
    <article class="panel">
      <div class="panel-header"><h3>Costes</h3></div>
      <dl class="summary-list">
        <div><dt>Recetas analizadas</dt><dd>${rows.length}</dd></div>
        <div><dt>Con ganancia positiva</dt><dd>${profitable}</dd></div>
        <div><dt>Coste medio</dt><dd>${formatCurrency(average(rows.map((row) => row.cost)))}</dd></div>
        <div><dt>Margen medio</dt><dd>${formatPercent(average(rows.map((row) => row.marginPercentage)))}</dd></div>
      </dl>
    </article>
  `;
}

function statusBadge(status) {
  if (status === 'entregado') return 'badge-success';
  if (status === 'cancelado') return 'badge-danger';
  if (status === 'borrador') return 'badge-muted';
  return 'badge-warning';
}

function average(values) {
  const valid = values.filter((value) => Number.isFinite(Number(value)));
  if (valid.length === 0) return 0;
  return valid.reduce((total, value) => total + Number(value), 0) / valid.length;
}
