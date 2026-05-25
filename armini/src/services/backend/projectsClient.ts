import type { ProjectDto, TaskDto } from '../../types/backend.types';
import { backendRequest } from './httpClient';

// Wire calls a /api/v1/project/my e /api/v1/task/my — ver swagger.json.

export const projectsClient = {
  listMine(): Promise<ProjectDto[]> {
    return backendRequest<ProjectDto[]>('/project/my');
  },

  // startDate / endDate em ISO 8601 (date-time). O backend filtra projetos cujo
  // período se sobreponha ao intervalo pedido.
  listMineInRange(startDate: string, endDate: string): Promise<ProjectDto[]> {
    return backendRequest<ProjectDto[]>(
      `/project/my/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`,
    );
  },

  listTasks(projectCode: string): Promise<TaskDto[]> {
    return backendRequest<TaskDto[]>(`/task/my/${encodeURIComponent(projectCode)}`);
  },
};
