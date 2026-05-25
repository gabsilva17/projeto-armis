// Mirror dos DTOs do backend real (Digital Hub .NET), derivados de swagger.json.
// É o contrato a que o backend client em src/services/backend/ obedece. Mantemos
// field names, ordem e nullability fiéis ao swagger para que o swap mock → real
// seja só env-var, sem ajustes de tipos.
//
// Quando o swagger mudar, atualizar este ficheiro PRIMEIRO — depois o resto da
// camada de serviços compila contra ele.

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
  id: number; // int32, required
}

// ── ImputationDto ───────────────────────────────────────────────────
// Domínio interno chama-lhe "timesheet entry". O rename acontece no adapter.
export interface ImputationDto {
  manager?: string | null;
  impStatus?: number | null; // int32 — enum inferido em IMP_STATUS abaixo
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
  id: number; // int32, required
}

// ── HolidayDto / VacationInfoDto ────────────────────────────────────
export interface HolidayDto {
  name?: string | null;
  date: string;
}

export interface VacationInfoDto {
  totalVacationDays: number;
  totalVacationDaysLeft: number;
  totalPlannedVacationDays: number;
}

// ── Envelopes ───────────────────────────────────────────────────────
export interface BooleanFriendlyResponseT {
  tracking?: string | null;
  message?: string | null;
  content: boolean;
}

export interface ImputationDtoPagedResponseT {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  hasPrevious: boolean;
  hasNext: boolean;
  entries?: ImputationDto[] | null;
  tokenPageNavigation?: string | null;
}

// ── Error responses ─────────────────────────────────────────────────
export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [k: string]: unknown;
}

export interface UnAuthorizedResponse {
  code?: string | null;
  message?: string | null;
}

export type ForbiddenResponse = UnAuthorizedResponse;
export type ExceptionResponse = UnAuthorizedResponse;

// ── impStatus (INFERIDO — swagger declara só int32) ─────────────────
// TODO(imp-status): confirmar com backend quando estiver disponível.
export const IMP_STATUS = {
  DRAFT: 0,
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const;
export type ImpStatusCode = (typeof IMP_STATUS)[keyof typeof IMP_STATUS];

// ── ExpenseDto (TODO(expenses-contract)) ────────────────────────────
// Shape especulativo até o backend definir o contrato real. Espelha o
// ManualExpenseEntry atual do mobile. Quando o contrato real chegar,
// substituir esta secção e o expensesClient/adapter — grep por
// "TODO(expenses-contract)" para encontrar todos os pontos.
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
