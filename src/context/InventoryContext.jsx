import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { STORAGE_KEYS } from '../constants';
import { loadInventory, resetInventory, writeKey } from '../utils/storage';
import { buildInventoryRows } from '../utils/inventory';
import * as svc from '../services/inventoryService';

const InventoryContext = createContext(null);

const STORAGE_FAILURE =
  'Could not save to browser storage (it may be full or blocked). Your change was not applied.';

/**
 * Holds the inventory collections and exposes the operations. Every operation
 *   1. re-reads localStorage (so a second browser tab can never cause stale overwrites),
 *   2. runs the pure business-rule function,
 *   3. persists the result, rolling back on failure, and only then updates React state.
 */
export function InventoryProvider({ children }) {
  const [store, setStore] = useState(() => loadInventory());
  const storeRef = useRef(store);
  storeRef.current = store;

  // Keep this tab in sync when another tab changes inventory data.
  useEffect(() => {
    const keys = Object.values(STORAGE_KEYS);
    const onStorage = (e) => {
      if (e.key === null || keys.includes(e.key)) setStore(loadInventory(new Date(), { seedIfFirstRun: false }));
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const run = useCallback((operation) => {
    const fresh = loadInventory(new Date(), { seedIfFirstRun: false });
    if (fresh.problems.length) {
      setStore(fresh);
      return { ok: false, message: 'Stored inventory data is missing or invalid, so nothing was saved.' };
    }
    const result = operation(fresh.data, new Date());
    if (!result.ok) {
      setStore(fresh);
      return result;
    }

    const written = [];
    try {
      for (const [name, value] of Object.entries(result.patch)) {
        writeKey(STORAGE_KEYS[name], value);
        written.push(name);
      }
    } catch {
      // Roll back anything already written so the collections stay consistent with each other.
      written.forEach((name) => {
        try { writeKey(STORAGE_KEYS[name], fresh.data[name]); } catch { /* best effort */ }
      });
      setStore(fresh);
      return { ok: false, message: STORAGE_FAILURE };
    }
    setStore({ data: { ...fresh.data, ...result.patch }, problems: [] });
    return result;
  }, []);

  const ops = useMemo(
    () => ({
      createProduct: (input) => run((s, now) => svc.createProduct(s, input, now)),
      updateProduct: (id, input) => run((s) => svc.updateProduct(s, id, input)),
      setProductStatus: (id, status) => run((s) => svc.setProductStatus(s, id, status)),
      saveCategory: (input, id) => run((s) => svc.saveCategory(s, input, id)),
      setCategoryStatus: (id, status) => run((s) => svc.setCategoryStatus(s, id, status)),
      saveSupplier: (input, id) => run((s) => svc.saveSupplier(s, input, id)),
      setSupplierStatus: (id, status) => run((s) => svc.setSupplierStatus(s, id, status)),
      stockIn: (input) => run((s, now) => svc.stockIn(s, input, now)),
      stockOut: (input) => run((s, now) => svc.stockOut(s, input, now)),
      adjustStock: (input) => run((s, now) => svc.adjustStock(s, input, now)),
    }),
    [run],
  );

  const retryLoad = useCallback(() => setStore(loadInventory(new Date(), { seedIfFirstRun: false })), []);
  const resetData = useCallback(() => {
    const outcome = resetInventory();
    if (outcome.ok) setStore(outcome.result);
    return outcome;
  }, []);

  const { data, problems } = store;
  const rows = useMemo(() => buildInventoryRows(data), [data]);

  const value = useMemo(
    () => ({ ...data, rows, problems, ops, retryLoad, resetData }),
    [data, rows, problems, ops, retryLoad, resetData],
  );
  return <InventoryContext.Provider value={value}>{children}</InventoryContext.Provider>;
}

export function useInventory() {
  const ctx = useContext(InventoryContext);
  if (!ctx) throw new Error('useInventory must be used inside InventoryProvider');
  return ctx;
}
