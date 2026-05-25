import type { ProjectDto, TaskDto } from './types.js';
import { backendRequest } from './httpClient.js';

// Wire calls a /api/v1/project/my e /api/v1/task/my — ver swagger.json.

export const projectsClient = {
  listMine(): Promise<ProjectDto[]> {
    return backendRequest<ProjectDto[]>('/project/my');
  },

  listMineInRange(startDate: string, endDate: string): Promise<ProjectDto[]> {
    return backendRequest<ProjectDto[]>(
      `/project/my/${encodeURIComponent(startDate)}/${encodeURIComponent(endDate)}`,
    );
  },

  listTasks(projectCode: string): Promise<TaskDto[]> {
    return backendRequest<TaskDto[]>(`/task/my/${encodeURIComponent(projectCode)}`);
  },
};
