import type { ManualExpenseEntry } from '../../types/finances.types';

export interface ExpenseEntryApi {
  id: string | number;
  date: string;
  productiveProject?: string;
  partnerProject?: string;
  expenseType?: string;
  quantity?: number | string;
  unitValue?: number | string;
  currency?: string;
  observations?: string;
  expenseRepresentation?: boolean;
  status?: string;
}

/**
 * Converte YYYY-MM-DD → MM/DD/YYYY (formato do formulário cliente).
 */
function convertDateToForm(isoDate: string): string {
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[1]}/${parts[2]}/${parts[0]}`;
  }
  return isoDate;
}

export function adaptExpenseEntry(api: ExpenseEntryApi): ManualExpenseEntry {
  return {
    id: String(api.id),
    date: convertDateToForm(api.date),
    productiveProject: api.productiveProject ?? 'Digital Hub',
    partnerProject: api.partnerProject ?? 'None',
    expenseType: api.expenseType ?? 'Others',
    quantity: String(api.quantity ?? 1),
    unitValue: String(api.unitValue ?? 0),
    currency: api.currency ?? 'EUR',
    observations: api.observations ?? '',
    expenseRepresentation: api.expenseRepresentation ?? false,
    createdAtLabel: new Date().toLocaleDateString('pt-PT'),
  };
}
