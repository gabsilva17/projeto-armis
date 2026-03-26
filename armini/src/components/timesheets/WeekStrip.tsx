import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import type { MonthSummary } from '@/src/types/timesheets';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DAY_LABEL_KEYS } from './timesheetsConstants';
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
  const colors = useTheme();
  const { t } = useTranslation('timesheets');

  const maxHours = week.reduce<number>((max, day) => {
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
              today && !selected && { backgroundColor: colors.gray200 },
              selected && { backgroundColor: colors.black },
            ]}
            onPress={() => onPress(dateKey)}
            activeOpacity={0.75}
          >
            <Text style={[
              styles.dayLabel,
              { color: colors.textMuted },
              weekend && styles.dayLabelMuted,
              selected && { color: colors.white },
            ]}>
              {t(`days.${DAY_LABEL_KEYS[i]}`)}
            </Text>

            <Text style={[
              styles.dayNumber,
              { color: colors.textPrimary },
              weekend && !selected && { color: colors.textMuted },
              today && !selected && styles.dayNumberToday,
              selected && { color: colors.white },
            ]}>
              {day}
            </Text>

            {/* Hours bar */}
            <View style={[styles.barTrack, { backgroundColor: colors.gray200 }, selected && styles.barTrackSelected]}>
              {barFill > 0 && (
                <View
                  style={[
                    styles.barFill,
                    { backgroundColor: colors.black },
                    selected && { backgroundColor: colors.white },
                    { width: `${barFill * 100}%` as any },
                  ]}
                />
              )}
            </View>

            <Text style={[
              styles.hours,
              { color: colors.textSecondary },
              selected && { color: colors.gray300 },
              !daySummary && { color: colors.gray300 },
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
  dayLabel: {
    fontSize: 9,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  dayLabelMuted: { opacity: 0.45 },

  dayNumber: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  dayNumberToday: { fontFamily: Typography.fontFamily.bold },

  barTrack: {
    width: '60%',
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
  },
  barTrackSelected: { backgroundColor: 'rgba(255,255,255,0.25)' },
  barFill: {
    height: '100%',
    borderRadius: 2,
  },

  hours: {
    fontSize: 10,
    fontFamily: Typography.fontFamily.medium,
  },
});
