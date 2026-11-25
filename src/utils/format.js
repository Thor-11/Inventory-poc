const currency = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
});

export const formatCurrency = (n) => currency.format(Number(n) || 0);
export const formatNumber = (n) => new Intl.NumberFormat('en-IN').format(Number(n) || 0);

export function formatDateTime(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
}

export function formatDate(value) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { dateStyle: 'medium' });
}

const pad = (n) => String(n).padStart(2, '0');

/** yyyy-mm-dd in local time (value format used by <input type="date">). */
export function toDateInputValue(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** yyyy-mm-dd hh:mm in local time, used in CSV files. */
export function formatDateTimeCsv(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${toDateInputValue(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export const signed = (n) => (n > 0 ? `+${n}` : String(n));
