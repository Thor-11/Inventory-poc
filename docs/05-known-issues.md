# 5. Known Issues and Incomplete Features

## Not done / not verified
1. **Screenshots are not included.** No browser was available where the project was built; capture them using `07-screenshot-checklist.md`.
2. **Manual checks M1–M9 in `04-test-cases.md` are still to be run.** The UI was exercised through automated tests in a simulated browser, not by eye, so visual polish and tablet layout are unverified.
3. **AC-25 (export equals filtered table)** is satisfied by design (same array used for both) but has no automated check.
4. Performance was tested at logic level (100+ products / 600 transactions); the rendered UI at that size was not measured.

## Limitations
5. **Single JavaScript bundle (~970 kB, ~287 kB gzipped).** Fine for a POC; route-level code splitting would reduce it.
6. **Recharts 2.x** prints an npm "deprecated" notice (v3 exists). It works and is MIT licensed.
7. **Tamper detection is partial.** Because `localStorage` is user-editable, someone can change data in DevTools. Load checks catch invalid structure, broken references and negative balances, but not an edited `balanceAfter` that is still non-negative.
8. **Transaction Date field** shows the time the form was rendered; the saved timestamp is taken at the moment of saving (may differ by seconds or minutes).
9. **Date filters use the browser's local time zone.**
10. **No bulk import, no product images, no undo.** Mistakes are corrected with a Stock Adjustment, as the immutability rule intends.
11. **Supplier deactivation** is allowed even if active products use it as default supplier (spec only restricts new use). Such products stay editable; the supplier cannot be chosen again for new products or receipts.
12. Currency is fixed to INR (₹); no multi-currency.

## Security notes
* No credentials are stored. All entered text is rendered through React (escaped); there is no `dangerouslySetInnerHTML`.
* CSV cells beginning with `=`, `+`, `-`, `@` are prefixed with an apostrophe to prevent spreadsheet formula injection.
* `localStorage` is not suitable for secure, shared production inventory data.
