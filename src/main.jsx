import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CssBaseline, ThemeProvider } from '@mui/material';
import theme from './theme';
import App from './App';
import { NotifyProvider } from './context/NotifyContext';
import { InventoryProvider } from './context/InventoryContext';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <NotifyProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <InventoryProvider>
            <App />
          </InventoryProvider>
        </BrowserRouter>
      </NotifyProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
