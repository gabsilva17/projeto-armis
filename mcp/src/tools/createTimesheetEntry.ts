import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { env } from '../config/env.js';
import { imputationsClient } from '../backend/imputationsClient.js';
import {
  imputationsToTimesheetEntries,
  timesheetEntryToNewImputation,
  unwrapBooleanResponse,
} from '../backend/imputationsAdapter.js';
import { resolveProjectTask } from '../backend/projectTaskResolver.js';
import { BackendError } from '../backend/httpClient.js';

export const createTimesheetEntryDefinition: ToolDefinition = {
  name: 'createTimesheetEntry',
  description: 'Log hours for a specific date, project, and task. Returns the created entry.',
  inputSchema: {
    type: 'object',
    properties: {
      date: { type: 'string', description: 'Date (YYYY-MM-DD)' },
      project: { type: 'string', description: 'Project name' },
      task: { type: 'string', description: 'Task description' },
      hours: { type: 'number', description: 'Hours worked (0.5 to 24)' },
    },
    required: ['date', 'project', 'task', 'hours'],
  },
};

export const createTimesheetEntryHandler: ToolHandler = async (args): Promise<ToolResult> => {
  const { date, project, task, hours } = args as {
    date: string;
    project: string;
    task: string;
    hours: number;
  };

  if (hours < 0.5 || hours > 24) {
    return {
      content: [{ type: 'text', text: 'Error: hours must be between 0.5 and 24.' }],
      isError: true,
    };
  }

  try {
    const { projectId, taskId } = await resolveProjectTask(project, task);

    const dto = timesheetEntryToNewImputation(
      { date, project, task, hours, status: 'draft' },
      { username: env.BACKEND_USERNAME, projectId, taskId },
    );

    unwrapBooleanResponse(await imputationsClient.create(dto));

    // O backend não devolve o DTO criado (só BooleanFriendlyResponseT). Para
    // preservar o shape histórico do tool result, refazemos fetch do mês e
    // procuramos pelo "novo" — heurística: matching fields, escolhe o maior id.
    const [yearStr, monthStr] = date.split('-');
    const monthEntries = imputationsToTimesheetEntries(
      await imputationsClient.getMonth(Number(yearStr), Number(monthStr)),
    );
    const matches = monthEntries.filter(
      (e) => e.date === date && e.project === project && e.task === task && e.hours === hours,
    );
    const created =
      matches.length > 0
        ? matches.reduce((latest, e) => (Number(e.id) > Number(latest.id) ? e : latest))
        : { id: 'unknown', date, project, task, hours, status: 'draft' as const };

    return {
      content: [{ type: 'text', text: JSON.stringify(created, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof BackendError || err instanceof Error
      ? err.message
      : 'Failed to create timesheet entry';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
};
