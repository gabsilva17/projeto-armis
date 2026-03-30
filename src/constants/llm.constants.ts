export const ANTHROPIC_CONFIG = {
  endpoint: 'https://api.anthropic.com/v1/messages',
  apiVersion: '2023-06-01',
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 1024,
} as const;

export const MCP_CONFIG = {
  baseUrl: process.env.EXPO_PUBLIC_MCP_URL ?? 'http://192.168.52.78:3001',
  endpoint: '/mcp',
  timeoutMs: 30_000,
} as const;

export const MCP_METHODS = {
  CHAT_SEND: 'chat/send',
  CHAT_BOOTSTRAP: 'chat/bootstrap',
  CHAT_SCAN: 'chat/scan',
} as const;
