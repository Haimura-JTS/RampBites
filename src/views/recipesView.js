import { RECIPE_CATEGORIES, RECIPE_INGREDIENT_GROUPS, RECIPE_STATUS, UNITS } from '../constants.js';
import {
  calculatePossibleUnits,
  calculateRecipeFinancials,
  calculateStockByProduct,
  formatCurrency,
  formatPercent,
  formatWeight
} from '../calculations.js';
import { escapeAttribute, escapeHtml, option } from '../html.js';

export function renderRecipes({ data }) {
  const stock = calculateStockByProduct(data.stockMovements);

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Menu y coste unitario</p>
        <h2>Recetas</h2>
      </div>
      <span class="badge badge-info">${data.recipes.length} recetas</span>
    </section>

    <section class="work-grid">
      <article class="panel">
        <h3>Crear o editar receta</h3>
        <form class="stack-form" data-form="recipe">
          <input type="hidden" name="id">
          <div class="form-row">
            <label>Nombre<input name="name" required></label>
            <label>Categoria<select name="category" required>${options(RECIPE_CATEGORIES)}</select></label>
          </div>
          <div class="form-row">
            <label>Estado<select name="status" required>${options(RECIPE_STATUS)}</select></label>
            <label>Precio venta actual<input name="currentSalePrice" type="number" min="0" step="0.01" value="5"></label>
          </div>
          <div class="form-row">
            <label>Margen objetivo<input name="targetMargin" type="number" min="0" max="1" step="0.01" placeholder="0.45"></label>
            <label>Multiplicador propio<input name="priceMultiplier" type="number" min="0" step="0.1" placeholder="opcional"></label>
          </div>
          <div class="form-row">
            <label>Peso final estimado<input name="estimatedFinalWeight" type="number" min="0" step="1" placeholder="375"></label>
            <label>Alergenos<input name="allergens" placeholder="gluten, lactosa"></label>
          </div>
          <label>Descripcion<textarea name="description" rows="2"></textarea></label>

          <div class="panel-subheader">
            <h4>Ingredientes</h4>
            <button class="btn btn-secondary btn-small" type="button" data-action="add-recipe-ingredient">Anadir ingrediente</button>
          </div>
          <div class="recipe-ingredients" data-recipe-ingredients>
            ${recipeIngredientRow(data.products)}
          </div>

          <label>Notas<textarea name="notes" rows="2"></textarea></label>
          <div class="button-row">
            <button class="btn" type="submit">Guardar receta</button>
            <button class="btn btn-secondary" type="button" data-action="clear-recipe-form">Limpiar</button>
          </div>
        </form>
      </article>

      <article class="panel">
        <h3>Lectura de costes</h3>
        <p class="muted">Los costes usan precio real cuando existe y estimado cuando todavia no hay compra validada. Los extras opcionales no entran en el coste base hasta seleccionarlos en el simulador.</p>
        <div class="alert-list">
          ${recipeAlerts(data)}
        </div>
      </article>
    </section>

    <article class="panel table-panel">
      <div class="panel-header">
        <h3>Menu y precios</h3>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Receta</th>
            <th>Coste</th>
            <th>Precio actual</th>
            <th>Ganancia</th>
            <th>Margen</th>
            <th>Precio sugerido</th>
            <th>Burritos posibles</th>
            <th>Alergenos</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.recipes.map((recipe) => recipeRow(recipe, data, stock)).join('')}
        </tbody>
      </table>
    </article>

    <section class="dashboard-grid">
      ${data.recipes.map((recipe) => breakdownCard(recipe, data)).join('')}
    </section>
  `;
}

export function recipeIngredientRow(products, ingredient = {}) {
  const id = ingredient.id ?? '';
  return `
    <div class="recipe-ingredient-row" data-recipe-ingredient-row>
      <input type="hidden" name="ingredientId" value="${escapeAttribute(id)}">
      <label>Producto<select name="productId" required><option value="">Seleccionar</option>${products.map((product) => option(product.id, product.name, ingredient.productId)).join('')}</select></label>
      <label>Cantidad<input name="quantity" type="number" min="0" step="0.001" value="${escapeAttribute(ingredient.quantity ?? '')}" required></label>
      <label>Unidad<select name="unit" required>${options(UNITS, ingredient.unit)}</select></label>
      <label>Grupo<select name="group">${options(RECIPE_INGREDIENT_GROUPS, ingredient.group ?? ingredient.role)}</select></label>
      <label class="checkbox-line"><input name="required" type="checkbox"${ingredient.required === false ? '' : ' checked'}> Obligatorio</label>
      <label class="checkbox-line"><input name="optional" type="checkbox"${ingredient.optional ? ' checked' : ''}> Opcional</label>
      <label class="checkbox-line"><input name="extraAvailable" type="checkbox"${ingredient.extraAvailable ? ' checked' : ''}> Extra</label>
      <button class="btn btn-small btn-danger" type="button" data-action="remove-recipe-ingredient">Quitar</button>
    </div>
  `;
}

function recipeRow(recipe, data, stock) {
  const financials = calculateRecipeFinancials(recipe, data.products, data.settings);
  const possible = calculatePossibleUnits(recipe, stock);
  return `
    <tr data-recipe-row data-search="${escapeAttribute(`${recipe.name} ${recipe.category} ${recipe.status}`.toLowerCase())}">
      <td>
        <strong>${escapeHtml(recipe.name)}</strong>
        <div class="muted">${escapeHtml(recipe.description || recipe.notes || 'Sin descripcion')}</div>
      </td>
      <td>${formatCurrency(financials.totalCost)}</td>
      <td>${formatCurrency(financials.salePrice)}</td>
      <td>${formatCurrency(financials.grossProfit)}</td>
      <td>${formatPercent(financials.marginPercentage)}</td>
      <td>
        <span class="badge badge-${financials.priceStatus.level}">${escapeHtml(financials.priceStatus.label)}</span>
        <div class="muted">Sano ${formatCurrency(financials.suggestedPrices.healthy)}</div>
      </td>
      <td>${possible}</td>
      <td>${escapeHtml(financials.allergens.join(', ') || 'sin datos')}</td>
      <td><span class="badge ${statusBadge(recipe.status)}">${escapeHtml(recipe.status)}</span></td>
      <td class="action-cell">
        <button class="btn btn-small btn-secondary" data-action="edit-recipe" data-id="${escapeAttribute(recipe.id)}">Editar</button>
        <button class="btn btn-small btn-secondary" data-action="duplicate-recipe" data-id="${escapeAttribute(recipe.id)}">Duplicar</button>
        ${statusButtons(recipe)}
      </td>
    </tr>
  `;
}

function breakdownCard(recipe, data) {
  const financials = calculateRecipeFinancials(recipe, data.products, data.settings);
  const groups = Object.values(RECIPE_INGREDIENT_GROUPS);
  return `
    <article class="panel">
      <div class="panel-header">
        <h3>${escapeHtml(recipe.name)}</h3>
        <span class="badge ${statusBadge(recipe.status)}">${escapeHtml(recipe.status)}</span>
      </div>
      <dl class="summary-list">
        ${groups.map((group) => `<div><dt>${escapeHtml(group)}</dt><dd>${formatCurrency(financials.groupTotals[group] ?? 0)}</dd></div>`).join('')}
        <div><dt>Coste total</dt><dd>${formatCurrency(financials.totalCost)}</dd></div>
        <div><dt>Precio minimo</dt><dd>${formatCurrency(financials.suggestedPrices.minimum)}</dd></div>
        <div><dt>Precio sano</dt><dd>${formatCurrency(financials.suggestedPrices.healthy)}</dd></div>
        <div><dt>Precio premium</dt><dd>${formatCurrency(financials.suggestedPrices.premium)}</dd></div>
        ${financials.targetMarginPrice === null ? '' : `<div><dt>Precio margen objetivo</dt><dd>${formatCurrency(financials.targetMarginPrice)}</dd></div>`}
      </dl>
      ${financials.missingCostIngredients.length > 0 ? `<p class="muted">Sin coste real/estimado: ${escapeHtml(financials.missingCostIngredients.map((item) => item.productName).join(', '))}</p>` : ''}
      <p class="muted">Peso estimado: ${formatWeight(recipe.estimatedFinalWeight ?? recipe.servingSizeG ?? 0)}</p>
    </article>
  `;
}

function recipeAlerts(data) {
  const activeRecipes = data.recipes.filter((recipe) => recipe.status === RECIPE_STATUS.ACTIVE);
  if (activeRecipes.length === 0) {
    return '<div class="alert alert-warning"><strong>Sin recetas activas</strong><span>Marca al menos una receta como activa para operar menu.</span></div>';
  }

  return activeRecipes.map((recipe) => {
    const financials = calculateRecipeFinancials(recipe, data.products, data.settings);
    return `
      <div class="alert alert-${financials.priceStatus.level}">
        <strong>${escapeHtml(recipe.name)}: ${escapeHtml(financials.priceStatus.label)}</strong>
        <span>${escapeHtml(financials.priceStatus.message)} Precio actual ${formatCurrency(financials.salePrice)}.</span>
      </div>
    `;
  }).join('');
}

function statusButtons(recipe) {
  const buttons = [];
  if (recipe.status !== RECIPE_STATUS.ACTIVE) buttons.push(`<button class="btn btn-small btn-secondary" data-action="recipe-status" data-status="${RECIPE_STATUS.ACTIVE}" data-id="${escapeAttribute(recipe.id)}">Activar</button>`);
  if (recipe.status !== RECIPE_STATUS.TEST) buttons.push(`<button class="btn btn-small btn-secondary" data-action="recipe-status" data-status="${RECIPE_STATUS.TEST}" data-id="${escapeAttribute(recipe.id)}">Prueba</button>`);
  if (recipe.status !== RECIPE_STATUS.STANDBY) buttons.push(`<button class="btn btn-small btn-secondary" data-action="recipe-status" data-status="${RECIPE_STATUS.STANDBY}" data-id="${escapeAttribute(recipe.id)}">Standby</button>`);
  if (recipe.status !== RECIPE_STATUS.RETIRED) buttons.push(`<button class="btn btn-small btn-danger" data-action="recipe-status" data-status="${RECIPE_STATUS.RETIRED}" data-id="${escapeAttribute(recipe.id)}">Retirar</button>`);
  return buttons.join('');
}

function statusBadge(status) {
  if (status === RECIPE_STATUS.ACTIVE) return 'badge-success';
  if (status === RECIPE_STATUS.TEST) return 'badge-warning';
  if (status === RECIPE_STATUS.STANDBY) return 'badge-info';
  return 'badge-muted';
}

function options(source, selectedValue = '') {
  return Object.values(source).map((value) => option(value, value, selectedValue)).join('');
}
