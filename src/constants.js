// Central place for keys, enums and limits so the rest of the code has no magic strings.

export const STORAGE_KEYS = {
  products: 'inventory_products',
  categories: 'inventory_categories',
  suppliers: 'inventory_suppliers',
  transactions: 'inventory_transactions',
  settings: 'inventory_settings',
};

export const ACTIVE = 'Active';
export const INACTIVE = 'Inactive';

export const TXN_TYPES = {
  OPENING: 'OPENING',
  STOCK_IN: 'STOCK_IN',
  STOCK_OUT: 'STOCK_OUT',
  ADJUSTMENT: 'ADJUSTMENT',
};

export const TXN_TYPE_LABELS = {
  OPENING: 'Opening',
  STOCK_IN: 'Stock In',
  STOCK_OUT: 'Stock Out',
  ADJUSTMENT: 'Adjustment',
};

export const STOCK_STATUS = {
  IN: 'In Stock',
  LOW: 'Low Stock',
  OUT: 'Out of Stock',
};

export const UNITS = ['Pieces', 'Boxes', 'Packs', 'Sets', 'Reams', 'Meters', 'Kilograms', 'Liters'];

export const DEPARTMENTS = ['IT', 'HR', 'Finance', 'Administration', 'Operations', 'Sales', 'Support'];

export const PAGE_SIZES = [5, 10, 20];

export const LIMITS = {
  productCode: 20,
  productNameMin: 3,
  productNameMax: 100,
  description: 500,
  categoryName: 60,
  categoryDescription: 200,
  supplierName: 100,
  contactPerson: 60,
  referenceNumber: 50,
  remarks: 200,
  issuedTo: 60,
  maxQuantity: 1000000,
  maxUnitCost: 100000000,
};
