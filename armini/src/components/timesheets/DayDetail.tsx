import { Colors, Spacing, Typography } from '@/src/theme';
import type { DaySummary, TimesheetEntry } from '@/src/types/timesheets';
import { PlusIcon, XIcon } from 'phosphor-react-native';
import * as Haptics from 'expo-haptics';
import React, { useCallback } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Animated, { LinearTransition } from 'react-native-reanimated';
import { STATUS_COLORS, STATUS_LABELS } from './timesheetsConstants';
import { formatDate } from './timesheetsHelpers';

interface EntryRowProps {
  entry: TimesheetEntry;
  onEdit: (entry: TimesheetEntry) => void;
}

const EntryRow = React.memo(function EntryRow({ entry, onEdit }: EntryRowProps) {
  return (
    <Animated.View layout={LinearTransition.duration(200)} style={styles.entryWrapper}>
      <TouchableOpacity
        style={styles.entryCard}
        onPress={() => onEdit(entry)}
        activeOpacity={0.85}
      >
        <View style={styles.entryLeft}>
          <View style={[styles.entryStatusBar, { backgroundColor: STATUS_COLORS[entry.status] }]} />
          <View style={styles.entryInfo}>
            <Text style={styles.entryProject}>{entry.project}</Text>
            <Text style={styles.entryTask}>{entry.task}</Text>
          </View>
        </View>
        <View style={styles.entryRight}>
          <Text style={styles.entryHours}>{entry.hours}h</Text>
          <Text style={[styles.entryStatus, { color: STATUS_COLORS[entry.status] }]}>
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
          <Text style={styles.dayDetailDate}>{formatDate(date)}</Text>
          <Text style={styles.dayDetailTotal}>
            {totalHours > 0 ? `${totalHours} hours logged` : 'No hours logged'}
          </Text>
        </View>
        <View style={styles.dayDetailActions}>
          <TouchableOpacity style={styles.addBtn} onPress={onAdd} activeOpacity={0.75}>
            <PlusIcon size={18} color={Colors.textInverse} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
            <XIcon size={18} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
      </View>

      {entries.length === 0 ? (
        <Text style={styles.emptyEntries}>No entries yet. Tap + to add one.</Text>
      ) : (
        <Animated.View layout={LinearTransition.duration(200)}>
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
    color: Colors.textPrimary,
  },
  dayDetailTotal: { fontSize: Typography.size.sm, color: Colors.textSecondary, marginTop: 2 },
  dayDetailActions: { flexDirection: 'row', gap: Spacing[2] },
  addBtn: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: Colors.black,
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
    color: Colors.textMuted,
    textAlign: 'center',
    paddingVertical: Spacing[4],
  },
  entryWrapper: { marginBottom: Spacing[3] },
  entryCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
  },
  entryLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: Spacing[3] },
  entryStatusBar: { width: 3, height: 36, borderRadius: 2 },
  entryInfo: { flex: 1, gap: 3 },
  entryProject: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
  },
  entryTask: { fontSize: Typography.size.xs, color: Colors.textSecondary },
  entryRight: { alignItems: 'flex-end', gap: 3 },
  entryHours: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  entryStatus: { fontSize: Typography.size.xs, fontFamily: Typography.fontFamily.medium },
});
