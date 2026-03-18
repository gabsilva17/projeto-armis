import { useTimesheets, type EntryInput } from '@/src/hooks/useTimesheets';
import { useCalendarAnimation } from '@/src/hooks/useCalendarAnimation';
import { CalendarGrid, CalendarHeader } from '@/src/components/timesheets/CalendarGrid';
import { DayDetail } from '@/src/components/timesheets/DayDetail';
import { EntryFormModal } from '@/src/components/timesheets/EntryFormModal';
import {
  EMPTY_INPUT,
  getStatusColor,
  STATUS_LABELS,
} from '@/src/components/timesheets/timesheetsConstants';
import {
  buildCalendarGrid,
  getWeekRowForDay,
} from '@/src/components/timesheets/timesheetsHelpers';
import { Spacing, Typography, useTheme } from '@/src/theme';
import type { TimesheetEntry, TimesheetEntryStatus } from '@/src/types/timesheets';
import { useEffect, useMemo, useState } from 'react';
import { InteractionManager, StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated, { FadeIn } from 'react-native-reanimated';

interface InteractiveCalendarSectionProps {
  cells: (number | null)[];
  currentYear: number;
  currentMonth: number;
  monthData: ReturnType<typeof useTimesheets>['monthData'];
  selectedDay: ReturnType<typeof useTimesheets>['selectedDay'];
  selectedDate: ReturnType<typeof useTimesheets>['selectedDate'];
  isLoading: boolean;
  error: string | null;
  focusWeek: (number | null)[];
  focusRow: number;
  numRows: number;
  goToNextMonth: () => void;
  goToPreviousMonth: () => void;
  selectDay: (date: string) => void;
  clearSelection: () => void;
  refresh: () => Promise<void>;
  openAddForm: () => void;
  openEditForm: (entry: TimesheetEntry) => void;
  deleteEntry: (id: string) => void;
  colors: ReturnType<typeof useTheme>;
}

interface CalendarSkeletonProps {
  colors: ReturnType<typeof useTheme>;
}

function CalendarSkeleton({ colors }: CalendarSkeletonProps) {
  return (
    <View style={styles.skeletonWrap} pointerEvents="none">
      <View style={styles.calendarCard}>
        <View style={styles.skeletonWeekLabelsRow}>
          {Array.from({ length: 7 }).map((_, index) => (
            <View
              key={`wk-${index}`}
              style={[styles.skeletonWeekLabel, { backgroundColor: colors.gray200 }]}
            />
          ))}
        </View>

        <View style={styles.skeletonGrid}>
          {Array.from({ length: 35 }).map((_, index) => (
            <View
              key={`cell-${index}`}
              style={[styles.skeletonCell, { backgroundColor: colors.gray100 }]}
            />
          ))}
        </View>
      </View>

      <View style={styles.skeletonList}>
        {Array.from({ length: 4 }).map((_, index) => (
          <View
            key={`row-${index}`}
            style={[styles.skeletonListRow, { borderBottomColor: colors.border }]}
          >
            <View style={[styles.skeletonLineShort, { backgroundColor: colors.gray200 }]} />
            <View style={[styles.skeletonLineLong, { backgroundColor: colors.gray100 }]} />
          </View>
        ))}
      </View>
    </View>
  );
}

function InteractiveCalendarSection({
  cells,
  currentYear,
  currentMonth,
  monthData,
  selectedDay,
  selectedDate,
  isLoading,
  error,
  focusWeek,
  focusRow,
  numRows,
  goToNextMonth,
  goToPreviousMonth,
  selectDay,
  clearSelection,
  refresh,
  openAddForm,
  openEditForm,
  deleteEntry,
  colors,
}: InteractiveCalendarSectionProps) {
  const {
    calendarSwipeStyle,
    gridContainerStyle,
    fullGridStyle,
    weekStripStyle,
    weekLabelsStyle,
    calendarGesture,
    tasksScrollHandler,
    tasksGesture,
  } = useCalendarAnimation({ numRows, focusRow, goToNextMonth, goToPreviousMonth });

  return (
    <>
      <GestureDetector gesture={calendarGesture}>
        <Animated.View style={[styles.calendarCard, calendarSwipeStyle]}>
          <CalendarGrid
            cells={cells}
            currentYear={currentYear}
            currentMonth={currentMonth}
            monthData={monthData}
            selectedDate={selectedDate}
            focusWeek={focusWeek}
            isLoading={isLoading}
            error={error}
            onSelectDay={selectDay}
            onRefresh={refresh}
            weekLabelsStyle={weekLabelsStyle}
            gridContainerStyle={gridContainerStyle}
            fullGridStyle={fullGridStyle}
            weekStripStyle={weekStripStyle}
          />
        </Animated.View>
      </GestureDetector>

      <GestureDetector gesture={tasksGesture}>
        <Animated.ScrollView
          onScroll={tasksScrollHandler}
          scrollEventThrottle={16}
          bounces
          style={styles.belowCalendar}
          contentContainerStyle={styles.belowCalendarContent}
          showsVerticalScrollIndicator={false}
        >
          {selectedDate && (
            <DayDetail
              daySummary={selectedDay}
              date={selectedDate}
              onClose={clearSelection}
              onAdd={openAddForm}
              onEdit={openEditForm}
              onDelete={deleteEntry}
            />
          )}

          <View style={styles.legend}>
            {(Object.keys(STATUS_LABELS) as TimesheetEntryStatus[]).map((s) => (
              <View key={s} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: getStatusColor(s, colors) }]} />
                <Text style={[styles.legendLabel, { color: colors.textSecondary }]}>{STATUS_LABELS[s]}</Text>
              </View>
            ))}
          </View>
        </Animated.ScrollView>
      </GestureDetector>
    </>
  );
}

