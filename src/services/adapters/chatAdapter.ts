import i18n from '../../i18n';
import type { AiResponsePayload, Message, MessageAction, SuggestionChip } from '../../types/chat.types';
import type { AnthropicMessage, ContentBlock } from '../api/anthropic';
import type { ChatHistoryEntry, McpChatSendResult, McpBootstrapResult } from '../../types/mcp.types';

const EXPENSE_OPTIONS_MARKER = '[EXPENSE_OPTIONS]';

// Matches [SUGGESTIONS], <suggestions>, </suggestions> and similar variations the LLM may produce.
const SUGGESTIONS_BLOCK_RE = /(?:\[SUGGESTIONS\]|<\/?suggestions>)/i;

function getExpenseActions(): MessageAction[] {
  return [
    { id: 'expense-chat', label: i18n.t('chat:expenseActions.chat'), icon: 'chat', actionType: 'chat-expense' },
    { id: 'expense-photo', label: i18n.t('chat:expenseActions.photo'), icon: 'camera', actionType: 'photo-expense' },
  ];
}

export function adaptHistoryToAnthropicMessages(history: Message[]): AnthropicMessage[] {
  return history
    .filter((message) => !message.toolCall)
    .map((message) => {
      const normalizedContent = message.content.trim() || (message.imageUri ? 'Shared an image.' : '');

      if (!normalizedContent) return null;

      return {
        role: message.sender === 'user' ? 'user' : 'assistant',
        content: normalizedContent,
      } as AnthropicMessage;
    })
    .filter((message): message is AnthropicMessage => message !== null);
}

export function createImagePromptContent(base64: string, text: string, fallbackPrompt: string): ContentBlock[] {
  return [
    {
      type: 'image',
      source: { type: 'base64', media_type: 'image/jpeg', data: base64 },
    },
    {
      type: 'text',
      text: text.trim() || fallbackPrompt,
    },
  ];
}

export function createDocumentPromptContent(base64: string, text: string, fallbackPrompt: string): ContentBlock[] {
  return [
    {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: base64 },
    },
    {
      type: 'text',
      text: text.trim() || fallbackPrompt,
    },
  ];
}

export function adaptAnthropicTextToAiMessage(responseText: string, now = new Date()): Message {
  const hasExpenseOptions = responseText.includes(EXPENSE_OPTIONS_MARKER);
  const content = hasExpenseOptions
    ? responseText.replace(EXPENSE_OPTIONS_MARKER, '').trimEnd()
    : responseText;

  return {
    id: `ai-${now.getTime()}`,
    content,
    sender: 'ai',
    timestamp: now,
    ...(hasExpenseOptions && { actions: getExpenseActions() }),
  };
}

export function adaptAnthropicResponse(responseText: string, now = new Date()): AiResponsePayload {
  // Find the first occurrence of any suggestions marker variant.
  const markerMatch = responseText.match(SUGGESTIONS_BLOCK_RE);
  let suggestions: SuggestionChip[] = [];
  let textWithoutSuggestions = responseText;

  if (markerMatch?.index != null) {
    // Everything from the first marker onward is the suggestions block.
    const rawBlock = responseText.slice(markerMatch.index);
    textWithoutSuggestions = responseText.slice(0, markerMatch.index).trimEnd();

    // Strip all marker tags so only the JSON array remains.
    const jsonCandidate = rawBlock.replace(new RegExp(SUGGESTIONS_BLOCK_RE, 'gi'), '').trim();

    try {
      const start = jsonCandidate.indexOf('[');
      const end = jsonCandidate.lastIndexOf(']');
      if (start !== -1 && end > start) {
        const parsed = JSON.parse(jsonCandidate.slice(start, end + 1)) as Array<
          Partial<Pick<SuggestionChip, 'label' | 'prompt'>>
        >;
        suggestions = parsed
          .filter((item) => typeof item.label === 'string' && typeof item.prompt === 'string')
          .slice(0, 4)
          .map((item, index) => ({
            id: `suggestion-${now.getTime()}-${index}`,
            label: item.label!.trim(),
            prompt: item.prompt!.trim(),
          }))
          .filter((item) => item.label.length > 0 && item.prompt.length > 0);
      }
    } catch {
      // Parsing failed — suggestions stay empty, message still delivered
    }
  }

  const message = adaptAnthropicTextToAiMessage(textWithoutSuggestions, now);

  // When expense action buttons are shown, suggestions are redundant — suppress them.
  if (message.actions?.length) {
    return { message, suggestions: [], toolCallMessages: [] };
  }

  return { message, suggestions, toolCallMessages: [] };
}

// ── MCP Adapters (usadas quando FEATURES.MCP_ENABLED = true) ───────

export function adaptHistoryToMcpEntries(history: Message[]): ChatHistoryEntry[] {
  return history
    .filter((message) => !message.toolCall)
    .map((message) => {
      const normalizedContent = message.content.trim() || (message.imageUri ? 'Shared an image.' : '');
      if (!normalizedContent) return null;

      return {
        role: (message.sender === 'user' ? 'user' : 'assistant') as ChatHistoryEntry['role'],
        content: normalizedContent,
      };
    })
    .filter((entry): entry is ChatHistoryEntry => entry !== null);
}

export function adaptMcpChatResult(result: McpChatSendResult, now = new Date()): AiResponsePayload {
  const hasExpenseOptions = result.actions.some((a) => a.type === 'expense_options');

  // Criar mensagens de tool call (aparecem antes da resposta do AI)
  const toolCallMessages: Message[] = (result.toolCalls ?? []).map((tc, index) => ({
    id: `tool-${now.getTime()}-${index}`,
    content: tc.name,
    sender: 'ai' as const,
    timestamp: new Date(now.getTime() + index),
    toolCall: { name: tc.name, result: tc.result },
  }));

  const message: Message = {
    id: `ai-${now.getTime() + (result.toolCalls?.length ?? 0)}`,
    content: result.text,
    sender: 'ai',
    timestamp: now,
    ...(hasExpenseOptions && { actions: getExpenseActions() }),
  };

  const suggestions: SuggestionChip[] = result.suggestions.map((s, index) => ({
    id: `suggestion-${now.getTime()}-${index}`,
    label: s.label,
    prompt: s.prompt,
  }));

  return { message, suggestions, toolCallMessages };
}

export function adaptMcpBootstrapResult(
  result: McpBootstrapResult,
  now = new Date(),
): { message: Message; suggestions: SuggestionChip[] } {
  const message: Message = {
    id: `ai-${now.getTime()}`,
    content: result.messageText,
    sender: 'ai',
    timestamp: now,
  };

  const suggestions: SuggestionChip[] = result.suggestions.map((s, index) => ({
    id: `suggestion-${now.getTime()}-${index}`,
    label: s.label,
    prompt: s.prompt,
  }));

  return { message, suggestions };
}
