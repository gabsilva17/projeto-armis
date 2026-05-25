import imputationsSeed from './fixtures/imputations.json' with { type: 'json' };
import { getProjectById, getTaskById } from './projectsStore.js';
import type { ImputationDto } from '../types/api.js';

// Forma de armazenamento interna — referencia project/task por FK em vez de
// duplicar o DTO inteiro em cada linha. Na resposta da API expandimos para o
// shape oficial (ImputationDto com project/task embedded).
interface ImputationSeed extends Omit<ImputationDto, 'project' | 'task'> {
  projectId: string;
  taskId: number;
}

const seed: ImputationSeed[] = imputationsSeed as ImputationSeed[];

type StoredImputation = ImputationSeed;

const store: StoredImputation[] = [...seed];
let nextId = store.reduce((max, e) => Math.max(max, e.id), 0) + 1;

function expand(row: StoredImputation): ImputationDto {
  const { projectId, taskId, ...rest } = row;
  return {
    ...rest,
    project: getProjectById(projectId),
    task: getTaskById(taskId),
  };
}

export function getAllImputations(): ImputationDto[] {
  return store.map(expand);
}

export function getImputationsByMonth(year: number, month: number): ImputationDto[] {
  return store.filter((e) => e.year === year && e.month === month).map(expand);
}

export function getImputationById(id: number): ImputationDto | undefined {
  const row = store.find((e) => e.id === id);
  return row ? expand(row) : undefined;
}

// Cria uma entrada a partir do DTO recebido. Quando o cliente envia project/task
// completos, gravamos apenas os ids. O backend real provavelmente faz validação
// adicional — aqui assume-se input já válido.
export function createImputation(dto: ImputationDto): ImputationDto {
  const id = nextId++;
  const projectId = dto.project?.id ?? '';
  const taskId = dto.task?.id ?? 0;
  const row: StoredImputation = {
    ...stripJoins(dto),
    id,
    projectId,
    taskId,
  };
  store.push(row);
  return expand(row);
}

export function updateImputation(id: number, dto: ImputationDto): ImputationDto | undefined {
  const idx = store.findIndex((e) => e.id === id);
  if (idx === -1) return undefined;
  const existing = store[idx]!;
  const projectId = dto.project?.id ?? existing.projectId;
  const taskId = dto.task?.id ?? existing.taskId;
  const next: StoredImputation = {
    ...existing,
    ...stripJoins(dto),
    id,
    projectId,
    taskId,
  };
  store[idx] = next;
  return expand(next);
}

export function removeImputation(id: number): boolean {
  const idx = store.findIndex((e) => e.id === id);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
}

function stripJoins(dto: ImputationDto): Omit<ImputationDto, 'project' | 'task'> {
  const { project: _p, task: _t, ...rest } = dto;
  return rest;
}
