export const ANTHROPIC_CONFIG = {
  endpoint: 'https://api.anthropic.com/v1/messages',
  apiVersion: '2023-06-01',
  model: 'claude-haiku-4-5-20251001',
  maxTokens: 1024,
} as const;
