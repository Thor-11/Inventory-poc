import { Button,
   Dialog,
    DialogActions,
    DialogContent,
    DialogContentText, 
    DialogTitle } from '@mui/material';

export default function ConfirmDialog({
  open,
   title,
   message,
   confirmLabel = 'Confirm',
   color = 'primary',
   onConfirm,
   onCancel,
   }) {
  return (
    <Dialog open={open} onClose={onCancel} maxWidth="xs" fullWidth>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onCancel}>Cancel</Button>
        <Button variant="contained" color={color} onClick={onConfirm} autoFocus>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
