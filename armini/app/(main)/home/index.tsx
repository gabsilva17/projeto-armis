import { ROUTES } from '@/src/constants/app.constants';
import { Spacing, Typography, useTheme } from '@/src/theme';
import { useGreeting } from '@/src/hooks/useGreeting';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function HomeScreen() {
  const colors = useTheme();
  const { greeting, messageOfDay } = useGreeting();
  const router = useRouter();
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.greetingSection, { borderBottomColor: colors.black }]}>
        <Text style={[styles.kicker, { color: colors.textMuted }]}>ARMIS DIGITAL HUB</Text>
        <Text style={[styles.greeting, { color: colors.textPrimary }]}>{greeting}</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{messageOfDay}</Text>
      </View>

      <Text style={[styles.todayLabel, { color: colors.textMuted }]}>{today}</Text>

      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>Start</Text>
        <Text style={[styles.sectionMeta, { color: colors.textMuted }]}>2 workflows available</Text>
      </View>

      <View style={[styles.actionsRail, { borderTopColor: colors.border }]}> 
        <TouchableOpacity
          style={[styles.actionRow, { borderBottomColor: colors.border }]}
          onPress={() => router.push(ROUTES.FINANCES)}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionIndex, { color: colors.textMuted }]}>01</Text>
          <View style={styles.actionBody}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Finances</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>Submit and manage your invoices</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.textPrimary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionRow, { borderBottomColor: colors.border }]}
          onPress={() => router.push(ROUTES.TIMESHEETS as Href)}
          activeOpacity={0.8}
        >
          <Text style={[styles.actionIndex, { color: colors.textMuted }]}>02</Text>
          <View style={styles.actionBody}>
            <Text style={[styles.actionTitle, { color: colors.textPrimary }]}>Timesheets</Text>
            <Text style={[styles.actionDescription, { color: colors.textSecondary }]}>Track your hours and projects</Text>
          </View>
          <Ionicons name="arrow-forward" size={18} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.footnote, { color: colors.textMuted }]}>Tap a workflow to continue.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing[6],
    paddingBottom: Spacing[16],
  },
  greetingSection: {
    paddingTop: Spacing[4],
    paddingBottom: Spacing[4],
    borderBottomWidth: 2,
  },
  kicker: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.semibold,
    letterSpacing: 1.2,
    marginBottom: Spacing[2],
  },
  greeting: {
    fontSize: Typography.size['3xl'],
    fontFamily: Typography.fontFamily.bold,
    marginBottom: Spacing[1],
    lineHeight: 42,
  },
  subtitle: {
    fontSize: Typography.size.base,
    lineHeight: 22,
  },
  todayLabel: {
    marginTop: Spacing[4],
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
  },
  sectionMeta: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.semibold,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  actionsRail: {
    marginTop: Spacing[3],
    borderTopWidth: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  actionIndex: {
    width: 28,
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.semibold,
  },
  actionBody: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  actionDescription: {
    fontSize: Typography.size.sm,
  },
  footnote: {
    marginTop: Spacing[4],
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
  },
});
