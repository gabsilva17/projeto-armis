import { DEFAULT_SUGGESTIONS } from '../../constants/suggestions';
import { DEFAULT_IMAGE_ANALYSIS_PROMPT, MESSAGES_OF_DAY } from '../../constants/chat.constants';
import { callClaude, type AnthropicMessage } from '../api/anthropic';
import {
  adaptAnthropicTextToAiMessage,
  adaptHistoryToAnthropicMessages,
  createImagePromptContent,
} from '../adapters/chatAdapter';
import type { Message, SuggestionChip } from '../../types/chat.types';

export function getDailyGreeting(userName: string): string {
  const hour = new Date().getHours();
  if (hour < 12) return `Good morning, ${userName}`;
  if (hour < 17) return `Good afternoon, ${userName}`;
  return `Good evening, ${userName}`;
}

export function getChatGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "How can I help you this morning?";
  if (hour < 17) return "How can I help you this afternoon?";
  return "How can I help you this evening?";
}

export function getMessageOfDay(): string {
  return MESSAGES_OF_DAY[new Date().getDate() % MESSAGES_OF_DAY.length];
}

export function getDefaultSuggestions(): SuggestionChip[] {
  return DEFAULT_SUGGESTIONS;
}

export async function sendMessageWithImage(
  base64: string,
  text: string,
  history: Message[],
): Promise<Message> {
  const imageContent = createImagePromptContent(base64, text, DEFAULT_IMAGE_ANALYSIS_PROMPT);

  const anthropicMessages: AnthropicMessage[] = [
    ...adaptHistoryToAnthropicMessages(history),
    { role: 'user' as const, content: imageContent },
  ];

  const responseText = await callClaude(anthropicMessages);

  return adaptAnthropicTextToAiMessage(responseText);
}

export async function sendMessage(
  content: string,
  history: Message[],
): Promise<Message> {
  const anthropicMessages: AnthropicMessage[] = [
    ...adaptHistoryToAnthropicMessages(history),
    { role: 'user', content },
  ];

  const responseText = await callClaude(anthropicMessages);

  return adaptAnthropicTextToAiMessage(responseText);
}
