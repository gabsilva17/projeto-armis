import { useEffect } from 'react';
import { useRefresh } from '@/src/contexts/RefreshContext';

const MIN_REFRESH_DURATION_MS = 500;

type RefreshHandler = () => void | Promise<void>;

export function useTopbarRefresh(handler: RefreshHandler) {
  const { registerRefresh } = useRefresh();

  useEffect(() => {
    registerRefresh(async () => {
      const startedAt = Date.now();

      try {
        await Promise.resolve(handler());
      } finally {
        const elapsed = Date.now() - startedAt;
        if (elapsed < MIN_REFRESH_DURATION_MS) {
          await new Promise<void>((resolve) => {
            setTimeout(resolve, MIN_REFRESH_DURATION_MS - elapsed);
          });
        }
      }
    });

    return () => registerRefresh(null);
  }, [registerRefresh, handler]);
}
