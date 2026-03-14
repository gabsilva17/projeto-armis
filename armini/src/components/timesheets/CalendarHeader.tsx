import { Colors, Spacing, Typography } from '@/src/theme';
import { StyleSheet, Text, View } from 'react-native';
import { MONTH_NAMES } from './timesheetsConstants';

interface CalendarHeaderProps {
  year: number;
  month: number;
  totalHours: number;
  daysLogged: number;
}

export function CalendarHeader({ year, month, totalHours, daysLogged }: CalendarHeaderProps) {
  return (
    <View style={styles.calHeader}>
      <Text style={styles.monthTitle}>{MONTH_NAMES[month]} {year}</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Text style={styles.summaryValue}>{totalHours}h</Text>
          <Text style={styles.summaryLabel}>Total</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryChip}>
          <Text style={styles.summaryValue}>{daysLogged}</Text>
          <Text style={styles.summaryLabel}>Days logged</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  calHeader: { marginBottom: Spacing[3] },
  monthTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing[3],
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing[1],
    paddingHorizontal: Spacing[2],
  },
  summaryChip: { flex: 1, alignItems: 'center' },
  summaryValue: {
    fontSize: Typography.size.lg,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  summaryLabel: { fontSize: Typography.size.xs, color: Colors.textMuted, marginTop: 2 },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
    marginHorizontal: Spacing[4],
  },
});
