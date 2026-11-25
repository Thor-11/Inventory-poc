import { useEffect, useMemo, useState } from 'react';
import {
  Paper, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination,
  TableRow, TableSortLabel, Typography,
} from '@mui/material';
import { PAGE_SIZES } from '../constants';

function compare(a, b) {
  if (a == null && b == null) return 0;
  if (a == null) return 1;
  if (b == null) return -1;
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  return String(a).localeCompare(String(b), undefined, { numeric: true, sensitivity: 'base' });
}

/**
 * Reusable table with column sorting and pagination (5 / 10 / 20 rows).
 * columns: [{ id, label, align, sortable, sortValue(row), render(row), minWidth }]
 */
export default function SortableTable({
  columns, rows, rowKey = 'id', defaultSort, emptyMessage = 'No records found.',
  initialPageSize = 10, ariaLabel = 'data table', dense = false,
}) {
  const [sort, setSort] = useState(defaultSort || null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const sorted = useMemo(() => {
    const col = sort && columns.find((c) => c.id === sort.id);
    if (!col) return rows;
    const get = col.sortValue || ((r) => r[col.id]);
    const dir = sort.dir === 'asc' ? 1 : -1;
    return rows
      .map((row, index) => ({ row, index }))
      .sort((x, y) => compare(get(x.row), get(y.row)) * dir || x.index - y.index)
      .map((x) => x.row);
  }, [rows, sort, columns]);

  // Go back to page 1 when filters change the number of rows.
  useEffect(() => setPage(0), [rows.length]);

  const lastPage = Math.max(0, Math.ceil(sorted.length / pageSize) - 1);
  const safePage = Math.min(page, lastPage);
  const visible = sorted.slice(safePage * pageSize, safePage * pageSize + pageSize);

  const toggleSort = (id) =>
    setSort((s) => (s && s.id === id ? { id, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { id, dir: 'asc' }));

  return (
    <Paper>
      <TableContainer sx={{ overflowX: 'auto' }}>
        <Table size={dense ? 'small' : 'medium'} aria-label={ariaLabel}>
          <TableHead>
            <TableRow>
              {columns.map((c) => (
                <TableCell
                  key={c.id}
                  align={c.align || 'left'}
                  sx={{ minWidth: c.minWidth }}
                  sortDirection={sort?.id === c.id ? sort.dir : false}
                >
                  {c.sortable === false ? (
                    c.label
                  ) : (
                    <TableSortLabel
                      active={sort?.id === c.id}
                      direction={sort?.id === c.id ? sort.dir : 'asc'}
                      onClick={() => toggleSort(c.id)}
                    >
                      {c.label}
                    </TableSortLabel>
                  )}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} align="center" sx={{ py: 5 }}>
                  <Typography color="text.secondary">{emptyMessage}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              visible.map((row) => (
                <TableRow hover key={row[rowKey]}>
                  {columns.map((c) => (
                    <TableCell key={c.id} align={c.align || 'left'}>
                      {c.render ? c.render(row) : row[c.id]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      <TablePagination
        component="div"
        count={sorted.length}
        page={safePage}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={pageSize}
        rowsPerPageOptions={PAGE_SIZES}
        onRowsPerPageChange={(e) => { setPageSize(Number(e.target.value)); setPage(0); }}
      />
    </Paper>
  );
}
