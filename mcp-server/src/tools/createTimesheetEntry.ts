import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { add } from './timesheetStore.js';

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
  const { id, date, project, task, hours } = args as {
    id?: string;
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

  const entry = add({ ...(id ? { id } : {}), date, project, task, hours, status: 'draft' });

  return {
    content: [{ type: 'text', text: JSON.stringify(entry, null, 2) }],
  };
};
