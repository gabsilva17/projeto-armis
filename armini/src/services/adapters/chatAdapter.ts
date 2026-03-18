import type { Message } from '../../types/chat.types';
import type { AnthropicMessage, ContentBlock } from '../api/anthropic';

export function adaptHistoryToAnthropicMessages(history: Message[]): AnthropicMessage[] {
  return history
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

export function adaptAnthropicTextToAiMessage(responseText: string, now = new Date()): Message {
  return {
    id: `ai-${now.getTime()}`,
    content: responseText,
    sender: 'ai',
    timestamp: now,
  };
}
