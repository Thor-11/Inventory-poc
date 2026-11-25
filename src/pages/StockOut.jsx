import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Grid, MenuItem, Paper, TextField } from '@mui/material';
import { ACTIVE, DEPARTMENTS, LIMITS } from '../constants';
import { useInventory } from '../context/InventoryContext';
import { useNotify } from '../context/NotifyContext';
import useSubmitLock from '../hooks/useSubmitLock';
import { nextTxnId } from '../utils/inventory';
import { formatDateTime } from '../utils/format';
import PageHeader from '../components/PageHeader';
import ProductPicker from '../components/ProductPicker';
import ReadOnlyField from '../components/ReadOnlyField';

const EMPTY = { productId: '', quantity: '', issuedTo: '', department: '', purpose: '' };

export default function StockOut() {
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
  const change = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => {
      const result = ops.stockOut(values);
      if (!result.ok) {
        setErrors(result.errors || {});
        setFormError(result.message);
        return;
      }
      setFormError('');
      setErrors({});
      setValues(EMPTY);
      notify(`Issued ${-result.record.quantityChange} unit(s). New balance: ${result.record.balanceAfter}. (${result.record.id})`);
    });
  };

  return (
    <>
      <PageHeader subtitle="Record inventory issued to an employee or department. You cannot issue more than the available stock." />
      <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900 }}>
        <Box component="form" onSubmit={submit} noValidate>
          {formError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>{formError}</Alert>}
          {selected && selected.stock === 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>This product is out of stock, so nothing can be issued.</Alert>
          )}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <ReadOnlyField label="Transaction Reference" value={nextTxnId(transactions)} helperText="Auto-generated" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ReadOnlyField label="Transaction Date" value={formatDateTime(new Date())} helperText="Set automatically when saved" />
            </Grid>
            <Grid item xs={12} sm={7}>
              <ProductPicker
                value={values.productId}
                onChange={(id) => { setValues((v) => ({ ...v, productId: id })); setErrors((er) => ({ ...er, productId: undefined })); }}
                options={activeProducts} error={errors.productId}
                helperText={errors.productId || (selected ? `Available: ${selected.stock} ${selected.unit}` : 'Active products only')}
              />
            </Grid>
            <Grid item xs={12} sm={5}>
              <TextField label="Quantity Issued" required fullWidth type="number" inputProps={{ min: 1, step: 1 }} value={values.quantity} onChange={change('quantity')} error={Boolean(errors.quantity)} helperText={errors.quantity || ' '} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Issued To" required fullWidth value={values.issuedTo} onChange={change('issuedTo')} inputProps={{ maxLength: LIMITS.issuedTo }} error={Boolean(errors.issuedTo)} helperText={errors.issuedTo || 'Employee or team name'} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Department" required fullWidth value={values.department} onChange={change('department')} error={Boolean(errors.department)} helperText={errors.department || ' '}>
                {DEPARTMENTS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Purpose" required fullWidth multiline minRows={2} value={values.purpose} onChange={change('purpose')} inputProps={{ maxLength: LIMITS.remarks }} error={Boolean(errors.purpose)} helperText={errors.purpose || ' '} />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
            <Button onClick={() => { setValues(EMPTY); setErrors({}); setFormError(''); }}>Reset</Button>
            <Button type="submit" variant="contained" disabled={busy}>Save Stock Out</Button>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
