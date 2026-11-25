# 1. Requirement Understanding

## 1.1 What is being asked
An organisation tracks IT and office items (laptops, keyboards, mice, monitors, printers, network gear, stationery) manually or in Excel.
The POC must replace that with a React application that lets staff
* maintain **master data** (products, categories, suppliers),
* record **stock movements** (receive, issue, adjust),
* see **current stock**, **alerts** and **reports**,

using only the browser (`localStorage`). The stated goal is to show *requirement understanding, React development, business-rule implementation and data handling*.

## 1.2 Scope
| In scope (built) | Out of scope (deliberately not built) |
| --- | --- |
| Dashboard, Products, Categories, Suppliers | Backend API / database |
| Stock In, Stock Out, Stock Adjustment | Real login / authorisation |
| Transaction history, Low-stock alerts | Purchase orders / approvals |
| Reports + CSV export | Barcode scanning, multi-warehouse |
| Search, filter, sort, pagination | GST / accounting, e-mail/SMS, hosting |
| `localStorage` persistence | |

## 1.3 Entities and relationships
```
Category 1 ──── * Product * ──── 1 Supplier (default supplier)
                    │ 1
                    │
                    * Transaction  (Opening | Stock In | Stock Out | Adjustment)
                                    └─ Stock In also references the Supplier that delivered
```
| Entity | Key fields |
| --- | --- |
| Product | id, code (unique, fixed), name, categoryId, supplierId, description, unit, unitCost, openingStock (fixed), reorderLevel, status |
| Category | id, code (unique), name (unique, case-insensitive), description, status |
| Supplier | id, code (unique), name, contactPerson, email, phone, status |
| Transaction | id (`TXN-000001`…), date, productId, type, quantityChange (signed), balanceAfter, reference, remarks (+ supplierId/unitCost for Stock In, issuedTo/department for Stock Out) |
| Settings | seeded flag, version, seededAt |

## 1.4 The central design decision: stock is derived, never typed
The specification requires *"stock quantities derived consistently … or an equivalent approach that prevents discrepancies"*.
The chosen approach is a **ledger**:

* The opening balance is recorded as an **Opening** transaction when a product is created.
* Every Stock In / Out / Adjustment is one more row with a **signed** `quantityChange`.
* **Available Stock = sum of `quantityChange` for the product** = Opening + Stock In − Stock Out + Net Adjustments (Section 7).
* There is *no* stored "current quantity" field that could drift away from history.
* `balanceAfter` is stored on each row (needed by FR-011) and is immutable.

Spec example check: 20 + 15 − 8 − 2 = **25** (covered by an automated test).

## 1.5 Calculations
| Name | Formula | Where |
| --- | --- | --- |
| Available Stock | Σ quantityChange | `utils/inventory.js › computeStockMap` |
| Inventory Value | Available × master Unit Cost | `getInventoryValue` |
| Stock Status | 0 → Out; ≤ reorder → Low; else In | `getStockStatus` |
| Shortfall | max(0, Reorder − Available) | `getShortfall` |
| Dashboard KPIs | active products only | `getDashboardStats` |

Stock In's unit cost is stored on the receipt only; the product's master cost is **not** changed (as required).

