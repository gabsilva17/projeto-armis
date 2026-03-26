import { Spacing, Typography, useTheme } from '@/src/theme';
import {
  GearIcon,
  BellIcon,
  ShieldCheckIcon,
  QuestionIcon,
  InfoIcon,
  FolderIcon,
  UsersIcon,
  CalendarCheckIcon,
  type Icon,
} from 'phosphor-react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, type Href } from 'expo-router';
import { ROUTES } from '@/src/constants/app.constants';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface OptionItem {
  IconComponent: Icon;
  label: string;
  description: string;
  href?: Href;
}

const OPTIONS: OptionItem[] = [
  { IconComponent: GearIcon, label: 'Settings', description: 'Theme, language and preferences', href: ROUTES.SETTINGS as Href },
  { IconComponent: BellIcon, label: 'Notifications', description: 'Manage your alerts' },
  { IconComponent: FolderIcon, label: 'Documents', description: 'View and manage files' },
  { IconComponent: UsersIcon, label: 'Team', description: 'Colleagues and contacts' },
  { IconComponent: CalendarCheckIcon, label: 'Approvals', description: 'Pending requests and approvals' },
  { IconComponent: ShieldCheckIcon, label: 'Privacy', description: 'Data and security settings' },
  { IconComponent: QuestionIcon, label: 'Help & Support', description: 'FAQs and contact support' },
  { IconComponent: InfoIcon, label: 'About', description: 'App version and legal info' },
];

export default function MoreScreen() {
  const colors = useTheme();
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>OPTIONS</Text>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>More</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          Additional tools and settings
        </Text>
      </View>

      <View style={[styles.optionsList, { borderTopColor: colors.border }]}>
        {OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.label}
            style={[styles.optionRow, { borderBottomColor: colors.border }]}
            onPress={() => {
              if (option.href) {
                router.push(option.href);
              }
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={option.label}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.gray100 }]}>
              <option.IconComponent size={20} color={colors.textPrimary} weight="bold" />
            </View>
            <View style={styles.optionBody}>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{option.label}</Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{option.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing[6],
    paddingTop: Spacing[4],
    paddingBottom: Spacing[16],
    gap: Spacing[6],
  },
  section: {
    gap: Spacing[1],
  },
  sectionLabel: {
    fontSize: Typography.size.xs,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: Spacing[1],
  },
  sectionTitle: {
    fontSize: Typography.size.xl,
    fontFamily: 'Inter_700Bold',
  },
  sectionSubtitle: {
    fontSize: Typography.size.sm,
    lineHeight: 20,
    marginTop: Spacing[1],
  },
  optionsList: {
    borderTopWidth: 1,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  iconWrapper: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionBody: {
    flex: 1,
    gap: 2,
  },
  optionLabel: {
    fontSize: Typography.size.base,
    fontFamily: 'Inter_600SemiBold',
  },
  optionDescription: {
    fontSize: Typography.size.sm,
  },
});
