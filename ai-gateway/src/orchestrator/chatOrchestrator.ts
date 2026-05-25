import type {
  LLMProvider,
  ChatMessage,
  ContentBlock,
  CompletionResult,
  ToolDefinitionForProvider,
  ToolResultEntry,
} from '../providers/types.js';
import type { McpClient } from '../mcpClient/index.js';
import { SERVER_DEFAULTS } from '../config/constants.js';
import {
  buildChatSystemPrompt,
  buildScanSystemPrompt,
  buildStartupSuggestionsPrompt,
} from './promptBuilder.js';
import {
  parseChatResponse,
  parseStartupSuggestions,
  type ParsedChatResponse,
  type ParsedDropdown,
  type ParsedSuggestion,
} from './responseParser.js';
import { logger } from '../utils/logger.js';

// ── Request / Response types ────────────────────────────────────────

export interface ChatSendParams {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  language: string;
  userName: string;
  imageData?: { base64: string; mediaType: string };
}

export interface ToolCallEntry {
  name: string;
  result?: string;
}

export interface ChatSendResult {
  text: string;
  suggestions: ParsedSuggestion[];
  actions: Array<{ type: string }>;
  toolCalls: ToolCallEntry[];
  dropdown?: ParsedDropdown;
  toolsAvailable: boolean;
}

export interface BootstrapParams {
  language: string;
  userName: string;
}

export interface BootstrapResult {
  messageText: string;
  suggestions: ParsedSuggestion[];
  toolsAvailable: boolean;
}

export interface ScanParams {
  base64: string;
  mediaType: string;
}

export interface ScanResult {
  expenseData: Record<string, string | undefined>;
  toolsAvailable: boolean;
}

export interface HealthResult {
  aiGateway: 'ok';
  mcp: 'ok' | 'offline';
}

// ── Orchestrator ────────────────────────────────────────────────────

export class ChatOrchestrator {
  constructor(
    private provider: LLMProvider,
    private mcpClient?: McpClient,
  ) {}