export default function TimesheetsScreen() {
  const colors = useTheme();
  const {
    monthData,
    selectedDay,
    selectedDate,
    isLoading,
    error,
    currentYear,
    currentMonth,
    goToPreviousMonth,
    goToNextMonth,
    selectDay,
    clearSelection,
    refresh,
    addEntry,
    editEntry,
    deleteEntry,
  } = useTimesheets();

  const [formVisible, setFormVisible] = useState(false);
  const [formTitle, setFormTitle] = useState('Add Entry');
  const [formInitial, setFormInitial] = useState<EntryInput>(EMPTY_INPUT);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showInteractiveSection, setShowInteractiveSection] = useState(false);

  useEffect(() => {
    const task = InteractionManager.runAfterInteractions(() => {
      setShowInteractiveSection(true);
    });
    return () => {
      task.cancel();
    };
  }, []);

  const cells = useMemo(() => buildCalendarGrid(currentYear, currentMonth), [currentYear, currentMonth]);
  const numRows = cells.length / 7;

  const focusDay = useMemo(() => {
    if (selectedDate) {
      return parseInt(selectedDate.split('-')[2], 10);
    }

    const today = new Date();
    const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
    return isCurrentMonth ? today.getDate() : 1;
  }, [selectedDate, currentYear, currentMonth]);

  const focusRow = useMemo(() => getWeekRowForDay(cells, focusDay), [cells, focusDay]);
  const focusWeek = useMemo(() => cells.slice(focusRow * 7, (focusRow + 1) * 7), [cells, focusRow]);

  // Form helpers
  function openAddForm() {
    setEditingId(null);
    setFormInitial(EMPTY_INPUT);
    setFormTitle('Add Entry');
    setFormVisible(true);
  }

  function openEditForm(entry: TimesheetEntry) {
    setEditingId(entry.id);
    setFormInitial({ project: entry.project, task: entry.task, hours: entry.hours, status: entry.status });
    setFormTitle('Edit Entry');
    setFormVisible(true);
  }

  function handleSave(input: EntryInput) {
    if (editingId) {
      editEntry(editingId, input);
    } else if (selectedDate) {
      addEntry(selectedDate, input);
    }
  }

  function handleDelete() {
    if (editingId) deleteEntry(editingId);
  }

  function handleDuplicate(input: EntryInput) {
    if (selectedDate) addEntry(selectedDate, input);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.headerArea}>
        <CalendarHeader
          year={currentYear}
          month={currentMonth}
          totalHours={monthData?.totalHours ?? 0}
          daysLogged={monthData?.totalDaysLogged ?? 0}
        />
      </View>

      {showInteractiveSection ? (
        <Animated.View entering={FadeIn.duration(100)} style={styles.interactiveSection}>
          <InteractiveCalendarSection
            cells={cells}
            currentYear={currentYear}
            currentMonth={currentMonth}
            monthData={monthData}
            selectedDay={selectedDay}
            selectedDate={selectedDate}
            isLoading={isLoading}
            error={error}
            focusWeek={focusWeek}
            focusRow={focusRow}
            numRows={numRows}
            goToNextMonth={goToNextMonth}
            goToPreviousMonth={goToPreviousMonth}
            selectDay={selectDay}
            clearSelection={clearSelection}
            refresh={refresh}
            openAddForm={openAddForm}
            openEditForm={openEditForm}
            deleteEntry={deleteEntry}
            colors={colors}
          />
        </Animated.View>
      ) : (
        <CalendarSkeleton colors={colors} />
      )}

      {formVisible && (
        <EntryFormModal
          visible={formVisible}
          initial={formInitial}
          title={formTitle}
          onSave={handleSave}
          onCancel={() => setFormVisible(false)}
          onDelete={editingId ? handleDelete : undefined}
          onDuplicate={editingId ? handleDuplicate : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerArea: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[2],
  },
  calendarCard: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[3],
    overflow: 'hidden',
  },
  belowCalendar: { flex: 1, marginTop: Spacing[4] },
  belowCalendarContent: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[16],
  },
  legend: {
    flexDirection: 'row',
    gap: Spacing[5],
    justifyContent: 'center',
    marginTop: Spacing[2],
  },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: Spacing[2] },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { fontSize: Typography.size.xs },
  interactiveSection: {
    flex: 1,
  },
  skeletonWrap: {
    flex: 1,
  },
  skeletonWeekLabelsRow: {
    flexDirection: 'row',
    marginBottom: Spacing[2],
    gap: Spacing[1],
  },
  skeletonWeekLabel: {
    flex: 1,
    height: 10,
    borderRadius: 999,
  },
  skeletonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[1],
  },
  skeletonCell: {
    width: '13.7%',
    height: 44,
    borderRadius: 8,
  },
  skeletonList: {
    flex: 1,
    marginTop: Spacing[4],
    paddingHorizontal: Spacing[6],
  },
  skeletonListRow: {
    paddingVertical: Spacing[3],
    borderBottomWidth: 1,
    gap: Spacing[2],
  },
  skeletonLineShort: {
    width: '35%',
    height: 10,
    borderRadius: 999,
  },
  skeletonLineLong: {
    width: '70%',
    height: 12,
    borderRadius: 999,
  },
});
