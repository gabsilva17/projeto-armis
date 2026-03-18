import type { SuggestionChip } from '../types/chat.types';

export const DEFAULT_SUGGESTIONS: SuggestionChip[] = [
  {
    id: '1',
    label: 'Review my last 15 days',
    prompt: 'Can you review my last 15 days and tell me what stands out?',
  },
  {
    id: '2',
    label: 'Check today entries',
    prompt: 'What do I already have logged for today, and is anything missing?',
  },
  {
    id: '3',
    label: 'Find missing workdays',
    prompt: 'Which workdays in the last 15 days have no entries, excluding weekends?',
  },
  {
    id: '4',
    label: 'Suggest next logs',
    prompt: 'Suggest what I should log next for the missing workdays, without submitting anything.',
  },
];
