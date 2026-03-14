// Direct fetch wrapper for the Anthropic Messages API.
// NOTE: The API key is exposed in the app bundle — fine for testing,
// but in production this call should move to your MCP backend so the key stays server-side.

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const SYSTEM_PROMPT = `You are ARMINI, an AI companion for employees. Your role is to help them manage their work day — planning tasks, setting priorities, answering questions, and submitting expenses.

When helping a user plan or prioritize their day:
- Ask ONE question at a time to collect context. Wait for the answer before asking the next.
- Never output a list of questions upfront.
- Once you have enough context, present a clear, structured plan.

General behavior:
- Be concise and direct. Avoid unnecessary preamble.
- Use the user's name when it feels natural, not on every message.
- When the user's intent is clear, act on it — don't ask for clarification you don't need.
- Respond in the same language the user writes in.`;

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ImageBlock {
  type: 'image';
  source: {
    type: 'base64';
    media_type: 'image/jpeg' | 'image/png' | 'image/gif' | 'image/webp';
    data: string;
  };
}

export type ContentBlock = TextBlock | ImageBlock;

export interface AnthropicMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export async function callClaude(
  messages: AnthropicMessage[],
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(
      (err as { error?: { message?: string } })?.error?.message ??
        `Anthropic API error ${response.status}`,
    );
  }

  const data = (await response.json()) as {
    content: Array<{ type: string; text?: string }>;
  };

  const textBlock = data.content.find((b) => b.type === 'text');
  return textBlock?.text ?? '';
}
