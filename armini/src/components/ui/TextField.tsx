import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import type { ComponentProps } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';

type NativeTextFieldProps = ComponentProps<typeof TextInput>;

interface TextFieldProps extends NativeTextFieldProps {
  label?: string;
  required?: boolean;
  helperText?: string;
  errorText?: string;
}

export function TextField({ label, required, helperText, errorText, ...inputProps }: TextFieldProps) {
  const colors = useTheme();
  const hasLabel = !!label && label.trim().length > 0;
  const hasError = !!errorText && errorText.trim().length > 0;

  return (
    <View style={styles.fieldBlock}>
      {hasLabel ? (
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          {label}
          {required ? <Text style={[styles.requiredMark, { color: colors.error }]}> *</Text> : null}
        </Text>
      ) : null}

      <TextInput
        {...inputProps}
        style={[
          styles.input,
          { borderBottomColor: hasError ? colors.error : colors.border, color: colors.textPrimary },
          inputProps.style,
        ]}
        placeholderTextColor={inputProps.placeholderTextColor ?? colors.textMuted}
      />

      {hasError ? <Text style={[styles.helperText, { color: colors.error }]}>{errorText}</Text> : null}
      {!hasError && helperText ? <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  fieldBlock: {
    gap: Spacing[2],
  },
  fieldLabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  requiredMark: {
    fontFamily: Typography.fontFamily.bold,
  },
  input: {
    minHeight: 42,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 0,
    paddingVertical: Spacing[2] + 2,
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
    backgroundColor: 'transparent',
  },
  helperText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 18,
  },
});
