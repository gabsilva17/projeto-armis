import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { DEFAULT_MIDDLE_TABS, OPTIONAL_TAB_IDS, MAX_NAV_TABS, type NavTabId } from '../constants/navigation.constants';

const MAX_MIDDLE = MAX_NAV_TABS - 2;

interface NavBarStore {
  middleTabs: NavTabId[];
  setMiddleTabs: (tabs: NavTabId[]) => void;
  resetTabs: () => void;
}

export const useNavBarStore = create<NavBarStore>()(
  persist(
    (set) => ({
      middleTabs: DEFAULT_MIDDLE_TABS,
      setMiddleTabs: (tabs) => {
        const valid = tabs.filter(id => OPTIONAL_TAB_IDS.includes(id)).slice(0, MAX_MIDDLE);
        set({ middleTabs: valid });
      },
      resetTabs: () => set({ middleTabs: [...DEFAULT_MIDDLE_TABS] }),
    }),
    {
      name: 'navbar-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ middleTabs: state.middleTabs }),
    },
  ),
);
