import { Colors, Spacing, Typography } from '@/src/theme';
import type { MonthSummary } from '@/src/types/timesheets';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { DAY_LABELS } from './timesheetsConstants';
import { isToday, isWeekend, toDateKey } from './timesheetsHelpers';

export const COMPACT_STRIP_HEIGHT = 80;

interface WeekStripProps {
  week: (number | null)[];
  year: number;
  month: number;
  monthData: MonthSummary | null | undefined;
  selectedDate: string | null;
  onPress: (date: string) => void;
}

export function WeekStrip({ week, year, month, monthData, selectedDate, onPress }: WeekStripProps) {
  const maxHours = week.reduce((max, day) => {
    if (day === null) return max;
    const h = monthData?.days[toDateKey(year, month, day)]?.totalHours ?? 0;
    return Math.max(max, h);
  }, 0);

  return (
    <View style={styles.strip}>
      {week.map((day, i) => {
        if (day === null) return <View key={i} style={styles.cell} />;

        const dateKey = toDateKey(year, month, day);
        const daySummary = monthData?.days[dateKey];
        const selected = selectedDate === dateKey;
        const today = isToday(year, month, day);
        const weekend = isWeekend(year, month, day);
        const hours = daySummary?.totalHours ?? 0;
        const barFill = maxHours > 0 ? hours / maxHours : 0;

        return (
          <TouchableOpacity
            key={i}
            style={[
              styles.cell,
              today && !selected && styles.cellToday,
              selected && styles.cellSelected,
            ]}
            onPress={() => onPress(dateKey)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.dayLabel,
              weekend && styles.dayLabelMuted,
              selected && styles.textSelected,
            ]}>
              {DAY_LABELS[i]}
            </Text>

            <Text style={[
              styles.dayNumber,
              weekend && !selected && styles.dayNumberMuted,
              today && !selected && styles.dayNumberToday,
              selected && styles.textSelected,
            ]}>
              {day}
            </Text>

            {/* Hours bar */}
            <View style={[styles.barTrack, selected && styles.barTrackSelected]}>
              {barFill > 0 && (
                <View
                  style={[
                    styles.barFill,
                    selected && styles.barFillSelected,
                    { width: `${barFill * 100}%` as any },
                  ]}
                />
              )}
            </View>

            <Text style={[
              styles.hours,
              selected && styles.hoursSelected,
              !daySummary && styles.hoursEmpty,
            ]}>
              {daySummary ? `${hours}h` : '·'}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    height: COMPACT_STRIP_HEIGHT,
    gap: Spacing[1],
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    borderRadius: 12,
    paddingVertical: Spacing[2],
  },
  cellSelected: { backgroundColor: Colors.black },
  cellToday: { backgroundColor: Colors.gray200 },

  dayLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dayLabelMuted: { opacity: 0.45 },

  dayNumber: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
  },
  dayNumberMuted: { color: Colors.textMuted },
  dayNumberToday: { fontFamily: Typography.fontFamily.bold },

  textSelected: { color: Colors.white },

  barTrack: {
    width: '60%',
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.gray200,
    overflow: 'hidden',
  },
  barTrackSelected: { backgroundColor: 'rgba(255,255,255,0.25)' },
  barFill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: Colors.black,
  },
  barFillSelected: { backgroundColor: Colors.white },

  hours: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: Typography.fontFamily.medium,
  },
  hoursSelected: { color: Colors.gray300 },
  hoursEmpty: { color: Colors.gray300 },
});
