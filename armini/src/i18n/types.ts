// Type augmentation for i18next
// Cross-namespace calls (e.g. t('common:save') from a 'finances' context)
// and dynamic keys (e.g. t(`status.${s}`)) require relaxed typing.
declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'common';
    // Allow any string key to support cross-namespace and dynamic lookups
    returnNull: false;
  }
}
