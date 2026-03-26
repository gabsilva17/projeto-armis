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
import { useTranslation } from 'react-i18next';

interface OptionItem {
  IconComponent: Icon;
  labelKey: string;
  descriptionKey: string;
  href?: Href;
}

const OPTIONS: OptionItem[] = [
  { IconComponent: GearIcon, labelKey: 'options.settings.label', descriptionKey: 'options.settings.description', href: ROUTES.SETTINGS as Href },
  { IconComponent: BellIcon, labelKey: 'options.notifications.label', descriptionKey: 'options.notifications.description' },
  { IconComponent: FolderIcon, labelKey: 'options.documents.label', descriptionKey: 'options.documents.description' },
  { IconComponent: UsersIcon, labelKey: 'options.team.label', descriptionKey: 'options.team.description' },
  { IconComponent: CalendarCheckIcon, labelKey: 'options.approvals.label', descriptionKey: 'options.approvals.description' },
  { IconComponent: ShieldCheckIcon, labelKey: 'options.privacy.label', descriptionKey: 'options.privacy.description' },
  { IconComponent: QuestionIcon, labelKey: 'options.helpAndSupport.label', descriptionKey: 'options.helpAndSupport.description' },
  { IconComponent: InfoIcon, labelKey: 'options.about.label', descriptionKey: 'options.about.description' },
];

export default function MoreScreen() {
  const colors = useTheme();
  const { t } = useTranslation('more');
  const router = useRouter();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t('sectionLabel')}</Text>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('title')}</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {t('subtitle')}
        </Text>
      </View>

      <View style={[styles.optionsList, { borderTopColor: colors.border }]}>
        {OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.labelKey}
            style={[styles.optionRow, { borderBottomColor: colors.border }]}
            onPress={() => {
              if (option.href) {
                router.push(option.href);
              }
            }}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={t(option.labelKey)}
          >
            <View style={[styles.iconWrapper, { backgroundColor: colors.gray100 }]}>
              <option.IconComponent size={20} color={colors.textPrimary} weight="bold" />
            </View>
            <View style={styles.optionBody}>
              <Text style={[styles.optionLabel, { color: colors.textPrimary }]}>{t(option.labelKey)}</Text>
              <Text style={[styles.optionDescription, { color: colors.textSecondary }]}>{t(option.descriptionKey)}</Text>
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
