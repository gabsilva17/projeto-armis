import { Colors, Typography as TypographyTheme } from '@/src/theme';
import { Text, StyleSheet, TextProps } from 'react-native';

export function H1({ style, ...props }: TextProps) {
  return <Text accessibilityRole="header" style={[styles.h1, style]} {...props} />;
}

export function H2({ style, ...props }: TextProps) {
  return <Text accessibilityRole="header" style={[styles.h2, style]} {...props} />;
}

export function Body({ style, ...props }: TextProps) {
  return <Text style={[styles.body, style]} {...props} />;
}

export function Caption({ style, ...props }: TextProps) {
  return <Text style={[styles.caption, style]} {...props} />;
}

export function Label({ style, ...props }: TextProps) {
  return <Text style={[styles.label, style]} {...props} />;
}

export function SectionLabel({ style, ...props }: TextProps) {
  return <Text accessibilityRole="header" style={[styles.sectionLabel, style]} {...props} />;
}

const styles = StyleSheet.create({
  h1: {
    fontSize: TypographyTheme.size['2xl'],
    fontFamily: TypographyTheme.fontFamily.bold,
    color: Colors.textPrimary,
    lineHeight: TypographyTheme.size['2xl'] * TypographyTheme.lineHeight.tight,
  },
  h2: {
    fontSize: TypographyTheme.size.xl,
    fontFamily: TypographyTheme.fontFamily.semibold,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: TypographyTheme.size.base,
    fontFamily: TypographyTheme.fontFamily.regular,
    color: Colors.textPrimary,
    lineHeight: TypographyTheme.size.base * TypographyTheme.lineHeight.normal,
  },
  caption: {
    fontSize: TypographyTheme.size.sm,
    fontFamily: TypographyTheme.fontFamily.regular,
    color: Colors.textSecondary,
  },
  label: {
    fontSize: TypographyTheme.size.sm,
    fontFamily: TypographyTheme.fontFamily.semibold,
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  sectionLabel: {
    fontSize: TypographyTheme.size.xs,
    fontFamily: TypographyTheme.fontFamily.semibold,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
});
