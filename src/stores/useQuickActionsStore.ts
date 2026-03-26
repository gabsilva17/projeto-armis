import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_QUICK_ACTIONS } from '../constants/quickActions.constants';
import type { QuickAction } from '../types/quickActions.types';

interface QuickActionsStore {
  actions: QuickAction[];
  addAction: (action: Omit<QuickAction, 'id'>) => void;
  updateAction: (id: string, updates: Partial<Omit<QuickAction, 'id'>>) => void;
  removeAction: (id: string) => void;
  reorderActions: (actions: QuickAction[]) => void;
}

export const useQuickActionsStore = create<QuickActionsStore>()(
  persist(
    (set) => ({
      actions: DEFAULT_QUICK_ACTIONS,

      addAction: (action) => {
        const newAction: QuickAction = {
          ...action,
          id: `qa-${Date.now()}`,
        };
        set((s) => ({ actions: [...s.actions, newAction] }));
      },

      updateAction: (id, updates) => {
        set((s) => ({
          actions: s.actions.map((a) => (a.id === id ? { ...a, ...updates } : a)),
        }));
      },

      removeAction: (id) => {
        set((s) => ({ actions: s.actions.filter((a) => a.id !== id) }));
      },

      reorderActions: (actions) => {
        set({ actions });
      },
    }),
    {
      name: 'quick-actions-v2',
      storage: createJSONStorage(() => AsyncStorage),
    },
  ),
);
