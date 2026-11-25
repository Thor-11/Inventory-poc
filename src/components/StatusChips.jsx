import { Chip } from '@mui/material';
import { ACTIVE, STOCK_STATUS, TXN_TYPE_LABELS } from '../constants';

const STOCK_COLORS = {
  [STOCK_STATUS.IN]: 'success',
  [STOCK_STATUS.LOW]: 'warning',
  [STOCK_STATUS.OUT]: 'error',
};

export const StockStatusChip = ({ status }) => (
  <Chip size="small" 
  label={status} 
  color={STOCK_COLORS[status] || 'default'}
  variant="filled" />
);

export const ActiveChip = ({ status }) => (
  <Chip size="small"
   label={status}
   color={status === ACTIVE ? 'primary' : 'default'}
   variant="outlined" />
);

const TYPE_COLORS = { OPENING: 'default', STOCK_IN: 'success', STOCK_OUT: 'warning', ADJUSTMENT: 'info' };

export const TxnTypeChip = ({ type }) => (
  <Chip size="small" label={TXN_TYPE_LABELS[type] || type} color={TYPE_COLORS[type] || 'default'} variant="outlined" />
);
