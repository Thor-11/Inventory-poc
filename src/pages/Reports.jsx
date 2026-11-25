import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Box, Button, MenuItem, Paper, Tab, Tabs, TextField, Typography } from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { ACTIVE, INACTIVE, STOCK_STATUS, TXN_TYPE_LABELS } from '../constants';
import { useInventory } from '../context/InventoryContext';
import { useNotify } from '../context/NotifyContext';
import { downloadCsv } from '../utils/csv';
import { enrichTransactions, filterTransactions, txnSeq } from '../utils/inventory';
import { formatCurrency, formatDateTime, formatDateTimeCsv, signed, toDateInputValue } from '../utils/format';
import PageHeader from '../components/PageHeader';
import SortableTable from '../components/SortableTable';
import TransactionFilters, { NO_TXN_FILTERS } from '../components/TransactionFilters';
import { StockStatusChip, TxnTypeChip } from '../components/StatusChips';

const TABS = [
  { key: 'stock', label: 'Current Stock' },
  { key: 'movement', label: 'Stock Movement' },
  { key: 'low-stock', label: 'Low Stock' },
];

/** Result count + CSV button. The export always uses the *filtered* rows (BR-020). */
function ReportBar({ count, onExport, extra }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1, flexWrap: 'wrap', gap: 1 }}>
      <Typography color="text.secondary">
        {count} record{count === 1 ? '' : 's'}{extra ? ` · ${extra}` : ''}
      </Typography>
      <Button variant="outlined" startIcon={<FileDownloadIcon />} onClick={onExport} disabled={count === 0}>
        Export CSV
      </Button>
    </Box>
  );
}

const stamp = () => toDateInputValue(new Date());

