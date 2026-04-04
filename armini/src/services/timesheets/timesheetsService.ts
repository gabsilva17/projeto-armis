import type { MonthSummary, TimesheetEntry } from '@/src/types/timesheets';
import { FEATURES } from '@/src/constants/app.constants';
import { adaptTimesheetEntries, type TimesheetEntryApi } from '../adapters/timesheetsAdapter';
import { mcpToolsCall } from '../api/mcp';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMonthSummary(year: number, month: number, entries: TimesheetEntry[]): MonthSummary {
  const monthEntries = entries.filter((e) => {
    const [y, m] = e.date.split('-').map(Number);
    return y === year && m === month + 1;
  });

  const days: MonthSummary['days'] = {};

  for (const entry of monthEntries) {
    if (!days[entry.date]) {
      days[entry.date] = { date: entry.date, totalHours: 0, entries: [] };
    }
    days[entry.date].totalHours += entry.hours;
    days[entry.date].entries.push(entry);
  }

  const totalHours = Object.values(days).reduce((acc, d) => acc + d.totalHours, 0);

  return {
    year,
    month,
    totalHours,
    totalDaysLogged: Object.keys(days).length,
    days,
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns all timesheet entries.
 * Mock phase: fetches from MCP server (single source of truth).
 * When FEATURES.BACKEND_CONNECTED = true, replace with direct API call.
 */
export async function fetchAllTimesheets(): Promise<TimesheetEntry[]> {
  if (FEATURES.BACKEND_CONNECTED) {
    // TODO: replace with real API call
    throw new Error('Backend not implemented yet');
  }

  const result = await mcpToolsCall({
    name: 'getTimesheets',
    arguments: { startDate: '2000-01-01', endDate: '2099-12-31' },
  });

  const text = result.content[0]?.text ?? '[]';
  const apiEntries = JSON.parse(text) as TimesheetEntryApi[];
  return adaptTimesheetEntries(apiEntries);
}

export { buildMonthSummary };
