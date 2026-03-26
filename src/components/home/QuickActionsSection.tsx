import { MAX_QUICK_ACTIONS } from '@/src/constants/quickActions.constants';
import { useAlert } from '@/src/contexts/AlertContext';
import { useQuickActionsStore } from '@/src/stores/useQuickActionsStore';
import { Spacing, Typography, useTheme } from '@/src/theme';
import type { QuickAction } from '@/src/types/quickActions.types';
import { Ionicons } from '@expo/vector-icons';
import { PlusIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { QuickActionFormModal } from './QuickActionFormModal';

interface QuickActionsSectionProps {
  onNavigate: (route: string) => void;
  onOpenChat: () => void;
  onChatPrompt: (prompt: string) => void;
}

export function QuickActionsSection({ onNavigate, onOpenChat, onChatPrompt }: QuickActionsSectionProps) {
  const colors = useTheme();
  const { t } = useTranslation('home');
  const alert = useAlert();
  const actions = useQuickActionsStore((s) => s.actions);
  const removeAction = useQuickActionsStore((s) => s.removeAction);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingAction, setEditingAction] = useState<QuickAction | null>(null);

  const getActionTitle = (action: QuickAction) => {
    if (action.id === 'default-finances') return t('quickActions.defaultFinancesTitle');
    if (action.id === 'default-timesheets') return t('quickActions.defaultTimesheetsTitle');
    if (action.id === 'default-armini') return t('quickActions.defaultArminiTitle');
    return action.title;
  };

  const getActionDescription = (action: QuickAction) => {
    if (action.id === 'default-finances') return t('quickActions.defaultFinancesDesc');
    if (action.id === 'default-timesheets') return t('quickActions.defaultTimesheetsDesc');
    if (action.id === 'default-armini') return t('quickActions.defaultArminiDesc');
    return action.description;
  };

  const handlePress = (action: QuickAction) => {
    if (action.type === 'navigate' && action.route) {
      onNavigate(action.route);
    } else if (action.type === 'open-chat') {
      onOpenChat();
    } else if (action.type === 'chat-prompt' && action.chatPrompt) {
      onChatPrompt(action.chatPrompt);
    }
  };

  const handleLongPress = (action: QuickAction) => {
    alert(getActionTitle(action), undefined, [
      {
        text: t('common:edit'),
        onPress: () => {
          setEditingAction(action);
          setModalVisible(true);
        },
      },
      {
        text: t('common:delete'),
        style: 'destructive',
        onPress: () => removeAction(action.id),
      },
      { text: t('common:cancel'), style: 'cancel' },
    ]);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingAction(null);
  };

  const canAdd = actions.length < MAX_QUICK_ACTIONS;

  return (
    <>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('quickActions.title')}</Text>
        <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>
          {t('quickActions.count', { count: actions.length })}
        </Text>
      </View>

      <View style={[styles.actionsRail, { borderTopColor: colors.border }]}>
        {actions.map((action, i) => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionRow, { borderBottomColor: colors.border }]}
            onPress={() => handlePress(action)}
            onLongPress={() => handleLongPress(action)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={getActionTitle(action)}
            accessibilityHint={t('quickActions.longPressHint')}
          >
            <Text style={[styles.actionIndex, { color: colors.textMuted }]}>
              {String(i + 1).padStart(2, '0')}
            </Text>
            <View style={styles.actionBody}>
              <Text style={[styles.actionTitle, { color: colors.textPrimary }]} numberOfLines={1}>
                {getActionTitle(action)}
              </Text>
              {getActionDescription(action) ? (
                <Text style={[styles.actionDescription, { color: colors.textSecondary }]} numberOfLines={1}>
                  {getActionDescription(action)}
                </Text>
              ) : null}
            </View>
            <Ionicons name="arrow-forward" size={18} color={colors.textPrimary} />
          </TouchableOpacity>
        ))}

        {canAdd ? (
          <TouchableOpacity
            style={[styles.addRow, { borderBottomColor: colors.border }]}
            onPress={() => {
              setEditingAction(null);
              setModalVisible(true);
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t('quickActions.addAction')}
          >
            <View style={[styles.addIconCircle, { borderColor: colors.border }]}>
              <PlusIcon size={14} weight="bold" color={colors.textMuted} />
            </View>
            <Text style={[styles.addLabel, { color: colors.textMuted }]}>{t('quickActions.addAction')}</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <QuickActionFormModal
        visible={modalVisible}
        editAction={editingAction}
        onClose={handleCloseModal}
      />
    </>
  );
}

const styles = StyleSheet.create({
  sectionHeader: {
    marginTop: Spacing[6],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.bold,
  },
  sectionMeta: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsRail: {
    marginTop: Spacing[3],
    borderTopWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  actionIndex: {
    width: 28,
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  actionDescription: {
    fontSize: Typography.size.sm,
  },
  addRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  addIconCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addLabel: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.medium,
  },
});
