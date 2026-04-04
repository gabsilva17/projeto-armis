import i18n from '../../i18n';
import { MESSAGES_OF_DAY_COUNT } from '../../constants/chat.constants';
import { getDefaultSuggestions } from '../../constants/suggestions';
import { USER_NAME } from '../../constants/app.constants';
import { mcpChatSend, mcpBootstrap } from '../api/mcp';
import {
  adaptHistoryToMcpEntries,
  adaptMcpBootstrapResult,
  adaptMcpChatResult,
} from '../adapters/chatAdapter';
import type { AiResponsePayload, Message, SuggestionChip } from '../../types/chat.types';

export function getDailyGreeting(userName: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return i18n.t('home:greeting.morning', { userName });
  if (hour < 17) return i18n.t('home:greeting.afternoon', { userName });
  return i18n.t('home:greeting.evening', { userName });
}

export function getChatGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return i18n.t('chat:chatGreeting.morning');
  if (hour < 17) return i18n.t('chat:chatGreeting.afternoon');
  return i18n.t('chat:chatGreeting.evening');
}

export function getMessageOfDay(): string {
  const index = new Date().getDate() % MESSAGES_OF_DAY_COUNT;
  return i18n.t(`chat:messagesOfDay.${index}`);
}

export { getDefaultSuggestions };

// ── Startup (generates initial AI message + suggestions) ────────────

export async function generateBootstrap(): Promise<{ message: Message; suggestions: SuggestionChip[] }> {
  const result = await mcpBootstrap({ language: i18n.language, userName: USER_NAME });
  return adaptMcpBootstrapResult(result);
}

export function getStartupFallbackMessage(now = new Date()): Message {
  return {
    id: `ai-bootstrap-${now.getTime()}`,
    sender: 'ai',
    timestamp: now,
    content: i18n.t('chat:fallbackMessage'),
  };
}

export function getStartupFallbackSuggestions(): SuggestionChip[] {
  return getDefaultSuggestions();
}

// ── Chat messages ───────────────────────────────────────────────────

export async function sendMessage(
  content: string,
  history: Message[],
): Promise<AiResponsePayload> {
  const messages = adaptHistoryToMcpEntries(history);
  messages.push({ role: 'user', content });
  const result = await mcpChatSend({
    messages,
    language: i18n.language,
    userName: USER_NAME,
  });
  return adaptMcpChatResult(result);
}
