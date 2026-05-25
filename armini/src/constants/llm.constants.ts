import Constants from 'expo-constants';

// Wire-level config para o AI Gateway (`ai-gateway/`, porta 3001).
// Swap dev → prod gateway é mudar `EXPO_PUBLIC_AI_GATEWAY_URL` no .env do app.

const AI_GATEWAY_PORT = 3001;

function resolveAiGatewayBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_AI_GATEWAY_URL) return process.env.EXPO_PUBLIC_AI_GATEWAY_URL;

  // Em dev, derivar o host a partir do Metro bundler — segue o IP da máquina
  // automaticamente entre redes Wi-Fi sem precisar recompilar nem editar .env.
  const hostUri =
    Constants.expoConfig?.hostUri ?? Constants.expoGoConfig?.debuggerHost;
  if (hostUri) {
    const host = hostUri.split(':')[0];
    return `http://${host}:${AI_GATEWAY_PORT}`;
  }

  return `http://localhost:${AI_GATEWAY_PORT}`;
}

export const AI_GATEWAY_CONFIG = {
  baseUrl: resolveAiGatewayBaseUrl(),
  endpoint: '/mcp',
  timeoutMs: 30_000,
} as const;

export const AI_GATEWAY_METHODS = {
  CHAT_SEND: 'chat/send',
  CHAT_BOOTSTRAP: 'chat/bootstrap',
  CHAT_SCAN: 'chat/scan',
} as const;

// Tool names live on the MCP server, but the LLM still references them by
// these IDs in its tool_use blocks — so the mobile app reads them on the
// way through.
export const MCP_TOOL_NAMES = {
  CREATE_TIMESHEET: 'createTimesheetEntry',
  EDIT_TIMESHEET: 'editTimesheetEntry',
  DELETE_TIMESHEET: 'deleteTimesheetEntry',
  SUBMIT_EXPENSE: 'submitExpense',
  EDIT_EXPENSE: 'editExpense',
  DELETE_EXPENSE: 'deleteExpense',
} as const;
