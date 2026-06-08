import { RECIPE_STATUS } from '../constants.js';
import {
  calculateLimitingIngredient,
  calculatePossibleUnits,
  calculateRecipeFinancials,
  calculateRecipeSimulation,
  calculateStockByProduct,
  formatCurrency,
  formatNumber,
  formatPercent,
  formatWeight
} from '../calculations.js';
import { escapeAttribute, escapeHtml, option } from '../html.js';

export function renderSimulator({ data, route }) {
  const stock = calculateStockByProduct(data.stockMovements);
  const params = route?.params ?? new URLSearchParams();
  const selectedRecipe = getSelectedRecipe(data.recipes, params.get('recipeId'));
  const quantity = Math.max(Number(params.get('quantity')) || 1, 1);
  const extraIngredientIds = params.getAll('extra');
  const excludedIngredientIds = params.getAll('skip');
  const options = { extraIngredientIds, excludedIngredientIds };
  const simulation = selectedRecipe
    ? calculateRecipeSimulation(selectedRecipe, stock, data.products, quantity, data.settings, options)
    : null;

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Burritos posibles y precios</p>
        <h2>Simulador</h2>
      </div>
      <span class="badge badge-info">${data.recipes.length} recetas</span>
    </section>

    <section class="work-grid">
      <article class="panel">
        <h3>Simular produccion</h3>
        <form class="stack-form" data-form="simulation">
          <div class="form-row">
            <label>Receta<select name="recipeId" required>${data.recipes.map((recipe) => option(recipe.id, `${recipe.name} (${recipe.status})`, selectedRecipe?.id)).join('')}</select></label>
            <label>Quiero producir<input name="quantity" type="number" min="1" step="1" value="${escapeAttribute(quantity)}"></label>
          </div>
          ${selectedRecipe ? modifiers(selectedRecipe, extraIngredientIds, excludedIngredientIds, data.products) : ''}
          <button class="btn" type="submit">Calcular</button>
        </form>
      </article>

      <article class="panel">
        <h3>Resultado</h3>
        ${simulation ? resultSummary(simulation) : '<p class="muted">Selecciona una receta para simular.</p>'}
      </article>
    </section>

    ${simulation ? simulationTables(simulation) : ''}

    <article class="panel table-panel">
      <div class="panel-header">
        <h3>Comparador de recetas</h3>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Receta</th>
            <th>Coste</th>
            <th>Precio actual</th>
            <th>Ganancia</th>
            <th>Margen</th>
            <th>Burritos posibles</th>
            <th>Ingrediente limitante</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          ${data.recipes.map((recipe) => comparatorRow(recipe, data, stock)).join('')}
        </tbody>
      </table>
    </article>
  `;
}

function resultSummary(simulation) {
  const limiting = simulation.limitingIngredient;
  return `
    <section class="metric-grid metric-grid-compact">
      ${metric('Maximo posible', `${simulation.possibleUnits} uds`, limiting ? `Limitante: ${limiting.productName}` : 'Sin ingredientes')}
      ${metric('Coste tanda', formatCurrency(simulation.totalProductionCost), `${formatCurrency(simulation.unitCost)} por burrito`)}
      ${metric('Venta esperada', formatCurrency(simulation.expectedRevenue), `${formatCurrency(simulation.salePrice)} por burrito`)}
      ${metric('Margen esperado', formatPercent(simulation.expectedMarginPercentage), formatCurrency(simulation.expectedGrossProfit))}
    </section>
    <div class="alert alert-${simulation.priceStatus.level}">
      <strong>${escapeHtml(simulation.priceStatus.label)}</strong>
      <span>${escapeHtml(simulation.priceStatus.message)}</span>
    </div>
  `;
}

function simulationTables(simulation) {
  return `
    <section class="dashboard-grid">
      <article class="panel table-panel">
        <div class="panel-header">
          <h3>Necesario, faltante y restante</h3>
        </div>
        <table class="data-table">
          <thead>
            <tr>
              <th>Ingrediente</th>
              <th>Por burrito</th>
              <th>Necesario</th>
              <th>Stock</th>
              <th>Faltante</th>
              <th>Restante</th>
              <th>Permite</th>
            </tr>
          </thead>
          <tbody>
            ${simulation.ingredients.map((ingredient) => `
              <tr>
                <td><strong>${escapeHtml(ingredient.productName)}</strong><div class="muted">${escapeHtml(ingredient.group)}</div></td>
                <td>${formatQuantity(ingredient.quantity, ingredient.unit)}</td>
                <td>${formatQuantity(ingredient.requiredTotal, ingredient.unit)}</td>
                <td>${formatQuantity(ingredient.available, ingredient.unit)}</td>
                <td><span class="${ingredient.shortage > 0 ? 'stock-low' : ''}">${formatQuantity(ingredient.shortage, ingredient.unit)}</span></td>
                <td>${formatQuantity(ingredient.remaining, ingredient.unit)}</td>
                <td>${ingredient.possibleUnits}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </article>

      <article class="panel">
        <h3>Precios recomendados</h3>
        <dl class="summary-list">
          <div><dt>Precio minimo</dt><dd>${formatCurrency(simulation.suggestedPrices.minimum)}</dd></div>
          <div><dt>Precio sano</dt><dd>${formatCurrency(simulation.suggestedPrices.healthy)}</dd></div>
          <div><dt>Precio premium</dt><dd>${formatCurrency(simulation.suggestedPrices.premium)}</dd></div>
          <div><dt>Alergenos</dt><dd>${escapeHtml(simulation.allergens.join(', ') || 'sin datos')}</dd></div>
        </dl>
      </article>
    </section>
  `;
}

function comparatorRow(recipe, data, stock) {
  const financials = calculateRecipeFinancials(recipe, data.products, data.settings);
  const possible = calculatePossibleUnits(recipe, stock);
  const limiting = calculateLimitingIngredient(recipe, stock);
  const product = data.products.find((item) => item.id === limiting?.productId);

  return `
    <tr>
      <td><strong>${escapeHtml(recipe.name)}</strong></td>
      <td>${formatCurrency(financials.totalCost)}</td>
      <td>${formatCurrency(financials.salePrice)}</td>
      <td>${formatCurrency(financials.grossProfit)}</td>
      <td>${formatPercent(financials.marginPercentage)}</td>
      <td>${possible}</td>
      <td>${escapeHtml(product?.name ?? limiting?.productId ?? 'Sin datos')}</td>
      <td><span class="badge ${statusBadge(recipe.status)}">${escapeHtml(recipe.status)}</span></td>
    </tr>
  `;
}

function modifiers(recipe, extraIds, skipIds, products) {
  const productIndex = Object.fromEntries(products.map((product) => [product.id, product]));
  const extras = (recipe.ingredients ?? []).filter((ingredient) => ingredient.extraAvailable || ingredient.optional);
  const skippable = (recipe.ingredients ?? []).filter((ingredient) => (
    !ingredient.optional
    && !ingredient.extraAvailable
    && ['salsa', 'topping'].includes(ingredient.group ?? ingredient.role)
  ));

  return `
    <div class="modifier-grid">
      <fieldset>
        <legend>Extras</legend>
        ${extras.length === 0 ? '<p class="muted">Sin extras configurados.</p>' : extras.map((ingredient) => checkbox('extra', ingredient.id, labelIngredient(ingredient, productIndex), extraIds.includes(ingredient.id))).join('')}
      </fieldset>
      <fieldset>
        <legend>Quitar ingredientes</legend>
        ${skippable.length === 0 ? '<p class="muted">Sin ingredientes opcionales para quitar.</p>' : skippable.map((ingredient) => checkbox('skip', ingredient.id, `Sin ${labelIngredient(ingredient, productIndex)}`, skipIds.includes(ingredient.id))).join('')}
      </fieldset>
    </div>
  `;
}

function checkbox(name, value, label, checked) {
  return `
    <label class="checkbox-line">
      <input name="${escapeAttribute(name)}" value="${escapeAttribute(value)}" type="checkbox"${checked ? ' checked' : ''}>
      ${escapeHtml(label)}
    </label>
  `;
}

function metric(label, value, hint) {
  return `
    <article class="metric-card">
      <span>${escapeHtml(label)}</span>
      <strong>${escapeHtml(value)}</strong>
      <small>${escapeHtml(hint)}</small>
    </article>
  `;
}

function getSelectedRecipe(recipes, selectedId) {
  return recipes.find((recipe) => recipe.id === selectedId)
    ?? recipes.find((recipe) => recipe.status === RECIPE_STATUS.ACTIVE)
    ?? recipes[0]
    ?? null;
}

function labelIngredient(ingredient, productIndex) {
  const productName = productIndex[ingredient.productId]?.name ?? ingredient.productId;
  return `${productName} (${formatQuantity(ingredient.quantity, ingredient.unit)})`;
}

function formatQuantity(value, unit) {
  if (unit === 'g') return formatWeight(value);
  return `${formatNumber(value)} ${escapeHtml(unit)}`;
}

function statusBadge(status) {
  if (status === RECIPE_STATUS.ACTIVE) return 'badge-success';
  if (status === RECIPE_STATUS.TEST) return 'badge-warning';
  if (status === RECIPE_STATUS.STANDBY) return 'badge-info';
  return 'badge-muted';
}
