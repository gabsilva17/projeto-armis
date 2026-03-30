import { ClockIcon, CurrencyDollarIcon, DotsThreeCircleIcon, HouseIcon, type Icon } from 'phosphor-react-native';
import type { Href } from 'expo-router';

export type NavTabId = 'home' | 'finances' | 'timesheets' | 'more';

export interface NavTabDefinition {
  id: NavTabId;
  IconComponent: Icon;
  href: Href;
  route: string;
  labelKey: string;
}

export const NAV_TAB_REGISTRY: Record<NavTabId, NavTabDefinition> = {
  home: { id: 'home', IconComponent: HouseIcon, href: '/(main)/home' as Href, route: '/home', labelKey: 'nav.home' },
  finances: { id: 'finances', IconComponent: CurrencyDollarIcon, href: '/(main)/finances' as Href, route: '/finances', labelKey: 'nav.finances' },
  timesheets: { id: 'timesheets', IconComponent: ClockIcon, href: '/(main)/timesheets' as Href, route: '/timesheets', labelKey: 'nav.timesheets' },
  more: { id: 'more', IconComponent: DotsThreeCircleIcon, href: '/(main)/more' as Href, route: '/more', labelKey: 'nav.more' },
};

export const FIXED_FIRST_TAB: NavTabId = 'home';
export const FIXED_LAST_TAB: NavTabId = 'more';
export const MAX_NAV_TABS = 5;
export const DEFAULT_MIDDLE_TABS: NavTabId[] = ['finances', 'timesheets'];

/** All tab IDs that the user can add/remove/reorder */
export const OPTIONAL_TAB_IDS: NavTabId[] = (Object.keys(NAV_TAB_REGISTRY) as NavTabId[])
  .filter(id => id !== FIXED_FIRST_TAB && id !== FIXED_LAST_TAB);
