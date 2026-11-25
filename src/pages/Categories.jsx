import { useMemo, useState } from 'react';
import {
  Alert, Box, Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton,
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

const EMPTY = { code: '', name: '', description: '', status: ACTIVE };

export default function Categories() {
  const { categories, products, ops } = useInventory();
  const notify = useNotify();
  const { busy, run } = useSubmitLock();

  const [search, setSearch] = useState('');
  const [dialog, setDialog] = useState(null); // null | { editing: category | null }
  const [values, setValues] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [target, setTarget] = useState(null);

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categories
      .map((c) => ({ ...c, activeProducts: products.filter((p) => p.categoryId === c.id && p.status === ACTIVE).length }))
      .filter((c) => !q || c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q));
  }, [categories, products, search]);

  const openDialog = (category = null) => {
    setValues(category ? { ...category } : EMPTY);
    setErrors({});
    setDialog({ editing: category });
  };

  const change = (field) => (e) => {
    setValues((v) => ({ ...v, [field]: e.target.value }));
    setErrors((er) => ({ ...er, [field]: undefined }));
  };

  const save = (e) => {
    e.preventDefault();
    run(() => {
      const editing = dialog.editing;
      const result = ops.saveCategory(values, editing?.id);
      if (!result.ok) {
        setErrors(Object.keys(result.errors || {}).length ? result.errors : { form: result.message });
        return;
      }
      notify(editing ? 'Category updated.' : 'Category created.');
      setDialog(null);
    });
  };

  const confirmToggle = () => {
    const next = target.status === ACTIVE ? INACTIVE : ACTIVE;
    const result = ops.setCategoryStatus(target.id, next);
    if (result.ok) notify(`${target.name} is now ${next.toLowerCase()}.`);
    else notify(result.message, 'error');
    setTarget(null);
  };

  const columns = [
    { id: 'code', label: 'Category Code' },
    { id: 'name', label: 'Category Name', minWidth: 180 },
    { id: 'description', label: 'Description', minWidth: 220, render: (c) => c.description || '—' },
    { id: 'activeProducts', label: 'Active Products', align: 'right' },
    { id: 'status', label: 'Status', render: (c) => <ActiveChip status={c.status} /> },
    {
      id: 'actions', label: 'Actions', sortable: false,
      render: (c) => (
        <Box sx={{ whiteSpace: 'nowrap' }}>
          <Tooltip title="Edit"><IconButton size="small" onClick={() => openDialog(c)} aria-label={`Edit ${c.name}`}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title={c.status === ACTIVE ? 'Deactivate' : 'Activate'}>
            <IconButton size="small" onClick={() => setTarget(c)} aria-label={`${c.status === ACTIVE ? 'Deactivate' : 'Activate'} ${c.name}`}>
              {c.status === ACTIVE ? <BlockIcon fontSize="small" color="error" /> : <CheckCircleIcon fontSize="small" color="success" />}
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        subtitle="Maintain product categories. A category used by an active product cannot be deactivated."
        actions={<Button variant="contained" startIcon={<AddIcon />} onClick={() => openDialog()}>Add Category</Button>}
      />
      <TextField
        label="Search categories" size="small" value={search} onChange={(e) => setSearch(e.target.value)} sx={{ mb: 2, minWidth: 260 }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
      />
      <SortableTable columns={columns} rows={rows} defaultSort={{ id: 'code', dir: 'asc' }} ariaLabel="Categories" emptyMessage="No categories found." />

      <Dialog open={Boolean(dialog)} onClose={() => setDialog(null)} fullWidth maxWidth="sm">
        <Box component="form" onSubmit={save} noValidate>
          <DialogTitle>{dialog?.editing ? 'Edit Category' : 'Add Category'}</DialogTitle>
          <DialogContent sx={{ pt: 1 }}>
            {errors.form && <Alert severity="error" sx={{ mb: 2 }}>{errors.form}</Alert>}
            <TextField
              label="Category Code" required fullWidth margin="dense" value={values.code} onChange={change('code')}
              disabled={Boolean(dialog?.editing)} inputProps={{ maxLength: LIMITS.productCode }}
              error={Boolean(errors.code)} helperText={errors.code || (dialog?.editing ? 'Cannot be changed after creation' : ' ')}
            />
            <TextField
              label="Category Name" required fullWidth margin="dense" value={values.name} onChange={change('name')}
              inputProps={{ maxLength: LIMITS.categoryName }} error={Boolean(errors.name)} helperText={errors.name || ' '}
            />
            <TextField
              label="Description" fullWidth margin="dense" multiline minRows={2} value={values.description} onChange={change('description')}
              inputProps={{ maxLength: LIMITS.categoryDescription }} error={Boolean(errors.description)} helperText={errors.description || ' '}
            />
            <TextField select label="Status" fullWidth margin="dense" value={values.status} onChange={change('status')} error={Boolean(errors.status)} helperText={errors.status || ' '}>
              <MenuItem value={ACTIVE}>Active</MenuItem>
              <MenuItem value={INACTIVE}>Inactive</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialog(null)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={busy}>Save</Button>
          </DialogActions>
        </Box>
      </Dialog>

      <ConfirmDialog
        open={Boolean(target)}
        title={target?.status === ACTIVE ? 'Deactivate category?' : 'Activate category?'}
        message={target?.status === ACTIVE ? `"${target?.name}" will no longer be selectable for new products.` : `"${target?.name}" will become selectable again.`}
        confirmLabel={target?.status === ACTIVE ? 'Deactivate' : 'Activate'}
        color={target?.status === ACTIVE ? 'error' : 'primary'}
        onConfirm={confirmToggle}
        onCancel={() => setTarget(null)}
      />
    </>
  );
}
