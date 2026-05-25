import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { findById, update } from './expenseStore.js';

export const editExpenseDefinition: ToolDefinition = {
  name: 'editExpense',
  description:
    'Edit an existing expense entry. Only draft and pending entries can be edited. Provide the entry ID and the fields to update.',
  inputSchema: {
    type: 'object',
    properties: {
      id: { type: 'string', description: 'ID of the expense entry to edit' },
      date: { type: 'string', description: 'New date (YYYY-MM-DD)' },
      productiveProject: { type: 'string', enum: ['Digital Hub', 'Internal R&D', 'ARMIS Platform'], description: 'New productive project' },
      partnerProject: { type: 'string', enum: ['None', 'Client Project A', 'Client Project B'], description: 'New partner project' },
      expenseType: { type: 'string', enum: ['Travel', 'Meal', 'Accommodation', 'Office Supplies', 'Others'], description: 'New expense type' },
      quantity: { type: 'number', description: 'New quantity (1 to 1000)' },
      unitValue: { type: 'number', description: 'New unit value (0.01 to 100000)' },
      currency: { type: 'string', enum: ['EUR', 'USD', 'GBP'], description: 'New currency code' },
      observations: { type: 'string', description: 'New description (max 300 chars)' },
      expenseRepresentation: { type: 'boolean', description: 'Whether this is a representation expense' },
    },
    required: ['id'],
  },
};

export const editExpenseHandler: ToolHandler = async (args): Promise<ToolResult> => {
  const { id, date, productiveProject, partnerProject, expenseType, quantity, unitValue, currency, observations, expenseRepresentation } =
    args as {
      id: string;
      date?: string;
      productiveProject?: string;
      partnerProject?: string;
      expenseType?: string;
      quantity?: number;
      unitValue?: number;
      currency?: string;
      observations?: string;
      expenseRepresentation?: boolean;
    };

  const existing = findById(id);
  if (!existing) {
    return {
      content: [{ type: 'text', text: `Error: expense entry "${id}" not found.` }],
      isError: true,
    };
  }

  if (existing.status === 'approved') {
    return {
      content: [{ type: 'text', text: `Error: cannot edit an approved entry ("${id}"). Only draft or pending entries can be edited.` }],
      isError: true,
    };
  }

  if (quantity !== undefined && (quantity < 1 || quantity > 1000)) {
    return {
      content: [{ type: 'text', text: 'Error: quantity must be between 1 and 1000.' }],
      isError: true,
    };
  }

  if (unitValue !== undefined && (unitValue <= 0 || unitValue > 100000)) {
    return {
      content: [{ type: 'text', text: 'Error: unitValue must be between 0.01 and 100000.' }],
      isError: true,
    };
  }

  const fields: Record<string, unknown> = {};
  if (date !== undefined) fields.date = date;
  if (productiveProject !== undefined) fields.productiveProject = productiveProject;
  if (partnerProject !== undefined) fields.partnerProject = partnerProject;
  if (expenseType !== undefined) fields.expenseType = expenseType;
  if (quantity !== undefined) fields.quantity = quantity;
  if (unitValue !== undefined) fields.unitValue = unitValue;
  if (currency !== undefined) fields.currency = currency;
  if (observations !== undefined) fields.observations = observations.slice(0, 300);
  if (expenseRepresentation !== undefined) fields.expenseRepresentation = expenseRepresentation;

  const updated = update(id, fields);

  return {
    content: [{ type: 'text', text: JSON.stringify(updated, null, 2) }],
  };
};
