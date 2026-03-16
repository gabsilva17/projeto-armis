import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import type { DaySummary } from '@/src/types/timesheets';
import { memo } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CELL_SIZE } from './timesheetsConstants';
import { isToday, isWeekend, toDateKey } from './timesheetsHelpers';

interface DayCellProps {
  day: number | null;
  year: number;
  month: number;
  daySummary: DaySummary | undefined;
  isSelected: boolean;
  onPress: (date: string) => void;
}

export const DayCell = memo(function DayCell({ day, year, month, daySummary, isSelected, onPress }: DayCellProps) {
  const colors = useTheme();

  if (day === null) return <View style={styles.dayCell} />;

  const weekend = isWeekend(year, month, day);
  const today = isToday(year, month, day);
  const hasEntries = !!daySummary;
  const dateKey = toDateKey(year, month, day);

  return (
    <TouchableOpacity
      style={[
        styles.dayCell,
        weekend && styles.dayCellWeekend,
        isSelected && { backgroundColor: colors.black },
        today && !isSelected && { backgroundColor: colors.gray200 },
      ]}
      onPress={() => onPress(dateKey)}
      activeOpacity={0.75}
    >
      <Text
        style={[
          styles.dayNumber,
          { color: colors.textPrimary },
          weekend && { color: colors.textMuted },
          isSelected && { color: colors.textInverse },
          today && !isSelected && { color: colors.textPrimary, fontFamily: Typography.fontFamily.bold },
        ]}
      >
        {day}
      </Text>
      {hasEntries && (
        <Text style={[styles.hoursText, { color: colors.textSecondary }, isSelected && { color: colors.gray300 }]}>
          {daySummary.totalHours}h
        </Text>
      )}
      {hasEntries && !isSelected && <View style={[styles.dot, { backgroundColor: colors.black }]} />}
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  dayCell: {
    width: `${100 / 7}%`,
    minHeight: CELL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing[1],
    borderRadius: 8,
    marginVertical: 2,
  },
  dayCellWeekend: { opacity: 0.4 },
  dayNumber: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  hoursText: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 1,
  },
  dot: { width: 4, height: 4, borderRadius: 2, marginTop: 2 },
});
