export const APP_NAME = 'ARMIS';
export const USER_NAME = 'Gabriel';

export const SIDEBAR_WIDTH = 260;

export const ROUTES = {
  HOME: '/(main)/home' as const,
  FINANCES: '/(main)/finances' as const,
  TIMESHEETS: '/(main)/timesheets' as const,
  MORE: '/(main)/more' as const,
  SETTINGS: '/(main)/settings' as const,
} as const;

export const MAIN_ROUTE_ORDER = [
  ROUTES.HOME,
  ROUTES.FINANCES,
  ROUTES.TIMESHEETS,
  ROUTES.MORE,
  ROUTES.SETTINGS,
] as const;
