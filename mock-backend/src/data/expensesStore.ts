// TODO(expenses-contract): real API contract not yet defined in swagger.json.
// Esta store é especulativa. Quando o backend expuser endpoints reais de despesas,
// substituir tipos e operações pelos DTOs corretos.

import expensesSeed from './fixtures/expenses.json' with { type: 'json' };
import type { ExpenseDto } from '../types/expense.js';

const store: ExpenseDto[] = [...(expensesSeed as ExpenseDto[])];

export function getAllExpenses(): ExpenseDto[] {
  return store;
}

export function getExpenseById(id: string): ExpenseDto | undefined {
  return store.find((e) => e.id === id);
}

export function createExpense(dto: ExpenseDto): ExpenseDto {
  const id = dto.id || `exp${Date.now()}`;
  const next: ExpenseDto = { ...dto, id };
  store.unshift(next);
  return next;
}

export function updateExpense(id: string, dto: ExpenseDto): ExpenseDto | undefined {
  const idx = store.findIndex((e) => e.id === id);
  if (idx === -1) return undefined;
  store[idx] = { ...store[idx]!, ...dto, id };
  return store[idx];
}

export function removeExpense(id: string): boolean {
  const idx = store.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
}
