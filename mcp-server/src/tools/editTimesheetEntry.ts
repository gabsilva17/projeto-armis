import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { findById, update } from './timesheetStore.js';

export const editTimesheetEntryDefinition: ToolDefinition = {
  name: 'editTimesheetEntry',
  description:
    'Edit an existing timesheet entry. Only draft and pending entries can be edited. Provide the entry ID and the fields to update.',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID of the timesheet entry to edit' },
      date: { type: 'string', description: 'New date (YYYY-MM-DD)' },
      project: { type: 'string', description: 'New project name' },
      task: { type: 'string', description: 'New task description' },
      hours: { type: 'number', description: 'New hours worked (0.5 to 24)' },
    },
    required: ['id'],
  },
};

export const editTimesheetEntryHandler: ToolHandler = async (args): Promise<ToolResult> => {
  const { id, date, project, task, hours } = args as {
    id: string;
    date?: string;
    project?: string;
    task?: string;
    hours?: number;
  };

  const existing = findById(id);
  if (!existing) {
    return {
      content: [{ type: 'text', text: `Error: timesheet entry "${id}" not found.` }],
      isError: true,
    };
  }

  if (existing.status === 'approved') {
    return {
      content: [{ type: 'text', text: `Error: cannot edit an approved entry ("${id}"). Only draft or pending entries can be edited.` }],
      isError: true,
    };
  }

  if (hours !== undefined && (hours < 0.5 || hours > 24)) {
    return {
      content: [{ type: 'text', text: 'Error: hours must be between 0.5 and 24.' }],
      isError: true,
    };
  }

  const fields: Record<string, unknown> = {};
  if (date !== undefined) fields.date = date;
  if (project !== undefined) fields.project = project;
  if (task !== undefined) fields.task = task;
  if (hours !== undefined) fields.hours = hours;

  const updated = update(id, fields);

  return {
    content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
  };
};
