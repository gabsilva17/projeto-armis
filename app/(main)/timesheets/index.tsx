import { useTimesheets, type EntryInput } from '@/src/hooks/useTimesheets';
import { useCalendarAnimation } from '@/src/hooks/useCalendarAnimation';
import { CalendarGrid, CalendarHeader } from '@/src/components/timesheets/CalendarGrid';
import { DayDetail } from '@/src/components/timesheets/DayDetail';
import { EntryFormModal } from '@/src/components/timesheets/EntryFormModal';
import {
  EMPTY_INPUT,
  STATUS_COLORS,
  STATUS_LABELS,
} from '@/src/components/timesheets/timesheetsConstants';
import {
  buildCalendarGrid,
  getWeekRowForDay,
} from '@/src/components/timesheets/timesheetsHelpers';
import { Colors, Spacing, Typography } from '@/src/theme';
import type { TimesheetEntry, TimesheetEntryStatus } from '@/src/types/timesheets';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { GestureDetector } from 'react-native-gesture-handler';
import Animated from 'react-native-reanimated';
import { useTopbarRefresh } from '@/src/hooks/useTopbarRefresh';

export default function TimesheetsScreen() {
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

  useTopbarRefresh(refresh);

  const [formVisible, setFormVisible] = useState(false);
  const [formTitle, setFormTitle] = useState('Add Entry');
  const [formInitial, setFormInitial] = useState<EntryInput>(EMPTY_INPUT);
  const [editingId, setEditingId] = useState<string | null>(null);

  const cells = buildCalendarGrid(currentYear, currentMonth);
  const numRows = cells.length / 7;

  const today = new Date();
  const isCurrentMonth = today.getFullYear() === currentYear && today.getMonth() === currentMonth;
  const focusDay = selectedDate
    ? parseInt(selectedDate.split('-')[2], 10)
    : isCurrentMonth
    ? today.getDate()
    : 1;
  const focusRow = getWeekRowForDay(cells, focusDay);
  const focusWeek = cells.slice(focusRow * 7, (focusRow + 1) * 7);

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
    <View style={styles.container}>
      <View style={styles.headerArea}>
        <CalendarHeader
          year={currentYear}
          month={currentMonth}
          totalHours={monthData?.totalHours ?? 0}
          daysLogged={monthData?.totalDaysLogged ?? 0}
        />
      </View>

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
                <View style={[styles.legendDot, { backgroundColor: STATUS_COLORS[s] }]} />
                <Text style={styles.legendLabel}>{STATUS_LABELS[s]}</Text>
              </View>
            ))}
          </View>
        </Animated.ScrollView>
      </GestureDetector>

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
  container: { flex: 1, backgroundColor: Colors.background },
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
  legendLabel: { fontSize: Typography.size.xs, color: Colors.textSecondary },
});
