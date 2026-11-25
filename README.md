# Inventory Management System — React POC

A front-end-only Inventory Management System built from the *Inventory Management System — React POC Specification* (v1.0).
It manages products, categories, suppliers, stock receipts, stock issues, stock adjustments, low-stock alerts and inventory reports.
All data is stored in the browser's `localStorage`; there is no backend or database.

| Layer | Technology |
| --- | --- |
| UI | React 18 + JavaScript, MUI v5 (Material UI) |
| Build tool | Vite |
| Routing | React Router v6 |
| State | React hooks + Context |
| Storage | Browser `localStorage` |
| Charts | Recharts (MIT licence, free for commercial use) |
| Tests | Vitest + React Testing Library (dev only) |

## Requirements

* Node.js 18 or newer (20 recommended) and npm

## Install and run

```bash
npm install        # installs dependencies
npm run dev        # starts the dev server -> open http://localhost:5173
```

Other commands

```bash
npm test           # runs the 66 automated tests (business rules + UI flows)
npm run build      # production build into /dist
npm run preview    # serves the production build locally
```

## First run and resetting the data

* On the very first load the app writes sample data (23 products, 7 categories, 6 suppliers, 66 transactions) to `localStorage`.
* On every later load the saved data is used and **never** overwritten.
* To start over during testing: open browser DevTools -> Application -> Local Storage -> delete the `inventory_*` keys and refresh.
* If stored data is ever missing, corrupt or inconsistent, the app shows a recovery screen instead of overwriting anything. You can retry, or *Back up and reset* (a copy of the old data is stored under an `inventory_backup_<timestamp>` key first).

## Suggested 5-minute demo

1. **Dashboard** – six KPI cards, "Stock by category" chart, replenishment list.
2. **Products** – search `toner`, filter *Out of Stock*, change page size, *Clear Filters*. Open a product to see details and the latest 10 transactions.
3. **Add Product** – submit empty (errors) → reuse code `LAP-001` (duplicate error) → add a valid product (opening stock 12).
4. **Categories / Suppliers** – add one of each; try deactivating *Peripherals* (blocked: used by active products).
5. **Stock In** – receive 10 units; **Stock Out** – issue 5, then try more than available (blocked) and `0` (validation).
6. **Stock Adjustment** – physical count lower than system stock; note the calculated difference.
7. **Dashboard** again – values changed. Reload the page – data is still there.
8. **Transactions** – filter by product/type/date; click the lock icon on a row (edit/delete refused).
9. **Reports** – apply filters on each tab, *Export CSV*, open the file and compare with the table.
10. Deactivate a product, then check it is missing from the Stock In / Out product lists.

## Project structure

```
src/
  main.jsx, App.jsx, theme.js, constants.js
  components/   Layout, SortableTable, ProductPicker, ConfirmDialog, StatusChips, RecoveryScreen, ...
  context/      InventoryContext (data + operations), NotifyContext (snackbar)
  data/         seedData.js (first-run sample data)
  hooks/        useSubmitLock.js (prevents duplicate submits)
  pages/        one file per screen (Dashboard, Products, ProductForm, ProductDetails, Categories, ...)
  services/     inventoryService.js (pure business rules)  + __tests__/
  utils/        inventory.js (calculations), storage.js (localStorage), dataIntegrity.js, csv.js, format.js
  __tests__/    ui.test.jsx (screen-level tests)
docs/           submission documents (see below)
```

## Documents (Section 12 of the specification)

| Required item | File |
| --- | --- |
| Source code, README | this project |
| Requirement understanding document | `docs/01-requirement-understanding.md` |
| Screen navigation flow diagram | `docs/02-navigation-flow.md` |
| Components list and data storage explanation | `docs/03-components-and-data-storage.md` |
| Test cases with Pass/Fail | `docs/04-test-cases.md` |
| Known issues / incomplete features | `docs/05-known-issues.md` |
| Assumptions and clarifications | `docs/06-assumptions.md` |
| Screenshots of all completed screens | `docs/07-screenshot-checklist.md` (checklist; images to be captured) |
