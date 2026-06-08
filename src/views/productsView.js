import { PRODUCT_CATEGORIES, STORAGE_LOCATIONS, UNITS } from '../constants.js';
import { calculateStockByProduct, formatCurrency, formatWeight } from '../calculations.js';
import { escapeAttribute, escapeHtml, option } from '../html.js';

export function renderProducts({ data }) {
  const stock = calculateStockByProduct(data.stockMovements);

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Catalogo editable</p>
        <h2>Productos</h2>
      </div>
      <span class="badge badge-info">${data.products.length} productos</span>
    </section>

    <section class="work-grid">
      <article class="panel">
        <h3>Crear o editar producto</h3>
        <form class="stack-form" data-form="product">
          <input type="hidden" name="id">
          <div class="form-row">
            <label>Nombre<input name="name" required></label>
            <label>Categoria<select name="category" required>${options(PRODUCT_CATEGORIES)}</select></label>
          </div>
          <div class="form-row">
            <label>Subcategoria<input name="subcategory"></label>
            <label>Unidad base<select name="baseUnit" required>${options(UNITS)}</select></label>
          </div>
          <div class="form-row">
            <label>Stock minimo<input name="stockMinimum" type="number" min="0" step="0.01" value="0"></label>
            <label>Coste real unitario<input name="currentUnitCost" type="number" min="0" step="0.0001"></label>
          </div>
          <div class="form-row">
            <label>Coste estimado<input name="estimatedUnitCost" type="number" min="0" step="0.0001"></label>
            <label>Proveedor preferido<select name="preferredSupplierId"><option value="">Sin asignar</option>${data.suppliers.map((supplier) => option(supplier.id, supplier.name)).join('')}</select></label>
          </div>
          <div class="form-row">
            <label>Ubicacion<select name="location">${options(STORAGE_LOCATIONS)}</select></label>
            <label>Fecha caducidad<input name="expirationDate" type="date"></label>
          </div>
          <div class="form-row">
            <label>Fecha apertura<input name="openedAt" type="date"></label>
            <label>Alergenos<input name="allergens" placeholder="gluten, lactosa"></label>
          </div>
          <label class="checkbox-line"><input name="requiresCold" type="checkbox"> Requiere frio</label>
          <label>Notas<textarea name="notes" rows="3"></textarea></label>
          <div class="button-row">
            <button class="btn" type="submit">Guardar producto</button>
            <button class="btn btn-secondary" type="button" data-action="clear-product-form">Limpiar</button>
          </div>
        </form>
      </article>

      <article class="panel">
        <h3>Filtros</h3>
        <div class="filter-grid" data-product-filters>
          <label>Buscar<input data-filter="product-search" placeholder="Nombre, categoria, notas"></label>
          <label>Categoria<select data-filter="product-category"><option value="">Todas</option>${options(PRODUCT_CATEGORIES)}</select></label>
          <label>Ubicacion<select data-filter="product-location"><option value="">Todas</option>${options(STORAGE_LOCATIONS)}</select></label>
          <label>Estado<select data-filter="product-active"><option value="">Todos</option><option value="active">Activos</option><option value="inactive">Inactivos</option></select></label>
        </div>
      </article>
    </section>

    <article class="panel table-panel">
      <div class="panel-header"><h3>Listado</h3></div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th>Categoria</th>
            <th>Ubicacion</th>
            <th>Stock</th>
            <th>Coste</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.products.map((product) => productRow(product, stock)).join('')}
        </tbody>
      </table>
    </article>
  `;
}

function productRow(product, stock) {
  const currentStock = stock[product.id] ?? 0;
  const low = product.active && Number(product.stockMinimum) > 0 && currentStock <= product.stockMinimum;
  const unitCost = product.currentUnitCost ?? product.estimatedUnitCost ?? 0;
  return `
    <tr
      data-product-row
      data-search="${escapeAttribute(`${product.name} ${product.category} ${product.notes}`.toLowerCase())}"
      data-category="${escapeAttribute(product.category)}"
      data-location="${escapeAttribute(product.location)}"
      data-active="${product.active ? 'active' : 'inactive'}"
    >
      <td>
        <strong>${escapeHtml(product.name)}</strong>
        <div class="muted">${escapeHtml(product.subcategory || 'Sin subcategoria')}</div>
      </td>
      <td>${escapeHtml(product.category)}</td>
      <td>${escapeHtml(product.location)}</td>
      <td><span class="${low ? 'stock-low' : ''}">${formatQuantity(currentStock, product.baseUnit)}</span></td>
      <td>${unitCost ? formatCurrency(unitCost) : '<span class="badge badge-warning">sin coste</span>'}</td>
      <td><span class="badge ${product.active ? 'badge-success' : 'badge-muted'}">${product.active ? 'activo' : 'inactivo'}</span></td>
      <td class="action-cell">
        <button class="btn btn-small btn-secondary" data-action="edit-product" data-id="${escapeAttribute(product.id)}">Editar</button>
        <button class="btn btn-small btn-secondary" data-action="view-product" data-id="${escapeAttribute(product.id)}">Detalle</button>
        ${product.active ? `<button class="btn btn-small btn-danger" data-action="deactivate-product" data-id="${escapeAttribute(product.id)}">Desactivar</button>` : ''}
      </td>
    </tr>
  `;
}

function formatQuantity(value, unit) {
  if (unit === UNITS.GRAMS) return formatWeight(value);
  return `${Number(value).toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${escapeHtml(unit)}`;
}

function options(source) {
  return Object.values(source).map((value) => option(value, value)).join('');
}
