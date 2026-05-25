// TODO(expenses-contract): real API contract not yet defined in swagger.json.
// Os paths e shapes usados aqui são especulativos — quando o contrato real
// chegar, ajustar primeiro o backend client e o adapter.

import type { BooleanFriendlyResponseT } from '@/src/types/backend.types';
import type { ManualExpenseEntry, ManualExpenseForm } from '@/src/types/finances.types';
import { expensesClient } from '../backend/expensesClient';
import {
  expenseDtoToManualEntry,
  manualEntryToExpenseDto,
} from '../adapters/expensesBackendAdapter';

function withDefaults(form: ManualExpenseForm, id: string): ManualExpenseEntry {
  return {
    ...form,
    id,
    createdAtLabel: new Date().toLocaleDateString('pt-PT'),
  };
}

function ensureContent(res: BooleanFriendlyResponseT, fallback: string): void {
  if (!res.content) throw new Error(res.message ?? fallback);
}

export async function fetchAllExpenses(): Promise<ManualExpenseEntry[]> {
  const dtos = await expensesClient.listMine();
  return dtos.map(expenseDtoToManualEntry);
}

// O mock devolve o id real no payload do POST (ExpenseCreatedResponse). Caso
// chegue vazio (ex: backend real ainda não suporta), caímos para um id local
// temporário — o refresh do caller substitui pelo real no próximo fetch.
export async function createExpense(input: ManualExpenseForm): Promise<ManualExpenseEntry> {
  const tempEntry = withDefaults(input, '');
  const dto = manualEntryToExpenseDto(tempEntry);
  const res = await expensesClient.create(dto);
  ensureContent(res, 'Backend rejected the expense create.');
  const id = res.id ?? `local-${Date.now()}`;
  return withDefaults(input, id);
}

export async function updateExpense(id: string, input: ManualExpenseForm): Promise<ManualExpenseEntry> {
  const entry = withDefaults(input, id);
  const dto = manualEntryToExpenseDto(entry);
  const res = await expensesClient.update(id, dto);
  ensureContent(res, 'Backend rejected the expense update.');
  return entry;
}

export async function deleteExpense(id: string): Promise<void> {
  const res = await expensesClient.remove(id);
  ensureContent(res, 'Backend rejected the expense delete.');
}
