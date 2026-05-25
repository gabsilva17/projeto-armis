import type { BooleanFriendlyResponseT, ImputationDto } from '../../types/backend.types';
import { IMP_STATUS } from '../../types/backend.types';
import type { TimesheetEntry, TimesheetEntryStatus } from '../../types/timesheets';

// Tradução entre o contrato externo (ImputationDto) e o domínio interno
// (TimesheetEntry). Concentra todas as discrepâncias que o REFACTOR_PLAN.md
// chama de "real-API quirks": id int↔string, datas ISO↔YYYY-MM-DD, enum de
// estado e desembrulho do BooleanFriendlyResponseT.

function impStatusToInternal(s: number | null | undefined): TimesheetEntryStatus {
  switch (s) {
    case IMP_STATUS.APPROVED:
      return 'approved';
    case IMP_STATUS.PENDING:
      return 'pending';
    case IMP_STATUS.REJECTED:
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
    case 'draft':
      return IMP_STATUS.DRAFT;
  }
}

// "2026-05-04T09:00:00Z" → "2026-05-04". Slice é seguro porque o swagger
// declara `date-time` ISO 8601.
function isoToYmd(iso: string | null | undefined): string {
  if (!iso) return '';
  return iso.slice(0, 10);
}

// "2026-05-04" + hora local → ISO date-time UTC. Usamos T00:00:00Z porque o
// nosso domínio interno só rastreia data (não horas); startDate/endDate são
// exigidos pelo backend mas só usados para apresentação. Phase 3 pode refinar
// se a UI passar a expor a janela horária.
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

// Contexto que o domínio interno NÃO carrega mas o backend exige (username,
// FKs project/task). Phase 3 vai resolver projeto/tarefa por nome → id via
// projectsClient antes de chamar este builder.
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
// significa rejeição de domínio (validação, permissão) e deve aparecer ao
// utilizador. Lançamos para que o caller decida como surfacear.
export function unwrapBooleanResponse(res: BooleanFriendlyResponseT): true {
  if (!res.content) {
    throw new Error(res.message ?? 'Backend rejected the request');
  }
  return true;
}
