import { APP_VERSION } from '../constants.js';
import { DEFAULT_API_BASE_URL } from '../apiClient.js';
import { describeSecurityStatus, getSecuritySettings, hasAdminPin } from '../auth.js';
import { CSV_EXPORT_TYPES } from '../exporters.js';
import { formatCurrency } from '../calculations.js';
import { escapeAttribute, escapeHtml, option } from '../html.js';

export function renderSettings({ data, actions }) {
  const { settings } = data;
  const backend = settings.backend ?? {};
  const security = getSecuritySettings(data);
  const backups = typeof actions?.listBackups === 'function' ? actions.listBackups() : [];

  return `
    <section class="view-header">
      <div>
        <p class="eyebrow">Datos locales y backups</p>
        <h2>Configuracion</h2>
      </div>
      <span class="badge badge-info">v${APP_VERSION}</span>
    </section>

    <section class="work-grid">
      <article class="panel">
        <h3>Configuracion avanzada</h3>
        <form class="stack-form" data-form="settings">
          <div class="form-row">
            <label>Nombre negocio<input name="businessName" value="${escapeAttribute(settings.businessName)}" required></label>
            <label>Moneda<input name="currency" value="${escapeAttribute(settings.currency)}" required></label>
          </div>
          <div class="form-row">
            <label>Locale<input name="locale" value="${escapeAttribute(settings.locale ?? 'es-ES')}"></label>
            <label>Precio base control<input name="targetBasePrice" type="number" min="0" step="0.01" value="${escapeAttribute(settings.targetBasePrice)}"></label>
          </div>
          <div class="form-row">
            <label>Multiplicador minimo<input name="minimumMultiplier" type="number" min="0.01" step="0.1" value="${escapeAttribute(settings.priceMultipliers.minimum)}"></label>
            <label>Multiplicador sano<input name="healthyMultiplier" type="number" min="0.01" step="0.1" value="${escapeAttribute(settings.priceMultipliers.healthy)}"></label>
          </div>
          <div class="form-row">
            <label>Multiplicador premium<input name="premiumMultiplier" type="number" min="0.01" step="0.1" value="${escapeAttribute(settings.priceMultipliers.premium)}"></label>
            <label>Umbral stock bajo<input name="lowStockThreshold" type="number" min="0" step="1" value="${escapeAttribute(settings.lowStockThreshold)}"></label>
          </div>
          <div class="form-row">
            <label>Dias carne cocida nevera<input name="cookedFridgeMaxDays" type="number" min="0" step="1" value="${escapeAttribute(settings.cookedFridgeMaxDays)}"></label>
            <label>Dias congelador<input name="cookedFrozenMaxDays" type="number" min="0" step="1" value="${escapeAttribute(settings.cookedFrozenMaxDays)}"></label>
          </div>
          <div class="form-row">
            <label>Carne por burrito<input name="defaultMeatPerBurritoG" type="number" min="0" step="1" value="${escapeAttribute(settings.defaultMeatPerBurritoG)}"></label>
            <label class="checkbox-line"><input name="demoMode" type="checkbox"${settings.demoMode ? ' checked' : ''}> Modo demo</label>
          </div>
          <div class="form-row">
            <label class="checkbox-line"><input name="localAuthEnabled" type="checkbox"${security.localAuthEnabled ? ' checked' : ''}> Proteger operaciones sensibles</label>
            <label>Minutos sesion admin<input name="adminSessionMinutes" type="number" min="1" step="1" value="${escapeAttribute(security.adminSessionMinutes)}"></label>
          </div>
          <label>Nota ternera standby<input name="beefStatusNote" value="${escapeAttribute(settings.beefStatusNote)}"></label>
          <div class="form-row">
            <label>URL API backend<input name="backendBaseUrl" value="${escapeAttribute(backend.baseUrl || DEFAULT_API_BASE_URL)}"></label>
            <label>Modo backend<select name="backendSyncMode">
              ${option('manual', 'manual', backend.syncMode || 'manual')}
              ${option('api_mirror', 'api espejo', backend.syncMode || 'manual')}
            </select></label>
          </div>
          <button class="btn" type="submit">Guardar configuracion</button>
        </form>
      </article>

      <article class="panel">
        <h3>Resumen</h3>
        <dl class="summary-list">
          <div><dt>Negocio</dt><dd>${escapeHtml(settings.businessName)}</dd></div>
          <div><dt>Moneda</dt><dd>${escapeHtml(settings.currency)}</dd></div>
          <div><dt>Precio control</dt><dd>${formatCurrency(settings.targetBasePrice)}</dd></div>
          <div><dt>Multiplicadores</dt><dd>${settings.priceMultipliers.minimum} / ${settings.priceMultipliers.healthy} / ${settings.priceMultipliers.premium}</dd></div>
          <div><dt>Modo demo</dt><dd>${settings.demoMode ? 'activo' : 'inactivo'}</dd></div>
          <div><dt>Modo backend</dt><dd>${escapeHtml(backend.syncMode || 'manual')}</dd></div>
          <div><dt>Backend</dt><dd>${escapeHtml(backend.lastStatus || 'sin comprobar')}</dd></div>
          <div><dt>Seguridad</dt><dd>${escapeHtml(describeSecurityStatus(data))}</dd></div>
        </dl>
      </article>
    </section>

    <section class="dashboard-grid">
      <article class="panel">
        <h3>JSON y backups</h3>
        <div class="button-row">
          <button class="btn btn-secondary" data-action="export-data">Exportar JSON</button>
          <button class="btn btn-secondary" data-action="manual-backup">Crear backup</button>
          <label class="btn btn-secondary file-button">
            Importar JSON
            <input type="file" accept="application/json" data-action="import-data">
          </label>
          <button class="btn btn-danger" data-action="reset-data">Reset demo</button>
        </div>
        <p class="muted">Reset, importacion y restauracion crean backup automatico antes de tocar datos.</p>
      </article>

      <article class="panel">
        <h3>Restaurar backup</h3>
        <div class="button-row">
          <select data-backup-select aria-label="Seleccionar backup">
            ${backups.map((backup) => option(backup.id, `${backup.createdAt} - ${backup.reason}`)).join('')}
          </select>
          <button class="btn btn-secondary" data-action="restore-backup"${backups.length ? '' : ' disabled'}>Restaurar</button>
        </div>
        ${backups.length ? `<p class="muted">${backups.length} backups disponibles en este navegador.</p>` : '<p class="muted">Aun no hay backups guardados en este navegador.</p>'}
      </article>

      <article class="panel">
        <h3>Backend SQLite</h3>
        <dl class="summary-list">
          <div><dt>API</dt><dd>${escapeHtml(backend.baseUrl || DEFAULT_API_BASE_URL)}</dd></div>
          <div><dt>Modo</dt><dd>${escapeHtml(backend.syncMode === 'api_mirror' ? 'api espejo' : 'manual')}</dd></div>
          <div><dt>Ultima comprobacion</dt><dd>${escapeHtml(backend.lastCheckedAt || 'sin datos')}</dd></div>
          <div><dt>Ultima sincronizacion</dt><dd>${escapeHtml(backend.lastSyncAt || 'sin datos')}</dd></div>
        </dl>
        <div class="button-row">
          <button class="btn btn-secondary" type="button" data-action="backend-health">Comprobar API</button>
          <button class="btn btn-secondary" type="button" data-action="backend-push">Enviar local</button>
          <button class="btn btn-secondary" type="button" data-action="backend-pull">Traer backend</button>
          <button class="btn btn-secondary" type="button" data-action="backend-backup">Backup backend</button>
          <button class="btn btn-danger" type="button" data-action="backend-seed">Seed backend</button>
        </div>
      </article>

      <article class="panel">
        <h3>Exportar CSV</h3>
        <div class="button-row">
          ${Object.values(CSV_EXPORT_TYPES).map((type) => `<button class="btn btn-secondary" data-action="export-csv" data-type="${escapeAttribute(type)}">${escapeHtml(type)}</button>`).join('')}
        </div>
        <p class="muted">CSV disponible para productos, stock, compras, producciones, pedidos y reporte de costes.</p>
      </article>

      <article class="panel">
        <h3>Seguridad local</h3>
        <dl class="summary-list">
          <div><dt>Estado</dt><dd>${escapeHtml(describeSecurityStatus(data))}</dd></div>
          <div><dt>PIN admin</dt><dd>${hasAdminPin(data) ? 'configurado' : 'sin configurar'}</dd></div>
          <div><dt>Sesion</dt><dd>${escapeHtml(`${security.adminSessionMinutes} min`)}</dd></div>
        </dl>
        <form class="stack-form compact-form" data-form="security-pin">
          <div class="form-row">
            <label>Nuevo PIN admin<input name="adminPin" type="password" autocomplete="new-password" minlength="4"></label>
            <label>Repetir PIN<input name="adminPinConfirm" type="password" autocomplete="new-password" minlength="4"></label>
          </div>
          <div class="button-row">
            <button class="btn btn-secondary" type="submit">Guardar PIN</button>
            <button class="btn btn-secondary" type="button" data-action="unlock-admin">Desbloquear admin</button>
            <button class="btn btn-secondary" type="button" data-action="lock-admin">Bloquear admin</button>
          </div>
        </form>
        <p class="muted">Protege importacion, reset, restauracion y sincronizaciones destructivas. No sustituye autenticacion multiusuario real.</p>
      </article>

      <article class="panel">
        <h3>Importacion segura</h3>
        <div class="alert alert-info">
          <strong>Schema version</strong>
          <span>Solo se importan archivos con schemaVersion compatible. Si falla, los datos actuales quedan protegidos por backup.</span>
        </div>
      </article>
    </section>
  `;
}
