import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import type { ThemeColors } from '@/src/theme';
import { type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type ViewStyle } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'destructive' | 'ghost';

interface ButtonProps {
  onPress: () => void;
  label: string;
  variant?: ButtonVariant;
  icon?: ReactNode;
  disabled?: boolean;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

function getVariantColors(variant: ButtonVariant, colors: ThemeColors) {
  switch (variant) {
    case 'primary':
      return { bg: colors.black, pressedBg: colors.gray800, labelColor: colors.white, borderColor: undefined };
    case 'secondary':
      return { bg: colors.white, pressedBg: colors.gray100, labelColor: colors.textPrimary, borderColor: colors.border };
    case 'destructive':
      return { bg: colors.white, pressedBg: colors.gray100, labelColor: colors.error, borderColor: colors.border };
    case 'ghost':
      return { bg: 'transparent', pressedBg: colors.gray100, labelColor: colors.textPrimary, borderColor: undefined };
  }
}

export function Button({
  onPress,
  label,
  variant = 'primary',
  icon,
  disabled = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const colors = useTheme();
  const vc = getVariantColors(variant, colors);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed && !disabled ? vc.pressedBg : vc.bg,
          borderWidth: vc.borderColor ? 1 : 0,
          borderColor: vc.borderColor,
        },
        disabled && styles.disabled,
        style,
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
    >
      <View style={styles.content}>
        {icon}
        <Text
          style={[
            styles.label,
            { color: vc.labelColor },
            disabled && { color: colors.gray500 },
          ]}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[5],
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[2],
  },
  label: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.medium,
  },
  disabled: {
    opacity: 0.5,
  },
});
