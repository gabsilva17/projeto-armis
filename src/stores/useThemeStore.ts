import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_THEME_ID, type ThemeId } from '../theme/colors';

interface ThemeStore {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeStore>()(
  persist(
    (set) => ({
      themeId: DEFAULT_THEME_ID,
      setTheme: (id) => set({ themeId: id }),
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ themeId: state.themeId }),
    },
  ),
);
