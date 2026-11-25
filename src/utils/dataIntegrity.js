import { ACTIVE, INACTIVE, TXN_TYPES } from '../constants';
import { computeStockMap } from './inventory';

/**
 * Shape checks for data read back from localStorage (FR-015: handle corrupted data
 * gracefully). Each checker returns an error string or null.
 */
const isObj = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const isStr = (v) => typeof v === 'string' && v.length > 0;
const isStatus = (v) => v === ACTIVE || v === INACTIVE;

const CHECKS = {
  products: (p) => {
    if (!isObj(p)) return 'not an object';
    if (!isStr(p.id) || !isStr(p.code) || !isStr(p.name)) return 'missing id, code or name';
    if (!isStr(p.categoryId) || !isStr(p.supplierId)) return 'missing category or supplier';
    if (typeof p.unitCost !== 'number' || !(p.unitCost > 0)) return 'invalid unit cost';
    if (!Number.isInteger(p.openingStock) || p.openingStock < 0) return 'invalid opening stock';
    if (!Number.isInteger(p.reorderLevel) || p.reorderLevel < 0) return 'invalid reorder level';
    if (!isStatus(p.status)) return 'invalid status';
    return null;
  },
  categories: (c) => {
    if (!isObj(c)) return 'not an object';
    if (!isStr(c.id) || !isStr(c.code) || !isStr(c.name)) return 'missing id, code or name';
    if (!isStatus(c.status)) return 'invalid status';
    return null;
  },
  suppliers: (s) => {
    if (!isObj(s)) return 'not an object';
    if (!isStr(s.id) || !isStr(s.code) || !isStr(s.name)) return 'missing id, code or name';
    if (!isStatus(s.status)) return 'invalid status';
    return null;
  },
  transactions: (t) => {
    if (!isObj(t)) return 'not an object';
    if (!isStr(t.id) || !isStr(t.productId)) return 'missing id or product';
    if (!Object.values(TXN_TYPES).includes(t.type)) return 'invalid type';
    if (!Number.isInteger(t.quantityChange)) return 'invalid quantity change';
    if (!Number.isInteger(t.balanceAfter) || t.balanceAfter < 0) return 'invalid balance';
    if (Number.isNaN(Date.parse(t.date))) return 'invalid date';
    return null;
  },
};

/** Returns an error message, or null when the stored value is structurally valid. */
export function validateCollection(name, value) {
  if (name === 'settings') {
    return isObj(value) && value.seeded === true ? null : 'Settings record is invalid.';
  }
  if (!Array.isArray(value)) return 'Expected a list of records.';
  const seen = new Set();
  for (let i = 0; i < value.length; i += 1) {
    const problem = CHECKS[name](value[i]);
    if (problem) return `Record ${i + 1}: ${problem}.`;
    if (seen.has(value[i].id)) return `Record ${i + 1}: duplicate id.`;
    seen.add(value[i].id);
  }
  return null;
}

/** Relationship checks between collections. Returns a list of { name, reason }. */
export function validateRelationships({ products, categories, suppliers, transactions }) {
  const problems = [];
  const productIds = new Set(products.map((p) => p.id));
  const categoryIds = new Set(categories.map((c) => c.id));
  const supplierIds = new Set(suppliers.map((s) => s.id));

  if (products.some((p) => !categoryIds.has(p.categoryId) || !supplierIds.has(p.supplierId))) {
    problems.push({ name: 'products', reason: 'A product refers to a category or supplier that does not exist.' });
  }
  if (new Set(products.map((p) => p.code.toLowerCase())).size !== products.length) {
    problems.push({ name: 'products', reason: 'Duplicate product codes were found.' });
  }
  if (transactions.some((t) => !productIds.has(t.productId))) {
    problems.push({ name: 'transactions', reason: 'A transaction refers to a product that does not exist.' });
  }
  for (const quantity of computeStockMap(transactions).values()) {
    if (quantity < 0) {
      problems.push({ name: 'transactions', reason: 'Transactions would produce a negative stock balance.' });
      break;
    }
  }
  return problems;
}
