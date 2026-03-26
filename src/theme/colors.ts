export interface ThemeColors {
  // Absolute
  black: string;
  white: string;

  // Gray scale
  gray100: string;
  gray200: string;
  gray300: string;
  gray400: string;
  gray500: string;
  gray600: string;
  gray700: string;
  gray800: string;
  gray900: string;

  // Semantic aliases
  background: string;
  surface: string;
  border: string;
  borderDark: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // Sidebar
  sidebarBackground: string;
  sidebarText: string;
  sidebarDivider: string;
  sidebarMuted: string;

  // Chat bubbles
  bubbleUser: string;
  bubbleUserText: string;
  bubbleAI: string;
  bubbleAIText: string;
  bubbleAIBorder: string;

  // Status
  success: string;
  error: string;
}

export const themes = {
  light: {
    black: '#1a1a1a',
    white: '#FFFFFF',
    gray100: '#F5F5F5',
    gray200: '#E8E8E8',
    gray300: '#D0D0D0',
    gray400: '#A0A0A0',
    gray500: '#808080',
    gray600: '#606060',
    gray700: '#404040',
    gray800: '#202020',
    gray900: '#101010',
    background: '#FFFFFF',
    surface: '#F5F5F5',
    border: '#E8E8E8',
    borderDark: '#1a1a1a',
    textPrimary: '#1a1a1a',
    textSecondary: '#606060',
    textMuted: '#A0A0A0',
    textInverse: '#FFFFFF',
    sidebarBackground: '#111111',
    sidebarText: '#FFFFFF',
    sidebarDivider: '#1e1e1e',
    sidebarMuted: '#505050',
    bubbleUser: '#1a1a1a',
    bubbleUserText: '#FFFFFF',
    bubbleAI: '#FFFFFF',
    bubbleAIText: '#3d3d3d',
    bubbleAIBorder: '#E8E8E8',
    success: '#22c55e',
    error: '#e05c5c',
  },

  dark: {
    black: '#f0f0f0',
    white: '#0f0f0f',
    gray100: '#1a1a1a',
    gray200: '#252525',
    gray300: '#333333',
    gray400: '#555555',
    gray500: '#777777',
    gray600: '#999999',
    gray700: '#bbbbbb',
    gray800: '#dddddd',
    gray900: '#f0f0f0',
    background: '#0f0f0f',
    surface: '#1a1a1a',
    border: '#2a2a2a',
    borderDark: '#f0f0f0',
    textPrimary: '#f0f0f0',
    textSecondary: '#999999',
    textMuted: '#555555',
    textInverse: '#0f0f0f',
    sidebarBackground: '#080808',
    sidebarText: '#f0f0f0',
    sidebarDivider: '#1e1e1e',
    sidebarMuted: '#454545',
    bubbleUser: '#f0f0f0',
    bubbleUserText: '#0f0f0f',
    bubbleAI: '#1a1a1a',
    bubbleAIText: '#d0d0d0',
    bubbleAIBorder: '#2a2a2a',
    success: '#4ade80',
    error: '#f87171',
  },

  blue: {
    black: '#0f172a',
    white: '#f8fafc',
    gray100: '#f1f5f9',
    gray200: '#e2e8f0',
    gray300: '#cbd5e1',
    gray400: '#94a3b8',
    gray500: '#64748b',
    gray600: '#475569',
    gray700: '#334155',
    gray800: '#1e293b',
    gray900: '#0f172a',
    background: '#f8fafc',
    surface: '#f1f5f9',
    border: '#e2e8f0',
    borderDark: '#0f172a',
    textPrimary: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#94a3b8',
    textInverse: '#f8fafc',
    sidebarBackground: '#0f172a',
    sidebarText: '#f8fafc',
    sidebarDivider: '#1e293b',
    sidebarMuted: '#4a5568',
    bubbleUser: '#0f172a',
    bubbleUserText: '#f8fafc',
    bubbleAI: '#f8fafc',
    bubbleAIText: '#334155',
    bubbleAIBorder: '#e2e8f0',
    success: '#16a34a',
    error: '#dc2626',
  },

  orange: {
    black: '#2c1810',
    white: '#fdf6ee',
    gray100: '#faebd7',
    gray200: '#f5dfc0',
    gray300: '#e8c99a',
    gray400: '#b89070',
    gray500: '#9a7055',
    gray600: '#6b4c32',
    gray700: '#4a3020',
    gray800: '#2c1810',
    gray900: '#1a0f08',
    background: '#fdf6ee',
    surface: '#faebd7',
    border: '#f0d9b5',
    borderDark: '#2c1810',
    textPrimary: '#2c1810',
    textSecondary: '#6b4c32',
    textMuted: '#b89070',
    textInverse: '#fdf6ee',
    sidebarBackground: '#1a0f08',
    sidebarText: '#faebd7',
    sidebarDivider: '#2c1c10',
    sidebarMuted: '#7a4a30',
    bubbleUser: '#2c1810',
    bubbleUserText: '#fdf6ee',
    bubbleAI: '#faebd7',
    bubbleAIText: '#4a3020',
    bubbleAIBorder: '#f0d9b5',
    success: '#16a34a',
    error: '#c0392b',
  },
} satisfies Record<string, ThemeColors>;

export type ThemeId = keyof typeof themes;

export const DEFAULT_THEME_ID: ThemeId = 'light';

// Backward compat — used during migration; prefer useTheme() hook
export const Colors = themes.light;

export type ColorKey = keyof ThemeColors;
