import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { expensesClient } from '../backend/expensesClient.js';
import { expenseDtoToEntry } from '../backend/expensesAdapter.js';
import { BackendError } from '../backend/httpClient.js';

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

  try {
    const dtos = await expensesClient.listMine();
    let expenses = dtos.map(expenseDtoToEntry);

    if (startDate) expenses = expenses.filter((e) => e.date >= startDate);
    if (endDate) expenses = expenses.filter((e) => e.date <= endDate);
    if (status) expenses = expenses.filter((e) => e.status === status);

    return {
      content: [{ type: 'text', text: JSON.stringify(expenses, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof BackendError ? err.message : 'Failed to fetch expenses';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
};
