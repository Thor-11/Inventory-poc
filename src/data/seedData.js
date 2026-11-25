import { ACTIVE, INACTIVE, TXN_TYPES } from '../constants';

/**
 * First-run sample data: 23 products, 7 categories, 6 suppliers and
 * 66 transactions (23 opening balances + 43 stock movements).
 * Stock movements are generated in chronological order so every balanceAfter is consistent.
 */

// [code, name, description, status]
const CATEGORIES = [
  ['CAT-COMP', 'Computers & Laptops', 'Laptops and desktop computers', ACTIVE],
  ['CAT-PERI', 'Peripherals', 'Keyboards, mice, headsets and webcams', ACTIVE],
  ['CAT-DISP', 'Monitors & Displays', 'Desktop monitors and display accessories', ACTIVE],
  ['CAT-PRNT', 'Printers & Consumables', 'Printers, toner and cartridges', ACTIVE],
  ['CAT-NETW', 'Network Accessories', 'Cables, switches and routers', ACTIVE],
  ['CAT-OFFC', 'Office Supplies', 'Paper, stationery and general supplies', ACTIVE],
  ['CAT-LGCY', 'Legacy Equipment', 'Retired equipment (no active products)', INACTIVE],
];

// [code, name, contact, email, phone, status]
const SUPPLIERS = [
  ['SUP-001', 'TechNova Distributors', 'Ravi Kumar', 'ravi@technova.example.com', '+91 98480 11001', ACTIVE],
  ['SUP-002', 'Sri Lakshmi Computers', 'Lakshmi Devi', 'sales@srilakshmi.example.com', '+91 98480 11002', ACTIVE],
  ['SUP-003', 'Bharat IT Supplies', 'Arjun Reddy', 'arjun@bharatit.example.com', '+91 98480 11003', ACTIVE],
  ['SUP-004', 'NetLink Wholesale', 'Meena Iyer', 'orders@netlink.example.com', '+91 98480 11004', ACTIVE],
  ['SUP-005', 'OfficeMart Stationers', 'Suresh Babu', 'suresh@officemart.example.com', '+91 98480 11005', ACTIVE],
  ['SUP-006', 'Zenith Traders', 'Kiran Rao', 'kiran@zenith.example.com', '+91 98480 11006', INACTIVE],
];

