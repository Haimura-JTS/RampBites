import { formatCurrency, formatPercent } from '../calculations.js';
import { escapeAttribute, escapeHtml, option } from '../html.js';
import { getPriceHistoryStats } from '../services/businessService.js';

const SUPPLIER_TYPES = ['carniceria', 'supermercado', 'mayorista', 'online', 'otro'];
const PRICE_LEVELS = ['barato', 'medio', 'caro'];

export function renderSuppliers({ data }) {
  const stats = getPriceHistoryStats(data);
  const productsById = Object.fromEntries(data.products.map((product) => [product.id, product]));

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Origen y precios</p>
        <h2>Proveedores</h2>
      </div>
      <span class="badge badge-info">${data.suppliers.length} proveedores</span>
    </section>

    <section class="work-grid">
      <article class="panel">
        <h3>Crear o editar proveedor</h3>
        <form class="stack-form" data-form="supplier">
          <input type="hidden" name="id">
          <div class="form-row">
            <label>Nombre<input name="name" required></label>
            <label>Tipo<select name="type">${SUPPLIER_TYPES.map((type) => option(type, type)).join('')}</select></label>
          </div>
          <div class="form-row">
            <label>Direccion<input name="address"></label>
            <label>Ciudad<input name="city"></label>
          </div>
          <div class="form-row">
            <label>Telefono<input name="phone"></label>
            <label>WhatsApp<input name="whatsapp"></label>
          </div>
          <div class="form-row">
            <label>Email<input name="email" type="email"></label>
            <label>Horario<input name="schedule"></label>
          </div>
          <div class="form-row">
            <label>Calidad percibida<input name="perceivedQuality" type="number" min="0" max="5" step="1" value="3"></label>
            <label>Precio percibido<select name="perceivedPrice">${PRICE_LEVELS.map((level) => option(level, level)).join('')}</select></label>
          </div>
          <label>Productos habituales<input name="usualProducts" placeholder="cuello cerdo, caldo"></label>
          <label>Notas<textarea name="notes" rows="3"></textarea></label>
          <div class="button-row">
            <button class="btn" type="submit">Guardar proveedor</button>
            <button class="btn btn-secondary" type="button" data-action="clear-supplier-form">Limpiar</button>
          </div>
        </form>
      </article>

      <article class="panel">
        <h3>Resumen de precios</h3>
        <ul class="plain-list">
          ${stats.slice(0, 6).map((entry) => `
            <li>${escapeHtml(productsById[entry.productId]?.name ?? entry.productId)}: ${formatCurrency(entry.latest)} / ${escapeHtml(entry.normalizedUnit)}</li>
          `).join('') || '<li class="muted">Sin historial todavia.</li>'}
        </ul>
      </article>
    </section>

    <article class="panel table-panel">
      <table class="data-table">
        <thead>
          <tr>
            <th>Proveedor</th>
            <th>Tipo</th>
            <th>Compras</th>
            <th>Precio medio por producto</th>
            <th>Percepcion</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.suppliers.map((supplier) => supplierRow(supplier, data, stats, productsById)).join('')}
        </tbody>
      </table>
    </article>
  `;
}

function supplierRow(supplier, data, stats, productsById) {
  const purchases = data.purchases.filter((purchase) => purchase.supplierId === supplier.id);
  const supplierStats = stats.filter((entry) => entry.supplierId === supplier.id);
  const averages = supplierStats.map((entry) => {
    const productName = productsById[entry.productId]?.name ?? entry.productId;
    return `${productName}: ${formatCurrency((entry.min + entry.max) / 2)} / ${entry.normalizedUnit}`;
  });

  return `
    <tr>
      <td><strong>${escapeHtml(supplier.name)}</strong><div class="muted">${escapeHtml(supplier.city || supplier.notes || '')}</div></td>
      <td>${escapeHtml(supplier.type)}</td>
      <td>${purchases.length}</td>
      <td>${escapeHtml(averages.join(', ') || 'Sin compras')}</td>
      <td>${supplier.perceivedQuality}/5 - ${escapeHtml(supplier.perceivedPrice)}</td>
      <td class="action-cell">
        <button class="btn btn-small btn-secondary" data-action="edit-supplier" data-id="${escapeAttribute(supplier.id)}">Editar</button>
        <button class="btn btn-small btn-secondary" data-action="view-supplier" data-id="${escapeAttribute(supplier.id)}">Compras</button>
        ${supplier.active ? `<button class="btn btn-small btn-danger" data-action="deactivate-supplier" data-id="${escapeAttribute(supplier.id)}">Desactivar</button>` : '<span class="badge badge-muted">inactivo</span>'}
      </td>
    </tr>
  `;
}
