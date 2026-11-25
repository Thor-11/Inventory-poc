import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Chip, Grid, Paper, TextField } from '@mui/material';
import { ACTIVE, LIMITS } from '../constants';
import { useInventory } from '../context/InventoryContext';
import { useNotify } from '../context/NotifyContext';
import useSubmitLock from '../hooks/useSubmitLock';
import { nextTxnId } from '../utils/inventory';
import { formatDateTime, signed } from '../utils/format';
import PageHeader from '../components/PageHeader';
import ProductPicker from '../components/ProductPicker';
import ReadOnlyField from '../components/ReadOnlyField';

const EMPTY = { productId: '', actualStock: '', reason: '' };

export default function StockAdjustment() {
  const { rows, transactions, ops } = useInventory();
  const notify = useNotify();
  const { busy, run } = useSubmitLock();
  const [params] = useSearchParams();

  const activeProducts = useMemo(() => rows.filter((r) => r.status === ACTIVE), [rows]);
  const [values, setValues] = useState(() => {
    const id = params.get('product');
    return { ...EMPTY, productId: activeProducts.some((p) => p.id === id) ? id : '' };
  });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const selected = activeProducts.find((r) => r.id === values.productId);
  const actual = /^\d+$/.test(values.actualStock.trim()) ? Number(values.actualStock) : null;
  const difference = selected && actual !== null ? actual - selected.stock : null;

  const change = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => {
      const result = ops.adjustStock(values);
      if (!result.ok) {
        setErrors(result.errors || {});
        setFormError(result.message);
        return;
      }
      setFormError('');
      setErrors({});
      setValues(EMPTY);
      notify(`Adjustment ${signed(result.record.quantityChange)} recorded. New balance: ${result.record.balanceAfter}. (${result.record.id})`);
    });
  };

  return (
    <>
      <PageHeader subtitle="Correct the system quantity when it differs from the physical count. Enter the actual quantity; the difference is calculated for you." />
      <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900 }}>
        <Box component="form" onSubmit={submit} noValidate>
          {formError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>{formError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <ReadOnlyField label="Transaction Reference" value={nextTxnId(transactions)} helperText="Auto-generated" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ReadOnlyField label="Adjustment Date" value={formatDateTime(new Date())} helperText="Set automatically when saved" />
            </Grid>
            <Grid item xs={12}>
              <ProductPicker
                value={values.productId}
                onChange={(id) => { setValues((v) => ({ ...v, productId: id })); setErrors((er) => ({ ...er, productId: undefined })); }}
                options={activeProducts} error={errors.productId} helperText={errors.productId || 'Active products only'}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <ReadOnlyField label="Current Stock (system)" value={selected ? selected.stock : ''} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Actual Stock (physical count)" required fullWidth type="number" inputProps={{ min: 0, step: 1 }} value={values.actualStock} onChange={change('actualStock')} error={Boolean(errors.actualStock)} helperText={errors.actualStock || ' '} />
            </Grid>
            <Grid item xs={12} sm={4} sx={{ display: 'flex', alignItems: 'flex-start', pt: { sm: 2.5 } }}>
              {difference !== null && (
                <Chip
                  label={`Adjustment: ${signed(difference)}`}
                  color={difference === 0 ? 'default' : difference > 0 ? 'success' : 'warning'}
                  aria-live="polite"
                />
              )}
            </Grid>
            <Grid item xs={12}>
              <TextField label="Reason" required fullWidth multiline minRows={2} value={values.reason} onChange={change('reason')} inputProps={{ maxLength: LIMITS.remarks }} error={Boolean(errors.reason)} helperText={errors.reason || 'Why does the physical count differ?'} />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
            <Button onClick={() => { setValues(EMPTY); setErrors({}); setFormError(''); }}>Reset</Button>
            <Button type="submit" variant="contained" disabled={busy}>Save Adjustment</Button>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
