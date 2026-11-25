import { STORAGE_KEYS } from '../constants';
import { buildSeedData } from '../data/seedData';
import { validateCollection, validateRelationships } from './dataIntegrity';

const NAMES = Object.keys(STORAGE_KEYS);
const ls = () => window.localStorage;

const emptyData = () => ({ products: [], categories: [], suppliers: [], transactions: [], settings: {} });

/** Reads one key. Never throws: reports 'missing', 'corrupt', 'error' or 'ok'. */
export function readKey(key) {
  let raw;
  try {
    raw = ls().getItem(key);
  } catch (error) {
    return { status: 'error', error };
  }
  if (raw === null) return { status: 'missing' };
  try {
    return { status: 'ok', value: JSON.parse(raw), raw };
  } catch (error) {
    return { status: 'corrupt', raw, error };
  }
}

/** Writes one key. Throws if storage is full or unavailable; callers must handle that. */
export function writeKey(key, value) {
  ls().setItem(key, JSON.stringify(value));
}

function freezeTransactions(list) {
  list.forEach((t) => Object.freeze(t));
  return list;
}

/**
 * Loads all inventory data.
 *  - First run (nothing stored at all): writes the sample data once.
 *  - Later runs: reads what is stored and NEVER overwrites it (BR-016).
 *  - Missing/corrupt/inconsistent data: reported in `problems` and left untouched on disk,
 *    so the user can decide what to do (FR-015).
 */
export function loadInventory(now = new Date(), { seedIfFirstRun = true } = {}) {
  const reads = Object.fromEntries(NAMES.map((n) => [n, readKey(STORAGE_KEYS[n])]));

  if (NAMES.some((n) => reads[n].status === 'error')) {
    return {
      data: emptyData(),
      problems: [{ name: 'storage', key: 'localStorage', reason: 'Browser storage is not available (it may be disabled or blocked).' }],
    };
  }

  if (NAMES.every((n) => reads[n].status === 'missing')) {
    if (!seedIfFirstRun) {
      return {
        data: emptyData(),
        problems: [{ name: 'all', key: 'all', reason: 'All inventory data has been removed from browser storage.' }],
      };
    }
    const seed = buildSeedData(now);
    const written = [];
    try {
      // Settings go last: its presence marks a completed first-run initialisation.
      for (const name of ['products', 'categories', 'suppliers', 'transactions', 'settings']) {
        writeKey(STORAGE_KEYS[name], seed[name]);
        written.push(name);
      }
    } catch (error) {
      written.forEach((n) => {
        try { ls().removeItem(STORAGE_KEYS[n]); } catch { /* nothing more we can do */ }
      });
      return {
        data: emptyData(),
        problems: [{ name: 'storage', key: 'localStorage', reason: 'Sample data could not be saved to browser storage.' }],
      };
    }
    freezeTransactions(seed.transactions);
    return { data: seed, problems: [] };
  }

  const data = emptyData();
  const problems = [];
  for (const name of NAMES) {
    const r = reads[name];
    if (r.status === 'missing') {
      problems.push({ name, key: STORAGE_KEYS[name], reason: 'This data is missing although other inventory data exists.' });
    } else if (r.status === 'corrupt') {
      problems.push({ name, key: STORAGE_KEYS[name], reason: 'Stored data is not valid JSON.' });
    } else {
      const message = validateCollection(name, r.value);
      if (message) problems.push({ name, key: STORAGE_KEYS[name], reason: message });
      else data[name] = r.value;
    }
  }
  if (problems.length === 0) {
    for (const p of validateRelationships(data)) {
      problems.push({ ...p, key: STORAGE_KEYS[p.name] });
    }
  }
  if (problems.length) return { data: emptyData(), problems };
  freezeTransactions(data.transactions);
  return { data, problems };
}

/**
 * User-initiated recovery. Copies whatever is currently stored into one backup key first;
 * if that backup cannot be written, nothing is deleted. Then reloads sample data.
 */
export function resetInventory(now = new Date()) {
  const backup = {};
  for (const name of NAMES) {
    try {
      const raw = ls().getItem(STORAGE_KEYS[name]);
      if (raw !== null) backup[STORAGE_KEYS[name]] = raw;
    } catch { /* ignore unreadable keys */ }
  }
  if (Object.keys(backup).length) {
    try {
      ls().setItem(`inventory_backup_${now.getTime()}`, JSON.stringify(backup));
    } catch {
      return { ok: false, message: 'A backup of the existing data could not be created, so nothing was deleted.' };
    }
  }
  try {
    NAMES.forEach((n) => ls().removeItem(STORAGE_KEYS[n]));
  } catch {
    return { ok: false, message: 'Browser storage could not be cleared.' };
  }
  return { ok: true, result: loadInventory(now) };
}
