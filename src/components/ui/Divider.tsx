import { useTheme } from '@/src/theme';
import { View, StyleSheet, ViewProps } from 'react-native';

export function Divider({ style, ...props }: ViewProps) {
  const colors = useTheme();
  return <View style={[styles.divider, { backgroundColor: colors.border }, style]} {...props} />;
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
  },
});
