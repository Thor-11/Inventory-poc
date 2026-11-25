import { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Button, Card, CardContent, Grid, Paper, Typography } from '@mui/material';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import StackedBarChartIcon from '@mui/icons-material/StackedBarChart';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import RemoveShoppingCartIcon from '@mui/icons-material/RemoveShoppingCart';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import TodayIcon from '@mui/icons-material/Today';
import { useInventory } from '../context/InventoryContext';
import { getDashboardStats, getReplenishmentList, stockByCategory } from '../utils/inventory';
import { formatCurrency, formatNumber } from '../utils/format';
import SortableTable from '../components/SortableTable';
import { StockStatusChip } from '../components/StatusChips';

function StatCard({ title, value, caption, icon, color }) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <Box sx={{ bgcolor: `${color}.light`, color: `${color}.dark`, p: 1.5, borderRadius: 2, display: 'flex', opacity: 0.9 }}>{icon}</Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="body2" color="text.secondary">{title}</Typography>
          <Typography variant="h5" component="p" noWrap>{value}</Typography>
          {caption && <Typography variant="caption" color="text.secondary">{caption}</Typography>}
        </Box>
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { rows, transactions } = useInventory();
  const stats = useMemo(() => getDashboardStats(rows, transactions), [rows, transactions]);
  const chartData = useMemo(() => stockByCategory(rows), [rows]);
  const replenish = useMemo(() => getReplenishmentList(rows), [rows]);

  const columns = [
    { id: 'code', label: 'Code' },
    { id: 'name', label: 'Product', minWidth: 200 },
    { id: 'stock', label: 'Available', align: 'right' },
    { id: 'reorderLevel', label: 'Reorder Level', align: 'right' },
    { id: 'shortfall', label: 'Shortfall', align: 'right' },
    { id: 'stockStatus', label: 'Status', render: (r) => <StockStatusChip status={r.stockStatus} /> },
    {
      id: 'actions', label: 'Action', sortable: false,
      render: (r) => (
        <Button size="small"
         component={RouterLink} to={`/stock-in?product=${r.id}`}
         >
          Receive stock
          </Button>
      ),
    },
  ];

  return (
    <>
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard title="Total Products" value={formatNumber(stats.totalProducts)} caption="Active products" icon={<Inventory2Icon />} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard title="Total Stock Units" value={formatNumber(stats.totalUnits)} caption="Available quantity" icon={<StackedBarChartIcon />} color="info" />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard title="Low Stock Products" value={formatNumber(stats.lowStock)} caption="At or below reorder level" icon={<WarningAmberIcon />} color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard title="Out of Stock" value={formatNumber(stats.outOfStock)} caption="Zero quantity" icon={<RemoveShoppingCartIcon />} color="error" />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard title="Inventory Value" 
          value={formatCurrency(stats.inventoryValue)}
           caption="Available qty × unit cost" 
           icon={<CurrencyRupeeIcon />}
           color="success" />
        </Grid>
        <Grid item xs={12} sm={6} lg={4}>
          <StatCard
            title="Today's Transactions"
            value={formatNumber(stats.today.total)}
            caption={`Receipts ${stats.today.receipts} · Issues ${stats.today.issues} · Adjustments ${stats.today.adjustments}`}
            icon={<TodayIcon />}
            color="secondary"
          />
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="h6" gutterBottom>Stock by category</Typography>
        <Box sx={{ width: '100%', height: 300 }} role="img" aria-label="Bar chart of available stock units per category">
          <ResponsiveContainer>
            <BarChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="name" interval={0} tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} />
              <Tooltip formatter={(v) => [formatNumber(v), 'Units']} />
              <Bar dataKey="units" name="Units" fill="#3949ab" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Box>
      </Paper>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
        <Typography variant="h6">Products requiring replenishment</Typography>
        <Button component={RouterLink} to="/reports?tab=low-stock" size="small">Open low stock report</Button>
      </Box>
      <SortableTable
        columns={columns}
        rows={replenish}
        defaultSort={{ id: 'shortfall', dir: 'desc' }}
        initialPageSize={5}
        emptyMessage="All active products are above their reorder level."
        ariaLabel="Products requiring replenishment"
      />
    </>
  );
}
