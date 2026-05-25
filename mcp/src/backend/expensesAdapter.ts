// TODO(expenses-contract): real API contract not yet defined in swagger.json.
// Shape externo (ExpenseDto) é especulativo — ver types.ts. Quando o contrato
// real chegar, ajustar este adapter primeiro.

import type { ExpenseDto, ExpenseEntry, ExpenseStatus } from './types.js';

const KNOWN_STATUSES = new Set<ExpenseStatus>(['draft', 'pending', 'approved', 'rejected']);

function isExpenseStatus(s: string): s is ExpenseStatus {
  return KNOWN_STATUSES.has(s as ExpenseStatus);
}

// ISO date-time ↔ YYYY-MM-DD. As tools sempre operaram sobre YYYY-MM-DD, o
// wire usa ISO 8601.
function isoToYmd(iso: string): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function ymdToIso(ymd: string): string {
  if (!ymd) return '';
  if (ymd.includes('T')) return ymd;
  return `${ymd}T00:00:00Z`;
}

export function expenseDtoToEntry(dto: ExpenseDto): ExpenseEntry {
  return {
    id: dto.id,
    date: isoToYmd(dto.date),
    productiveProject: dto.productiveProject,
    partnerProject: dto.partnerProject,
    expenseType: dto.expenseType,
    quantity: dto.quantity,
    unitValue: dto.unitValue,
    currency: dto.currency,
    observations: dto.observations,
    expenseRepresentation: dto.expenseRepresentation,
    status: dto.status,
  };
}

export function expenseEntryToDto(entry: ExpenseEntry): ExpenseDto {
  const status = isExpenseStatus(entry.status) ? entry.status : 'draft';
  return {
    id: entry.id,
    date: ymdToIso(entry.date),
    productiveProject: entry.productiveProject,
    partnerProject: entry.partnerProject,
    expenseType: entry.expenseType,
    quantity: entry.quantity,
    unitValue: entry.unitValue,
    currency: entry.currency,
    observations: entry.observations,
    expenseRepresentation: entry.expenseRepresentation,
    status,
  };
}
