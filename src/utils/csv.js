/**
 * CSV helpers. Text cells that start with a formula character are prefixed with an
 * apostrophe so a spreadsheet never executes user-entered text (CSV injection).
 * Numbers (including negative quantity changes) are written untouched.
 */
function escapeCell(value) {
  if (value === null || value === undefined) return '';
  let s = String(value);
  if (typeof value === 'string' && /^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  if (/[",\r\n]/.test(s)) s = `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** columns: [{ label, value: (row) => any }] */
export function toCsv(columns, rows) {
  const header = columns.map((c) => escapeCell(c.label)).join(',');
  const lines = rows.map((r) => columns.map((c) => escapeCell(c.value(r))).join(','));
  return [header, ...lines].join('\r\n');
}

export function downloadCsv(filename, columns, rows) {
  const blob = new Blob([`\uFEFF${toCsv(columns, rows)}`], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
