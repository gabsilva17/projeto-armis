// Tipos derivados de swagger.json (DH.PeopleHUB.Backend.EndPoints.Api v1).
// Mantém field names, ordem e nullability fiéis ao contrato real para que o swap
// mock → backend real não exija alterações de tipos.

// ── ProjectDto ──────────────────────────────────────────────────────
export interface ProjectDto {
  description: string | null;
  managerName: string | null;
  startDate: string | null; // ISO date-time
  endDate: string | null; // ISO date-time
  closureDate: string | null; // ISO date-time
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
  id: number; // int32, required, non-nullable
}

// ── ImputationDto (timesheet entry) ─────────────────────────────────
// O nosso domínio interno chama-lhe "timesheet entry" — o adapter mobile
// faz a tradução. Ver REFACTOR_PLAN.md § Decisions locked in.
export interface ImputationDto {
  manager?: string | null;
  impStatus?: number | null; // int32; enum não declarado em swagger — inferido em fixtures
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
  id: number; // int32, required, non-nullable
}

// ── HolidayDto ──────────────────────────────────────────────────────
export interface HolidayDto {
  name?: string | null;
  date: string; // ISO date-time, non-nullable per swagger
}

// ── VacationInfoDto ─────────────────────────────────────────────────
export interface VacationInfoDto {
  totalVacationDays: number;
  totalVacationDaysLeft: number;
  totalPlannedVacationDays: number;
}

// ── ImputationKpisDto ───────────────────────────────────────────────
export interface ImputationKpisDto {
  hours?: number | null;
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

export interface PagedRequestOrderByProperty {
  property?: string | null;
  asc: boolean;
}

export interface DomainRepositoryQueryRule {
  label?: string | null;
  field?: string | null;
  operator?: string | null;
  type?: string | null;
  value?: string | null;
  condition?: string | null;
  rules?: DomainRepositoryQueryRule[] | null;
}

export interface DomainRepositoryQuery {
  condition?: string | null;
  rules?: DomainRepositoryQueryRule[] | null;
}

export interface PagedRequest {
  selectProperties?: string[] | null;
  pageNumber: number;
  pageSize?: number | null;
  orderBy?: PagedRequestOrderByProperty;
  query?: DomainRepositoryQuery;
  tokenPageNavigation?: string | null;
}

// ── Error responses ─────────────────────────────────────────────────
export interface ProblemDetails {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [k: string]: unknown; // additionalProperties: {}
}

export interface UnAuthorizedResponse {
  code?: string | null;
  message?: string | null;
}

export interface ForbiddenResponse {
  code?: string | null;
  message?: string | null;
}

export interface ExceptionResponse {
  code?: string | null;
  message?: string | null;
}

// ── impStatus enum (INFERIDO — não declarado em swagger) ────────────
// O backend real usa um int para o estado da imputação. O swagger não
// declara o enum. Aqui registamos a mapping que o mock usa, baseado nos
// estados que a UI já conhece (draft/pending/approved).
// TODO(imp-status): confirmar com a equipa backend quando estiver disponível.
export const IMP_STATUS = {
  DRAFT: 0,
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
} as const;
export type ImpStatusCode = (typeof IMP_STATUS)[keyof typeof IMP_STATUS];
