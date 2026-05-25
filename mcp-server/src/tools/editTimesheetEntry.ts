import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { env } from '../config/env.js';
import { imputationsClient } from '../backend/imputationsClient.js';
import {
  imputationToTimesheetEntry,
  timesheetEntryToUpdatedImputation,
  unwrapBooleanResponse,
} from '../backend/imputationsAdapter.js';
import { resolveProjectTask } from '../backend/projectTaskResolver.js';
import { BackendError } from '../backend/httpClient.js';

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

function parseImputationId(id: string): number {
  const numeric = Number(id);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
    throw new Error(`Imputation id must be an integer (received "${id}").`);
  }
  return numeric;
}

export const editTimesheetEntryHandler: ToolHandler = async (args): Promise<ToolResult> => {
  const { id, date, project, task, hours } = args as {
    id: string;
    date?: string;
    project?: string;
    task?: string;
    hours?: number;
  };

  if (hours !== undefined && (hours < 0.5 || hours > 24)) {
    return {
      content: [{ type: 'text', text: 'Error: hours must be between 0.5 and 24.' }],
      isError: true,
    };
  }

  try {
    const numericId = parseImputationId(id);

    let existingDto;
    try {
      existingDto = await imputationsClient.getById(numericId);
    } catch (err) {
      if (err instanceof BackendError && err.status === 404) {
        return {
          content: [{ type: 'text', text: `Error: timesheet entry "${id}" not found.` }],
          isError: true,
        };
      }
      throw err;
    }

    const existing = imputationToTimesheetEntry(existingDto);

    if (existing.status === 'approved') {
      return {
        content: [{ type: 'text', text: `Error: cannot edit an approved entry ("${id}"). Only draft or pending entries can be edited.` }],
        isError: true,
      };
    }

    // Merge: fields ausentes mantêm o valor actual.
    const merged = {
      id,
      date: date ?? existing.date,
      project: project ?? existing.project,
      task: task ?? existing.task,
      hours: hours ?? existing.hours,
      status: existing.status,
    };

    const { projectId, taskId } = await resolveProjectTask(merged.project, merged.task);
    const dto = timesheetEntryToUpdatedImputation(merged, {
      username: env.BACKEND_USERNAME,
      projectId,
      taskId,
    });

    unwrapBooleanResponse(await imputationsClient.update(numericId, dto));

    return {
      content: [{ type: 'text', text: JSON.stringify(merged, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof BackendError || err instanceof Error
      ? err.message
      : 'Failed to edit timesheet entry';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
};
