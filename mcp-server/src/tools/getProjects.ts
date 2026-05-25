import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

interface Project {
  id: string;
  name: string;
  code: string;
  active: boolean;
}

let cachedProjects: Project[] | null = null;

function loadProjects(): Project[] {
  if (!cachedProjects) {
    const raw = readFileSync(join(__dirname, 'fixtures', 'projects.json'), 'utf-8');
    cachedProjects = JSON.parse(raw) as Project[];
  }
  return cachedProjects;
}

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
  let projects = loadProjects();
  if (activeOnly) {
    projects = projects.filter((p) => p.active);
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(projects, null, 2) }],
  };
};
