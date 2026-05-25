import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { expensesClient } from '../backend/expensesClient.js';
import { expenseDtoToEntry } from '../backend/expensesAdapter.js';
import { BackendError } from '../backend/httpClient.js';

export const deleteExpenseDefinition: ToolDefinition = {
  name: 'deleteExpense',
  description:
    'Delete an existing expense entry. Only draft and pending entries can be deleted. Provide the entry ID.',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID of the expense entry to delete' },
    },
    required: ['id'],
  },
};

export const deleteExpenseHandler: ToolHandler = async (args): Promise<ToolResult> => {
  const { id } = args as { id: string };

  try {
    let existingDto;
    try {
      existingDto = await expensesClient.getById(id);
    } catch (err) {
      if (err instanceof BackendError && err.status === 404) {
        return {
          content: [{ type: 'text', text: `Error: expense entry "${id}" not found.` }],
          isError: true,
        };
      }
      throw err;
    }

    const existing = expenseDtoToEntry(existingDto);
    if (existing.status === 'approved') {
      return {
        content: [{ type: 'text', text: `Error: cannot delete an approved entry ("${id}"). Only draft or pending entries can be deleted.` }],
        isError: true,
      };
    }

    const res = await expensesClient.remove(id);
    if (!res.content) {
      return {
        content: [{ type: 'text', text: `Error: ${res.message ?? 'Backend rejected the expense delete.'}` }],
        isError: true,
      };
    }

    return {
      content: [{ type: 'text', text: JSON.stringify({ id, deleted: true }) }],
    };
  } catch (err) {
    const message = err instanceof BackendError ? err.message : 'Failed to delete expense entry';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
};
