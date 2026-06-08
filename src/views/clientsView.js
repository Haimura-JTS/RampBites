import { CLIENT_CHANNELS } from '../constants.js';
import { formatCurrency } from '../calculations.js';
import { escapeAttribute, escapeHtml, option } from '../html.js';

export function renderClients({ data }) {
  const activeClients = data.clients.filter((client) => client.active);

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Clientes y preferencias</p>
        <h2>Clientes</h2>
      </div>
      <span class="badge badge-info">${data.clients.length} clientes</span>
    </section>

    <section class="metric-grid">
      ${metric('Clientes activos', activeClients.length, 'Disponibles para pedidos')}
      ${metric('Pedidos entregados', deliveredOrderCount(data), 'Historial acumulado')}
      ${metric('Ventas por cliente', formatCurrency(totalClientSpend(data)), 'Solo entregados')}
      ${metric('Alergias declaradas', allergyCount(data.clients), 'Dato interno, no legal')}
    </section>

    <section class="work-grid">
      <article class="panel">
        <h3>Crear o editar cliente</h3>
        <form class="stack-form" data-form="client">
          <input type="hidden" name="id">
          <div class="form-row">
            <label>Nombre<input name="name" required></label>
            <label>Alias<input name="alias" placeholder="Trabajo, amigo, reparto..."></label>
          </div>
          <div class="form-row">
            <label>Canal<select name="channel">${options(CLIENT_CHANNELS)}</select></label>
            <label>Contacto<input name="contact" placeholder="WhatsApp, Instagram o referencia"></label>
          </div>
          <label>Zona entrega<input name="deliveryZone" placeholder="Zona, oficina o punto de entrega"></label>
          <div class="form-row">
            <label>Preferencias<input name="preferences" placeholder="picante suave, extra queso"></label>
            <label>Alergias declaradas<input name="allergies" placeholder="gluten, lactosa"></label>
          </div>
          <label>Notas<textarea name="notes" rows="3"></textarea></label>
          <div class="button-row">
            <button class="btn" type="submit">Guardar cliente</button>
            <button class="btn btn-secondary" type="button" data-action="clear-client-form">Limpiar</button>
          </div>
        </form>
      </article>

      <article class="panel">
        <h3>Buscar</h3>
        <div class="filter-grid">
          <label>Texto<input data-filter="client-search" placeholder="Nombre, alias, preferencias, alergias"></label>
        </div>
        <div class="alert alert-info">
          <strong>Privacidad</strong>
          <span>Guarda solo contacto operativo y alergias declaradas necesarias para organizar pedidos.</span>
        </div>
      </article>
    </section>

    <article class="panel table-panel">
      <div class="panel-header"><h3>Listado de clientes</h3></div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Cliente</th>
            <th>Canal</th>
            <th>Preferencias</th>
            <th>Alergias</th>
            <th>Pedidos</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          ${data.clients.map((client) => clientRow(client, data)).join('')}
        </tbody>
      </table>
    </article>
  `;
}

function clientRow(client, data) {
  const history = data.orders.filter((order) => order.clientId === client.id);
  const delivered = history.filter((order) => order.status === 'entregado');
  const search = [
    client.name,
    client.alias,
    client.channel,
    client.contact,
    client.deliveryZone,
    ...(client.preferences ?? []),
    ...(client.allergies ?? [])
  ].join(' ').toLowerCase();

  return `
    <tr data-client-row data-search="${escapeAttribute(search)}">
      <td>
        <strong>${escapeHtml(client.name)}</strong>
        <div class="muted">${escapeHtml(client.alias || client.deliveryZone || 'Sin alias')}</div>
      </td>
      <td>${escapeHtml(client.channel)}<div class="muted">${escapeHtml(client.contact || 'Sin contacto')}</div></td>
      <td>${escapeHtml((client.preferences ?? []).join(', ') || 'Sin datos')}</td>
      <td>${escapeHtml((client.allergies ?? []).join(', ') || 'Sin datos')}</td>
      <td>${delivered.length}<div class="muted">${history.length} total</div></td>
      <td>${formatCurrency(delivered.reduce((total, order) => total + (Number(order.total) || 0), 0))}</td>
      <td><span class="badge ${client.active ? 'badge-success' : 'badge-muted'}">${client.active ? 'activo' : 'inactivo'}</span></td>
      <td class="action-cell">
        <button class="btn btn-small btn-secondary" data-action="edit-client" data-id="${escapeAttribute(client.id)}">Editar</button>
        <button class="btn btn-small btn-secondary" data-action="view-client-history" data-id="${escapeAttribute(client.id)}">Historial</button>
        ${client.active ? `<button class="btn btn-small btn-danger" data-action="deactivate-client" data-id="${escapeAttribute(client.id)}">Desactivar</button>` : ''}
      </td>
    </tr>
  `;
}

function metric(label, value, hint) {
  return `<article class="metric-card"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong><small>${escapeHtml(hint)}</small></article>`;
}

function deliveredOrderCount(data) {
  return data.orders.filter((order) => order.status === 'entregado').length;
}

function totalClientSpend(data) {
  return data.orders
    .filter((order) => order.status === 'entregado')
    .reduce((total, order) => total + (Number(order.total) || 0), 0);
}

function allergyCount(clients) {
  return clients.filter((client) => (client.allergies ?? []).length > 0).length;
}

function options(source, selectedValue = '') {
  return Object.values(source).map((value) => option(value, value, selectedValue)).join('');
}
