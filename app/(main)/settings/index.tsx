import { useTheme } from '@/src/theme';
import { useThemeStore } from '@/src/stores/useThemeStore';
import { THEME_IDS } from '@/src/constants/settings.constants';
import { themes, type ThemeId } from '@/src/theme/colors';
import { Spacing, Typography } from '@/src/theme';
import { CheckIcon } from 'phosphor-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useLanguageStore, type SupportedLanguage } from '@/src/stores/useLanguageStore';

function ThemeCard({ themeId, isActive }: { themeId: ThemeId; isActive: boolean }) {
  const colors = useTheme();
  const { t } = useTranslation('settings');
  const { setTheme } = useThemeStore();
  const themeColors = themes[themeId];

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isActive ? colors.borderDark : colors.border,
          borderWidth: isActive ? 2 : 1,
        },
      ]}
      onPress={() => setTheme(themeId)}
      activeOpacity={0.75}
      accessibilityRole="radio"
      accessibilityState={{ checked: isActive }}
      accessibilityLabel={`${t(`themes.${themeId}.label`)} theme`}
    >
      {/* Color swatches */}
      <View style={styles.swatches}>
        <View style={[styles.swatch, { backgroundColor: themeColors.background }]} />
        <View style={[styles.swatch, { backgroundColor: themeColors.surface }]} />
        <View style={[styles.swatch, { backgroundColor: themeColors.textPrimary }]} />
        <View style={[styles.swatch, { backgroundColor: themeColors.bubbleUser }]} />
        <View style={[styles.swatch, { backgroundColor: themeColors.sidebarBackground }]} />
      </View>

      {/* Label row */}
      <View style={styles.cardBottom}>
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t(`themes.${themeId}.label`)}</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t(`themes.${themeId}.description`)}</Text>
        </View>
        {isActive && (
          <View style={[styles.checkBadge, { backgroundColor: colors.textPrimary }]}>
            <CheckIcon size={12} color={colors.textInverse} weight="bold" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function SettingsScreen() {
  const colors = useTheme();
  const { t } = useTranslation('settings');
  const { themeId } = useThemeStore();
  const { language, setLanguage } = useLanguageStore();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t('appearance.sectionLabel')}</Text>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('appearance.title')}</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {t('appearance.subtitle')}
        </Text>
      </View>

      <View style={styles.grid}>
        {THEME_IDS.map((id) => (
          <ThemeCard key={id} themeId={id} isActive={themeId === id} />
        ))}
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{t('language.sectionLabel')}</Text>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{t('language.title')}</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {t('language.subtitle')}
        </Text>
      </View>

      <View style={styles.grid}>
        {(['en', 'pt'] as const).map((lang) => (
          <TouchableOpacity
            key={lang}
            style={[
              styles.card,
              {
                backgroundColor: colors.surface,
                borderColor: language === lang ? colors.borderDark : colors.border,
                borderWidth: language === lang ? 2 : 1,
              },
            ]}
            onPress={() => setLanguage(lang)}
            activeOpacity={0.75}
            accessibilityRole="radio"
            accessibilityState={{ checked: language === lang }}
            accessibilityLabel={t(`languages.${lang}.label`)}
          >
            <View style={styles.cardBottom}>
              <View style={styles.cardText}>
                <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{t(`languages.${lang}.label`)}</Text>
                <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{t(`languages.${lang}.description`)}</Text>
              </View>
              {language === lang && (
                <View style={[styles.checkBadge, { backgroundColor: colors.textPrimary }]}>
                  <CheckIcon size={12} color={colors.textInverse} weight="bold" />
                </View>
              )}
            </View>
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
  grid: {
    gap: Spacing[3],
  },
  card: {
    borderRadius: 14,
    padding: Spacing[4],
    gap: Spacing[3],
  },
  swatches: {
    flexDirection: 'row',
    gap: Spacing[2],
  },
  swatch: {
    flex: 1,
    height: 28,
    borderRadius: 6,
  },
  cardBottom: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardText: {
    gap: 2,
  },
  cardTitle: {
    fontSize: Typography.size.base,
    fontFamily: 'Inter_600SemiBold',
  },
  cardDesc: {
    fontSize: Typography.size.sm,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
