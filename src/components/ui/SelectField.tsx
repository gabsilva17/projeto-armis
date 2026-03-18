import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import { CaretDownIcon, CheckIcon } from 'phosphor-react-native';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface SelectFieldProps {
  label?: string;
  required?: boolean;
  value: string;
  placeholder: string;
  options: readonly string[];
  helperText?: string;
  errorText?: string;
  accessibilityLabel?: string;
  getOptionLabel?: (option: string) => string;
  optionToValue?: (option: string) => string;
  onChange: (value: string) => void;
}

export function SelectField({
  label,
  required,
  value,
  placeholder,
  options,
  helperText,
  errorText,
  accessibilityLabel,
  getOptionLabel,
  optionToValue,
  onChange,
}: SelectFieldProps) {
  const colors = useTheme();
  const [open, setOpen] = useState(false);
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

      <TouchableOpacity
        style={[styles.selectTrigger, { borderBottomColor: hasError ? colors.error : colors.border }]}
        activeOpacity={0.75}
        onPress={() => setOpen((current) => !current)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
      >
        <Text style={[styles.selectTriggerText, { color: colors.textPrimary }, !value && { color: colors.textMuted }]}>
          {value || placeholder}
        </Text>
        <CaretDownIcon size={16} color={colors.textMuted} style={open && styles.caretOpen} />
      </TouchableOpacity>

      {open && (
        <View style={[styles.selectMenu, { borderColor: colors.border, backgroundColor: colors.background }]}>
          {options.map((option, index) => {
            const nextValue = optionToValue ? optionToValue(option) : option;
            const isSelected = nextValue === value;
            const optionLabel = getOptionLabel ? getOptionLabel(option) : option;

            return (
              <TouchableOpacity
                key={option}
                style={[
                  styles.selectItem,
                  index < options.length - 1 && [styles.selectItemBorder, { borderBottomColor: colors.border }],
                ]}
                onPress={() => {
                  onChange(nextValue);
                  setOpen(false);
                }}
                activeOpacity={0.75}
              >
                <Text style={[styles.selectItemText, { color: colors.textSecondary }, isSelected && [styles.selectItemTextActive, { color: colors.textPrimary }]]}>
                  {optionLabel}
                </Text>
                {isSelected ? <CheckIcon size={14} weight="bold" color={colors.textPrimary} /> : null}
              </TouchableOpacity>
            );
          })}
        </View>
      )}

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
  selectTrigger: {
    minHeight: 42,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 0,
    paddingVertical: Spacing[2] + 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  selectTriggerText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
    flexShrink: 1,
  },
  caretOpen: {
    transform: [{ rotate: '180deg' }],
  },
  selectMenu: {
    marginTop: Spacing[2],
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectItem: {
    minHeight: 42,
    paddingHorizontal: Spacing[3],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectItemBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  selectItemText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
  },
  selectItemTextActive: {
    fontFamily: Typography.fontFamily.medium,
  },
  helperText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 18,
  },
});
