import { Colors, Spacing, Typography } from '@/src/theme';
import { StyleSheet, Text, View } from 'react-native';

interface GreetingHeaderProps {
  greeting: string;
  messageOfDay: string;
}

export function GreetingHeader({ greeting, messageOfDay }: GreetingHeaderProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>{greeting}</Text>
      <Text style={styles.messageOfDay}>{messageOfDay}</Text>
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
    color: Colors.textPrimary,
    marginBottom: Spacing[2],
    lineHeight: Typography.size['2xl'] * 1.2,
  },
  messageOfDay: {
    fontSize: Typography.size.md,
    fontFamily: Typography.fontFamily.regular,
    color: Colors.textSecondary,
    lineHeight: Typography.size.md * 1.5,
  },
});
