import { create } from 'zustand';
import { fetchAllTimesheets, buildMonthSummary } from '../services/timesheets/timesheetsService';
import { mcpToolsCall } from '../services/api/mcp';
import { MCP_TOOL_NAMES } from '../constants/llm.constants';
import type { MonthSummary, TimesheetEntry } from '../types/timesheets';

interface TimesheetsStore {
  allEntries: TimesheetEntry[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasLoaded: boolean;

  load: () => Promise<void>;
  refresh: () => Promise<void>;
  addEntry: (entry: TimesheetEntry) => void;
  editEntry: (id: string, updates: Partial<TimesheetEntry>) => void;
  deleteEntry: (id: string) => void;
  getMonthData: (year: number, month: number) => MonthSummary | null;
}

export const useTimesheetsStore = create<TimesheetsStore>((set, get) => ({
  allEntries: [],
  isLoading: false,
  isRefreshing: false,
  error: null,
  hasLoaded: false,

  load: async () => {
    if (get().hasLoaded || get().isLoading) return;
    set({ isLoading: true, error: null });
    try {
      const entries = await fetchAllTimesheets();
      set({ allEntries: entries, hasLoaded: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load timesheets.';
      set({ error: message });
    } finally {
      set({ isLoading: false });
    }
  },

  refresh: async () => {
    set({ isRefreshing: true, error: null });
    try {
      const entries = await fetchAllTimesheets();
      set({ allEntries: entries, hasLoaded: true });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to load timesheets.';
      set({ error: message });
    } finally {
      set({ isRefreshing: false });
    }
  },

  addEntry: (entry) => {
    set((s) => ({ allEntries: [...s.allEntries, entry] }));
    // Sincronizar com o MCP server para que o AI veja entradas criadas pela UI
    mcpToolsCall({
      name: MCP_TOOL_NAMES.CREATE_TIMESHEET,
      arguments: { id: entry.id, date: entry.date, project: entry.project, task: entry.task, hours: entry.hours },
    }).catch(() => {});
  },

  editEntry: (id, updates) => {
    set((s) => ({
      allEntries: s.allEntries.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    }));
    mcpToolsCall({
      name: MCP_TOOL_NAMES.EDIT_TIMESHEET,
      arguments: { id, ...updates },
    }).catch(() => {});
  },

  deleteEntry: (id) => {
    set((s) => ({ allEntries: s.allEntries.filter((e) => e.id !== id) }));
    mcpToolsCall({
      name: MCP_TOOL_NAMES.DELETE_TIMESHEET,
      arguments: { id },
    }).catch(() => {});
  },

  getMonthData: (year, month) => {
    const { allEntries, hasLoaded } = get();
    if (!hasLoaded) return null;
    return buildMonthSummary(year, month, allEntries);
  },
}));
