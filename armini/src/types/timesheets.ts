export type TimesheetEntryStatus = 'approved' | 'pending' | 'draft';

export interface TimesheetEntry {
  id: string;
  date: string; // ISO date string: YYYY-MM-DD
  project: string;
  task: string;
  hours: number;
  status: TimesheetEntryStatus;
}

export interface DaySummary {
  date: string; // YYYY-MM-DD
  totalHours: number;
  entries: TimesheetEntry[];
}

export interface MonthSummary {
  year: number;
  month: number; // 0-indexed (0 = January)
  totalHours: number;
  totalDaysLogged: number;
  days: Record<string, DaySummary>; // key: YYYY-MM-DD
}