/* ----------------------------------------------------------- current stock */
function CurrentStockReport() {
  const { rows, categories } = useInventory();
  const notify = useNotify();
  const [f, setF] = useState({ search: '', categoryId: '', stockStatus: '', status: ACTIVE });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const data = useMemo(() => {
    const q = f.search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!q || r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)) &&
        (!f.categoryId || r.categoryId === f.categoryId) &&
        (!f.stockStatus || r.stockStatus === f.stockStatus) &&
        (!f.status || r.status === f.status),
    );
  }, [rows, f]);

  const csvColumns = [
    { label: 'Product Code', value: (r) => r.code },
    { label: 'Product Name', value: (r) => r.name },
    { label: 'Category', value: (r) => r.categoryName },
    { label: 'Available Quantity', value: (r) => r.stock },
    { label: 'Unit Cost', value: (r) => r.unitCost },
    { label: 'Inventory Value', value: (r) => r.inventoryValue },
    { label: 'Stock Status', value: (r) => r.stockStatus },
  ];
  const columns = [
    { id: 'code', label: 'Product', minWidth: 240, render: (r) => (<><strong>{r.code}</strong> — {r.name}</>), sortValue: (r) => r.code },
    { id: 'categoryName', label: 'Category' },
    { id: 'stock', label: 'Available Quantity', align: 'right' },
    { id: 'unitCost', label: 'Unit Cost', align: 'right', render: (r) => formatCurrency(r.unitCost) },
    { id: 'inventoryValue', label: 'Inventory Value', align: 'right', render: (r) => formatCurrency(r.inventoryValue) },
    { id: 'stockStatus', label: 'Stock Status', render: (r) => <StockStatusChip status={r.stockStatus} /> },
  ];
  const total = data.reduce((s, r) => s + r.inventoryValue, 0);

  return (
    <>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField label="Search code or name" size="small" value={f.search} onChange={set('search')} sx={{ minWidth: 220, flex: 1 }} />
        <TextField select label="Category" size="small" value={f.categoryId} onChange={set('categoryId')} sx={{ minWidth: 190 }}>
          <MenuItem value="">All categories</MenuItem>
          {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField select label="Stock status" size="small" value={f.stockStatus} onChange={set('stockStatus')} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          {Object.values(STOCK_STATUS).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField select label="Product status" size="small" value={f.status} onChange={set('status')} sx={{ minWidth: 150 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value={ACTIVE}>Active</MenuItem>
          <MenuItem value={INACTIVE}>Inactive</MenuItem>
        </TextField>
        <Button onClick={() => setF({ search: '', categoryId: '', stockStatus: '', status: ACTIVE })}>Clear Filters</Button>
      </Paper>
      <ReportBar
        count={data.length}
        extra={`Total value ${formatCurrency(total)}`}
        onExport={() => { downloadCsv(`current-stock-report-${stamp()}.csv`, csvColumns, data); notify(`Exported ${data.length} record(s).`); }}
      />
      <SortableTable columns={columns} rows={data} defaultSort={{ id: 'code', dir: 'asc' }} ariaLabel="Current stock report" emptyMessage="No products match these filters." />
    </>
  );
}

/* ---------------------------------------------------------- stock movement */
function MovementReport() {
  const { products, transactions } = useInventory();
  const notify = useNotify();
  const [filters, setFilters] = useState(NO_TXN_FILTERS);

  const data = useMemo(
    () => filterTransactions(enrichTransactions(transactions, products), filters),
    [transactions, products, filters],
  );

  const csvColumns = [
    { label: 'Product Code', value: (t) => t.productCode },
    { label: 'Product Name', value: (t) => t.productName },
    { label: 'Date', value: (t) => formatDateTimeCsv(t.date) },
    { label: 'Transaction Type', value: (t) => TXN_TYPE_LABELS[t.type] },
    { label: 'Quantity Change', value: (t) => t.quantityChange },
    { label: 'Balance After', value: (t) => t.balanceAfter },
  ];
  const columns = [
    { id: 'product', label: 'Product', minWidth: 240, sortValue: (t) => `${t.productCode} ${t.productName}`, render: (t) => (<><strong>{t.productCode}</strong> — {t.productName}</>) },
    { id: 'date', label: 'Date', minWidth: 150, render: (t) => formatDateTime(t.date), sortValue: (t) => txnSeq(t.id) },
    { id: 'type', label: 'Transaction Type', render: (t) => <TxnTypeChip type={t.type} /> },
    { id: 'quantityChange', label: 'Quantity Change', align: 'right', render: (t) => signed(t.quantityChange) },
    { id: 'balanceAfter', label: 'Balance After', align: 'right' },
  ];

  return (
    <>
      <TransactionFilters filters={filters} onChange={setFilters} products={products} />
      <ReportBar
        count={data.length}
        onExport={() => { downloadCsv(`stock-movement-report-${stamp()}.csv`, csvColumns, data); notify(`Exported ${data.length} record(s).`); }}
      />
      <SortableTable columns={columns} rows={data} defaultSort={{ id: 'date', dir: 'desc' }} ariaLabel="Stock movement report" emptyMessage="No movements match these filters." />
    </>
  );
}

/* --------------------------------------------------------------- low stock */
function LowStockReport() {
  const { rows, categories } = useInventory();
  const notify = useNotify();
  const [f, setF] = useState({ search: '', categoryId: '', stockStatus: '' });
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.value }));

  const data = useMemo(() => {
    const q = f.search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        r.status === ACTIVE && // inactive products are excluded from alerts (FR-012)
        r.stockStatus !== STOCK_STATUS.IN &&
        (!q || r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)) &&
        (!f.categoryId || r.categoryId === f.categoryId) &&
        (!f.stockStatus || r.stockStatus === f.stockStatus),
    );
  }, [rows, f]);

  const csvColumns = [
    { label: 'Product Code', value: (r) => r.code },
    { label: 'Product Name', value: (r) => r.name },
    { label: 'Available Quantity', value: (r) => r.stock },
    { label: 'Reorder Level', value: (r) => r.reorderLevel },
    { label: 'Shortfall', value: (r) => r.shortfall },
    { label: 'Stock Status', value: (r) => r.stockStatus },
  ];
  const columns = [
    { id: 'code', label: 'Product', minWidth: 240, render: (r) => (<><strong>{r.code}</strong> — {r.name}</>), sortValue: (r) => r.code },
    { id: 'stock', label: 'Available Quantity', align: 'right' },
    { id: 'reorderLevel', label: 'Reorder Level', align: 'right' },
    { id: 'shortfall', label: 'Shortfall', align: 'right' },
    { id: 'stockStatus', label: 'Stock Status', render: (r) => <StockStatusChip status={r.stockStatus} /> },
  ];

  return (
    <>
      <Paper sx={{ p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField label="Search code or name" size="small" value={f.search} onChange={set('search')} sx={{ minWidth: 220, flex: 1 }} />
        <TextField select label="Category" size="small" value={f.categoryId} onChange={set('categoryId')} sx={{ minWidth: 190 }}>
          <MenuItem value="">All categories</MenuItem>
          {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField select label="Stock status" size="small" value={f.stockStatus} onChange={set('stockStatus')} sx={{ minWidth: 160 }}>
          <MenuItem value="">Low and Out of Stock</MenuItem>
          <MenuItem value={STOCK_STATUS.LOW}>{STOCK_STATUS.LOW}</MenuItem>
          <MenuItem value={STOCK_STATUS.OUT}>{STOCK_STATUS.OUT}</MenuItem>
        </TextField>
        <Button onClick={() => setF({ search: '', categoryId: '', stockStatus: '' })}>Clear Filters</Button>
      </Paper>
      <ReportBar
        count={data.length}
        onExport={() => { downloadCsv(`low-stock-report-${stamp()}.csv`, csvColumns, data); notify(`Exported ${data.length} record(s).`); }}
      />
      <SortableTable columns={columns} rows={data} defaultSort={{ id: 'shortfall', dir: 'desc' }} ariaLabel="Low stock report" emptyMessage="No active products are at or below their reorder level." />
    </>
  );
}

/* ------------------------------------------------------------------- page */
export default function Reports() {
  const [params, setParams] = useSearchParams();
  const current = TABS.find((t) => t.key === params.get('tab'))?.key || 'stock';

  return (
    <>
      <PageHeader subtitle="View inventory reports and export the filtered results to CSV." />
      <Tabs value={current} onChange={(_, v) => setParams({ tab: v })} sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }} aria-label="Report type">
        {TABS.map((t) => <Tab key={t.key} value={t.key} label={t.label} />)}
      </Tabs>
      {current === 'stock' && <CurrentStockReport />}
      {current === 'movement' && <MovementReport />}
      {current === 'low-stock' && <LowStockReport />}
    </>
  );
}
