import { create } from 'zustand';
import { AI_GATEWAY_CONFIG } from '../constants/llm.constants';

// Reachability ping for the AI Gateway. Phase 7 swap: the gateway no longer
// exposes tools/list (that moved to the MCP server on port 3003), so we ping
// GET /health instead — a method that still lives on the gateway. Phase 8
// rebuilds this around a richer chat/health JSON-RPC method that reports
// MCP reachability separately (online/limited/offline).

const PING_TIMEOUT_MS = 3_000;
const HEALTH_URL = `${AI_GATEWAY_CONFIG.baseUrl}/health`;

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
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), PING_TIMEOUT_MS);
    try {
      const response = await fetch(HEALTH_URL, { signal: controller.signal });
      const ok = response.ok;
      set({ isOnline: ok, lastCheckedAt: Date.now(), isChecking: false });
      return ok;
    } catch {
      set({ isOnline: false, lastCheckedAt: Date.now(), isChecking: false });
      return false;
    } finally {
      clearTimeout(timeoutId);
    }
  },
}));
