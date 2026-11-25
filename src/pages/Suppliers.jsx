import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, Grid, IconButton,
  InputAdornment, MenuItem, TextField, Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import { ACTIVE, INACTIVE, LIMITS } from '../constants';
import { useInventory } from '../context/InventoryContext';
import { useNotify } from '../context/NotifyContext';
import useSubmitLock from '../hooks/useSubmitLock';
import PageHeader from '../components/PageHeader';
import SortableTable from '../components/SortableTable';
import ConfirmDialog from '../components/ConfirmDialog';
import { ActiveChip } from '../components/StatusChips';

const EMPTY = { code: '', name: '', contactPerson: '', email: '', phone: '', status: ACTIVE };

export default function Suppliers() {
  const { suppliers, ops } = useInventory();
  const notify = useNotify();
  const { busy, run } = useSubmitLock();

  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null);
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [target, setTarget] = useState(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return suppliers.filter(
      (s) => !q || s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q) || (s.contactPerson || '').toLowerCase().includes(q),
    );
  }, [suppliers, search]);

  const openDialog = (supplier = null) => {
    setValues(supplier ? { ...EMPTY, ...supplier } : EMPTY);
    setErrors({});
    setDialog({ editing: supplier });
  };

  const change = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const save = (e) => {
    e.preventDefault();
    run(() => {
      const editing = dialog.editing;
      const result = ops.saveSupplier(values, editing?.id);
      if (!result.ok) {
        setErrors(Object.keys(result.errors || {}).length ? result.errors : { form: result.message });
        return;
      }
      notify(editing ? 'Supplier updated.' : 'Supplier created.');
      setDialog(null);
    });
  };

  const confirmToggle = () => {
    const next = target.status === ACTIVE ? INACTIVE : ACTIVE;
    const result = ops.setSupplierStatus(target.id, next);
    if (result.ok) notify(`${target.name} is now ${next.toLowerCase()}.`);
    else notify(result.message, 'error');
    setTarget(null);
  };

  const columns = [
    { id: 'code', label: 'Supplier Code' },
    { id: 'name', label: 'Supplier Name', minWidth: 180 },
    { id: 'contactPerson', label: 'Contact Person', render: (s) => s.contactPerson || '—' },
    { id: 'email', label: 'Email', render: (s) => s.email || '—', minWidth: 190 },
    { id: 'phone', label: 'Phone', render: (s) => s.phone || '—' },
    { id: 'status', label: 'Status', render: (s) => <ActiveChip status={s.status} /> },
    {
      id: 'actions', label: 'Actions', sortable: false,
      render: (s) => (
        <Box sx={{ whiteSpace: 'nowrap' }}>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openDialog(s)} aria-label={`Edit ${s.name}`}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={s.status === ACTIVE ? 'Deactivate' : 'Activate'}>
            <IconButton size="small" onClick={() => setTarget(s)} aria-label={`${s.status === ACTIVE ? 'Deactivate' : 'Activate'} ${s.name}`}>
              {s.status === ACTIVE ? <BlockIcon fontSize="small" color="error" /> : <CheckCircleIcon fontSize="small" color="success" />}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        subtitle="Maintain suppliers. Inactive suppliers cannot be selected for new products or new stock receipts."
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Add Supplier</Button>}
      />
      <TextField
        label="Search suppliers" size="small" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 2, minWidth: 260 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />
      <SortableTable columns={columns} rows={rows} defaultSort={{ id: 'code', dir: 'asc' }} ariaLabel="Suppliers" emptyMessage="No suppliers found." />

      <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={save} noValidate>
          <DialogTitle>{dialog?.editing ? 'Edit Supplier' : 'Add Supplier'}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {errors.form && <Alert severity="error" sx={{ mb: 2 }}>{errors.form}</Alert>}
            <Grid container columnSpacing={2}>
              <Grid item xs={12} sm={5}>
                <TextField
                  label="Supplier Code" required fullWidth margin="dense" value={values.code} onChange={change('code')}
                  disabled={Boolean(dialog?.editing)} inputProps={{ maxLength: LIMITS.productCode }}
                  error={Boolean(errors.code)} helperText={errors.code || (dialog?.editing ? 'Fixed after creation' : ' ')}
                />
              </Grid>
              <Grid item xs={12} sm={7}>
                <TextField label="Supplier Name" required fullWidth margin="dense" value={values.name} onChange={change('name')} inputProps={{ maxLength: LIMITS.supplierName }} error={Boolean(errors.name)} helperText={errors.name || ' '} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Contact Person" fullWidth margin="dense" value={values.contactPerson} onChange={change('contactPerson')} inputProps={{ maxLength: LIMITS.contactPerson }} error={Boolean(errors.contactPerson)} helperText={errors.contactPerson || ' '} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Status" select fullWidth margin="dense" value={values.status} onChange={change('status')} error={Boolean(errors.status)} helperText={errors.status || ' '}>
                  <MenuItem value={ACTIVE}>Active</MenuItem>
                  <MenuItem value={INACTIVE}>Inactive</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email" type="email" fullWidth margin="dense" value={values.email} onChange={change('email')} error={Boolean(errors.email)} helperText={errors.email || ' '} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Phone" fullWidth margin="dense" value={values.phone} onChange={change('phone')} error={Boolean(errors.phone)} helperText={errors.phone || ' '} />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busy}>Save</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(target)}
        title={target?.status === ACTIVE ? 'Deactivate supplier?' : 'Activate supplier?'}
        message={target?.status === ACTIVE ? `"${target?.name}" will no longer be selectable for new products or stock receipts. Existing records are not affected.` : `"${target?.name}" will become selectable again.`}
        confirmLabel={target?.status === ACTIVE ? 'Deactivate' : 'Activate'}
        color={target?.status === ACTIVE ? 'error' : 'primary'}
        onConfirm={confirmToggle}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
