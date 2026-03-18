import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  generateStartupSuggestions,
  generateStartupMessage,
  getStartupFallbackSuggestions,
  getStartupFallbackMessage,
  sendMessage as sendMessageService,
  sendMessageWithImage as sendMessageWithImageService,
} from '../services/chat/chatService';
import { buildStartupTimesheetContextInjection } from '../services/adapters/chatAdapter';
import { buildRecentTimesheetContext } from '../services/timesheets/timesheetsService';
import { useTimesheetsStore } from './useTimesheetsStore';
import type { Message, SuggestionChip } from '../types/chat.types';

interface ChatStore {
  messages: Message[];
  startupSuggestions: SuggestionChip[];
  isLoading: boolean;
  isBootstrapping: boolean;
  hasBootstrappedSession: boolean;
  error: string | null;
  ensureSessionBootstrap: () => Promise<void>;
  sendMessage: (content: string) => Promise<boolean>;
  sendMessageWithImage: (base64: string, uri: string, text: string) => Promise<boolean>;
  clearError: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      startupSuggestions: getStartupFallbackSuggestions(),
      isLoading: false,
      isBootstrapping: false,
      hasBootstrappedSession: false,
      error: null,

      ensureSessionBootstrap: async () => {
        const state = get();

        if (state.hasBootstrappedSession || state.isBootstrapping || state.messages.length > 0) {
          return;
        }

        set({ isBootstrapping: true, isLoading: true, error: null });

        try {
          await useTimesheetsStore.getState().load();
          const entries = useTimesheetsStore.getState().allEntries;
          const context = buildRecentTimesheetContext(entries, 15);
          const [startupMessage, startupSuggestions] = await Promise.all([
            generateStartupMessage(context),
            generateStartupSuggestions(context),
          ]);

          set((s) => ({
            messages: s.messages.length === 0 ? [startupMessage] : s.messages,
            startupSuggestions,
            isBootstrapping: false,
            hasBootstrappedSession: true,
            isLoading: false,
          }));
        } catch {
          const fallback = getStartupFallbackMessage();
          set((s) => ({
            messages: s.messages.length === 0 ? [fallback] : s.messages,
            startupSuggestions: getStartupFallbackSuggestions(),
            isBootstrapping: false,
            hasBootstrappedSession: true,
            isLoading: false,
          }));
        }
      },

      sendMessage: async (content: string) => {
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          content,
          sender: 'user',
          timestamp: new Date(),
        };

        set((s) => ({
          messages: [...s.messages, userMessage],
          isLoading: true,
          hasBootstrappedSession: true,
          error: null,
        }));

        try {
          await useTimesheetsStore.getState().load();
          const entries = useTimesheetsStore.getState().allEntries;
          const context = buildRecentTimesheetContext(entries, 15);
          const runtimeSystemContext = buildStartupTimesheetContextInjection(context);

          const aiMessage = await sendMessageService(content, get().messages, runtimeSystemContext);
          set((s) => ({
            messages: [...s.messages, aiMessage],
            isLoading: false,
          }));
          return true;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to get a response. Please try again.';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      sendMessageWithImage: async (base64: string, uri: string, text: string) => {
        const history = get().messages;
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          content: text,
          imageUri: uri,
          sender: 'user',
          timestamp: new Date(),
        };

        set((s) => ({
          messages: [...s.messages, userMessage],
          isLoading: true,
          hasBootstrappedSession: true,
          error: null,
        }));

        try {
          await useTimesheetsStore.getState().load();
          const entries = useTimesheetsStore.getState().allEntries;
          const context = buildRecentTimesheetContext(entries, 15);
          const runtimeSystemContext = buildStartupTimesheetContextInjection(context);

          const aiMessage = await sendMessageWithImageService(base64, text, history, runtimeSystemContext);
          set((s) => ({
            messages: [...s.messages, aiMessage],
            isLoading: false,
          }));
          return true;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to get a response. Please try again.';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      clearError: () => set({ error: null }),

      clearMessages: () => {
        set({
          messages: [],
          startupSuggestions: getStartupFallbackSuggestions(),
          isLoading: false,
          isBootstrapping: false,
          hasBootstrappedSession: false,
          error: null,
        });

        void get().ensureSessionBootstrap();
      },
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
);
