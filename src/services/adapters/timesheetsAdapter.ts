import type { TimesheetEntry, TimesheetEntryStatus } from '../../types/timesheets';

export interface TimesheetEntryApi {
  id: string | number;
  date: string;
  project?: string;
  project_name?: string;
  task?: string;
  task_name?: string;
  hours: number | string;
  status?: string;
}

function normalizeStatus(status?: string): TimesheetEntryStatus {
  if (status === 'approved' || status === 'pending' || status === 'draft') {
    return status;
  }

  return 'draft';
}

export function adaptTimesheetEntry(apiEntry: TimesheetEntryApi): TimesheetEntry {
  return {
    id: String(apiEntry.id),
    date: apiEntry.date,
    project: apiEntry.project ?? apiEntry.project_name ?? 'Unknown project',
    task: apiEntry.task ?? apiEntry.task_name ?? 'Unknown task',
    hours: Number(apiEntry.hours),
    status: normalizeStatus(apiEntry.status),
  };
}

export function adaptTimesheetEntries(apiEntries: TimesheetEntryApi[]): TimesheetEntry[] {
  return apiEntries.map(adaptTimesheetEntry);
}
