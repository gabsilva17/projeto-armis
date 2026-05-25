import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { expensesClient } from '../backend/expensesClient.js';
import { expenseDtoToEntry, expenseEntryToDto } from '../backend/expensesAdapter.js';
import { BackendError } from '../backend/httpClient.js';

export const submitExpenseDefinition: ToolDefinition = {
  name: 'submitExpense',
  description: 'Submit a new expense entry. Returns the created expense with a generated ID.',
  inputSchema: {
    type: 'object',
    properties: {
      date: { type: 'string', description: 'Expense date (YYYY-MM-DD)' },
      productiveProject: { type: 'string', enum: ['Digital Hub', 'Internal R&D', 'ARMIS Platform'], description: 'Productive project' },
      partnerProject: { type: 'string', enum: ['None', 'Client Project A', 'Client Project B'], description: 'Partner project' },
      expenseType: { type: 'string', enum: ['Travel', 'Meal', 'Accommodation', 'Office Supplies', 'Others'], description: 'Type of expense' },
      quantity: { type: 'number', description: 'Quantity (1 to 1000)' },
      unitValue: { type: 'number', description: 'Unit value (0.01 to 100000)' },
      currency: { type: 'string', enum: ['EUR', 'USD', 'GBP'], description: 'Currency code' },
      observations: { type: 'string', description: 'Brief description (max 300 chars)' },
      expenseRepresentation: { type: 'boolean', description: 'Whether this is a representation expense' },
    },
    required: ['date', 'expenseType', 'quantity', 'unitValue', 'currency'],
  },
};

export const submitExpenseHandler: ToolHandler = async (args): Promise<ToolResult> => {
  const {
    date,
    productiveProject,
    partnerProject,
    expenseType,
    quantity,
    unitValue,
    currency,
    observations,
    expenseRepresentation,
  } = args as {
    date: string;
    productiveProject?: string;
    partnerProject?: string;
    expenseType: string;
    quantity: number;
    unitValue: number;
    currency: string;
    observations?: string;
    expenseRepresentation?: boolean;
  };

  if (quantity < 1 || quantity > 1000) {
    return {
      content: [{ type: 'text', text: 'Error: quantity must be between 1 and 1000.' }],
      isError: true,
    };
  }

  if (unitValue <= 0 || unitValue > 100000) {
    return {
      content: [{ type: 'text', text: 'Error: unitValue must be between 0.01 and 100000.' }],
      isError: true,
    };
  }

  try {
    const dto = expenseEntryToDto({
      id: '', // backend atribui
      date,
      productiveProject: productiveProject ?? 'Digital Hub',
      partnerProject: partnerProject ?? 'None',
      expenseType,
      quantity,
      unitValue,
      currency,
      observations: observations?.slice(0, 300) ?? '',
      expenseRepresentation: expenseRepresentation ?? false,
      status: 'draft',
    });

    const res = await expensesClient.create(dto);
    if (!res.content) {
      return {
        content: [{ type: 'text', text: `Error: ${res.message ?? 'Backend rejected the expense create.'}` }],
        isError: true,
      };
    }

    // O mock devolve o id real no payload. Caso falte (futuro contrato real),
    // fazemos fallback para um placeholder; refresh do caller substituirá.
    const id = res.id ?? `local-${Date.now()}`;
    const created = expenseDtoToEntry({ ...dto, id });

    return {
      content: [{ type: 'text', text: JSON.stringify(created, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof BackendError ? err.message : 'Failed to submit expense';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
};