  // Fetches the tool catalog from MCP. Returns:
  //   - { toolDefs, toolsAvailable: true }  → tools usable
  //   - { toolDefs: undefined, toolsAvailable: false } → MCP unreachable
  // The orchestrator can't be constructed without an mcpClient anymore in
  // practice (index.ts always passes one), but we keep the optional path so
  // that test harnesses can still spin up a no-tools orchestrator.
  private async resolveToolCatalog(): Promise<{
    toolDefs: ToolDefinitionForProvider[] | undefined;
    toolsAvailable: boolean;
  }> {
    if (!this.mcpClient) {
      return { toolDefs: undefined, toolsAvailable: false };
    }
    const tools = await this.mcpClient.listTools();
    if (tools === null) {
      // MCP unreachable — caller will degrade and add the soft directive.
      return { toolDefs: undefined, toolsAvailable: false };
    }
    if (tools.length === 0) {
      return { toolDefs: undefined, toolsAvailable: true };
    }
    return {
      toolDefs: tools.map((t) => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema,
      })),
      toolsAvailable: true,
    };
  }

  async handleChat(params: ChatSendParams): Promise<ChatSendResult> {
    const { messages, language, userName, imageData } = params;

    // Build the LLM message array
    const llmMessages: ChatMessage[] = [];

    // Convert history (all except the last user message which may have image)
    for (const msg of messages.slice(0, -1)) {
      llmMessages.push({ role: msg.role, content: msg.content });
    }

    // Last message — may include image data
    const lastMsg = messages[messages.length - 1];
    if (lastMsg) {
      if (imageData) {
        const contentBlocks: ContentBlock[] = [
          {
            type: 'image',
            source: {
              type: 'base64',
              media_type: imageData.mediaType,
              data: imageData.base64,
            },
          },
          { type: 'text', text: lastMsg.content || 'What is this image?' },
        ];
        llmMessages.push({ role: 'user', content: contentBlocks });
      } else {
        llmMessages.push({ role: lastMsg.role, content: lastMsg.content });
      }
    }

    // Build tool definitions for the provider (fetched from MCP server).
    // If MCP is unreachable we still call the LLM, but with no tool catalog
    // and a soft system directive telling it to answer from general
    // knowledge only.
    const { toolDefs, toolsAvailable } = await this.resolveToolCatalog();
    const systemPrompt = buildChatSystemPrompt(language, !toolsAvailable);

    logger.info(`chat/send: ${messages.length} msgs, lang=${language}, user=${userName}, hasImage=${!!imageData}, tools=${toolDefs?.length ?? 0}, toolsAvailable=${toolsAvailable}`);

    // Agentic loop — LLM pode chamar tools e receber resultados
    let result: CompletionResult;
    let iterations = 0;
    const executedToolCalls: ToolCallEntry[] = [];

    while (true) {
      result = await this.provider.chatCompletion(llmMessages, {
        systemPrompt,
        tools: toolDefs,
        maxTokens: toolDefs ? SERVER_DEFAULTS.maxTokensWithTools : undefined,
      });

      // Se não há tool calls, temos a resposta final
      if (!result.toolCalls || result.toolCalls.length === 0) {
        break;
      }

      iterations++;
      if (iterations >= SERVER_DEFAULTS.maxToolUseIterations) {
        logger.warn(`chat/send: max tool-use iterations (${SERVER_DEFAULTS.maxToolUseIterations}) reached`);
        break;
      }

      logger.info(`chat/send: iteration ${iterations}, ${result.toolCalls.length} tool call(s)`);

      // Append assistant message with tool_use content to conversation
      llmMessages.push({
        role: 'assistant',
        content: result.text,
        rawAssistantContent: result.rawAssistantMessage,
      });

      // Execute all tool calls and collect results
      const toolResults: ToolResultEntry[] = [];
      for (const call of result.toolCalls) {
        logger.info(`chat/send: executing tool ${call.name}`);
        try {
          const toolResult = await this.mcpClient!.callTool(call.name, call.input);
          const resultContent = toolResult.content.map((c) => c.text).join('\n');
          toolResults.push({
            toolCallId: call.id,
            content: resultContent,
            isError: toolResult.isError,
          });
          // Incluir resultado para tools de mutação (para o client poder atualizar o estado local)
          executedToolCalls.push({
            name: call.name,
            result: !toolResult.isError ? resultContent : undefined,
          });
        } catch (err) {
          logger.error(`chat/send: tool ${call.name} threw`, err);
          toolResults.push({
            toolCallId: call.id,
            content: `Error executing tool ${call.name}: ${err instanceof Error ? err.message : 'Unknown error'}`,
            isError: true,
          });
          executedToolCalls.push({ name: call.name });
        }
      }

      // Append tool results to conversation
      llmMessages.push({
        role: 'tool_result',
        content: '',
        toolResults,
      });
    }

    // Fallback se max iterations atingido e sem texto
    if (!result!.text && iterations >= SERVER_DEFAULTS.maxToolUseIterations) {
      result!.text = 'I was unable to complete the request within the allowed processing steps. Please try again with a simpler request.';
    }

    const parsed: ParsedChatResponse = parseChatResponse(result!.text);

    logger.info(`chat/send: ${result!.text.length} chars, ${parsed.suggestions.length} suggestions, ${parsed.actions.length} actions, ${iterations} tool iteration(s)`);

    return {
      text: parsed.text,
      suggestions: parsed.suggestions,
      actions: parsed.actions,
      toolCalls: executedToolCalls,
      dropdown: parsed.dropdown,
      toolsAvailable,
    };
  }

  async handleBootstrap(params: BootstrapParams): Promise<BootstrapResult> {
    const { language, userName } = params;

    // Bootstrap doesn't use tools, but we still report the flag so the
    // mobile UI can decide whether to show the limited-mode banner before
    // the user has typed anything.
    const toolsAvailable = this.mcpClient ? await this.mcpClient.ping() : false;
    const systemPrompt = buildChatSystemPrompt(language);

    logger.info(`chat/bootstrap: lang=${language}, user=${userName}, toolsAvailable=${toolsAvailable}`);

    // Single call — system prompt already asks for [SUGGESTIONS] block
    const result = await this.provider.chatCompletion(
      [{ role: 'user', content: `Greet the user ${userName} briefly and ask how you can help today. Keep it to 2-3 sentences.` }],
      { systemPrompt },
    );

    const parsed = parseChatResponse(result.text);

    // Fallback: if no suggestions extracted, make a dedicated call
    if (parsed.suggestions.length === 0) {
      logger.info('chat/bootstrap: no suggestions in main response, falling back to dedicated call');
      const suggestionsPrompt = buildStartupSuggestionsPrompt(language, userName);
      const sugResult = await this.provider.chatCompletion(
        [{ role: 'user', content: 'Generate suggestion chips.' }],
        { systemPrompt: suggestionsPrompt },
      );
      const fallbackSuggestions = parseStartupSuggestions(sugResult.text);

      logger.info(`chat/bootstrap: message ${parsed.text.length} chars, ${fallbackSuggestions.length} suggestions (fallback)`);
      return { messageText: parsed.text, suggestions: fallbackSuggestions, toolsAvailable };
    }

    logger.info(`chat/bootstrap: message ${parsed.text.length} chars, ${parsed.suggestions.length} suggestions`);
    return { messageText: parsed.text, suggestions: parsed.suggestions, toolsAvailable };
  }

  async handleScan(params: ScanParams): Promise<ScanResult> {
    const { base64, mediaType } = params;

    const contentBlocks: ContentBlock[] = [];

    if (mediaType === 'application/pdf') {
      contentBlocks.push({
        type: 'document',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      });
    } else {
      contentBlocks.push({
        type: 'image',
        source: { type: 'base64', media_type: mediaType, data: base64 },
      });
    }

    contentBlocks.push({
      type: 'text',
      text: 'Extract the expense/invoice data from this image.',
    });

    const systemPrompt = buildScanSystemPrompt();

    logger.info(`chat/scan: mediaType=${mediaType}`);

    const result = await this.provider.chatCompletion(
      [{ role: 'user', content: contentBlocks }],
      { systemPrompt },
    );

    // Try to parse JSON from the response
    let expenseData: Record<string, string | undefined> = {};
    try {
      const start = result.text.indexOf('{');
      const end = result.text.lastIndexOf('}');
      if (start !== -1 && end > start) {
        expenseData = JSON.parse(result.text.slice(start, end + 1));
      }
    } catch {
      logger.warn('chat/scan: Failed to parse expense JSON from LLM response');
      expenseData = { observations: result.text };
    }

    // chat/scan doesn't call tools, but for shape consistency across the
    // three methods we report MCP reachability here too.
    const toolsAvailable = this.mcpClient ? await this.mcpClient.ping() : false;

    return { expenseData, toolsAvailable };
  }

  async handleHealth(): Promise<HealthResult> {
    const mcpOk = this.mcpClient ? await this.mcpClient.ping() : false;
    return { aiGateway: 'ok', mcp: mcpOk ? 'ok' : 'offline' };
  }
}
