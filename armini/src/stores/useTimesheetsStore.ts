import { create } from 'zustand';
import {
  buildMonthSummary,
  createTimesheet,
  deleteTimesheet,
  fetchAllTimesheets,
  updateTimesheet,
} from '../services/timesheets/timesheetsService';
import type { MonthSummary, TimesheetEntry } from '../types/timesheets';

interface TimesheetsStore {
  allEntries: TimesheetEntry[];
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  hasLoaded: boolean;

  load: () => Promise<void>;
  refresh: () => Promise<void>;
  addEntry: (entry: TimesheetEntry) => Promise<void>;
  editEntry: (id: string, updates: Partial<TimesheetEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  getMonthData: (year: number, month: number) => MonthSummary | null;
}

function toErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
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
      set({ error: toErrorMessage(error, 'Failed to load timesheets.') });
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
      set({ error: toErrorMessage(error, 'Failed to load timesheets.') });
    } finally {
      set({ isRefreshing: false });
    }
  },

  // Optimistic update + rollback. Após o write o id real vem do backend, por
  // isso fazemos refresh para reconciliar (o id temporário local é substituído
  // pelo int devolvido pela próxima fetch do mês).
  addEntry: async (entry) => {
    const previous = get().allEntries;
    set({ allEntries: [...previous, entry], error: null });
    try {
      await createTimesheet(entry);
      await get().refresh();
    } catch (error: unknown) {
      set({ allEntries: previous, error: toErrorMessage(error, 'Failed to add timesheet entry.') });
    }
  },

  editEntry: async (id, updates) => {
    const previous = get().allEntries;
    const existing = previous.find((e) => e.id === id);
    if (!existing) return;
    const merged: TimesheetEntry = { ...existing, ...updates };
    set({ allEntries: previous.map((e) => (e.id === id ? merged : e)), error: null });
    try {
      await updateTimesheet(id, merged);
      await get().refresh();
    } catch (error: unknown) {
      set({ allEntries: previous, error: toErrorMessage(error, 'Failed to update timesheet entry.') });
    }
  },

  deleteEntry: async (id) => {
    const previous = get().allEntries;
    set({ allEntries: previous.filter((e) => e.id !== id), error: null });
    try {
      await deleteTimesheet(id);
    } catch (error: unknown) {
      set({ allEntries: previous, error: toErrorMessage(error, 'Failed to delete timesheet entry.') });
    }
  },

  getMonthData: (year, month) => {
    const { allEntries, hasLoaded } = get();
    if (!hasLoaded) return null;
    return buildMonthSummary(year, month, allEntries);
  },
}));
