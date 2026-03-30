import { Card } from '@/src/components/ui/Card';
import { useTimesheetsStore } from '@/src/stores/useTimesheetsStore';
import { Spacing, Typography, useTheme } from '@/src/theme';
import type { ThemeColors } from '@/src/theme/colors';
import {
  HourglassSimpleLow,
  Clock,
  Umbrella,
  FileText,
} from 'phosphor-react-native';
import { useEffect, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function countWorkdaysUpToToday(year: number, month: number, day: number): number {
  let count = 0;
  for (let d = 1; d <= day; d++) {
    const dow = new Date(year, month, d).getDay();
    if (dow !== 0 && dow !== 6) count++;
  }
  return count;
}

function isWeekend(date: Date): boolean {
  const dow = date.getDay();
  return dow === 0 || dow === 6;
}

const DAILY_TARGET = 8;
// Placeholder — virá do backend quando disponível
const MOCK_VACATION_DAYS_REMAINING = 22;

// ---------------------------------------------------------------------------
// KpiCard
// ---------------------------------------------------------------------------

interface KpiCardProps {
  icon: React.ReactNode;
  value: string;
  label: string;
  sublabel?: string;
}

function KpiCard({ icon, value, label, sublabel }: KpiCardProps) {
  const colors = useTheme();
  return (
    <Card style={styles.kpiCard}>
      <View style={styles.kpiIcon}>{icon}</View>
      <Text style={[styles.kpiValue, { color: colors.textPrimary }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: colors.textSecondary }]}>{label}</Text>
      {sublabel != null && (
        <Text style={[styles.kpiSublabel, { color: colors.textMuted }]}>{sublabel}</Text>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// KpiSection
// ---------------------------------------------------------------------------

export function KpiSection() {
  const colors = useTheme();
  const { t } = useTranslation('home');

  const load = useTimesheetsStore((s) => s.load);
  const allEntries = useTimesheetsStore((s) => s.allEntries);
  const hasLoaded = useTimesheetsStore((s) => s.hasLoaded);

  useEffect(() => {
    void load();
  }, [load]);

  const kpis = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const day = now.getDate();
    const todayKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    // Horas inputadas hoje
    const todayHours = allEntries
      .filter((e) => e.date === todayKey)
      .reduce((sum, e) => sum + e.hours, 0);
    const hoursToInput = isWeekend(now) ? 0 : Math.max(0, DAILY_TARGET - todayHours);

    // Acumulado do mês
    const monthEntries = allEntries.filter((e) => {
      const [y, m] = e.date.split('-').map(Number);
      return y === year && m === month + 1;
    });
    const accumulated = monthEntries.reduce((sum, e) => sum + e.hours, 0);

    // Horas esperadas até hoje no mês
    const workdaysSoFar = countWorkdaysUpToToday(year, month, day);
    const expectedHours = workdaysSoFar * DAILY_TARGET;

    return { hoursToInput, accumulated, expectedHours };
  }, [allEntries]);

  const iconSize = 20;
  const iconProps = { weight: 'fill' as const, size: iconSize };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
        {t('kpi.sectionTitle')}
      </Text>

      <View style={styles.grid}>
        <KpiCard
          icon={<HourglassSimpleLow {...iconProps} color={colors.textMuted} />}
          value={hasLoaded ? `${kpis.hoursToInput}h` : '—'}
          label={t('kpi.hoursToInput')}
          sublabel={t('kpi.hoursToInputToday')}
        />
        <KpiCard
          icon={<Clock {...iconProps} color={colors.textMuted} />}
          value={hasLoaded ? `${kpis.accumulated}h` : '—'}
          label={t('kpi.accumulated')}
          sublabel={`/ ${kpis.expectedHours}h`}
        />
        <KpiCard
          icon={<Umbrella {...iconProps} color={colors.textMuted} />}
          value={`${MOCK_VACATION_DAYS_REMAINING}`}
          label={t('kpi.vacations')}
          sublabel={t('kpi.vacationsDays')}
        />
        <KpiCard
          icon={<FileText {...iconProps} color={colors.textMuted} />}
          value={t('kpi.mapStatuses.open')}
          label={t('kpi.mapStatus')}
        />
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  section: {
    marginTop: Spacing[5],
  },
  sectionTitle: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
    marginBottom: Spacing[3],
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing[3],
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    padding: Spacing[4],
  },
  kpiIcon: {
    marginBottom: Spacing[2],
  },
  kpiValue: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing[1],
  },
  kpiLabel: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  kpiSublabel: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.regular,
    marginTop: 2,
  },
});
