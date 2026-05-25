import { create } from 'zustand';
import { aiGatewayHealth } from '../services/api/aiGateway';

// Reachability state for the AI Gateway *and* the MCP tool host. Driven by
// the gateway's `chat/health` JSON-RPC method (Phase 8): a single cheap
// probe reports both surfaces so the mobile UI can distinguish three
// states — fully online, AI Gateway offline, or AI Gateway online but MCP
// offline ("limited mode"). The chat banner and boot toast both read this
// store; nothing else needs to know whether tools are usable.

export type ReachabilityStatus = 'unknown' | 'online' | 'offline';

interface AiAvailabilityStore {
  aiGateway: ReachabilityStatus;
  mcp: ReachabilityStatus;
  lastCheckedAt: number | null;
  isChecking: boolean;
  check: () => Promise<void>;
}

export const useAiAvailabilityStore = create<AiAvailabilityStore>((set, get) => ({
  aiGateway: 'unknown',
  mcp: 'unknown',
  lastCheckedAt: null,
  isChecking: false,

  check: async () => {
    if (get().isChecking) return;
    set({ isChecking: true });
    try {
      const result = await aiGatewayHealth();
      set({
        aiGateway: 'online',
        mcp: result.mcp === 'ok' ? 'online' : 'offline',
        lastCheckedAt: Date.now(),
        isChecking: false,
      });
    } catch {
      // Couldn't reach the gateway at all — MCP state is unknown from here.
      set({
        aiGateway: 'offline',
        mcp: 'unknown',
        lastCheckedAt: Date.now(),
        isChecking: false,
      });
    }
  },
}));
