import { create } from 'zustand';
import type { ManualExpenseEntry, ManualExpenseForm } from '../types/finances.types';

interface FinancesStore {
  entries: ManualExpenseEntry[];
  addEntry: (form: ManualExpenseForm) => void;
  updateEntry: (id: string, form: ManualExpenseForm) => void;
  deleteEntry: (id: string) => void;
}

export const useFinancesStore = create<FinancesStore>((set) => ({
  entries: [],

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
}));
