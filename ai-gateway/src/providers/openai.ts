import OpenAI from 'openai';
import { SERVER_DEFAULTS } from '../config/constants.js';
import { logger } from '../utils/logger.js';
import type {
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  ContentBlock,
  LLMProvider,
  ToolCallRequest,
  ToolDefinitionForProvider,
} from './types.js';

type OpenAIContentPart =
  | OpenAI.ChatCompletionContentPartText
  | OpenAI.ChatCompletionContentPartImage;

function toOpenAIContent(
  content: string | ContentBlock[],
): string | OpenAIContentPart[] {
  if (typeof content === 'string') return content;

  return content.map((block): OpenAIContentPart => {
    if (block.type === 'image' && block.source) {
      return {
        type: 'image_url',
        image_url: {
          url: `data:${block.source.media_type};base64,${block.source.data}`,
        },
      };
    }
    if (block.type === 'document' && block.source) {
      logger.warn('OpenAI provider does not support PDF documents — content degraded');
      return {
        type: 'text',
        text: '[PDF document was provided but this LLM provider does not support native PDF processing. The document content could not be analyzed.]',
      };
    }
    return { type: 'text', text: block.text ?? '' };
  });
}

function toOpenAITool(tool: ToolDefinitionForProvider): OpenAI.ChatCompletionTool {
  return {
    type: 'function',
    function: {
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    },
  };
}

export class OpenAIProvider implements LLMProvider {
  private client: OpenAI;

  constructor(apiKey: string) {
    this.client = new OpenAI({ apiKey });
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: CompletionOptions,
  ): Promise<CompletionResult> {
    const openaiMessages: OpenAI.ChatCompletionMessageParam[] = [];

    // Inject system prompt as first message
    if (options.systemPrompt) {
      openaiMessages.push({ role: 'system', content: options.systemPrompt });
    }

    for (const m of messages) {
      if (m.role === 'system') continue; // already handled above

      // Assistant message with raw content from a previous tool_calls turn
      if (m.role === 'assistant' && m.rawAssistantContent) {
        openaiMessages.push(
          m.rawAssistantContent as OpenAI.ChatCompletionAssistantMessageParam,
        );
        continue;
      }

      // Tool results — one message per result with role 'tool'
      if (m.role === 'tool_result' && m.toolResults) {
        for (const tr of m.toolResults) {
          openaiMessages.push({
            role: 'tool',
            content: tr.content,
            tool_call_id: tr.toolCallId,
          });
        }
        continue;
      }

      if (m.role === 'assistant') {
        // Assistant messages are always text
        const text = typeof m.content === 'string'
          ? m.content
          : m.content.map((b) => b.text ?? '').join('');
        openaiMessages.push({ role: 'assistant', content: text });
      } else {
        openaiMessages.push({ role: 'user', content: toOpenAIContent(m.content) });
      }
    }

    const requestParams: OpenAI.ChatCompletionCreateParams = {
      model: options.model ?? SERVER_DEFAULTS.openaiModel,
      max_tokens: options.maxTokens ?? SERVER_DEFAULTS.maxTokens,
      messages: openaiMessages,
    };

    if (options.tools && options.tools.length > 0) {
      requestParams.tools = options.tools.map(toOpenAITool);
    }

    const response = await this.client.chat.completions.create(requestParams);

    const choice = response.choices[0];
    const message = choice?.message;
    const text = message?.content ?? '';

    // Extract tool calls
    const toolCalls: ToolCallRequest[] | undefined = message?.tool_calls?.map((tc) => ({
      id: tc.id,
      name: tc.function.name,
      input: JSON.parse(tc.function.arguments),
    }));

    const hasToolCalls = toolCalls && toolCalls.length > 0;

    return {
      text,
      usage: response.usage
        ? {
            inputTokens: response.usage.prompt_tokens,
            outputTokens: response.usage.completion_tokens ?? 0,
          }
        : undefined,
      toolCalls: hasToolCalls ? toolCalls : undefined,
      stopReason: choice?.finish_reason === 'tool_calls' ? 'tool_use' : 'end_turn',
      rawAssistantMessage: hasToolCalls ? message : undefined,
    };
  }
}
