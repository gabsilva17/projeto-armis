import type { QuickAction } from '../types/quickActions.types';
import { ROUTES } from './app.constants';

export const ACTION_TYPE_OPTIONS = ['navigate', 'chat-prompt', 'open-chat'] as const;

export const ACTION_TYPE_LABELS: Record<string, string> = {
  navigate: 'Navigate to screen',
  'chat-prompt': 'Send chat prompt',
  'open-chat': 'Open assistant chat',
};

export const NAVIGABLE_ROUTES = [
  { value: ROUTES.FINANCES, label: 'Finances' },
  { value: ROUTES.TIMESHEETS, label: 'Timesheets' },
  { value: ROUTES.SETTINGS, label: 'Settings' },
] as const;

export const NAVIGABLE_ROUTE_VALUES = NAVIGABLE_ROUTES.map((r) => r.value) as unknown as readonly string[];

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'default-finances',
    title: 'Finances',
    description: 'Submit and manage your invoices',
    type: 'navigate',
    route: ROUTES.FINANCES,
  },
  {
    id: 'default-timesheets',
    title: 'Timesheets',
    description: 'Track your hours and projects',
    type: 'navigate',
    route: ROUTES.TIMESHEETS,
  },
  {
    id: 'default-armini',
    title: 'Armini',
    description: 'Open the assistant chat',
    type: 'open-chat',
  },
];

export const MAX_QUICK_ACTIONS = 10;
export const MAX_TITLE_LENGTH = 40;
export const MAX_DESCRIPTION_LENGTH = 80;
export const MAX_PROMPT_LENGTH = 200;
