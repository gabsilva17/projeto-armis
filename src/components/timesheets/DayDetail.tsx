import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import type { DaySummary, TimesheetEntry } from '@/src/types/timesheets';
import { PlusIcon, XIcon } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { getStatusColor, STATUS_LABELS } from './timesheetsConstants';
import { formatDate } from './timesheetsHelpers';

interface EntryRowProps {
  entry: TimesheetEntry;
  onEdit: (entry: TimesheetEntry) => void;
}

const EntryRow = React.memo(function EntryRow({ entry, onEdit }: EntryRowProps) {
  const colors = useTheme();
  return (
    <Animated.View layout={LinearTransition.duration(200)}>
      <TouchableOpacity
        style={[styles.entryRow, { borderBottomColor: colors.border }]}
        onPress={() => onEdit(entry)}
        activeOpacity={0.7}
      >
        <View style={[styles.entryStatusBar, { backgroundColor: getStatusColor(entry.status, colors) }]} />
        <View style={styles.entryInfo}>
          <Text style={[styles.entryProject, { color: colors.textPrimary }]}>{entry.project}</Text>
          <Text style={[styles.entryTask, { color: colors.textSecondary }]}>{entry.task}</Text>
        </View>
        <View style={styles.entryRight}>
          <Text style={[styles.entryHours, { color: colors.textPrimary }]}>{entry.hours}h</Text>
          <Text style={[styles.entryStatus, { color: getStatusColor(entry.status, colors) }]}>
            {STATUS_LABELS[entry.status]}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
});

interface DayDetailProps {
  daySummary: DaySummary | null;
  date: string;
  onClose: () => void;
  onAdd: () => void;
  onEdit: (entry: TimesheetEntry) => void;
  onDelete: (id: string) => void;
}

export function DayDetail({ daySummary, date, onClose, onAdd, onEdit }: DayDetailProps) {
  const colors = useTheme();

  const handleEdit = useCallback(async (entry: TimesheetEntry) => {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onEdit(entry);
  }, [onEdit]);

  const entries = daySummary?.entries ?? [];
  const totalHours = daySummary?.totalHours ?? 0;

  return (
    <View style={styles.dayDetail}>
      <View style={styles.dayDetailHeader}>
        <View style={styles.dayDetailLeft}>
          <Text style={[styles.dayDetailDate, { color: colors.textPrimary }]}>{formatDate(date)}</Text>
          <Text style={[styles.dayDetailTotal, { color: colors.textSecondary }]}>
            {totalHours > 0 ? `${totalHours} hours logged` : 'No hours logged'}
          </Text>
        </View>
        <View style={styles.dayDetailActions}>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.black }]} onPress={onAdd} activeOpacity={0.75}>
            <PlusIcon size={18} color={colors.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <XIcon size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {entries.length === 0 ? (
        <Text style={[styles.emptyEntries, { color: colors.textMuted }]}>No entries yet. Tap + to add one.</Text>
      ) : (
        <Animated.View layout={LinearTransition.duration(200)} style={[styles.entriesList, { borderTopColor: colors.border }]}>
          {entries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              onEdit={handleEdit}
            />
          ))}
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dayDetail: {
    marginBottom: Spacing[4],
  },
  dayDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[1],
  },
  dayDetailLeft: { flex: 1 },
  dayDetailDate: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  dayDetailTotal: { fontSize: Typography.size.sm, marginTop: 2 },
  dayDetailActions: { flexDirection: 'row', gap: Spacing[2] },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyEntries: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    paddingVertical: Spacing[4],
  },
  entriesList: {
    borderTopWidth: 1,
  },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  entryStatusBar: { width: 3, height: 28, borderRadius: 2 },
  entryInfo: { flex: 1, gap: 3 },
  entryProject: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  entryTask: { fontSize: Typography.size.xs },
  entryRight: { alignItems: 'flex-end', gap: 3 },
  entryHours: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.bold,
  },
  entryStatus: { fontSize: Typography.size.xs, fontFamily: Typography.fontFamily.medium },
});
