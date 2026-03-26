import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

interface CalendarHeaderProps {
  year: number;
  month: number;
  totalHours: number;
  daysLogged: number;
}

export function CalendarHeader({ year, month, totalHours, daysLogged }: CalendarHeaderProps) {
  const colors = useTheme();
  const { t } = useTranslation('timesheets');
  return (
    <View style={styles.calHeader}>
      <Text style={[styles.monthTitle, { color: colors.textPrimary }]}>{t(`months.${month}`)} {year}</Text>
      <View style={styles.summaryRow}>
        <View style={styles.summaryChip}>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{totalHours}h</Text>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t('summary.total')}</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: colors.border }]} />
        <View style={styles.summaryChip}>
          <Text style={[styles.summaryValue, { color: colors.textPrimary }]}>{daysLogged}</Text>
          <Text style={[styles.summaryLabel, { color: colors.textMuted }]}>{t('summary.daysLogged')}</Text>
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
  },
  summaryLabel: { fontSize: Typography.size.xs, marginTop: 2 },
  summaryDivider: {
    width: 1,
    height: 32,
    marginHorizontal: Spacing[4],
  },
});
