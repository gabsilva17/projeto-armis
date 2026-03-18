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

function toDateKey(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getTodayDateKey(): string {
  const now = new Date();
  return toDateKey(now.getFullYear(), now.getMonth(), now.getDate());
}

function generateId(): string {
  return `local-${nextId++}`;
}

export function useTimesheets(): UseTimesheetsReturn {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(getTodayDateKey);

  const allEntries = useTimesheetsStore((s) => s.allEntries);
  const hasLoaded = useTimesheetsStore((s) => s.hasLoaded);
  const isLoading = useTimesheetsStore((s) => s.isLoading);
  const isRefreshing = useTimesheetsStore((s) => s.isRefreshing);
  const error = useTimesheetsStore((s) => s.error);
  const load = useTimesheetsStore((s) => s.load);
  const refreshStore = useTimesheetsStore((s) => s.refresh);
  const addEntryStore = useTimesheetsStore((s) => s.addEntry);
  const editEntryStore = useTimesheetsStore((s) => s.editEntry);
  const deleteEntryStore = useTimesheetsStore((s) => s.deleteEntry);
  const getMonthData = useTimesheetsStore((s) => s.getMonthData);

  // Load data only once (store guards against duplicate fetches)
  useEffect(() => {
    void load();
  }, [load]);

  // Derive monthData from the store
  const monthData = useMemo(
    () => getMonthData(currentYear, currentMonth),
    [allEntries, hasLoaded, currentYear, currentMonth, getMonthData]
  );

  useEffect(() => {
    const now = new Date();
    const isCurrentMonth = currentYear === now.getFullYear() && currentMonth === now.getMonth();
    setSelectedDate(isCurrentMonth ? toDateKey(now.getFullYear(), now.getMonth(), now.getDate()) : null);
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

  const refresh = useCallback(() => refreshStore(), [refreshStore]);

  const addEntry = useCallback((date: string, input: EntryInput) => {
    const newEntry: TimesheetEntry = {
      id: generateId(),
      date,
      ...input,
    };
    addEntryStore(newEntry);
  }, [addEntryStore]);

  const editEntry = useCallback((id: string, input: EntryInput) => {
    editEntryStore(id, input);
  }, [editEntryStore]);

  const deleteEntry = useCallback((id: string) => {
    deleteEntryStore(id);
  }, [deleteEntryStore]);

  const selectedDay =
    selectedDate && monthData ? (monthData.days[selectedDate] ?? null) : null;

  return {
    monthData,
    selectedDay,
    selectedDate,
    isLoading,
    isRefreshing,
    error,
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
