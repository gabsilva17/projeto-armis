import projectsSeed from './fixtures/projects.json' with { type: 'json' };
import tasksSeed from './fixtures/tasks.json' with { type: 'json' };
import type { ProjectDto, TaskDto } from '../types/api.js';

const projects: ProjectDto[] = projectsSeed as ProjectDto[];
const tasks: TaskDto[] = tasksSeed as TaskDto[];

export function getAllProjects(): ProjectDto[] {
  return projects;
}

export function getProjectsInRange(startDate: string, endDate: string): ProjectDto[] {
  // Devolve projetos cujo período se sobrepõe ao intervalo pedido.
  return projects.filter((p) => {
    const ps = p.startDate ?? '0000-01-01';
    const pe = p.endDate ?? '9999-12-31';
    return ps <= endDate && pe >= startDate;
  });
}

export function getProjectById(id: string): ProjectDto | undefined {
  return projects.find((p) => p.id === id);
}

export function getAllTasks(): TaskDto[] {
  return tasks;
}

export function getTasksByProjectCode(projectCode: string): TaskDto[] {
  return tasks.filter((t) => t.projectCode === projectCode);
}

export function getTaskById(id: number): TaskDto | undefined {
  return tasks.find((t) => t.id === id);
}
