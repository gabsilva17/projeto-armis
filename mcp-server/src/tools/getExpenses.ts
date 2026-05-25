import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { getAll } from './expenseStore.js';

export const getExpensesDefinition: ToolDefinition = {
  name: 'getExpenses',
  description: 'Fetch expense entries for a user, optionally filtered by date range or status.',
  inputSchema: {
    type: 'object',
    properties: {
      startDate: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
      endDate: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      status: { type: 'string', enum: ['pending', 'approved', 'rejected', 'draft'], description: 'Filter by status' },
    },
  },
};

export const getExpensesHandler: ToolHandler = async (args): Promise<ToolResult> => {
  const { startDate, endDate, status } = args as {
    startDate?: string;
    endDate?: string;
    status?: string;
  };

  let expenses = getAll();

  if (startDate) expenses = expenses.filter((e) => e.date >= startDate);
  if (endDate) expenses = expenses.filter((e) => e.date <= endDate);
  if (status) expenses = expenses.filter((e) => e.status === status);

  return {
    content: [{ type: 'text', text: JSON.stringify(expenses, null, 2) }],
  };
};
