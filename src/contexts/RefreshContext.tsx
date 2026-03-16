import { createContext, useCallback, useContext, useRef, useState } from 'react';
import type { ReactNode } from 'react';

const MIN_REFRESH_DURATION_MS = 500;

interface RefreshContextValue {
  refreshing: boolean;
  refreshKey: number;
  triggerRefresh: () => void;
}

const RefreshContext = createContext<RefreshContextValue>({
  refreshing: false,
  refreshKey: 0,
  triggerRefresh: () => {},
});

export function RefreshProvider({ children }: { children: ReactNode }) {
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const refreshingRef = useRef(false);

  const triggerRefresh = useCallback(async () => {
    if (refreshingRef.current) return;

    refreshingRef.current = true;
    setRefreshing(true);
    setRefreshKey((k) => k + 1);

    await new Promise<void>((resolve) => setTimeout(resolve, MIN_REFRESH_DURATION_MS));

    refreshingRef.current = false;
    setRefreshing(false);
  }, []);

  return (
    <RefreshContext.Provider value={{ refreshing, refreshKey, triggerRefresh }}>
      {children}
    </RefreshContext.Provider>
  );
}

export function useRefresh() {
  return useContext(RefreshContext);
}
