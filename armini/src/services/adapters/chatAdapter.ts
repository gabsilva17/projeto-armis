import i18n from '../../i18n';
import type { AiResponsePayload, Message, MessageAction, SuggestionChip } from '../../types/chat.types';
import type { AnthropicMessage, ContentBlock } from '../api/anthropic';
import type { RecentTimesheetContext } from '../timesheets/timesheetsService';

const EXPENSE_OPTIONS_MARKER = '[EXPENSE_OPTIONS]';

// Matches [SUGGESTIONS], <suggestions>, </suggestions> and similar variations the LLM may produce.
const SUGGESTIONS_BLOCK_RE = /(?:\[SUGGESTIONS\]|<\/?suggestions>)/i;

function getExpenseActions(): MessageAction[] {
  return [
    { id: 'expense-chat', label: i18n.t('chat:expenseActions.chat'), icon: 'chat', actionType: 'chat-expense' },
    { id: 'expense-photo', label: i18n.t('chat:expenseActions.photo'), icon: 'camera', actionType: 'photo-expense' },
  ];
}

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

export function createDocumentPromptContent(base64: string, text: string, fallbackPrompt: string): ContentBlock[] {
  return [
    {
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: base64 },
    },
    {
      type: 'text',
      text: text.trim() || fallbackPrompt,
    },
  ];
}

export function adaptAnthropicTextToAiMessage(responseText: string, now = new Date()): Message {
  const hasExpenseOptions = responseText.includes(EXPENSE_OPTIONS_MARKER);
  const content = hasExpenseOptions
    ? responseText.replace(EXPENSE_OPTIONS_MARKER, '').trimEnd()
    : responseText;

  return {
    id: `ai-${now.getTime()}`,
    content,
    sender: 'ai',
    timestamp: now,
    ...(hasExpenseOptions && { actions: getExpenseActions() }),
  };
}

export function adaptAnthropicResponse(responseText: string, now = new Date()): AiResponsePayload {
  // Find the first occurrence of any suggestions marker variant.
  const markerMatch = responseText.match(SUGGESTIONS_BLOCK_RE);
  let suggestions: SuggestionChip[] = [];
  let textWithoutSuggestions = responseText;

  if (markerMatch?.index != null) {
    // Everything from the first marker onward is the suggestions block.
    const rawBlock = responseText.slice(markerMatch.index);
    textWithoutSuggestions = responseText.slice(0, markerMatch.index).trimEnd();

    // Strip all marker tags so only the JSON array remains.
    const jsonCandidate = rawBlock.replace(new RegExp(SUGGESTIONS_BLOCK_RE, 'gi'), '').trim();

    try {
      const start = jsonCandidate.indexOf('[');
      const end = jsonCandidate.lastIndexOf(']');
      if (start !== -1 && end > start) {
        const parsed = JSON.parse(jsonCandidate.slice(start, end + 1)) as Array<
          Partial<Pick<SuggestionChip, 'label' | 'prompt'>>
        >;
        suggestions = parsed
          .filter((item) => typeof item.label === 'string' && typeof item.prompt === 'string')
          .slice(0, 4)
          .map((item, index) => ({
            id: `suggestion-${now.getTime()}-${index}`,
            label: item.label!.trim(),
            prompt: item.prompt!.trim(),
          }))
          .filter((item) => item.label.length > 0 && item.prompt.length > 0);
      }
    } catch {
      // Parsing failed — suggestions stay empty, message still delivered
    }
  }

  const message = adaptAnthropicTextToAiMessage(textWithoutSuggestions, now);

  // When expense action buttons are shown, suggestions are redundant — suppress them.
  if (message.actions?.length) {
    return { message, suggestions: [] };
  }

  return { message, suggestions };
}

function topProjects(entries: RecentTimesheetContext['today']['entries']): string {
  const projectHours = entries.reduce<Record<string, number>>((acc, entry) => {
    acc[entry.project] = (acc[entry.project] ?? 0) + entry.hours;
    return acc;
  }, {});

  return Object.entries(projectHours)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([project, hours]) => `${project} (${hours}h)`)
    .join(', ');
}

export function buildStartupTimesheetContextInjection(context: RecentTimesheetContext): string {
  const missingPreview = context.missingWorkdays
    .slice(0, 5)
    .join(', ');

  const ledgerLines = context.daySnapshots.map((snapshot) => {
    const tasksPreview = snapshot.taskTitles.length > 0
      ? snapshot.taskTitles.slice(0, 3).join('; ')
      : 'none';
    return `- ${snapshot.date} (${snapshot.weekdayName}): ${snapshot.entriesCount} entries, ${snapshot.totalHours}h, tasks: ${tasksPreview}.`;
  });

  const todayProjects = topProjects(context.today.entries);

  return [
    'STARTUP_TIMESHEET_CONTEXT',
    `Range: ${context.rangeStart} to ${context.rangeEnd} (last 15 calendar days).`,
    `Workdays in range: ${context.workdaysInRange}.`,
    `Workdays with logs: ${context.loggedWorkdays}.`,
    `Missing workdays (exclude weekends): ${context.missingWorkdays.length}.`,
    context.missingWorkdays.length > 0
      ? `Missing dates sample: ${missingPreview}${context.missingWorkdays.length > 5 ? ', ...' : ''}.`
      : 'No missing workdays in this range.',
    `Today (${context.today.date}) is workday: ${context.today.isWorkday ? 'yes' : 'no'}.`,
    `Today entries: ${context.today.entriesCount}.`,
    `Today total hours: ${context.today.totalHours}.`,
    todayProjects ? `Today top projects: ${todayProjects}.` : 'Today top projects: none.',
    'Weekend rule: Saturday and Sunday should not be treated as missing timesheet days.',
    'Last-15-days task ledger:',
    ...ledgerLines,
  ].join('\n');
}
