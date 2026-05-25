import Anthropic from '@anthropic-ai/sdk';
import { SERVER_DEFAULTS } from '../config/constants.js';
import type {
  ChatMessage,
  CompletionOptions,
  CompletionResult,
  ContentBlock,
  LLMProvider,
  ToolCallRequest,
  ToolDefinitionForProvider,
} from './types.js';

type AnthropicContentBlock =
  | Anthropic.TextBlockParam
  | Anthropic.ImageBlockParam
  | Anthropic.DocumentBlockParam;

function toAnthropicContent(
  content: string | ContentBlock[],
): string | AnthropicContentBlock[] {
  if (typeof content === 'string') return content;

  return content.map((block): AnthropicContentBlock => {
    if (block.type === 'text') {
      return { type: 'text', text: block.text ?? '' };
    }
    if (block.type === 'image') {
      return {
        type: 'image',
        source: {
          type: 'base64',
          media_type: (block.source?.media_type ?? 'image/jpeg') as
            | 'image/jpeg'
            | 'image/png'
            | 'image/gif'
            | 'image/webp',
          data: block.source?.data ?? '',
        },
      };
    }
    // document
    return {
      type: 'document',
      source: {
        type: 'base64',
        media_type: 'application/pdf',
        data: block.source?.data ?? '',
      },
    };
  });
}

function toAnthropicTool(tool: ToolDefinitionForProvider): Anthropic.Tool {
  return {
    name: tool.name,
    description: tool.description,
    input_schema: tool.inputSchema as Anthropic.Tool.InputSchema,
  };
}

export class AnthropicProvider implements LLMProvider {
  private client: Anthropic;

  constructor(apiKey: string) {
    this.client = new Anthropic({ apiKey });
  }

  async chatCompletion(
    messages: ChatMessage[],
    options: CompletionOptions,
  ): Promise<CompletionResult> {
    const anthropicMessages: Anthropic.MessageParam[] = [];

    for (const m of messages) {
      if (m.role === 'system') continue;

      // Assistant message with raw content from a previous tool_use turn
      if (m.role === 'assistant' && m.rawAssistantContent) {
        anthropicMessages.push({
          role: 'assistant',
          content: m.rawAssistantContent as Anthropic.ContentBlockParam[],
        });
        continue;
      }

      // Tool results — sent as user message with tool_result blocks
      if (m.role === 'tool_result' && m.toolResults) {
        anthropicMessages.push({
          role: 'user',
          content: m.toolResults.map((tr) => ({
            type: 'tool_result' as const,
            tool_use_id: tr.toolCallId,
            content: tr.content,
            is_error: tr.isError,
          })),
        });
        continue;
      }

      // Regular user/assistant messages
      anthropicMessages.push({
        role: m.role as 'user' | 'assistant',
        content: toAnthropicContent(m.content),
      });
    }

    const requestParams: Anthropic.MessageCreateParams = {
      model: options.model ?? SERVER_DEFAULTS.anthropicModel,
      max_tokens: options.maxTokens ?? SERVER_DEFAULTS.maxTokens,
      system: options.systemPrompt,
      messages: anthropicMessages,
    };

    if (options.tools && options.tools.length > 0) {
      requestParams.tools = options.tools.map(toAnthropicTool);
    }

    const response = await this.client.messages.create(requestParams);

    // Extract text from all text blocks
    const text = response.content
      .filter((b) => b.type === 'text')
      .map((b) => ('text' in b ? b.text : ''))
      .join('');

    // Extract tool_use blocks
    const toolUseBlocks = response.content.filter((b) => b.type === 'tool_use');
    const toolCalls: ToolCallRequest[] = toolUseBlocks.map((b) => ({
      id: (b as Anthropic.ToolUseBlock).id,
      name: (b as Anthropic.ToolUseBlock).name,
      input: (b as Anthropic.ToolUseBlock).input as Record<string, unknown>,
    }));

    return {
      text,
      usage: {
        inputTokens: response.usage.input_tokens,
        outputTokens: response.usage.output_tokens,
      },
      toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
      stopReason: response.stop_reason === 'tool_use' ? 'tool_use' : 'end_turn',
      rawAssistantMessage: toolCalls.length > 0 ? response.content : undefined,
    };
  }
}
