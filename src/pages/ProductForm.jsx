import { useState } from 'react';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import { Alert, Box, Button, Grid, MenuItem, Paper, TextField } from '@mui/material';
import { ACTIVE, INACTIVE, LIMITS, UNITS } from '../constants';
import { useInventory } from '../context/InventoryContext';
import { useNotify } from '../context/NotifyContext';
import useSubmitLock from '../hooks/useSubmitLock';
import NotFound from './NotFound';

const EMPTY = {
  code: '', name: '', categoryId: '', supplierId: '', description: '', unit: '',
  unitCost: '', openingStock: '0', reorderLevel: '', status: ACTIVE,
};

/** Add (/products/new) and Edit (/products/:id/edit) share this form. */
export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { products, categories, suppliers, ops } = useInventory();
  const existing = isEdit ? products.find((p) => p.id === id) : null;

  if (isEdit && !existing) {
    return <NotFound title="Product not found" message="This product does not exist or may have been removed." backTo="/products" backLabel="Back to products" />;
  }
  return <Form key={id || 'new'} existing={existing} categories={categories} suppliers={suppliers} ops={ops} />;
}

function Form({ existing, categories, suppliers, ops }) {
  const navigate = useNavigate();
  const notify = useNotify();
  const { busy, run } = useSubmitLock();
  const isEdit = Boolean(existing);

  const [values, setValues] = useState(() =>
    existing
      ? { ...EMPTY, ...existing, unitCost: String(existing.unitCost), openingStock: String(existing.openingStock), reorderLevel: String(existing.reorderLevel) }
      : EMPTY,
  );
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState('');

  const change = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  // Active choices only, plus the product's current category/supplier so editing still works.
  const categoryOptions = categories.filter((c) => c.status === ACTIVE || c.id === existing?.categoryId);
  const supplierOptions = suppliers.filter((s) => s.status === ACTIVE || s.id === existing?.supplierId);

  const submit = (e) => {
    e.preventDefault();
    run(() => {
      const result = isEdit ? ops.updateProduct(existing.id, values) : ops.createProduct(values);
      if (!result.ok) {
        setErrors(result.errors || {});
        setFormError(result.message);
        return;
      }
      notify(isEdit ? 'Product updated.' : 'Product added.');
      navigate(`/products/${result.record.id}`);
    });
  };

  const field = (name) => ({
    value: values[name], onChange: change(name), error: Boolean(errors[name]), helperText: errors[name] || ' ',
  });

  return (
    <Paper sx={{ p: { xs: 2, sm: 3 }, maxWidth: 900 }}>
      <Box component="form" onSubmit={submit} noValidate>
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError('')}>{formError}</Alert>
        )}
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Product Code" required fullWidth {...field('code')} disabled={isEdit}
              inputProps={{ maxLength: LIMITS.productCode }}
              helperText={isEdit ? 'Cannot be changed after creation' : errors.code || ' '}
            />
          </Grid>
          <Grid item xs={12} sm={8}>
            <TextField label="Product Name" required fullWidth {...field('name')} inputProps={{ maxLength: LIMITS.productNameMax }} />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Category" required fullWidth {...field('categoryId')}>
              {categoryOptions.map((c) => <MenuItem key={c.id} value={c.id}>{c.name}{c.status !== ACTIVE ? ' (inactive)' : ''}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField select label="Supplier" required fullWidth {...field('supplierId')}>
              {supplierOptions.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}{s.status !== ACTIVE ? ' (inactive)' : ''}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Description" fullWidth multiline minRows={2} {...field('description')}
              inputProps={{ maxLength: LIMITS.description }}
              helperText={errors.description || `${values.description.length}/${LIMITS.description}`}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Unit of Measure" required fullWidth {...field('unit')}>
              {UNITS.map((u) => <MenuItem key={u} value={u}>{u}</MenuItem>)}
            </TextField>
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField label="Unit Cost (₹)" required fullWidth type="number" inputProps={{ min: 0, step: '0.01' }} {...field('unitCost')} />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Reorder Level" required fullWidth type="number" inputProps={{ min: 0, step: 1 }} {...field('reorderLevel')}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Opening Stock" required={!isEdit} fullWidth type="number" inputProps={{ min: 0, step: 1 }}
              {...field('openingStock')} disabled={isEdit}
              helperText={isEdit ? 'Fixed at creation. Use Stock In / Out / Adjustment.' : errors.openingStock || ' '}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField select label="Status" required fullWidth {...field('status')}>
              <MenuItem value={ACTIVE}>Active</MenuItem>
              <MenuItem value={INACTIVE}>Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 1 }}>
          <Button component={RouterLink} to={isEdit ? `/products/${existing.id}` : '/products'}>Cancel</Button>
          <Button type="submit" variant="contained" disabled={busy}>{isEdit ? 'Save Changes' : 'Add Product'}</Button>
        </Box>
      </Box>
    </Paper>
  );
}
