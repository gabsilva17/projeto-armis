import type {
  BooleanFriendlyResponseT,
  ImputationDto,
  ProjectSummary,
  ProjectDto,
  TimesheetEntry,
  TimesheetEntryStatus,
} from './types.js';
import { IMP_STATUS } from './types.js';

// Tradução entre o contrato externo (ImputationDto) e o shape que as tools do
// MCP server sempre devolveram (TimesheetEntry). Concentra as "real-API
// quirks" do swagger: id int↔string, datas ISO↔YYYY-MM-DD, enum de estado e
// desembrulho do BooleanFriendlyResponseT.

function impStatusToInternal(s: number | null | undefined): TimesheetEntryStatus {
  switch (s) {
    case IMP_STATUS.APPROVED:
      return 'approved';
    case IMP_STATUS.PENDING:
      return 'pending';
    case IMP_STATUS.REJECTED:
      return 'rejected';
    case IMP_STATUS.DRAFT:
    default:
      return 'draft';
  }
}

function internalStatusToImp(s: TimesheetEntryStatus): number {
  switch (s) {
    case 'approved':
      return IMP_STATUS.APPROVED;
    case 'pending':
      return IMP_STATUS.PENDING;
    case 'rejected':
      return IMP_STATUS.REJECTED;
    case 'draft':
      return IMP_STATUS.DRAFT;
  }
}

// "2026-05-04T09:00:00Z" → "2026-05-04"
function isoToYmd(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

function ymdToStartIso(ymd: string): string {
  return `${ymd}T09:00:00Z`;
}

function ymdToEndIso(ymd: string, hours: number): string {
  const endHour = Math.min(23, 9 + Math.max(1, Math.round(hours)));
  const hh = String(endHour).padStart(2, '0');
  return `${ymd}T${hh}:00:00Z`;
}

export function imputationToTimesheetEntry(dto: ImputationDto): TimesheetEntry {
  return {
    id: String(dto.id),
    date: isoToYmd(dto.startDate),
    project: dto.project?.description ?? dto.project?.id ?? 'Unknown project',
    task: dto.task?.task ?? 'Unknown task',
    hours: dto.nHours ?? 0,
    status: impStatusToInternal(dto.impStatus),
  };
}

export function imputationsToTimesheetEntries(dtos: ImputationDto[]): TimesheetEntry[] {
  return dtos.map(imputationToTimesheetEntry);
}

// Contexto que o domínio interno não carrega mas o backend exige no DTO.
export interface NewImputationContext {
  username: string;
  projectId: string;
  taskId: number;
}

export function timesheetEntryToNewImputation(
  entry: Omit<TimesheetEntry, 'id'>,
  ctx: NewImputationContext,
): ImputationDto {
  const [yearStr, monthStr] = entry.date.split('-');
  return {
    id: 0, // backend atribui o id real
    username: ctx.username,
    year: Number(yearStr),
    month: Number(monthStr),
    startDate: ymdToStartIso(entry.date),
    endDate: ymdToEndIso(entry.date, entry.hours),
    nHours: entry.hours,
    impStatus: internalStatusToImp(entry.status),
    approvalStatus: entry.status === 'approved',
    approved: entry.status === 'approved',
    project: {
      id: ctx.projectId,
      description: null,
      managerName: null,
      startDate: null,
      endDate: null,
      closureDate: null,
    },
    task: { id: ctx.taskId },
  };
}

export function timesheetEntryToUpdatedImputation(
  entry: TimesheetEntry,
  ctx: NewImputationContext,
): ImputationDto {
  return {
    ...timesheetEntryToNewImputation(entry, ctx),
    id: Number(entry.id),
  };
}

// O backend devolve BooleanFriendlyResponseT em writes. `content === false`
// significa rejeição (validação/permissão) — propagamos via throw para que
// o tool handler converta num ToolResult de erro.
export function unwrapBooleanResponse(res: BooleanFriendlyResponseT): true {
  if (!res.content) {
    throw new Error(res.message ?? 'Backend rejected the request');
  }
  return true;
}

// Adapta ProjectDto (wire) → ProjectSummary (shape histórica das tools).
// description→name, id→code. `active` é derivado de closureDate=null porque
// o swagger não expõe um campo `active` directo.
export function projectDtoToSummary(dto: ProjectDto): ProjectSummary {
  return {
    id: dto.id ?? '',
    name: dto.description ?? dto.id ?? 'Unknown project',
    code: dto.id ?? '',
    active: dto.closureDate === null,
  };
}
