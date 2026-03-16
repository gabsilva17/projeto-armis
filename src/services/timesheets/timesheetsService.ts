import type { MonthSummary, TimesheetEntry } from '@/src/types/timesheets';
import { FEATURES } from '@/src/constants/app.constants';
import { adaptTimesheetEntries, type TimesheetEntryApi } from '../adapters/timesheetsAdapter';

// ---------------------------------------------------------------------------
// Static mock data — simulates what a real API would return.
// When FEATURES.BACKEND_CONNECTED = true, replace fetchAllTimesheets with
// a real fetch() call to your API endpoint.
// ---------------------------------------------------------------------------

const MOCK_API_ENTRIES: TimesheetEntryApi[] = [
  // February 2026
  { id: 'e001', date: '2026-02-02', project: 'ARMIS Platform',   task: 'Frontend development',  hours: 8, status: 'approved' },
  { id: 'e002', date: '2026-02-03', project: 'Client Portal',    task: 'Backend integration',   hours: 8, status: 'approved' },
  { id: 'e003', date: '2026-02-04', project: 'ARMIS Platform',   task: 'Code review',           hours: 4, status: 'approved' },
  { id: 'e004', date: '2026-02-04', project: 'Internal Tools',   task: 'Planning & scoping',    hours: 4, status: 'approved' },
  { id: 'e005', date: '2026-02-05', project: 'QA & Testing',     task: 'Bug fixes',             hours: 8, status: 'approved' },
  { id: 'e006', date: '2026-02-06', project: 'ARMIS Platform',   task: 'Documentation',         hours: 8, status: 'approved' },
  { id: 'e007', date: '2026-02-09', project: 'Client Portal',    task: 'Frontend development',  hours: 8, status: 'approved' },
  { id: 'e008', date: '2026-02-10', project: 'ARMIS Platform',   task: 'Design review',         hours: 8, status: 'approved' },
  { id: 'e009', date: '2026-02-11', project: 'Internal Tools',   task: 'Backend integration',   hours: 8, status: 'approved' },
  { id: 'e010', date: '2026-02-12', project: 'ARMIS Platform',   task: 'Frontend development',  hours: 4, status: 'approved' },
  { id: 'e011', date: '2026-02-12', project: 'QA & Testing',     task: 'Bug fixes',             hours: 4, status: 'approved' },
  { id: 'e012', date: '2026-02-13', project: 'Client Portal',    task: 'Code review',           hours: 8, status: 'approved' },
  { id: 'e013', date: '2026-02-16', project: 'ARMIS Platform',   task: 'Planning & scoping',    hours: 8, status: 'approved' },
  { id: 'e014', date: '2026-02-17', project: 'Internal Tools',   task: 'Documentation',         hours: 8, status: 'approved' },
  { id: 'e015', date: '2026-02-18', project: 'Client Portal',    task: 'Frontend development',  hours: 8, status: 'approved' },
  { id: 'e016', date: '2026-02-19', project: 'ARMIS Platform',   task: 'Backend integration',   hours: 8, status: 'approved' },
  { id: 'e017', date: '2026-02-23', project: 'QA & Testing',     task: 'Bug fixes',             hours: 8, status: 'approved' },
  { id: 'e018', date: '2026-02-24', project: 'ARMIS Platform',   task: 'Design review',         hours: 8, status: 'approved' },
  { id: 'e019', date: '2026-02-25', project: 'Client Portal',    task: 'Frontend development',  hours: 4, status: 'approved' },
  { id: 'e020', date: '2026-02-25', project: 'Internal Tools',   task: 'Code review',           hours: 4, status: 'approved' },
  { id: 'e021', date: '2026-02-26', project: 'ARMIS Platform',   task: 'Documentation',         hours: 8, status: 'approved' },
  { id: 'e022', date: '2026-02-27', project: 'Client Portal',    task: 'Backend integration',   hours: 8, status: 'approved' },

  // March 2026
  { id: 'e023', date: '2026-03-02', project: 'ARMIS Platform',   task: 'Frontend development',  hours: 8, status: 'approved' },
  { id: 'e024', date: '2026-03-03', project: 'Client Portal',    task: 'Planning & scoping',    hours: 8, status: 'approved' },
  { id: 'e025', date: '2026-03-04', project: 'ARMIS Platform',   task: 'Code review',           hours: 4, status: 'approved' },
  { id: 'e026', date: '2026-03-04', project: 'QA & Testing',     task: 'Bug fixes',             hours: 4, status: 'approved' },
  { id: 'e027', date: '2026-03-05', project: 'Internal Tools',   task: 'Backend integration',   hours: 8, status: 'approved' },
  { id: 'e028', date: '2026-03-06', project: 'ARMIS Platform',   task: 'Design review',         hours: 8, status: 'pending'  },
  { id: 'e029', date: '2026-03-07', project: 'Client Portal',    task: 'Frontend development',  hours: 8, status: 'pending'  },
  { id: 'e030', date: '2026-03-09', project: 'ARMIS Platform',   task: 'Documentation',         hours: 4, status: 'draft'    },
  { id: 'e031', date: '2026-03-09', project: 'Internal Tools',   task: 'Planning & scoping',    hours: 4, status: 'draft'    },
];

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
 * With a real API this would be: GET /api/timesheets
 * The caller (hook) is responsible for filtering by month.
 */
export async function fetchAllTimesheets(): Promise<TimesheetEntry[]> {
  if (FEATURES.BACKEND_CONNECTED) {
    // TODO: replace with real API call
    // const response = await fetch('/api/timesheets');
    // const apiEntries = (await response.json()) as TimesheetEntryApi[];
    // return adaptTimesheetEntries(apiEntries);
    throw new Error('Backend not implemented yet');
  }

  await new Promise((resolve) => setTimeout(resolve, 400));
  return adaptTimesheetEntries(MOCK_API_ENTRIES);
}

export { buildMonthSummary };
