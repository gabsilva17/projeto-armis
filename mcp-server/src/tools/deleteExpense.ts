import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { findById, remove } from './expenseStore.js';

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

  const existing = findById(id);
  if (!existing) {
    return {
      content: [{ type: 'text', text: `Error: expense entry "${id}" not found.` }],
      isError: true,
    };
  }

  if (existing.status === 'approved') {
    return {
      content: [{ type: 'text', text: `Error: cannot delete an approved entry ("${id}"). Only draft or pending entries can be deleted.` }],
      isError: true,
    };
  }

  remove(id);

  return {
    content: [{ type: 'text', text: JSON.stringify({ id, deleted: true }) }],
  };
};
