import { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, IconButton, InputAdornment, MenuItem, Paper, TextField, Tooltip } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import { ACTIVE, INACTIVE, STOCK_STATUS } from '../constants';
import { useInventory } from '../context/InventoryContext';
import { useNotify } from '../context/NotifyContext';
import { formatCurrency } from '../utils/format';
import PageHeader from '../components/PageHeader';
import SortableTable from '../components/SortableTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { ActiveChip, StockStatusChip } from '../components/StatusChips';

const NO_FILTERS = { search: '', categoryId: '', stockStatus: '', status: '' };

export default function Products() {
  const { rows, categories, ops } = useInventory();
  const notify = useNotify();
  const [filters, setFilters] = useState(NO_FILTERS);
  const [target, setTarget] = useState(null); // product awaiting (de)activation confirmation

  const set = (field) => (e) => setFilters((f) => ({ ...f, [field]: e.target.value }));

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return rows.filter(
      (r) =>
        (!q || r.code.toLowerCase().includes(q) || r.name.toLowerCase().includes(q)) &&
        (!filters.categoryId || r.categoryId === filters.categoryId) &&
        (!filters.stockStatus || r.stockStatus === filters.stockStatus) &&
        (!filters.status || r.status === filters.status),
    );
  }, [rows, filters]);

  const hasFilters = Object.values(filters).some(Boolean);

  const confirmToggle = () => {
    const next = target.status === ACTIVE ? INACTIVE : ACTIVE;
    const result = ops.setProductStatus(target.id, next);
    if (result.ok) notify(`${target.name} is now ${next.toLowerCase()}.`);
    else notify(result.message, 'error');
    setTarget(null);
  };

  const columns = [
    { id: 'code', label: 'Product Code' },
    { id: 'name', label: 'Product Name', minWidth: 200 },
    { id: 'categoryName', label: 'Category', minWidth: 140 },
    { id: 'supplierName', label: 'Supplier', minWidth: 160 },
    { id: 'unit', label: 'Unit' },
    { id: 'unitCost', label: 'Unit Cost', align: 'right', render: (r) => formatCurrency(r.unitCost) },
    { id: 'stock', label: 'Available Stock', align: 'right' },
    { id: 'reorderLevel', label: 'Reorder Level', align: 'right' },
    { id: 'stockStatus', label: 'Stock Status', render: (r) => <StockStatusChip status={r.stockStatus} /> },
    { id: 'status', label: 'Status', render: (r) => <ActiveChip status={r.status} /> },
    {
      id: 'actions', label: 'Actions', sortable: false, minWidth: 130,
      render: (r) => (
        <Box sx={{ whiteSpace: 'nowrap' }}>
          <Tooltip title="View"><IconButton size="small" component={RouterLink} to={`/products/${r.id}`} aria-label={`View ${r.name}`}><VisibilityIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Edit"><IconButton size="small" component={RouterLink} to={`/products/${r.id}/edit`} aria-label={`Edit ${r.name}`}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={r.status === ACTIVE ? 'Deactivate' : 'Activate'}>
            <IconButton size="small" onClick={() => setTarget(r)} aria-label={`${r.status === ACTIVE ? 'Deactivate' : 'Activate'} ${r.name}`}>
              {r.status === ACTIVE ? <BlockIcon fontSize="small" color="error" /> : <CheckCircleIcon fontSize="small" color="success" />}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        subtitle="Search and manage products. Stock quantities change only through Stock In, Stock Out and Stock Adjustment."
        actions={<Button variant="contained" startIcon={<AddIcon />} component={RouterLink} to="/products/new">Add Product</Button>}
      />
      <Paper sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center' }}>
        <TextField
          label="Search by code or name" size="small" value={filters.search} onChange={set('search')} sx={{ minWidth: 240, flex: 1 }}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
        />
        <TextField select label="Category" size="small" value={filters.categoryId} onChange={set('categoryId')} sx={{ minWidth: 190 }}>
          <MenuItem value="">All categories</MenuItem>
          {categories.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
        </TextField>
        <TextField select label="Stock status" size="small" value={filters.stockStatus} onChange={set('stockStatus')} sx={{ minWidth: 160 }}>
          <MenuItem value="">All</MenuItem>
          {Object.values(STOCK_STATUS).map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
        </TextField>
        <TextField select label="Status" size="small" value={filters.status} onChange={set('status')} sx={{ minWidth: 130 }}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value={ACTIVE}>Active</MenuItem>
          <MenuItem value={INACTIVE}>Inactive</MenuItem>
        </TextField>
        <Button onClick={() => setFilters(NO_FILTERS)} disabled={!hasFilters}>Clear Filters</Button>
      </Paper>

      <SortableTable
        columns={columns}
        rows={filtered}
        defaultSort={{ id: 'code', dir: 'asc' }}
        emptyMessage="No products match the current filters."
        ariaLabel="Products"
      />

      <ConfirmDialog
        open={Boolean(target)}
        title={target?.status === ACTIVE ? 'Deactivate product?' : 'Activate product?'}
        message={
          target?.status === ACTIVE
            ? `"${target?.name}" will no longer be available for new stock transactions. Its transaction history is kept.`
            : `"${target?.name}" will become available for stock transactions again.`
        }
        confirmLabel={target?.status === ACTIVE ? 'Deactivate' : 'Activate'}
        color={target?.status === ACTIVE ? 'error' : 'primary'}
        onConfirm={confirmToggle}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
