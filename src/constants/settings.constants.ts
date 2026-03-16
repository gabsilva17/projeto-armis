import { THEME_CATALOG, themes, type ThemeId } from '@/src/theme/colors';

export interface ThemeOption {
  id: ThemeId;
  label: string;
  description: string;
}

export const SETTINGS_THEME_OPTIONS: ThemeOption[] = (Object.keys(themes) as ThemeId[]).map((id) => ({
  id,
  label: THEME_CATALOG[id].label,
  description: THEME_CATALOG[id].description,
}));

export const SETTINGS_COPY = {
  sectionLabel: 'APPEARANCE',
  title: 'Theme',
  subtitle: 'Choose a color scheme for the app. Your preference is saved automatically.',
} as const;
