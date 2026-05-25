import { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInUp, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  CheckCircleIcon,
  InfoIcon,
  WarningCircleIcon,
  XCircleIcon,
  XIcon,
} from 'phosphor-react-native';
import { useToastStore, type ToastItem, type ToastVariant } from '@/src/stores/useToastStore';
import { Spacing, Typography, useTheme, type ThemeColors } from '@/src/theme';
import { ANIMATION_DURATIONS, EASING } from '@/src/constants/animation.constants';
import { HIT_SLOP } from '@/src/constants/ui.constants';
import { BOTTOM_NAV_HEIGHT } from '@/src/components/navigation/BottomNavBar';

const AUTO_DISMISS_MS = 4_000;

export function Toast() {
  const current = useToastStore((s) => s.queue[0] ?? null);
  return current ? <ToastCard key={current.id} toast={current} /> : null;
}

function ToastCard({ toast }: { toast: ToastItem }) {
  const colors = useTheme();
  const insets = useSafeAreaInsets();
  const dismiss = useToastStore((s) => s.dismiss);

  useEffect(() => {
    const handle = setTimeout(() => dismiss(toast.id), AUTO_DISMISS_MS);
    return () => clearTimeout(handle);
  }, [toast.id, dismiss]);

  const { Icon, iconColor } = resolveIcon(toast.variant, colors);

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrapper,
        { bottom: insets.bottom + BOTTOM_NAV_HEIGHT + Spacing[2] },
      ]}
    >
      <Animated.View
        entering={FadeInUp.duration(ANIMATION_DURATIONS.modalEnter).easing(EASING.outCubic)}
        exiting={FadeOutDown.duration(ANIMATION_DURATIONS.modalBackdropExit).easing(EASING.inCubic)}
        style={[
          styles.card,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
      >
        <Icon size={20} color={iconColor} weight="fill" />
        <View style={styles.text}>
          {toast.title ? (
            <Text style={[styles.title, { color: colors.textPrimary }]}>{toast.title}</Text>
          ) : null}
          <Text style={[styles.message, { color: colors.textSecondary }]}>{toast.message}</Text>
        </View>
        <Pressable
          onPress={() => dismiss(toast.id)}
          hitSlop={HIT_SLOP.md}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
          style={styles.close}
        >
          <XIcon size={16} color={colors.textMuted} weight="bold" />
        </Pressable>
      </Animated.View>
    </View>
  );
}

function resolveIcon(variant: ToastVariant, colors: ThemeColors) {
  switch (variant) {
    case 'success':
      return { Icon: CheckCircleIcon, iconColor: colors.success };
    case 'error':
      return { Icon: XCircleIcon, iconColor: colors.error };
    case 'warning':
      return { Icon: WarningCircleIcon, iconColor: colors.textPrimary };
    case 'info':
    default:
      return { Icon: InfoIcon, iconColor: colors.textPrimary };
  }
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    left: Spacing[4],
    right: Spacing[4],
    zIndex: 9999,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing[3],
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  message: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 18,
  },
  close: {
    paddingTop: 2,
  },
});
