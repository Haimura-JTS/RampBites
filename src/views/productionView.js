import { STOCK_TYPES, STORAGE_LOCATIONS } from '../constants.js';
import { calculateLotSummaries, formatCurrency, formatWeight } from '../calculations.js';
import { escapeHtml, option } from '../html.js';

export function renderProduction({ data }) {
  const lotSummaries = calculateLotSummaries(data.lots, data.stockMovements, data.products);
  const rawLots = lotSummaries.filter((lot) => lot.currentQuantity > 0 && lot.product?.stockType === STOCK_TYPES.RAW);
  const neutralLots = lotSummaries.filter((lot) => lot.currentQuantity > 0 && lot.product?.stockType === STOCK_TYPES.COOKED_NEUTRAL);
  const cookedNeutralProducts = data.products.filter((product) => product.active && product.stockType === STOCK_TYPES.COOKED_NEUTRAL);
  const flavoredProducts = data.products.filter((product) => product.active && product.stockType === STOCK_TYPES.FLAVORED);
  const inputProducts = data.products.filter((product) => product.active && product.stockType !== STOCK_TYPES.PACKAGING);
  const pendingBatches = data.productionBatches.filter((batch) => !batch.resultLotId);

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Tandas y rendimiento</p>
        <h2>Produccion</h2>
      </div>
      <span class="badge badge-info">${data.productionBatches.length} tandas</span>
    </section>

    <section class="work-grid">
      <article class="panel">
        <h3>Nueva produccion finalizada</h3>
        <form class="stack-form" data-form="production">
          <div class="form-row">
            <label>Tipo<input name="type" placeholder="cerdo / pollo" value="cerdo"></label>
            <label>Fecha<input name="date" type="date" value="${new Date().toISOString().slice(0, 10)}"></label>
          </div>
          <div class="form-row">
            <label>Lote carne cruda<select name="rawLotId" required><option value="">Seleccionar</option>${rawLots.map((lot) => option(lot.id, `${lot.lotCode} - ${lot.product.name} - ${formatWeight(lot.currentQuantity)}`)).join('')}</select></label>
            <label>Peso crudo usado<input name="rawWeightUsed" type="number" min="0" step="0.001" required></label>
          </div>
          <div class="form-row">
            <label>Producto resultado<select name="resultProductId" required><option value="">Seleccionar</option>${cookedNeutralProducts.map((product) => option(product.id, product.name)).join('')}</select></label>
            <label>Peso final hidratado<input name="finalWeight" type="number" min="0" step="0.001" required></label>
          </div>
          <div class="form-row">
            <label>Peso escurrido<input name="drainedWeight" type="number" min="0" step="0.001"></label>
            <label>Coste carne usado<input name="meatCost" type="number" min="0" step="0.01" placeholder="auto por lote"></label>
          </div>
          <div class="form-row">
            <label>Inicio<input name="startTime" type="time"></label>
            <label>Fin<input name="endTime" type="time"></label>
          </div>
          <div class="form-row">
            <label>Liquido inicial ml<input name="liquidInitialMl" type="number" min="0" step="1"></label>
            <label>Caldo total ml<input name="brothTotalMl" type="number" min="0" step="1"></label>
          </div>
          <div class="form-row">
            <label>Caldo sobrante ml<input name="brothLeftMl" type="number" min="0" step="1"></label>
            <label>Fuego<input name="heatLevel" placeholder="bajo"></label>
          </div>
          <div class="form-row">
            <label>Metodo<select name="method">${['olla', 'presion', 'slow cooker', 'horno'].map((value) => option(value, value)).join('')}</select></label>
            <label>Ubicacion<select name="location">${locationOptions()}</select></label>
          </div>
          <div class="form-row">
            <label>Fecha limite uso<input name="expiresAt" type="date"></label>
            <label>Codigo lote opcional<input name="batchCode" placeholder="CERDO-2026-06-04-T003"></label>
          </div>
          <div class="production-inputs" data-production-inputs>
            ${productionInputRow(inputProducts, lotSummaries)}
          </div>
          <div class="button-row">
            <button class="btn btn-secondary" type="button" data-action="add-production-input">Añadir insumo</button>
            <button class="btn" type="submit">Finalizar produccion</button>
          </div>
          <label>Notas<textarea name="notes" rows="2"></textarea></label>
        </form>
      </article>

      <article class="panel">
        <h3>Completar produccion pendiente</h3>
        <form class="stack-form" data-form="complete-production">
          <label>Tanda pendiente<select name="batchId" required><option value="">Seleccionar</option>${pendingBatches.map((batch) => option(batch.id, `${batch.batchCode} - ${formatWeight(batch.rawWeightUsed)}`)).join('')}</select></label>
          <div class="form-row">
            <label>Producto resultado<select name="resultProductId" required><option value="">Seleccionar</option>${cookedNeutralProducts.map((product) => option(product.id, product.name)).join('')}</select></label>
            <label>Peso final<input name="finalWeight" type="number" min="0" step="0.001" required></label>
          </div>
          <div class="form-row">
            <label>Peso escurrido<input name="drainedWeight" type="number" min="0" step="0.001"></label>
            <label>Fin<input name="endTime" type="time"></label>
          </div>
          <div class="form-row">
            <label>Ubicacion<select name="location">${locationOptions()}</select></label>
            <label>Fecha limite uso<input name="expiresAt" type="date"></label>
          </div>
          <label>Notas<input name="notes"></label>
          <button class="btn" type="submit">Completar pendiente</button>
        </form>
      </article>
    </section>

    <section class="work-grid">
      <article class="panel">
        <h3>Saborizar carne neutra</h3>
        <form class="stack-form" data-form="flavoring">
          <label>Lote neutro origen<select name="sourceLotId" required><option value="">Seleccionar</option>${neutralLots.map((lot) => option(lot.id, `${lot.lotCode} - ${lot.product.name} - ${formatWeight(lot.currentQuantity)}`)).join('')}</select></label>
          <div class="form-row">
            <label>Resultado saborizado<select name="resultProductId" required><option value="">Seleccionar</option>${flavoredProducts.map((product) => option(product.id, product.name)).join('')}</select></label>
            <label>Cantidad carne<input name="quantity" type="number" min="0" step="0.001" required></label>
          </div>
          <div class="form-row">
            <label>Producto sabor<select name="flavorProductId"><option value="">Sin insumo</option>${inputProducts.map((product) => option(product.id, product.name)).join('')}</select></label>
            <label>Lote sabor opcional<select name="flavorLotId"><option value="">Sin lote</option>${lotSummaries.filter((lot) => lot.currentQuantity > 0).map((lot) => option(lot.id, `${lot.lotCode} - ${lot.product?.name ?? lot.productId}`)).join('')}</select></label>
          </div>
          <div class="form-row">
            <label>Cantidad sabor<input name="flavorQuantity" type="number" min="0" step="0.001"></label>
            <label>Ubicacion<select name="location">${locationOptions()}</select></label>
          </div>
          <label>Fecha limite uso<input name="expiresAt" type="date"></label>
          <label>Notas<input name="notes"></label>
          <button class="btn" type="submit">Crear lote saborizado</button>
        </form>
      </article>

      <article class="panel">
        <h3>Tandas registradas</h3>
        <table class="data-table">
          <thead><tr><th>Tanda</th><th>Estado</th><th>Crudo</th><th>Final</th><th>Coste 100g</th></tr></thead>
          <tbody>
            ${data.productionBatches.map((batch) => `
              <tr>
                <td>${escapeHtml(batch.batchCode)}</td>
                <td><span class="badge">${escapeHtml(batch.status)}</span></td>
                <td>${formatWeight(batch.rawWeightUsed)}</td>
                <td>${batch.finalWeight ? formatWeight(batch.finalWeight) : 'Pendiente'}</td>
                <td>${batch.finalCostPer100g ? formatCurrency(batch.finalCostPer100g) : 'Pendiente'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </article>
    </section>
  `;
}

export function productionInputRow(products, lots) {
  return `
    <div class="production-input-row" data-production-input-row>
      <label>Insumo<select name="productId"><option value="">Sin insumo</option>${products.map((product) => option(product.id, product.name)).join('')}</select></label>
      <label>Lote opcional<select name="lotId"><option value="">Sin lote</option>${lots.filter((lot) => lot.currentQuantity > 0).map((lot) => option(lot.id, `${lot.lotCode} - ${lot.product?.name ?? lot.productId}`)).join('')}</select></label>
      <label>Cantidad<input name="quantity" type="number" min="0" step="0.001"></label>
      <button class="btn btn-small btn-danger" type="button" data-action="remove-production-input">Quitar</button>
    </div>
  `;
}

function locationOptions() {
  return [STORAGE_LOCATIONS.FRIDGE, STORAGE_LOCATIONS.FREEZER].map((value) => option(value, value)).join('');
}
