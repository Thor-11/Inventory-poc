import { useMemo } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Box, Button, Card, CardContent, Divider, Grid, Paper, Typography } from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import { useInventory } from '../context/InventoryContext';
import { enrichTransactions, txnSeq } from '../utils/inventory';
import { formatCurrency, formatDateTime, signed } from '../utils/format';
import PageHeader from '../components/PageHeader';
import SortableTable from '../components/SortableTable';
import { ActiveChip, StockStatusChip, TxnTypeChip } from '../components/StatusChips';
import NotFound from './NotFound';

function Detail({ label, children }) {
  return (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography component="div">{children || '—'}</Typography>
    </Box>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const { rows, products, transactions } = useInventory();
  const product = rows.find((r) => r.id === id);

  const latest = useMemo(
    () =>
      enrichTransactions(transactions.filter((t) => t.productId === id), products)
        .sort((a, b) => txnSeq(b.id) - txnSeq(a.id))
        .slice(0, 10),
    [transactions, products, id],
  );

  if (!product) {
    return <NotFound title="Product not found" message="This product does not exist or may have been removed." backTo="/products" backLabel="Back to products" />;
  }

  const columns = [
    { id: 'id', label: 'Transaction ID' },
    { id: 'date', label: 'Date', render: (t) => formatDateTime(t.date), sortValue: (t) => txnSeq(t.id) },
    { id: 'type', label: 'Type', render: (t) => <TxnTypeChip type={t.type} /> },
    { id: 'quantityChange', label: 'Quantity Change', align: 'right', render: (t) => signed(t.quantityChange) },
    { id: 'balanceAfter', label: 'Balance After', align: 'right' },
    { id: 'reference', label: 'Reference', render: (t) => t.reference || '—' },
    { id: 'remarks', label: 'Remarks', render: (t) => t.remarks || '—', minWidth: 180 },
  ];

  return (
    <>
      <PageHeader
        subtitle={`${product.code} · ${product.name}`}
        actions={
          <>
            <Button variant="outlined" startIcon={<EditIcon />} component={RouterLink} to={`/products/${product.id}/edit`}>Edit</Button>
            <Button variant="outlined" component={RouterLink} to={`/stock-in?product=${product.id}`} disabled={product.status !== 'Active'}>Stock In</Button>
            <Button variant="outlined" component={RouterLink} to={`/stock-out?product=${product.id}`} disabled={product.status !== 'Active'}>Stock Out</Button>
          </>
        }
      />
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom>Product information</Typography>
            <Grid container columnSpacing={3}>
              <Grid item xs={6}><Detail label="Product Code">{product.code}</Detail></Grid>
              <Grid item xs={6}><Detail label="Product Name">{product.name}</Detail></Grid>
              <Grid item xs={6}><Detail label="Category">{product.categoryName}</Detail></Grid>
              <Grid item xs={6}><Detail label="Default Supplier">{product.supplierName}</Detail></Grid>
              <Grid item xs={6}><Detail label="Unit of Measure">{product.unit}</Detail></Grid>
              <Grid item xs={6}><Detail label="Unit Cost">{formatCurrency(product.unitCost)}</Detail></Grid>
              <Grid item xs={6}><Detail label="Opening Stock">{product.openingStock}</Detail></Grid>
              <Grid item xs={6}><Detail label="Reorder Level">{product.reorderLevel}</Detail></Grid>
              <Grid item xs={6}><Detail label="Status"><ActiveChip status={product.status} /></Detail></Grid>
              <Grid item xs={12}><Detail label="Description">{product.description}</Detail></Grid>
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>Stock</Typography>
              <Typography variant="h3" component="p" color="primary">{product.stock}</Typography>
              <Typography color="text.secondary" gutterBottom>{product.unit} available</Typography>
              <Divider sx={{ my: 2 }} />
              <Detail label="Stock Status"><StockStatusChip status={product.stockStatus} /></Detail>
              <Detail label="Inventory Value">{formatCurrency(product.inventoryValue)}</Detail>
              <Detail label="Shortfall vs reorder level">{product.shortfall}</Detail>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Typography variant="h6">Latest 10 transactions</Typography>
        <Button startIcon={<HistoryIcon />} component={RouterLink} to={`/transactions?product=${product.id}`}>View full history</Button>
      </Box>
      <SortableTable columns={columns} rows={latest} defaultSort={{ id: 'date', dir: 'desc' }} initialPageSize={10} ariaLabel="Latest transactions" />
    </>
  );
}