// [code, name, categoryCode, supplierCode, unit, unitCost, openingStock, reorderLevel, status]
const PRODUCTS = [
  ['LAP-001', 'Dell Latitude 5440 Laptop', 'CAT-COMP', 'SUP-001', 'Pieces', 68500, 12, 5, ACTIVE],
  ['LAP-002', 'HP ProBook 450 G10 Laptop', 'CAT-COMP', 'SUP-002', 'Pieces', 62000, 10, 4, ACTIVE],
  ['LAP-003', 'Lenovo ThinkPad E14 Laptop', 'CAT-COMP', 'SUP-001', 'Pieces', 59500, 8, 4, ACTIVE],
  ['DSK-001', 'Dell OptiPlex Desktop', 'CAT-COMP', 'SUP-002', 'Pieces', 48000, 6, 3, ACTIVE],
  ['KEY-001', 'Logitech K120 Wired Keyboard', 'CAT-PERI', 'SUP-001', 'Pieces', 750, 60, 20, ACTIVE],
  ['KEY-002', 'Dell KB216 Keyboard', 'CAT-PERI', 'SUP-003', 'Pieces', 680, 45, 15, ACTIVE],
  ['MOU-001', 'Logitech M90 Optical Mouse', 'CAT-PERI', 'SUP-001', 'Pieces', 420, 70, 25, ACTIVE],
  ['MOU-002', 'HP X3000 Wireless Mouse', 'CAT-PERI', 'SUP-003', 'Pieces', 950, 30, 12, ACTIVE],
  ['HDS-001', 'Jabra Evolve 20 Headset', 'CAT-PERI', 'SUP-003', 'Pieces', 3400, 15, 6, ACTIVE],
  ['WEB-001', 'Logitech C270 Webcam', 'CAT-PERI', 'SUP-001', 'Pieces', 2200, 12, 5, ACTIVE],
  ['MON-001', 'Dell P2422H 24" Monitor', 'CAT-DISP', 'SUP-003', 'Pieces', 11500, 14, 5, ACTIVE],
  ['MON-002', 'LG 27UL500 27" Monitor', 'CAT-DISP', 'SUP-002', 'Pieces', 17500, 8, 3, ACTIVE],
  ['MON-003', 'HP V22 22" Monitor', 'CAT-DISP', 'SUP-003', 'Pieces', 8200, 10, 4, ACTIVE],
  ['PRN-001', 'HP LaserJet Pro M126nw', 'CAT-PRNT', 'SUP-003', 'Pieces', 18500, 5, 2, ACTIVE],
  ['TNR-001', 'HP 88A Black Toner Cartridge', 'CAT-PRNT', 'SUP-003', 'Pieces', 4200, 24, 8, ACTIVE],
  ['TNR-002', 'Canon 325 Toner Cartridge', 'CAT-PRNT', 'SUP-003', 'Pieces', 3800, 18, 6, ACTIVE],
  ['NET-001', 'Cat6 Ethernet Cable (305 m Box)', 'CAT-NETW', 'SUP-004', 'Boxes', 9800, 6, 2, ACTIVE],
  ['NET-002', 'TP-Link 24-Port Switch', 'CAT-NETW', 'SUP-004', 'Pieces', 7600, 7, 3, ACTIVE],
  ['NET-003', 'D-Link DIR-825 Wi-Fi Router', 'CAT-NETW', 'SUP-004', 'Pieces', 3900, 12, 5, ACTIVE],
  ['OFF-001', 'A4 Copier Paper (Box of 5 Reams)', 'CAT-OFFC', 'SUP-005', 'Boxes', 1650, 80, 30, ACTIVE],
  ['OFF-002', 'Ballpoint Pens (Box of 50)', 'CAT-OFFC', 'SUP-005', 'Boxes', 320, 40, 15, ACTIVE],
  ['OFF-003', 'Heavy Duty Stapler', 'CAT-OFFC', 'SUP-005', 'Pieces', 480, 25, 8, ACTIVE],
  ['OFF-004', 'Whiteboard Markers (Pack of 4)', 'CAT-OFFC', 'SUP-005', 'Packs', 180, 50, 20, INACTIVE],
];

