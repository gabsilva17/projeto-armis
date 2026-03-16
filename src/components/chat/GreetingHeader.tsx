import { useTheme } from '@/src/theme';
import { Spacing, Typography } from '@/src/theme';
import { StyleSheet, Text, View } from 'react-native';

interface GreetingHeaderProps {
  greeting: string;
  messageOfDay: string;
}

export function GreetingHeader({ greeting, messageOfDay }: GreetingHeaderProps) {
  const colors = useTheme();
  return (
    <View style={styles.container}>
      <Text style={[styles.greeting, { color: colors.textPrimary }]}>{greeting}</Text>
      <Text style={[styles.messageOfDay, { color: colors.textSecondary }]}>{messageOfDay}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[8],
    paddingBottom: Spacing[5],
  },
  greeting: {
    fontSize: Typography.size['2xl'],
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing[2],
    lineHeight: Typography.size['2xl'] * 1.2,
  },
  messageOfDay: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    lineHeight: Typography.size.md * 1.5,
  },
});
