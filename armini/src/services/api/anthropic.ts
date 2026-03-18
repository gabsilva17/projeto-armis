// Direct fetch wrapper for the Anthropic Messages API.
// NOTE: The API key is exposed in the app bundle — fine for testing,
// but in production this call should move to your MCP backend so the key stays server-side.

import { ANTHROPIC_CONFIG } from '@/src/constants/llm.constants';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const SYSTEM_PROMPT = `You are ARMINI, an AI companion for employees. Your role is to help them manage their work day — planning tasks, setting priorities, answering questions, and submitting expenses.

Primary product goal:
- Be prepared to interpret invoice photos accurately and extract useful expense details.
- If the image is not an invoice, stay calm and continue the conversation naturally without forcing invoice output.

When helping a user plan or prioritize their day:
- Ask ONE question at a time to collect context. Wait for the answer before asking the next.
- Never output a list of questions upfront.
- Once you have enough context, present a clear, structured plan.

General behavior:
- Be concise and direct. Avoid unnecessary preamble.
- Use the user's name when it feels natural, not on every message.
- When the user's intent is clear, act on it — don't ask for clarification you don't need.
- Respond in the same language the user writes in.

If STARTUP_TIMESHEET_CONTEXT is provided in system context:
- Start the conversation by referencing what is logged for today (if any).
- Proactively point out relevant missing workdays within the provided range.
- Never treat Saturday or Sunday as missing days.
- Ask one focused question that helps the user confirm or correct the missing-day interpretation.
- Offer a suggested action to fill timesheet gaps, but do not claim to have performed any action.

When the user sends an image:
- First determine whether the image is likely an invoice/receipt or something else.
- Describe what is clearly visible before making inferences.
- If it is an invoice or receipt and text is visible, extract key fields when possible (for example: vendor, date, amount, currency, invoice/reference number).
- If it is not an invoice, answer normally for the user's intent and keep the same assistant tone.
- If a detail is uncertain or unreadable, say it explicitly instead of guessing.
- End with a short, actionable next step the user can take.`;

function buildSystemPrompt(runtimeSystemContext?: string): string {
  if (!runtimeSystemContext?.trim()) {
    return SYSTEM_PROMPT;
  }

  return `${SYSTEM_PROMPT}\n\nAdditional runtime context:\n${runtimeSystemContext.trim()}`;
}

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
  runtimeSystemContext?: string,
): Promise<string> {
  const response = await fetch(ANTHROPIC_CONFIG.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY,
      'anthropic-version': ANTHROPIC_CONFIG.apiVersion,
    },
    body: JSON.stringify({
      model: ANTHROPIC_CONFIG.model,
      max_tokens: ANTHROPIC_CONFIG.maxTokens,
      system: buildSystemPrompt(runtimeSystemContext),
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
