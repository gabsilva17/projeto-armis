import { create } from 'zustand';
import type { ManualExpenseEntry, ManualExpenseForm } from '../types/finances.types';
import {
  createExpense,
  deleteExpense,
  fetchAllExpenses,
  updateExpense,
} from '../services/finances/expensesService';

interface FinancesStore {
  entries: ManualExpenseEntry[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasLoaded: boolean;
  pendingScanReceipt: boolean;

  load: () => Promise<void>;
  refresh: () => Promise<void>;
  addEntry: (form: ManualExpenseForm | ManualExpenseEntry) => Promise<void>;
  updateEntry: (id: string, form: ManualExpenseForm | ManualExpenseEntry) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  requestScanReceipt: () => void;
  consumeScanReceipt: () => boolean;
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function placeholderEntry(form: ManualExpenseForm | ManualExpenseEntry): ManualExpenseEntry {
  if ('createdAtLabel' in form && form.id) return form;
  return {
    ...form,
    id: `pending-${Date.now()}`,
    createdAtLabel: new Date().toLocaleDateString('pt-PT'),
  };
}

export const useFinancesStore = create<FinancesStore>((set, get) => ({
  entries: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  hasLoaded: false,
  pendingScanReceipt: false,

  load: async () => {
    if (get().hasLoaded || get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const entries = await fetchAllExpenses();
      set({ entries, hasLoaded: true });
    } catch (error: unknown) {
      set({ error: toErrorMessage(error, 'Failed to load expenses.') });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const entries = await fetchAllExpenses();
      set({ entries, hasLoaded: true });
    } catch (error: unknown) {
      set({ error: toErrorMessage(error, 'Failed to load expenses.') });
    } finally {
      set({ isRefreshing: false });
    }
  },

  // Optimistic insert com id temporário; substitui pelo entry devolvido pelo
  // backend (que carrega o id canónico) quando o write completar.
  addEntry: async (form) => {
    const previous = get().entries;
    const optimistic = placeholderEntry(form);
    set({ entries: [optimistic, ...previous], error: null });
    try {
      const saved = await createExpense(form);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === optimistic.id ? saved : e)),
      }));
    } catch (error: unknown) {
      set({ entries: previous, error: toErrorMessage(error, 'Failed to add expense.') });
    }
  },

  updateEntry: async (id, form) => {
    const previous = get().entries;
    const existing = previous.find((e) => e.id === id);
    if (!existing) return;
    const merged: ManualExpenseEntry = { ...existing, ...form, id };
    set({ entries: previous.map((e) => (e.id === id ? merged : e)), error: null });
    try {
      const saved = await updateExpense(id, form);
      set((state) => ({
        entries: state.entries.map((e) => (e.id === id ? saved : e)),
      }));
    } catch (error: unknown) {
      set({ entries: previous, error: toErrorMessage(error, 'Failed to update expense.') });
    }
  },

  deleteEntry: async (id) => {
    const previous = get().entries;
    set({ entries: previous.filter((e) => e.id !== id), error: null });
    try {
      await deleteExpense(id);
    } catch (error: unknown) {
      set({ entries: previous, error: toErrorMessage(error, 'Failed to delete expense.') });
    }
  },

  requestScanReceipt: () => set({ pendingScanReceipt: true }),

  consumeScanReceipt: () => {
    const pending = get().pendingScanReceipt;
    if (pending) set({ pendingScanReceipt: false });
    return pending;
  },
}));
