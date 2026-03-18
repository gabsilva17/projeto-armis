import type { Message } from '../../types/chat.types';
import type { AnthropicMessage, ContentBlock } from '../api/anthropic';
import type { RecentTimesheetContext } from '../timesheets/timesheetsService';

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
