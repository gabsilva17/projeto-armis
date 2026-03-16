import { themes, type ThemeColors } from '../theme/colors';
import { useThemeStore } from '../stores/useThemeStore';

export function useTheme(): ThemeColors {
  const themeId = useThemeStore((s) => s.themeId);
  return themes[themeId];
}
