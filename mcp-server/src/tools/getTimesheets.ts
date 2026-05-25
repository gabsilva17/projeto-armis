import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { getAll } from './timesheetStore.js';

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

export const getTimesheetsHandler: ToolHandler = async (args): Promise<ToolResult> => {
  const { startDate, endDate } = args as { startDate: string; endDate: string };
  const entries = getAll().filter((e) => e.date >= startDate && e.date <= endDate);

  return {
    content: [{ type: 'text', text: JSON.stringify(entries, null, 2) }],
  };
};
