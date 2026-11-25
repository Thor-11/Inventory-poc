import { TextField } from '@mui/material';

/** Auto-generated / calculated values the user can see but not edit. */
export default function ReadOnlyField({ label, value, helperText = ' ', ...rest }) {
  return (
    <TextField
      label={label} value={value} fullWidth helperText={helperText}
      InputProps={{ readOnly: true }} InputLabelProps={{ shrink: true }}
      sx={{ '& .MuiInputBase-root': { bgcolor: 'action.hover' } }}
      {...rest}
    />
  );
}
