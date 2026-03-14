import { Colors, Spacing, Typography } from '@/src/theme';
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
        isSelected && styles.dayCellSelected,
        today && !isSelected && styles.dayCellToday,
      ]}
      onPress={() => onPress(dateKey)}
      activeOpacity={0.75}
    >
      <Text
        style={[
          styles.dayNumber,
          weekend && styles.dayNumberMuted,
          isSelected && styles.dayNumberSelected,
          today && !isSelected && styles.dayNumberToday,
        ]}
      >
        {day}
      </Text>
      {hasEntries && (
        <Text style={[styles.hoursText, isSelected && styles.hoursTextSelected]}>
          {daySummary.totalHours}h
        </Text>
      )}
      {hasEntries && !isSelected && <View style={styles.dot} />}
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
  dayCellSelected: { backgroundColor: Colors.black },
  dayCellToday: { backgroundColor: Colors.gray200 },
  dayNumber: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
    color: Colors.textPrimary,
  },
  dayNumberMuted: { color: Colors.textMuted },
  dayNumberSelected: { color: Colors.textInverse },
  dayNumberToday: { color: Colors.textPrimary, fontFamily: Typography.fontFamily.bold },
  hoursText: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.medium,
    marginTop: 1,
  },
  hoursTextSelected: { color: Colors.gray300 },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: Colors.black, marginTop: 2 },
});
