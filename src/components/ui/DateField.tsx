import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface DateFieldProps {
  label?: string;
  required?: boolean;
  value: string;
  placeholder: string;
  selectedDate: Date;
  helperText?: string;
  accessibilityLabel?: string;
  onChangeDate: (date: Date) => void;
}

export function DateField({
  label,
  required,
  value,
  placeholder,
  selectedDate,
  helperText,
  accessibilityLabel,
  onChangeDate,
}: DateFieldProps) {
  const colors = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const hasLabel = !!label && label.trim().length > 0;

  const handleDateChange = (event: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') {
      setShowDatePicker(false);
    }

    if (event.type === 'dismissed' || !date) return;
    onChangeDate(date);
  };

  return (
    <View style={styles.fieldBlock}>
      {hasLabel ? (
        <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>
          {label}
          {required ? <Text style={[styles.requiredMark, { color: colors.error }]}> *</Text> : null}
        </Text>
      ) : null}

      <TouchableOpacity
        style={[styles.inputPressable, { borderBottomColor: colors.border }]}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.75}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel ?? label}
      >
        <Text style={[styles.valueText, { color: colors.textPrimary }, !value && { color: colors.textMuted }]}>
          {value || placeholder}
        </Text>
      </TouchableOpacity>

      {showDatePicker && Platform.OS === 'ios' ? (
        <View style={[styles.iosDatePickerWrap, { borderColor: colors.border, backgroundColor: colors.surface }]}> 
          <DateTimePicker value={selectedDate} mode="date" display="spinner" onChange={handleDateChange} />
          <TouchableOpacity
            style={styles.iosDatePickerDoneBtn}
            onPress={() => setShowDatePicker(false)}
            activeOpacity={0.75}
            accessibilityRole="button"
            accessibilityLabel="Confirm date"
          >
            <Text style={[styles.iosDatePickerDoneText, { color: colors.textPrimary }]}>Done</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {showDatePicker && Platform.OS === 'android' ? (
        <DateTimePicker value={selectedDate} mode="date" display="default" onChange={handleDateChange} />
      ) : null}

      {helperText ? <Text style={[styles.helperText, { color: colors.textMuted }]}>{helperText}</Text> : null}
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
  inputPressable: {
    minHeight: 42,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    paddingHorizontal: 0,
    paddingVertical: Spacing[2] + 2,
    justifyContent: 'center',
  },
  valueText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.regular,
  },
  iosDatePickerWrap: {
    marginTop: Spacing[2],
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  iosDatePickerDoneBtn: {
    alignSelf: 'flex-end',
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
  },
  iosDatePickerDoneText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  helperText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: 18,
  },
});
