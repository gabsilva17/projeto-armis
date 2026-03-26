import i18n from '../../i18n';
import { MESSAGES_OF_DAY_COUNT } from '../../constants/chat.constants';
import { getDefaultSuggestions } from '../../constants/suggestions';
import { callClaude, type AnthropicMessage } from '../api/anthropic';
import {
  adaptAnthropicResponse,
  adaptAnthropicTextToAiMessage,
  adaptHistoryToAnthropicMessages,
  buildStartupTimesheetContextInjection,
  createImagePromptContent,
} from '../adapters/chatAdapter';
import type { AiResponsePayload, Message, SuggestionChip } from '../../types/chat.types';
import type { RecentTimesheetContext } from '../timesheets/timesheetsService';

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

function getStartupMessagePrompt(): string {
  return 'Start the conversation now. Use the provided startup timesheet context to mention today, highlight relevant missing workdays (excluding weekends), ask one clear confirmation question, and suggest a next action without executing anything.';
}

function getStartupSuggestionsPrompt(): string {
  return `Generate exactly 4 clickable suggestion chips for the user based on STARTUP_TIMESHEET_CONTEXT.
Return only valid JSON in this exact format:
[
  {"label":"...","prompt":"..."},
  {"label":"...","prompt":"..."},
  {"label":"...","prompt":"..."},
  {"label":"...","prompt":"..."}
]
Rules:
- Keep labels short (2 to 5 words).
- Prompts must be specific to the provided context.
- Include at least one prompt about today and at least one about missing workdays.
- Do not mention weekends as missing.
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

export async function generateStartupSuggestions(
  context: RecentTimesheetContext,
): Promise<SuggestionChip[]> {
  const runtimeContext = buildStartupTimesheetContextInjection(context);
  const messages: AnthropicMessage[] = [{ role: 'user', content: getStartupSuggestionsPrompt() }];
  const responseText = await callClaude(messages, runtimeContext);

  const parsed = JSON.parse(extractJsonArray(responseText)) as Array<
    Partial<Pick<SuggestionChip, 'label' | 'prompt'>>
  >;

  const cleaned = parsed
    .filter((item) => typeof item.label === 'string' && typeof item.prompt === 'string')
    .slice(0, 4)
    .map((item, index) => ({
      id: `startup-${index + 1}`,
      label: item.label!.trim(),
      prompt: item.prompt!.trim(),
    }))
    .filter((item) => item.label.length > 0 && item.prompt.length > 0);

  if (cleaned.length < 3) {
    throw new Error('Insufficient valid startup suggestions returned by AI.');
  }

  return cleaned;
}

export async function generateStartupMessage(
  context: RecentTimesheetContext,
): Promise<Message> {
  const runtimeContext = buildStartupTimesheetContextInjection(context);
  const messages: AnthropicMessage[] = [{ role: 'user', content: getStartupMessagePrompt() }];
  const responseText = await callClaude(messages, runtimeContext);
  return adaptAnthropicResponse(responseText).message;
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

export async function sendMessageWithImage(
  base64: string,
  text: string,
  history: Message[],
  runtimeSystemContext?: string,
): Promise<AiResponsePayload> {
  const imageContent = createImagePromptContent(base64, text, i18n.t('chat:imageAnalysisPrompt'));

  const anthropicMessages: AnthropicMessage[] = [
    ...adaptHistoryToAnthropicMessages(history),
    { role: 'user' as const, content: imageContent },
  ];

  const responseText = await callClaude(anthropicMessages, runtimeSystemContext);

  return adaptAnthropicResponse(responseText);
}

export async function sendMessage(
  content: string,
  history: Message[],
  runtimeSystemContext?: string,
): Promise<AiResponsePayload> {
  const anthropicMessages: AnthropicMessage[] = [
    ...adaptHistoryToAnthropicMessages(history),
    { role: 'user', content },
  ];

  const responseText = await callClaude(anthropicMessages, runtimeSystemContext);

  return adaptAnthropicResponse(responseText);
}
