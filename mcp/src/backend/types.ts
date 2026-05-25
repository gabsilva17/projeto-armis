// Mirror dos DTOs do backend real (Digital Hub .NET), derivados de swagger.json.
// Mesma fonte de verdade usada pelo mobile (armini/src/types/backend.types.ts) —
// mantemos field names, ordem e nullability fiéis ao contrato para que o swap
// mock → backend real seja só env-var, sem ajustes de tipos.

// ── ProjectDto ──────────────────────────────────────────────────────
export interface ProjectDto {
  description: string | null;
  managerName: string | null;
  startDate: string | null; // ISO date-time
  endDate: string | null;
  closureDate: string | null;
  id: string | null;
}

// ── TaskDto ─────────────────────────────────────────────────────────
export interface TaskDto {
  projectCode?: string | null;
  username?: string | null;
  task?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  nHours?: number | null;
  cost?: number | null;
  perc?: number | null;
  phase?: string | null;
  sellHour?: number | null;
  budgetId?: number | null;
  projectExternalManagementId?: number | null;
  id: number; // int32
}

// ── ImputationDto (timesheet entry no domínio interno) ──────────────
export interface ImputationDto {
  manager?: string | null;
  impStatus?: number | null;
  username?: string | null;
  year?: number | null;
  month?: number | null;
  startDate?: string | null;
  endDate?: string | null;
  nHours?: number | null;
  costTotalHours?: number | null;
  costUnitHours?: number | null;
  approvalStatus?: boolean | null;
  approved?: boolean | null;
  approver?: string | null;
  dispachts?: string | null;
  observation?: string | null;
  fAllDayEvent?: boolean | null;
  typeAbsent?: string | null;
  typeAbsentOthers?: string | null;
  nHoursSell?: number | null;
  costUnitHoursSell?: number | null;
  costTotalHoursSell?: number | null;
  notesHoursSell?: string | null;
  peopleHubId?: number | null;
  project?: ProjectDto;
  task?: TaskDto;
  id: number; // int32
}

// ── Envelopes ───────────────────────────────────────────────────────
export interface BooleanFriendlyResponseT {
  tracking?: string | null;
  message?: string | null;
  content: boolean;
}

// ── impStatus enum (INFERIDO — swagger declara só int32) ────────────
// TODO(imp-status): confirmar com backend quando estiver disponível.
export const IMP_STATUS = {
  DRAFT: 0,
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const;
export type ImpStatusCode = (typeof IMP_STATUS)[keyof typeof IMP_STATUS];

// ── ExpenseDto (TODO(expenses-contract)) ────────────────────────────
// Shape especulativo — espelha o ExpenseDto do mock-backend. Quando o
// contrato real existir, substituir esta secção.
export type ExpenseStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface ExpenseDto {
  id: string;
  date: string; // ISO date-time
  productiveProject: string;
  partnerProject: string;
  expenseType: string;
  quantity: number;
  unitValue: number;
  currency: string;
  observations: string;
  expenseRepresentation: boolean;
  status: ExpenseStatus;
}

// ── Domínio interno (mesmas shapes que as tools sempre expuseram) ───
// Mantidas aqui em vez de duplicar nos tools — os adapters traduzem
// destes para os DTOs externos. Se a UI/AI quiserem mais campos, alargar.
export type TimesheetEntryStatus = 'draft' | 'pending' | 'approved' | 'rejected';

export interface TimesheetEntry {
  id: string;
  date: string; // YYYY-MM-DD
  project: string; // human-readable description
  task: string;
  hours: number;
  status: TimesheetEntryStatus;
}

export interface ExpenseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  productiveProject: string;
  partnerProject: string;
  expenseType: string;
  quantity: number;
  unitValue: number;
  currency: string;
  observations: string;
  expenseRepresentation: boolean;
  status: string;
}

// Forma "amigável" de Project que as tools devolviam quando ainda liam
// projects.json local — mantida para que a observação do AI Companion não
// mude depois do switch para o backend.
export interface ProjectSummary {
  id: string;
  name: string;
  code: string;
  active: boolean;
}
