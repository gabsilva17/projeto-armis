import type { MonthSummary, TimesheetEntry } from '@/src/types/timesheets';
import { BACKEND_AUTH } from '@/src/constants/backend.constants';
import { imputationsClient } from '../backend/imputationsClient';
import { projectsClient } from '../backend/projectsClient';
import {
  imputationsToTimesheetEntries,
  timesheetEntryToNewImputation,
  timesheetEntryToUpdatedImputation,
  unwrapBooleanResponse,
} from '../adapters/imputationsAdapter';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildMonthSummary(year: number, month: number, entries: TimesheetEntry[]): MonthSummary {
  const monthEntries = entries.filter((e) => {
    const [y, m] = e.date.split('-').map(Number);
    return y === year && m === month + 1;
  });

  const days: MonthSummary['days'] = {};

  for (const entry of monthEntries) {
    if (!days[entry.date]) {
      days[entry.date] = { date: entry.date, totalHours: 0, entries: [] };
    }
    days[entry.date].totalHours += entry.hours;
    days[entry.date].entries.push(entry);
  }

  const totalHours = Object.values(days).reduce((acc, d) => acc + d.totalHours, 0);

  return {
    year,
    month,
    totalHours,
    totalDaysLogged: Object.keys(days).length,
    days,
  };
}

// O backend só expõe leituras month-by-month (/imputation/my/{year}/{month}).
// Phase 3 mantém o contrato "carregar tudo" do store carregando uma janela de
// meses em paralelo. TODO(month-by-month): mover o store para lazy-load por mês
// quando o utilizador navegar — alinha-se 1:1 com o endpoint real.
const FETCH_MONTHS_BACK = 11;
const FETCH_MONTHS_FORWARD = 1;

function listFetchWindow(reference: Date): Array<{ year: number; month: number }> {
  const months: Array<{ year: number; month: number }> = [];
  for (let offset = -FETCH_MONTHS_BACK; offset <= FETCH_MONTHS_FORWARD; offset++) {
    const d = new Date(reference.getFullYear(), reference.getMonth() + offset, 1);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return months;
}

// Resolve project description + task name → FKs que o backend exige no DTO de
// criação. O domínio interno só conhece nomes; a tradução vive aqui em vez do
// adapter porque envolve I/O. Match case-insensitive trim para tolerar
// inconsistências de capitalização dos formulários.
async function resolveProjectTask(
  projectName: string,
  taskName: string,
): Promise<{ projectId: string; taskId: number }> {
  const normalizedProject = projectName.trim().toLowerCase();
  const normalizedTask = taskName.trim().toLowerCase();

  const projects = await projectsClient.listMine();
  const project =
    projects.find((p) => p.description?.trim().toLowerCase() === normalizedProject) ??
    projects.find((p) => p.id?.trim().toLowerCase() === normalizedProject);
  if (!project || !project.id) {
    throw new Error(`Project "${projectName}" not found in backend.`);
  }

  const tasks = await projectsClient.listTasks(project.id);
  const task = tasks.find((t) => t.task?.trim().toLowerCase() === normalizedTask);
  if (!task) {
    throw new Error(`Task "${taskName}" not found in project "${projectName}".`);
  }

  return { projectId: project.id, taskId: task.id };
}

function parseImputationId(id: string): number {
  const numeric = Number(id);
  if (!Number.isFinite(numeric) || !Number.isInteger(numeric)) {
    throw new Error(`Imputation id must be an integer (received "${id}").`);
  }
  return numeric;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export async function fetchAllTimesheets(): Promise<TimesheetEntry[]> {
  const months = listFetchWindow(new Date());
  const results = await Promise.all(
    months.map(({ year, month }) => imputationsClient.getMonth(year, month)),
  );
  return imputationsToTimesheetEntries(results.flat());
}

export async function createTimesheet(entry: TimesheetEntry): Promise<void> {
  const { projectId, taskId } = await resolveProjectTask(entry.project, entry.task);
  const dto = timesheetEntryToNewImputation(entry, {
    username: BACKEND_AUTH.claims.nameidentifier,
    projectId,
    taskId,
  });
  unwrapBooleanResponse(await imputationsClient.create(dto));
}

export async function updateTimesheet(id: string, entry: TimesheetEntry): Promise<void> {
  const numericId = parseImputationId(id);
  const { projectId, taskId } = await resolveProjectTask(entry.project, entry.task);
  const dto = timesheetEntryToUpdatedImputation(
    { ...entry, id },
    {
      username: BACKEND_AUTH.claims.nameidentifier,
      projectId,
      taskId,
    },
  );
  unwrapBooleanResponse(await imputationsClient.update(numericId, dto));
}

export async function deleteTimesheet(id: string): Promise<void> {
  const numericId = parseImputationId(id);
  unwrapBooleanResponse(await imputationsClient.remove(numericId));
}

export { buildMonthSummary };
