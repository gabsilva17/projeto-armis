import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { imputationsClient } from '../backend/imputationsClient.js';
import { imputationsToTimesheetEntries } from '../backend/imputationsAdapter.js';
import { BackendError } from '../backend/httpClient.js';

export const getTimesheetsDefinition: ToolDefinition = {
  name: 'getTimesheets',
  description: 'Fetch timesheet entries for a user within a date range. Returns logged hours, projects, tasks, and status for each day.',
  inputSchema: {
    type: 'object',
    properties: {
      startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
      endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
    },
    required: ['startDate', 'endDate'],
  },
};

// O backend só expõe leituras month-by-month. Para satisfazer o intervalo
// arbitrário pedido pelo tool, derivamos os meses cobertos por [startDate,
// endDate] e fazemos fetch em paralelo, depois filtramos para o intervalo
// exacto. Mesma estratégia que o mobile (ver timesheetsService.ts) — TODO
// mover ambos para month-by-month lazy quando a UI/AI suportarem.
function monthsInRange(startDate: string, endDate: string): Array<{ year: number; month: number }> {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end) {
    return [];
  }
  const months: Array<{ year: number; month: number }> = [];
  const cursor = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1));
  while (cursor <= end) {
    months.push({ year: cursor.getUTCFullYear(), month: cursor.getUTCMonth() + 1 });
    cursor.setUTCMonth(cursor.getUTCMonth() + 1);
  }
  return months;
}

export const getTimesheetsHandler: ToolHandler = async (args): Promise<ToolResult> => {
  const { startDate, endDate } = args as { startDate: string; endDate: string };

  const months = monthsInRange(startDate, endDate);
  if (months.length === 0) {
    return {
      content: [{ type: 'text', text: `Error: invalid date range (${startDate} → ${endDate}).` }],
      isError: true,
    };
  }

  try {
    const results = await Promise.all(
      months.map(({ year, month }) => imputationsClient.getMonth(year, month)),
    );
    const entries = imputationsToTimesheetEntries(results.flat()).filter(
      (e) => e.date >= startDate && e.date <= endDate,
    );

    return {
      content: [{ type: 'text', text: JSON.stringify(entries, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof BackendError ? err.message : 'Failed to fetch timesheets';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
};
