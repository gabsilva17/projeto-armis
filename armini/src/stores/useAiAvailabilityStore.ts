import { create } from 'zustand';
import { mcpCall } from '../services/api/mcp';

const PING_TIMEOUT_MS = 3_000;

interface AiAvailabilityStore {
  isOnline: boolean | null;
  lastCheckedAt: number | null;
  isChecking: boolean;
  check: () => Promise<boolean>;
}

export const useAiAvailabilityStore = create<AiAvailabilityStore>((set, get) => ({
  isOnline: null,
  lastCheckedAt: null,
  isChecking: false,

  check: async () => {
    if (get().isChecking) return get().isOnline === true;
    set({ isChecking: true });
    try {
      await Promise.race([
        mcpCall('tools/list', {}),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('ai-ping-timeout')), PING_TIMEOUT_MS),
        ),
      ]);
      set({ isOnline: true, lastCheckedAt: Date.now(), isChecking: false });
      return true;
    } catch {
      set({ isOnline: false, lastCheckedAt: Date.now(), isChecking: false });
      return false;
    }
  },
}));
