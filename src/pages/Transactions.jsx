import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, IconButton, Tooltip, Typography } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import { useInventory } from '../context/InventoryContext';
import { useNotify } from '../context/NotifyContext';
import { enrichTransactions, filterTransactions, txnSeq } from '../utils/inventory';
import { formatDateTime, signed } from '../utils/format';
import PageHeader from '../components/PageHeader';
import SortableTable from '../components/SortableTable';
import TransactionFilters, { NO_TXN_FILTERS } from '../components/TransactionFilters';
import { TxnTypeChip } from '../components/StatusChips';

export default function Transactions() {
  const { products, transactions } = useInventory();
  const notify = useNotify();
  const [params] = useSearchParams();
  const [filters, setFilters] = useState(() => ({ ...NO_TXN_FILTERS, productId: params.get('product') || '' }));

  const rows = useMemo(
    () => filterTransactions(enrichTransactions(transactions, products), filters),
    [transactions, products, filters],
  );

  const blocked = () =>
    notify('Saved transactions cannot be edited or deleted. Record an adjustment to correct stock.', 'warning');

  const columns = [
    { id: 'id', label: 'Transaction ID', sortValue: (t) => txnSeq(t.id) },
    { id: 'date', label: 'Date', render: (t) => formatDateTime(t.date), sortValue: (t) => txnSeq(t.id), minWidth: 150 },
    {
      id: 'product', label: 'Product', minWidth: 220, sortValue: (t) => `${t.productCode} ${t.productName}`,
      render: (t) => (<><strong>{t.productCode}</strong> — {t.productName}</>),
    },
    { id: 'type', label: 'Type', render: (t) => <TxnTypeChip type={t.type} /> },
    {
      id: 'quantityChange', label: 'Quantity Change', align: 'right',
      render: (t) => (
        <Typography component="span" fontWeight={600} color={t.quantityChange > 0 ? 'success.main' : t.quantityChange < 0 ? 'error.main' : 'text.primary'}>
          {signed(t.quantityChange)}
        </Typography>
      ),
    },
    { id: 'balanceAfter', label: 'Balance After', align: 'right' },
    { id: 'reference', label: 'Reference', render: (t) => t.reference || '—', minWidth: 150 },
    { id: 'remarks', label: 'Remarks', render: (t) => t.remarks || '—', minWidth: 200 },
    {
      id: 'locked', label: '', sortable: false,
      render: () => (
        <Tooltip title="Immutable — cannot be edited or deleted">
          <IconButton size="small" onClick={blocked} aria-label="Transaction is locked; editing or deleting is not allowed">
            <LockIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <>
      <PageHeader subtitle="Chronological history of every inventory movement." />
      <Alert severity="info" sx={{ mb: 2 }}>
        Saved transactions are immutable and cannot be edited or deleted. To correct a mistake, record a Stock Adjustment.
      </Alert>
      <TransactionFilters filters={filters} onChange={setFilters} products={products} />
      <SortableTable
        columns={columns} rows={rows} defaultSort={{ id: 'date', dir: 'desc' }}
        emptyMessage="No transactions match the current filters." ariaLabel="Transaction history"
      />
    </>
  );
}
