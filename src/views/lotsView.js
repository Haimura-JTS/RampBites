import { calculateLotSummaries, formatCurrency, formatWeight } from '../calculations.js';
import { escapeAttribute, escapeHtml } from '../html.js';

export function renderLots({ data }) {
  const lots = calculateLotSummaries(data.lots, data.stockMovements, data.products);
  const counts = countByStatus(lots);

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Trazabilidad por lote</p>
        <h2>Lotes</h2>
      </div>
      <span class="badge badge-info">${lots.length} lotes</span>
    </section>

    <section class="metric-grid">
      ${metric('Activos', counts.active, 'Con stock fisico')}
      ${metric('Reservados', counts.reserved, 'Lotes comprometidos')}
      ${metric('Por vencer', counts.warning, 'Hoy, manana o 2 dias')}
      ${metric('Vencidos', counts.expired, 'Revisar/descarte')}
      ${metric('Agotados/descartados', `${counts.empty}/${counts.discarded}`, 'Sin stock o anulados')}
    </section>

    <article class="panel table-panel">
      <table class="data-table">
        <thead>
          <tr>
            <th>Lote</th>
            <th>Producto</th>
            <th>Fisico</th>
            <th>Reservado</th>
            <th>Disponible</th>
            <th>Coste 100 g</th>
            <th>Ubicacion</th>
            <th>Caducidad</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${lots.map((lot) => `
            <tr>
              <td><strong>${escapeHtml(lot.lotCode)}</strong><div class="muted">${escapeHtml(lot.sourceType)} ${escapeHtml(lot.sourceId)}</div></td>
              <td>${escapeHtml(lot.product?.name ?? lot.productId)}</td>
              <td>${formatQuantity(lot.physicalQuantity, lot.unit)}</td>
              <td>${lot.reservedQuantity > 0 ? `<span class="badge badge-info">${formatQuantity(lot.reservedQuantity, lot.unit)}</span>` : formatQuantity(0, lot.unit)}</td>
              <td>${formatQuantity(lot.currentQuantity, lot.unit)}</td>
              <td>${lot.unit === 'g' ? formatCurrency((Number(lot.unitCost) || 0) * 100) : formatCurrency(lot.unitCost)}</td>
              <td>${escapeHtml(lot.location)}</td>
              <td>${escapeHtml(lot.expiresAt || 'sin fecha')}</td>
              <td><span class="badge ${statusBadge(lot.computedStatus)}">${escapeHtml(statusLabel(lot.computedStatus))}</span></td>
              <td class="action-cell">
                <button class="btn btn-small btn-secondary" data-action="view-lot" data-id="${escapeAttribute(lot.id)}">Detalle</button>
                ${canDiscardLot(lot) ? `<button class="btn btn-small btn-danger" data-action="discard-lot" data-id="${escapeAttribute(lot.id)}">Descartar</button>` : ''}
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </article>
  `;
}

function countByStatus(lots) {
  return lots.reduce((counts, lot) => {
    if ((Number(lot.reservedQuantity) || 0) > 0) counts.reserved += 1;
    if (lot.computedStatus === 'agotado') counts.empty += 1;
    else if (lot.computedStatus === 'descartado') counts.discarded += 1;
    else if (lot.computedStatus === 'vencido') counts.expired += 1;
    else if (['vence_hoy', 'vence_manana', 'por_vencer', 'sin_fecha'].includes(lot.computedStatus)) counts.warning += 1;
    else counts.active += 1;
    return counts;
  }, { active: 0, reserved: 0, warning: 0, expired: 0, empty: 0, discarded: 0 });
}

function metric(label, value, hint) {
  return `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(hint)}</small></article>`;
}

function statusBadge(status) {
  if (status === 'vencido' || status === 'descartado') return 'badge-danger';
  if (['vence_hoy', 'vence_manana', 'por_vencer', 'sin_fecha'].includes(status)) return 'badge-warning';
  if (status === 'agotado') return 'badge-muted';
  return 'badge-success';
}

function statusLabel(status) {
  const labels = {
    ok: 'ok',
    congelado: 'congelado',
    sin_fecha: 'sin fecha',
    por_vencer: 'por vencer',
    vence_hoy: 'vence hoy',
    vence_manana: 'vence manana',
    vencido: 'vencido',
    agotado: 'agotado',
    descartado: 'descartado'
  };
  return labels[status] ?? status;
}

function canDiscardLot(lot) {
  return lot.computedStatus !== 'agotado'
    && lot.computedStatus !== 'descartado'
    && (Number(lot.currentQuantity) || 0) > 0
    && (Number(lot.reservedQuantity) || 0) <= 0;
}

function formatQuantity(value, unit) {
  if (unit === 'g') return formatWeight(value);
  return `${Number(value || 0).toLocaleString('es-ES', { maximumFractionDigits: 2 })} ${escapeHtml(unit)}`;
}
