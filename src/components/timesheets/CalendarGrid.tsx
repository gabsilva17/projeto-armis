import { Colors, Spacing, Typography } from '@/src/theme';
import type { MonthSummary } from '@/src/types/timesheets';
import { memo } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { DayCell } from './DayCell';
import { WeekStrip } from './WeekStrip';
import { DAY_LABELS } from './timesheetsConstants';
import { toDateKey } from './timesheetsHelpers';
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
  return (
    <>
      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator size="small" color={Colors.textSecondary} />
          <Text style={styles.loadingText}>Loading…</Text>
        </View>
      ) : error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={onRefresh} style={styles.retryBtn} activeOpacity={0.75}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Animated.View style={[styles.weekLabels, weekLabelsStyle]}>
            {DAY_LABELS.map((label) => (
              <Text key={label} style={styles.weekLabel}>{label}</Text>
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
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingVertical: Spacing[1],
  },
  gridContainer: { overflow: 'hidden' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  loadingBox: { paddingVertical: Spacing[10], alignItems: 'center', gap: Spacing[3] },
  loadingText: { fontSize: Typography.size.sm, color: Colors.textSecondary },
  errorBox: { paddingVertical: Spacing[8], alignItems: 'center', gap: Spacing[4] },
  errorText: { fontSize: Typography.size.sm, color: Colors.textSecondary, textAlign: 'center' },
  retryBtn: {
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    backgroundColor: Colors.black,
    borderRadius: 8,
  },
  retryText: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.white,
  },
});
