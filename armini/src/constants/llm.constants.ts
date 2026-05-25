import Constants from 'expo-constants';

const MCP_PORT = 3001;

function resolveMcpBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_MCP_URL) return process.env.EXPO_PUBLIC_MCP_URL;

  // Em dev, derivar o host a partir do Metro bundler — segue o IP da máquina
  // automaticamente entre redes Wi-Fi sem precisar recompilar nem editar .env.
  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:${MCP_PORT}`;
  }

  return `http://localhost:${MCP_PORT}`;
}

export const MCP_CONFIG = {
  baseUrl: resolveMcpBaseUrl(),
  endpoint: '/mcp',
  timeoutMs: 30_000,
} as const;

export const MCP_METHODS = {
  CHAT_SEND: 'chat/send',
  CHAT_BOOTSTRAP: 'chat/bootstrap',
  CHAT_SCAN: 'chat/scan',
  TOOLS_CALL: 'tools/call',
} as const;

export const MCP_TOOL_NAMES = {
  CREATE_TIMESHEET: 'createTimesheetEntry',
  EDIT_TIMESHEET: 'editTimesheetEntry',
  DELETE_TIMESHEET: 'deleteTimesheetEntry',
  SUBMIT_EXPENSE: 'submitExpense',
  EDIT_EXPENSE: 'editExpense',
  DELETE_EXPENSE: 'deleteExpense',
} as const;
