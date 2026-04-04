export const MCP_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_MCP_URL ?? 'http://192.168.52.78:3001',
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
