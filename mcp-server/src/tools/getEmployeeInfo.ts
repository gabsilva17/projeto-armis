import type { ToolDefinition, ToolHandler, ToolResult } from './types.js';
import { env } from '../config/env.js';

// O swagger não expõe `/me` — a identidade do utilizador chega via x-corehub-*
// claim headers, não via lookup no backend. Por isso este tool não chama o
// backend client: deriva o perfil dos defaults de dev declarados em env.ts.
// Quando a wiring real de auth chegar, os claims passarão a vir do JWT/headers
// recebidos pelo /mcp e o shape é o mesmo.
//
// TODO(auth): quando o /mcp passar a receber claims do mobile, ler daí em vez
// dos defaults de dev.

export const getEmployeeInfoDefinition: ToolDefinition = {
  name: 'getEmployeeInfo',
  description: "Get the current user's profile, including name, role, department, and work schedule.",
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export const getEmployeeInfoHandler: ToolHandler = async (): Promise<ToolResult> => {
  const username = env.BACKEND_USERNAME;
  const employee = {
    id: username,
    name: username.charAt(0).toUpperCase() + username.slice(1),
    email: `${username}@armis.local`,
    role: 'Software Developer Intern',
    department: 'Engineering',
    workSchedule: {
      type: 'full-time',
      hoursPerDay: 8,
      workDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
    },
  };

  return {
    content: [{ type: 'text', text: JSON.stringify(employee, null, 2) }],
  };
};
