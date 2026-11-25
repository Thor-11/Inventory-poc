# 3. Components and Data Storage

## 3.1 Component list
### Layout and shared UI (`src/components`)
| Component | Purpose |
| --- | --- |
| `Layout` | Sidebar (permanent on desktop, drawer on tablet/phone), app bar with page title, active-item highlight, `<Outlet>` |
| `PageHeader` | Sub-heading + action buttons under the title |
| `SortableTable` | Reusable table: column sorting, pagination 5/10/20, empty state, resets to page 1 when filters change |
| `StatusChips` | `StockStatusChip`, `ActiveChip`, `TxnTypeChip` |
| `ConfirmDialog` | Confirmation before (de)activation |
| `ProductPicker` | Searchable product dropdown (Autocomplete) |
| `ReadOnlyField` | Auto-generated / calculated read-only fields |
| `TransactionFilters` | Product / type / date-range filters shared by History and the Movement report |
| `RecoveryScreen` | Shown when stored data is missing, corrupt or inconsistent |

### Screens (`src/pages`)
`Dashboard`, `Products`, `ProductForm` (add + edit), `ProductDetails`, `Categories`, `Suppliers`, `StockIn`, `StockOut`, `StockAdjustment`, `Transactions`, `Reports` (Current Stock, Movement, Low Stock tabs), `NotFound`.

### State and logic
| Module | Responsibility |
| --- | --- |
| `context/InventoryContext` | Holds products, categories, suppliers, transactions; exposes `rows` (products joined with derived stock) and `ops` (all write operations); handles persistence, rollback and cross-tab sync |
| `context/NotifyContext` | Global Snackbar: `notify(message, severity)` |
| `services/inventoryService.js` | **Pure business rules** — validation and creation of records; no React, no storage |
| `utils/inventory.js` | Calculations: stock map, status, shortfall, value, dashboard stats, filters, next transaction id |
| `utils/storage.js` | `localStorage` read/write, first-run seeding, safe loading, user-initiated reset with backup |
| `utils/dataIntegrity.js` | Shape and relationship checks on loaded data |
| `utils/csv.js`, `utils/format.js` | CSV building/download (injection-safe); currency/date formatting |
| `hooks/useSubmitLock.js` | Blocks duplicate submissions |
| `data/seedData.js` | Sample data generator for the first run |

## 3.2 How data is stored
Everything lives in the browser's `localStorage` as JSON.

| Key | Content |
| --- | --- |
| `inventory_products` | array of products (no quantity field — stock is derived) |
| `inventory_categories` | array of categories |
| `inventory_suppliers` | array of suppliers |
| `inventory_transactions` | array of ledger rows, including opening balances and adjustments |
| `inventory_settings` | `{ seeded: true, version, seededAt }` — written last, marks first-run completion |
| `inventory_backup_<timestamp>` | only created by the *Back up and reset* recovery action |

### Life of a write (e.g. Stock Out)
1. The form calls `ops.stockOut(values)`.
2. The context **re-reads** `localStorage` (so a second tab cannot cause a stale overwrite) and validates it.
3. `services.stockOut` checks every rule. On any problem it returns `{ ok:false, errors }` and **nothing** is written.
4. On success it returns a patch (`transactions: [...old, newRow]`).
5. The patch is written to `localStorage`. If that throws (quota/blocked) anything already written is rolled back and the user sees an error.
6. Only then is React state updated, so the screen, dashboard and reports re-derive from the same data.

### Safe loading (FR-015)
* **No keys at all** → first run → sample data is written once.
* **Keys present** → data is read, never reseeded.
* **Invalid JSON, wrong shape, missing key, broken references, or a negative stock balance** → the app does *not* start; the Recovery screen explains what is wrong. Nothing is overwritten unless the user chooses *Back up and reset*, and if the backup cannot be written nothing is deleted.

### Why `localStorage` is only acceptable for a POC
~5 MB limit, per-browser and per-user, readable and editable by anyone with DevTools, no concurrency control beyond what is described above, no access control. Production inventory data belongs on a server with authentication and a database.
