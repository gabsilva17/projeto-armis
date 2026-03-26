import 'intl-pluralrules';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import enCommon from './locales/en/common.json';
import enHome from './locales/en/home.json';
import enFinances from './locales/en/finances.json';
import enTimesheets from './locales/en/timesheets.json';
import enChat from './locales/en/chat.json';
import enSettings from './locales/en/settings.json';
import enMore from './locales/en/more.json';

import ptCommon from './locales/pt/common.json';
import ptHome from './locales/pt/home.json';
import ptFinances from './locales/pt/finances.json';
import ptTimesheets from './locales/pt/timesheets.json';
import ptChat from './locales/pt/chat.json';
import ptSettings from './locales/pt/settings.json';
import ptMore from './locales/pt/more.json';

const LANGUAGE_STORAGE_KEY = 'language-store';

type SupportedLanguage = 'en' | 'pt';

function getDeviceLanguage(): SupportedLanguage {
  const locale = getLocales()[0]?.languageCode;
  if (locale === 'pt') return 'pt';
  return 'en';
}

async function getStoredLanguage(): Promise<SupportedLanguage | null> {
  try {
    const raw = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { state?: { language?: string } };
    const lang = parsed?.state?.language;
    if (lang === 'en' || lang === 'pt') return lang;
    return null;
  } catch {
    return null;
  }
}

const resources = {
  en: {
    common: enCommon,
    home: enHome,
    finances: enFinances,
    timesheets: enTimesheets,
    chat: enChat,
    settings: enSettings,
    more: enMore,
  },
  pt: {
    common: ptCommon,
    home: ptHome,
    finances: ptFinances,
    timesheets: ptTimesheets,
    chat: ptChat,
    settings: ptSettings,
    more: ptMore,
  },
} as const;

// Initialize synchronously with device language, then update from storage
i18n.use(initReactI18next).init({
  resources,
  lng: getDeviceLanguage(),
  fallbackLng: 'en',
  defaultNS: 'common',
  ns: ['common', 'home', 'finances', 'timesheets', 'chat', 'settings', 'more'],
  interpolation: {
    escapeValue: false,
  },
  compatibilityJSON: 'v4',
});

// Async update from persisted preference
getStoredLanguage().then((stored) => {
  if (stored && stored !== i18n.language) {
    void i18n.changeLanguage(stored);
  }
});

export default i18n;
