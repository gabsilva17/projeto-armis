import { create } from 'zustand';

interface ChatLauncherState {
  chatOpenRequestId: number;
  pendingOrigin: { x: number; y: number } | null;
  requestOpenChat: (x?: number, y?: number) => void;
  consumeChatOpenRequest: () => void;
}

export const useChatLauncherStore = create<ChatLauncherState>((set) => ({
  chatOpenRequestId: 0,
  pendingOrigin: null,

  requestOpenChat: (x, y) =>
    set((state) => {
      const hasValidOrigin = Number.isFinite(x) && Number.isFinite(y);

      return {
        chatOpenRequestId: state.chatOpenRequestId + 1,
        pendingOrigin: hasValidOrigin ? { x: x as number, y: y as number } : null,
      };
    }),

  consumeChatOpenRequest: () => set({ pendingOrigin: null }),
}));
