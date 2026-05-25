import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { imputationsClient } from '../backend/imputationsClient.js';
import { imputationToTimesheetEntry, unwrapBooleanResponse } from '../backend/imputationsAdapter.js';
import { BackendError } from '../backend/httpClient.js';

export const deleteTimesheetEntryDefinition: ToolDefinition = {
  name: 'deleteTimesheetEntry',
  description:
    'Delete an existing timesheet entry. Only draft and pending entries can be deleted. Provide the entry ID.',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID of the timesheet entry to delete' },
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

export const deleteTimesheetEntryHandler: ToolHandler = async (args): Promise<ToolResult> => {
  const { id } = args as { id: string };

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
        content: [{ type: 'text', text: `Error: cannot delete an approved entry ("${id}"). Only draft or pending entries can be deleted.` }],
        isError: true,
      };
    }

    unwrapBooleanResponse(await imputationsClient.remove(numericId));

    return {
      content: [{ type: 'text', text: JSON.stringify({ id, deleted: true }) }],
    };
  } catch (err) {
    const message = err instanceof BackendError || err instanceof Error
      ? err.message
      : 'Failed to delete timesheet entry';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
};
