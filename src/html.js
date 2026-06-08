export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

export function escapeAttribute(value) {
  return escapeHtml(value);
}

export function option(value, label, selectedValue = '') {
  const selected = String(value) === String(selectedValue) ? ' selected' : '';
  return `<option value="${escapeAttribute(value)}"${selected}>${escapeHtml(label)}</option>`;
}
