import { escapeHtml } from '../html.js';

export function renderPlaceholder({ route, data }) {
  const counts = {
    products: data.products.length,
    suppliers: data.suppliers.length,
    purchases: data.purchases.length,
    stock: data.stockMovements.length,
    production: data.productionBatches.length,
    lots: data.lots.length,
    recipes: data.recipes.length,
    clients: data.clients.length,
    orders: data.orders.length,
    reports: data.productionBatches.length + data.purchases.length
  };

  const count = counts[route.name] ?? 0;

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Modulo preparado</p>
        <h2>${escapeHtml(route.label)}</h2>
      </div>
      <span class="badge badge-muted">Placeholder Etapa 1</span>
    </section>

    <article class="panel empty-state">
      <h3>${escapeHtml(route.label)} existe y navega correctamente</h3>
      <p>
        En esta etapa se deja la pantalla preparada con datos seed y separacion
        de capas. La gestion completa de este modulo se implementara en su etapa.
      </p>
      <p class="muted">Registros seed relacionados: ${count}</p>
    </article>
  `;
}
