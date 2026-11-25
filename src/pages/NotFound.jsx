import { Link as RouterLink } from 'react-router-dom';
import { Alert, AlertTitle, Button } from '@mui/material';

export default function NotFound({ title = 'Page not found', message = 'The page you are looking for does not exist.', backTo = '/', backLabel = 'Go to Dashboard' }) {
  return (
    <Alert severity="warning" 
    action={<Button component={RouterLink} to={backTo} color="inherit" size="small"
    >
      {backLabel}
      </Button>}>
      <AlertTitle>{title}</AlertTitle>
      {message}
    </Alert>
  );
}
