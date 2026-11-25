import { Button, MenuItem, Paper, TextField } from '@mui/material';
import { TXN_TYPE_LABELS } from '../constants';
import ProductPicker from './ProductPicker';

export const NO_TXN_FILTERS = { productId: '', type: '', from: '', to: '' };

/** Product / type / date-range filters shared by the history screen and the movement report. */
export default function TransactionFilters({ filters,
   onChange,
   products }) 
  {
  const set = (field) => (e) => onChange({ ...filters, [field]: e.target.value });
  const rangeInvalid = filters.from && filters.to && filters.from > filters.to;
  const active = Object.values(filters).some(Boolean);

  return (
    <Paper sx={{ p: 2, mb: 2, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'flex-start' }}>
      <div style={{ minWidth: 260, flex: 1 }}>
        <ProductPicker
          label="Product" required={false} options={products} value={filters.productId}
          onChange={(id) => onChange({ ...filters, productId: id })}
        />
      </div>
      <TextField select label="Type" value={filters.type} onChange={set('type')} sx={{ minWidth: 160 }}>
        <MenuItem value="">All types</MenuItem>
        {Object.entries(TXN_TYPE_LABELS).map(([k, v]) => <MenuItem key={k} value={k}>{v}</MenuItem>)}
      </TextField>
      <TextField
        label="From date" type="date" value={filters.from} onChange={set('from')} InputLabelProps={{ shrink: true }}
        error={Boolean(rangeInvalid)}
      />
      <TextField
        label="To date" type="date" value={filters.to} onChange={set('to')} InputLabelProps={{ shrink: true }}
        error={Boolean(rangeInvalid)} helperText={rangeInvalid ? '“To” must not be before “From”' : undefined}
      />
      <Button onClick={() => onChange(NO_TXN_FILTERS)} disabled={!active} sx={{ mt: 1 }}>Clear Filters</Button>
    </Paper>
  );
}
