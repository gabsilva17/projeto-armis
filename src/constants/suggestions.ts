import type { SuggestionChip } from '../types/chat.types';

export const DEFAULT_SUGGESTIONS: SuggestionChip[] = [
  {
    id: '1',
    label: 'Summarize my week',
    prompt: 'Can you summarize what I did this week and what I should focus on?',
  },
  {
    id: '2',
    label: 'Help me write an email',
    prompt: 'Help me write a professional email to',
  },
  {
    id: '3',
    label: 'Expense report tips',
    prompt: 'What are the best practices for submitting expense reports?',
  },
  {
    id: '4',
    label: 'Schedule my day',
    prompt: 'Help me plan and prioritize my tasks for today.',
  },
];
