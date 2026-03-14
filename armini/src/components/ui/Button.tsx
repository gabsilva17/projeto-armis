import { Colors, Spacing, Typography } from '@/src/theme';
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

export function Button({
  onPress,
  label,
  variant = 'primary',
  icon,
  disabled = false,
  style,
  accessibilityLabel,
}: ButtonProps) {
  const variantStyles = variants[variant];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.base,
        variantStyles.container,
        disabled && styles.disabled,
        pressed && !disabled && variantStyles.pressed,
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
            variantStyles.label,
            disabled && styles.labelDisabled,
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
  labelDisabled: {
    color: Colors.gray500,
  },
});

const variants = {
  primary: StyleSheet.create({
    container: {
      backgroundColor: Colors.black,
    },
    pressed: {
      backgroundColor: Colors.gray800,
    },
    label: {
      color: Colors.white,
    },
  }),
  secondary: StyleSheet.create({
    container: {
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    pressed: {
      backgroundColor: Colors.gray100,
    },
    label: {
      color: Colors.textPrimary,
    },
  }),
  destructive: StyleSheet.create({
    container: {
      backgroundColor: Colors.white,
      borderWidth: 1,
      borderColor: Colors.border,
    },
    pressed: {
      backgroundColor: Colors.gray100,
    },
    label: {
      color: Colors.error,
    },
  }),
  ghost: StyleSheet.create({
    container: {
      backgroundColor: 'transparent',
    },
    pressed: {
      backgroundColor: Colors.gray100,
    },
    label: {
      color: Colors.textPrimary,
    },
  }),
};
