import { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Alert, Box, Button, Grid, MenuItem, Paper, TextField } from '@mui/material';
import { ACTIVE, LIMITS } from '../constants';
import { useInventory } from '../context/InventoryContext';
import { useNotify } from '../context/NotifyContext';
import useSubmitLock from '../hooks/useSubmitLock';
import { nextTxnId } from '../utils/inventory';
import { formatDateTime } from '../utils/format';
import PageHeader from '../components/PageHeader';
import ProductPicker from '../components/ProductPicker';
import ReadOnlyField from '../components/ReadOnlyField';

const EMPTY = { productId: '', supplierId: '', quantity: '', unitCost: '', referenceNumber: '', remarks: '' };

export default function StockIn() {
  const { rows, suppliers, transactions, ops } = useInventory();
  const notify = useNotify();
  const { busy, run } = useSubmitLock();
  const [params] = useSearchParams();

  const activeProducts = useMemo(() => rows.filter((r) => r.status === ACTIVE), [rows]);
  const activeSuppliers = useMemo(() => suppliers.filter((s) => s.status === ACTIVE), [suppliers]);

  // Suggest the product's default supplier and cost (the user can change both).
  const defaultsFor = (productId) => {
    const p = activeProducts.find((r) => r.id === productId);
    if (!p) return { productId: '', supplierId: '', unitCost: '' };
    const supplierOk = activeSuppliers.some((s) => s.id === p.supplierId);
    return { productId: p.id, supplierId: supplierOk ? p.supplierId : '', unitCost: String(p.unitCost) };
  };

  const [values, setValues] = useState(() => ({ ...EMPTY, ...defaultsFor(params.get('product')) }));
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const selected = activeProducts.find((r) => r.id === values.productId);
  const change = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };
  const pickProduct = (id) => {
    setValues((v) => ({ ...v, ...defaultsFor(id) }));
    setErrors((er) => ({ ...er, productId: undefined }));
  };

  const submit = (e) => {
    e.preventDefault();
    run(() => {
      const result = ops.stockIn(values);
      if (!result.ok) {
        setErrors(result.errors || {});
        setFormError(result.message);
        return;
      }
      setFormError('');
      setErrors({});
      setValues(EMPTY);
      notify(`Received ${result.record.quantityChange} unit(s). New balance: ${result.record.balanceAfter}. (${result.record.id})`);
    });
  };

  return (
    <>
      <PageHeader subtitle="Record inventory received from a supplier. Stock increases by the quantity received." />
      <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900 }}>
        <Box component="form" onSubmit={submit} noValidate>
          {formError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>{formError}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <ReadOnlyField label="Transaction Reference" value={nextTxnId(transactions)} helperText="Auto-generated" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ReadOnlyField label="Transaction Date" value={formatDateTime(new Date())} helperText="Set automatically when saved" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <ProductPicker
                value={values.productId} onChange={pickProduct} options={activeProducts}
                error={errors.productId}
                helperText={errors.productId || (selected ? `Current stock: ${selected.stock} ${selected.unit}` : 'Active products only')}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Supplier" required fullWidth value={values.supplierId} onChange={change('supplierId')} error={Boolean(errors.supplierId)} helperText={errors.supplierId || 'Active suppliers only'}>
                {activeSuppliers.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Quantity Received" required fullWidth type="number" inputProps={{ min: 1, step: 1 }} value={values.quantity} onChange={change('quantity')} error={Boolean(errors.quantity)} helperText={errors.quantity || ' '} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Unit Cost (₹)" required fullWidth type="number" inputProps={{ min: 0, step: '0.01' }} value={values.unitCost} onChange={change('unitCost')} error={Boolean(errors.unitCost)} helperText={errors.unitCost || 'Recorded on the receipt; the product master cost is unchanged'} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Reference Number" fullWidth value={values.referenceNumber} onChange={change('referenceNumber')} inputProps={{ maxLength: LIMITS.referenceNumber }} error={Boolean(errors.referenceNumber)} helperText={errors.referenceNumber || 'Optional (e.g. PO or invoice number)'} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Remarks" fullWidth value={values.remarks} onChange={change('remarks')} inputProps={{ maxLength: LIMITS.remarks }} error={Boolean(errors.remarks)} helperText={errors.remarks || 'Optional'} />
            </Grid>
          </Grid>
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
            <Button onClick={() => { setValues(EMPTY); setErrors({}); setFormError(''); }}>Reset</Button>
            <Button type="submit" variant="contained" disabled={busy}>Save Stock In</Button>
          </Box>
        </Box>
      </Paper>
    </>
  );
}
