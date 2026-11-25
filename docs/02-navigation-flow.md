# 2. Screen Navigation Flow

## Route map
| Screen ID | Screen | Route |
| --- | --- | --- |
| INV-01 | Dashboard | `/` |
| INV-02 | Product List | `/products` |
| INV-03 | Add / Edit Product | `/products/new`, `/products/:id/edit` |
| INV-04 | Product Details | `/products/:id` |
| INV-05 | Category Management (dialog for add/edit) | `/categories` |
| INV-06 | Supplier Management (dialog for add/edit) | `/suppliers` |
| INV-07 | Stock In | `/stock-in` (optional `?product=<id>`) |
| INV-08 | Stock Out | `/stock-out` (optional `?product=<id>`) |
| INV-09 | Stock Adjustment | `/stock-adjustment` (optional `?product=<id>`) |
| INV-10 | Transaction History | `/transactions` (optional `?product=<id>`) |
| INV-11 | Low Stock Report | `/reports?tab=low-stock` (also `/reports/low-stock`) |
| INV-12 | Inventory Reports | `/reports` (`?tab=stock \| movement \| low-stock`) |
| — | Not found | any other path |

Related screens are combined as the specification allows: add/edit category and supplier use dialogs; the three reports use tabs.

## Flow diagram
```mermaid
flowchart TD
    SB[[Sidebar: Dashboard · Products · Categories · Suppliers · Stock In · Stock Out · Stock Adjustment · Transactions · Reports]]

    SB --> D[INV-01 Dashboard]
    SB --> PL[INV-02 Product List]
    SB --> C[INV-05 Categories]
    SB --> S[INV-06 Suppliers]
    SB --> SI[INV-07 Stock In]
    SB --> SO[INV-08 Stock Out]
    SB --> SA[INV-09 Stock Adjustment]
    SB --> T[INV-10 Transaction History]
    SB --> R[INV-12 Reports]

    D -- "Receive stock" --> SI
    D -- "Open low stock report" --> LR[INV-11 Low Stock tab]
    R --> LR

    PL -- "Add Product" --> PF[INV-03 Add/Edit Product]
    PL -- "View" --> PD[INV-04 Product Details]
    PL -- "Edit" --> PF
    PL -- "Deactivate / Activate" --> CF{{Confirm dialog}}
    PF -- "Save" --> PD
    PF -- "Cancel" --> PL

    PD -- "Edit" --> PF
    PD -- "Stock In / Stock Out" --> SI
    PD --> SO
    PD -- "View full history" --> T

    C -- "Add / Edit" --> CD{{Category dialog}}
    S -- "Add / Edit" --> SD{{Supplier dialog}}

    SI -- "Save" --> T
    SO -- "Save" --> T
    SA -- "Save" --> T
    T -. "lock icon: edit/delete refused" .-> T
    R --> RS[Current Stock] & RM[Stock Movement] & LR
    RS & RM & LR -- "Export CSV" --> F[(CSV file)]
```
(Stock In/Out/Adjustment stay on the form after saving and show a confirmation; the arrows to *Transactions* show where the new record can be viewed.)

## Unknown or invalid addresses
* `/products/<unknown id>` and `/products/<unknown id>/edit` → "Product not found" message with a link back (AC-22).
* Any other unknown path → "Page not found" message with a link to the Dashboard.
* Stored data missing/corrupt → Recovery screen instead of the app (FR-015).
