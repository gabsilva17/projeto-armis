import { useTheme } from '@/src/theme';
import { useThemeStore } from '@/src/stores/useThemeStore';
import { SETTINGS_COPY, SETTINGS_THEME_OPTIONS } from '@/src/constants/settings.constants';
import { themes, type ThemeId } from '@/src/theme/colors';
import { Spacing, Typography } from '@/src/theme';
import { CheckIcon } from 'phosphor-react-native';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

function ThemeCard({ themeId, isActive }: { themeId: ThemeId; isActive: boolean }) {
  const colors = useTheme();
  const { setTheme } = useThemeStore();
  const t = themes[themeId];
  const option = SETTINGS_THEME_OPTIONS.find((o) => o.id === themeId)!;

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
      accessibilityLabel={`${option.label} theme`}
    >
      {/* Color swatches */}
      <View style={styles.swatches}>
        <View style={[styles.swatch, { backgroundColor: t.background }]} />
        <View style={[styles.swatch, { backgroundColor: t.surface }]} />
        <View style={[styles.swatch, { backgroundColor: t.textPrimary }]} />
        <View style={[styles.swatch, { backgroundColor: t.bubbleUser }]} />
        <View style={[styles.swatch, { backgroundColor: t.sidebarBackground }]} />
      </View>

      {/* Label row */}
      <View style={styles.cardBottom}>
        <View style={styles.cardText}>
          <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{option.label}</Text>
          <Text style={[styles.cardDesc, { color: colors.textSecondary }]}>{option.description}</Text>
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
  const { themeId } = useThemeStore();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>{SETTINGS_COPY.sectionLabel}</Text>
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>{SETTINGS_COPY.title}</Text>
        <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
          {SETTINGS_COPY.subtitle}
        </Text>
      </View>

      <View style={styles.grid}>
        {SETTINGS_THEME_OPTIONS.map((option) => (
          <ThemeCard key={option.id} themeId={option.id} isActive={themeId === option.id} />
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
