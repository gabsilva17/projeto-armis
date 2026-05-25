// TODO(expenses-contract): real API contract not yet defined in swagger.json.
// Shape externo (ExpenseDto) é especulativo — ver backend.types.ts. Este
// adapter existe para que, quando o contrato real chegar, exista um único
// ponto a actualizar entre o expensesClient e o domínio interno.

import type { ExpenseDto, ExpenseStatus } from '../../types/backend.types';
import type { ManualExpenseEntry } from '../../types/finances.types';

// "2026-05-04T09:00:00Z" → "05/04/2026" (formato do formulário cliente,
// herdado de adapters/expensesAdapter.ts).
function isoToFormDate(iso: string): string {
  if (!iso) return '';
  const ymd = iso.slice(0, 10);
  const parts = ymd.split('-');
  if (parts.length !== 3) return iso;
  return `${parts[1]}/${parts[2]}/${parts[0]}`;
}

// "MM/DD/YYYY" → "YYYY-MM-DDT00:00:00Z". Se o input já é ISO, devolve como está.
function formDateToIso(form: string): string {
  if (!form) return '';
  if (form.includes('T')) return form;
  const parts = form.split('/');
  if (parts.length === 3) {
    return `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}T00:00:00Z`;
  }
  // Fallback: assume YYYY-MM-DD.
  return `${form}T00:00:00Z`;
}

// ManualExpenseEntry ainda não tem campo de status — o `dto.status` é
// descartado neste mapping. Quando a UI passar a refletir aprovações,
// adicionar o campo a ManualExpenseEntry e propagá-lo aqui.

export function expenseDtoToManualEntry(dto: ExpenseDto): ManualExpenseEntry {
  return {
    id: dto.id,
    date: isoToFormDate(dto.date),
    productiveProject: dto.productiveProject,
    partnerProject: dto.partnerProject,
    expenseType: dto.expenseType,
    quantity: String(dto.quantity),
    unitValue: String(dto.unitValue),
    currency: dto.currency,
    observations: dto.observations,
    expenseRepresentation: dto.expenseRepresentation,
    createdAtLabel: new Date().toLocaleDateString('pt-PT'),
  };
}

export function manualEntryToExpenseDto(
  entry: ManualExpenseEntry,
  status: ExpenseStatus = 'draft',
): ExpenseDto {
  return {
    id: entry.id,
    date: formDateToIso(entry.date),
    productiveProject: entry.productiveProject,
    partnerProject: entry.partnerProject,
    expenseType: entry.expenseType,
    quantity: Number(entry.quantity) || 0,
    unitValue: Number(entry.unitValue) || 0,
    currency: entry.currency,
    observations: entry.observations,
    expenseRepresentation: entry.expenseRepresentation,
    status,
  };
}
