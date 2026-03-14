import { Colors, Spacing, Typography } from '@/src/theme';
import { FileIcon, type Icon } from 'phosphor-react-native';
import { StyleSheet, Text, View } from 'react-native';

interface EmptyStateProps {
  icon?: Icon;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon: Icon = FileIcon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Icon size={48} color={Colors.gray300} />
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
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
    color: Colors.textMuted,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: Typography.size.sm,
    color: Colors.gray400,
    textAlign: 'center',
    lineHeight: Typography.size.sm * 1.5,
  },
});
