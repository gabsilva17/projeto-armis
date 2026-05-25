import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

let cachedEmployee: Record<string, unknown> | null = null;

function loadEmployee(): Record<string, unknown> {
  if (!cachedEmployee) {
    const raw = readFileSync(join(__dirname, 'fixtures', 'employee.json'), 'utf-8');
    cachedEmployee = JSON.parse(raw) as Record<string, unknown>;
  }
  return cachedEmployee;
}

export const getEmployeeInfoDefinition: ToolDefinition = {
  name: 'getEmployeeInfo',
  description: "Get the current user's profile, including name, role, department, and work schedule.",
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export const getEmployeeInfoHandler: ToolHandler = async (): Promise<ToolResult> => {
  const employee = loadEmployee();

  return {
    content: [{ type: 'text', text: JSON.stringify(employee, null, 2) }],
  };
};
