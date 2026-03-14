import { DEFAULT_SUGGESTIONS } from '../../constants/suggestions';
import { callClaude, type AnthropicMessage } from '../api/anthropic';
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

const MESSAGES_OF_DAY = [
  "How can I help you today?",
  "What would you like to accomplish?",
  "Ready when you are.",
  "Let's get things done.",
  "What's on your mind?",
  "Here to help. Just ask.",
  "Your AI companion is ready.",
];

export function getMessageOfDay(): string {
  return MESSAGES_OF_DAY[new Date().getDate() % MESSAGES_OF_DAY.length];
}

export function getDefaultSuggestions(): SuggestionChip[] {
  return DEFAULT_SUGGESTIONS;
}

export async function sendMessage(
  content: string,
  history: Message[],
): Promise<Message> {
  const anthropicMessages: AnthropicMessage[] = [
    ...history.map((m) => ({
      role: m.sender === 'user' ? ('user' as const) : ('assistant' as const),
      content: m.content,
    })),
    { role: 'user', content },
  ];

  const responseText = await callClaude(anthropicMessages);

  return {
    id: `ai-${Date.now()}`,
    content: responseText,
    sender: 'ai',
    timestamp: new Date(),
  };
}
