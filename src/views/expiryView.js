import { calculateLotSummaries } from '../calculations.js';
import { escapeHtml } from '../html.js';

export function renderExpiry({ data }) {
  const lots = calculateLotSummaries(data.lots, data.stockMovements, data.products);
  const alerts = lots.filter((lot) => ['vencido', 'vence_hoy', 'vence_manana', 'por_vencer', 'sin_fecha', 'congelado'].includes(lot.computedStatus));

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Conservacion interna</p>
        <h2>Caducidad</h2>
      </div>
      <span class="badge badge-info">${alerts.length} avisos</span>
    </section>

    <section class="dashboard-grid">
      <article class="panel">
        <h3>Reglas configuradas</h3>
        <dl class="summary-list">
          <div><dt>Carne cocida nevera</dt><dd>${data.settings.cookedFridgeMaxDays} dias</dd></div>
          <div><dt>Congelador</dt><dd>${data.settings.cookedFrozenMaxDays ?? 30} dias</dd></div>
          <div><dt>Lote cocido</dt><dd>fecha de coccion obligatoria</dd></div>
        </dl>
        <p class="muted">Estos avisos organizan datos internos; no certifican cumplimiento legal alimentario.</p>
      </article>

      <article class="panel">
        <h3>Alertas</h3>
        <div class="alert-list">
          ${alerts.map((lot) => `
            <div class="alert ${lot.computedStatus === 'vencido' ? 'alert-danger' : 'alert-warning'}">
              <strong>${escapeHtml(lot.lotCode)} - ${escapeHtml(lot.product?.name ?? lot.productId)}</strong>
              <span>${escapeHtml(label(lot.computedStatus))}${lot.expiresAt ? `: ${escapeHtml(lot.expiresAt)}` : ''}</span>
            </div>
          `).join('') || '<p class="muted">Sin alertas de caducidad.</p>'}
        </div>
      </article>
    </section>
  `;
}

function label(status) {
  return {
    vencido: 'Vencido',
    vence_hoy: 'Vence hoy',
    vence_manana: 'Vence mañana',
    por_vencer: 'Por vencer',
    sin_fecha: 'Lote sin fecha limite',
    congelado: 'Stock congelado'
  }[status] ?? status;
}
