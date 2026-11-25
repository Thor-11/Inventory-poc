import { useCallback, useRef, useState } from 'react';

/**
 * Prevents duplicate form submissions (double click / double Enter).
 * run(fn) ignores calls made while a previous submit is still "cooling down".
 */
export default function useSubmitLock(delay = 600) {
  const lock = useRef(false);
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    (fn) => {
      if (lock.current) return;
      lock.current = true;
      setBusy(true);
      try {
        fn();
      } finally {
        setTimeout(() => {
          lock.current = false;
          setBusy(false);
        }, delay);
      }
    },
    [delay],
  );
  return { busy, run };
}
