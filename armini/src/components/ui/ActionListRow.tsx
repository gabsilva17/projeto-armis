import { Spacing, Typography, useTheme } from '@/src/theme';
import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ActionListRowProps {
  title: string;
  subtitle?: string;
  leading?: ReactNode;
  trailingTopText?: string;
  trailingBottomText?: string;
  onPress: () => void;
  accessibilityLabel: string;
  showArrow?: boolean;
  topBorder?: boolean;
  titleNumberOfLines?: number;
  subtitleNumberOfLines?: number;
}

export function ActionListRow({
  title,
  subtitle,
  leading,
  trailingTopText,
  trailingBottomText,
  onPress,
  accessibilityLabel,
  showArrow = true,
  topBorder = false,
  titleNumberOfLines = 1,
  subtitleNumberOfLines = 1,
}: ActionListRowProps) {
  const colors = useTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.row,
        { borderBottomColor: colors.border },
        topBorder && { borderTopColor: colors.border, borderTopWidth: 1 },
        pressed && { backgroundColor: colors.gray100 },
      ]}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      {leading ? <View style={styles.leading}>{leading}</View> : null}

      <View style={styles.mainBlock}>
        <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={titleNumberOfLines}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: colors.textSecondary }]} numberOfLines={subtitleNumberOfLines}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {(trailingTopText || trailingBottomText) ? (
        <View style={styles.trailingTextBlock}>
          {trailingTopText ? (
            <Text style={[styles.trailingTopText, { color: colors.textPrimary }]} numberOfLines={1}>
              {trailingTopText}
            </Text>
          ) : null}
          {trailingBottomText ? (
            <Text style={[styles.trailingBottomText, { color: colors.textMuted }]} numberOfLines={1}>
              {trailingBottomText}
            </Text>
          ) : null}
        </View>
      ) : null}

      {showArrow ? <Ionicons name="arrow-forward" size={16} color={colors.textPrimary} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
    borderBottomWidth: 1,
  },
  leading: {
    flexShrink: 0,
  },
  mainBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.semibold,
  },
  subtitle: {
    fontSize: Typography.size.sm,
    fontFamily: Typography.fontFamily.regular,
  },
  trailingTextBlock: {
    alignItems: 'flex-end',
    gap: 2,
  },
  trailingTopText: {
    fontSize: Typography.size.base,
    fontFamily: Typography.fontFamily.bold,
  },
  trailingBottomText: {
    fontSize: Typography.size.xs,
    fontFamily: Typography.fontFamily.medium,
  },
});