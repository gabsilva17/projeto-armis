export interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool_result';
  content: string | ContentBlock[];
  toolResults?: ToolResultEntry[];
  rawAssistantContent?: unknown;
}

export interface ContentBlock {
  type: 'text' | 'image' | 'document';
  text?: string;
  source?: {
    type: 'base64';
    media_type: string;
    data: string;
  };
}

export interface ToolCallRequest {
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultEntry {
  toolCallId: string;
  content: string;
  isError?: boolean;
}

export interface ToolDefinitionForProvider {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface CompletionOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  systemPrompt?: string;
  tools?: ToolDefinitionForProvider[];
}

export interface CompletionResult {
  text: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  toolCalls?: ToolCallRequest[];
  stopReason?: 'end_turn' | 'tool_use' | 'max_tokens';
  rawAssistantMessage?: unknown;
}

export interface LLMProvider {
  chatCompletion(
    messages: ChatMessage[],
    options: CompletionOptions,
  ): Promise<CompletionResult>;
}
