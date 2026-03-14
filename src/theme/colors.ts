export const Colors = {
  // Absolute
  black: '#1a1a1a',
  white: '#FFFFFF',

  // Gray scale
  gray100: '#F5F5F5',
  gray200: '#E8E8E8',
  gray300: '#D0D0D0',
  gray400: '#A0A0A0',
  gray500: '#808080',
  gray600: '#606060',
  gray700: '#404040',
  gray800: '#202020',
  gray900: '#101010',

  // Semantic aliases
  background: '#FFFFFF',
  surface: '#F5F5F5',
  border: '#E8E8E8',
  borderDark: '#1a1a1a',
  textPrimary: '#1a1a1a',
  textSecondary: '#606060',
  textMuted: '#A0A0A0',
  textInverse: '#FFFFFF',

  // Sidebar (dark theme)
  sidebarBackground: '#1a1a1a',
  sidebarText: '#FFFFFF',
  sidebarTextMuted: '#808080',
  sidebarItemActiveBg: '#FFFFFF',
  sidebarItemActiveText: '#1a1a1a',
  sidebarDivider: '#202020',

  // Chat bubbles
  bubbleUser: '#1a1a1a',
  bubbleUserText: '#FFFFFF',
  bubbleAI: '#FFFFFF',
  bubbleAIText: '#3d3d3d',
  bubbleAIBorder: '#E8E8E8',

  // Status
  success: '#1a1a1a',
  error: '#606060',
} as const;

export type ColorKey = keyof typeof Colors;
