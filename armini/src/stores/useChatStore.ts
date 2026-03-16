import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sendMessage as sendMessageService, sendMessageWithImage as sendMessageWithImageService } from '../services/chat/chatService';
import type { Message } from '../types/chat.types';

interface ChatStore {
  messages: Message[];
  isLoading: boolean;
  error: string | null;
  sendMessage: (content: string) => Promise<void>;
  sendMessageWithImage: (base64: string, uri: string, text: string) => Promise<void>;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>()(
  persist(
    (set, get) => ({
      messages: [],
      isLoading: false,
      error: null,

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
          error: null,
        }));

        try {
          const aiMessage = await sendMessageService(content, get().messages);
          set((s) => ({
            messages: [...s.messages, aiMessage],
            isLoading: false,
          }));
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to get a response. Please try again.';
          set({ error: message, isLoading: false });
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
          error: null,
        }));

        try {
          const aiMessage = await sendMessageWithImageService(base64, text, history);
          set((s) => ({
            messages: [...s.messages, aiMessage],
            isLoading: false,
          }));
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : 'Failed to get a response. Please try again.';
          set({ error: message, isLoading: false });
        }
      },

      clearMessages: () => set({ messages: [], isLoading: false, error: null }),
    }),
    {
      name: 'chat-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ messages: state.messages }),
    },
  ),
);
