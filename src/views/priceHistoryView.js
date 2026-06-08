import { formatCurrency, formatPercent } from '../calculations.js';
import { escapeHtml } from '../html.js';
import { getPriceHistoryStats } from '../services/businessService.js';

export function renderPriceHistory({ data }) {
  const stats = getPriceHistoryStats(data);
  const productsById = Object.fromEntries(data.products.map((product) => [product.id, product]));
  const suppliersById = Object.fromEntries(data.suppliers.map((supplier) => [supplier.id, supplier]));

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Comparativa</p>
        <h2>Historial de precios</h2>
      </div>
      <span class="badge badge-info">${data.priceHistory.length} precios</span>
    </section>

    <article class="panel table-panel">
      <table class="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Proveedor</th>
            <th>Minimo</th>
            <th>Maximo</th>
            <th>Ultimo</th>
            <th>Variacion</th>
            <th>Muestras</th>
          </tr>
        </thead>
        <tbody>
          ${stats.map((entry) => `
            <tr>
              <td>${escapeHtml(productsById[entry.productId]?.name ?? entry.productId)}</td>
              <td>${escapeHtml(suppliersById[entry.supplierId]?.name ?? entry.supplierId)}</td>
              <td>${formatCurrency(entry.min)} / ${escapeHtml(entry.normalizedUnit)}</td>
              <td>${formatCurrency(entry.max)} / ${escapeHtml(entry.normalizedUnit)}</td>
              <td>${formatCurrency(entry.latest)} / ${escapeHtml(entry.normalizedUnit)}<div class="muted">${escapeHtml(entry.latestDate)}</div></td>
              <td>${formatPercent(entry.variation)}</td>
              <td>${entry.count}</td>
            </tr>
          `).join('') || '<tr><td colspan="7" class="muted">Sin historial de precios.</td></tr>'}
        </tbody>
      </table>
    </article>
  `;
}
