import { useState } from 'react';
import { Link as RouterLink, Outlet, useLocation } from 'react-router-dom';
import {
  AppBar, Box, Divider, Drawer, IconButton, List, ListItemButton, ListItemIcon,
  ListItemText, Toolbar, Typography, useMediaQuery,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import CategoryIcon from '@mui/icons-material/Category';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import OutboxIcon from '@mui/icons-material/Outbox';
import TuneIcon from '@mui/icons-material/Tune';
import HistoryIcon from '@mui/icons-material/History';
import AssessmentIcon from '@mui/icons-material/Assessment';
import WarehouseIcon from '@mui/icons-material/Warehouse';

const DRAWER_WIDTH = 248;

const NAV = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon />, end: true },
  { label: 'Products', path: '/products', icon: <Inventory2Icon /> },
  { label: 'Categories', path: '/categories', icon: <CategoryIcon /> },
  { label: 'Suppliers', path: '/suppliers', icon: <LocalShippingIcon /> },
  { label: 'Stock In', path: '/stock-in', icon: <MoveToInboxIcon /> },
  { label: 'Stock Out', path: '/stock-out', icon: <OutboxIcon /> },
  { label: 'Stock Adjustment', path: '/stock-adjustment', icon: <TuneIcon /> },
  { label: 'Transactions', path: '/transactions', icon: <HistoryIcon /> },
  { label: 'Reports', path: '/reports', icon: <AssessmentIcon /> },
];

function titleFor(pathname) {
  if (pathname === '/') return 'Dashboard';
  if (pathname === '/products/new') return 'Add Product';
  if (/^\/products\/[^/]+\/edit$/.test(pathname)) return 'Edit Product';
  if (/^\/products\/[^/]+$/.test(pathname)) return 'Product Details';
  return NAV.find((n) => !n.end && pathname.startsWith(n.path))?.label ?? 'Page not found';
}

export default function Layout() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  const isSelected = (item) => (item.end ? pathname === '/' : pathname.startsWith(item.path));

  const drawer = (
    <Box sx={{ height: '100%' }}>
      <Toolbar sx={{ gap: 1 }}>
        <WarehouseIcon color="primary" />
        <Typography variant="h6" color="primary" noWrap>Inventory</Typography>
      </Toolbar>
      <Divider />
      <List component="nav" aria-label="Main navigation" sx={{ px: 1, py: 1 }}>
        {NAV.map((item) => (
          <ListItemButton
            key={item.path}
            component={RouterLink}
            to={item.path}
            selected={isSelected(item)}
            onClick={() => setOpen(false)}
            sx={{ borderRadius: 2, mb: 0.5, '&.Mui-selected': { bgcolor: 'primary.main', color: 'primary.contrastText', '&:hover': { bgcolor: 'primary.dark' } }, '&.Mui-selected .MuiListItemIcon-root': { color: 'inherit' } }}
            aria-current={isSelected(item) ? 'page' : undefined}
          >
            <ListItemIcon sx={{ minWidth: 40 }}>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar
        position="fixed"
        color="inherit"
        sx={{ width: { md: `calc(100% - ${DRAWER_WIDTH}px)` }, ml: { md: `${DRAWER_WIDTH}px` }, borderBottom: '1px solid #e3e7f1', borderTop: 0, borderLeft: 0, borderRight: 0 }}
      >
        <Toolbar>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setOpen(true)} aria-label="Open navigation" sx={{ mr: 1 }}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" component="h1" noWrap sx={{ flexGrow: 1 }}>
            {titleFor(pathname)}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
            Inventory Management System · POC
          </Typography>
        </Toolbar>
      </AppBar>

      <Box component="aside" sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}>
        {isDesktop ? (
          <Drawer variant="permanent" open sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' } }}>
            {drawer}
          </Drawer>
        ) : (
          <Drawer
            variant="temporary"
            open={open}
            onClose={() => setOpen(false)}
            ModalProps={{ keepMounted: true }}
            sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
          >
            {drawer}
          </Drawer>
        )}
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, sm: 3 }, minWidth: 0 }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
}
