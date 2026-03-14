import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const REFRESH_TIMEOUT_MS = 8000;

interface RefreshContextValue {
  refreshing: boolean;
  triggerRefresh: () => void;
  registerRefresh: (fn: (() => Promise<void>) | null) => void;
}

const RefreshContext = createContext<RefreshContextValue>({
  refreshing: false,
  triggerRefresh: () => {},
  registerRefresh: () => {},
});

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const handlerRef = useRef<(() => Promise<void>) | null>(null);
  const refreshingRef = useRef(false);

  const registerRefresh = useCallback((fn: (() => Promise<void>) | null) => {
    handlerRef.current = fn;
  }, []);

  const triggerRefresh = useCallback(async () => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setRefreshing(true);
    try {
      const handler = handlerRef.current;
      if (handler) {
        await Promise.race([
          handler(),
          new Promise<void>((resolve) => {
            setTimeout(resolve, REFRESH_TIMEOUT_MS);
          }),
        ]);
      }
    } catch {
      // The refresh indicator must always end, even if a page handler fails.
    } finally {
      refreshingRef.current = false;
      setRefreshing(false);
    }
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshing, triggerRefresh, registerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  return useContext(RefreshContext);
}
