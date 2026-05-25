import { projectsClient } from '../backend/projectsClient';

// Camada de domínio fina sobre projectsClient. Devolve shapes que a UI
// consome directamente: { description, code } para projectos (o código é a
// FK que o backend usa em /api/v1/task/my/{projectCode}); { name, id } para
// tarefas (id é o int FK).
//
// Por defeito filtramos projectos fechados (closureDate != null) — a UI
// nunca quer oferecer projetos arquivados para imputar horas. Tarefas
// vêm filtradas pelo backend através do projectCode.

export interface ProjectOption {
  description: string;
  code: string;
}

export interface TaskOption {
  name: string;
  id: number;
}

export async function fetchProjects(): Promise<ProjectOption[]> {
  const dtos = await projectsClient.listMine();
  return dtos
    .filter((p) => p.closureDate === null && p.id !== null)
    .map((p) => ({
      description: p.description ?? p.id ?? 'Unknown project',
      code: p.id as string,
    }));
}

export async function fetchTasksForProject(projectCode: string): Promise<TaskOption[]> {
  const dtos = await projectsClient.listTasks(projectCode);
  return dtos
    .filter((t) => t.task !== null && t.task !== undefined)
    .map((t) => ({
      name: t.task as string,
      id: t.id,
    }));
}
