import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import type { MonthSummary } from '@/src/types/timesheets';
import { memo, useMemo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { DayCell } from './DayCell';
import { WeekStrip } from './WeekStrip';
import { useTranslation } from 'react-i18next';
import { DAY_LABEL_KEYS } from './timesheetsConstants';
import { getAdjacentDays, toDateKey } from './timesheetsHelpers';
import type { ViewStyle } from 'react-native';

interface CalendarGridProps {
  cells: (number | null)[];
  currentYear: number;
  currentMonth: number;
  monthData: MonthSummary | null;
  selectedDate: string | null;
  focusWeek: (number | null)[];
  isLoading: boolean;
  error: string | null;
  onSelectDay: (date: string) => void;
  onRefresh: () => void;
  weekLabelsStyle: AnimatedStyle<ViewStyle>;
  gridContainerStyle: AnimatedStyle<ViewStyle>;
  fullGridStyle: AnimatedStyle<ViewStyle>;
  weekStripStyle: AnimatedStyle<ViewStyle>;
}

export { CalendarHeader } from './CalendarHeader';

export const CalendarGrid = memo(function CalendarGrid({
  cells,
  currentYear,
  currentMonth,
  monthData,
  selectedDate,
  focusWeek,
  isLoading,
  error,
  onSelectDay,
  onRefresh,
  weekLabelsStyle,
  gridContainerStyle,
  fullGridStyle,
  weekStripStyle,
}: CalendarGridProps) {
  const colors = useTheme();
  const { t } = useTranslation('timesheets');

  const adjacentCells = useMemo(() => {
    const { leading, trailing } = getAdjacentDays(currentYear, currentMonth);
    const pM = currentMonth === 0 ? 11 : currentMonth - 1;
    const pY = currentMonth === 0 ? currentYear - 1 : currentYear;
    const nM = currentMonth === 11 ? 0 : currentMonth + 1;
    const nY = currentMonth === 11 ? currentYear + 1 : currentYear;
    const totalCells = cells.length;

    return cells.map((day, idx) => {
      if (day !== null) return undefined;
      if (idx < leading.length) {
        const d = leading[idx];
        return { day: d, dateKey: toDateKey(pY, pM, d) };
      }
      const ti = idx - (totalCells - trailing.length);
      if (ti >= 0 && ti < trailing.length) {
        const d = trailing[ti];
        return { day: d, dateKey: toDateKey(nY, nM, d) };
      }
      return undefined;
    });
  }, [cells, currentYear, currentMonth]);

  return (
    <>
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={colors.textSecondary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>{t('common:loading')}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={[styles.errorText, { color: colors.textSecondary }]}>{error}</Text>
          <TouchableOpacity
            onPress={onRefresh}
            style={[styles.retryBtn, { backgroundColor: colors.black }]}
            activeOpacity={0.75}
          >
            <Text style={[styles.retryText, { color: colors.white }]}>{t('common:retry')}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Animated.View style={[styles.weekLabels, weekLabelsStyle]}>
            {DAY_LABEL_KEYS.map((key) => (
              <Text key={key} style={[styles.weekLabel, { color: colors.textMuted }]}>{t(`days.${key}`)}</Text>
            ))}
          </Animated.View>

          <Animated.View style={[styles.gridContainer, gridContainerStyle]}>
            <Animated.View style={[styles.grid, fullGridStyle]}>
              {cells.map((day, idx) => (
                <DayCell
                  key={idx}
                  day={day}
                  year={currentYear}
                  month={currentMonth}
                  adjacentDay={adjacentCells[idx]?.day}
                  adjacentDateKey={adjacentCells[idx]?.dateKey}
                  daySummary={
                    day !== null
                      ? monthData?.days[toDateKey(currentYear, currentMonth, day)]
                      : undefined
                  }
                  isSelected={
                    day !== null && selectedDate === toDateKey(currentYear, currentMonth, day)
                  }
                  onPress={onSelectDay}
                />
              ))}
            </Animated.View>

            <Animated.View style={[StyleSheet.absoluteFill, weekStripStyle]}>
              <WeekStrip
                week={focusWeek}
                year={currentYear}
                month={currentMonth}
                monthData={monthData}
                selectedDate={selectedDate}
                onPress={onSelectDay}
              />
            </Animated.View>
          </Animated.View>
        </>
      )}
    </>
  );
});

const styles = StyleSheet.create({
  weekLabels: { flexDirection: 'row', overflow: 'hidden' },
  weekLabel: {
    flex: 1,
    textAlign: 'center',
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: Spacing[1],
  },
  gridContainer: { overflow: 'hidden' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  loadingBox: { paddingVertical: Spacing[10], alignItems: 'center', gap: Spacing[3] },
  loadingText: { fontSize: Typography.size.sm },
  errorBox: { paddingVertical: Spacing[8], alignItems: 'center', gap: Spacing[4] },
  errorText: { fontSize: Typography.size.sm, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    borderRadius: 8,
  },
  retryText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
});
