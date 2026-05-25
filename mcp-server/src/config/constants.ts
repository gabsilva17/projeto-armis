export const SERVER_DEFAULTS = {
  anthropicModel: 'claude-haiku-4-5-20251001',
  openaiModel: 'gpt-4o-mini',
  maxTokens: 1024,
  maxTokensWithTools: 4096,
  temperature: 0.4,
  maxToolUseIterations: 10,
} as const;
