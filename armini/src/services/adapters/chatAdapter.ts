import i18n from '../../i18n';
import type { AiResponsePayload, ChatDropdown, Message, MessageAction, SuggestionChip } from '../../types/chat.types';
import type { ChatHistoryEntry, McpChatSendResult, McpBootstrapResult } from '../../types/mcp.types';

function getExpenseActions(): MessageAction[] {
  return [
    { id: 'expense-chat', label: i18n.t('chat:expenseActions.chat'), icon: 'chat', actionType: 'chat-expense' },
    { id: 'expense-photo', label: i18n.t('chat:expenseActions.photo'), icon: 'camera', actionType: 'photo-expense' },
  ];
}

function adaptHistory(history: Message[]): Array<{ role: 'user' | 'assistant'; content: string }> {
  return history
    .filter((m) => !m.toolCall)
    .map((m) => {
      const content = m.content.trim() || (m.imageUri ? 'Shared an image.' : '');
      if (!content) return null;
      const role: 'user' | 'assistant' = m.sender === 'user' ? 'user' : 'assistant';
      return { role, content };
    })
    .filter((e): e is NonNullable<typeof e> => e !== null);
}

export function adaptHistoryToMcpEntries(history: Message[]): ChatHistoryEntry[] {
  return adaptHistory(history);
}

export function adaptMcpChatResult(result: McpChatSendResult, now = new Date()): AiResponsePayload {
  const hasExpenseOptions = result.actions.some((a) => a.type === 'expense_options');

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

  const dropdown: ChatDropdown | undefined = result.dropdown
    ? {
        id: `dropdown-${now.getTime()}`,
        label: result.dropdown.label,
        options: result.dropdown.options.map((o) => ({ label: o.label, value: o.value })),
      }
    : undefined;

  return { message, suggestions, toolCallMessages, dropdown };
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
