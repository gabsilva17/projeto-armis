import type { EntryInput } from '@/src/hooks/useTimesheets';
import { Colors } from '@/src/theme';
import type { TimesheetEntryStatus } from '@/src/types/timesheets';

export const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export const STATUS_COLORS: Record<TimesheetEntryStatus, string> = {
  approved: Colors.black,
  pending: Colors.gray500,
  draft: Colors.gray300,
};

export const STATUS_LABELS: Record<TimesheetEntryStatus, string> = {
  approved: 'Approved',
  pending: 'Pending',
  draft: 'Draft',
};

export const ALL_STATUSES: TimesheetEntryStatus[] = ['draft', 'pending', 'approved'];

export const CELL_SIZE = 44;
// Each row = minHeight (44) + marginVertical (2 top + 2 bottom)
export const ROW_HEIGHT = CELL_SIZE + 4;
export const SWIPE_THRESHOLD = 60;

export const EMPTY_INPUT: EntryInput = { project: '', task: '', hours: 8, status: 'draft' };
