import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTimesheetsStore } from '@/src/stores/useTimesheetsStore';
import type { DaySummary, MonthSummary, TimesheetEntry } from '@/src/types/timesheets';

export interface EntryInput {
  project: string;
  task: string;
  hours: number;
  status: TimesheetEntry['status'];
}

interface UseTimesheetsReturn {
  monthData: MonthSummary | null;
  selectedDay: DaySummary | null;
  selectedDate: string | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  currentYear: number;
  currentMonth: number;
  goToPreviousMonth: () => void;
  goToNextMonth: () => void;
  selectDay: (date: string) => void;
  clearSelection: () => void;
  refresh: () => Promise<void>;
  addEntry: (date: string, input: EntryInput) => void;
  editEntry: (id: string, input: EntryInput) => void;
  deleteEntry: (id: string) => void;
}

let nextId = 1000;

function generateId(): string {
  return `local-${nextId++}`;
}

export function useTimesheets(): UseTimesheetsReturn {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const store = useTimesheetsStore();

  // Load data only once (store guards against duplicate fetches)
  useEffect(() => {
    store.load();
  }, []);

  // Derive monthData from the store
  const monthData = useMemo(
    () => store.getMonthData(currentYear, currentMonth),
    [store.allEntries, store.hasLoaded, currentYear, currentMonth]
  );

  useEffect(() => {
    setSelectedDate(null);
  }, [currentYear, currentMonth]);

  const goToPreviousMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 0) {
        setCurrentYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
  }, []);

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((m) => {
      if (m === 11) {
        setCurrentYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
  }, []);

  const selectDay = useCallback((date: string) => {
    setSelectedDate((prev) => (prev === date ? null : date));
  }, []);

  const clearSelection = useCallback(() => setSelectedDate(null), []);

  const refresh = useCallback(() => store.refresh(), [store.refresh]);

  const addEntry = useCallback((date: string, input: EntryInput) => {
    const newEntry: TimesheetEntry = {
      id: generateId(),
      date,
      ...input,
    };
    store.addEntry(newEntry);
  }, [store.addEntry]);

  const editEntry = useCallback((id: string, input: EntryInput) => {
    store.editEntry(id, input);
  }, [store.editEntry]);

  const deleteEntry = useCallback((id: string) => {
    store.deleteEntry(id);
  }, [store.deleteEntry]);

  const selectedDay =
    selectedDate && monthData ? (monthData.days[selectedDate] ?? null) : null;

  return {
    monthData,
    selectedDay,
    selectedDate,
    isLoading: store.isLoading,
    isRefreshing: store.isRefreshing,
    error: store.error,
    currentYear,
    currentMonth,
    goToPreviousMonth,
    goToNextMonth,
    selectDay,
    clearSelection,
    refresh,
    addEntry,
    editEntry,
    deleteEntry,
  };
}
