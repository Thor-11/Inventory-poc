# 6. Assumptions and Clarifications

The specification leaves some details open. These are the decisions made (all easy to change).

| # | Topic | Decision |
| --- | --- | --- |
| 1 | Opening stock | Stored as an **Opening** transaction so history, balances and stock all come from one ledger. Created even when opening stock is 0. |
| 2 | Stock storage | No quantity field on products; stock = sum of the product's transaction quantity changes. |
| 3 | Dashboard scope | KPIs, chart and replenishment list use **active** products only (consistent with FR-012). |
| 4 | "Today's Transactions" | Counts receipts, issues and adjustments dated today (local time); Opening entries are not counted. Shown as a total with a breakdown. |
| 5 | Currency | Indian rupee (₹, `en-IN` formatting). |
| 6 | Codes | Product, category and supplier codes are unique case-insensitively and cannot be changed after creation. |
| 7 | Category/supplier names | Category names unique (case-insensitive) as required; supplier names are not required to be unique. |
| 8 | Reactivation | Inactive products, categories and suppliers can be activated again. A product can only be activated if its category is active. |
| 9 | Active product + inactive category | Not allowed: a category in use by an active product cannot be deactivated, and an active product must use an active category. |
| 10 | Inactive supplier | Cannot be chosen for new products or receipts; existing products keep it and remain editable. |
| 11 | Stock Out | Department is chosen from a fixed list (IT, HR, Finance, Administration, Operations, Sales, Support). |
| 12 | History "Reference" column | Opening → "Opening balance"; Stock In → entered reference number; Stock Out → "Issued To / Department"; Adjustment → "Physical count". "Remarks" holds purpose / reason / notes. |
| 13 | Adjustments | Entering an actual quantity equal to the system quantity is rejected (nothing to adjust). Actual quantity must be a whole number ≥ 0, so negative stock is impossible. |
| 14 | Stock In defaults | Choosing a product pre-fills its default supplier and unit cost; both can be changed. Master unit cost is never altered by a receipt. |
| 15 | Low Stock report | Lists active products that are Low **or** Out of Stock; shortfall = max(0, reorder − available). |
| 16 | Current Stock report | Defaults to active products; the *Product status* filter can show inactive or all. |
| 17 | Sample data | 23 products (1 inactive), 7 categories (1 inactive), 6 suppliers (1 inactive), 66 transactions = 23 openings + 43 movements. Dates are relative to the first run so "today" has data. Includes 5 low-stock and 2 out-of-stock products. |
| 18 | Limits | Quantity ≤ 1,000,000; unit cost ≤ 100,000,000; text lengths as listed in the validations (reference 50, remarks/purpose/reason 200). |
| 19 | Corrupt data | The app stops on a Recovery screen instead of guessing; reset is always explicit and backs up first. |
| 20 | Multiple tabs | Each write re-reads storage first and other tabs refresh on storage events, to avoid lost updates. |
| 21 | AI assistance | The code was generated with AI assistance. It must be read, understood and tested by the trainee, who must be able to explain and fix it (Section 13). |
