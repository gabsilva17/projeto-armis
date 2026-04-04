import type { ManualExpenseEntry } from '@/src/types/finances.types';
import { FEATURES } from '@/src/constants/app.constants';
import { adaptExpenseEntry, type ExpenseEntryApi } from '../adapters/expensesAdapter';
import { mcpToolsCall } from '../api/mcp';

/**
 * Returns all expense entries.
 * Mock phase: fetches from MCP server (single source of truth).
 * When FEATURES.BACKEND_CONNECTED = true, replace with direct API call.
 */
export async function fetchAllExpenses(): Promise<ManualExpenseEntry[]> {
  if (FEATURES.BACKEND_CONNECTED) {
    // TODO: replace with real API call
    throw new Error('Backend not implemented yet');
  }

  const result = await mcpToolsCall({
    name: 'getExpenses',
    arguments: {},
  });

  const text = result.content[0]?.text ?? '[]';
  const apiEntries = JSON.parse(text) as ExpenseEntryApi[];
  return apiEntries.map(adaptExpenseEntry);
}
