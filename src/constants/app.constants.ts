export const APP_NAME = 'ARMIS';
export const USER_NAME = 'Gabriel';

// Feature flags — flip to true when backend is ready
export const FEATURES = {
  BACKEND_CONNECTED: false,
} as const;

export const SIDEBAR_WIDTH = 260;
export const SIDEBAR_BREAKPOINT = 768;

export const ROUTES = {
  HOME: '/(main)/home' as const,
  ARMINI_CHAT: '/(main)/whistleblow' as const,
  FINANCES: '/(main)/finances' as const,
  TIMESHEETS: '/(main)/timesheets' as const,
  MORE: '/(main)/more' as const,
  SETTINGS: '/(main)/settings' as const,
} as const;

export const MAIN_ROUTE_ORDER = [
  ROUTES.HOME,
  ROUTES.ARMINI_CHAT,
  ROUTES.FINANCES,
  ROUTES.TIMESHEETS,
  ROUTES.MORE,
  ROUTES.SETTINGS,
] as const;
