import { useTheme } from '@/src/theme';
import type { ReactNode } from 'react';
import { StyleSheet, View, type ViewStyle } from 'react-native';

interface CardProps {
  children: ReactNode;
  style?: ViewStyle;
}

export function Card({ children, style }: CardProps) {
  const colors = useTheme();
  return (
    <View style={[styles.card, { borderColor: colors.border, backgroundColor: colors.surface }, style]}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
  },
});
