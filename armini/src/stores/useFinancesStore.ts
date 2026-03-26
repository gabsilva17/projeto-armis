import { create } from 'zustand';
import type { ManualExpenseEntry, ManualExpenseForm } from '../types/finances.types';

interface FinancesStore {
  entries: ManualExpenseEntry[];
  pendingScanReceipt: boolean;
  addEntry: (form: ManualExpenseForm) => void;
  updateEntry: (id: string, form: ManualExpenseForm) => void;
  deleteEntry: (id: string) => void;
  requestScanReceipt: () => void;
  consumeScanReceipt: () => boolean;
}

export const useFinancesStore = create<FinancesStore>((set, get) => ({
  entries: [],
  pendingScanReceipt: false,

  addEntry: (form) => {
    const newEntry: ManualExpenseEntry = {
      ...form,
      id: String(Date.now()),
      createdAtLabel: new Date().toLocaleDateString('pt-PT'),
    };
    set((state) => ({ entries: [newEntry, ...state.entries] }));
  },

  updateEntry: (id, form) => {
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? { ...e, ...form } : e)),
    }));
  },

  deleteEntry: (id) => {
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
  },

  requestScanReceipt: () => set({ pendingScanReceipt: true }),

  consumeScanReceipt: () => {
    const pending = get().pendingScanReceipt;
    if (pending) set({ pendingScanReceipt: false });
    return pending;
  },
}));
