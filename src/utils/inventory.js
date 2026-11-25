import { STOCK_STATUS, ACTIVE } from '../constants';

/** BR-012 / FR-012: stock classification. */
export function getStockStatus(quantity, reorderLevel) {
  if (quantity === 0) return STOCK_STATUS.OUT;
  if (quantity <= reorderLevel) return STOCK_STATUS.LOW;
  return STOCK_STATUS.IN;
}

/** Section 7: Shortfall = max(0, Reorder Level - Available Stock). */
export const getShortfall = (quantity, reorderLevel) => Math.max(0, reorderLevel - quantity);

/** Section 7: Inventory Value = Available Stock x Unit Cost (current master cost). */
export const getInventoryValue = (quantity, unitCost) => quantity * unitCost;

/**
 * Section 7: Available Stock = Opening + Stock In - Stock Out + Net Adjustments.
 * Every one of those is stored as a signed `quantityChange` on a transaction (the
 * opening balance is itself an "Opening" transaction), so stock is always the sum
 * of the ledger and can never drift from the history.
 */
export function computeStockMap(transactions) {
  const map = new Map();
  for (const t of transactions) {
    map.set(t.productId, (map.get(t.productId) || 0) + t.quantityChange);
  }
  return map;
}

/** Products joined with category, supplier and derived stock figures. */
export function buildInventoryRows({ products, categories, suppliers, transactions }) {
  const stock = computeStockMap(transactions);
  const catById = new Map(categories.map((c) => [c.id, c]));
  const supById = new Map(suppliers.map((s) => [s.id, s]));
  return products.map((p) => {
    const quantity = stock.get(p.id) || 0;
    return {
      ...p,
      categoryName: catById.get(p.categoryId)?.name ?? 'Unknown',
      supplierName: supById.get(p.supplierId)?.name ?? 'Unknown',
      stock: quantity,
      stockStatus: getStockStatus(quantity, p.reorderLevel),
      shortfall: getShortfall(quantity, p.reorderLevel),
      inventoryValue: getInventoryValue(quantity, p.unitCost),
    };
  });
}

/** Adds product code/name to each transaction so tables can search and sort on them. */
export function enrichTransactions(transactions, products) {
  const byId = new Map(products.map((p) => [p.id, p]));
  return transactions.map((t) => ({
    ...t,
    productCode: byId.get(t.productId)?.code ?? '?',
    productName: byId.get(t.productId)?.name ?? 'Unknown product',
  }));
}

/** Numeric part of "TXN-000042"; ids are issued in increasing order so this is also the sequence. */
export const txnSeq = (id) => parseInt(String(id).replace(/\D/g, ''), 10) || 0;

export function nextTxnId(transactions) {
  const max = transactions.reduce((m, t) => Math.max(m, txnSeq(t.id)), 0);
  return `TXN-${String(max + 1).padStart(6, '0')}`;
}

export function isSameLocalDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** Filters by product, type and an inclusive local date range ('yyyy-mm-dd' strings). */
export function filterTransactions(transactions, { productId = '', type = '', from = '', to = '' } = {}) {
  const start = from ? new Date(`${from}T00:00:00`) : null;
  const end = to ? new Date(`${to}T23:59:59.999`) : null;
  if (start && end && start > end) return [];
  return transactions.filter((t) => {
    if (productId && t.productId !== productId) return false;
    if (type && t.type !== type) return false;
    const d = new Date(t.date);
    if (start && d < start) return false;
    if (end && d > end) return false;
    return true;
  });
}

/** Everything the dashboard (FR-002) needs, computed from active products only. */
export function getDashboardStats(rows, transactions, now = new Date()) {
  const active = rows.filter((r) => r.status === ACTIVE);
  const today = transactions.filter(
    (t) => t.type !== 'OPENING' && isSameLocalDay(new Date(t.date), now),
  );
  return {
    totalProducts: active.length,
    totalUnits: active.reduce((s, r) => s + r.stock, 0),
    lowStock: active.filter((r) => r.stockStatus === STOCK_STATUS.LOW).length,
    outOfStock: active.filter((r) => r.stockStatus === STOCK_STATUS.OUT).length,
    inventoryValue: active.reduce((s, r) => s + r.inventoryValue, 0),
    today: {
      total: today.length,
      receipts: today.filter((t) => t.type === 'STOCK_IN').length,
      issues: today.filter((t) => t.type === 'STOCK_OUT').length,
      adjustments: today.filter((t) => t.type === 'ADJUSTMENT').length,
    },
  };
}

export function stockByCategory(rows) {
  const totals = new Map();
  for (const r of rows.filter((x) => x.status === ACTIVE)) {
    totals.set(r.categoryName, (totals.get(r.categoryName) || 0) + r.stock);
  }
  return [...totals.entries()].map(([name, units]) => ({ name, units })).sort((a, b) => b.units - a.units);
}

/** Active products that are Low or Out of Stock, biggest shortfall first. */
export function getReplenishmentList(rows) {
  return rows
    .filter((r) => r.status === ACTIVE && r.stockStatus !== STOCK_STATUS.IN)
    .sort((a, b) => b.shortfall - a.shortfall || a.code.localeCompare(b.code));
}
