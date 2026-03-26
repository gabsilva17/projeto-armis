import type { QuickAction } from '../types/quickActions.types';
import { ROUTES } from './app.constants';

export const ACTION_TYPE_OPTIONS = ['navigate', 'chat-prompt', 'open-chat'] as const;

export const NAVIGABLE_ROUTE_KEYS = [
  { value: ROUTES.FINANCES, labelKey: 'finances' },
  { value: ROUTES.TIMESHEETS, labelKey: 'timesheets' },
  { value: ROUTES.SETTINGS, labelKey: 'settings' },
] as const;

export const NAVIGABLE_ROUTE_VALUES = NAVIGABLE_ROUTE_KEYS.map((r) => r.value) as unknown as readonly string[];

export const DEFAULT_QUICK_ACTIONS: QuickAction[] = [
  {
    id: 'default-finances',
    title: '',
    description: '',
    type: 'navigate',
    route: ROUTES.FINANCES,
  },
  {
    id: 'default-timesheets',
    title: '',
    description: '',
    type: 'navigate',
    route: ROUTES.TIMESHEETS,
  },
  {
    id: 'default-armini',
    title: '',
    description: '',
    type: 'open-chat',
  },
];

export const MAX_QUICK_ACTIONS = 10;
export const MAX_TITLE_LENGTH = 40;
export const MAX_DESCRIPTION_LENGTH = 80;
export const MAX_PROMPT_LENGTH = 200;
