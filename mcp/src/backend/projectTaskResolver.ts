import { projectsClient } from './projectsClient.js';

// As tools recebem project name + task description em strings (legado do
// shape TimesheetEntry). O backend exige FKs (projectId string + taskId int).
// Match case-insensitive trim para tolerar inconsistências de capitalização.
// Mesma lógica que o mobile usa em timesheetsService.ts — duplicada aqui em
// vez de fazer cross-project import (cada projeto é independente).

export async function resolveProjectTask(
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
