import i18n from '../i18n';
import type { SuggestionChip } from '../types/chat.types';

export function getDefaultSuggestions(): SuggestionChip[] {
  return [
    {
      id: '1',
      label: i18n.t('chat:suggestions.reviewLast15Days.label'),
      prompt: i18n.t('chat:suggestions.reviewLast15Days.prompt'),
    },
    {
      id: '2',
      label: i18n.t('chat:suggestions.checkTodayEntries.label'),
      prompt: i18n.t('chat:suggestions.checkTodayEntries.prompt'),
    },
    {
      id: '3',
      label: i18n.t('chat:suggestions.findMissingWorkdays.label'),
      prompt: i18n.t('chat:suggestions.findMissingWorkdays.prompt'),
    },
    {
      id: '4',
      label: i18n.t('chat:suggestions.suggestNextLogs.label'),
      prompt: i18n.t('chat:suggestions.suggestNextLogs.prompt'),
    },
  ];
}
