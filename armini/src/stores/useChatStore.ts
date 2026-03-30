import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  generateBootstrap,
  getStartupFallbackSuggestions,
  getStartupFallbackMessage,
  sendMessage as sendMessageService,
} from '../services/chat/chatService';
import { adaptTimesheetEntry, type TimesheetEntryApi } from '../services/adapters/timesheetsAdapter';
import { useTimesheetsStore } from './useTimesheetsStore';
import type { Message, SuggestionChip } from '../types/chat.types';


interface ChatStore {
  messages: Message[];
  suggestions: SuggestionChip[];
  isLoading: boolean;
  isBootstrapping: boolean;
  hasBootstrappedSession: boolean;
  error: string | null;
  ensureSessionBootstrap: () => Promise<void>;
  sendMessage: (content: string) => Promise<boolean>;
  clearError: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      suggestions: getStartupFallbackSuggestions(),
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
          const { message: startupMessage, suggestions: startupSuggestions } = await generateBootstrap();

          set((s) => ({
            messages: s.messages.length === 0 ? [startupMessage] : s.messages,
            suggestions: startupSuggestions,
            isBootstrapping: false,
            hasBootstrappedSession: true,
            isLoading: false,
          }));
        } catch {
          const fallback = getStartupFallbackMessage();
          set((s) => ({
            messages: s.messages.length === 0 ? [fallback] : s.messages,
            suggestions: getStartupFallbackSuggestions(),
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
          const { message: aiMessage, suggestions, toolCallMessages } = await sendMessageService(content, get().messages);

          // Sincronizar entries criadas pelo AI com o store de timesheets
          for (const tcMsg of toolCallMessages) {
            if (tcMsg.toolCall?.name === 'createTimesheetEntry' && tcMsg.toolCall.result) {
              try {
                const apiEntry = JSON.parse(tcMsg.toolCall.result) as TimesheetEntryApi;
                useTimesheetsStore.getState().addEntry(adaptTimesheetEntry(apiEntry));
              } catch { /* resultado inválido — ignorar */ }
            }
          }

          set((s) => ({
            messages: [...s.messages, ...toolCallMessages, aiMessage],
            suggestions,
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
          suggestions: getStartupFallbackSuggestions(),
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
      partialize: (state) => ({ messages: state.messages, suggestions: state.suggestions }),
    },
  ),
);
