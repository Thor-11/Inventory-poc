import { useState } from 'react';
import { Alert, AlertTitle, Box, Button, Container, List, ListItem, ListItemText, Paper, Typography } from '@mui/material';
import { useInventory } from '../context/InventoryContext';
import ConfirmDialog from './ConfirmDialog';
import { useNotify } from '../context/NotifyContext';

/**
 * Shown instead of the app when stored data is missing, corrupt or inconsistent (FR-015).
 * Nothing is overwritten automatically: the user chooses to retry, or to reset with a backup.
 */
export default function RecoveryScreen() {
  const { problems, retryLoad, resetData } = useInventory();
  const notify = useNotify();
  const [confirm, setConfirm] = useState(false);

  const reset = () => {
    setConfirm(false);
    const outcome = resetData();
    if (!outcome.ok) notify(outcome.message, 'error');
    else notify('Sample data restored. The previous data was backed up in browser storage.', 'success');
  };

  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Paper sx={{ p: 4 }}>
        <Alert severity="error" sx={{ mb: 3 }}>
          <AlertTitle>Inventory data could not be loaded</AlertTitle>
          The app has stopped so that your saved records are not overwritten.
        </Alert>
        <Typography variant="subtitle2" gutterBottom>What was found</Typography>
        <List dense>
          {problems.map((p, i) => (
            <ListItem key={`${p.key}-${i}`} disableGutters>
              <ListItemText primary={p.key} secondary={p.reason} />
            </ListItem>
          ))}
        </List>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          You can try again (for example after fixing browser settings), or reset to the sample data.
          A copy of whatever is currently stored is saved first under a key starting with
          &quot;inventory_backup_&quot;.
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" onClick={retryLoad}>Try again</Button>
          <Button variant="contained" color="error" onClick={() => setConfirm(true)}>Back up and reset</Button>
        </Box>
      </Paper>
      <ConfirmDialog
        open={confirm}
        title="Reset inventory data?"
        message="Current stored inventory data will be backed up, then replaced with the sample data."
        confirmLabel="Back up and reset"
        color="error"
        onConfirm={reset}
        onCancel={() => setConfirm(false)}
      />
    </Container>
  );
}
