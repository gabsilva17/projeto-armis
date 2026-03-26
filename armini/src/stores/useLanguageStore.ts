import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import { getLocales } from 'expo-localization';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

export type SupportedLanguage = 'en' | 'pt';

function getDeviceLanguage(): SupportedLanguage {
  const locale = getLocales()[0]?.languageCode;
  if (locale === 'pt') return 'pt';
  return 'en';
}

interface LanguageStore {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
}

export const useLanguageStore = create<LanguageStore>()(
  persist(
    (set) => ({
      language: getDeviceLanguage(),
      setLanguage: (lang) => {
        void i18n.changeLanguage(lang);
        set({ language: lang });
      },
    }),
    {
      name: 'language-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ language: state.language }),
    },
  ),
);
