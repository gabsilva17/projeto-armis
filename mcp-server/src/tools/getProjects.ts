import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { projectsClient } from '../backend/projectsClient.js';
import { projectDtoToSummary } from '../backend/imputationsAdapter.js';
import { BackendError } from '../backend/httpClient.js';

export const getProjectsDefinition: ToolDefinition = {
  name: 'getProjects',
  description: 'List all available projects the user can log time or expenses against.',
  inputSchema: {
    type: 'object',
    properties: {
      activeOnly: { type: 'boolean', description: 'If true, only return active projects (default: true)' },
    },
  },
};

export const getProjectsHandler: ToolHandler = async (args): Promise<ToolResult> => {
  const { activeOnly = true } = args as { activeOnly?: boolean };

  try {
    const dtos = await projectsClient.listMine();
    let projects = dtos.map(projectDtoToSummary);
    if (activeOnly) projects = projects.filter((p) => p.active);

    return {
      content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }],
    };
  } catch (err) {
    const message = err instanceof BackendError ? err.message : 'Failed to fetch projects';
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
};