// [daysAgo, productCode, kind, quantity, ...details]
//   IN : [d, code, 'IN', qty, referenceNumber]
//   OUT: [d, code, 'OUT', qty, issuedTo, department, purpose]
//   ADJ: [d, code, 'ADJ', signedQty, reason]
const MOVEMENTS = [
  [20, 'LAP-001', 'IN', 6, 'PO-1001'],
  [12, 'LAP-001', 'OUT', 10, 'Rahul S.', 'IT', 'New joiner laptops'],
  [4, 'LAP-001', 'OUT', 3, 'Anita M.', 'Sales', 'Sales team refresh'],
  [2, 'LAP-001', 'ADJ', -1, 'Damaged unit written off'],
  [15, 'LAP-002', 'OUT', 4, 'Divya K.', 'Finance', 'Finance team laptops'],
  [8, 'LAP-002', 'IN', 10, 'PO-1002'],
  [3, 'LAP-002', 'OUT', 2, 'Naveen P.', 'HR', 'HR onboarding'],
  [10, 'LAP-003', 'OUT', 8, 'Ramesh T.', 'Operations', 'Operations rollout'],
  [9, 'DSK-001', 'OUT', 2, 'Front Desk', 'Administration', 'Reception computers'],
  [14, 'KEY-001', 'OUT', 25, 'Rahul S.', 'IT', 'Desk setup for new floor'],
  [6, 'KEY-001', 'OUT', 20, 'Anita M.', 'Sales', 'Sales team desks'],
  [0, 'KEY-001', 'IN', 15, 'PO-1010'],
  [11, 'KEY-002', 'OUT', 30, 'Divya K.', 'Finance', 'Finance desks'],
  [5, 'KEY-002', 'OUT', 12, 'Naveen P.', 'HR', 'HR desks'],
  [18, 'MOU-001', 'IN', 50, 'PO-1003'],
  [13, 'MOU-001', 'OUT', 45, 'Rahul S.', 'IT', 'Desk setup for new floor'],
  [7, 'MOU-001', 'OUT', 30, 'Ramesh T.', 'Operations', 'Operations desks'],
  [16, 'MOU-002', 'OUT', 10, 'Anita M.', 'Sales', 'Wireless mice for sales'],
  [0, 'MOU-002', 'ADJ', -2, 'Physical count shortage'],
  [12, 'HDS-001', 'OUT', 6, 'Support Lead', 'Support', 'Support team headsets'],
  [2, 'HDS-001', 'OUT', 9, 'Support Lead', 'Support', 'Support team expansion'],
  [8, 'WEB-001', 'OUT', 3, 'Naveen P.', 'HR', 'Interview room'],
  [17, 'MON-001', 'OUT', 6, 'Rahul S.', 'IT', 'Developer monitors'],
  [9, 'MON-001', 'IN', 8, 'PO-1004'],
  [0, 'MON-001', 'OUT', 5, 'Divya K.', 'Finance', 'Finance dual-monitor setup'],
  [10, 'MON-002', 'OUT', 5, 'Design Lead', 'Operations', 'Design workstations'],
  [6, 'MON-003', 'IN', 5, 'PO-1005'],
  [7, 'PRN-001', 'OUT', 2, 'Front Desk', 'Administration', 'Floor printers'],
  [15, 'TNR-001', 'OUT', 12, 'Front Desk', 'Administration', 'Monthly toner issue'],
  [8, 'TNR-001', 'OUT', 8, 'Front Desk', 'Administration', 'Monthly toner issue'],
  [0, 'TNR-001', 'OUT', 2, 'Front Desk', 'Administration', 'Urgent toner replacement'],
  [11, 'TNR-002', 'OUT', 6, 'Front Desk', 'Administration', 'Monthly toner issue'],
  [3, 'TNR-002', 'IN', 12, 'PO-1006'],
  [13, 'NET-001', 'OUT', 2, 'Network Admin', 'IT', 'Cabling for new floor'],
  [9, 'NET-002', 'OUT', 3, 'Network Admin', 'IT', 'Switch upgrade'],
  [6, 'NET-003', 'OUT', 4, 'Network Admin', 'IT', 'Branch office routers'],
  [4, 'NET-003', 'ADJ', 1, 'Unit found during stock count'],
  [19, 'OFF-001', 'OUT', 40, 'Admin Office', 'Administration', 'Quarterly paper issue'],
  [10, 'OFF-001', 'OUT', 15, 'Admin Office', 'Administration', 'Printing room refill'],
  [1, 'OFF-001', 'IN', 50, 'PO-1007'],
  [12, 'OFF-002', 'OUT', 30, 'Admin Office', 'Administration', 'Stationery issue'],
  [5, 'OFF-003', 'OUT', 5, 'Admin Office', 'Administration', 'Stationery issue'],
  [20, 'OFF-004', 'OUT', 10, 'Admin Office', 'Administration', 'Meeting room supplies'],
];

const OPENING_DAYS_AGO = 25;

