import { Box, Typography } from '@mui/material';

/** Sub-heading and action buttons shown under the app bar title. */
export default function PageHeader({ subtitle, actions }) {
  return (
    <Box sx={{ display: 'flex',
      flexWrap: 'wrap',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 2,
      mb: 2 
     }}>
      <Typography color="text.secondary" sx={{ maxWidth: 720 }}>{subtitle}</Typography>
      {actions && <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>{actions}</Box>}
    </Box>
  );
}
