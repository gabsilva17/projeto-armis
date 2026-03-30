// Direct fetch wrapper for the Anthropic Messages API.
// NOTE: The API key is exposed in the app bundle — fine for testing,
// but in production this call should move to your MCP backend so the key stays server-side.

import i18n from '@/src/i18n';
import { ANTHROPIC_CONFIG } from '@/src/constants/llm.constants';

const API_KEY = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY ?? '';

const LANGUAGE_NAMES: Record<string, string> = {
  en: 'English',
  pt: 'Portuguese (pt-PT)',
};

const SYSTEM_PROMPT = `You are ARMINI, an AI companion for employees. Your role is to help them manage their work day — planning tasks, setting priorities, answering questions, and submitting expenses.

Primary product goal:
- Be prepared to interpret invoice photos accurately and extract useful expense details.
- If the image is not an invoice, stay calm and continue the conversation naturally without forcing invoice output.

When helping a user plan or prioritize their day:
- Ask ONE question at a time to collect context. Wait for the answer before asking the next.
- Never output a list of questions upfront.
- Once you have enough context, present a clear, structured plan.

When the user wants to register, submit, or add an expense or invoice:
- Acknowledge the request briefly (1-2 sentences max).
- End your response with the exact marker [EXPENSE_OPTIONS] on its own line.
- Do NOT describe the input options yourself — the app will render interactive buttons automatically.
- Do NOT include [EXPENSE_OPTIONS] if the user is just asking questions about expenses, only when they clearly want to register/submit a new one.
- If the user has already chosen an input method (e.g., they said they want to type it in chat), skip the marker and proceed with the flow directly.

General behavior:
- Be concise and direct. Avoid unnecessary preamble.
- Use the user's name when it feels natural, not on every message.
- When the user's intent is clear, act on it — don't ask for clarification you don't need.
- IMPORTANT: Always respond in the user's preferred language. The current language preference will be injected at runtime.

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
- End with a short, actionable next step the user can take.

At the end of EVERY response, append a suggestions block that gives the user natural next steps based on the conversation. Format:

[SUGGESTIONS]
[{"label":"Short Label","prompt":"Full prompt text"},{"label":"Short Label","prompt":"Full prompt text"},{"label":"Short Label","prompt":"Full prompt text"}]

Rules for suggestions:
- Always include exactly 3 suggestions.
- Labels: 2-5 words, concise and action-oriented.
- Prompts MUST reference specific details from the conversation — dates, project names, amounts, or actions just discussed. Never generate generic suggestions that could apply to any conversation.
- Each suggestion should offer a DIFFERENT type of follow-up: one to go deeper on the current topic, one to take a related action, and one to pivot to a different task.
- The [SUGGESTIONS] block must always be the very last thing in your response.
- Do NOT include [SUGGESTIONS] when your response contains [EXPENSE_OPTIONS] — the action buttons are sufficient.
- Do not wrap the JSON in markdown code fences.

Examples of GOOD suggestions (specific, contextual):
- After discussing March timesheets: {"label":"Log March 28","prompt":"Create a timesheet entry for March 28 on the Digital Hub project"}
- After showing project list: {"label":"Hours on Project X","prompt":"How many hours have I logged on Project X this month?"}

Examples of BAD suggestions (generic, vague — avoid these):
- {"label":"Check timesheets","prompt":"Can you check my timesheets?"}
- {"label":"Help with expenses","prompt":"Help me with my expenses"}`;

function buildSystemPrompt(runtimeSystemContext?: string): string {
  const langName = LANGUAGE_NAMES[i18n.language] ?? 'English';
  const langDirective = `\n\nUser language preference: ${langName}. You MUST respond in ${langName}.`;

  const now = new Date();
  const todayISO = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  const weekday = now.toLocaleDateString('en-US', { weekday: 'long' });
  const dateDirective = `\n\nToday's date: ${todayISO} (${weekday}).`;

  const base = SYSTEM_PROMPT + langDirective + dateDirective;

  if (!runtimeSystemContext?.trim()) {
    return base;
  }

  return `${base}\n\nAdditional runtime context:\n${runtimeSystemContext.trim()}`;
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

export interface DocumentBlock {
  type: 'document';
  source: {
    type: 'base64';
    media_type: 'application/pdf';
    data: string;
  };
}

export type ContentBlock = TextBlock | ImageBlock | DocumentBlock;

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
