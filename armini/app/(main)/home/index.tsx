import { ROUTES } from '@/src/constants/app.constants';
import { Colors, Spacing, Typography } from '@/src/theme';
import { useGreeting } from '@/src/hooks/useGreeting';
import { useTopbarRefresh } from '@/src/hooks/useTopbarRefresh';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { useCallback, useReducer } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const [, forceRender] = useReducer((value: number) => value + 1, 0);
  const { greeting, messageOfDay } = useGreeting();
  const router = useRouter();
  const today = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  }).format(new Date());

  const handleRefresh = useCallback(() => {
    forceRender();
  }, []);

  useTopbarRefresh(handleRefresh);

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.greetingSection}>
        <Text style={styles.kicker}>ARMINI WORKSPACE</Text>
        <Text style={styles.greeting}>{greeting}</Text>
        <Text style={styles.subtitle}>{messageOfDay}</Text>
      </View>

      <View style={styles.focusBand}>
        <Ionicons name="sparkles-outline" size={18} color={Colors.textInverse} />
        <Text style={styles.focusText}>Today is {today}</Text>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Start</Text>
        <Text style={styles.sectionMeta}>2 workflows available</Text>
      </View>

      <View style={styles.actionsRail}>
        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push(ROUTES.FINANCES)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIndex}>01</Text>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Finances</Text>
            <Text style={styles.actionDescription}>Submit and manage your invoices</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionRow}
          onPress={() => router.push(ROUTES.TIMESHEETS as Href)}
          activeOpacity={0.8}
        >
          <Text style={styles.actionIndex}>02</Text>
          <View style={styles.actionBody}>
            <Text style={styles.actionTitle}>Timesheets</Text>
            <Text style={styles.actionDescription}>Track your hours and projects</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={styles.footnote}>Tap a workflow to continue.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[16],
  },
  greetingSection: {
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
    borderBottomWidth: 2,
    borderBottomColor: Colors.black,
  },
  kicker: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textMuted,
    letterSpacing: 1.2,
    marginBottom: Spacing[2],
  },
  greeting: {
    fontSize: Typography.size['3xl'],
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing[1],
    lineHeight: 42,
  },
  subtitle: {
    fontSize: Typography.size.base,
    color: Colors.textSecondary,
    lineHeight: 22,
  },
  focusBand: {
    marginTop: Spacing[5],
    backgroundColor: Colors.black,
    borderRadius: 999,
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[2],
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
  },
  focusText: {
    color: Colors.textInverse,
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.medium,
  },
  sectionHeader: {
    marginTop: Spacing[6],
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontFamily: Typography.fontFamily.bold,
    color: Colors.textPrimary,
  },
  sectionMeta: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsRail: {
    marginTop: Spacing[3],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  actionIndex: {
    width: 28,
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textMuted,
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
    color: Colors.textPrimary,
  },
  actionDescription: {
    fontSize: Typography.size.sm,
    color: Colors.textSecondary,
  },
  footnote: {
    marginTop: Spacing[4],
    fontSize: Typography.size.sm,
    color: Colors.textMuted,
    fontFamily: Typography.fontFamily.regular,
  },
});