function startOfDay(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

export function buildSeedData(now = new Date()) {
  const categories = CATEGORIES.map(([code, name, description, status], i) => ({
    id: `cat_${i + 1}`,
    code,
    name,
    description,
    status,
  }));
  const suppliers = SUPPLIERS.map(([code, name, contactPerson, email, phone, status], i) => ({
    id: `sup_${i + 1}`,
    code,
    name,
    contactPerson,
    email,
    phone,
    status,
  }));
  const catId = new Map(categories.map((c) => [c.code, c.id]));
  const supId = new Map(suppliers.map((s) => [s.code, s.id]));

  const products = PRODUCTS.map(
    ([code, name, cat, sup, unit, unitCost, openingStock, reorderLevel, status], i) => ({
      id: `prd_${i + 1}`,
      code,
      name,
      categoryId: catId.get(cat),
      supplierId: supId.get(sup),
      description: '',
      unit,
      unitCost,
      openingStock,
      reorderLevel,
      status,
    }),
  );
  const byCode = new Map(products.map((p) => [p.code, p]));

  const transactions = [];
  const balance = new Map();
  let seq = 0;
  const push = (txn) => {
    seq += 1;
    const record = { id: `TXN-${String(seq).padStart(6, '0')}`, ...txn };
    balance.set(txn.productId, txn.balanceAfter);
    transactions.push(Object.freeze(record));
  };

  // 1. Opening balances (oldest entries in the ledger).
  const openingBase = startOfDay(new Date(now.getTime() - OPENING_DAYS_AGO * 86400000));
  products.forEach((p, i) => {
    const date = new Date(openingBase.getTime() + 9 * 3600000 + i * 60000);
    push({
      date: date.toISOString(),
      productId: p.id,
      type: TXN_TYPES.OPENING,
      quantityChange: p.openingStock,
      balanceAfter: p.openingStock,
      reference: 'Opening balance',
      remarks: 'Opening stock recorded at product creation',
    });
  });

  // 2. Movements in chronological order (oldest first; ties keep list order).
  const sorted = MOVEMENTS.map((m, index) => ({ m, index })).sort(
    (a, b) => b.m[0] - a.m[0] || a.index - b.index,
  );
  const todayCount = sorted.filter((x) => x.m[0] === 0).length;
  let todayIdx = 0;
  const dayStart = startOfDay(now);

  sorted.forEach(({ m }, idx) => {
    const [daysAgo, code, kind, qty, ...rest] = m;
    const product = byCode.get(code);
    let date;
    if (daysAgo === 0) {
      const minutesAgo = (todayCount - todayIdx) * 20;
      todayIdx += 1;
      date = new Date(Math.max(dayStart.getTime(), now.getTime() - minutesAgo * 60000));
    } else {
      const day = startOfDay(new Date(now.getTime() - daysAgo * 86400000));
      date = new Date(day.getTime() + (9 + (idx % 8)) * 3600000 + ((idx * 7) % 60) * 60000);
    }

    const current = balance.get(product.id);
    const base = { date: date.toISOString(), productId: product.id };

    if (kind === 'IN') {
      push({
        ...base,
        type: TXN_TYPES.STOCK_IN,
        quantityChange: qty,
        balanceAfter: current + qty,
        reference: rest[0],
        remarks: 'Goods received',
        supplierId: product.supplierId,
        unitCost: Math.round(product.unitCost * 0.97),
      });
    } else if (kind === 'OUT') {
      const [issuedTo, department, purpose] = rest;
      push({
        ...base,
        type: TXN_TYPES.STOCK_OUT,
        quantityChange: -qty,
        balanceAfter: current - qty,
        reference: `${issuedTo} / ${department}`,
        remarks: purpose,
        issuedTo,
        department,
      });
    } else {
      push({
        ...base,
        type: TXN_TYPES.ADJUSTMENT,
        quantityChange: qty,
        balanceAfter: current + qty,
        reference: 'Physical count',
        remarks: rest[0],
      });
    }
  });

  return {
    products,
    categories,
    suppliers,
    transactions,
    settings: { seeded: true, version: 1, seededAt: now.toISOString() },
  };
}
