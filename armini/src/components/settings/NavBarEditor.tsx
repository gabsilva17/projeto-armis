import { useNavBarStore } from '@/src/stores/useNavBarStore';
import {
  NAV_TAB_REGISTRY,
  OPTIONAL_TAB_IDS,
  MAX_NAV_TABS,
  FIXED_FIRST_TAB,
  FIXED_LAST_TAB,
  type NavTabId,
} from '@/src/constants/navigation.constants';
import { Spacing, Typography, useTheme } from '@/src/theme';
import {
  ArrowUpIcon,
  ArrowDownIcon,
  XCircleIcon,
  PlusCircleIcon,
  LockSimpleIcon,
  ArrowCounterClockwiseIcon,
} from 'phosphor-react-native';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCallback, useMemo } from 'react';
import { HIT_SLOP } from '@/src/constants/ui.constants';

export function NavBarEditor() {
  const colors = useTheme();
  const { t } = useTranslation('settings');
  const { t: tCommon } = useTranslation();
  const { middleTabs, setMiddleTabs, resetTabs } = useNavBarStore();

  const maxMiddle = MAX_NAV_TABS - 2;
  const canAddMore = middleTabs.length < maxMiddle;

  const availableTabs = useMemo(
    () => OPTIONAL_TAB_IDS.filter(id => !middleTabs.includes(id)),
    [middleTabs],
  );

  const handleRemove = useCallback((id: NavTabId) => {
    setMiddleTabs(middleTabs.filter(tab => tab !== id));
  }, [middleTabs, setMiddleTabs]);

  const handleAdd = useCallback((id: NavTabId) => {
    if (!canAddMore) return;
    setMiddleTabs([...middleTabs, id]);
  }, [middleTabs, setMiddleTabs, canAddMore]);

  const handleMoveUp = useCallback((index: number) => {
    if (index <= 0) return;
    const updated = [...middleTabs];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    setMiddleTabs(updated);
  }, [middleTabs, setMiddleTabs]);

  const handleMoveDown = useCallback((index: number) => {
    if (index >= middleTabs.length - 1) return;
    const updated = [...middleTabs];
    [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
    setMiddleTabs(updated);
  }, [middleTabs, setMiddleTabs]);

  const renderFixedRow = (tabId: NavTabId, isLast: boolean) => {
    const tab = NAV_TAB_REGISTRY[tabId];
    return (
      <View
        key={tabId}
        style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.gray100 }]}>
          <tab.IconComponent size={18} color={colors.textPrimary} weight="bold" />
        </View>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{tCommon(tab.labelKey)}</Text>
        <View style={styles.rowActions}>
          <View style={[styles.badge, { backgroundColor: colors.gray100 }]}>
            <LockSimpleIcon size={11} color={colors.textMuted} weight="bold" />
            <Text style={[styles.badgeText, { color: colors.textMuted }]}>{t('navbar.required')}</Text>
          </View>
        </View>
      </View>
    );
  };

  const renderMiddleRow = (tabId: NavTabId, index: number) => {
    const tab = NAV_TAB_REGISTRY[tabId];
    const isFirst = index === 0;
    const isLast = index === middleTabs.length - 1;

    return (
      <View
        key={tabId}
        style={[styles.row, { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.gray100 }]}>
          <tab.IconComponent size={18} color={colors.textPrimary} weight="bold" />
        </View>
        <Text style={[styles.rowLabel, { color: colors.textPrimary }]}>{tCommon(tab.labelKey)}</Text>
        <View style={styles.rowActions}>
          <TouchableOpacity
            onPress={() => handleMoveUp(index)}
            disabled={isFirst}
            hitSlop={HIT_SLOP.sm}
            style={{ opacity: isFirst ? 0.25 : 1 }}
            accessibilityLabel={t('navbar.moveUp')}
          >
            <ArrowUpIcon size={18} color={colors.textSecondary} weight="bold" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleMoveDown(index)}
            disabled={isLast}
            hitSlop={HIT_SLOP.sm}
            style={{ opacity: isLast ? 0.25 : 1 }}
            accessibilityLabel={t('navbar.moveDown')}
          >
            <ArrowDownIcon size={18} color={colors.textSecondary} weight="bold" />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => handleRemove(tabId)}
            hitSlop={HIT_SLOP.sm}
            accessibilityLabel={t('navbar.remove')}
          >
            <XCircleIcon size={20} color={colors.error} weight="fill" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  const renderAvailableRow = (tabId: NavTabId, isLast: boolean) => {
    const tab = NAV_TAB_REGISTRY[tabId];
    return (
      <View
        key={tabId}
        style={[styles.row, !isLast && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
      >
        <View style={[styles.iconBox, { backgroundColor: colors.gray100 }]}>
          <tab.IconComponent size={18} color={colors.textMuted} weight="bold" />
        </View>
        <Text style={[styles.rowLabel, { color: colors.textMuted }]}>{tCommon(tab.labelKey)}</Text>
        <View style={styles.rowActions}>
          <TouchableOpacity
            onPress={() => handleAdd(tabId)}
            disabled={!canAddMore}
            hitSlop={HIT_SLOP.sm}
            style={{ opacity: canAddMore ? 1 : 0.25 }}
            accessibilityLabel={t('navbar.add')}
          >
            <PlusCircleIcon size={20} color={colors.success} weight="fill" />
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Active tabs */}
      <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {renderFixedRow(FIXED_FIRST_TAB, middleTabs.length === 0)}
        {middleTabs.map((id, i) => renderMiddleRow(id, i))}
        {renderFixedRow(FIXED_LAST_TAB, true)}
      </View>

      {/* Available tabs */}
      {availableTabs.length > 0 && (
        <View style={styles.availableSection}>
          <Text style={[styles.subLabel, { color: colors.textMuted }]}>{t('navbar.available')}</Text>
          {!canAddMore && (
            <Text style={[styles.hint, { color: colors.textMuted }]}>
              {t('navbar.maxReached', { max: MAX_NAV_TABS })}
            </Text>
          )}
          <View style={[styles.list, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {availableTabs.map((id, i) => renderAvailableRow(id, i === availableTabs.length - 1))}
          </View>
        </View>
      )}

      {/* Reset */}
      <TouchableOpacity
        style={styles.resetButton}
        onPress={resetTabs}
        hitSlop={HIT_SLOP.md}
        accessibilityLabel={t('navbar.reset')}
      >
        <ArrowCounterClockwiseIcon size={14} color={colors.textSecondary} weight="bold" />
        <Text style={[styles.resetText, { color: colors.textSecondary }]}>{t('navbar.reset')}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: Spacing[3],
  },
  list: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    gap: Spacing[3],
  },
  iconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowLabel: {
    flex: 1,
    fontSize: Typography.size.base,
    fontFamily: 'Inter_600SemiBold',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: Typography.size.xs,
    fontFamily: 'Inter_500Medium',
  },
  availableSection: {
    gap: Spacing[2],
  },
  subLabel: {
    fontSize: Typography.size.xs,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginLeft: Spacing[1],
  },
  hint: {
    fontSize: Typography.size.xs,
    marginLeft: Spacing[1],
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: Spacing[1],
    marginLeft: Spacing[1],
  },
  resetText: {
    fontSize: Typography.size.sm,
    fontFamily: 'Inter_500Medium',
  },
});