## 1.6 Functional requirements → implementation
| ID | Requirement (short) | Implemented in |
| --- | --- | --- |
| FR-001 | Layout, sidebar, header, active item, React Router | `components/Layout.jsx`, `App.jsx` |
| FR-002 | Dashboard KPIs, chart, replenishment list | `pages/Dashboard.jsx` |
| FR-003 | Product list: search, filters, sort, page sizes 5/10/20, Clear Filters, actions | `pages/Products.jsx`, `components/SortableTable.jsx` |
| FR-004 | Add/Edit product with validations; code & opening stock locked after creation | `pages/ProductForm.jsx`, `services › validateProduct/createProduct/updateProduct` |
| FR-005 | Product details + latest 10 transactions + link to full history | `pages/ProductDetails.jsx` |
| FR-006 | Category CRUD-lite, uniqueness, block deactivation when in use | `pages/Categories.jsx`, `services › saveCategory/setCategoryStatus` |
| FR-007 | Supplier management, email validation, inactive not selectable | `pages/Suppliers.jsx`, `services › saveSupplier` |
| FR-008 | Stock In | `pages/StockIn.jsx`, `services › stockIn` |
| FR-009 | Stock Out, prevents over-issue | `pages/StockOut.jsx`, `services › stockOut` |
| FR-010 | Stock Adjustment (actual → difference) | `pages/StockAdjustment.jsx`, `services › adjustStock` |
| FR-011 | Transaction history, filters, sort, pagination, immutable | `pages/Transactions.jsx` |
| FR-012 | Low-stock classification, inactive excluded | `utils/inventory.js`, dashboard, Low Stock report |
| FR-013 | Three reports, filters, CSV | `pages/Reports.jsx`, `utils/csv.js` |
| FR-014 | Messages: Alerts, Snackbars, confirm dialogs | field errors, `NotifyContext`, `ConfirmDialog` |
| FR-015 | Persistence, corrupt-data handling, no silent overwrite | `utils/storage.js`, `utils/dataIntegrity.js`, `RecoveryScreen` |

## 1.7 Business rules → where each is enforced
| Rule | Enforced by |
| --- | --- |
| BR-001 unique product code | `validateProduct` (case-insensitive) |
| BR-002 name & category mandatory | `validateProduct` |
| BR-003 non-negative integer quantities | `isInt` / `isPosInt` checks in every stock operation |
| BR-004 Stock In increases | `stockIn` (+qty ledger row) |
| BR-005 Stock Out decreases | `stockOut` (−qty ledger row) |
| BR-006 cannot exceed available | `stockOut` ("Insufficient stock. Only N unit(s) available.") |
| BR-007 adjustment reason | `adjustStock` |
| BR-008 never negative | over-issue check, actual stock ≥ 0, and a load-time integrity check |
| BR-009 all movements recorded | every operation appends a transaction (including product creation) |
| BR-010 immutable transactions | no update/delete function exists; records are `Object.freeze`d; UI shows lock + message |
| BR-011 inactive products blocked | `checkProduct` used by all three movements; pickers list active products only |
| BR-012 reorder-level status | `getStockStatus` |
| BR-013 inventory value | `getInventoryValue` |
| BR-014 dashboard/reports current | everything is derived (`useMemo`) from the same state |
| BR-015 persistence | each operation writes to `localStorage` before state updates |
| BR-016 seed once | `loadInventory` seeds only when *no* inventory key exists |
| BR-017 code & opening fixed | `updateProduct` ignores them; fields disabled in UI |
| BR-018 deactivate keeps history | `setProductStatus` changes only `status` |
| BR-019 invalid form changes nothing | services return `{ ok:false }` before any patch is built |
| BR-020 CSV matches filters | export uses the same filtered array that feeds the table |

## 1.8 Non-functional requirements
| NFR | Approach |
| --- | --- |
| Usability / responsive | MUI components, permanent sidebar ≥ 900 px, drawer below; tables scroll horizontally |
| Code quality | functional components + hooks; pure rule functions separated from UI; reusable `SortableTable`, `ProductPicker`, `ConfirmDialog`… |
| Reliability | `useSubmitLock` stops double submits; validation before save; storage errors are caught and the change is rolled back; corrupt data never overwritten |
| Performance | derivations are O(transactions) and memoised; a 100-product / 600-transaction case is covered by a test |
| Security awareness | no credentials stored; React escapes all user text (no `dangerouslySetInnerHTML`); CSV cells starting with `= + - @` are neutralised; note that `localStorage` is not suitable for shared/production data |

## 1.9 Delivery plan (from Section 11) and how it maps
Day 1 analysis (this document) → Day 2 master data → Day 3 transactions → Day 4 dashboard/reports → Day 5 testing & submission.
