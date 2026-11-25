import { createTheme } from '@mui/material/styles';

export default createTheme({
  palette: {
    primary: { main: '#3949ab' },
    secondary: { main: '#00897b' },
    background: { default: '#f4f6fb' },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Roboto","Segoe UI","Helvetica Neue",Arial,sans-serif',
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: 'none', fontWeight: 600 } } },
    MuiTableCell: { styleOverrides: { head: { fontWeight: 700, whiteSpace: 'nowrap', backgroundColor: '#eef1fb' } } },
    MuiPaper: { defaultProps: { elevation: 0 }, styleOverrides: { root: { border: '1px solid #e3e7f1' } } },
  },
});
