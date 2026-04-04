import { create } from 'zustand';
import type { ManualExpenseEntry, ManualExpenseForm } from '../types/finances.types';
import { fetchAllExpenses } from '../services/finances/expensesService';
import { mcpToolsCall } from '../services/api/mcp';
import { MCP_TOOL_NAMES } from '../constants/llm.constants';

/** Converte MM/DD/YYYY → YYYY-MM-DD para sincronizar com o MCP server. */
function toIsoDate(formDate: string): string {
  const parts = formDate.split('/');
  if (parts.length === 3) return `${parts[2]}-${parts[0]}-${parts[1]}`;
  return formDate;
}

/** Constrói args para o MCP submitExpense/editExpense a partir de um form/entry. */
function expenseToMcpArgs(entry: ManualExpenseEntry): Record<string, unknown> {
  return {
    id: entry.id,
    date: toIsoDate(entry.date),
    productiveProject: entry.productiveProject,
    partnerProject: entry.partnerProject,
    expenseType: entry.expenseType,
    quantity: Number(entry.quantity) || 1,
    unitValue: Number(entry.unitValue) || 0,
    currency: entry.currency,
    observations: entry.observations,
    expenseRepresentation: entry.expenseRepresentation,
  };
}

interface FinancesStore {
  entries: ManualExpenseEntry[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasLoaded: boolean;
  pendingScanReceipt: boolean;

  load: () => Promise<void>;
  refresh: () => Promise<void>;
  addEntry: (form: ManualExpenseForm | ManualExpenseEntry) => void;
  updateEntry: (id: string, form: ManualExpenseForm | ManualExpenseEntry) => void;
  deleteEntry: (id: string) => void;
  requestScanReceipt: () => void;
  consumeScanReceipt: () => boolean;
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
      const message = error instanceof Error ? error.message : 'Failed to load expenses.';
      set({ error: message });
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
      const message = error instanceof Error ? error.message : 'Failed to load expenses.';
      set({ error: message });
    } finally {
      set({ isRefreshing: false });
    }
  },

  addEntry: (form) => {
    const newEntry: ManualExpenseEntry = 'createdAtLabel' in form
      ? form as ManualExpenseEntry
      : { ...form, id: String(Date.now()), createdAtLabel: new Date().toLocaleDateString('pt-PT') };
    set((state) => ({ entries: [newEntry, ...state.entries] }));
    // Sincronizar com o MCP server para que o AI veja entradas criadas pela UI
    mcpToolsCall({
      name: MCP_TOOL_NAMES.SUBMIT_EXPENSE,
      arguments: expenseToMcpArgs(newEntry),
    }).catch(() => {});
  },

  updateEntry: (id, form) => {
    let updated: ManualExpenseEntry | undefined;
    set((state) => {
      const entries = state.entries.map((e) => {
        if (e.id === id) { updated = { ...e, ...form }; return updated!; }
        return e;
      });
      return { entries };
    });
    if (updated) {
      mcpToolsCall({
        name: MCP_TOOL_NAMES.EDIT_EXPENSE,
        arguments: expenseToMcpArgs(updated),
      }).catch(() => {});
    }
  },

  deleteEntry: (id) => {
    set((state) => ({ entries: state.entries.filter((e) => e.id !== id) }));
    mcpToolsCall({
      name: MCP_TOOL_NAMES.DELETE_EXPENSE,
      arguments: { id },
    }).catch(() => {});
  },

  requestScanReceipt: () => set({ pendingScanReceipt: true }),

  consumeScanReceipt: () => {
    const pending = get().pendingScanReceipt;
    if (pending) set({ pendingScanReceipt: false });
    return pending;
  },
}));
