import i18n from '../../i18n';
import { MESSAGES_OF_DAY_COUNT } from '../../constants/chat.constants';
import { getDefaultSuggestions } from '../../constants/suggestions';
import { FEATURES, USER_NAME } from '../../constants/app.constants';
import { callClaude, type AnthropicMessage } from '../api/anthropic';
import { mcpChatSend, mcpBootstrap } from '../api/mcp';
import {
  adaptAnthropicResponse,
  adaptHistoryToAnthropicMessages,
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

// ── Startup prompts (legacy Anthropic path) ─────────────────────────

function getStartupMessagePrompt(): string {
  return 'Greet the user briefly and ask how you can help today. Keep it to 2-3 sentences.';
}

function getStartupSuggestionsPrompt(): string {
  return `Generate exactly 4 clickable suggestion chips covering common tasks: timesheets, expenses, planning, and general help.
Return only valid JSON in this exact format:
[
  {"label":"...","prompt":"..."},
  {"label":"...","prompt":"..."},
  {"label":"...","prompt":"..."},
  {"label":"...","prompt":"..."}
]
Rules:
- Keep labels short (2 to 5 words).
- Prompts must be specific and actionable, covering different features (timesheets, expenses, projects, daily planning).
- No markdown, no explanation, no extra keys.
- Labels and prompts MUST be written in the user's preferred language (specified in the system prompt).`;
}

function extractJsonArray(text: string): string {
  const codeFenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = codeFenceMatch ? codeFenceMatch[1] : text;
  const start = candidate.indexOf('[');
  const end = candidate.lastIndexOf(']');
  if (start === -1 || end === -1 || end < start) {
    throw new Error('No JSON array found in suggestions response.');
  }
  return candidate.slice(start, end + 1);
}

// ── Startup (generates initial AI message + suggestions) ────────────

export async function generateBootstrap(): Promise<{ message: Message; suggestions: SuggestionChip[] }> {
  if (FEATURES.MCP_ENABLED) {
    const result = await mcpBootstrap({ language: i18n.language, userName: USER_NAME });
    return adaptMcpBootstrapResult(result);
  }

  // Legacy Anthropic path — two parallel calls
  const [messageResponse, suggestionsResponse] = await Promise.all([
    callClaude([{ role: 'user', content: getStartupMessagePrompt() }]),
    callClaude([{ role: 'user', content: getStartupSuggestionsPrompt() }]),
  ]);

  const message = adaptAnthropicResponse(messageResponse).message;

  const parsed = JSON.parse(extractJsonArray(suggestionsResponse)) as Array<
    Partial<Pick<SuggestionChip, 'label' | 'prompt'>>
  >;

  const suggestions = parsed
    .filter((item) => typeof item.label === 'string' && typeof item.prompt === 'string')
    .slice(0, 4)
    .map((item, index) => ({
      id: `startup-${index + 1}`,
      label: item.label!.trim(),
      prompt: item.prompt!.trim(),
    }))
    .filter((item) => item.label.length > 0 && item.prompt.length > 0);

  if (suggestions.length < 3) {
    throw new Error('Insufficient valid startup suggestions returned by AI.');
  }

  return { message, suggestions };
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
  if (FEATURES.MCP_ENABLED) {
    const messages = adaptHistoryToMcpEntries(history);
    messages.push({ role: 'user', content });
    const result = await mcpChatSend({
      messages,
      language: i18n.language,
      userName: USER_NAME,
    });
    return adaptMcpChatResult(result);
  }

  // Legacy Anthropic path
  const anthropicMessages: AnthropicMessage[] = [
    ...adaptHistoryToAnthropicMessages(history),
    { role: 'user', content },
  ];

  const responseText = await callClaude(anthropicMessages);

  return adaptAnthropicResponse(responseText);
}
