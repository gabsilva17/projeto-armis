import { Spacing, Typography, useTheme } from '@/src/theme';
import { EASING, ANIMATION_DURATIONS } from '@/src/constants/animation.constants';
import { ChatCircleDotsIcon, CameraIcon } from 'phosphor-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import type { MessageAction, ExpenseActionType } from '@/src/types/chat.types';

const ICON_MAP = {
  chat: ChatCircleDotsIcon,
  camera: CameraIcon,
} as const;

interface ExpenseActionButtonsProps {
  actions: MessageAction[];
  onAction: (actionType: ExpenseActionType) => void;
}

export function ExpenseActionButtons({ actions, onAction }: ExpenseActionButtonsProps) {
  const colors = useTheme();

  return (
    <Animated.View
      entering={FadeInUp.duration(200).easing(EASING.outCubic)}
      style={styles.container}
    >
      {actions.map((action) => {
        const Icon = ICON_MAP[action.icon];
        return (
          <Pressable
            key={action.id}
            onPress={() => onAction(action.actionType)}
            style={({ pressed }) => [
              styles.button,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
              },
              pressed && { backgroundColor: colors.gray100 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={action.label}
          >
            <Icon size={18} color={colors.textPrimary} weight="fill" />
            <Text style={[styles.label, { color: colors.textPrimary }]}>{action.label}</Text>
          </Pressable>
        );
      })}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: Spacing[2],
    marginTop: Spacing[3],
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[3],
    borderRadius: 12,
    borderWidth: 1,
  },
  label: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
});
