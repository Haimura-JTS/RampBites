import { UNITS, STORAGE_LOCATIONS } from '../constants.js';
import { formatCurrency } from '../calculations.js';
import { escapeHtml, option } from '../html.js';

export function renderPurchases({ data }) {
  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Entrada de stock</p>
        <h2>Compras</h2>
      </div>
      <span class="badge badge-info">${data.purchases.length} compras</span>
    </section>

    <article class="panel">
      <h3>Nueva compra</h3>
      <form class="stack-form" data-form="purchase">
        <div class="form-row">
          <label>Fecha<input name="date" type="date" required value="${new Date().toISOString().slice(0, 10)}"></label>
          <label>Proveedor<select name="supplierId" required><option value="">Seleccionar</option>${data.suppliers.filter((supplier) => supplier.active).map((supplier) => option(supplier.id, supplier.name)).join('')}</select></label>
        </div>
        <div class="form-row">
          <label>Total ticket<input name="ticketTotal" type="number" min="0" step="0.01"></label>
          <label>Referencia ticket<input name="ticketReference"></label>
        </div>
        <label>Notas<textarea name="notes" rows="2"></textarea></label>

        <div class="purchase-items" data-purchase-items>
          ${purchaseItemRow(data)}
        </div>
        <div class="button-row">
          <button class="btn btn-secondary" type="button" data-action="add-purchase-item">Añadir item</button>
          <button class="btn" type="submit">Guardar compra</button>
        </div>
      </form>
    </article>

    <article class="panel table-panel">
      <h3>Compras registradas</h3>
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Proveedor</th>
            <th>Items</th>
            <th>Total calculado</th>
            <th>Total ticket</th>
            <th>Diferencia</th>
          </tr>
        </thead>
        <tbody>
          ${data.purchases.map((purchase) => purchaseRow(purchase, data)).join('')}
        </tbody>
      </table>
    </article>
  `;
}

export function purchaseItemRow(data) {
  return `
    <div class="purchase-item-row" data-purchase-item-row>
      <label>Producto<select name="productId" required><option value="">Producto</option>${data.products.filter((product) => product.active).map((product) => option(product.id, product.name)).join('')}</select></label>
      <label>Cantidad<input name="quantity" type="number" min="0" step="0.001" required></label>
      <label>Unidad<select name="unit" required>${Object.values(UNITS).map((unit) => option(unit, unit)).join('')}</select></label>
      <label>Precio total<input name="totalPrice" type="number" min="0" step="0.01" required></label>
      <label>Caducidad<input name="expirationDate" type="date"></label>
      <label>Destino<select name="destinationLocation">${Object.values(STORAGE_LOCATIONS).map((location) => option(location, location)).join('')}</select></label>
      <label>Notas<input name="notes"></label>
      <button class="btn btn-small btn-danger" type="button" data-action="remove-purchase-item">Quitar</button>
    </div>
  `;
}

function purchaseRow(purchase, data) {
  const supplier = data.suppliers.find((item) => item.id === purchase.supplierId);
  return `
    <tr>
      <td>${escapeHtml(purchase.date)}</td>
      <td>${escapeHtml(supplier?.name ?? 'Sin proveedor')}</td>
      <td>${purchase.items.length}</td>
      <td>${formatCurrency(purchase.calculatedTotal)}</td>
      <td>${formatCurrency(purchase.ticketTotal)}</td>
      <td><span class="${Math.abs(purchase.difference) > 0.01 ? 'stock-low' : ''}">${formatCurrency(purchase.difference)}</span></td>
    </tr>
  `;
}
