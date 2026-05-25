import { env } from '../config/env.js';
import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';
import type { LLMProvider } from './types.js';

export function createProvider(): LLMProvider {
  switch (env.LLM_PROVIDER) {
    case 'anthropic':
      return new AnthropicProvider(env.ANTHROPIC_API_KEY!);
    case 'openai':
      return new OpenAIProvider(env.OPENAI_API_KEY!);
    default:
      throw new Error(`Unknown LLM provider: ${env.LLM_PROVIDER}`);
  }
}

export type {
  LLMProvider,
  ChatMessage,
  ContentBlock,
  CompletionOptions,
  CompletionResult,
  ToolCallRequest,
  ToolResultEntry,
  ToolDefinitionForProvider,
} from './types.js';
