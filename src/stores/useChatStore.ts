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
import { adaptExpenseEntry, type ExpenseEntryApi } from '../services/adapters/expensesAdapter';
import { useTimesheetsStore } from './useTimesheetsStore';
import { useFinancesStore } from './useFinancesStore';
import { MCP_TOOL_NAMES } from '../constants/llm.constants';
import type { ChatDropdown, Message, SuggestionChip } from '../types/chat.types';


interface ChatStore {
  messages: Message[];
  suggestions: SuggestionChip[];
  dropdown: ChatDropdown | null;
  isLoading: boolean;
  isBootstrapping: boolean;
  hasBootstrappedSession: boolean;
  error: string | null;
  ensureSessionBootstrap: () => Promise<void>;
  sendMessage: (content: string) => Promise<boolean>;
  selectDropdownOption: (value: string) => Promise<boolean>;
  clearError: () => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      suggestions: getStartupFallbackSuggestions(),
      dropdown: null,
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
          const { message: aiMessage, suggestions, toolCallMessages, dropdown } = await sendMessageService(content, get().messages);

          // Sincronizar mutations do AI com o store de timesheets
          for (const tcMsg of toolCallMessages) {
            const toolName = tcMsg.toolCall?.name;
            const toolResult = tcMsg.toolCall?.result;
            if (!toolName || !toolResult) continue;

            try {
              if (toolName === MCP_TOOL_NAMES.CREATE_TIMESHEET) {
                const apiEntry = JSON.parse(toolResult) as TimesheetEntryApi;
                useTimesheetsStore.getState().addEntry(adaptTimesheetEntry(apiEntry));
              } else if (toolName === MCP_TOOL_NAMES.EDIT_TIMESHEET) {
                const apiEntry = JSON.parse(toolResult) as TimesheetEntryApi;
                const adapted = adaptTimesheetEntry(apiEntry);
                useTimesheetsStore.getState().editEntry(adapted.id, adapted);
              } else if (toolName === MCP_TOOL_NAMES.DELETE_TIMESHEET) {
                const parsed = JSON.parse(toolResult) as { id: string; deleted: boolean };
                if (parsed.deleted) {
                  useTimesheetsStore.getState().deleteEntry(parsed.id);
                }
              } else if (toolName === MCP_TOOL_NAMES.SUBMIT_EXPENSE) {
                const apiEntry = JSON.parse(toolResult) as ExpenseEntryApi;
                const adapted = adaptExpenseEntry(apiEntry);
                useFinancesStore.getState().addEntry(adapted);
              } else if (toolName === MCP_TOOL_NAMES.EDIT_EXPENSE) {
                const apiEntry = JSON.parse(toolResult) as ExpenseEntryApi;
                const adapted = adaptExpenseEntry(apiEntry);
                const finances = useFinancesStore.getState();
                const exists = finances.entries.some((e) => e.id === adapted.id);
                if (exists) {
                  finances.updateEntry(adapted.id, adapted);
                } else {
                  finances.addEntry(adapted);
                }
              } else if (toolName === MCP_TOOL_NAMES.DELETE_EXPENSE) {
                const parsed = JSON.parse(toolResult) as { id: string; deleted: boolean };
                if (parsed.deleted) {
                  useFinancesStore.getState().deleteEntry(parsed.id);
                }
              }
            } catch { /* resultado inválido — ignorar */ }
          }

          set((s) => ({
            messages: [...s.messages, ...toolCallMessages, aiMessage],
            suggestions,
            dropdown: dropdown ?? null,
            isLoading: false,
          }));
          return true;
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to get a response. Please try again.';
          set({ error: message, isLoading: false });
          return false;
        }
      },

      selectDropdownOption: async (value: string) => {
        set({ dropdown: null });
        return get().sendMessage(value);
      },

      clearError: () => set({ error: null }),

      clearMessages: () => {
        set({
          messages: [],
          suggestions: getStartupFallbackSuggestions(),
          dropdown: null,
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
