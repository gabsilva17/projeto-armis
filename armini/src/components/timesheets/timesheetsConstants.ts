import type { EntryInput } from '@/src/hooks/useTimesheets';
import type { ThemeColors } from '@/src/theme';
import type { TimesheetEntryStatus } from '@/src/types/timesheets';

export const DAY_LABEL_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

export const STATUS_COLOR_KEYS: Record<TimesheetEntryStatus, keyof ThemeColors> = {
  approved: 'black',
  pending: 'gray500',
  draft: 'gray300',
};

export function getStatusColor(status: TimesheetEntryStatus, colors: ThemeColors): string {
  return colors[STATUS_COLOR_KEYS[status]];
}

export const ALL_STATUSES: TimesheetEntryStatus[] = ['draft', 'pending', 'approved'];

export const CELL_SIZE = 44;
export const ROW_HEIGHT = CELL_SIZE + 4;
export const SWIPE_THRESHOLD = 60;

export const EMPTY_INPUT: EntryInput = { project: '', task: '', hours: 8, status: 'draft' };
