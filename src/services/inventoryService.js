/**
 * Pure business-rule functions. Each one takes the current state plus the form input and
 * returns either
 *   { ok: true,  patch, record }   -> `patch` holds the collections to persist, or
 *   { ok: false, errors, message } -> nothing is changed (BR-019).
 * Keeping the rules here (and not in components) makes them easy to test and reuse.
 */
import { ACTIVE, INACTIVE, TXN_TYPES, UNITS, LIMITS } from '../constants';
import { computeStockMap, nextTxnId } from '../utils/inventory';

const ok = (patch, record) => ({ ok: true, patch, record });
const fail = (errors = {}, message = 'Please correct the highlighted fields.') => ({
  ok: false,
  errors,
  message,
});

const clean = (v) => (v === null || v === undefined ? '' : String(v).trim());
const isInt = (v) => /^\d+$/.test(clean(v));
const isPosInt = (v) => isInt(v) && Number(clean(v)) > 0;
const isPosNumber = (v) => /^(\d+\.?\d*|\.\d+)$/.test(clean(v)) && Number(clean(v)) > 0;
const same = (a, b) => clean(a).toLowerCase() === clean(b).toLowerCase();

export const uid = (prefix) => `${prefix}_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

const stockOf = (state, productId) => computeStockMap(state.transactions).get(productId) || 0;

/** Builds an immutable ledger entry with the next sequential reference. */
function makeTxn(state, fields, now) {
  return Object.freeze({
    id: nextTxnId(state.transactions),
    date: now.toISOString(),
    ...fields,
  });
}

/* ------------------------------------------------------------------ products */

export function validateProduct(state, input, { existing = null } = {}) {
  const errors = {};
  const isNew = !existing;

  const code = clean(input.code);
  if (isNew) {
    if (!code) errors.code = 'Product code is required.';
    else if (code.length > LIMITS.productCode) errors.code = `Product code can be at most ${LIMITS.productCode} characters.`;
    else if (state.products.some((p) => same(p.code, code))) errors.code = 'This product code already exists.';
  }

  const name = clean(input.name);
  if (!name) errors.name = 'Product name is required.';
  else if (name.length < LIMITS.productNameMin || name.length > LIMITS.productNameMax) {
    errors.name = `Product name must be ${LIMITS.productNameMin}–${LIMITS.productNameMax} characters.`;
  }

  const category = state.categories.find((c) => c.id === input.categoryId);
  if (!input.categoryId) errors.categoryId = 'Category is required.';
  else if (!category) errors.categoryId = 'Selected category does not exist.';
  else if (category.status !== ACTIVE && (isNew || existing.categoryId !== category.id || input.status === ACTIVE)) {
    errors.categoryId = 'Choose an active category.';
  }

  const supplier = state.suppliers.find((s) => s.id === input.supplierId);
  if (!input.supplierId) errors.supplierId = 'Supplier is required.';
  else if (!supplier) errors.supplierId = 'Selected supplier does not exist.';
  else if (supplier.status !== ACTIVE && (isNew || existing.supplierId !== supplier.id)) {
    errors.supplierId = 'Inactive suppliers cannot be selected for a new product.';
  }

  if (clean(input.description).length > LIMITS.description) {
    errors.description = `Description can be at most ${LIMITS.description} characters.`;
  }
  if (!UNITS.includes(input.unit)) errors.unit = 'Unit of measure is required.';

  if (!clean(input.unitCost)) errors.unitCost = 'Unit cost is required.';
  else if (!isPosNumber(input.unitCost) || Number(input.unitCost) > LIMITS.maxUnitCost) {
    errors.unitCost = 'Unit cost must be a number greater than zero.';
  }

  if (isNew) {
    if (clean(input.openingStock) === '') errors.openingStock = 'Opening stock is required (enter 0 if none).';
    else if (!isInt(input.openingStock) || Number(input.openingStock) > LIMITS.maxQuantity) {
      errors.openingStock = 'Opening stock must be a non-negative whole number.';
    }
  }

  if (clean(input.reorderLevel) === '') errors.reorderLevel = 'Reorder level is required.';
  else if (!isInt(input.reorderLevel) || Number(input.reorderLevel) > LIMITS.maxQuantity) {
    errors.reorderLevel = 'Reorder level must be a non-negative whole number.';
  }

  if (input.status !== ACTIVE && input.status !== INACTIVE) errors.status = 'Status is required.';
  return errors;
}

export function createProduct(state, input, now = new Date()) {
  const errors = validateProduct(state, input);
  if (Object.keys(errors).length) return fail(errors);

  const product = {
    id: uid('prd'),
    code: clean(input.code),
    name: clean(input.name),
    categoryId: input.categoryId,
    supplierId: input.supplierId,
    description: clean(input.description),
    unit: input.unit,
    unitCost: Number(clean(input.unitCost)),
    openingStock: Number(clean(input.openingStock)),
    reorderLevel: Number(clean(input.reorderLevel)),
    status: input.status,
  };
  const opening = makeTxn(
    state,
    {
      productId: product.id,
      type: TXN_TYPES.OPENING,
      quantityChange: product.openingStock,
      balanceAfter: product.openingStock,
      reference: 'Opening balance',
      remarks: 'Opening stock recorded at product creation',
    },
    now,
  );
  return ok(
    { products: [...state.products, product], transactions: [...state.transactions, opening] },
    product,
  );
}

export function updateProduct(state, id, input) {
  const existing = state.products.find((p) => p.id === id);
  if (!existing) return fail({}, 'Product not found.');
  const errors = validateProduct(state, input, { existing });
  if (Object.keys(errors).length) return fail(errors);

  // BR-017: code and opening stock are always taken from the stored record, never from the input.
  const updated = {
    ...existing,
    name: clean(input.name),
    categoryId: input.categoryId,
    supplierId: input.supplierId,
    description: clean(input.description),
    unit: input.unit,
    unitCost: Number(clean(input.unitCost)),
    reorderLevel: Number(clean(input.reorderLevel)),
    status: input.status,
  };
  return ok({ products: state.products.map((p) => (p.id === id ? updated : p)) }, updated);
}

/** BR-018: only the status flag changes; the transaction history is untouched. */
export function setProductStatus(state, id, status) {
  const existing = state.products.find((p) => p.id === id);
  if (!existing) return fail({}, 'Product not found.');
  if (status === ACTIVE) {
    const category = state.categories.find((c) => c.id === existing.categoryId);
    if (!category || category.status !== ACTIVE) {
      return fail({}, 'Activate the product\'s category first (or edit the product to use an active category).');
    }
  }
  const updated = { ...existing, status };
  return ok({ products: state.products.map((p) => (p.id === id ? updated : p)) }, updated);
}

/* ---------------------------------------------------------------- categories */

function activeProductsInCategory(state, categoryId) {
  return state.products.filter((p) => p.categoryId === categoryId && p.status === ACTIVE).length;
}

export function saveCategory(state, input, editingId = null) {
  const existing = editingId ? state.categories.find((c) => c.id === editingId) : null;
  if (editingId && !existing) return fail({}, 'Category not found.');
  const errors = {};

  const code = clean(input.code);
  if (!existing) {
    if (!code) errors.code = 'Category code is required.';
    else if (code.length > LIMITS.productCode) errors.code = `Category code can be at most ${LIMITS.productCode} characters.`;
    else if (state.categories.some((c) => same(c.code, code))) errors.code = 'This category code already exists.';
  }
  const name = clean(input.name);
  if (!name) errors.name = 'Category name is required.';
  else if (name.length > LIMITS.categoryName) errors.name = `Category name can be at most ${LIMITS.categoryName} characters.`;
  else if (state.categories.some((c) => c.id !== editingId && same(c.name, name))) {
    errors.name = 'A category with this name already exists.';
  }
  if (clean(input.description).length > LIMITS.categoryDescription) {
    errors.description = `Description can be at most ${LIMITS.categoryDescription} characters.`;
  }
  if (input.status !== ACTIVE && input.status !== INACTIVE) errors.status = 'Status is required.';

  // BR: a category used by an active product cannot be deactivated.
  if (existing && input.status === INACTIVE && existing.status === ACTIVE) {
    const used = activeProductsInCategory(state, existing.id);
    if (used > 0) errors.status = `Cannot deactivate: ${used} active product(s) use this category.`;
  }
  if (Object.keys(errors).length) return fail(errors);

  const record = existing
    ? { ...existing, name, description: clean(input.description), status: input.status }
    : { id: uid('cat'), code, name, description: clean(input.description), status: input.status };
  const categories = existing
    ? state.categories.map((c) => (c.id === existing.id ? record : c))
    : [...state.categories, record];
  return ok({ categories }, record);
}

export function setCategoryStatus(state, id, status) {
  const existing = state.categories.find((c) => c.id === id);
  if (!existing) return fail({}, 'Category not found.');
  if (status === INACTIVE) {
    const used = activeProductsInCategory(state, id);
    if (used > 0) {
      return fail({}, `Cannot deactivate "${existing.name}": ${used} active product(s) still use this category.`);
    }
  }
  const record = { ...existing, status };
  return ok({ categories: state.categories.map((c) => (c.id === id ? record : c)) }, record);
}

/* ----------------------------------------------------------------- suppliers */

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function saveSupplier(state, input, editingId = null) {
  const existing = editingId ? state.suppliers.find((s) => s.id === editingId) : null;
  if (editingId && !existing) return fail({}, 'Supplier not found.');
  const errors = {};

  const code = clean(input.code);
  if (!existing) {
    if (!code) errors.code = 'Supplier code is required.';
    else if (code.length > LIMITS.productCode) errors.code = `Supplier code can be at most ${LIMITS.productCode} characters.`;
    else if (state.suppliers.some((s) => same(s.code, code))) errors.code = 'This supplier code already exists.';
  }
  const name = clean(input.name);
  if (!name) errors.name = 'Supplier name is required.';
  else if (name.length > LIMITS.supplierName) errors.name = `Supplier name can be at most ${LIMITS.supplierName} characters.`;

  if (clean(input.contactPerson).length > LIMITS.contactPerson) {
    errors.contactPerson = `Contact person can be at most ${LIMITS.contactPerson} characters.`;
  }
  const email = clean(input.email);
  if (email && !EMAIL.test(email)) errors.email = 'Enter a valid email address.';
  const phone = clean(input.phone);
  if (phone && (!/^[+()\-\s\d]+$/.test(phone) || phone.replace(/\D/g, '').length < 7 || phone.replace(/\D/g, '').length > 15)) {
    errors.phone = 'Enter a valid phone number (7–15 digits).';
  }
  if (input.status !== ACTIVE && input.status !== INACTIVE) errors.status = 'Status is required.';
  if (Object.keys(errors).length) return fail(errors);

  const fields = { name, contactPerson: clean(input.contactPerson), email, phone, status: input.status };
  const record = existing ? { ...existing, ...fields } : { id: uid('sup'), code, ...fields };
  const suppliers = existing
    ? state.suppliers.map((s) => (s.id === existing.id ? record : s))
    : [...state.suppliers, record];
  return ok({ suppliers }, record);
}

export function setSupplierStatus(state, id, status) {
  const existing = state.suppliers.find((s) => s.id === id);
  if (!existing) return fail({}, 'Supplier not found.');
  const record = { ...existing, status };
  return ok({ suppliers: state.suppliers.map((s) => (s.id === id ? record : s)) }, record);
}

/* ------------------------------------------------------------ stock movements */

/** Shared product check for every new stock transaction (BR-011). */
function checkProduct(state, productId, errors) {
  const product = state.products.find((p) => p.id === productId);
  if (!productId) errors.productId = 'Product is required.';
  else if (!product) errors.productId = 'Selected product does not exist.';
  else if (product.status !== ACTIVE) errors.productId = 'Inactive products cannot be used in new stock transactions.';
  return product;
}

export function stockIn(state, input, now = new Date()) {
  const errors = {};
  const product = checkProduct(state, input.productId, errors);

  const supplier = state.suppliers.find((s) => s.id === input.supplierId);
  if (!input.supplierId) errors.supplierId = 'Supplier is required.';
  else if (!supplier) errors.supplierId = 'Selected supplier does not exist.';
  else if (supplier.status !== ACTIVE) errors.supplierId = 'Inactive suppliers cannot be used for a new stock receipt.';

  if (!clean(input.quantity)) errors.quantity = 'Quantity received is required.';
  else if (!isPosInt(input.quantity) || Number(input.quantity) > LIMITS.maxQuantity) {
    errors.quantity = 'Quantity must be a whole number greater than zero.';
  }
  if (!clean(input.unitCost)) errors.unitCost = 'Unit cost is required.';
  else if (!isPosNumber(input.unitCost) || Number(input.unitCost) > LIMITS.maxUnitCost) {
    errors.unitCost = 'Unit cost must be a number greater than zero.';
  }
  if (clean(input.referenceNumber).length > LIMITS.referenceNumber) {
    errors.referenceNumber = `Reference number can be at most ${LIMITS.referenceNumber} characters.`;
  }
  if (clean(input.remarks).length > LIMITS.remarks) errors.remarks = `Remarks can be at most ${LIMITS.remarks} characters.`;
  if (Object.keys(errors).length) return fail(errors);

  const quantity = Number(clean(input.quantity));
  const txn = makeTxn(
    state,
    {
      productId: product.id,
      type: TXN_TYPES.STOCK_IN,
      quantityChange: quantity,
      balanceAfter: stockOf(state, product.id) + quantity,
      reference: clean(input.referenceNumber),
      remarks: clean(input.remarks),
      supplierId: supplier.id,
      unitCost: Number(clean(input.unitCost)), // kept on the receipt only; master cost is unchanged
    },
    now,
  );
  return ok({ transactions: [...state.transactions, txn] }, txn);
}

export function stockOut(state, input, now = new Date()) {
  const errors = {};
  const product = checkProduct(state, input.productId, errors);

  if (!clean(input.quantity)) errors.quantity = 'Quantity issued is required.';
  else if (!isPosInt(input.quantity) || Number(input.quantity) > LIMITS.maxQuantity) {
    errors.quantity = 'Quantity must be a whole number greater than zero.';
  } else if (product) {
    const available = stockOf(state, product.id);
    if (Number(input.quantity) > available) {
      errors.quantity = `Insufficient stock. Only ${available} unit(s) available.`;
    }
  }
  if (!clean(input.issuedTo)) errors.issuedTo = 'Issued To is required.';
  else if (clean(input.issuedTo).length > LIMITS.issuedTo) errors.issuedTo = `Issued To can be at most ${LIMITS.issuedTo} characters.`;
  if (!clean(input.department)) errors.department = 'Department is required.';
  if (!clean(input.purpose)) errors.purpose = 'Purpose is required.';
  else if (clean(input.purpose).length > LIMITS.remarks) errors.purpose = `Purpose can be at most ${LIMITS.remarks} characters.`;
  if (Object.keys(errors).length) return fail(errors);

  const quantity = Number(clean(input.quantity));
  const txn = makeTxn(
    state,
    {
      productId: product.id,
      type: TXN_TYPES.STOCK_OUT,
      quantityChange: -quantity,
      balanceAfter: stockOf(state, product.id) - quantity,
      reference: `${clean(input.issuedTo)} / ${clean(input.department)}`,
      remarks: clean(input.purpose),
      issuedTo: clean(input.issuedTo),
      department: clean(input.department),
    },
    now,
  );
  return ok({ transactions: [...state.transactions, txn] }, txn);
}

export function adjustStock(state, input, now = new Date()) {
  const errors = {};
  const product = checkProduct(state, input.productId, errors);

  const current = product ? stockOf(state, product.id) : 0;
  if (!clean(input.actualStock)) errors.actualStock = 'Actual stock is required.';
  else if (!isInt(input.actualStock) || Number(input.actualStock) > LIMITS.maxQuantity) {
    errors.actualStock = 'Actual stock must be a non-negative whole number.'; // BR-003 / BR-008
  } else if (product && Number(input.actualStock) === current) {
    errors.actualStock = 'Actual stock equals the system stock, so no adjustment is needed.';
  }
  const reason = clean(input.reason);
  if (!reason) errors.reason = 'Reason is required.';
  else if (reason.length < 3) errors.reason = 'Please give a short reason (at least 3 characters).';
  else if (reason.length > LIMITS.remarks) errors.reason = `Reason can be at most ${LIMITS.remarks} characters.`;
  if (Object.keys(errors).length) return fail(errors);

  const actual = Number(clean(input.actualStock));
  const txn = makeTxn(
    state,
    {
      productId: product.id,
      type: TXN_TYPES.ADJUSTMENT,
      quantityChange: actual - current,
      balanceAfter: actual,
      reference: 'Physical count',
      remarks: reason,
    },
    now,
  );
  return ok({ transactions: [...state.transactions, txn] }, txn);
}
