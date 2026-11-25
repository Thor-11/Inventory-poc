# 4. Test Cases and Results

## How results were obtained
* **Automated** – `npm test` runs 66 tests (39 business-rule/persistence tests, 27 UI tests that render the real screens in a simulated browser and click/type through them). Last run: **66 passed, 0 failed**.
* **Manual** – items that need a real browser (file download, visual layout, tablet width) have **not** been executed yet. They are marked *Manual – to run* and must be completed by the trainee before submission.

## Acceptance criteria (Section 9)
| ID | Scenario | Expected | Verified by | Result |
| --- | --- | --- | --- | --- |
| AC-01 | First open | Sample inventory loads | Automated (seed counts, first-run write) | Pass |
| AC-02 | Add valid product | Appears in list | Automated (UI) | Pass |
| AC-03 | Duplicate product code | Save prevented | Automated (UI + rules) | Pass |
| AC-04 | Missing required fields | Errors shown, nothing saved | Automated (UI + rules) | Pass |
| AC-05 | Edit product | Record updated; code/opening stock locked | Automated (rules; UI locked fields) | Pass |
| AC-06 | Create category | Usable in product form | Automated (rules) · dropdown visually | Pass (rules) / Manual – to run (UI) |
| AC-07 | Create supplier | Usable in forms | Automated (rules) · dropdown visually | Pass (rules) / Manual – to run (UI) |
| AC-08 | Receive 10 units | Stock +10, in history | Automated (UI + rules) | Pass |
| AC-09 | Issue 5 units | Stock −5 | Automated (rules) | Pass |
| AC-10 | Issue more than available | Blocked | Automated (UI + rules) | Pass |
| AC-11 | Zero / negative issue | Validation shown | Automated (UI + rules) | Pass |
| AC-12 | Adjust to physical qty | Correct adjustment recorded | Automated (UI + rules) | Pass |
| AC-13 | Stock reaches zero | Out of Stock shown | Automated (rules) | Pass |
| AC-14 | Stock ≤ reorder level | Low Stock shown | Automated (rules) | Pass |
| AC-15 | Update stock | Dashboard recalculates | Automated (calculation) · live screen | Pass (logic) / Manual – to run (screen) |
| AC-16 | View history | Movements accurate | Automated (ledger consistency, history screen) | Pass |
| AC-17 | Product filters | Correct products | Automated (UI) | Pass |
| AC-18 | Page size change | Correct record count | Automated (UI: 5, 10, 20) | Pass |
| AC-19 | Export stock report | CSV with correct values | Automated (CSV builder) · actual download | Pass (logic) / Manual – to run (download) |
| AC-20 | Refresh | Records remain | Automated (re-mount + storage reload) | Pass |
| AC-21 | Deactivate product | New transactions prevented | Automated (UI + rules) | Pass |
| AC-22 | Nonexistent product | Friendly message | Automated (UI) | Pass |
| AC-23 | Change historical transaction | Prevented | Automated (UI + rules) | Pass |
| AC-24 | Deactivate category in use | Blocked | Automated (UI + rules) | Pass |
| AC-25 | Filter report then export | Export = filtered rows | Same array feeds table and CSV (code review) | Manual – to run |

## Other automated checks
| Area | Checks | Result |
| --- | --- | --- |
| Section 7 maths | 20+15−8−2 = 25; shortfall; status boundaries (0, =reorder, >reorder); value uses master cost; Stock-In cost leaves master cost unchanged | Pass |
| Sample data | ≥20 products, ≥5 categories, ≥5 suppliers, ≥30 movements; every `balanceAfter` matches the running ledger; includes low, out-of-stock and inactive examples | Pass |
| Validation | code ≤20, name 3–100, cost > 0, non-negative integers, description ≤500; decimals/blank/text quantities rejected; adjustment equal to system stock rejected | Pass |
| Master data rules | duplicate category code/name (case-insensitive); supplier email validation; inactive supplier blocked for products and receipts | Pass |
| Integrity | transaction ids unique and sequential; transactions frozen; no edit/delete function exists | Pass |
| Persistence | seeds once; later loads keep changes; corrupt JSON and wrong shape reported and not overwritten; storage-full handled; reset backs up first; reset aborts if backup fails; recovery screen shown in UI | Pass |
| CSV | quoting, negative numbers untouched, formula cells neutralised | Pass |
| Navigation | all 12 routes render; 9 sidebar items present; active item has `aria-current`; unknown route → Page not found | Pass |
| Performance | stock derivation for 600 extra transactions well under 200 ms | Pass |

## Manual test sheet (to complete in a real browser)
| # | Step | Expected | Result (Pass/Fail) |
| --- | --- | --- | --- |
| M1 | Open on desktop width; click each sidebar item | Page changes, item highlighted | ☐ |
| M2 | Resize to ~800 px (tablet) | Sidebar becomes a drawer; tables scroll sideways, no layout break | ☐ |
| M3 | Reports → Current Stock → filter → Export CSV; open in Excel | File matches the filtered table (AC-19, AC-25) | ☐ |
| M4 | Same for Stock Movement (date range) and Low Stock | Matches filtered table | ☐ |
| M5 | Receive stock, then watch Dashboard | KPIs and chart change (AC-15) | ☐ |
| M6 | Create a category and a supplier, then open Add Product | Both appear in the dropdowns (AC-06, AC-07) | ☐ |
| M7 | Open two tabs, add stock in one, then act in the other | Second tab shows the new data; no lost updates | ☐ |
| M8 | DevTools: break `inventory_products` (e.g. `{`), reload | Recovery screen; value unchanged until reset | ☐ |
| M9 | Double-click Save quickly on Stock In | Only one transaction created | ☐ |
