import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import { FileIcon, type Icon } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  icon?: Icon | null;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon: Icon = FileIcon, title, subtitle }: EmptyStateProps) {
  const colors = useTheme();
  return (
    <View style={styles.container}>
      {Icon !== null && <Icon size={48} color={colors.gray300} />}
      <Text style={[styles.title, { color: colors.textMuted }]}>{title}</Text>
      {subtitle ? <Text style={[styles.subtitle, { color: colors.gray400 }]}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing[3],
    paddingHorizontal: Spacing[8],
  },
  title: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.medium,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.sm,
    textAlign: 'center',
    lineHeight: Typography.size.sm * 1.5,
  },
});
